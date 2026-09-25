import { createHash, randomUUID } from 'node:crypto';
import { spawn } from 'node:child_process';
import { chmod, open, readFile, rename, rm } from 'node:fs/promises';
import { basename, dirname, relative } from 'node:path';

import {
  assertCanonicalWorkspace,
  cancellationError,
  GeorgeError,
  resolveWorkspaceMutationPath,
  type JsonObject,
  type Workspace,
} from '../core/index.ts';
import { ToolRegistry, type ToolDefinition } from './registry.ts';

const SHA256_HEX = /^[a-f0-9]{64}$/;

export const WORKSPACE_MUTATION_TOOL_DEFINITIONS = [
  {
    name: 'write_file', description: 'Atomically write bounded text to a workspace file.', execution: { effect: 'workspace_mutation', replaySafety: 'not_replay_safe', source: { kind: 'builtin' } },
    inputSchema: {
      type: 'object', properties: {
        path: { type: 'string', minLength: 1 }, content: { type: 'string', maxLength: 1024 * 1024 },
        expectedSha256: { type: 'string', minLength: 64, maxLength: 64 },
      }, required: ['path', 'content'], additionalProperties: false,
    },
  },
  {
    name: 'apply_patch', description: 'Atomically apply bounded, unambiguous exact-text edits to a workspace text file.', execution: { effect: 'workspace_mutation', replaySafety: 'not_replay_safe', source: { kind: 'builtin' } },
    inputSchema: {
      type: 'object', properties: {
        path: { type: 'string', minLength: 1 }, expectedSha256: { type: 'string', minLength: 64, maxLength: 64 },
        edits: {
          type: 'array', minItems: 1, maxItems: 128, items: {
            type: 'object', properties: {
              oldText: { type: 'string', minLength: 1, maxLength: 256 * 1024 },
              newText: { type: 'string', maxLength: 256 * 1024 },
            }, required: ['oldText', 'newText'], additionalProperties: false,
          },
        },
      }, required: ['path', 'expectedSha256', 'edits'], additionalProperties: false,
    },
  },
] as const satisfies readonly Omit<ToolDefinition, 'execute'>[];

export type GitWorkingTreeEntry = Readonly<{ path: string; indexStatus: string; worktreeStatus: string }>;
export type GitWorkingTreeSnapshot = Readonly<{
  isRepository: boolean;
  repositoryRoot: string | null;
  entries: readonly GitWorkingTreeEntry[];
  target?: Readonly<{ path: string; dirty: boolean }>;
}>;

export type MutationToolResult = Readonly<{
  name: 'write_file' | 'apply_patch';
  path: string;
  bytes: number;
  sha256: string;
  git: GitWorkingTreeSnapshot;
}>;

export type MutationToolCall =
  | Readonly<{ name: 'write_file'; path: string; content: string; expectedSha256?: string }>
  | Readonly<{ name: 'apply_patch'; path: string; expectedSha256: string; edits: readonly Readonly<{ oldText: string; newText: string }>[] }>;

export type MutationToolLimits = Readonly<{
  maxContentBytes?: number;
  maxFileBytes?: number;
  maxEdits?: number;
  maxEditBytes?: number;
  maxGitSnapshotBytes?: number;
}>;

type Limits = Required<MutationToolLimits>;

const DEFAULT_LIMITS: Limits = {
  maxContentBytes: 256 * 1024,
  maxFileBytes: 1024 * 1024,
  maxEdits: 64,
  maxEditBytes: 64 * 1024,
  maxGitSnapshotBytes: 1024 * 1024,
};

const MAX_LIMITS: Limits = {
  maxContentBytes: 1024 * 1024,
  maxFileBytes: 4 * 1024 * 1024,
  maxEdits: 128,
  maxEditBytes: 256 * 1024,
  maxGitSnapshotBytes: 4 * 1024 * 1024,
};

function boundedLimits(configured: MutationToolLimits): Limits {
  return Object.fromEntries(Object.entries(DEFAULT_LIMITS).map(([key, fallback]) => {
    const value = configured[key as keyof MutationToolLimits] ?? fallback;
    if (!Number.isInteger(value) || value < 1) throw new GeorgeError('configuration', `${key} must be a positive integer.`);
    return [key, Math.min(value, MAX_LIMITS[key as keyof Limits])];
  })) as Limits;
}

function sha256(content: Buffer | string): string {
  return createHash('sha256').update(content).digest('hex');
}

function assertText(content: string, limit: number, name: string): void {
  if (content.includes('\0') || Buffer.byteLength(content, 'utf8') > limit) {
    throw new GeorgeError('validation', `${name} exceeds its text byte limit or contains NUL.`);
  }
}

function assertHash(expected: string | undefined): asserts expected is string {
  if (!expected || !SHA256_HEX.test(expected)) throw new GeorgeError('validation', 'A lowercase SHA-256 current-content precondition is required.');
}

