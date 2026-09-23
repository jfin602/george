import { randomUUID } from 'node:crypto';
import { open, lstat, mkdir, readFile, rename, rm } from 'node:fs/promises';
import { homedir } from 'node:os';
import { basename, isAbsolute, join, resolve } from 'node:path';

import { GeorgeError } from './errors.ts';
import type { ContextProfile } from './config.ts';
import type { ApplicationEvent, ContextDiagnostics, ProviderUsage } from './events.ts';
import type { TranscriptEntry, Session, SessionInterruption } from './session.ts';
import { resolveWorkspaceRoot } from './workspace.ts';

export const DURABLE_SESSION_SCHEMA_VERSION = 1;
export const MAX_DURABLE_SESSION_BYTES = 1024 * 1024;
export const MAX_DURABLE_EVENTS = 2048;
export const MAX_DURABLE_TRANSCRIPT_ENTRIES = 1024;
export const MAX_DURABLE_TEXT_BYTES = 64 * 1024;

type DurableSession = Readonly<{
  schemaVersion: number;
  id: string;
  workspace: string;
  transcript: readonly TranscriptEntry[];
  events: readonly ApplicationEvent[];
}>;

export type SessionStoreOptions = Readonly<{
  root?: string;
  environment?: Readonly<Record<string, string | undefined>>;
  platform?: NodeJS.Platform;
  homeDirectory?: string;
}>;

function invalid(message: string): never {
  throw new GeorgeError('validation', `Invalid durable session: ${message}`);
}

function string(value: unknown, name: string, limit = MAX_DURABLE_TEXT_BYTES): string {
  if (typeof value !== 'string' || value.includes('\0') || Buffer.byteLength(value, 'utf8') > limit) invalid(`${name} must be bounded text.`);
  return value;
}

function identifier(value: unknown, name: string): string {
  const result = string(value, name, 128);
  if (!/^[A-Za-z0-9][A-Za-z0-9_-]*$/.test(result)) invalid(`${name} is unsafe.`);
  return result;
}

function record(value: unknown, name: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) invalid(`${name} must be an object.`);
  return value as Record<string, unknown>;
}

function exactKeys(value: Record<string, unknown>, keys: readonly string[], name: string): void {
  if (Object.keys(value).length !== keys.length || keys.some((key) => !(key in value))) invalid(`${name} has an invalid shape.`);
}

function boundedArray(value: unknown, name: string, limit: number): unknown[] {
  if (!Array.isArray(value) || value.length > limit) invalid(`${name} exceeds its bound.`);
  return value;
}

function canonicalPath(value: unknown, name: string): string {
  const path = string(value, name, MAX_DURABLE_TEXT_BYTES);
  if (!isAbsolute(path) || resolve(path) !== path) invalid(`${name} must be an absolute normalized path.`);
  return path;
}

function sessionFile(root: string, id: string): string {
  return join(root, `${identifier(id, 'session ID')}.json`);
}

export function resolveGeorgeStateRoot(
  environment: Readonly<Record<string, string | undefined>> = process.env,
  platform: NodeJS.Platform = process.platform,
  homeDirectory = homedir(),
): string {
  if (!homeDirectory || homeDirectory.includes('\0')) throw new GeorgeError('configuration', 'Home directory must be a non-empty path without NUL.');
  if (platform === 'linux') return join(environment.XDG_STATE_HOME?.trim() || join(homeDirectory, '.local', 'state'), 'george');
  if (platform === 'darwin') return join(homeDirectory, 'Library', 'Application Support', 'george');
  if (platform === 'win32') return join(environment.LOCALAPPDATA?.trim() || environment.APPDATA?.trim() || join(homeDirectory, 'AppData', 'Local'), 'george');
  return join(homeDirectory, '.local', 'state', 'george');
}

function durableError(error: unknown): never {
  if (error instanceof GeorgeError) throw error;
  throw new GeorgeError('validation', 'Unable to read durable session.', { cause: error });
}

function boundedMessage(value: string): string {
  return Buffer.byteLength(value, 'utf8') <= 4096 ? value : `${Buffer.from(value, 'utf8').subarray(0, 4093).toString('utf8')}...`;
}

