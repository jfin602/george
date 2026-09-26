import type { ApplicationEvent, ProgressCategory, WorkCategory, WorkDetails, WorkItem, WorkStatus } from '../core/index.ts';

const MAX_MESSAGE_BYTES = 240;
const MAX_DETAIL_BYTES = 1_024;
const DEFAULT_MAX_WORK_ITEMS = 128;
const DEFAULT_MAX_PROGRESS = 64;

export type WorkProjectionOptions = Readonly<{ maxWorkItems?: number; maxProgress?: number; clock?: () => number }>;

function bounded(value: string, limit = MAX_MESSAGE_BYTES): string {
  return Buffer.byteLength(value, 'utf8') <= limit ? value : `${Buffer.from(value, 'utf8').subarray(0, limit - 3).toString('utf8')}...`;
}

function text(value: unknown, limit = MAX_DETAIL_BYTES): string | undefined {
  return typeof value === 'string' && !value.includes('\0') ? bounded(value, limit) : undefined;
}

function object(arguments_: string): Record<string, unknown> {
  try {
    const value: unknown = JSON.parse(arguments_);
    return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
  } catch { return {}; }
}

function argv(value: unknown): readonly string[] | undefined {
  return Array.isArray(value) && value.length <= 64 && value.every((item) => text(item) !== undefined)
    ? value.map((item) => text(item)!) : undefined;
}

function valueSummary(value: unknown): unknown {
  if (value === null) return null;
  if (typeof value === 'string') return text(value, 160) ?? { type: 'string' };
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'boolean') return value;
  if (Array.isArray(value)) return value.length <= 8 && value.every((item) => typeof item === 'string' && text(item, 160) !== undefined)
    ? value.map((item) => text(item, 160)!)
    : { type: 'array', count: Math.min(value.length, 128) };
  return { type: Array.isArray(value) ? 'array' : typeof value };
}

function requestedArguments(name: string, arguments_: string): string {
  let value: unknown;
  try { value = JSON.parse(arguments_); } catch { return 'malformed JSON'; }
  if (!value || typeof value !== 'object' || Array.isArray(value)) return JSON.stringify({ type: Array.isArray(value) ? 'array' : value === null ? 'null' : typeof value });
  const source = value as Record<string, unknown>;
  const fields = name === 'run_process' ? ['executable', 'arguments', 'cwd', 'timeoutMs']
    : name === 'search_text' ? ['query', 'path']
      : name === 'apply_patch' ? ['path', 'edits']
        : ['path'];
  const detail: Record<string, unknown> = {};
  for (const field of fields) {
    if (!(field in source)) continue;
    if ((name === 'write_file' && field === 'content') || (name === 'apply_patch' && field === 'edits')) {
      detail[field] = name === 'apply_patch' && Array.isArray(source[field]) ? { count: Math.min(source[field].length, 128) } : { redacted: true };
    } else detail[field] = valueSummary(source[field]);
  }
  const unexpected = Object.keys(source)
    .filter((key) => !fields.includes(key) && key !== 'content' && key !== 'expectedSha256')
    .slice(0, 8)
    .map((key) => bounded(key, 64));
  if (unexpected.length > 0) detail.unexpected = unexpected;
  return bounded(JSON.stringify(detail), 480);
}

function detailsFor(name: string, arguments_: string): WorkDetails {
  const value = object(arguments_);
  const path = text(value.path);
  if (name === 'run_process') return {
    ...(text(value.executable) === undefined ? {} : { executable: text(value.executable) }),
    ...(argv(value.arguments) === undefined ? {} : { argv: argv(value.arguments) }),
    ...(text(value.cwd) === undefined ? { cwd: '.' } : { cwd: text(value.cwd) }),
    ...(typeof value.timeoutMs === 'number' && Number.isInteger(value.timeoutMs) && value.timeoutMs > 0 ? { timeoutMs: value.timeoutMs } : {}),
    requestedArguments: requestedArguments(name, arguments_),
  };
  return {
    ...((path === undefined || path === '') && name === 'list_directory' ? { path: '.' } : path === undefined ? {} : { path }),
    ...(name === 'search_text' && text(value.query) !== undefined ? { query: text(value.query) } : {}),
    requestedArguments: requestedArguments(name, arguments_),
  };
}

function category(name: string): WorkCategory {
  if (name === 'write_file' || name === 'apply_patch' || name === 'create_directory') return 'editing';
  if (name === 'run_process') return 'process';
  return 'inspection';
}

