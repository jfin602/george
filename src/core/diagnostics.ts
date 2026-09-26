import { appendFile, mkdir, rename, rm, stat } from 'node:fs/promises';
import { join } from 'node:path';

import type { ApplicationEvent } from './events.ts';
import type { Session } from './session.ts';
import { resolveGeorgeStateRoot } from './session-store.ts';

const MAX_TEXT_BYTES = 512;
const DEFAULT_MAX_BYTES = 256 * 1024;
const DEFAULT_MAX_FILES = 4;

export type Measurement = Readonly<{
  workload: string;
  name: string;
  value: number;
  unit: 'ms' | 'bytes' | 'tokens' | 'count';
  fields?: Readonly<Record<string, string | number | boolean | null>>;
}>;

export type DiagnosticRecord = Readonly<{
  version: 1;
  sequence: number;
  timestampMs: number;
  type: string;
  correlation: Readonly<{ sessionId: string; turnId?: string; operationId?: string; providerAttemptId?: string; compactionCheckpointId?: string; recoveryDecisionId?: string; hookInvocationId?: string }>;
  fields: Readonly<Record<string, string | number | boolean | null>>;
}>;

export type DiagnosticObserver = Readonly<{
  observe(session: Session, event: ApplicationEvent): void;
  measure(measurement: Measurement): void;
}>;

export type DiagnosticSinkOptions = Readonly<{
  root?: string;
  maxBytes?: number;
  maxFiles?: number;
  clock?: () => number;
}>;

function bounded(value: string, limit = MAX_TEXT_BYTES): string {
  return Buffer.byteLength(value, 'utf8') <= limit ? value : `${Buffer.from(value, 'utf8').subarray(0, limit - 3).toString('utf8')}...`;
}

function safeArguments(name: string, arguments_: string): string {
  let value: unknown;
  try { value = JSON.parse(arguments_); } catch { return 'malformed JSON'; }
  if (!value || typeof value !== 'object' || Array.isArray(value)) return 'non-object arguments';
  const source = value as Record<string, unknown>;
  const fields = name === 'run_process' ? ['executable', 'arguments', 'cwd', 'timeoutMs'] : name === 'search_text' ? ['query', 'path'] : ['path'];
  const summary: Record<string, string | number | boolean> = {};
  for (const key of fields) {
    const item = source[key];
    if (typeof item === 'string') summary[key] = bounded(item, 160);
    else if (typeof item === 'number' && Number.isFinite(item)) summary[key] = item;
    else if (typeof item === 'boolean') summary[key] = item;
    else if (Array.isArray(item)) summary[key] = `array(${Math.min(item.length, 64)})`;
    else if (item !== undefined) summary[key] = typeof item;
  }
  if (name === 'apply_patch' && Array.isArray(source.edits)) summary.edits = `count(${Math.min(source.edits.length, 128)})`;
  if (name === 'write_file' && 'content' in source) summary.content = 'redacted';
  return bounded(JSON.stringify(summary), 480);
}

function safeProviderError(error: { code: string; message: string; cause?: unknown }): Record<string, string | number | boolean | null> {
  const fields: Record<string, string | number | boolean | null> = { code: bounded(error.code, 128), message: bounded(error.message) };
  if (!error.cause || typeof error.cause !== 'object' || Array.isArray(error.cause)) return fields;
  const cause = error.cause as Record<string, unknown>;
  for (const key of ['providerEventType', 'eventType', 'providerCode', 'providerReason'] as const) if (typeof cause[key] === 'string') fields[key] = bounded(cause[key], 128);
  if (typeof cause.status === 'number' && Number.isInteger(cause.status)) fields.status = cause.status;
  return fields;
}

function turnFor(session: Session, event: ApplicationEvent): string | undefined {
  if ('turnId' in event && typeof event.turnId === 'string') return event.turnId;
  for (const item of [...session.events].reverse()) if ('turnId' in item && typeof item.turnId === 'string') return item.turnId;
  return undefined;
}

