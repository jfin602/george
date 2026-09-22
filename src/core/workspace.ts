import { open, realpath, stat } from 'node:fs/promises';
import { isAbsolute, relative, resolve, sep } from 'node:path';

import { GeorgeError } from './errors.ts';

export const DEFAULT_INSTRUCTION_BYTES = 32 * 1024;

export type Workspace = Readonly<{ root: string }>;

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