function assertCurrentHash(content: Buffer, expected: string): void {
  if (sha256(content) !== expected) throw new GeorgeError('validation', 'Current-content precondition does not match.');
}

function assertActive(signal?: AbortSignal): void {
  if (signal?.aborted) throw cancellationError(signal);
}

async function replaceAtomically(path: string, content: string, mode: number | undefined, signal?: AbortSignal): Promise<void> {
  const temporary = `${dirname(path)}/.${basename(path)}.george-${randomUUID()}.tmp`;
  try {
    assertActive(signal);
    const handle = await open(temporary, 'wx', mode ?? 0o600);
    try {
      await handle.writeFile(content, 'utf8');
      if (mode !== undefined) await chmod(temporary, mode);
      await handle.sync();
    } finally {
      await handle.close();
    }
    assertActive(signal);
    await rename(temporary, path);
  } catch (error) {
    await rm(temporary, { force: true }).catch(() => undefined);
    throw error;
  }
}

function exactReplace(content: string, oldText: string, newText: string): string {
  const first = content.indexOf(oldText);
  if (first < 0 || content.indexOf(oldText, first + 1) >= 0) {
    throw new GeorgeError('validation', 'Each patch oldText must match exactly once in edit order.');
  }
  return `${content.slice(0, first)}${newText}${content.slice(first + oldText.length)}`;
}

