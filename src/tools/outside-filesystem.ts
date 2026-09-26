import { createReadOnlyToolExecutor, type ReadOnlyToolLimits } from './read-only.ts';
import { createWorkspaceMutationToolExecutor } from './mutation.ts';
import { isAbsolute } from 'node:path';
import { resolveOutsideFilesystemPath, type JsonObject, type Workspace } from '../core/index.ts';
import type { ToolCall, ToolResult } from './registry.ts';

export type OutsideFilesystemCapability = Readonly<{ path: string; mutation: boolean; workspace: Workspace; rewrittenPath: string }>;

/** Builds a bounded, one-call filesystem capability. It never changes the canonical workspace. */
export async function resolveOutsideFilesystemCapability(call: ToolCall, mutation: boolean): Promise<OutsideFilesystemCapability | undefined> {
  let arguments_: unknown;
  try { arguments_ = JSON.parse(call.arguments); } catch { return undefined; }
  if (!arguments_ || typeof arguments_ !== 'object' || Array.isArray(arguments_)) return undefined;
  const path = (arguments_ as Record<string, unknown>).path;
  if (typeof path !== 'string' || !isAbsolute(path)) return undefined;
  if (call.name === 'create_directory') return undefined; // No outside-workspace directory capability exists.
  const target = await resolveOutsideFilesystemPath(path, mutation);
  const directoryTool = call.name === 'list_directory' || call.name === 'search_text';
  return directoryTool
    ? { path: target.path, mutation, workspace: { root: target.path }, rewrittenPath: '.' }
    : { path: target.path, mutation, workspace: { root: target.parent }, rewrittenPath: target.name };
}

export async function dispatchOutsideFilesystemCapability(
  capability: OutsideFilesystemCapability,
  call: ToolCall,
  options: Readonly<{ signal?: AbortSignal; input?: string }> = {},
  limits: ReadOnlyToolLimits = {},
): Promise<ToolResult> {
  const arguments_ = JSON.parse(call.arguments) as JsonObject;
  const rewritten = { ...arguments_, path: capability.rewrittenPath };
  const registry = capability.mutation
    ? createWorkspaceMutationToolExecutor(capability.workspace, {}, { captureGit: false }).registry
    : createReadOnlyToolExecutor(capability.workspace, limits).registry;
  return registry.dispatch({ ...call, arguments: JSON.stringify(rewritten) }, options);
}
