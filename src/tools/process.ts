import { spawn } from 'node:child_process';
import { readdir, readFile, stat } from 'node:fs/promises';
import { platform } from 'node:os';
import { relative } from 'node:path';

import {
  assertCanonicalWorkspace,
  cancellationError,
  GeorgeError,
  resolveWorkspacePath,
  type JsonObject,
  type Workspace,
} from '../core/index.ts';
import { ToolRegistry, type ToolDefinition } from './registry.ts';

export const PROCESS_TOOL_DEFINITION = {
  name: 'run_process',
  description: 'Run an approval-required bounded process with a literal executable and argument vector. A workspace cwd is not an OS sandbox.',
  permission: 'process',
  inputSchema: {
    type: 'object', properties: {
      executable: { type: 'string', minLength: 1, maxLength: 1024 },
      arguments: { type: 'array', items: { type: 'string', maxLength: 8192 }, maxItems: 64 },
      cwd: { type: 'string', minLength: 1, maxLength: 1024 },
      timeoutMs: { type: 'integer', minimum: 1, maximum: 120_000 },
    }, required: ['executable', 'arguments'], additionalProperties: false,
  },
} as const satisfies Omit<ToolDefinition, 'execute'>;

export type ProcessToolCall = Readonly<{
  name: 'run_process';
  executable: string;
  arguments: readonly string[];
  cwd?: string;
  timeoutMs?: number;
}>;

export type ProcessToolResult = Readonly<{
  name: 'run_process';
  executable: string;
  arguments: readonly string[];
  cwd: string;
  stdout: string;
  stderr: string;
  stdoutTruncated: boolean;
  stderrTruncated: boolean;
  exitCode: number | null;
  signal: string | null;
  outcome: 'completed' | 'failed' | 'timed_out' | 'spawn_failed';
}>;

export type ProcessToolLimits = Readonly<{
  maxOutputBytes?: number;
  defaultTimeoutMs?: number;
  maxTimeoutMs?: number;
  trustedEnvironment?: Readonly<Record<string, string>>;
}>;

type Limits = Readonly<{
  maxOutputBytes: number;
  defaultTimeoutMs: number;
  maxTimeoutMs: number;
  trustedEnvironment: Readonly<Record<string, string>>;
}>;

const DEFAULT_LIMITS = { maxOutputBytes: 256 * 1024, defaultTimeoutMs: 30_000, maxTimeoutMs: 120_000 };
const MAX_LIMITS = { maxOutputBytes: 1024 * 1024, defaultTimeoutMs: 120_000, maxTimeoutMs: 120_000 };
const INHERITED_ENVIRONMENT = ['PATH', 'Path', 'SystemRoot', 'COMSPEC', 'TEMP', 'TMP', 'TMPDIR', 'HOME', 'USERPROFILE', 'LANG', 'LC_ALL', 'LC_CTYPE', 'TERM'] as const;
const KILL_GRACE_MS = 200;

function positive(value: number | undefined, fallback: number, maximum: number, name: string): number {
  const result = value ?? fallback;
  if (!Number.isInteger(result) || result < 1) throw new GeorgeError('configuration', `${name} must be a positive integer.`);
  return Math.min(result, maximum);
}

function limits(configured: ProcessToolLimits): Limits {
  const maxTimeoutMs = positive(configured.maxTimeoutMs, DEFAULT_LIMITS.maxTimeoutMs, MAX_LIMITS.maxTimeoutMs, 'maxTimeoutMs');
  const defaultTimeoutMs = positive(configured.defaultTimeoutMs, DEFAULT_LIMITS.defaultTimeoutMs, Math.min(MAX_LIMITS.defaultTimeoutMs, maxTimeoutMs), 'defaultTimeoutMs');
  const trustedEnvironment = configured.trustedEnvironment ?? {};
  for (const [name, value] of Object.entries(trustedEnvironment)) {
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(name) || value.includes('\0')) throw new GeorgeError('configuration', 'trustedEnvironment contains an invalid environment entry.');
  }
  return {
    maxOutputBytes: positive(configured.maxOutputBytes, DEFAULT_LIMITS.maxOutputBytes, MAX_LIMITS.maxOutputBytes, 'maxOutputBytes'),
    defaultTimeoutMs,
    maxTimeoutMs,
    trustedEnvironment,
  };
}

function childEnvironment(trusted: Readonly<Record<string, string>>): NodeJS.ProcessEnv {
  const environment: NodeJS.ProcessEnv = {};
  for (const name of INHERITED_ENVIRONMENT) {
    const value = process.env[name];
    if (value !== undefined) environment[name] = value;
  }
  return { ...environment, ...trusted };
}

