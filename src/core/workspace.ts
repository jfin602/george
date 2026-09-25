import { lstat, open, realpath, stat } from 'node:fs/promises';
import { basename, dirname, isAbsolute, relative, resolve, sep } from 'node:path';

import { GeorgeError } from './errors.ts';

export const DEFAULT_INSTRUCTION_BYTES = 32 * 1024;

export type Workspace = Readonly<{ root: string }>;

export type WorkspaceMutationPath = Readonly<{
  path: string;
  relativePath: string;
  exists: boolean;
  mode?: number;
}>;

/** A one-call capability target. It deliberately is not a Workspace. */
export type OutsideFilesystemPath = Readonly<{ path: string; parent: string; name: string; exists: boolean; mode?: number }>;

export type RepositoryInstruction = Readonly<{
  path: 'BOOT.md' | 'AGENTS.md';
  text: string;
  truncated: boolean;
}>;

export type RepositoryInstructions = Readonly<{
  instructions: readonly RepositoryInstruction[];
  bytes: number;
  truncated: boolean;
}>;

function validationError(message: string): GeorgeError {
  return new GeorgeError('validation', message);
}

function validateLimit(limit: number): void {
  if (!Number.isInteger(limit) || limit < 1) throw validationError('Byte limit must be a positive integer.');
}

export async function resolveWorkspaceRoot(value: string): Promise<Workspace> {
  if (!value || value.includes('\0')) throw validationError('Workspace path must be a non-empty path without NUL.');
  let root: string;
  try {
    root = await realpath(resolve(value));
  } catch (error) {
    throw new GeorgeError('validation', 'Workspace root must exist.', { cause: error });
  }
  if (!(await stat(root)).isDirectory()) throw validationError('Workspace root must be a directory.');
  return { root };
}

export async function assertCanonicalWorkspace(workspace: Workspace): Promise<void> {
  const root = await realpath(workspace.root).catch((error) => {
    throw new GeorgeError('validation', 'Workspace root must exist.', { cause: error });
  });
  if (root !== workspace.root || !(await stat(root)).isDirectory()) {
    throw validationError('Workspace root must be a canonical directory.');
  }
}

export function rejectWorkspaceEscape(workspace: Workspace, path: string): string {
  if (!path || path.includes('\0') || isAbsolute(path)) {
    throw validationError('Workspace paths must be non-empty relative paths.');
  }
  if (path.split(/[\\/]/).includes('..')) {
    throw validationError('Workspace paths must not traverse parents.');
  }
  const candidate = resolve(workspace.root, path);
  const outside = relative(workspace.root, candidate);
  if (outside === '..' || outside.startsWith(`..${sep}`) || isAbsolute(outside)) {
    throw validationError('Path escapes the workspace.');
  }
  return candidate;
}

export async function resolveWorkspacePath(workspace: Workspace, path: string): Promise<string> {
  await assertCanonicalWorkspace(workspace);
  const candidate = rejectWorkspaceEscape(workspace, path);
  let resolved: string;
  try {
    resolved = await realpath(candidate);
  } catch (error) {
    throw new GeorgeError('validation', 'Workspace path must exist.', { cause: error });
  }
  const outside = relative(workspace.root, resolved);
  if (outside === '..' || outside.startsWith(`..${sep}`) || isAbsolute(outside)) {
    throw validationError('Resolved path escapes the workspace.');
  }
  return resolved;
}

/** Resolves a file target even when its final path does not exist. */
export async function resolveWorkspaceMutationPath(workspace: Workspace, path: string): Promise<WorkspaceMutationPath> {
  await assertCanonicalWorkspace(workspace);
  if (/[\\/]$/.test(path)) throw validationError('Workspace mutation path must name a file.');
  const candidate = rejectWorkspaceEscape(workspace, path);
  const target = await lstat(candidate).catch((error: NodeJS.ErrnoException) => {
    if (error.code === 'ENOENT') return undefined;
    throw new GeorgeError('validation', 'Unable to inspect workspace mutation path.', { cause: error });
  });
  if (target?.isDirectory()) throw validationError('Path must not name a directory.');
  if (target?.isSymbolicLink()) throw validationError('Path must not name a symbolic link.');
  if (target && !target.isFile()) throw validationError('Path must name a regular file.');

  let parent: string;
  try {
    parent = await realpath(dirname(candidate));
  } catch (error) {
    throw new GeorgeError('validation', 'Workspace mutation parent must exist.', { cause: error });
  }
  const outside = relative(workspace.root, parent);
  if (outside === '..' || outside.startsWith(`..${sep}`) || isAbsolute(outside) || !(await stat(parent)).isDirectory()) {
    throw validationError('Workspace mutation parent escapes the workspace.');
  }
  const name = basename(candidate);
  if (!name || name === '.') throw validationError('Path must name a file.');
  return { path: resolve(parent, name), relativePath: relative(workspace.root, resolve(parent, name)), exists: Boolean(target), ...(target ? { mode: target.mode & 0o777 } : {}) };
}

/** Resolves an absolute outside target without teaching workspace resolvers about it. */
export async function resolveOutsideFilesystemPath(path: string, mutation = false): Promise<OutsideFilesystemPath> {
  if (!path || path.includes('\0') || !isAbsolute(path) || path.split(/[\\/]/).includes('..')) throw validationError('Outside filesystem paths must be absolute, non-traversing paths without NUL.');
  const candidate = resolve(path);
  const rawParent = dirname(candidate);
  let parent: string;
  try { parent = await realpath(rawParent); }
  catch (error) { throw new GeorgeError('validation', 'Outside filesystem parent must exist.', { cause: error }); }
  if (parent !== rawParent || !(await stat(parent)).isDirectory()) throw validationError('Outside filesystem path has an ambiguous parent.');
  const name = basename(candidate);
  if (!name || name === '.') throw validationError('Outside filesystem path must name a target.');
  const target = await lstat(candidate).catch((error: NodeJS.ErrnoException) => {
    if (error.code === 'ENOENT') return undefined;
    throw new GeorgeError('validation', 'Unable to inspect outside filesystem path.', { cause: error });
  });
  if (target?.isSymbolicLink()) throw validationError('Outside filesystem path must not name a symbolic link.');
  if (mutation && (target?.isDirectory() || (target && !target.isFile()))) throw validationError('Outside mutation target must name a regular file.');
  if (target && !target.isDirectory() && !target.isFile()) throw validationError('Outside filesystem path must name a regular file or directory.');
  return { path: candidate, parent, name, exists: Boolean(target), ...(target ? { mode: target.mode & 0o777 } : {}) };
}

async function readBounded(path: string, maxBytes: number): Promise<{ text: string; bytes: number; truncated: boolean }> {
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

export async function loadRepositoryInstructions(
  workspace: Workspace,
  maxBytes = DEFAULT_INSTRUCTION_BYTES,
): Promise<RepositoryInstructions> {
  validateLimit(maxBytes);
  const instructions: RepositoryInstruction[] = [];
  let bytes = 0;
  let truncated = false;
  for (const path of ['BOOT.md', 'AGENTS.md'] as const) {
    if (bytes === maxBytes) {
      truncated = true;
      break;
    }
    try {
      const file = await resolveWorkspacePath(workspace, path);
      const content = await readBounded(file, maxBytes - bytes);
      instructions.push({ path, text: content.text, truncated: content.truncated });
      bytes += content.bytes;
      truncated ||= content.truncated;
    } catch (error) {
      if (error instanceof GeorgeError && error.message === 'Workspace path must exist.') continue;
      throw error;
    }
  }
  return { instructions, bytes, truncated };
}
