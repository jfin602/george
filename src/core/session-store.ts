import { createHash, randomUUID } from 'node:crypto';
import { open, lstat, mkdir, readFile, rename, rm } from 'node:fs/promises';
import { homedir } from 'node:os';
import { basename, isAbsolute, join, resolve } from 'node:path';

import { GeorgeError } from './errors.ts';
import { TEXT_FRAMING_CHANGE_WARNING } from './approval.ts';
import type { ContextProfile } from './config.ts';
import type { ApplicationEvent, ContextCheckpointEvidence, ContextDiagnostics, ProviderUsage } from './events.ts';
import type { RunBudgetDimension, RunBudgetSnapshot } from './run-budget.ts';
import type { ToolExecutionMetadata } from './execution.ts';
import type { TranscriptEntry, Session, SessionInterruption } from './session.ts';
import { resolveWorkspaceRoot } from './workspace.ts';
import { TASK_STATE_SCHEMA_VERSION, parseSerializedTaskDefinition, serializeTaskDefinition, taskDefinitionFingerprint, type TaskState, type TaskValidationAttempt } from '../tasks/state.ts';
import { STACK_STATE_SCHEMA_VERSION, restoreStackState, type StackState } from '../tasks/stack-state.ts';

export const DURABLE_SESSION_SCHEMA_VERSION = 3;
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
  taskState?: TaskState;
  stackState?: StackState;
}>;

type DurableTaskState = Readonly<Omit<TaskState, 'definition'> & { definition: string }>;
type DurableStackState = Readonly<Omit<StackState, 'tasks'> & { tasks: readonly Readonly<Omit<StackState['tasks'][number], 'taskState'> & { taskState: DurableTaskState }>[] }>;
type SerializedDurableSession = Readonly<Omit<DurableSession, 'taskState' | 'stackState'> & { taskState?: DurableTaskState; stackState?: DurableStackState }>;

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

function safeHookOrigin(value: unknown): Readonly<{ hookId: string }> {
  const origin = record(value, 'hook origin');
  exactKeys(origin, ['hookId'], 'hook origin');
  return { hookId: identifier(origin.hookId, 'hook ID') };
}

