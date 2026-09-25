import { execFile } from 'node:child_process';
import { constants } from 'node:fs';
import { access, lstat, readlink, realpath } from 'node:fs/promises';
import { dirname, isAbsolute, relative } from 'node:path';

import { assertCanonicalWorkspace, GeorgeError, resolveWorkspacePath, type JsonObject, type Workspace } from '../core/index.ts';
import {
  createProcessToolExecutor,
  PROCESS_TOOL_DEFINITION,
  ProcessCancellationError,
  ProcessSpawnError,
  type ProcessToolCall,
  type ProcessToolExecutor,
  type ProcessToolLimits,
  type ProcessToolResult,
} from './process.ts';
import { ToolRegistry } from './registry.ts';

const BWRAP_CANDIDATES = ['/usr/bin/bwrap', '/bin/bwrap'] as const;
const SYSTEM_ROOTS = ['/usr', '/usr/local', '/bin', '/sbin', '/lib', '/lib64'] as const;
const PROBE_TIMEOUT_MS = 2_000;

export type SandboxProcessCapability = Readonly<{
  backend: 'bubblewrap';
  available: boolean;
  executable?: string;
  version?: string;
  reason?: string;
}>;

export type BubblewrapCommand = Readonly<{ executable: string; arguments: readonly string[]; cwd: string }>;

function bounded(value: string, maximum = 512): string {
  const clean = value.replace(/[\u0000-\u001f\u007f]+/g, ' ').trim();
  return Buffer.byteLength(clean, 'utf8') <= maximum ? clean : Buffer.from(clean, 'utf8').subarray(0, maximum).toString('utf8');
}

async function exists(path: string): Promise<boolean> {
  return access(path, constants.R_OK).then(() => true, () => false);
}

async function executable(path: string): Promise<boolean> {
  return access(path, constants.X_OK).then(() => true, () => false);
}

function parents(path: string): string[] {
  const result: string[] = [];
  for (let current = dirname(path); current !== '/'; current = dirname(current)) result.unshift(current);
  return result;
}

function top(path: string): string {
  return `/${path.split('/').filter(Boolean)[0] ?? ''}`;
}

async function runtimeMount(path: string): Promise<string[]> {
  if (!await exists(path)) return [];
  const entry = await lstat(path);
  return entry.isSymbolicLink() ? ['--symlink', await readlink(path), path] : ['--ro-bind', path, path];
}

async function nodeToolchainRoot(): Promise<string> {
  return dirname(dirname(await realpath(process.execPath)));
}

export async function buildBubblewrapCommand(
  workspace: Workspace,
  capability: SandboxProcessCapability,
  call: ProcessToolCall,
  allowNetwork = false,
): Promise<BubblewrapCommand> {
  if (!capability.available || !capability.executable || !isAbsolute(capability.executable)) throw new GeorgeError('configuration', 'Bubblewrap workspace sandbox is unavailable.');
  await assertCanonicalWorkspace(workspace);
  if (workspace.root === '/') throw new GeorgeError('configuration', 'The filesystem root cannot be used as a sandbox workspace.');
  const cwd = await resolveWorkspacePath(workspace, call.cwd ?? '.');
  const toolchain = await nodeToolchainRoot();
  const mounts: string[] = [];
  for (const root of SYSTEM_ROOTS) mounts.push(...await runtimeMount(root));
  const externalToolchain = !toolchain.startsWith('/usr/') && toolchain !== '/usr';
  const destinations = [workspace.root, ...(externalToolchain ? [toolchain] : [])];
  const namespaceRoots = [...new Set(destinations.map(top))].filter((root) => !SYSTEM_ROOTS.some((system) => root === system || system.startsWith(`${root}/`)));
  const isolatedRoot = namespaceRoots.includes('/.george-sandbox') ? '/.george-runtime' : '/.george-sandbox';
  const occupied = new Set([...namespaceRoots, ...SYSTEM_ROOTS.filter((root) => mounts.includes(root))]);
  const directories = [...new Set(destinations.flatMap(parents))].filter((path) => !occupied.has(path));
  const path = `${toolchain}/bin:${workspace.root}/node_modules/.bin:/usr/local/bin:/usr/bin:/bin`;
  const arguments_ = [
    '--die-with-parent', '--new-session', '--unshare-all', ...(allowNetwork ? ['--share-net'] : []),
    ...mounts, '--proc', '/proc', '--dev', '/dev', ...namespaceRoots.flatMap((root) => ['--tmpfs', root]),
    '--tmpfs', isolatedRoot, '--dir', `${isolatedRoot}/home`, '--dir', `${isolatedRoot}/tmp`,
    ...directories.flatMap((directory) => ['--dir', directory]), ...(externalToolchain ? ['--ro-bind', toolchain, toolchain] : []), '--bind', workspace.root, workspace.root,
    ...(allowNetwork ? ['--tmpfs', '/etc', '--ro-bind-try', '/etc/resolv.conf', '/etc/resolv.conf', '--ro-bind-try', '/etc/hosts', '/etc/hosts', '--ro-bind-try', '/etc/nsswitch.conf', '/etc/nsswitch.conf', '--ro-bind-try', '/etc/ssl', '/etc/ssl', '--remount-ro', '/etc'] : []),
    ...namespaceRoots.flatMap((root) => ['--remount-ro', root]), '--remount-ro', '/',
    '--clearenv', '--setenv', 'HOME', `${isolatedRoot}/home`, '--setenv', 'TMPDIR', `${isolatedRoot}/tmp`, '--setenv', 'TMP', `${isolatedRoot}/tmp`, '--setenv', 'TEMP', `${isolatedRoot}/tmp`, '--setenv', 'PATH', path, '--setenv', 'LANG', 'C.UTF-8',
    '--chdir', cwd, '--', call.executable, ...call.arguments,
  ];
  return { executable: capability.executable, arguments: arguments_, cwd: relative(workspace.root, cwd) || '.' };
}

