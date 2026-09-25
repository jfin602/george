import { open, opendir, stat } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { relative } from 'node:path';

import {
  GeorgeError,
  assertCanonicalWorkspace,
  cancellationError,
  resolveWorkspacePath,
  type JsonObject,
  type Workspace,
} from '../core/index.ts';
import { ToolRegistry, type ToolDefinition } from './registry.ts';
import { TextFramingScanner, type TextFraming } from './text-framing.ts';

export const READ_ONLY_TOOL_DEFINITIONS = [
  {
    name: 'read_file', description: 'Read bounded text plus the full current-file SHA-256 mutation precondition and, for recognized UTF-8 text, full-file line-ending/final-newline framing evidence.', execution: { effect: 'local_read', replaySafety: 'replay_safe', source: { kind: 'builtin' } },
    inputSchema: { type: 'object', properties: { path: { type: 'string', minLength: 1 } }, required: ['path'], additionalProperties: false },
  },
  {
    name: 'list_directory', description: 'List bounded direct entries in a workspace directory.', execution: { effect: 'local_read', replaySafety: 'replay_safe', source: { kind: 'builtin' } },
    inputSchema: { type: 'object', properties: { path: { type: 'string' } }, additionalProperties: false },
  },
  {
    name: 'search_text', description: 'Search bounded workspace text without executing a shell.', execution: { effect: 'local_read', replaySafety: 'replay_safe', source: { kind: 'builtin' } },
    inputSchema: {
      type: 'object', properties: { query: { type: 'string', minLength: 1 }, path: { type: 'string', minLength: 1 } },
      required: ['query'], additionalProperties: false,
    },
  },
  {
    name: 'git_status', description: 'Read Git status using a fixed read-only command.', execution: { effect: 'local_read', replaySafety: 'replay_safe', source: { kind: 'builtin' } },
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  },
  {
    name: 'git_diff', description: 'Read Git diff using a fixed read-only command.', execution: { effect: 'local_read', replaySafety: 'replay_safe', source: { kind: 'builtin' } },
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  },
] as const satisfies readonly Omit<ToolDefinition, 'execute'>[];

export type ReadOnlyToolCall =
  | Readonly<{ name: 'read_file'; path: string }>
  | Readonly<{ name: 'list_directory'; path?: string }>
  | Readonly<{ name: 'search_text'; query: string; path?: string }>
  | Readonly<{ name: 'git_status' }>
  | Readonly<{ name: 'git_diff' }>;

export type ReadOnlyToolResult =
  | Readonly<{ name: 'read_file'; path: string; text: string; bytes: number; truncated: boolean; sha256: string; textFraming?: TextFraming }>
  | Readonly<{
      name: 'list_directory';
      path: string;
      entries: readonly Readonly<{ name: string; kind: 'file' | 'directory' | 'symlink' | 'other' }>[];
      truncated: boolean;
    }>
  | Readonly<{
      name: 'search_text';
      path: string;
      matches: readonly Readonly<{ path: string; line: number; text: string }>[];
      scannedFiles: number;
      scannedBytes: number;
      truncated: boolean;
    }>
  | GitResult;

export type GitResult = Readonly<{
  name: 'git_status' | 'git_diff';
  stdout: string;
  stderr: string;
  exitCode: number | null;
  stdoutTruncated: boolean;
  stderrTruncated: boolean;
}>;

export type ReadOnlyToolLimits = Readonly<{
  maxReadBytes?: number;
  maxListEntries?: number;
  maxSearchFiles?: number;
  maxSearchBytes?: number;
  maxSearchResults?: number;
  maxGitOutputBytes?: number;
  gitTimeoutMs?: number;
}>;

type Limits = Required<ReadOnlyToolLimits>;

const DEFAULT_LIMITS: Limits = {
  maxReadBytes: 64 * 1024,
  maxListEntries: 256,
  maxSearchFiles: 1_000,
  maxSearchBytes: 1024 * 1024,
  maxSearchResults: 100,
  maxGitOutputBytes: 256 * 1024,
  gitTimeoutMs: 10_000,
};

const MAX_LIMITS: Limits = {
  maxReadBytes: 1024 * 1024,
  maxListEntries: 10_000,
  maxSearchFiles: 10_000,
  maxSearchBytes: 16 * 1024 * 1024,
  maxSearchResults: 1_000,
  maxGitOutputBytes: 1024 * 1024,
  gitTimeoutMs: 30_000,
};

function limits(input: ReadOnlyToolLimits): Limits {
  return Object.fromEntries(Object.entries(DEFAULT_LIMITS).map(([key, fallback]) => {
    const value = input[key as keyof ReadOnlyToolLimits] ?? fallback;
    const maximum = MAX_LIMITS[key as keyof Limits];
    if (!Number.isInteger(value) || value < 1) {
      throw new GeorgeError('configuration', `${key} must be a positive integer.`);
    }
    return [key, Math.min(value, maximum)];
  })) as Limits;
}