function requested(name: string, details: WorkDetails): string {
  const path = details.path ?? '.';
  switch (name) {
    case 'read_file': return `Read ${path}`;
    case 'list_directory': return `List ${path}`;
    case 'search_text': return `Search ${details.query ?? 'text'} in ${path}`;
    case 'git_status': return 'Inspect Git status';
    case 'git_diff': return 'Inspect Git diff';
    case 'write_file': return `Write ${path}`;
    case 'apply_patch': return `Patch ${path}`;
    case 'create_directory': return `Create directory ${path}`;
    case 'run_process': return `Run ${details.executable ?? 'process'}`;
    default: return `Run ${bounded(name)}`;
  }
}

function resultDetails(name: string, value: unknown, details: WorkDetails): WorkDetails {
  const result = value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
  const number = (key: string): number | undefined => typeof result[key] === 'number' && Number.isFinite(result[key]) ? result[key] : undefined;
  const bool = (key: string): boolean | undefined => typeof result[key] === 'boolean' ? result[key] : undefined;
  const { requestedArguments: _requestedArguments, ...base } = details;
  if (name === 'read_file' || name === 'write_file' || name === 'apply_patch') {
    return { ...base, ...(number('bytes') === undefined ? {} : { bytes: number('bytes') }), ...(bool('truncated') === undefined ? {} : { truncated: bool('truncated') }) };
  }
  if (name === 'create_directory') return { ...base, ...(number('createdDirectories') === undefined ? {} : { count: number('createdDirectories') }) };
  if (name === 'list_directory') return { ...base, ...(Array.isArray(result.entries) ? { count: result.entries.length } : {}), ...(bool('truncated') === undefined ? {} : { truncated: bool('truncated') }) };
  if (name === 'search_text') return { ...base, ...(Array.isArray(result.matches) ? { count: result.matches.length } : {}), ...(number('scannedFiles') === undefined ? {} : { scannedFiles: number('scannedFiles') }), ...(number('scannedBytes') === undefined ? {} : { scannedBytes: number('scannedBytes') }), ...(bool('truncated') === undefined ? {} : { truncated: bool('truncated') }) };
  if (name === 'git_status' || name === 'git_diff') return { ...base, ...(number('exitCode') === undefined ? {} : { exitCode: number('exitCode') }), ...(bool('stdoutTruncated') || bool('stderrTruncated') ? { truncated: true } : {}) };
  if (name === 'run_process') return {
    ...base, ...(text(result.executable) === undefined ? {} : { executable: text(result.executable) }), ...(argv(result.arguments) === undefined ? {} : { argv: argv(result.arguments) }),
    ...(text(result.cwd) === undefined ? {} : { cwd: text(result.cwd) }), ...(number('exitCode') === undefined ? {} : { exitCode: number('exitCode') }),
    ...(result.signal === null || text(result.signal) !== undefined ? { signal: result.signal === null ? null : text(result.signal) } : {}),
    ...(result.outcome === 'completed' || result.outcome === 'failed' || result.outcome === 'timed_out' || result.outcome === 'spawn_failed' ? { outcome: result.outcome } : {}),
    ...(bool('stdoutTruncated') || bool('stderrTruncated') ? { truncated: true } : {}),
  };
  return base;
}

function completed(name: string, details: WorkDetails): string {
  const suffix = details.truncated ? ', truncated' : '';
  if (name === 'read_file') return `Read ${details.path ?? 'file'} (${details.bytes ?? 0} bytes${suffix})`;
  if (name === 'list_directory') return `Listed ${details.path ?? '.'} (${details.count ?? 0} entries${suffix})`;
  if (name === 'search_text') return `Searched ${details.path ?? '.'} (${details.count ?? 0} matches in ${details.scannedFiles ?? 0} files${suffix})`;
  if (name === 'write_file') return `Wrote ${details.path ?? 'file'} (${details.bytes ?? 0} bytes)`;
  if (name === 'apply_patch') return `Patched ${details.path ?? 'file'} (${details.bytes ?? 0} bytes)`;
  if (name === 'create_directory') return `Directory ${details.path ?? '.'} ready (${details.count ?? 0} created)`;
  if (name === 'run_process') return `Ran ${details.executable ?? 'process'} (${details.outcome ?? 'completed'}${details.exitCode === undefined || details.exitCode === null ? '' : `, exit ${details.exitCode}`}${suffix})`;
  if (name === 'git_status') return `Inspected Git status${details.exitCode === undefined || details.exitCode === 0 ? '' : ` (exit ${details.exitCode})`}`;
  if (name === 'git_diff') return `Inspected Git diff${details.exitCode === undefined || details.exitCode === 0 ? '' : ` (exit ${details.exitCode})`}`;
  return `Completed ${bounded(name)}`;
}