function safeExecution(value: ToolExecutionMetadata): ToolExecutionMetadata {
  const execution = record(value, 'tool execution');
  exactKeys(execution, ['effect', 'replaySafety', 'source', ...(execution.descriptor === undefined ? [] : ['descriptor'])], 'tool execution');
  const effect = oneOf(execution.effect, 'tool effect', ['local_read', 'workspace_mutation', 'sandboxed_workspace_process', 'host_process', 'external_read', 'remote_mutation', 'browser_observation', 'browser_interaction', 'unknown_external']);
  const replaySafety = oneOf(execution.replaySafety, 'tool replay safety', ['replay_safe', 'not_replay_safe']);
  const source = record(execution.source, 'tool source');
  const kind = oneOf(source.kind, 'tool source kind', ['builtin', 'plugin', 'adapter']);
  if (kind === 'builtin') exactKeys(source, ['kind'], 'builtin tool source');
  else if (kind === 'plugin') exactKeys(source, ['kind', 'id'], 'plugin tool source');
  else if (source.server === undefined) exactKeys(source, ['kind', 'id'], 'adapter tool source');
  else exactKeys(source, ['kind', 'id', 'server'], 'adapter tool source');
  const safeSource = kind === 'builtin' ? { kind } as const : kind === 'plugin'
    ? { kind, id: identifier(source.id, 'plugin source ID') } as const
    : { kind, id: identifier(source.id, 'adapter source ID'), ...(source.server === undefined ? {} : { server: identifier(source.server, 'adapter server ID') }) } as const;
  if (execution.descriptor === undefined) return { effect, replaySafety, source: safeSource };
  const descriptor = record(execution.descriptor, 'tool execution descriptor');
  if (Object.keys(descriptor).some((key) => !['service', 'origin', 'resource', 'operation', 'warning', 'credentialConfigured'].includes(key))) invalid('tool execution descriptor has an invalid shape.');
  const text = (key: 'service' | 'origin' | 'resource' | 'operation' | 'warning', maximum = 512) => descriptor[key] === undefined ? undefined : boundedMessage(string(descriptor[key], `tool ${key}`, maximum));
  return { effect, replaySafety, source: safeSource, descriptor: {
    ...(text('service', 256) === undefined ? {} : { service: text('service', 256)! }),
    ...(text('origin') === undefined ? {} : { origin: text('origin')! }),
    ...(text('resource') === undefined ? {} : { resource: text('resource')! }),
    ...(text('operation', 256) === undefined ? {} : { operation: text('operation', 256)! }),
    ...(text('warning', 512) === undefined ? {} : { warning: text('warning', 512)! }),
    ...(descriptor.credentialConfigured === undefined ? {} : { credentialConfigured: typeof descriptor.credentialConfigured === 'boolean' ? descriptor.credentialConfigured : invalid('tool credential state is invalid.') }),
  } };
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

function boolean(value: unknown, name: string): boolean {
  return typeof value === 'boolean' ? value : invalid(`${name} is invalid.`);
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

function safeWorkDetails(value: unknown): Extract<ApplicationEvent, { type: 'work.updated' }>['item']['details'] {
  const details = record(value, 'work details');
  const allowed = ['path', 'query', 'count', 'bytes', 'scannedFiles', 'scannedBytes', 'executable', 'argv', 'cwd', 'timeoutMs', 'exitCode', 'signal', 'outcome', 'truncated', 'error', 'requestedArguments', 'timing'];
  if (Object.keys(details).some((key) => !allowed.includes(key))) invalid('work details has an invalid shape.');
  const integer = (key: string): number | undefined => details[key] === undefined ? undefined : boundedInteger(details[key], `work ${key}`);
  const maybeString = (key: string, limit = 4096): string | undefined => details[key] === undefined ? undefined : boundedMessage(string(details[key], `work ${key}`, limit));
  const outcome = details.outcome === undefined ? undefined : string(details.outcome, 'work outcome', 32);
  if (outcome !== undefined && !['completed', 'failed', 'timed_out', 'spawn_failed'].includes(outcome)) invalid('work outcome is invalid.');
  const exitCode = details.exitCode;
  if (exitCode !== undefined && exitCode !== null && (!Number.isInteger(exitCode) || (exitCode as number) < -1_000_000 || (exitCode as number) > 1_000_000)) invalid('work exit code is invalid.');
  if (details.truncated !== undefined && typeof details.truncated !== 'boolean') invalid('work truncation is invalid.');
  const timing = details.timing === undefined ? undefined : safeWorkflowTiming(details.timing);
  return {
    ...(maybeString('path') === undefined ? {} : { path: maybeString('path') }), ...(maybeString('query') === undefined ? {} : { query: maybeString('query') }),
    ...(integer('count') === undefined ? {} : { count: integer('count') }), ...(integer('bytes') === undefined ? {} : { bytes: integer('bytes') }),
    ...(integer('scannedFiles') === undefined ? {} : { scannedFiles: integer('scannedFiles') }), ...(integer('scannedBytes') === undefined ? {} : { scannedBytes: integer('scannedBytes') }),
    ...(maybeString('executable', 1024) === undefined ? {} : { executable: maybeString('executable', 1024) }),
    ...(details.argv === undefined ? {} : { argv: boundedArray(details.argv, 'work argv', 64).map((item) => boundedMessage(string(item, 'work argv item', 8192))) }),
    ...(maybeString('cwd') === undefined ? {} : { cwd: maybeString('cwd') }), ...(integer('timeoutMs') === undefined ? {} : { timeoutMs: integer('timeoutMs') }), ...(exitCode === undefined ? {} : { exitCode: exitCode as number | null }),
    ...(details.signal === undefined ? {} : { signal: details.signal === null ? null : maybeString('signal', 128)! }), ...(outcome === undefined ? {} : { outcome: outcome as 'completed' | 'failed' | 'timed_out' | 'spawn_failed' }),
    ...(details.truncated === undefined ? {} : { truncated: details.truncated as boolean }), ...(maybeString('error') === undefined ? {} : { error: maybeString('error') }),
    ...(maybeString('requestedArguments', 480) === undefined ? {} : { requestedArguments: maybeString('requestedArguments', 480) }),
    ...(timing === undefined ? {} : { timing }),
  };
}

function safeWorkItem(value: unknown): Extract<ApplicationEvent, { type: 'work.updated' }>['item'] {
  const item = record(value, 'work item');
  exactKeys(item, ['id', 'turnId', 'operationId', 'category', 'status', 'summary', 'details', ...(item.elapsedMs === undefined ? [] : ['elapsedMs'])], 'work item');
  const category = string(item.category, 'work category', 32);
  const status = string(item.status, 'work status', 32);
  if (!['context', 'inspection', 'editing', 'approval', 'process', 'validation', 'recovery', 'completion'].includes(category)) invalid('work category is invalid.');
  if (!['requested', 'running', 'waiting', 'succeeded', 'missing', 'skipped', 'failed', 'denied', 'cancelled', 'interrupted'].includes(status)) invalid('work status is invalid.');
  const elapsedMs = item.elapsedMs === undefined ? undefined : boundedInteger(item.elapsedMs, 'work elapsed time');
  return { id: string(item.id, 'work ID', 512), turnId: string(item.turnId, 'work turn ID', 256), operationId: string(item.operationId, 'work operation ID', 512), category: category as Extract<ApplicationEvent, { type: 'work.updated' }>['item']['category'], status: status as Extract<ApplicationEvent, { type: 'work.updated' }>['item']['status'], summary: boundedMessage(string(item.summary, 'work summary', 4096)), details: safeWorkDetails(item.details), ...(elapsedMs === undefined ? {} : { elapsedMs }) };
}

function safeWorkflowTiming(value: unknown): NonNullable<Extract<ApplicationEvent, { type: 'workflow.completed' }>['completion']['timing']> {
  const timing = record(value, 'workflow timing');
  exactKeys(timing, ['totalMs', 'providerMs', 'toolMs', 'approvalMs', 'otherMs'], 'workflow timing');
  const totalMs = boundedInteger(timing.totalMs, 'workflow total time');
  const providerMs = boundedInteger(timing.providerMs, 'workflow provider time');
  const toolMs = boundedInteger(timing.toolMs, 'workflow tool time');
  const approvalMs = boundedInteger(timing.approvalMs, 'workflow approval time');
  const otherMs = boundedInteger(timing.otherMs, 'workflow other time');
  if (providerMs + toolMs + approvalMs + otherMs > totalMs + 2) invalid('workflow timing exceeds total time.');
  return { totalMs, providerMs, toolMs, approvalMs, otherMs };
}

function oneOf<T extends string>(value: unknown, name: string, values: readonly T[]): T {
  const result = string(value, name, 32);
  if (!values.includes(result as T)) invalid(`${name} is invalid.`);
  return result as T;
}

function safeWorkflowCompletion(value: Extract<ApplicationEvent, { type: 'workflow.completed' }>['completion']): Extract<ApplicationEvent, { type: 'workflow.completed' }>['completion'] {
  const completion = record(value, 'workflow completion');
  exactKeys(completion, ['baselineAvailable', 'finalStateAvailable', 'changes', 'directMutations', 'validations', 'warnings', 'terminalState', 'finalAssistantResponse', ...(completion.timing === undefined ? [] : ['timing'])], 'workflow completion');
  const bool = (item: unknown, name: string): boolean => typeof item === 'boolean' ? item : invalid(`${name} is invalid.`);
  const changes = boundedArray(completion.changes, 'workflow changes', 1024).map((item) => {
    const change = record(item, 'workflow change');
    exactKeys(change, ['path', 'relationship', 'directGeorgeMutation'], 'workflow change');
    const relationship = string(change.relationship, 'workflow change relationship', 32);
    if (!['pre-existing', 'newly-observed', 'no-longer-observed'].includes(relationship)) invalid('workflow change relationship is invalid.');
    return { path: string(change.path, 'workflow change path', 4096), relationship: relationship as 'pre-existing' | 'newly-observed' | 'no-longer-observed', directGeorgeMutation: bool(change.directGeorgeMutation, 'workflow direct mutation') };
  });
  const directMutations = boundedArray(completion.directMutations, 'workflow direct mutations', 1024).map((item) => {
    const mutation = record(item, 'workflow direct mutation');
    exactKeys(mutation, ['tool', 'path', 'bytes', 'sha256'], 'workflow direct mutation');
    const tool = string(mutation.tool, 'workflow mutation tool', 32);
    if (tool !== 'write_file' && tool !== 'apply_patch') invalid('workflow mutation tool is invalid.');
    return { tool, path: string(mutation.path, 'workflow mutation path', 4096), bytes: boundedInteger(mutation.bytes, 'workflow mutation bytes'), sha256: string(mutation.sha256, 'workflow mutation hash', 128) } as Extract<ApplicationEvent, { type: 'workflow.completed' }>['completion']['directMutations'][number];
  });
  const validations = boundedArray(completion.validations, 'workflow validations', 128).map((item) => {
    const validation = record(item, 'workflow validation');
    const allowed = ['callId', 'label', 'intent', 'executable', 'arguments', 'cwd', 'status', 'exitCode', 'signal', 'outcome', 'stdout', 'stderr', 'stdoutTruncated', 'stderrTruncated', 'error'];
    if (Object.keys(validation).some((key) => !allowed.includes(key)) || allowed.filter((key) => !['outcome', 'error'].includes(key)).some((key) => !(key in validation))) invalid('workflow validation has an invalid shape.');
    const status = string(validation.status, 'workflow validation status', 32);
    if (!['passed', 'failed', 'denied', 'cancelled'].includes(status)) invalid('workflow validation status is invalid.');
    const outcome = validation.outcome === undefined ? undefined : string(validation.outcome, 'workflow validation outcome', 32);
    if (outcome !== undefined && !['completed', 'failed', 'timed_out', 'spawn_failed'].includes(outcome)) invalid('workflow validation outcome is invalid.');
    const exitCode = validation.exitCode;
    if (exitCode !== null && (typeof exitCode !== 'number' || !Number.isInteger(exitCode) || exitCode < -1_000_000 || exitCode > 1_000_000)) invalid('workflow validation exit code is invalid.');
    const error = validation.error === undefined ? undefined : safeError(record(validation.error, 'workflow validation error') as { code: string; message: string });
    return {
      callId: string(validation.callId, 'workflow validation call ID', 256), label: string(validation.label, 'workflow validation label', 1024), intent: string(validation.intent, 'workflow validation intent', 4096), executable: string(validation.executable, 'workflow validation executable', 1024),
      arguments: boundedArray(validation.arguments, 'workflow validation argv', 64).map((argument) => string(argument, 'workflow validation argv item', 8192)), cwd: string(validation.cwd, 'workflow validation cwd', 4096),
      status: status as 'passed' | 'failed' | 'denied' | 'cancelled', exitCode, signal: validation.signal === null ? null : string(validation.signal, 'workflow validation signal', 128),
      ...(outcome === undefined ? {} : { outcome: outcome as 'completed' | 'failed' | 'timed_out' | 'spawn_failed' }), stdout: boundedMessage(string(validation.stdout, 'workflow validation stdout')),
      stderr: boundedMessage(string(validation.stderr, 'workflow validation stderr')), stdoutTruncated: bool(validation.stdoutTruncated, 'workflow validation stdout truncation'), stderrTruncated: bool(validation.stderrTruncated, 'workflow validation stderr truncation'), ...(error === undefined ? {} : { error }),
    };
  });
  const warnings = boundedArray(completion.warnings, 'workflow warnings', 128).map((warning) => boundedMessage(string(warning, 'workflow warning')));
  const terminalState = string(completion.terminalState, 'workflow terminal state', 32);
  if (!['completed', 'failed', 'cancelled', 'budget_exhausted'].includes(terminalState)) invalid('workflow terminal state is invalid.');
  const timing = completion.timing === undefined ? undefined : safeWorkflowTiming(completion.timing);
  return { baselineAvailable: bool(completion.baselineAvailable, 'workflow baseline availability'), finalStateAvailable: bool(completion.finalStateAvailable, 'workflow final state availability'), changes, directMutations, validations, warnings, terminalState: terminalState as 'completed' | 'failed' | 'cancelled' | 'budget_exhausted', finalAssistantResponse: boundedMessage(string(completion.finalAssistantResponse, 'workflow final response')), ...(timing === undefined ? {} : { timing }) };
}

function safeRecoveryIntent(value: Extract<ApplicationEvent, { type: 'recovery.intent' }>['intent']): Extract<ApplicationEvent, { type: 'recovery.intent' }>['intent'] {
  const intent = record(value, 'recovery intent');
  const name = oneOf(intent.name, 'recovery mutation name', ['write_file', 'apply_patch', 'create_directory']);
  const path = string(intent.path, 'recovery target path', 4096);
  const hash = (item: unknown, name: string) => {
    const result = string(item, name, 64);
    if (!/^[a-f0-9]{64}$/.test(result)) invalid(`${name} is invalid.`);
    return result;
  };
  if (name === 'write_file') {
    exactKeys(intent, ['name', 'path', 'desiredBytes', 'desiredSha256', 'precondition'], 'write recovery intent');
    const precondition = intent.precondition === 'absent' ? 'absent' : hash(intent.precondition, 'write recovery precondition');
    return { name, path, desiredBytes: boundedInteger(intent.desiredBytes, 'write recovery bytes'), desiredSha256: hash(intent.desiredSha256, 'write recovery hash'), precondition };
  }
  if (name === 'create_directory') {
    exactKeys(intent, ['name', 'path'], 'directory recovery intent');
    return { name, path };
  }
  exactKeys(intent, ['name', 'path', 'precondition', 'edits'], 'patch recovery intent');
  return { name, path, precondition: hash(intent.precondition, 'patch recovery precondition'), edits: boundedInteger(intent.edits, 'patch recovery edit count', 128) };
}

/** Drops file bodies, write/patch arguments, environment data, and process output. */
function durableEvent(event: ApplicationEvent): ApplicationEvent | undefined {
  switch (event.type) {
    case 'reliability.run.started': return { type: event.type, turnId: string(event.turnId, 'turn ID', 256), runId: identifier(event.runId, 'run ID'), budget: safeBudget(event.budget) };
    case 'provider.attempt.started': return { type: event.type, turnId: string(event.turnId, 'turn ID', 256), runId: identifier(event.runId, 'run ID'), attemptId: identifier(event.attemptId, 'provider attempt ID') };
    case 'provider.retry.scheduled': return { type: event.type, turnId: string(event.turnId, 'turn ID', 256), runId: identifier(event.runId, 'run ID'), attemptId: identifier(event.attemptId, 'provider attempt ID'), retry: boundedInteger(event.retry, 'provider retry count'), delayMs: boundedInteger(event.delayMs, 'provider retry delay'), category: oneOf(event.category, 'provider retry category', ['provider']) };
    case 'provider.retry.exhausted': return { type: event.type, turnId: string(event.turnId, 'turn ID', 256), runId: identifier(event.runId, 'run ID'), attemptId: identifier(event.attemptId, 'provider attempt ID'), retries: boundedInteger(event.retries, 'provider retry count'), category: oneOf(event.category, 'provider retry category', ['provider']) };
    case 'budget.state': return { type: event.type, turnId: string(event.turnId, 'turn ID', 256), runId: identifier(event.runId, 'run ID'), budget: safeBudget(event.budget) };
    case 'budget.pressure': return { type: event.type, turnId: string(event.turnId, 'turn ID', 256), runId: identifier(event.runId, 'run ID'), dimensions: boundedArray(event.dimensions, 'budget pressure dimensions', 11).map((dimension) => safeBudgetDimension(dimension)), budget: safeBudget(event.budget) };
    case 'budget.exhausted': return { type: event.type, turnId: string(event.turnId, 'turn ID', 256), runId: identifier(event.runId, 'run ID'), dimension: safeBudgetDimension(event.dimension), budget: safeBudget(event.budget) };
    case 'context.compaction.started': return { type: event.type, turnId: string(event.turnId, 'turn ID', 256), runId: identifier(event.runId, 'run ID'), start: boundedInteger(event.start, 'context compaction start'), end: boundedInteger(event.end, 'context compaction end'), reason: oneOf(event.reason, 'context compaction reason', ['soft-pressure', 'hard-pressure']) };
    case 'context.compaction.completed': return { type: event.type, turnId: string(event.turnId, 'turn ID', 256), runId: identifier(event.runId, 'run ID'), checkpoint: safeCheckpoint(event.checkpoint) };
    case 'context.compaction.failed': return { type: event.type, turnId: string(event.turnId, 'turn ID', 256), runId: identifier(event.runId, 'run ID'), reason: boundedMessage(string(event.reason, 'context compaction failure', 512)) };
    case 'input.submitted': return undefined; // Completed user input lives only in the canonical transcript.
    case 'assistant.response.completed': return { type: event.type, turnId: string(event.turnId, 'turn ID', 256), text: boundedMessage(string(event.text, 'assistant response')) };
    case 'provider.text.delta': return undefined; // The clean transcript is authoritative for completed assistant text.
    case 'provider.response.started': return event.responseId === undefined ? { type: event.type } : { type: event.type, responseId: string(event.responseId, 'response ID', 256) };
    case 'provider.response.completed': return event.usage === undefined ? { type: event.type } : { type: event.type, usage: safeUsage(event.usage) };
    case 'provider.tool.call': return { type: event.type, callId: string(event.callId, 'call ID', 256), name: string(event.name, 'tool name', 256), arguments: '{}' };
    case 'provider.error': return { type: event.type, error: safeError(event.error) };
    case 'turn.started': case 'turn.completed': return { type: event.type, turnId: string(event.turnId, 'turn ID', 256) };
    case 'turn.cancelled': case 'turn.failed': return { type: event.type, turnId: string(event.turnId, 'turn ID', 256), error: safeError(event.error) };
    case 'hook.started': return { type: event.type, ...(event.turnId === undefined ? {} : { turnId: string(event.turnId, 'turn ID', 256) }), hookId: identifier(event.hookId, 'hook ID'), event: string(event.event, 'hook event', 128) };
    case 'hook.completed': return { type: event.type, ...(event.turnId === undefined ? {} : { turnId: string(event.turnId, 'turn ID', 256) }), hookId: identifier(event.hookId, 'hook ID'), event: string(event.event, 'hook event', 128), status: oneOf(event.status, 'hook status', ['succeeded', 'failed', 'timed_out', 'cancelled']), ...(event.message === undefined ? {} : { message: boundedMessage(string(event.message, 'hook message', 512)) }) };
    case 'recovery.intent': return { type: event.type, turnId: string(event.turnId, 'turn ID', 256), callId: string(event.callId, 'call ID', 256), intent: safeRecoveryIntent(event.intent) };
    case 'recovery.decision': return {
      type: event.type, turnId: string(event.turnId, 'turn ID', 256), ...(event.callId === undefined ? {} : { callId: string(event.callId, 'call ID', 256) }),
      kind: oneOf(event.kind, 'recovery kind', ['mutation', 'process', 'external', 'approval', 'provider-continuation']), ...(event.name === undefined ? {} : { name: string(event.name, 'recovery name', 256) }),
      outcome: oneOf(event.outcome, 'recovery outcome', ['confirmed_complete', 'confirmed_incomplete', 'interrupted', 'outcome_unknown']), evidence: boundedMessage(string(event.evidence, 'recovery evidence', 512)),
    };
    case 'context.source': return { type: event.type, turnId: string(event.turnId, 'turn ID', 256), sourceId: string(event.sourceId, 'context source ID', 1024), kind: string(event.kind, 'context source kind', 128), status: oneOf(event.status, 'context source status', ['loading', 'loaded', 'missing', 'oversized', 'failed']), ...(event.bytes === undefined ? {} : { bytes: boundedInteger(event.bytes, 'context source bytes') }) };
    case 'context.assembled': return { type: event.type, turnId: string(event.turnId, 'turn ID', 256), diagnostics: safeDiagnostics(event.diagnostics) };
    case 'tool.requested': return { type: event.type, turnId: string(event.turnId, 'turn ID', 256), callId: string(event.callId, 'call ID', 256), name: string(event.name, 'tool name', 256), arguments: '{}', ...(event.execution === undefined ? {} : { execution: safeExecution(event.execution) }), ...(event.origin === undefined ? {} : { origin: safeHookOrigin(event.origin) }) };
    case 'tool.started': return { type: event.type, turnId: string(event.turnId, 'turn ID', 256), callId: string(event.callId, 'call ID', 256), name: string(event.name, 'tool name', 256), ...(event.execution === undefined ? {} : { execution: safeExecution(event.execution) }), ...(event.origin === undefined ? {} : { origin: safeHookOrigin(event.origin) }) };
    case 'tool.completed': return { type: event.type, turnId: string(event.turnId, 'turn ID', 256), callId: string(event.callId, 'call ID', 256), name: string(event.name, 'tool name', 256), result: { ok: true, value: {} }, ...(event.execution === undefined ? {} : { execution: safeExecution(event.execution) }), ...(event.origin === undefined ? {} : { origin: safeHookOrigin(event.origin) }) };
    case 'tool.failed': return { type: event.type, turnId: string(event.turnId, 'turn ID', 256), callId: string(event.callId, 'call ID', 256), name: string(event.name, 'tool name', 256), result: { ok: false, error: safeError(event.result.error) }, ...(event.execution === undefined ? {} : { execution: safeExecution(event.execution) }), ...(event.origin === undefined ? {} : { origin: safeHookOrigin(event.origin) }) };
    case 'approval.requested': case 'approval.allowed': case 'approval.denied': return {
      type: event.type, turnId: string(event.turnId, 'turn ID', 256), callId: string(event.callId, 'call ID', 256),
      request: safeApproval(event.request), ...(event.origin === undefined ? {} : { origin: safeHookOrigin(event.origin) }),
    } as ApplicationEvent;
    case 'validation.started': return { type: event.type, turnId: string(event.turnId, 'turn ID', 256), callId: string(event.callId, 'validation call ID', 256), label: boundedMessage(string(event.label, 'validation label', 1024)), intent: boundedMessage(string(event.intent, 'validation intent')) };
    case 'validation.completed': {
      const exitCode = event.exitCode;
      if (exitCode !== null && (!Number.isInteger(exitCode) || exitCode < -1_000_000 || exitCode > 1_000_000)) invalid('validation exit code is invalid.');
      return { type: event.type, turnId: string(event.turnId, 'turn ID', 256), callId: string(event.callId, 'validation call ID', 256), status: oneOf(event.status, 'validation status', ['passed', 'failed', 'denied', 'cancelled']), exitCode, signal: event.signal === null ? null : string(event.signal, 'validation signal', 128), ...(event.outcome === undefined ? {} : { outcome: oneOf(event.outcome, 'validation outcome', ['completed', 'failed', 'timed_out', 'spawn_failed']) as 'completed' | 'failed' | 'timed_out' | 'spawn_failed' }), stdoutTruncated: event.stdoutTruncated === true, stderrTruncated: event.stderrTruncated === true, ...(event.error === undefined ? {} : { error: safeError(event.error) }) };
    }
    case 'workflow.completed': return { type: event.type, turnId: string(event.turnId, 'turn ID', 256), completion: safeWorkflowCompletion(event.completion) };
    case 'task.updated': {
      const status = oneOf(event.status, 'task status', ['pending', 'in_progress', 'blocked', 'planning_needed', 'cancelled', 'budget_exhausted', 'completed', 'failed']);
      const fingerprint = string(event.fingerprint, 'task fingerprint', 64);
      if (!/^[a-f0-9]{64}$/.test(fingerprint)) invalid('task fingerprint is invalid.');
      return { type: event.type, turnId: string(event.turnId, 'turn ID', 256), fingerprint, status, ...(event.currentWorkUnit === undefined ? {} : { currentWorkUnit: string(event.currentWorkUnit, 'task work unit', 64) }), blockerCount: boundedInteger(event.blockerCount, 'task blocker count', 64) };
    }
    case 'stack.updated': {
      const fingerprint = string(event.fingerprint, 'stack fingerprint', 64);
      if (!/^[a-f0-9]{64}$/.test(fingerprint)) invalid('stack fingerprint is invalid.');
      return { type: event.type, turnId: string(event.turnId, 'turn ID', 256), fingerprint, stackId: string(event.stackId, 'stack ID', 512), status: oneOf(event.status, 'stack status', ['pending', 'in_progress', 'blocked', 'planning_needed', 'cancelled', 'budget_exhausted', 'completed', 'failed']), ...(event.currentTaskOrdinal === undefined ? {} : { currentTaskOrdinal: boundedInteger(event.currentTaskOrdinal, 'current task ordinal') }), completedTasks: boundedInteger(event.completedTasks, 'completed stack tasks', 64), totalTasks: boundedInteger(event.totalTasks, 'total stack tasks', 64) };
    }
    case 'activity.updated': return undefined; // Live state is intentionally not durable history.
    case 'progress.milestone': return { type: event.type, turnId: string(event.turnId, 'turn ID', 256), category: oneOf(event.category, 'progress category', ['context', 'inspection', 'editing', 'validation', 'recovery', 'completion']), message: boundedMessage(string(event.message, 'progress message', 4096)) };
    case 'work.updated': return { type: event.type, item: safeWorkItem(event.item) };
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

const BUDGET_DIMENSIONS = ['providerAttempts', 'toolExecutions', 'retryAttempts', 'compactionAttempts', 'compactionCheckpoints', 'processExecutions', 'processRuntimeMs', 'wallClockMs', 'contextTokens', 'providerInputTokens', 'providerOutputTokens'] as const;

function safeBudgetDimension(value: unknown): RunBudgetDimension {
  return oneOf(value, 'budget dimension', BUDGET_DIMENSIONS);
}

function safeBudget(value: RunBudgetSnapshot): RunBudgetSnapshot {
  const budget = record(value, 'run budget');
  exactKeys(budget, ['runId', 'limits', 'consumed', 'elapsedMs'], 'run budget');
  const limits = record(budget.limits, 'run budget limits');
  const consumed = record(budget.consumed, 'run budget consumption');
  exactKeys(limits, BUDGET_DIMENSIONS, 'run budget limits');
  exactKeys(consumed, BUDGET_DIMENSIONS, 'run budget consumption');
  return {
    runId: identifier(budget.runId, 'run ID'),
    limits: Object.fromEntries(BUDGET_DIMENSIONS.map((dimension) => [dimension, boundedInteger(limits[dimension], `run budget limit ${dimension}`)])) as RunBudgetSnapshot['limits'],
    consumed: Object.fromEntries(BUDGET_DIMENSIONS.map((dimension) => [dimension, boundedInteger(consumed[dimension], `run budget consumption ${dimension}`)])) as RunBudgetSnapshot['consumed'],
    elapsedMs: boundedInteger(budget.elapsedMs, 'run budget elapsed time'),
  };
}

function safeCheckpoint(value: ContextCheckpointEvidence): ContextCheckpointEvidence {
  const checkpoint = record(value, 'context checkpoint');
  exactKeys(checkpoint, ['version', 'id', 'start', 'end', 'rangeDigest', 'summaryDigest', 'summary', 'beforeTokens', 'afterTokens', 'reason'], 'context checkpoint');
  const version = boundedInteger(checkpoint.version, 'context checkpoint version');
  if (version !== 1) invalid('context checkpoint version is invalid.');
  const start = boundedInteger(checkpoint.start, 'context checkpoint start');
  const end = boundedInteger(checkpoint.end, 'context checkpoint end');
  if (end <= start) invalid('context checkpoint range is invalid.');
  const digest = (item: unknown, name: string) => {
    const result = string(item, name, 64);
    if (!/^[a-f0-9]{64}$/.test(result)) invalid(`${name} is invalid.`);
    return result;
  };
  const summary = string(checkpoint.summary, 'context checkpoint summary', 16 * 1024);
  if (!summary.trim()) invalid('context checkpoint summary is empty.');
  const reason = oneOf(checkpoint.reason, 'context checkpoint reason', ['soft-pressure', 'hard-pressure']);
  const summaryDigest = digest(checkpoint.summaryDigest, 'context checkpoint summary digest');
  if (createHash('sha256').update(summary).digest('hex') !== summaryDigest) invalid('context checkpoint summary digest does not match summary.');
  return { version, id: identifier(checkpoint.id, 'context checkpoint ID'), start, end, rangeDigest: digest(checkpoint.rangeDigest, 'context checkpoint range digest'), summaryDigest, summary, beforeTokens: boundedInteger(checkpoint.beforeTokens, 'context checkpoint before tokens'), afterTokens: boundedInteger(checkpoint.afterTokens, 'context checkpoint after tokens'), reason };
}

function safeApproval(request: ApplicationEvent extends never ? never : Extract<ApplicationEvent, { type: 'approval.requested' }>['request']): Extract<ApplicationEvent, { type: 'approval.requested' }>['request'] {
  const safe = { id: string(request.id, 'approval ID', 256), toolName: string(request.toolName, 'approval tool name', 256), execution: safeExecution(request.execution) } as const;
  if (request.execution.effect === 'workspace_mutation') {
    if (!request.target || request.process || typeof request.target.alreadyDirty !== 'boolean') invalid('write approval has an invalid shape.');
    if (request.target.outsideWorkspace !== undefined && request.target.outsideWorkspace !== true) invalid('write approval has an invalid outside-workspace marker.');
    const mutation = request.mutation === undefined ? undefined : {
      intent: oneOf(request.mutation.intent, 'approval mutation intent', ['text_framing_change']),
      warning: string(request.mutation.warning, 'approval mutation warning', 256),
    } as const;
    if (mutation !== undefined && mutation.warning !== TEXT_FRAMING_CHANGE_WARNING) invalid('approval mutation warning is invalid.');
    return { ...safe, target: { path: string(request.target.path, 'approval path', 4096), alreadyDirty: request.target.alreadyDirty, ...(request.target.outsideWorkspace === true ? { outsideWorkspace: true } : {}) }, ...(mutation === undefined ? {} : { mutation }) };
  }
  if (request.mutation) invalid('non-mutation approval has mutation intent.');
  if (request.execution.effect === 'host_process' || request.execution.effect === 'sandboxed_workspace_process') {
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
  if (request.target || request.process) invalid('external approval has an invalid local target.');
  return safe;
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
  const diagnosticKeys = ['mode', 'profileId', 'profile', 'attemptedProfileIds', 'promotionReasons', 'estimatedTokens', 'estimator', 'providerInputBudget', 'remainingHeadroom', 'softPressure', 'reservedHeadroom', 'categoryTokens', 'activeSourceIds', 'evidence'];
  if (Object.keys(diagnostics).some((key) => !diagnosticKeys.includes(key))) invalid('context diagnostics has an invalid shape.');
  const categories = record(diagnostics.categoryTokens, 'context categories');
  const categoryKeys = ['core', 'project', 'tools', 'task', 'skills', 'routed', 'conversation', 'toolResults'] as const;
  exactKeys(categories, categoryKeys, 'context categories');
  const activeSourceIds = boundedArray(diagnostics.activeSourceIds, 'context source IDs', 32).map((id) => string(id, 'context source ID', 1024));
  const attemptedProfileIds = diagnostics.attemptedProfileIds === undefined ? [] : boundedArray(diagnostics.attemptedProfileIds, 'attempted context profiles', 3).map((id) => string(id, 'attempted context profile ID', 256));
  const promotionReasons = (diagnostics.promotionReasons === undefined ? [] : boundedArray(diagnostics.promotionReasons, 'context promotion reasons', 5)).map((reason) => {
    const value = string(reason, 'context promotion reason', 64);
    if (!['required-source-failure', 'soft-pressure', 'selected-project-instructions', 'routed-document', 'activated-skill'].includes(value)) invalid('context promotion reason is invalid.');
    return value as ContextDiagnostics['promotionReasons'][number];
  });
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
    // Phase-8 fields are derived only; pre-adaptive durable diagnostics were fixed large-profile observations.
    mode: diagnostics.mode === undefined || diagnostics.mode === 'fixed' ? 'fixed' : diagnostics.mode === 'adaptive' ? 'adaptive' : invalid('context mode is invalid.'),
    profileId: string(diagnostics.profileId, 'context profile ID', 256), profile: safeProfile(diagnostics.profile), attemptedProfileIds, promotionReasons,
    estimatedTokens: boundedInteger(diagnostics.estimatedTokens, 'estimated context tokens'), estimator: string(diagnostics.estimator, 'context estimator', 256),
    providerInputBudget: boundedInteger(diagnostics.providerInputBudget, 'provider input budget'), remainingHeadroom: boundedInteger(diagnostics.remainingHeadroom, 'remaining context headroom'),
    softPressure: typeof diagnostics.softPressure === 'boolean' ? diagnostics.softPressure : invalid('context soft pressure is invalid.'),
    reservedHeadroom: boundedInteger(diagnostics.reservedHeadroom, 'reserved context headroom'),
    categoryTokens: Object.fromEntries(categoryKeys.map((key) => [key, boundedInteger(categories[key], `context category ${key}`)])) as ContextDiagnostics['categoryTokens'],
    activeSourceIds, evidence,
  };
}

function safePermissionExpectations(value: unknown): TaskState['effectivePermissionExpectations'] {
  const permissions = record(value, 'task permission expectations');
  const keys = Object.keys(permissions);
  if (keys.some((key) => !['workspace', 'outsideWorkspace', 'network', 'remoteMutation'].includes(key))) invalid('task permission expectations have an invalid shape.');
  const valueOf = <T extends string>(key: string, allowed: readonly T[]): T | undefined => permissions[key] === undefined ? undefined : oneOf(permissions[key], `task permission ${key}`, allowed);
  return {
    ...(valueOf('workspace', ['standard', 'autonomous'] as const) === undefined ? {} : { workspace: valueOf('workspace', ['standard', 'autonomous'] as const)! }),
    ...(valueOf('outsideWorkspace', ['reject', 'ask'] as const) === undefined ? {} : { outsideWorkspace: valueOf('outsideWorkspace', ['reject', 'ask'] as const)! }),
    ...(valueOf('network', ['reject', 'ask'] as const) === undefined ? {} : { network: valueOf('network', ['reject', 'ask'] as const)! }),
    ...(valueOf('remoteMutation', ['reject', 'ask'] as const) === undefined ? {} : { remoteMutation: valueOf('remoteMutation', ['reject', 'ask'] as const)! }),
  };
}

function safeTaskState(state: TaskState, sessionId: string, workspace: string): DurableTaskState {
  if (state.sessionId !== sessionId || state.workspace !== workspace) invalid('task state belongs to a different session or workspace.');
  const definition = serializeTaskDefinition(state.definition);
  // Reparse before persisting so TaskState never creates a second, looser durable task grammar.
  const parsed = parseSerializedTaskDefinition(definition);
  if (taskDefinitionFingerprint(parsed) !== state.definitionFingerprint) invalid('task definition fingerprint does not match its parsed definition.');
  const durable: DurableTaskState = {
    ...state,
    definition,
    requirements: { ...state.requirements }, workUnits: { ...state.workUnits }, inspections: state.inspections.map((item) => ({ ...item })),
    validations: Object.fromEntries(Object.entries(state.validations).map(([id, value]) => [id, { status: value.status, attempts: value.attempts.map((attempt) => ({ ...attempt })) }])),
    corrections: state.corrections.map((item) => ({ ...item })), blockers: [...state.blockers], effectivePermissionExpectations: { ...state.effectivePermissionExpectations },
  };
  // The same strict parser guards both newly written and reopened task state.
  parseTaskState(durable);
  return durable;
}

function safeStackState(state: StackState, sessionId: string, workspace: string): DurableStackState {
  if (state.sessionId !== sessionId || state.workspace !== workspace) invalid('stack state belongs to a different session or workspace.');
  try { restoreStackState(state); } catch (error) { invalid(error instanceof Error ? error.message : 'stack state is invalid.'); }
  return {
    ...state,
    tasks: state.tasks.map((task) => ({ ...task, taskState: safeTaskState(task.taskState, sessionId, workspace) })),
    completedTaskOrdinals: [...state.completedTaskOrdinals],
    effectivePermissionExpectations: { ...state.effectivePermissionExpectations },
  };
}

function parseTaskState(value: unknown): TaskState {
  const item = record(value, 'task state');
  exactKeys(item, ['schemaVersion', 'sessionId', 'workspace', 'definition', 'definitionFingerprint', 'status', ...(item.currentWorkUnit === undefined ? [] : ['currentWorkUnit']), 'requirements', 'workUnits', 'inspections', 'validations', 'correctionLimit', 'corrections', 'blockers', ...(item.terminalOutcome === undefined ? [] : ['terminalOutcome']), 'effectivePermissionExpectations'], 'task state');
  if (item.schemaVersion !== TASK_STATE_SCHEMA_VERSION) invalid(`unsupported task state schema version ${String(item.schemaVersion)}.`);
  const definition = (() => { try { return parseSerializedTaskDefinition(string(item.definition, 'task definition', 128 * 1024)); } catch { return invalid('task definition is invalid.'); } })();
  const fingerprint = string(item.definitionFingerprint, 'task definition fingerprint', 64);
  if (!/^[a-f0-9]{64}$/.test(fingerprint) || fingerprint !== taskDefinitionFingerprint(definition)) invalid('task definition fingerprint does not match.');
  const status = oneOf(item.status, 'task status', ['pending', 'in_progress', 'blocked', 'planning_needed', 'cancelled', 'budget_exhausted', 'completed', 'failed'] as const);
  const requirementKeys = definition.requirements.map(({ id }) => id);
  const workKeys = definition.workflow.map(({ id }) => id);
  const validationKeys = definition.validations.map(({ id }) => id);
  const requirements = record(item.requirements, 'task requirements'); exactKeys(requirements, requirementKeys, 'task requirements');
  const safeRequirements = Object.fromEntries(requirementKeys.map((key) => [key, oneOf(requirements[key], 'task requirement status', ['pending', 'addressed', 'verified'] as const)])) as TaskState['requirements'];
  const workUnits = record(item.workUnits, 'task work units'); exactKeys(workUnits, workKeys, 'task work units');
  const safeWorkUnits = Object.fromEntries(workKeys.map((key) => [key, oneOf(workUnits[key], 'task work unit status', ['pending', 'active', 'addressed', 'blocked'] as const)])) as TaskState['workUnits'];
  const currentWorkUnit = item.currentWorkUnit === undefined ? undefined : string(item.currentWorkUnit, 'current work unit', 64) as `W${number}`;
  if (currentWorkUnit !== undefined && (!workKeys.includes(currentWorkUnit) || safeWorkUnits[currentWorkUnit] !== 'active')) invalid('current task work unit is invalid.');
  if (workKeys.filter((key) => safeWorkUnits[key] === 'active').length !== (currentWorkUnit === undefined ? 0 : 1)) invalid('task active work unit is invalid.');
  const inspections = boundedArray(item.inspections, 'task inspections', 64).map((entry) => { const evidence = record(entry, 'task inspection'); exactKeys(evidence, ['item', 'source'], 'task inspection'); const inspected = string(evidence.item, 'task inspection item', 8192); if (!definition.inspect.includes(inspected)) invalid('task inspection is not declared.'); return { item: inspected, source: string(evidence.source, 'task inspection source', 512) }; });
  const validations = record(item.validations, 'task validations'); exactKeys(validations, validationKeys, 'task validations');
  const safeValidations = Object.fromEntries(validationKeys.map((key) => {
    const validation = record(validations[key], 'task validation'); exactKeys(validation, ['status', 'attempts'], 'task validation');
    const attempts = boundedArray(validation.attempts, 'task validation attempts', 32).map((entry) => {
      const attempt = record(entry, 'task validation attempt');
      const optional = ['outcome', 'stdout', 'stderr', 'stdoutTruncated', 'stderrTruncated', 'redacted', 'error'].filter((key) => attempt[key] !== undefined);
      exactKeys(attempt, ['turnId', 'callId', 'status', 'exitCode', 'signal', ...optional], 'task validation attempt');
      const exitCode = attempt.exitCode; if (exitCode !== null && (!Number.isInteger(exitCode) || (exitCode as number) < -1_000_000 || (exitCode as number) > 1_000_000)) invalid('task validation exit code is invalid.');
      const signal = attempt.signal; if (signal !== null && typeof signal !== 'string') invalid('task validation signal is invalid.');
      const error = attempt.error === undefined ? undefined : safeError(record(attempt.error, 'task validation error') as { code: string; message: string });
      return {
        turnId: string(attempt.turnId, 'task validation turn ID', 256), callId: string(attempt.callId, 'task validation call ID', 256), status: oneOf(attempt.status, 'task validation attempt status', ['passed', 'failed', 'denied', 'cancelled'] as const), exitCode: exitCode as number | null, signal: signal === null ? null : string(signal, 'task validation signal', 128),
        ...(attempt.outcome === undefined ? {} : { outcome: oneOf(attempt.outcome, 'task validation outcome', ['completed', 'failed', 'timed_out', 'spawn_failed'] as const) }),
        ...(attempt.stdout === undefined ? {} : { stdout: string(attempt.stdout, 'task validation stdout', 2048) }),
        ...(attempt.stderr === undefined ? {} : { stderr: string(attempt.stderr, 'task validation stderr', 2048) }),
        ...(attempt.stdoutTruncated === undefined ? {} : { stdoutTruncated: boolean(attempt.stdoutTruncated, 'task validation stdout truncation') }),
        ...(attempt.stderrTruncated === undefined ? {} : { stderrTruncated: boolean(attempt.stderrTruncated, 'task validation stderr truncation') }),
        ...(attempt.redacted === undefined ? {} : { redacted: boolean(attempt.redacted, 'task validation redaction') }),
        ...(error === undefined ? {} : { error }),
      } as TaskValidationAttempt;
    });
    const validationStatus = oneOf(validation.status, 'task validation status', ['pending', 'passed', 'failed', 'denied', 'cancelled'] as const);
    if ((validationStatus === 'pending') !== (attempts.length === 0) || (attempts.length && attempts.at(-1)!.status !== validationStatus)) invalid('task validation current status is invalid.');
    return [key, { status: validationStatus, attempts }];
  })) as TaskState['validations'];
  const correctionLimit = boundedInteger(item.correctionLimit, 'task correction limit', 10);
  const corrections = boundedArray(item.corrections, 'task corrections', correctionLimit).map((entry, index) => { const correction = record(entry, 'task correction'); exactKeys(correction, ['cycle', 'validationId', 'status'], 'task correction'); const validationId = string(correction.validationId, 'task correction validation', 64) as `V${number}`; if (!validationKeys.includes(validationId) || correction.cycle !== index + 1) invalid('task correction is invalid.'); return { cycle: correction.cycle as number, validationId, status: oneOf(correction.status, 'task correction status', ['active', 'repaired', 'completed'] as const) }; });
  if (corrections.filter((item) => item.status !== 'completed').length > 1) invalid('task correction state is invalid.');
  const blockers = boundedArray(item.blockers, 'task blockers', 64).map((blocker) => boundedMessage(string(blocker, 'task blocker', 512)));
  const terminalOutcome = item.terminalOutcome === undefined ? undefined : oneOf(item.terminalOutcome, 'task terminal outcome', ['blocked', 'planning_needed', 'cancelled', 'budget_exhausted', 'completed', 'failed'] as const);
  if ((terminalOutcome === undefined) === ['blocked', 'planning_needed', 'cancelled', 'budget_exhausted', 'completed', 'failed'].includes(status)) invalid('task terminal outcome is invalid.');
  if (terminalOutcome !== undefined && terminalOutcome !== status) invalid('task terminal outcome does not match status.');
  return Object.freeze({ schemaVersion: TASK_STATE_SCHEMA_VERSION, sessionId: identifier(item.sessionId, 'task session ID'), workspace: canonicalPath(item.workspace, 'task workspace'), definition, definitionFingerprint: fingerprint, status, ...(currentWorkUnit === undefined ? {} : { currentWorkUnit }), requirements: Object.freeze(safeRequirements), workUnits: Object.freeze(safeWorkUnits), inspections: Object.freeze(inspections), validations: Object.freeze(safeValidations), correctionLimit, corrections: Object.freeze(corrections), blockers: Object.freeze(blockers), ...(terminalOutcome === undefined ? {} : { terminalOutcome }), effectivePermissionExpectations: Object.freeze(safePermissionExpectations(item.effectivePermissionExpectations)) });
}

function parseStackState(value: unknown, sessionId: string, workspace: string): StackState {
  const item = record(value, 'stack state');
  const optional = ['currentTaskIndex', 'terminalOutcome', 'blockerSummary'].filter((key) => item[key] !== undefined);
  exactKeys(item, ['schemaVersion', 'sessionId', 'workspace', 'stackId', 'fingerprint', 'tasks', ...optional, 'completedTaskOrdinals', 'status', 'effectivePermissionExpectations'], 'stack state');
  if (item.schemaVersion !== STACK_STATE_SCHEMA_VERSION) invalid(`unsupported stack state schema version ${String(item.schemaVersion)}.`);
  if (item.sessionId !== sessionId || item.workspace !== workspace) invalid('stack state belongs to a different session or workspace.');
  const fingerprint = string(item.fingerprint, 'stack fingerprint', 64);
  if (!/^[a-f0-9]{64}$/.test(fingerprint)) invalid('stack fingerprint is invalid.');
  const tasks = boundedArray(item.tasks, 'stack tasks', 64).map((entry) => {
    const task = record(entry, 'stack task');
    exactKeys(task, ['ordinal', 'fingerprint', 'status', 'taskState'], 'stack task');
    return { ordinal: boundedInteger(task.ordinal, 'stack task ordinal'), fingerprint: string(task.fingerprint, 'stack task fingerprint', 64), status: oneOf(task.status, 'stack task status', ['pending', 'in_progress', 'blocked', 'planning_needed', 'cancelled', 'budget_exhausted', 'completed', 'failed'] as const), taskState: parseTaskState(task.taskState) };
  });
  const currentTaskIndex = item.currentTaskIndex === undefined ? undefined : boundedInteger(item.currentTaskIndex, 'current stack task index', 63);
  const terminalOutcome = item.terminalOutcome === undefined ? undefined : oneOf(item.terminalOutcome, 'stack terminal outcome', ['blocked', 'planning_needed', 'cancelled', 'budget_exhausted', 'completed', 'failed'] as const);
  const state = {
    schemaVersion: STACK_STATE_SCHEMA_VERSION,
    sessionId,
    workspace,
    stackId: string(item.stackId, 'stack ID', 512),
    fingerprint,
    tasks,
    ...(currentTaskIndex === undefined ? {} : { currentTaskIndex }),
    completedTaskOrdinals: boundedArray(item.completedTaskOrdinals, 'completed stack tasks', 64).map((ordinal) => boundedInteger(ordinal, 'completed stack task ordinal')),
    status: oneOf(item.status, 'stack status', ['pending', 'in_progress', 'blocked', 'planning_needed', 'cancelled', 'budget_exhausted', 'completed', 'failed'] as const),
    ...(terminalOutcome === undefined ? {} : { terminalOutcome }),
    ...(item.blockerSummary === undefined ? {} : { blockerSummary: boundedMessage(string(item.blockerSummary, 'stack blocker summary', 512)) }),
    effectivePermissionExpectations: safePermissionExpectations(item.effectivePermissionExpectations),
  } as StackState;
  try { return restoreStackState(state); } catch (error) { return invalid(error instanceof Error ? error.message : 'stack state is invalid.'); }
}

function durableSession(session: Session, workspace: string): SerializedDurableSession {
  // Durable events intentionally omit prior input bodies, so they cannot rebuild a reopened transcript.
  // A trailing user entry is the only incomplete canonical turn state and remains non-durable.
  const transcript = (session.transcript.at(-1)?.role === 'user' ? session.transcript.slice(0, -1) : session.transcript).map((entry) => {
    if (entry.role !== 'user' && entry.role !== 'assistant') invalid('transcript role is invalid.');
    return { role: entry.role, text: string(entry.text, 'transcript text') } as TranscriptEntry;
  });
  if (transcript.length > MAX_DURABLE_TRANSCRIPT_ENTRIES) invalid('transcript exceeds its bound.');
  if (session.events.length > MAX_DURABLE_EVENTS) invalid('event history exceeds its bound.');
  return {
    schemaVersion: DURABLE_SESSION_SCHEMA_VERSION, id: identifier(session.id, 'session ID'), workspace, transcript,
    events: session.events.map(durableEvent).filter((event): event is ApplicationEvent => event !== undefined),
    ...(session.taskState === undefined ? {} : { taskState: safeTaskState(session.taskState, session.id, workspace) }),
    ...(session.stackState === undefined ? {} : { stackState: safeStackState(session.stackState, session.id, workspace) }),
  };
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
  if (item.schemaVersion === 1) {
    exactKeys(item, ['schemaVersion', 'id', 'workspace', 'transcript', 'events'], 'session');
    return { schemaVersion: 1, id: identifier(item.id, 'session ID'), workspace: canonicalPath(item.workspace, 'workspace'), transcript: parseTranscript(item.transcript), events: parseEvents(item.events) };
  }
  if (item.schemaVersion === 2) {
    exactKeys(item, ['schemaVersion', 'id', 'workspace', 'transcript', 'events', ...(item.taskState === undefined ? [] : ['taskState'])], 'session');
    const id = identifier(item.id, 'session ID');
    const workspace = canonicalPath(item.workspace, 'workspace');
    const taskState = item.taskState === undefined ? undefined : parseTaskState(item.taskState);
    if (taskState && (taskState.sessionId !== id || taskState.workspace !== workspace)) invalid('task state belongs to a different session or workspace.');
    return { schemaVersion: 2, id, workspace, transcript: parseTranscript(item.transcript), events: parseEvents(item.events), ...(taskState === undefined ? {} : { taskState }) };
  }
  exactKeys(item, ['schemaVersion', 'id', 'workspace', 'transcript', 'events', ...(item.taskState === undefined ? [] : ['taskState']), ...(item.stackState === undefined ? [] : ['stackState'])], 'session');
  if (item.schemaVersion !== DURABLE_SESSION_SCHEMA_VERSION) invalid(`unsupported schema version ${String(item.schemaVersion)}.`);
  const id = identifier(item.id, 'session ID');
  const workspace = canonicalPath(item.workspace, 'workspace');
  const taskState = item.taskState === undefined ? undefined : parseTaskState(item.taskState);
  const stackState = item.stackState === undefined ? undefined : parseStackState(item.stackState, id, workspace);
  if (taskState && (taskState.sessionId !== id || taskState.workspace !== workspace)) invalid('task state belongs to a different session or workspace.');
  return {
    schemaVersion: DURABLE_SESSION_SCHEMA_VERSION, id, workspace, transcript: parseTranscript(item.transcript), events: parseEvents(item.events),
    ...(taskState === undefined ? {} : { taskState }), ...(stackState === undefined ? {} : { stackState }),
  };
}

export function classifySessionInterruptions(events: readonly ApplicationEvent[]): SessionInterruption[] {
  const tools = new Map<string, Extract<ApplicationEvent, { type: 'tool.requested' | 'tool.started' }>>();
  const approvals = new Map<string, Extract<ApplicationEvent, { type: 'approval.requested' }>>();
  const providerStarted = new Set<string>();
  const reconciled = new Set<string>();
  const reconciledProviderTurns = new Set<string>();
  let currentTurn = 'unknown';
  for (const event of events) {
    if (event.type === 'turn.started') currentTurn = event.turnId;
    else if (event.type === 'provider.response.started') providerStarted.add(currentTurn);
    else if (event.type === 'provider.response.completed' || event.type === 'provider.error') providerStarted.delete(currentTurn);
    else if (event.type === 'tool.requested' || event.type === 'tool.started') tools.set(event.callId, event);
    else if (event.type === 'tool.completed' || event.type === 'tool.failed') tools.delete(event.callId);
    else if (event.type === 'approval.requested') approvals.set(event.callId, event);
    else if (event.type === 'approval.allowed' || event.type === 'approval.denied') approvals.delete(event.callId);
    else if (event.type === 'recovery.decision') {
      if (event.callId) reconciled.add(event.callId);
      if (event.kind === 'provider-continuation') reconciledProviderTurns.add(event.turnId);
    }
  }
  const interruptions: SessionInterruption[] = [];
  for (const event of tools.values()) {
    if (reconciled.has(event.callId)) continue;
    const effect = event.execution?.effect;
    const kind = effect === 'workspace_mutation' ? 'mutation'
      : effect === 'host_process' || effect === 'sandboxed_workspace_process' ? 'process'
        : effect !== undefined && effect !== 'local_read' ? 'external'
          // Legacy durable events lack execution metadata; retain prior classification only for them.
          : event.name === 'write_file' || event.name === 'apply_patch' || event.name === 'create_directory' ? 'mutation'
            : event.name === 'run_process' ? 'process' : undefined;
    if (kind) interruptions.push({ kind, turnId: event.turnId, callId: event.callId, name: event.name });
  }
  for (const event of approvals.values()) if (!reconciled.has(event.callId)) interruptions.push({ kind: 'approval', turnId: event.turnId, callId: event.callId, name: event.request.toolName });
  for (const turnId of providerStarted) if (!reconciledProviderTurns.has(turnId)) interruptions.push({ kind: 'provider-continuation', ...(turnId === 'unknown' ? {} : { turnId }) });
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
      return { id: value.id, workspace: value.workspace, transcript: [...value.transcript], events: [...value.events], interruptions: classifySessionInterruptions(value.events), ...(value.taskState === undefined ? {} : { taskState: value.taskState }), ...(value.stackState === undefined ? {} : { stackState: value.stackState }) };
    } catch (error) {
      durableError(error);
    }
  }
}