function safeError<T extends string>(error: { code: T; message: string }): { code: T; message: string } {
  string(error.code, 'error code', 128);
  return { code: error.code, message: boundedMessage(string(error.message, 'error message')) };
}

function safeArguments(): Record<string, never> {
  return {};
}

/** Drops file bodies, write/patch arguments, environment data, and process output. */
function durableEvent(event: ApplicationEvent): ApplicationEvent | undefined {
  switch (event.type) {
    case 'input.submitted': return undefined; // Completed user input lives only in the canonical transcript.
    case 'provider.text.delta': return undefined; // The clean transcript is authoritative for completed assistant text.
    case 'provider.response.started': return event.responseId === undefined ? { type: event.type } : { type: event.type, responseId: string(event.responseId, 'response ID', 256) };
    case 'provider.response.completed': return event.usage === undefined ? { type: event.type } : { type: event.type, usage: safeUsage(event.usage) };
    case 'provider.tool.call': return { type: event.type, callId: string(event.callId, 'call ID', 256), name: string(event.name, 'tool name', 256), arguments: '{}' };
    case 'provider.error': return { type: event.type, error: safeError(event.error) };
    case 'turn.started': case 'turn.completed': return { type: event.type, turnId: string(event.turnId, 'turn ID', 256) };
    case 'turn.cancelled': case 'turn.failed': return { type: event.type, turnId: string(event.turnId, 'turn ID', 256), error: safeError(event.error) };
    case 'context.assembled': return { type: event.type, turnId: string(event.turnId, 'turn ID', 256), diagnostics: safeDiagnostics(event.diagnostics) };
    case 'tool.requested': return { type: event.type, turnId: string(event.turnId, 'turn ID', 256), callId: string(event.callId, 'call ID', 256), name: string(event.name, 'tool name', 256), arguments: '{}' };
    case 'tool.started': return { type: event.type, turnId: string(event.turnId, 'turn ID', 256), callId: string(event.callId, 'call ID', 256), name: string(event.name, 'tool name', 256) };
    case 'tool.completed': return { type: event.type, turnId: string(event.turnId, 'turn ID', 256), callId: string(event.callId, 'call ID', 256), name: string(event.name, 'tool name', 256), result: { ok: true, value: {} } };
    case 'tool.failed': return { type: event.type, turnId: string(event.turnId, 'turn ID', 256), callId: string(event.callId, 'call ID', 256), name: string(event.name, 'tool name', 256), result: { ok: false, error: safeError(event.result.error) } };
    case 'approval.requested': case 'approval.allowed': case 'approval.denied': return {
      type: event.type, turnId: string(event.turnId, 'turn ID', 256), callId: string(event.callId, 'call ID', 256),
      request: safeApproval(event.request),
    } as ApplicationEvent;
    default: return invalid('event type is invalid.');
  }
}

function safeUsage(usage: ProviderUsage): ProviderUsage {
  const result: { inputTokens?: number; outputTokens?: number } = {};
  for (const key of ['inputTokens', 'outputTokens'] as const) {
    const value = usage[key];
    if (value !== undefined) {
      if (!Number.isInteger(value) || value < 0 || value > 1_000_000_000) invalid(`provider ${key} is invalid.`);
      result[key] = value;
    }
  }
  return result;
}

function safeApproval(request: ApplicationEvent extends never ? never : Extract<ApplicationEvent, { type: 'approval.requested' }>['request']): Extract<ApplicationEvent, { type: 'approval.requested' }>['request'] {
  const safe = { id: string(request.id, 'approval ID', 256), toolName: string(request.toolName, 'approval tool name', 256), risk: request.risk, arguments: safeArguments() } as const;
  if (request.risk !== 'write' && request.risk !== 'process') invalid('approval risk is invalid.');
  if (request.risk === 'write') {
    if (!request.target || request.process || typeof request.target.alreadyDirty !== 'boolean') invalid('write approval has an invalid shape.');
    return { ...safe, target: { path: string(request.target.path, 'approval path', 4096), alreadyDirty: request.target.alreadyDirty } };
  }
  if (request.risk === 'process') {
    if (!request.process || request.target) invalid('process approval has an invalid shape.');
    return {
      ...safe,
      process: {
        executable: string(request.process.executable, 'approval executable', 1024),
        argv: boundedArray(request.process.argv, 'approval argv', 64).map((item) => string(item, 'approval argv item', 8192)),
        cwd: string(request.process.cwd, 'approval cwd', 4096), warning: string(request.process.warning, 'approval warning', 1024),
      },
    };
  }
  return invalid('approval risk is invalid.');
}