function eventRecord(session: Session, event: ApplicationEvent, sequence: number, timestampMs: number, attempts: Map<string, string>): DiagnosticRecord {
  const turnId = turnFor(session, event);
  const key = `${session.id}:${turnId ?? ''}`;
  const correlation: { sessionId: string; turnId?: string; operationId?: string; providerAttemptId?: string; compactionCheckpointId?: string; recoveryDecisionId?: string; hookInvocationId?: string } = { sessionId: session.id, ...(turnId === undefined ? {} : { turnId }) };
  const fields: Record<string, string | number | boolean | null> = {};
  if (event.type === 'provider.attempt.started') attempts.set(key, event.attemptId);
  if (attempts.has(key)) correlation.providerAttemptId = attempts.get(key)!;
  switch (event.type) {
    case 'input.submitted': fields.bytes = Buffer.byteLength(event.text, 'utf8'); break;
    case 'assistant.response.completed': fields.canonical = true; fields.bytes = Buffer.byteLength(event.text, 'utf8'); break;
    case 'provider.text.delta': fields.provisional = true; fields.bytes = Buffer.byteLength(event.delta, 'utf8'); break;
    case 'provider.response.started': fields.responseStarted = true; break;
    case 'provider.response.completed': fields.completed = true; if (event.usage?.inputTokens !== undefined) fields.inputTokens = event.usage.inputTokens; if (event.usage?.outputTokens !== undefined) fields.outputTokens = event.usage.outputTokens; break;
    case 'provider.error': Object.assign(fields, safeProviderError(event.error)); break;
    case 'provider.tool.call': correlation.operationId = event.callId; fields.name = bounded(event.name, 128); fields.requestedArguments = safeArguments(event.name, event.arguments); break;
    case 'tool.requested': correlation.operationId = event.callId; fields.name = bounded(event.name, 128); fields.requestedArguments = safeArguments(event.name, event.arguments); break;
    case 'tool.started': correlation.operationId = event.callId; fields.name = bounded(event.name, 128); break;
    case 'tool.completed': case 'tool.failed': {
      correlation.operationId = event.callId; fields.name = bounded(event.name, 128); fields.ok = event.result.ok;
      if (!event.result.ok) { fields.code = bounded(event.result.error.code, 128); fields.message = bounded(event.result.error.message); }
      if (event.result.ok && event.name === 'run_process' && event.result.value && typeof event.result.value === 'object' && !Array.isArray(event.result.value)) {
        const value = event.result.value as Record<string, unknown>;
        if (typeof value.outcome === 'string') fields.outcome = bounded(value.outcome, 64);
        if (typeof value.exitCode === 'number') fields.exitCode = value.exitCode;
        const cleanup = value.cleanup;
        if (cleanup && typeof cleanup === 'object' && !Array.isArray(cleanup)) {
          const detail = cleanup as Record<string, unknown>;
          if (typeof detail.outcome === 'string') fields.cleanupOutcome = bounded(detail.outcome, 64);
          if (typeof detail.durationMs === 'number') fields.cleanupDurationMs = detail.durationMs;
        }
      }
      break;
    }
    case 'context.assembled': fields.estimatedTokens = event.diagnostics.estimatedTokens; fields.providerInputBudget = event.diagnostics.providerInputBudget; fields.softPressure = event.diagnostics.softPressure; break;
    case 'context.envelope.promoted': fields.fromProfileId = bounded(event.fromProfileId, 256); fields.toProfileId = bounded(event.toProfileId, 256); fields.reason = event.reason; fields.tokens = event.tokens; fields.providerInputBudget = event.providerInputBudget; break;
    case 'context.compaction.started': fields.start = event.start; fields.end = event.end; fields.reason = event.reason; break;
    case 'context.compaction.completed': correlation.compactionCheckpointId = event.checkpoint.id; fields.beforeTokens = event.checkpoint.beforeTokens; fields.afterTokens = event.checkpoint.afterTokens; fields.reason = event.checkpoint.reason; break;
    case 'context.compaction.failed': fields.reason = bounded(event.reason); break;
    case 'recovery.decision': correlation.recoveryDecisionId = event.callId ?? `${event.kind}:${event.turnId}`; fields.kind = event.kind; fields.outcome = event.outcome; fields.evidence = bounded(event.evidence); break;
    case 'hook.started': correlation.hookInvocationId = event.hookId; fields.event = bounded(event.event, 128); break;
    case 'hook.completed': correlation.hookInvocationId = event.hookId; fields.event = bounded(event.event, 128); fields.status = event.status; break;
    case 'provider.retry.scheduled': case 'provider.retry.exhausted': correlation.providerAttemptId = event.attemptId; fields.retries = event.type === 'provider.retry.scheduled' ? event.retry : event.retries; break;
    case 'turn.failed': case 'turn.cancelled': fields.code = bounded(event.error.code, 128); fields.message = bounded(event.error.message); break;
    default: break;
  }
  return { version: 1, sequence, timestampMs, type: event.type, correlation, fields };
}

/** Derived metrics; units and workload identity stay explicit and never affect execution policy. */
export class PerformanceMeasurements {
  private readonly clock: () => number;
  private readonly attempts = new Map<string, { started: number; responseStarted?: number; firstToken?: number; completedAt?: number; hadToolCalls: boolean }>();
  private readonly compactions = new Map<string, number>();
  private readonly tools = new Map<string, number>();
  private readonly hooks = new Map<string, number>();
  private readonly memories = new Map<string, number>();
  private readonly contexts = new Map<string, number>();

