import { createHash, randomUUID } from 'node:crypto';
import { open, lstat, mkdir, readFile, rename, rm } from 'node:fs/promises';
import { homedir } from 'node:os';
import { basename, isAbsolute, join, resolve } from 'node:path';

import { GeorgeError } from './errors.ts';
import type { ContextProfile } from './config.ts';
import type { ApplicationEvent, ContextCheckpointEvidence, ContextDiagnostics, ProviderUsage } from './events.ts';
import type { RunBudgetDimension, RunBudgetSnapshot } from './run-budget.ts';
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

function safeHookOrigin(value: unknown): Readonly<{ hookId: string }> {
  const origin = record(value, 'hook origin');
  exactKeys(origin, ['hookId'], 'hook origin');
  return { hookId: identifier(origin.hookId, 'hook ID') };
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

function safeWorkDetails(value: unknown): Extract<ApplicationEvent, { type: 'work.updated' }>['item']['details'] {
  const details = record(value, 'work details');
  const allowed = ['path', 'query', 'count', 'bytes', 'scannedFiles', 'scannedBytes', 'executable', 'argv', 'cwd', 'timeoutMs', 'exitCode', 'signal', 'outcome', 'truncated', 'error', 'requestedArguments'];
  if (Object.keys(details).some((key) => !allowed.includes(key))) invalid('work details has an invalid shape.');
  const integer = (key: string): number | undefined => details[key] === undefined ? undefined : boundedInteger(details[key], `work ${key}`);
  const maybeString = (key: string, limit = 4096): string | undefined => details[key] === undefined ? undefined : boundedMessage(string(details[key], `work ${key}`, limit));
  const outcome = details.outcome === undefined ? undefined : string(details.outcome, 'work outcome', 32);
  if (outcome !== undefined && !['completed', 'failed', 'timed_out', 'spawn_failed'].includes(outcome)) invalid('work outcome is invalid.');
  const exitCode = details.exitCode;
  if (exitCode !== undefined && exitCode !== null && (!Number.isInteger(exitCode) || (exitCode as number) < -1_000_000 || (exitCode as number) > 1_000_000)) invalid('work exit code is invalid.');
  if (details.truncated !== undefined && typeof details.truncated !== 'boolean') invalid('work truncation is invalid.');
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
  };
}

function safeWorkItem(value: unknown): Extract<ApplicationEvent, { type: 'work.updated' }>['item'] {
  const item = record(value, 'work item');
  exactKeys(item, ['id', 'turnId', 'operationId', 'category', 'status', 'summary', 'details'], 'work item');
  const category = string(item.category, 'work category', 32);
  const status = string(item.status, 'work status', 32);
  if (!['context', 'inspection', 'editing', 'approval', 'process', 'validation', 'recovery', 'completion'].includes(category)) invalid('work category is invalid.');
  if (!['requested', 'running', 'waiting', 'succeeded', 'missing', 'skipped', 'failed', 'denied', 'cancelled', 'interrupted'].includes(status)) invalid('work status is invalid.');
  return { id: string(item.id, 'work ID', 512), turnId: string(item.turnId, 'work turn ID', 256), operationId: string(item.operationId, 'work operation ID', 512), category: category as Extract<ApplicationEvent, { type: 'work.updated' }>['item']['category'], status: status as Extract<ApplicationEvent, { type: 'work.updated' }>['item']['status'], summary: boundedMessage(string(item.summary, 'work summary', 4096)), details: safeWorkDetails(item.details) };
}

function oneOf<T extends string>(value: unknown, name: string, values: readonly T[]): T {
  const result = string(value, name, 32);
  if (!values.includes(result as T)) invalid(`${name} is invalid.`);
  return result as T;
}

function safeWorkflowCompletion(value: Extract<ApplicationEvent, { type: 'workflow.completed' }>['completion']): Extract<ApplicationEvent, { type: 'workflow.completed' }>['completion'] {
  const completion = record(value, 'workflow completion');
  exactKeys(completion, ['baselineAvailable', 'finalStateAvailable', 'changes', 'directMutations', 'validations', 'warnings', 'terminalState', 'finalAssistantResponse'], 'workflow completion');
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
  return { baselineAvailable: bool(completion.baselineAvailable, 'workflow baseline availability'), finalStateAvailable: bool(completion.finalStateAvailable, 'workflow final state availability'), changes, directMutations, validations, warnings, terminalState: terminalState as 'completed' | 'failed' | 'cancelled' | 'budget_exhausted', finalAssistantResponse: boundedMessage(string(completion.finalAssistantResponse, 'workflow final response')) };
}