function append(current: Buffer, chunk: Buffer, limit: number): readonly [Buffer, boolean] {
  if (current.length >= limit) return [current, true];
  const value = Buffer.concat([current, chunk.subarray(0, limit - current.length)]);
  return [value, value.length < current.length + chunk.length];
}

async function processCwd(workspace: Workspace, cwd: string): Promise<string> {
  const path = await resolveWorkspacePath(workspace, cwd);
  if (!(await stat(path)).isDirectory()) throw new GeorgeError('validation', 'Process cwd must name a workspace directory.');
  return path;
}

async function wait(milliseconds: number): Promise<void> {
  await new Promise<void>((resolve) => setTimeout(resolve, milliseconds));
}

async function linuxDescendants(pid: number): Promise<number[]> {
  const parents = new Map<number, number[]>();
  const entries = await readdir('/proc', { withFileTypes: true }).catch(() => []);
  await Promise.all(entries.filter((entry) => entry.isDirectory() && /^\d+$/.test(entry.name)).map(async (entry) => {
    const child = Number(entry.name);
    const text = await readFile(`/proc/${child}/stat`, 'utf8').catch(() => '');
    const fields = text.slice(text.lastIndexOf(')') + 2).split(' ');
    const parent = Number(fields[1]);
    if (Number.isInteger(parent)) parents.set(parent, [...(parents.get(parent) ?? []), child]);
  }));
  const result: number[] = [];
  const pending = [...(parents.get(pid) ?? [])];
  while (pending.length) {
    const child = pending.pop()!;
    result.push(child);
    pending.push(...(parents.get(child) ?? []));
  }
  return result;
}

function signalProcesses(pids: readonly number[], signal: NodeJS.Signals): void {
  for (const pid of pids) {
    try { process.kill(pid, signal); } catch { /* It already exited. */ }
  }
}

async function terminateTree(pid: number): Promise<void> {
  if (platform() === 'win32') {
    await new Promise<void>((resolve) => {
      const taskkill = spawn('taskkill', ['/pid', String(pid), '/T', '/F'], { shell: false, stdio: 'ignore', windowsHide: true });
      taskkill.once('error', () => resolve());
      taskkill.once('close', () => resolve());
    });
    return;
  }
  if (platform() === 'linux') signalProcesses([pid], 'SIGSTOP');
  const targets = platform() === 'linux' ? [...await linuxDescendants(pid).catch(() => []), pid] : [pid];
  signalProcesses(targets, 'SIGTERM');
  await wait(KILL_GRACE_MS);
  signalProcesses(targets, 'SIGKILL');
}

export class ProcessCancellationError extends GeorgeError {
  readonly result: Omit<ProcessToolResult, 'outcome'>;

  constructor(result: Omit<ProcessToolResult, 'outcome'>, signal: AbortSignal) {
    super('cancelled', cancellationError(signal)?.message ?? 'Process execution cancelled.');
    this.result = result;
  }
}

export class ProcessSpawnError extends GeorgeError {
  readonly result: ProcessToolResult;

  constructor(result: ProcessToolResult, cause: unknown) {
    super('tool', 'Unable to start process.', { cause });
    this.result = result;
  }
}

export type ProcessToolExecutor = Readonly<{
  workspace: Workspace;
  registry: ToolRegistry;
  definitions: ToolRegistry['definitions'];
  execute: (call: ProcessToolCall, options?: Readonly<{ signal?: AbortSignal }>) => Promise<ProcessToolResult>;
}>;