function exec(executable: string, arguments_: readonly string[]): Promise<Readonly<{ stdout: string; stderr: string }>> {
  return new Promise((resolve, reject) => execFile(executable, arguments_, {
    encoding: 'utf8', timeout: PROBE_TIMEOUT_MS, maxBuffer: 4096, env: { PATH: '/usr/bin:/bin' }, windowsHide: true,
  }, (error, stdout, stderr) => error ? reject(Object.assign(error, { stdout, stderr })) : resolve({ stdout, stderr })));
}

export async function detectSandboxProcessCapability(workspace: Workspace): Promise<SandboxProcessCapability> {
  if (process.platform !== 'linux') return { backend: 'bubblewrap', available: false, reason: 'Bubblewrap containment is supported only on Linux.' };
  let found: string | undefined;
  for (const candidate of BWRAP_CANDIDATES) if (await executable(candidate)) { found = await realpath(candidate); break; }
  if (!found) return { backend: 'bubblewrap', available: false, reason: 'No trusted Bubblewrap executable was found.' };
  let version: string | undefined;
  try { version = bounded((await exec(found, ['--version'])).stdout, 128); }
  catch (error) { return { backend: 'bubblewrap', available: false, executable: found, reason: bounded(`Version probe failed: ${error instanceof Error ? error.message : String(error)}`) }; }
  try {
    const probe = await buildBubblewrapCommand(workspace, { backend: 'bubblewrap', available: true, executable: found, version }, { name: 'run_process', executable: process.execPath, arguments: ['-e', 'process.exit(0)'] });
    await exec(probe.executable, probe.arguments);
    return { backend: 'bubblewrap', available: true, executable: found, version };
  } catch (error) {
    const detail = error && typeof error === 'object' && 'stderr' in error ? String(error.stderr) : error instanceof Error ? error.message : String(error);
    return { backend: 'bubblewrap', available: false, executable: found, version, reason: bounded(`Containment probe failed: ${detail}`) };
  }
}

function logicalResult(call: ProcessToolCall, result: ProcessToolResult): ProcessToolResult {
  return { ...result, executable: call.executable, arguments: call.arguments };
}

export type SandboxProcessToolExecutor = ProcessToolExecutor & Readonly<{ capability: SandboxProcessCapability; network: 'isolated' | 'host' }>;

export function createSandboxProcessToolExecutor(
  workspace: Workspace,
  capability: SandboxProcessCapability,
  options: ProcessToolLimits & Readonly<{ allowNetwork?: boolean }> = {},
): SandboxProcessToolExecutor {
  if (!capability.available) throw new GeorgeError('configuration', 'Cannot create an unavailable Bubblewrap executor.');
  const host = createProcessToolExecutor(workspace, options);
  const allowNetwork = options.allowNetwork === true;
  const executeRaw = async (call: ProcessToolCall, executionOptions: Readonly<{ signal?: AbortSignal; input?: string }> = {}): Promise<ProcessToolResult> => {
    const command = await buildBubblewrapCommand(workspace, capability, call, allowNetwork);
    try {
      return logicalResult(call, await host.executeInternal({ ...call, executable: command.executable, arguments: command.arguments, cwd: command.cwd }, executionOptions));
    } catch (error) {
      if (error instanceof ProcessCancellationError) throw new ProcessCancellationError({ ...error.result, executable: call.executable, arguments: call.arguments }, executionOptions.signal!);
      if (error instanceof ProcessSpawnError) throw new ProcessSpawnError(logicalResult(call, error.result), error);
      throw error;
    }
  };
  const definition = {
    ...PROCESS_TOOL_DEFINITION,
    description: 'Run a bounded process inside the Linux Bubblewrap workspace sandbox with a literal executable and argument vector.',
    execution: {
      effect: 'sandboxed_workspace_process' as const, replaySafety: 'not_replay_safe' as const, source: { kind: 'builtin' as const },
      descriptor: { service: 'Bubblewrap', operation: allowNetwork ? 'workspace process with approved host network' : 'workspace process with isolated network', warning: allowNetwork ? 'Host networking is shared for this approved call.' : 'Network is isolated.' },
    },
    execute: async (arguments_: JsonObject, executionOptions: Readonly<{ signal?: AbortSignal; input?: string }>) => executeRaw({
      name: 'run_process', executable: arguments_.executable as string, arguments: arguments_.arguments as unknown as readonly string[],
      ...(typeof arguments_.cwd === 'string' ? { cwd: arguments_.cwd } : {}), ...(typeof arguments_.timeoutMs === 'number' ? { timeoutMs: arguments_.timeoutMs } : {}),
    }, executionOptions) as unknown as JsonObject,
  };
  const registry = new ToolRegistry([definition]);
  return { workspace, registry, definitions: registry.definitions, execute: executeRaw, executeInternal: executeRaw, capability, network: allowNetwork ? 'host' : 'isolated' };
}