function boundedInteger(value: unknown, name: string, maximum = 1_000_000_000): number {
  if (!Number.isInteger(value) || (value as number) < 0 || (value as number) > maximum) invalid(`${name} must be a bounded integer.`);
  return value as number;
}

function safeProfile(value: unknown): ContextProfile {
  const profile = record(value, 'context profile');
  exactKeys(profile, ['id', 'physicalContextTokens', 'preferredWorkingSetTokens', 'softPressureTokens', 'providerInputTokens', 'reservedHeadroomTokens', 'alwaysOnInstructionTokens'], 'context profile');
  const workingSet = record(profile.preferredWorkingSetTokens, 'context working set');
  exactKeys(workingSet, ['min', 'max'], 'context working set');
  const min = boundedInteger(workingSet.min, 'context working set minimum');
  const max = boundedInteger(workingSet.max, 'context working set maximum');
  return {
    id: string(profile.id, 'context profile ID', 256), physicalContextTokens: boundedInteger(profile.physicalContextTokens, 'physical context tokens'),
    preferredWorkingSetTokens: { min, max }, softPressureTokens: boundedInteger(profile.softPressureTokens, 'soft pressure tokens'),
    providerInputTokens: boundedInteger(profile.providerInputTokens, 'provider input tokens'), reservedHeadroomTokens: boundedInteger(profile.reservedHeadroomTokens, 'reserved headroom tokens'),
    alwaysOnInstructionTokens: boundedInteger(profile.alwaysOnInstructionTokens, 'always-on instruction tokens'),
  };
}

function safeDiagnostics(value: ContextDiagnostics): ContextDiagnostics {
  const diagnostics = record(value, 'context diagnostics');
  exactKeys(diagnostics, ['profileId', 'profile', 'estimatedTokens', 'estimator', 'providerInputBudget', 'remainingHeadroom', 'softPressure', 'reservedHeadroom', 'categoryTokens', 'activeSourceIds', 'evidence'], 'context diagnostics');
  const categories = record(diagnostics.categoryTokens, 'context categories');
  const categoryKeys = ['core', 'project', 'tools', 'task', 'skills', 'routed', 'conversation', 'toolResults'] as const;
  exactKeys(categories, categoryKeys, 'context categories');
  const activeSourceIds = boundedArray(diagnostics.activeSourceIds, 'context source IDs', 32).map((id) => string(id, 'context source ID', 1024));
  const evidence = boundedArray(diagnostics.evidence, 'context evidence', 32).map((value) => {
    const item = record(value, 'context evidence item');
    const keys = Object.keys(item);
    if (keys.some((key) => !['id', 'disposition', 'reason', 'duplicateOf'].includes(key)) || !('id' in item) || !('disposition' in item)) invalid('context evidence item has an invalid shape.');
    const disposition = string(item.disposition, 'context disposition', 32);
    if (!['omitted', 'deferred', 'duplicate', 'failed', 'routed'].includes(disposition)) invalid('context disposition is invalid.');
    return {
      id: string(item.id, 'context evidence ID', 1024), disposition: disposition as ContextDiagnostics['evidence'][number]['disposition'],
      ...(item.reason === undefined ? {} : { reason: string(item.reason, 'context evidence reason', 1024) }),
      ...(item.duplicateOf === undefined ? {} : { duplicateOf: string(item.duplicateOf, 'context duplicate ID', 1024) }),
    };
  });
  return {
    profileId: string(diagnostics.profileId, 'context profile ID', 256), profile: safeProfile(diagnostics.profile),
    estimatedTokens: boundedInteger(diagnostics.estimatedTokens, 'estimated context tokens'), estimator: string(diagnostics.estimator, 'context estimator', 256),
    providerInputBudget: boundedInteger(diagnostics.providerInputBudget, 'provider input budget'), remainingHeadroom: boundedInteger(diagnostics.remainingHeadroom, 'remaining context headroom'),
    softPressure: typeof diagnostics.softPressure === 'boolean' ? diagnostics.softPressure : invalid('context soft pressure is invalid.'),
    reservedHeadroom: boundedInteger(diagnostics.reservedHeadroom, 'reserved context headroom'),
    categoryTokens: Object.fromEntries(categoryKeys.map((key) => [key, boundedInteger(categories[key], `context category ${key}`)])) as ContextDiagnostics['categoryTokens'],
    activeSourceIds, evidence,
  };
}