async function boundedRead(path: string, maxBytes: number): Promise<{ text: string; bytes: number; truncated: boolean }> {
  const handle = await open(path, 'r');
  try {
    const buffer = Buffer.alloc(maxBytes + 1);
    const { bytesRead } = await handle.read(buffer, 0, buffer.length, 0);
    const bytes = Math.min(bytesRead, maxBytes);
    return { text: buffer.subarray(0, bytes).toString('utf8'), bytes, truncated: bytesRead > maxBytes };
  } finally {
    await handle.close();
  }
}

async function boundedReadWithHash(path: string, maxBytes: number, signal?: AbortSignal): Promise<{ text: string; bytes: number; truncated: boolean; sha256: string; textFraming?: TextFraming }> {
  const handle = await open(path, 'r');
  try {
    const prefix = Buffer.alloc(maxBytes);
    const chunk = Buffer.alloc(64 * 1024);
    const hash = createHash('sha256');
    const framing = new TextFramingScanner();
    let total = 0;
    for (;;) {
      if (signal?.aborted) throw cancellationError(signal);
      const { bytesRead } = await handle.read(chunk, 0, chunk.length, null);
      if (bytesRead === 0) break;
      hash.update(chunk.subarray(0, bytesRead));
      framing.update(chunk.subarray(0, bytesRead));
      if (total < maxBytes) chunk.copy(prefix, total, 0, Math.min(bytesRead, maxBytes - total));
      total += bytesRead;
    }
    const bytes = Math.min(total, maxBytes);
    const textFraming = framing.finish();
    return { text: prefix.subarray(0, bytes).toString('utf8'), bytes, truncated: total > maxBytes, sha256: hash.digest('hex'), ...(textFraming === undefined ? {} : { textFraming }) };
  } finally {
    await handle.close();
  }
}

function relativePath(workspace: Workspace, path: string): string {
  return relative(workspace.root, path) || '.';
}

function resultJson(result: ReadOnlyToolResult): JsonObject {
  return result as unknown as JsonObject;
}