export function createProcessToolExecutor(workspace: Workspace, configuredLimits: ProcessToolLimits = {}): ProcessToolExecutor {
  const bounded = limits(configuredLimits);
  const executeRaw = async (call: ProcessToolCall, options: Readonly<{ signal?: AbortSignal }> = {}): Promise<ProcessToolResult> => {
    if (options.signal?.aborted) throw cancellationError(options.signal);
    await assertCanonicalWorkspace(workspace);
    const cwd = await processCwd(workspace, call.cwd ?? '.');
    const timeoutMs = Math.min(call.timeoutMs ?? bounded.defaultTimeoutMs, bounded.maxTimeoutMs);
    if (!Number.isInteger(timeoutMs) || timeoutMs < 1) throw new GeorgeError('validation', 'Process timeout must be a positive integer.');

    return new Promise<ProcessToolResult>((resolveResult, reject) => {
      let child;
      try {
        child = spawn(call.executable, call.arguments, {
          cwd,
          env: childEnvironment(bounded.trustedEnvironment),
          shell: false,
          stdio: ['ignore', 'pipe', 'pipe'],
          windowsHide: true,
        });
      } catch (error) {
        reject(new ProcessSpawnError({
          name: 'run_process', executable: call.executable, arguments: call.arguments, cwd: relative(workspace.root, cwd) || '.',
          stdout: '', stderr: '', stdoutTruncated: false, stderrTruncated: false, exitCode: null, signal: null, outcome: 'spawn_failed',
        }, error));
        return;
      }
      let stdout: Buffer<ArrayBufferLike> = Buffer.alloc(0);
      let stderr: Buffer<ArrayBufferLike> = Buffer.alloc(0);
      let stdoutTruncated = false;
      let stderrTruncated = false;
      let timedOut = false;
      let settled = false;
      let termination: Promise<void> | undefined;
      const stop = (): Promise<void> => termination ??= (async () => {
        if (child.pid === undefined) return;
        await terminateTree(child.pid);
      })();
      const timeout = setTimeout(() => { timedOut = true; void stop(); }, timeoutMs);
      const cancelled = () => { void stop(); };
      options.signal?.addEventListener('abort', cancelled, { once: true });
      child.stdout.on('data', (chunk: Buffer) => {
        [stdout, stdoutTruncated] = append(stdout, chunk, bounded.maxOutputBytes);
      });
      child.stderr.on('data', (chunk: Buffer) => {
        [stderr, stderrTruncated] = append(stderr, chunk, bounded.maxOutputBytes);
      });
      const finish = async (exitCode: number | null, signal: NodeJS.Signals | null): Promise<void> => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        options.signal?.removeEventListener('abort', cancelled);
        await termination;
        const result = {
          name: 'run_process' as const, executable: call.executable, arguments: call.arguments, cwd: relative(workspace.root, cwd) || '.',
          stdout: stdout.toString('utf8'), stderr: stderr.toString('utf8'), stdoutTruncated, stderrTruncated, exitCode, signal,
        };
        if (options.signal?.aborted) return reject(new ProcessCancellationError(result, options.signal));
        resolveResult({ ...result, outcome: timedOut ? 'timed_out' : exitCode === 0 ? 'completed' : 'failed' });
      };
      child.on('error', (error) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        options.signal?.removeEventListener('abort', cancelled);
        void Promise.resolve(termination).then(() => reject(options.signal?.aborted
          ? new ProcessCancellationError({ name: 'run_process', executable: call.executable, arguments: call.arguments, cwd: call.cwd ?? '.', stdout: stdout.toString('utf8'), stderr: stderr.toString('utf8'), stdoutTruncated, stderrTruncated, exitCode: null, signal: null }, options.signal)
          : new ProcessSpawnError({ name: 'run_process', executable: call.executable, arguments: call.arguments, cwd: call.cwd ?? '.', stdout: stdout.toString('utf8'), stderr: stderr.toString('utf8'), stdoutTruncated, stderrTruncated, exitCode: null, signal: null, outcome: 'spawn_failed' }, error)));
      });
      child.on('close', (exitCode, signal) => { void finish(exitCode, signal); });
    });
  };
  const registry = new ToolRegistry([{
    ...PROCESS_TOOL_DEFINITION,
    execute: async (arguments_, options) => executeRaw({
      name: 'run_process', executable: arguments_.executable as string, arguments: arguments_.arguments as unknown as readonly string[],
      ...(typeof arguments_.cwd === 'string' ? { cwd: arguments_.cwd } : {}),
      ...(typeof arguments_.timeoutMs === 'number' ? { timeoutMs: arguments_.timeoutMs } : {}),
    }, options) as unknown as JsonObject,
  }]);
  const execute = async (call: ProcessToolCall, options: Readonly<{ signal?: AbortSignal }> = {}): Promise<ProcessToolResult> => {
    const { name, ...arguments_ } = call;
    const validation = registry.validate({ callId: 'process-compatibility', name, arguments: JSON.stringify(arguments_) });
    if ('callId' in validation) {
      if (!validation.result.ok) throw new GeorgeError(validation.result.error.code as GeorgeError['code'], validation.result.error.message);
      throw new GeorgeError('tool', 'Unexpected successful validation result.');
    }
    return executeRaw(call, options);
  };
  return { workspace, registry, definitions: registry.definitions, execute };
}