function safeRecoveryIntent(value: Extract<ApplicationEvent, { type: 'recovery.intent' }>['intent']): Extract<ApplicationEvent, { type: 'recovery.intent' }>['intent'] {
  const intent = record(value, 'recovery intent');
  const name = oneOf(intent.name, 'recovery mutation name', ['write_file', 'apply_patch']);
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
      kind: oneOf(event.kind, 'recovery kind', ['mutation', 'process', 'approval', 'provider-continuation']), ...(event.name === undefined ? {} : { name: string(event.name, 'recovery name', 256) }),
      outcome: oneOf(event.outcome, 'recovery outcome', ['confirmed_complete', 'confirmed_incomplete', 'interrupted', 'outcome_unknown']), evidence: boundedMessage(string(event.evidence, 'recovery evidence', 512)),
    };
    case 'context.source': return { type: event.type, turnId: string(event.turnId, 'turn ID', 256), sourceId: string(event.sourceId, 'context source ID', 1024), kind: string(event.kind, 'context source kind', 128), status: oneOf(event.status, 'context source status', ['loading', 'loaded', 'missing', 'oversized', 'failed']), ...(event.bytes === undefined ? {} : { bytes: boundedInteger(event.bytes, 'context source bytes') }) };
    case 'context.assembled': return { type: event.type, turnId: string(event.turnId, 'turn ID', 256), diagnostics: safeDiagnostics(event.diagnostics) };
    case 'tool.requested': return { type: event.type, turnId: string(event.turnId, 'turn ID', 256), callId: string(event.callId, 'call ID', 256), name: string(event.name, 'tool name', 256), arguments: '{}', ...(event.origin === undefined ? {} : { origin: safeHookOrigin(event.origin) }) };
    case 'tool.started': return { type: event.type, turnId: string(event.turnId, 'turn ID', 256), callId: string(event.callId, 'call ID', 256), name: string(event.name, 'tool name', 256), ...(event.origin === undefined ? {} : { origin: safeHookOrigin(event.origin) }) };
    case 'tool.completed': return { type: event.type, turnId: string(event.turnId, 'turn ID', 256), callId: string(event.callId, 'call ID', 256), name: string(event.name, 'tool name', 256), result: { ok: true, value: {} }, ...(event.origin === undefined ? {} : { origin: safeHookOrigin(event.origin) }) };
    case 'tool.failed': return { type: event.type, turnId: string(event.turnId, 'turn ID', 256), callId: string(event.callId, 'call ID', 256), name: string(event.name, 'tool name', 256), result: { ok: false, error: safeError(event.result.error) }, ...(event.origin === undefined ? {} : { origin: safeHookOrigin(event.origin) }) };
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
  // Durable events intentionally omit prior input bodies, so they cannot rebuild a reopened transcript.
  // A trailing user entry is the only incomplete canonical turn state and remains non-durable.
  const transcript = (session.transcript.at(-1)?.role === 'user' ? session.transcript.slice(0, -1) : session.transcript).map((entry) => {
    if (entry.role !== 'user' && entry.role !== 'assistant') invalid('transcript role is invalid.');
    return { role: entry.role, text: string(entry.text, 'transcript text') } as TranscriptEntry;
  });
  if (transcript.length > MAX_DURABLE_TRANSCRIPT_ENTRIES) invalid('transcript exceeds its bound.');
  if (session.events.length > MAX_DURABLE_EVENTS) invalid('event history exceeds its bound.');
  return { schemaVersion: DURABLE_SESSION_SCHEMA_VERSION, id: identifier(session.id, 'session ID'), workspace, transcript, events: session.events.map(durableEvent).filter((event): event is ApplicationEvent => event !== undefined) };
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
    if (event.name === 'write_file' || event.name === 'apply_patch') interruptions.push({ kind: 'mutation', turnId: event.turnId, callId: event.callId, name: event.name });
    if (event.name === 'run_process') interruptions.push({ kind: 'process', turnId: event.turnId, callId: event.callId, name: event.name });
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
      return { id: value.id, workspace: value.workspace, transcript: [...value.transcript], events: [...value.events], interruptions: classifySessionInterruptions(value.events) };
    } catch (error) {
      durableError(error);
    }
  }
}