async function runGit(
  workspace: Workspace,
  args: readonly string[],
  outputLimit: number,
  timeoutMs: number,
  signal?: AbortSignal,
): Promise<Omit<GitResult, 'name'>> {
  return new Promise((resolve, reject) => {
    const child = spawn('git', args, { cwd: workspace.root, shell: false, stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout: Buffer<ArrayBufferLike> = Buffer.alloc(0);
    let stderr: Buffer<ArrayBufferLike> = Buffer.alloc(0);
    let stdoutTruncated = false;
    let stderrTruncated = false;
    let timedOut = false;
    const append = (current: Buffer<ArrayBufferLike>, chunk: Buffer<ArrayBufferLike>, mark: (value: boolean) => void): Buffer<ArrayBufferLike> => {
      if (current.length >= outputLimit) {
        mark(true);
        return current;
      }
      const next = Buffer.concat([current, chunk.subarray(0, outputLimit - current.length)]);
      if (next.length < current.length + chunk.length) mark(true);
      return next;
    };
    const timeout = setTimeout(() => { timedOut = true; child.kill(); }, timeoutMs);
    const cancelled = () => child.kill();
    signal?.addEventListener('abort', cancelled, { once: true });
    child.stdout.on('data', (chunk: Buffer) => { stdout = append(stdout, chunk, (value) => { stdoutTruncated = value; }); });
    child.stderr.on('data', (chunk: Buffer) => { stderr = append(stderr, chunk, (value) => { stderrTruncated = value; }); });
    child.on('error', (error) => {
      clearTimeout(timeout);
      signal?.removeEventListener('abort', cancelled);
      reject(signal?.aborted
        ? cancellationError(signal)
        : new GeorgeError('tool', 'Unable to start read-only Git.', { cause: error }));
    });
    child.on('close', (exitCode) => {
      clearTimeout(timeout);
      signal?.removeEventListener('abort', cancelled);
      if (signal?.aborted) return reject(cancellationError(signal));
      if (timedOut) return reject(new GeorgeError('tool', `Read-only Git timed out after ${timeoutMs} ms.`));
      resolve({ stdout: stdout.toString('utf8'), stderr: stderr.toString('utf8'), exitCode, stdoutTruncated, stderrTruncated });
    });
  });
}

export type ReadOnlyToolExecutor = Readonly<{
  workspace: Workspace;
  registry: ToolRegistry;
  definitions: ToolRegistry['definitions'];
  execute: (call: ReadOnlyToolCall, options?: Readonly<{ signal?: AbortSignal }>) => Promise<ReadOnlyToolResult>;
}>;

export function createReadOnlyToolExecutor(
  workspace: Workspace,
  configuredLimits: ReadOnlyToolLimits = {},
): ReadOnlyToolExecutor {
  const bounded = limits(configuredLimits);
  const executeRaw = async (call: ReadOnlyToolCall, options: Readonly<{ signal?: AbortSignal }> = {}): Promise<ReadOnlyToolResult> => {
    if (options.signal?.aborted) throw cancellationError(options.signal);
    await assertCanonicalWorkspace(workspace);
    switch (call.name) {
      case 'read_file': {
        const path = await resolveWorkspacePath(workspace, call.path);
        if (!(await stat(path)).isFile()) throw new GeorgeError('validation', 'Path must name a file.');
        return { name: call.name, path: relativePath(workspace, path), ...await boundedReadWithHash(path, bounded.maxReadBytes, options.signal) };
      }
      case 'list_directory': {
        const path = await resolveWorkspacePath(workspace, call.path === '' ? '.' : call.path ?? '.');
        if (!(await stat(path)).isDirectory()) throw new GeorgeError('validation', 'Path must name a directory.');
        const directory = await opendir(path);
        const entries: Array<{ name: string; kind: 'file' | 'directory' | 'symlink' | 'other' }> = [];
        let truncated = false;
        try {
          for await (const entry of directory) {
            if (entries.length === bounded.maxListEntries) { truncated = true; break; }
            entries.push({
              name: entry.name,
              kind: entry.isFile() ? 'file' : entry.isDirectory() ? 'directory' : entry.isSymbolicLink() ? 'symlink' : 'other',
            });
          }
        } finally {
          await directory.close().catch(() => undefined);
        }
        return { name: call.name, path: relativePath(workspace, path), entries, truncated };
      }
      case 'search_text': {
        if (!call.query) throw new GeorgeError('validation', 'Search query must not be empty.');
        const root = await resolveWorkspacePath(workspace, call.path ?? '.');
        if (!(await stat(root)).isDirectory()) throw new GeorgeError('validation', 'Search path must name a directory.');
        const matches: Array<{ path: string; line: number; text: string }> = [];
        let scannedFiles = 0;
        let scannedBytes = 0;
        let truncated = false;
        const walk = async (directory: string): Promise<void> => {
          const handle = await opendir(directory);
          try {
            for await (const entry of handle) {
              if (truncated) return;
              const path = `${directory}/${entry.name}`;
              if (entry.isSymbolicLink()) continue;
              if (entry.isDirectory()) await walk(path);
              if (!entry.isFile()) continue;
              if (scannedFiles === bounded.maxSearchFiles || scannedBytes === bounded.maxSearchBytes) { truncated = true; return; }
              const available = bounded.maxSearchBytes - scannedBytes;
              const content = await boundedRead(path, available);
              scannedFiles += 1;
              scannedBytes += content.bytes;
              if (content.truncated) truncated = true;
              for (const [index, text] of content.text.split(/\r?\n/).entries()) {
                if (text.includes(call.query)) matches.push({ path: relativePath(workspace, path), line: index + 1, text });
                if (matches.length === bounded.maxSearchResults) { truncated = true; return; }
              }
            }
          } finally {
            await handle.close().catch(() => undefined);
          }
        };
        await walk(root);
        return { name: call.name, path: relativePath(workspace, root), matches, scannedFiles, scannedBytes, truncated };
      }
      case 'git_status':
        return { name: call.name, ...await runGit(workspace, ['status', '--short', '--branch'], bounded.maxGitOutputBytes, bounded.gitTimeoutMs, options.signal) };
      case 'git_diff':
        return { name: call.name, ...await runGit(workspace, ['diff', '--no-ext-diff'], bounded.maxGitOutputBytes, bounded.gitTimeoutMs, options.signal) };
    }
  };
  const registry = new ToolRegistry([
    {
      ...READ_ONLY_TOOL_DEFINITIONS[0],
      execute: async (arguments_, options) => resultJson(await executeRaw({ name: 'read_file', path: arguments_.path as string }, options)),
    },
    {
      ...READ_ONLY_TOOL_DEFINITIONS[1],
      execute: async (arguments_, options) => resultJson(await executeRaw({ name: 'list_directory', ...(typeof arguments_.path === 'string' ? { path: arguments_.path } : {}) }, options)),
    },
    {
      ...READ_ONLY_TOOL_DEFINITIONS[2],
      execute: async (arguments_, options) => resultJson(await executeRaw({ name: 'search_text', query: arguments_.query as string, ...(typeof arguments_.path === 'string' ? { path: arguments_.path } : {}) }, options)),
    },
    {
      ...READ_ONLY_TOOL_DEFINITIONS[3],
      execute: async (_arguments, options) => resultJson(await executeRaw({ name: 'git_status' }, options)),
    },
    {
      ...READ_ONLY_TOOL_DEFINITIONS[4],
      execute: async (_arguments, options) => resultJson(await executeRaw({ name: 'git_diff' }, options)),
    },
  ]);
  const execute = async (call: ReadOnlyToolCall, options: Readonly<{ signal?: AbortSignal }> = {}): Promise<ReadOnlyToolResult> => {
    const { name, ...arguments_ } = call;
    const result = await registry.dispatch({ callId: 'read-only-compatibility', name, arguments: JSON.stringify(arguments_) }, options);
    if (!result.result.ok) throw new GeorgeError(result.result.error.code as GeorgeError['code'], result.result.error.message);
    return result.result.value as ReadOnlyToolResult;
  };
  return { workspace, registry, definitions: registry.definitions, execute };
}