async function git(args: readonly string[], cwd: string, limit: number, signal?: AbortSignal): Promise<{ code: number | null; stdout: Buffer; stderr: Buffer }> {
  return new Promise((resolve, reject) => {
    const child = spawn('git', args, { cwd, shell: false, stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = Buffer.alloc(0);
    let stderr = Buffer.alloc(0);
    let overflow = false;
    const cancelled = () => child.kill();
    signal?.addEventListener('abort', cancelled, { once: true });
    child.stdout.on('data', (chunk: Buffer) => {
      if (stdout.length + chunk.length > limit) { overflow = true; child.kill(); return; }
      stdout = Buffer.concat([stdout, chunk]);
    });
    child.stderr.on('data', (chunk: Buffer) => {
      if (stderr.length + chunk.length > limit) { overflow = true; child.kill(); return; }
      stderr = Buffer.concat([stderr, chunk]);
    });
    child.on('error', (error) => {
      signal?.removeEventListener('abort', cancelled);
      reject(signal?.aborted ? cancellationError(signal) : new GeorgeError('tool', 'Unable to run read-only Git snapshot.', { cause: error }));
    });
    child.on('close', (code) => {
      signal?.removeEventListener('abort', cancelled);
      if (signal?.aborted) return reject(cancellationError(signal));
      if (overflow) return reject(new GeorgeError('tool', 'Git working-tree snapshot exceeds its byte limit.'));
      resolve({ code, stdout, stderr });
    });
  });
}

/** Captures Git state only; it never invokes a mutating Git command. */
export async function captureGitWorkingTreeSnapshot(
  workspace: Workspace,
  targetPath?: string,
  options: Readonly<{ maxBytes?: number; signal?: AbortSignal }> = {},
): Promise<GitWorkingTreeSnapshot> {
  const limit = options.maxBytes ?? DEFAULT_LIMITS.maxGitSnapshotBytes;
  if (!Number.isInteger(limit) || limit < 1) throw new GeorgeError('configuration', 'maxBytes must be a positive integer.');
  assertActive(options.signal);
  await assertCanonicalWorkspace(workspace);
  const probe = await git(['rev-parse', '--show-toplevel'], workspace.root, limit, options.signal);
  if (probe.code !== 0) {
    if (probe.stderr.toString('utf8').includes('not a git repository')) {
      return { isRepository: false, repositoryRoot: null, entries: [], ...(targetPath ? { target: { path: targetPath, dirty: false } } : {}) };
    }
    throw new GeorgeError('tool', 'Unable to determine Git working-tree state.');
  }
  const repositoryRoot = probe.stdout.toString('utf8').trim();
  const status = await git(['status', '--porcelain=v1', '-z', '--untracked-files=all'], repositoryRoot, limit, options.signal);
  if (status.code !== 0) throw new GeorgeError('tool', 'Unable to capture Git working-tree snapshot.');
  const fields = status.stdout.toString('utf8').split('\0');
  const entries: GitWorkingTreeEntry[] = [];
  for (let index = 0; index < fields.length - 1; index += 1) {
    const field = fields[index]!;
    const indexStatus = field.slice(0, 1);
    const worktreeStatus = field.slice(1, 2);
    const path = field.slice(3);
    entries.push({ path, indexStatus, worktreeStatus });
    if (indexStatus === 'R' || indexStatus === 'C') index += 1;
  }
  const target = targetPath === undefined ? undefined : relative(repositoryRoot, targetPath).split('\\').join('/');
  return {
    isRepository: true,
    repositoryRoot,
    entries,
    ...(targetPath ? { target: { path: target!, dirty: entries.some((entry) => entry.path === target) } } : {}),
  };
}

export type WorkspaceMutationToolExecutor = Readonly<{
  workspace: Workspace;
  registry: ToolRegistry;
  definitions: ToolRegistry['definitions'];
  execute: (call: MutationToolCall, options?: Readonly<{ signal?: AbortSignal }>) => Promise<MutationToolResult>;
}>;

export function createWorkspaceMutationToolExecutor(
  workspace: Workspace,
  configuredLimits: MutationToolLimits = {},
  executorOptions: Readonly<{ captureGit?: boolean }> = {},
): WorkspaceMutationToolExecutor {
  const limits = boundedLimits(configuredLimits);
  const executeRaw = async (call: MutationToolCall, options: Readonly<{ signal?: AbortSignal }> = {}): Promise<MutationToolResult> => {
    assertActive(options.signal);
    const target = await resolveWorkspaceMutationPath(workspace, call.path);
    const gitSnapshot = executorOptions.captureGit === false
      ? { isRepository: false, repositoryRoot: null, entries: [], target: { path: target.relativePath, dirty: false } }
      : await captureGitWorkingTreeSnapshot(workspace, target.path, { maxBytes: limits.maxGitSnapshotBytes, signal: options.signal });
    let next: string;
    if (call.name === 'write_file') {
      assertText(call.content, limits.maxContentBytes, 'content');
      if (Buffer.byteLength(call.content, 'utf8') > limits.maxFileBytes) throw new GeorgeError('validation', 'Resulting file exceeds its byte limit.');
      if (target.exists) {
        assertHash(call.expectedSha256);
        const current = await readFile(target.path);
        if (current.length > limits.maxFileBytes) throw new GeorgeError('validation', 'Current file exceeds its byte limit.');
        assertCurrentHash(current, call.expectedSha256);
      }
      next = call.content;
    } else {
      if (!target.exists) throw new GeorgeError('validation', 'Patch target must already exist.');
      assertHash(call.expectedSha256);
      if (call.edits.length > limits.maxEdits) throw new GeorgeError('validation', 'Patch edit count exceeds its limit.');
      const current = await readFile(target.path);
      if (current.length > limits.maxFileBytes) throw new GeorgeError('validation', 'Current file exceeds its byte limit.');
      assertCurrentHash(current, call.expectedSha256);
      const text = current.toString('utf8');
      if (text.includes('\0') || !Buffer.from(text, 'utf8').equals(current)) throw new GeorgeError('validation', 'Patch target must be a UTF-8 text file.');
      next = text;
      for (const edit of call.edits) {
        if (!edit.oldText) throw new GeorgeError('validation', 'Patch oldText must not be empty.');
        assertText(edit.oldText, limits.maxEditBytes, 'Patch oldText');
        assertText(edit.newText, limits.maxEditBytes, 'Patch newText');
        next = exactReplace(next, edit.oldText, edit.newText);
      }
      if (Buffer.byteLength(next, 'utf8') > limits.maxFileBytes) throw new GeorgeError('validation', 'Resulting file exceeds its byte limit.');
    }
    assertActive(options.signal);
    await replaceAtomically(target.path, next, target.mode, options.signal);
    return { name: call.name, path: target.relativePath, bytes: Buffer.byteLength(next, 'utf8'), sha256: sha256(next), git: gitSnapshot };
  };
  const registry = new ToolRegistry([
    {
      ...WORKSPACE_MUTATION_TOOL_DEFINITIONS[0],
      execute: async (arguments_, options) => executeRaw({ name: 'write_file', path: arguments_.path as string, content: arguments_.content as string, ...(typeof arguments_.expectedSha256 === 'string' ? { expectedSha256: arguments_.expectedSha256 } : {}) }, options) as unknown as JsonObject,
    },
    {
      ...WORKSPACE_MUTATION_TOOL_DEFINITIONS[1],
      execute: async (arguments_, options) => executeRaw({ name: 'apply_patch', path: arguments_.path as string, expectedSha256: arguments_.expectedSha256 as string, edits: arguments_.edits as unknown as readonly Readonly<{ oldText: string; newText: string }>[] }, options) as unknown as JsonObject,
    },
  ]);
  const execute = async (call: MutationToolCall, options: Readonly<{ signal?: AbortSignal }> = {}): Promise<MutationToolResult> => {
    const { name, ...arguments_ } = call;
    const result = await registry.dispatch({ callId: 'workspace-mutation-compatibility', name, arguments: JSON.stringify(arguments_) }, options);
    if (!result.result.ok) throw new GeorgeError(result.result.error.code as GeorgeError['code'], result.result.error.message);
    return result.result.value as MutationToolResult;
  };
  return { workspace, registry, definitions: registry.definitions, execute };
}