function terminalFromResult(name: string, details: WorkDetails): WorkStatus {
  return name === 'run_process' && details.outcome !== undefined && details.outcome !== 'completed' ? 'failed' : 'succeeded';
}

/** Projects authoritative events into bounded, presentation-independent work state. */
export class WorkProjection {
  private readonly items = new Map<string, WorkItem>();
  private readonly maxWorkItems: number;
  private readonly maxProgress: number;
  private readonly clock: () => number;
  private readonly started = new Map<string, number>();
  private latestActivity: { turnId?: string; category: WorkCategory; message: string } | undefined;
  private progressItems: Extract<ApplicationEvent, { type: 'progress.milestone' }>[] = [];

  constructor(options: WorkProjectionOptions = {}) {
    this.maxWorkItems = options.maxWorkItems ?? DEFAULT_MAX_WORK_ITEMS;
    this.maxProgress = options.maxProgress ?? DEFAULT_MAX_PROGRESS;
    this.clock = options.clock ?? performance.now.bind(performance);
    if (!Number.isInteger(this.maxWorkItems) || this.maxWorkItems < 1 || !Number.isInteger(this.maxProgress) || this.maxProgress < 1) throw new Error('Work projection limits must be positive integers.');
  }

  private activityEvent(turnId: string | undefined, category: WorkCategory, message: string): ApplicationEvent {
    this.latestActivity = { ...(turnId === undefined ? {} : { turnId }), category, message: bounded(message) };
    return { type: 'activity.updated', ...this.latestActivity };
  }

  private progressEvent(turnId: string, category: ProgressCategory, message: string): ApplicationEvent[] {
    const event = { type: 'progress.milestone' as const, turnId, category, message: bounded(message) };
    const previous = this.progressItems.at(-1);
    if ((previous && previous.turnId === event.turnId && previous.category === event.category && previous.message === event.message) || this.progressItems.length >= this.maxProgress) return [];
    this.progressItems.push(event);
    return [event];
  }

  private update(item: WorkItem): ApplicationEvent[] {
    const exists = this.items.has(item.id);
    if (!exists && this.items.size >= this.maxWorkItems) return [];
    const safe = { ...item, summary: bounded(item.summary), details: item.details };
    this.items.set(item.id, safe);
    return [{ type: 'work.updated', item: safe }];
  }

  private begin(id: string): void { if (!this.started.has(id)) this.started.set(id, this.clock()); }
  private elapsed(id: string): number | undefined {
    const started = this.started.get(id);
    if (started === undefined) return undefined;
    this.started.delete(id);
    return Math.max(0, Math.round(this.clock() - started));
  }

  private tool(turnId: string, callId: string, name: string, change: Partial<Pick<WorkItem, 'status' | 'summary' | 'details' | 'elapsedMs'>> = {}): ApplicationEvent[] {
    const id = `${turnId}:tool:${callId}`;
    const previous = this.items.get(id);
    const details = change.details ?? previous?.details ?? {};
    return this.update({ id, turnId, operationId: callId, category: category(name), status: change.status ?? previous?.status ?? 'requested', summary: change.summary ?? previous?.summary ?? requested(name, details), details, ...(change.elapsedMs === undefined ? {} : { elapsedMs: change.elapsedMs }) });
  }