function durableSession(session: Session, workspace: string): DurableSession {
  const transcript = completedTranscript(session.events).map((entry) => {
    if (entry.role !== 'user' && entry.role !== 'assistant') invalid('transcript role is invalid.');
    return { role: entry.role, text: string(entry.text, 'transcript text') } as TranscriptEntry;
  });
  if (transcript.length > MAX_DURABLE_TRANSCRIPT_ENTRIES) invalid('transcript exceeds its bound.');
  if (session.events.length > MAX_DURABLE_EVENTS) invalid('event history exceeds its bound.');
  return { schemaVersion: DURABLE_SESSION_SCHEMA_VERSION, id: identifier(session.id, 'session ID'), workspace, transcript, events: session.events.map(durableEvent).filter((event): event is ApplicationEvent => event !== undefined) };
}

function completedTranscript(events: readonly ApplicationEvent[]): TranscriptEntry[] {
  const result: TranscriptEntry[] = [];
  let current: TranscriptEntry[] = [];
  for (const event of events) {
    if (event.type === 'input.submitted') current = [{ role: 'user', text: event.text }];
    else if (event.type === 'provider.text.delta' && current.length > 0) {
      const previous = current.at(-1);
      if (previous?.role === 'assistant') current[current.length - 1] = { role: 'assistant', text: previous.text + event.delta };
      else current.push({ role: 'assistant', text: event.delta });
    } else if (event.type === 'turn.completed') {
      result.push(...current);
      current = [];
    } else if (event.type === 'turn.cancelled' || event.type === 'turn.failed') current = [];
  }
  return result;
}

function parseTranscript(value: unknown): TranscriptEntry[] {
  return boundedArray(value, 'transcript', MAX_DURABLE_TRANSCRIPT_ENTRIES).map((entry) => {
    const item = record(entry, 'transcript entry');
    exactKeys(item, ['role', 'text'], 'transcript entry');
    const role = string(item.role, 'transcript role', 16);
    if (role !== 'user' && role !== 'assistant') invalid('transcript role is invalid.');
    return { role, text: string(item.text, 'transcript text') };
  });
}

function parseEvents(value: unknown): ApplicationEvent[] {
  return boundedArray(value, 'events', MAX_DURABLE_EVENTS).map((event) => durableEvent(event as ApplicationEvent) ?? invalid('event is not durable evidence.'));
}

function parseDurableSession(value: unknown): DurableSession {
  const item = record(value, 'session');
  exactKeys(item, ['schemaVersion', 'id', 'workspace', 'transcript', 'events'], 'session');
  if (item.schemaVersion !== DURABLE_SESSION_SCHEMA_VERSION) invalid(`unsupported schema version ${String(item.schemaVersion)}.`);
  return {
    schemaVersion: DURABLE_SESSION_SCHEMA_VERSION, id: identifier(item.id, 'session ID'), workspace: canonicalPath(item.workspace, 'workspace'),
    transcript: parseTranscript(item.transcript), events: parseEvents(item.events),
  };
}

