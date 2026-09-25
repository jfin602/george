import { randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { isAbsolute, join, relative, resolve } from 'node:path';

import type { StructuredTaskApplicationService, StructuredTaskStackApplicationService } from '../application/index.ts';
import { asGeorgeError, type ApprovalPort, type ApplicationEvent, type RunBudgetDimension, type RunBudgetSnapshot, type Session, type ToolEffect } from '../core/index.ts';
import { projectStackState, projectTaskState, sanitizeTaskEvidence, type StackStateProjection, type TaskStateProjection } from '../tasks/index.ts';

const MAX_LIVE_EVENTS = 4_096;
const MAX_ARGUMENT_BYTES = 2_048;
const SHA256 = /^[0-9a-f]{64}$/;

export type LiveWorkError = Readonly<{ code: string; message: string }>;

export type LiveWorkMetrics = Readonly<{
  providerAttempts: number;
  providerRounds: number;
  retries: number;
  providerInputTokens: number | null;
  providerOutputTokens: number | null;
  toolCalls: number;
  contextAssemblies: number;
  sandboxedProcessCalls: number;
  taskUpdates: number;
  stackUpdates: number;
}>;

export type LiveWorkToolCall = Readonly<{
  callId: string;
  name: string;
  requestedArguments: string;
  effect: ToolEffect | null;
  terminalState: 'succeeded' | 'failed' | 'denied' | 'unavailable';
}>;

export type LiveWorkTrace = Readonly<{
  terminalStatus: string;
  terminalError: LiveWorkError | null;
  observerError: LiveWorkError | null;
  taskState: TaskStateProjection | null;
  stackState: StackStateProjection | null;
  metrics: LiveWorkMetrics;
  toolCalls: readonly LiveWorkToolCall[];
  mutations: readonly Readonly<{ callId: string; tool: 'write_file' | 'apply_patch'; path: string; bytes: number | null; sha256: string }>[];
  validations: readonly Readonly<{ callId: string; status: 'passed' | 'failed' | 'denied' | 'cancelled'; exitCode: number | null; outcome: string | null }>[];
  correctionCount: number;
  contexts: readonly Readonly<{ profileId: string | null; attemptedProfileIds: readonly string[]; promotionReasons: readonly string[]; estimatedTokens: number | null; providerInputBudget: number | null; remainingHeadroom: number | null }>[];
  budgets: Readonly<{
    latest: readonly Readonly<{ runId: string; snapshot: RunBudgetSnapshot }>[];
    pressure: readonly Readonly<{ runId: string; dimensions: readonly RunBudgetDimension[] }>[];
    exhaustion: readonly Readonly<{ runId: string; dimension: RunBudgetDimension }>[];
    taskExhausted: boolean;
    stageExhaustion: readonly Readonly<{ turnId: string; message: string }>[];
  }>;
  timing: Readonly<{ totalMs: number | null; workflows: readonly Readonly<{ turnId: string; totalMs: number | null }>[] }>;
  hiddenAcceptance: 'passed' | 'failed' | 'not_run';
  humanInterventions: number;
  eventsOmitted: number;
}>;

export type LiveWorkResult = Readonly<{
  attemptId: string;
  qualifying: boolean;
  terminalStatus: string;
  terminalError: LiveWorkError | null;
  observerError: LiveWorkError | null;
  hiddenAcceptance: 'passed' | 'failed' | 'not_run';
  metrics: LiveWorkMetrics;
  trace: LiveWorkTrace;
  /** Bounded operational events; provider text and submitted/assistant bodies are deliberately omitted. */
  events: readonly ApplicationEvent[];
}>;

export type LiveWorkArtifactEnvelope = Readonly<{
  schemaVersion: 1;
  attemptId: string;
  runtime: Readonly<{ node: string; platform: string; arch: string }>;
  workspace: string;
  qualifying: boolean;
  terminalStatus: string;
  terminalError: LiveWorkError | null;
  observerError: LiveWorkError | null;
  hiddenAcceptance: LiveWorkResult['hiddenAcceptance'];
  humanInterventions: number;
  taskState: TaskStateProjection | null;
  stackState: StackStateProjection | null;
  eventEvidence: readonly Readonly<Record<string, unknown>>[];
}>;

type Common = Readonly<{
  attemptId: string;
  humanInterventions: number;
  session: Session;
  acceptancePath: string;
  runHiddenAcceptance: () => Promise<boolean>;
  dependencyInstallation?: Readonly<{ authorized: boolean; run: () => Promise<void> }>;
  onEvent?: (event: ApplicationEvent) => void | Promise<void>;
}>;

export type LiveWorkSubmission = Common & (
  | Readonly<{ kind: 'stack'; service: StructuredTaskStackApplicationService; prompts: readonly string[] }>
  | Readonly<{ kind: 'single'; service: StructuredTaskApplicationService; prompt: string }>
);

/** Frozen Phase 9 edit gate only: exact target, ordinary mutation, exact validation. */
export function createFrozenEditQualificationApproval(options: Readonly<{
  targetPath: string;
  validation: Readonly<{ executable: string; arguments: readonly string[] }>;
}>): ApprovalPort {
  return { request: async (request) => {
    if (request.mutation !== undefined) return 'deny';
    if ((request.toolName === 'write_file' || request.toolName === 'apply_patch')
      && request.execution.effect === 'workspace_mutation'
      && request.process === undefined
      && request.target?.outsideWorkspace !== true
      && request.target?.path === options.targetPath) return 'allow_once';
    if (request.toolName === 'run_process'
      && (request.execution.effect === 'host_process' || request.execution.effect === 'sandboxed_workspace_process')
      && request.target === undefined
      && request.process?.executable === options.validation.executable
      && request.process.argv.length === options.validation.arguments.length
      && request.process.argv.every((value, index) => value === options.validation.arguments[index])) return 'allow_once';
    return 'deny';
  } };
}

function outsideWorkspace(workspace: string, path: string): boolean {
  const target = resolve(path);
  const pathFromWorkspace = relative(resolve(workspace), target);
  return isAbsolute(pathFromWorkspace) || pathFromWorkspace === '..' || pathFromWorkspace.startsWith(`..${process.platform === 'win32' ? '\\' : '/'}`);
}

const record = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
const number = (value: unknown): number | null => typeof value === 'number' && Number.isFinite(value) ? value : null;
const strings = (value: unknown): readonly string[] => Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string').map((item) => sanitizeTaskEvidence(item, 512).text) : [];

function safeArguments(value: unknown): string {
  if (typeof value !== 'string') return '[unavailable]';
  let diagnostic = value;
  try {
    const parsed: unknown = JSON.parse(value);
    const safe = (item: unknown, depth = 0): unknown => {
      if (depth > 4) return '[omitted nested value]';
      if (Array.isArray(item)) return item.slice(0, 64).map((entry) => safe(entry, depth + 1));
      if (!record(item)) return typeof item === 'string' ? sanitizeTaskEvidence(item, 512).text : item;
      return Object.fromEntries(Object.entries(item).slice(0, 64).map(([key, entry]) => {
        if (/authorization|cookie|credential|password|passwd|secret|token|api[-_]?(?:key|token)|private[-_]?key/i.test(key)) return [key, '[redacted]'];
        if (/^(?:content|text|patch)$/i.test(key) && typeof entry === 'string') return [key, `[omitted ${Buffer.byteLength(entry, 'utf8')} bytes]`];
        return [key, safe(entry, depth + 1)];
      }));
    };
    diagnostic = JSON.stringify(safe(parsed));
  } catch { /* Malformed provider arguments remain useful after bounded sanitization. */ }
  return sanitizeTaskEvidence(diagnostic, MAX_ARGUMENT_BYTES).text;
}

function safeError(error: unknown): LiveWorkError {
  const normalized = asGeorgeError(error);
  return Object.freeze({ code: sanitizeTaskEvidence(normalized.code, 128).text, message: sanitizeTaskEvidence(normalized.message, 1024).text });
}

function operationalEvent(event: ApplicationEvent): boolean {
  return event.type !== 'provider.text.delta' && event.type !== 'input.submitted' && event.type !== 'assistant.response.completed';
}

function metrics(events: readonly ApplicationEvent[]): LiveWorkMetrics {
  const completed = events.filter((event): event is Extract<ApplicationEvent, { type: 'provider.response.completed' }> => event.type === 'provider.response.completed');
  const input = completed.map((event) => number(event.usage?.inputTokens)).filter((value): value is number => value !== null);
  const output = completed.map((event) => number(event.usage?.outputTokens)).filter((value): value is number => value !== null);
  return {
    providerAttempts: events.filter((event) => event.type === 'provider.attempt.started').length,
    providerRounds: events.filter((event) => event.type === 'provider.response.completed' || event.type === 'provider.error').length,
    retries: events.filter((event) => event.type === 'provider.retry.scheduled').length,
    providerInputTokens: completed.length && input.length === completed.length ? input.reduce((total, value) => total + value, 0) : null,
    providerOutputTokens: completed.length && output.length === completed.length ? output.reduce((total, value) => total + value, 0) : null,
    toolCalls: events.filter((event) => event.type === 'tool.requested').length,
    contextAssemblies: events.filter((event) => event.type === 'context.assembled').length,
    sandboxedProcessCalls: events.filter((event) => event.type === 'tool.started' && event.execution?.effect === 'sandboxed_workspace_process').length,
    taskUpdates: events.filter((event) => event.type === 'task.updated').length,
    stackUpdates: events.filter((event) => event.type === 'stack.updated').length,
  };
}

/** Total, bounded derivation over the current event union; absent/future fields become unavailable evidence. */
export function extractLiveWorkTrace(options: Readonly<{
  events: readonly ApplicationEvent[];
  terminalStatus: string;
  terminalError?: LiveWorkError | null;
  observerError?: LiveWorkError | null;
  taskState?: Session['taskState'];
  stackState?: Session['stackState'];
  hiddenAcceptance: LiveWorkResult['hiddenAcceptance'];
  humanInterventions: number;
  totalMs?: number;
  eventsOmitted?: number;
}>): LiveWorkTrace {
  const terminalByCall = new Map<string, LiveWorkToolCall['terminalState']>();
  const effectByCall = new Map<string, ToolEffect>();
  for (const event of options.events) {
    if ((event.type === 'tool.started' || event.type === 'tool.completed' || event.type === 'tool.failed') && event.execution?.effect) effectByCall.set(event.callId, event.execution.effect);
    if (event.type === 'tool.completed' && terminalByCall.get(event.callId) !== 'denied') terminalByCall.set(event.callId, 'succeeded');
    else if (event.type === 'tool.failed' && terminalByCall.get(event.callId) !== 'denied') terminalByCall.set(event.callId, 'failed');
    else if (event.type === 'approval.denied') terminalByCall.set(event.callId, 'denied');
  }
  const toolCalls = options.events.filter((event): event is Extract<ApplicationEvent, { type: 'tool.requested' }> => event.type === 'tool.requested').map((event) => ({
    callId: event.callId,
    name: event.name,
    requestedArguments: safeArguments(event.arguments),
    effect: event.execution?.effect ?? effectByCall.get(event.callId) ?? null,
    terminalState: terminalByCall.get(event.callId) ?? 'unavailable',
  }));
  const mutations: { callId: string; tool: 'write_file' | 'apply_patch'; path: string; bytes: number | null; sha256: string }[] = options.events.flatMap((event) => {
    if (event.type !== 'tool.completed' || (event.name !== 'write_file' && event.name !== 'apply_patch')) return [];
    const value: unknown = event.result.value;
    if (!record(value) || typeof value.path !== 'string' || typeof value.sha256 !== 'string' || !SHA256.test(value.sha256)) return [];
    return [{ callId: event.callId, tool: event.name, path: sanitizeTaskEvidence(value.path, 1024).text, bytes: number(value.bytes), sha256: value.sha256 }];
  });
  const validations = options.events.flatMap((event) => event.type === 'validation.completed' ? [{ callId: event.callId, status: event.status, exitCode: number(event.exitCode), outcome: typeof event.outcome === 'string' ? event.outcome : null }] : []);
  const contexts = options.events.flatMap((event) => {
    if (event.type !== 'context.assembled') return [];
    const diagnostics: unknown = event.diagnostics;
    if (!record(diagnostics)) return [{ profileId: null, attemptedProfileIds: [], promotionReasons: [], estimatedTokens: null, providerInputBudget: null, remainingHeadroom: null }];
    return [{ profileId: typeof diagnostics.profileId === 'string' ? diagnostics.profileId : null, attemptedProfileIds: strings(diagnostics.attemptedProfileIds), promotionReasons: strings(diagnostics.promotionReasons), estimatedTokens: number(diagnostics.estimatedTokens), providerInputBudget: number(diagnostics.providerInputBudget), remainingHeadroom: number(diagnostics.remainingHeadroom) }];
  });
  const snapshots = new Map<string, RunBudgetSnapshot>();
  const pressure: { runId: string; dimensions: readonly RunBudgetDimension[] }[] = [];
  const exhaustion: { runId: string; dimension: RunBudgetDimension }[] = [];
  const stageExhaustion: { turnId: string; message: string }[] = [];
  const workflows: { turnId: string; totalMs: number | null }[] = [];
  for (const event of options.events) {
    if (event.type === 'reliability.run.started' || event.type === 'budget.state' || event.type === 'budget.pressure' || event.type === 'budget.exhausted') snapshots.set(event.runId, event.budget);
    if (event.type === 'budget.pressure') pressure.push({ runId: event.runId, dimensions: event.dimensions });
    else if (event.type === 'budget.exhausted') exhaustion.push({ runId: event.runId, dimension: event.dimension });
    else if (event.type === 'turn.failed' && event.error.code === 'budget') stageExhaustion.push({ turnId: event.turnId, message: sanitizeTaskEvidence(event.error.message, 512).text });
    else if (event.type === 'workflow.completed') workflows.push({ turnId: event.turnId, totalMs: number(event.completion.timing?.totalMs) });
  }
  let taskState: TaskStateProjection | null = null;
  let stackState: StackStateProjection | null = null;
  try { taskState = options.taskState ? projectTaskState(options.taskState) : null; } catch { /* Invalid partial state is not safe qualification evidence. */ }
  try { stackState = options.stackState ? projectStackState(options.stackState) : null; } catch { /* Invalid partial state is not safe qualification evidence. */ }
  return Object.freeze({
    terminalStatus: options.terminalStatus, terminalError: options.terminalError ?? null, observerError: options.observerError ?? null, taskState, stackState, metrics: Object.freeze(metrics(options.events)), toolCalls: Object.freeze(toolCalls), mutations: Object.freeze(mutations), validations: Object.freeze(validations), correctionCount: taskState?.corrections.length ?? 0, contexts: Object.freeze(contexts),
    budgets: Object.freeze({ latest: Object.freeze([...snapshots].map(([runId, snapshot]) => ({ runId, snapshot }))), pressure: Object.freeze(pressure), exhaustion: Object.freeze(exhaustion), taskExhausted: options.terminalStatus === 'budget_exhausted' || taskState?.status === 'budget_exhausted' || stackState?.status === 'budget_exhausted', stageExhaustion: Object.freeze(stageExhaustion) }),
    timing: Object.freeze({ totalMs: number(options.totalMs), workflows: Object.freeze(workflows) }), hiddenAcceptance: options.hiddenAcceptance, humanInterventions: options.humanInterventions, eventsOmitted: options.eventsOmitted ?? 0,
  });
}

/** Qualification observer: production services own all task parsing, sequencing, fail-stop, and resume behavior. */
export async function runLiveWorkInstrument(submission: LiveWorkSubmission): Promise<LiveWorkResult> {
  if (!submission.attemptId || Buffer.byteLength(submission.attemptId, 'utf8') > 256) throw new Error('Live qualification attempt ID is required and must be bounded.');
  if (!Number.isInteger(submission.humanInterventions) || submission.humanInterventions < 0) throw new Error('Human intervention count must be an explicit non-negative integer.');
  if (!outsideWorkspace(submission.session.workspace, submission.acceptancePath)) throw new Error('Hidden acceptance must remain outside the model-visible workspace.');
  if (submission.dependencyInstallation) {
    if (!submission.dependencyInstallation.authorized) throw new Error('Harness dependency installation requires deliberate authorization.');
    await submission.dependencyInstallation.run();
  }
  const started = performance.now();
  const events: ApplicationEvent[] = [];
  let eventsOmitted = 0;
  let observerError: LiveWorkError | null = null;
  const onEvent = async (event: ApplicationEvent) => {
    if (operationalEvent(event) && events.length < MAX_LIVE_EVENTS) events.push(event);
    else eventsOmitted += 1;
    if (submission.onEvent && observerError === null) {
      try { await submission.onEvent(event); } catch (error) { observerError = safeError(error); }
    }
  };
  let terminalStatus: string;
  let terminalError: LiveWorkError | null = null;
  try {
    if (submission.kind === 'stack') terminalStatus = (await submission.service.run({ session: submission.session, prompts: submission.prompts, onEvent })).state.status;
    else {
      await submission.service.run({ session: submission.session, input: submission.prompt, onEvent });
      terminalStatus = submission.session.taskState?.status ?? 'failed';
    }
  } catch (error) {
    terminalError = safeError(error);
    const observed = submission.kind === 'stack' ? submission.session.stackState?.status : submission.session.taskState?.status;
    terminalStatus = observed && !['pending', 'in_progress', 'completed'].includes(observed) ? observed : 'failed';
  }
  let hiddenAcceptance: LiveWorkResult['hiddenAcceptance'] = 'not_run';
  if (terminalError === null && terminalStatus === 'completed') hiddenAcceptance = await submission.runHiddenAcceptance() ? 'passed' : 'failed';
  const frozenEvents = Object.freeze([...events]);
  const trace = extractLiveWorkTrace({ events: frozenEvents, terminalStatus, terminalError, observerError, taskState: submission.session.taskState, stackState: submission.session.stackState, hiddenAcceptance, humanInterventions: submission.humanInterventions, totalMs: performance.now() - started, eventsOmitted });
  return Object.freeze({ attemptId: submission.attemptId, qualifying: terminalError === null && terminalStatus === 'completed' && hiddenAcceptance === 'passed', terminalStatus, terminalError, observerError, hiddenAcceptance, metrics: trace.metrics, trace, events: frozenEvents });
}

function eventEvidence(event: ApplicationEvent): Readonly<Record<string, unknown>> {
  const safe: Record<string, unknown> = { type: event.type };
  if ('turnId' in event && typeof event.turnId === 'string') safe.turnId = event.turnId;
  if ('runId' in event && typeof event.runId === 'string') safe.runId = event.runId;
  if ('callId' in event && typeof event.callId === 'string') safe.callId = event.callId;
  if ('name' in event && typeof event.name === 'string') safe.name = event.name;
  if ('status' in event && typeof event.status === 'string') safe.status = event.status;
  if (event.type === 'context.assembled') safe.diagnostics = { profileId: event.diagnostics?.profileId ?? null, attemptedProfileIds: event.diagnostics?.attemptedProfileIds ?? [], promotionReasons: event.diagnostics?.promotionReasons ?? [], estimatedTokens: event.diagnostics?.estimatedTokens ?? null, providerInputBudget: event.diagnostics?.providerInputBudget ?? null, remainingHeadroom: event.diagnostics?.remainingHeadroom ?? null };
  if (event.type === 'provider.response.completed') safe.usage = { inputTokens: event.usage?.inputTokens ?? null, outputTokens: event.usage?.outputTokens ?? null };
  if (event.type === 'budget.pressure') safe.dimensions = event.dimensions;
  if (event.type === 'budget.exhausted') safe.dimension = event.dimension;
  return Object.freeze(safe);
}

async function atomicJson(path: string, value: unknown): Promise<void> {
  const temporary = `${path}.${randomUUID()}.tmp`;
  await writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`, { encoding: 'utf8', flag: 'wx', mode: 0o600 });
  await rename(temporary, path);
}

/** Writes durable safe evidence before invoking optional, fallible presentation rendering. */
export async function writeLiveWorkArtifacts(options: Readonly<{
  directory: string;
  workspace: string;
  result: LiveWorkResult;
  renderReport?: (envelope: LiveWorkArtifactEnvelope) => string | Promise<string>;
}>): Promise<Readonly<{ envelopePath: string; tracePath: string; reportPath?: string }>> {
  await mkdir(options.directory, { recursive: true });
  const envelope: LiveWorkArtifactEnvelope = Object.freeze({ schemaVersion: 1, attemptId: options.result.attemptId, runtime: Object.freeze({ node: process.version, platform: process.platform, arch: process.arch }), workspace: resolve(options.workspace), qualifying: options.result.qualifying, terminalStatus: options.result.terminalStatus, terminalError: options.result.terminalError, observerError: options.result.observerError, hiddenAcceptance: options.result.hiddenAcceptance, humanInterventions: options.result.trace.humanInterventions, taskState: options.result.trace.taskState, stackState: options.result.trace.stackState, eventEvidence: Object.freeze(options.result.events.map(eventEvidence)) });
  const envelopePath = join(options.directory, 'attempt.json');
  await atomicJson(envelopePath, envelope);
  const tracePath = join(options.directory, 'trace.json');
  await atomicJson(tracePath, options.result.trace);
  if (!options.renderReport) return Object.freeze({ envelopePath, tracePath });
  const report = await options.renderReport(envelope);
  const reportPath = join(options.directory, 'report.txt');
  const temporary = `${reportPath}.${randomUUID()}.tmp`;
  await writeFile(temporary, sanitizeTaskEvidence(report, 256 * 1024).text, { encoding: 'utf8', flag: 'wx', mode: 0o600 });
  await rename(temporary, reportPath);
  return Object.freeze({ envelopePath, tracePath, reportPath });
}

export async function runGreenfieldExpressV1(options: Omit<Extract<LiveWorkSubmission, { kind: 'stack' }>, 'kind' | 'prompts'> & Readonly<{ instrumentRoot: string }>): Promise<LiveWorkResult> {
  const prompts = await Promise.all(['P1-scaffold.task.txt', 'P2-api.task.txt', 'P3-tests-docs-closeout.task.txt'].map((name) => readFile(join(options.instrumentRoot, name), 'utf8')));
  return runLiveWorkInstrument({ ...options, kind: 'stack', prompts });
}

export async function runExistingExpressFeatureV1(options: Omit<Extract<LiveWorkSubmission, { kind: 'single' }>, 'kind' | 'prompt'> & Readonly<{ instrumentRoot: string }>): Promise<LiveWorkResult> {
  const prompt = await readFile(join(options.instrumentRoot, 'P1-tag-feature.task.txt'), 'utf8');
  return runLiveWorkInstrument({ ...options, kind: 'single', prompt });
}

export async function runGreenfieldExpressV2(options: Omit<Extract<LiveWorkSubmission, { kind: 'stack' }>, 'kind' | 'prompts'> & Readonly<{ instrumentRoot: string }>): Promise<LiveWorkResult> {
  const prompts = await Promise.all(['P1-scaffold.task.txt', 'P2-api.task.txt', 'P3-tests-docs-closeout.task.txt'].map((name) => readFile(join(options.instrumentRoot, name), 'utf8')));
  return runLiveWorkInstrument({ ...options, kind: 'stack', prompts });
}

export async function runExistingExpressFeatureV2(options: Omit<Extract<LiveWorkSubmission, { kind: 'single' }>, 'kind' | 'prompt'> & Readonly<{ instrumentRoot: string }>): Promise<LiveWorkResult> {
  const prompt = await readFile(join(options.instrumentRoot, 'P1-tag-feature.task.txt'), 'utf8');
  return runLiveWorkInstrument({ ...options, kind: 'single', prompt });
}