  observe(event: ApplicationEvent): ApplicationEvent[] {
    switch (event.type) {
      case 'turn.started': return [this.activityEvent(event.turnId, 'context', 'Assembling context'), ...this.progressEvent(event.turnId, 'context', 'Assembling context')];
      case 'context.source': {
        const id = `${event.turnId}:context:${event.sourceId}`;
        if (event.status === 'loading') this.begin(id);
        const status: WorkStatus = event.status === 'loading' ? 'running' : event.status === 'loaded' ? 'succeeded' : event.status === 'oversized' ? 'skipped' : event.status;
        const summary = event.status === 'loading' ? `Loading context source ${event.sourceId}` : `Context source ${event.sourceId}: ${event.status}`;
        const elapsedMs = event.status === 'loading' ? undefined : this.elapsed(id);
        return [this.activityEvent(event.turnId, 'context', summary), ...this.update({ id, turnId: event.turnId, operationId: event.sourceId, category: 'context', status, summary, details: event.bytes === undefined ? {} : { bytes: event.bytes }, ...(elapsedMs === undefined ? {} : { elapsedMs }) })];
      }
      case 'context.assembled': return [this.activityEvent(event.turnId, 'context', 'Context assembled'), ...this.progressEvent(event.turnId, 'context', 'Context assembled')];
      case 'provider.response.started': return [this.activityEvent(undefined, 'inspection', 'Thinking...')];
      case 'provider.error': return [this.activityEvent(undefined, 'recovery', 'Provider failed')];
      case 'recovery.decision': {
        const status: WorkStatus = event.outcome === 'confirmed_complete' ? 'succeeded' : event.outcome === 'confirmed_incomplete' ? 'missing' : 'interrupted';
        const summary = `Recovery ${event.outcome.replace('_', ' ')}: ${event.name ?? event.kind}`;
        return [this.activityEvent(event.turnId, 'recovery', summary), ...this.progressEvent(event.turnId, 'recovery', summary), ...this.update({ id: `${event.turnId}:recovery:${event.callId ?? event.kind}`, turnId: event.turnId, operationId: event.callId ?? event.kind, category: 'recovery', status, summary, details: { error: bounded(event.evidence) } })];
      }
      case 'tool.requested': {
        const details = detailsFor(event.name, event.arguments);
        return [this.activityEvent(event.turnId, category(event.name), requested(event.name, details)), ...this.tool(event.turnId, event.callId, event.name, { details, status: 'requested', summary: requested(event.name, details) })];
      }
      case 'tool.started': { const id = `${event.turnId}:tool:${event.callId}`; this.begin(id); return [this.activityEvent(event.turnId, category(event.name), `Running ${event.name}`), ...this.tool(event.turnId, event.callId, event.name, { status: 'running' })]; }
      case 'approval.requested': { const id = `${event.turnId}:tool:${event.callId}`; this.begin(id); return [this.activityEvent(event.turnId, 'approval', `Awaiting approval for ${event.request.toolName}`), ...this.tool(event.turnId, event.callId, event.request.toolName, { status: 'waiting', summary: `Awaiting approval for ${event.request.toolName}` })]; }
      case 'approval.allowed': return [this.activityEvent(event.turnId, 'approval', `Approval granted for ${event.request.toolName}`), ...this.tool(event.turnId, event.callId, event.request.toolName, { status: 'requested', summary: `Approval granted for ${event.request.toolName}` })];
      case 'approval.denied': { const elapsedMs = this.elapsed(`${event.turnId}:tool:${event.callId}`); return [this.activityEvent(event.turnId, 'approval', `Approval denied for ${event.request.toolName}`), ...this.tool(event.turnId, event.callId, event.request.toolName, { status: 'denied', summary: `Approval denied for ${event.request.toolName}`, ...(elapsedMs === undefined ? {} : { elapsedMs }) })]; }
      case 'tool.completed': {
        const existing = this.items.get(`${event.turnId}:tool:${event.callId}`);
        const details = resultDetails(event.name, event.result.value, existing?.details ?? {});
        const status = terminalFromResult(event.name, details);
        const elapsedMs = this.elapsed(`${event.turnId}:tool:${event.callId}`);
        return [this.activityEvent(event.turnId, category(event.name), completed(event.name, details)), ...this.tool(event.turnId, event.callId, event.name, { status, details, summary: completed(event.name, details), ...(elapsedMs === undefined ? {} : { elapsedMs }) }), ...(category(event.name) === 'inspection' ? this.progressEvent(event.turnId, 'inspection', 'Repository inspection completed') : category(event.name) === 'editing' ? this.progressEvent(event.turnId, 'editing', 'Repository editing completed') : [])];
      }
      case 'tool.failed': {
        const status: WorkStatus = event.result.error.code === 'denied' ? 'denied' : event.result.error.code === 'cancelled' ? 'cancelled' : 'failed';
        const summary = `${requested(event.name, this.items.get(`${event.turnId}:tool:${event.callId}`)?.details ?? {})} ${status}: ${bounded(event.result.error.message)}`;
        const elapsedMs = this.elapsed(`${event.turnId}:tool:${event.callId}`);
        return [this.activityEvent(event.turnId, category(event.name), summary), ...this.tool(event.turnId, event.callId, event.name, { status, summary, details: { ...(this.items.get(`${event.turnId}:tool:${event.callId}`)?.details ?? {}), error: bounded(event.result.error.message) }, ...(elapsedMs === undefined ? {} : { elapsedMs }) })];
      }
      case 'validation.started': { const id = `${event.turnId}:validation:${event.callId}`; this.begin(id); return [this.activityEvent(event.turnId, 'validation', `Validating: ${event.label}`), ...this.progressEvent(event.turnId, 'validation', `Validating: ${event.label}`), ...this.update({ id, turnId: event.turnId, operationId: event.callId, category: 'validation', status: 'running', summary: `Validate ${bounded(event.label)}`, details: {} })]; }
      case 'validation.completed': {
        const status: WorkStatus = event.status === 'passed' ? 'succeeded' : event.status;
        const details: WorkDetails = { exitCode: event.exitCode, signal: event.signal, ...(event.outcome === undefined ? {} : { outcome: event.outcome }), ...(event.stdoutTruncated || event.stderrTruncated ? { truncated: true } : {}), ...(event.error === undefined ? {} : { error: bounded(event.error.message) }) };
        const id = `${event.turnId}:validation:${event.callId}`; const elapsedMs = this.elapsed(id);
        return [this.activityEvent(event.turnId, 'validation', `Validation ${event.status}`), ...this.update({ id, turnId: event.turnId, operationId: event.callId, category: 'validation', status, summary: `Validation ${event.status}`, details, ...(elapsedMs === undefined ? {} : { elapsedMs }) }), ...(status === 'failed' ? this.progressEvent(event.turnId, 'recovery', 'Validation failed; recovery may be needed') : this.progressEvent(event.turnId, 'validation', 'Validation completed'))];
      }
      case 'workflow.completed': {
        const status: WorkStatus = event.completion.terminalState === 'completed' ? 'succeeded' : event.completion.terminalState === 'budget_exhausted' ? 'failed' : event.completion.terminalState;
        return [this.activityEvent(event.turnId, 'completion', `Workflow ${event.completion.terminalState}`), ...this.progressEvent(event.turnId, 'completion', `Workflow ${event.completion.terminalState}`), ...this.update({ id: `${event.turnId}:completion`, turnId: event.turnId, operationId: 'completion', category: 'completion', status, summary: `Workflow ${event.completion.terminalState}`, details: { count: event.completion.changes.length, ...(event.completion.timing === undefined ? {} : { timing: event.completion.timing }) }, ...(event.completion.timing === undefined ? {} : { elapsedMs: event.completion.timing.totalMs }) })];
      }
      case 'turn.cancelled': return this.stopTurn(event.turnId, 'cancelled', 'Turn cancelled');
      case 'turn.failed': return this.stopTurn(event.turnId, 'interrupted', 'Turn failed; recovery may be needed');
      case 'turn.completed': return [this.activityEvent(event.turnId, 'completion', 'Turn completed'), ...this.progressEvent(event.turnId, 'completion', 'Turn completed')];
      default: return [];
    }
  }

  private stopTurn(turnId: string, status: 'cancelled' | 'interrupted', message: string): ApplicationEvent[] {
    const updates: ApplicationEvent[] = [this.activityEvent(turnId, 'recovery', message), ...this.progressEvent(turnId, 'recovery', message), ...this.update({ id: `${turnId}:recovery`, turnId, operationId: 'recovery', category: 'recovery', status, summary: message, details: {} })];
    for (const item of this.items.values()) if (item.turnId === turnId && ['requested', 'running', 'waiting'].includes(item.status)) { const elapsedMs = this.elapsed(item.id); updates.push(...this.update({ ...item, status, summary: `${item.summary} (${status})`, ...(elapsedMs === undefined ? {} : { elapsedMs }) })); }
    return updates;
  }

  snapshot(): Readonly<{ activity?: { turnId?: string; category: WorkCategory; message: string }; progress: readonly Extract<ApplicationEvent, { type: 'progress.milestone' }>[]; work: readonly WorkItem[] }> {
    return { ...(this.latestActivity === undefined ? {} : { activity: this.latestActivity }), progress: [...this.progressItems], work: [...this.items.values()] };
  }
}