export function classifySessionInterruptions(events: readonly ApplicationEvent[]): SessionInterruption[] {
  const tools = new Map<string, Extract<ApplicationEvent, { type: 'tool.requested' | 'tool.started' }>>();
  const approvals = new Map<string, Extract<ApplicationEvent, { type: 'approval.requested' }>>();
  let providerStarted = false;
  for (const event of events) {
    if (event.type === 'provider.response.started') providerStarted = true;
    else if (event.type === 'provider.response.completed' || event.type === 'provider.error') providerStarted = false;
    else if (event.type === 'tool.requested' || event.type === 'tool.started') tools.set(event.callId, event);
    else if (event.type === 'tool.completed' || event.type === 'tool.failed') tools.delete(event.callId);
    else if (event.type === 'approval.requested') approvals.set(event.callId, event);
    else if (event.type === 'approval.allowed' || event.type === 'approval.denied') approvals.delete(event.callId);
  }
  const interruptions: SessionInterruption[] = [];
  for (const event of tools.values()) {
    if (event.name === 'write_file' || event.name === 'apply_patch') interruptions.push({ kind: 'mutation', turnId: event.turnId, callId: event.callId, name: event.name });
    if (event.name === 'run_process') interruptions.push({ kind: 'process', turnId: event.turnId, callId: event.callId, name: event.name });
  }
  for (const event of approvals.values()) interruptions.push({ kind: 'approval', turnId: event.turnId, callId: event.callId, name: event.request.toolName });
  if (providerStarted) interruptions.push({ kind: 'provider-continuation' });
  return interruptions;
}

export class LocalSessionStore {
  readonly root: string;

  constructor(options: SessionStoreOptions = {}) {
    const stateRoot = options.root ?? resolveGeorgeStateRoot(options.environment, options.platform, options.homeDirectory);
    if (!stateRoot || stateRoot.includes('\0')) throw new GeorgeError('configuration', 'George state root must be a non-empty path without NUL.');
    this.root = resolve(stateRoot);
  }

  private async prepareRoot(): Promise<void> {
    await mkdir(this.root, { recursive: true, mode: 0o700 });
    const status = await lstat(this.root);
    if (!status.isDirectory() || status.isSymbolicLink()) throw new GeorgeError('validation', 'George state root must be a real directory.');
  }

  async save(session: Session): Promise<void> {
    const workspace = (await resolveWorkspaceRoot(session.workspace)).root;
    const value = durableSession(session, workspace);
    const content = JSON.stringify(value);
    if (Buffer.byteLength(content, 'utf8') > MAX_DURABLE_SESSION_BYTES) invalid('session exceeds its byte bound.');
    await this.prepareRoot();
    const destination = sessionFile(this.root, value.id);
    const temporary = join(this.root, `.${basename(destination)}.${randomUUID()}.tmp`);
    try {
      const handle = await open(temporary, 'wx', 0o600);
      try {
        await handle.writeFile(content, 'utf8');
        await handle.sync();
      } finally {
        await handle.close();
      }
      await rename(temporary, destination);
    } catch (error) {
      await rm(temporary, { force: true }).catch(() => undefined);
      throw error;
    }
  }

  async open(id: string, workspace: string): Promise<Session> {
    const expectedWorkspace = (await resolveWorkspaceRoot(workspace)).root;
    await this.prepareRoot();
    const path = sessionFile(this.root, id);
    try {
      const status = await lstat(path);
      if (!status.isFile() || status.isSymbolicLink()) invalid('session file must be a regular file.');
      if (status.size > MAX_DURABLE_SESSION_BYTES) invalid('session exceeds its byte bound.');
      const raw = await readFile(path, 'utf8');
      if (Buffer.byteLength(raw, 'utf8') > MAX_DURABLE_SESSION_BYTES) invalid('session exceeds its byte bound.');
      const value = parseDurableSession(JSON.parse(raw));
      if (value.workspace !== expectedWorkspace) invalid('session belongs to a different workspace.');
      return { id: value.id, workspace: value.workspace, transcript: [...value.transcript], events: [...value.events], interruptions: classifySessionInterruptions(value.events) };
    } catch (error) {
      durableError(error);
    }
  }
}