  constructor(clock: () => number = Date.now) { this.clock = clock; }

  observe(session: Session, event: ApplicationEvent, workload = 'agent-loop'): Measurement[] {
    const now = this.clock();
    const turnId = turnFor(session, event) ?? 'unknown';
    const key = `${session.id}:${turnId}`;
    const result: Measurement[] = [];
    const add = (name: string, value: number, unit: Measurement['unit'], fields?: Measurement['fields']) => result.push({ workload, name, value: Math.floor(value), unit, ...(fields === undefined ? {} : { fields }) });
    if (event.type === 'context.assembled') {
      add('provider.context.size', event.diagnostics.estimatedTokens, 'tokens', { budget: event.diagnostics.providerInputBudget, softPressure: event.diagnostics.softPressure });
      if (this.contexts.has(key)) add('provider.context.growth', Math.abs(event.diagnostics.estimatedTokens - this.contexts.get(key)!), 'tokens', { increased: event.diagnostics.estimatedTokens >= this.contexts.get(key)! });
      this.contexts.set(key, event.diagnostics.estimatedTokens);
    }
    if (event.type === 'provider.attempt.started') this.attempts.set(`${key}:${event.attemptId}`, { started: now, hadToolCalls: false });
    const attempt = [...this.attempts.entries()].reverse().find(([id]) => id.startsWith(`${key}:`));
    if (attempt && event.type === 'provider.response.started' && attempt[1].responseStarted === undefined) { attempt[1].responseStarted = now; add('provider.time_to_response_started', now - attempt[1].started, 'ms'); }
    if (attempt && event.type === 'provider.text.delta' && attempt[1].firstToken === undefined) { attempt[1].firstToken = now; add('provider.time_to_first_token', now - attempt[1].started, 'ms'); }
    if (attempt && event.type === 'provider.tool.call') attempt[1].hadToolCalls = true;
    if (attempt && event.type === 'provider.response.completed') {
      attempt[1].completedAt = now;
      add('provider.attempt.latency', now - attempt[1].started, 'ms');
      if (!attempt[1].hadToolCalls) add('final_response.eligibility_latency', now - attempt[1].started, 'ms');
    }
    if (attempt && event.type === 'assistant.response.completed' && !attempt[1].hadToolCalls && attempt[1].completedAt !== undefined) add('final_response.commit_latency', now - attempt[1].completedAt, 'ms');
    if (event.type === 'context.compaction.started') this.compactions.set(key, now);
    if ((event.type === 'context.compaction.completed' || event.type === 'context.compaction.failed') && this.compactions.has(key)) add('context.compaction.cost', now - this.compactions.get(key)!, 'ms');
    if (event.type === 'tool.requested') this.tools.set(`${key}:${event.callId}`, now);
    if (event.type === 'provider.attempt.started' && this.tools.has(key)) { add('tool_loop.latency', now - this.tools.get(key)!, 'ms'); this.tools.delete(key); }
    if ((event.type === 'tool.completed' || event.type === 'tool.failed') && this.tools.has(`${key}:${event.callId}`)) { this.tools.set(key, this.tools.get(`${key}:${event.callId}`)!); this.tools.delete(`${key}:${event.callId}`); }
    if (event.type === 'tool.completed' && event.name === 'run_process' && event.result.ok && event.result.value && typeof event.result.value === 'object' && !Array.isArray(event.result.value)) {
      const cleanup = (event.result.value as Record<string, unknown>).cleanup;
      if (cleanup && typeof cleanup === 'object' && !Array.isArray(cleanup)) {
        const detail = cleanup as Record<string, unknown>;
        if (typeof detail.durationMs === 'number') add('process.cleanup.duration', detail.durationMs, 'ms', { outcome: typeof detail.outcome === 'string' ? detail.outcome : null });
      }
    }
    if (event.type === 'hook.started') this.hooks.set(`${key}:${event.hookId}`, now);
    if (event.type === 'hook.completed' && this.hooks.has(`${key}:${event.hookId}`)) add('hook.overhead', now - this.hooks.get(`${key}:${event.hookId}`)!, 'ms', { status: event.status });
    if (event.type === 'turn.started') { const bytes = process.memoryUsage().rss; this.memories.set(key, bytes); add('memory.snapshot', bytes, 'bytes'); }
    if ((event.type === 'turn.completed' || event.type === 'turn.failed' || event.type === 'turn.cancelled') && this.memories.has(key)) { const bytes = process.memoryUsage().rss; add('memory.growth', bytes - this.memories.get(key)!, 'bytes'); }
    return result;
  }
}

export class DiagnosticSink implements DiagnosticObserver {
  readonly root: string;
  private readonly maxBytes: number;
  private readonly maxFiles: number;
  private readonly clock: () => number;
  private readonly measurements: PerformanceMeasurements;
  private readonly attempts = new Map<string, string>();
  private sequence = 0;
  private pending: Promise<void> = Promise.resolve();
  private degraded = false;
  private failures = 0;

  constructor(options: DiagnosticSinkOptions = {}) {
    this.root = options.root ?? join(resolveGeorgeStateRoot(), 'diagnostics');
    this.maxBytes = options.maxBytes ?? DEFAULT_MAX_BYTES;
    this.maxFiles = options.maxFiles ?? DEFAULT_MAX_FILES;
    if (!Number.isInteger(this.maxBytes) || this.maxBytes < 1024 || !Number.isInteger(this.maxFiles) || this.maxFiles < 1) throw new Error('Diagnostic retention limits must be positive bounded integers.');
    this.clock = options.clock ?? Date.now;
    this.measurements = new PerformanceMeasurements(this.clock);
  }

  observe(session: Session, event: ApplicationEvent): void {
    const timestampMs = this.clock();
    this.enqueue(eventRecord(session, event, ++this.sequence, timestampMs, this.attempts));
    for (const measurement of this.measurements.observe(session, event)) this.measure(measurement);
  }

  measure(measurement: Measurement): void {
    if (!Number.isFinite(measurement.value) || !measurement.workload || !measurement.name) return;
    const fields: Record<string, string | number | boolean | null> = { workload: bounded(measurement.workload, 128), name: bounded(measurement.name, 128), value: Math.floor(measurement.value), unit: measurement.unit };
    for (const [key, value] of Object.entries(measurement.fields ?? {}).slice(0, 16)) {
      if (!/^[A-Za-z][A-Za-z0-9_.-]{0,63}$/.test(key)) continue;
      if (typeof value === 'string') fields[key] = bounded(value, 128);
      else if (typeof value === 'number' && Number.isFinite(value)) fields[key] = Math.floor(value);
      else if (typeof value === 'boolean' || value === null) fields[key] = value;
    }
    this.enqueue({ version: 1, sequence: ++this.sequence, timestampMs: this.clock(), type: 'measurement', correlation: { sessionId: 'derived' }, fields });
  }

  status(): Readonly<{ degraded: boolean; failures: number }> { return { degraded: this.degraded, failures: this.failures }; }
  async flush(): Promise<void> { await this.pending; }
  async logBytes(): Promise<number> { await this.flush(); const sizes = await Promise.all(Array.from({ length: this.maxFiles }, (_, index) => stat(`${join(this.root, 'diagnostics.ndjson')}${index === 0 ? '' : `.${index}`}`).then((item) => item.size).catch(() => 0))); return sizes.reduce((sum, size) => sum + size, 0); }

  private enqueue(record: DiagnosticRecord): void {
    const line = `${JSON.stringify(record)}\n`;
    this.pending = this.pending.then(() => this.write(line)).catch(() => { this.degraded = true; this.failures = Math.min(1_000_000, this.failures + 1); });
  }

  private async write(line: string): Promise<void> {
    const path = join(this.root, 'diagnostics.ndjson');
    await mkdir(this.root, { recursive: true });
    const size = await stat(path).then((item) => item.size).catch(() => 0);
    if (size > 0 && size + Buffer.byteLength(line, 'utf8') > this.maxBytes) await this.rotate(path);
    await appendFile(path, line, 'utf8');
  }

  private async rotate(path: string): Promise<void> {
    for (let index = this.maxFiles - 1; index >= 1; index -= 1) {
      const target = `${path}.${index}`;
      if (index === this.maxFiles - 1) await rm(target, { force: true });
      else await rename(`${path}.${index}`, target).catch((error: NodeJS.ErrnoException) => { if (error.code !== 'ENOENT') throw error; });
    }
    await rename(path, `${path}.1`).catch((error: NodeJS.ErrnoException) => { if (error.code !== 'ENOENT') throw error; });
  }
}

export function memorySnapshot(workload: string, beforeBytes?: number): Measurement {
  const bytes = process.memoryUsage().rss;
  return { workload, name: beforeBytes === undefined ? 'memory.snapshot' : 'memory.growth', value: beforeBytes === undefined ? bytes : bytes - beforeBytes, unit: 'bytes' };
}

/** Storage measurements are explicit snapshots; callers compare repeated fixture runs rather than infer a threshold. */
export async function storageSnapshot(workload: string, name: 'durable_session.size' | 'diagnostic_log.size', path: string): Promise<Measurement> {
  return { workload, name, value: await stat(path).then((item) => item.size).catch(() => 0), unit: 'bytes' };
}
