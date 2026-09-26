import { randomUUID } from 'node:crypto';

import { loadWorkspaceContextFile } from '../context/index.ts';
import { GeorgeError, type ApplicationEvent, type LocalSessionStore } from '../core/index.ts';
import {
  addressTaskWorkUnit, beginTaskCorrection, beginTaskWorkUnit, blockTask, completeTask, completeTaskCorrection, createTaskState, repairTaskCorrection,
  parseTaskPrompt, recordTaskInspection, recordTaskValidationAttempt, sanitizeTaskEvidence,
  projectTaskState, updateCurrentStackTask, type TaskDefinition, type TaskState, type TaskValidation,
} from '../tasks/index.ts';
import { CodingWorkflowApplicationService, type CodingWorkflowCompletion, type CodingWorkflowSubmission, type ValidationRequest } from './coding-workflow.ts';

const INSPECTION_TOOLS = ['read_file', 'list_directory', 'search_text', 'git_status', 'git_diff'] as const;
const CODING_TOOLS = [...INSPECTION_TOOLS, 'write_file', 'apply_patch', 'create_directory'] as const;
const MAX_SLICE_EVIDENCE = 8;
const MAX_STAGE_EVIDENCE_BYTES = 8 * 1024;
const MAX_FRESHNESS_EVIDENCE = 32;
export const STRUCTURED_CONVERGENCE_POLICY = Object.freeze({
  inspection: Object.freeze({ maxProviderRounds: 6, maxToolCalls: 4, maxDuplicateLocalReads: 2 }),
  implementation: Object.freeze({ maxProviderRounds: 16, maxToolCalls: 16, maxDuplicateLocalReads: 2, efficiencyTargetProviderRounds: 10, efficiencyTargetToolCalls: 10 }),
  correction: Object.freeze({ maxProviderRounds: 12, maxToolCalls: 12, maxDuplicateLocalReads: 2, efficiencyTargetProviderRounds: 10, efficiencyTargetToolCalls: 10 }),
  discover: Object.freeze({ maxProviderRounds: 1, maxToolCalls: 1 }),
});
const STAGE_LIMITS = STRUCTURED_CONVERGENCE_POLICY;

export const MISSION_CARD_LIMITS = Object.freeze({ maxBytes: 8 * 1024, maxEstimatedTokens: 2 * 1024, maxEvidence: 12 });

export type StructuredFreshEvidence = Readonly<{
  identity: string;
  source: string;
  kind: 'observation' | 'mutation' | 'failure';
  resource?: string;
  fact: string;
  observedGeneration: number;
  state: 'valid' | 'stale';
  invalidatedGeneration?: number;
}>;

type EvidenceCache = {
  generation: number;
  items: Map<string, StructuredFreshEvidence>;
  requests: Map<string, Readonly<{ name: string; resource?: string; query?: string; existingTarget?: boolean }>>;
};

export type StructuredTaskSlice = Readonly<{
  workUnit: string;
  requirements: readonly string[];
  invariants: readonly string[];
  validations: readonly string[];
  stops: readonly string[];
  evidence: readonly string[];
}>;

export function permissionProjection(policy: ReturnType<CodingWorkflowApplicationService['agent']['effectiveExecutionPolicy']>): import('../tasks/index.ts').PermissionExpectation {
  return {
    workspace: policy.workspace === 'workspace_autonomous' ? 'autonomous' : 'standard', outsideWorkspace: policy.outsideWorkspace,
    network: policy.network, remoteMutation: policy.remoteMutation,
  };
}

/** A deliberately small derived view. Canonical TaskState never crosses this provider seam wholesale. */
export function projectStructuredTaskSlice(state: TaskState, workId: `W${number}`, stageEvidence: readonly string[] = [], failedValidationId?: `V${number}`): StructuredTaskSlice {
  const work = state.definition.workflow.find((item) => item.id === workId);
  if (!work) throw new Error('Unknown task work unit.');
  const related = state.definition.validations.filter((item) => item.covers.some((requirement) => work.covers.includes(requirement)));
  const evidence = [
    ...stageEvidence,
    ...(failedValidationId === undefined ? [] : (() => {
      const attempt = state.validations[failedValidationId]?.attempts.at(-1);
      if (!attempt || attempt.status !== 'failed') return [];
      return [
        `validation ${failedValidationId}: ${attempt.status}${attempt.outcome === undefined ? '' : ` outcome=${attempt.outcome}`}${attempt.exitCode === null ? '' : ` exit=${attempt.exitCode}`}${attempt.signal === null ? '' : ` signal=${attempt.signal}`}`,
        ...(attempt.stdout ? [`stdout${attempt.stdoutTruncated ? ' (truncated)' : ''}: ${attempt.stdout}`] : []),
        ...(attempt.stderr ? [`stderr${attempt.stderrTruncated ? ' (truncated)' : ''}: ${attempt.stderr}`] : []),
        ...(attempt.error ? [`error ${attempt.error.code}: ${attempt.error.message}`] : []),
        ...(attempt.redacted ? ['diagnostic redaction: sensitive values removed'] : []),
      ];
    })()),
  ].slice(-MAX_SLICE_EVIDENCE);
  return Object.freeze({
    workUnit: [`${work.id} — ${work.title}`, ...work.description, ...work.completeWhen.map((item) => `Complete when: ${item}`)].join('\n'),
    requirements: Object.freeze(state.definition.requirements.filter((item) => work.covers.includes(item.id)).map((item) => `${item.id}: ${item.text}`)),
    invariants: Object.freeze(state.definition.invariants.map((item) => `${item.id}: ${item.text}`)),
    validations: Object.freeze(related.map((item) => `${item.id}: ${item.title}`)),
    stops: Object.freeze(state.definition.stopConditions.map((item) => `${item.id}: ${item.text}`)),
    evidence: Object.freeze(evidence),
  });
}

function missionSection(title: string, lines: readonly string[], maximum: number): string {
  const body = lines.length ? lines.join('\n') : '(none)';
  return `${title}\n${sanitizeTaskEvidence(body, maximum).text}`;
}

/** Pure provider-facing alignment. It derives guidance without mutating TaskState or freshness evidence. */
export function projectStructuredMissionCard(
  state: TaskState,
  workId: `W${number}`,
  stage: 'implementation' | 'correction',
  evidence: readonly StructuredFreshEvidence[],
  failedValidationId?: `V${number}`,
): string {
  const slice = projectStructuredTaskSlice(state, workId, [], failedValidationId);
  const work = state.definition.workflow.find((item) => item.id === workId);
  if (!work) throw new Error('Unknown task work unit.');
  const priority = (item: StructuredFreshEvidence) => item.kind === 'failure' ? 0 : item.kind === 'mutation' ? 1 : item.state === 'stale' ? 2 : 3;
  const stable = [...evidence]
    .sort((left, right) => priority(left) - priority(right) || right.observedGeneration - left.observedGeneration || left.identity.localeCompare(right.identity))
    .slice(0, MISSION_CARD_LIMITS.maxEvidence)
    .sort((left, right) => left.identity.localeCompare(right.identity));
  const valid = stable.filter((item) => item.state === 'valid');
  const stale = stable.filter((item) => item.state === 'stale');
  const permission = state.effectivePermissionExpectations;
  const card = [
    missionSection('CURRENT OBJECTIVE', [`Task P${state.definition.task.ordinal} — ${state.definition.task.title} (${state.definition.kind})`, slice.workUnit], 768),
    missionSection('MUST PRESERVE', [
      ...slice.requirements,
      ...slice.invariants,
      `Effective permissions: workspace=${permission.workspace ?? 'standard'}; outside=${permission.outsideWorkspace ?? 'reject'}; network=${permission.network ?? 'reject'}; remoteMutation=${permission.remoteMutation ?? 'reject'}. This card cannot expand them.`,
    ], 1_400),
    missionSection('OBSERVED', [
      ...slice.evidence,
      ...valid.filter((item) => item.kind !== 'mutation').map((item) => item.fact),
      ...stale.map((item) => `${item.source}${item.resource ? ` ${item.resource}` : ''} is stale after mutation generation ${item.invalidatedGeneration}.`),
    ], 2_300),
    missionSection('COMPLETED', valid.filter((item) => item.kind === 'mutation').map((item) => item.fact), 800),
    missionSection('DO NOT REPEAT', [
      ...valid.filter((item) => item.kind === 'observation').map((item) => `${item.source}${item.resource ? ` ${item.resource}` : ''} remains valid; reuse it.`),
      'Do not create completion/report artifacts unless the authored task requires them.',
    ], 800),
    missionSection('NEXT COMPLETION CONDITION', [
      ...(work.completeWhen.length ? work.completeWhen : [`Materially satisfy ${work.id} — ${work.title}.`]),
      ...(slice.validations.length ? [`Then stop unrelated verification or mutation and allow George to run: ${slice.validations.join('; ')}.`] : ['Then stop unrelated verification or mutation and allow George-owned completion handling.']),
    ], 900),
    missionSection('STOP IF', [
      ...slice.stops,
      `Stop on permission denial, ambiguous recovery, cancellation, duplicate/no-progress exhaustion, task-wide RunBudget exhaustion, or the ${stage} hard ceiling (${STAGE_LIMITS[stage].maxToolCalls} tool calls / ${STAGE_LIMITS[stage].maxProviderRounds} provider rounds).`,
    ], 800),
  ].join('\n\n');
  const missionCard = `MISSION CARD (derived, non-authoritative)\n\n${card}`;
  if (Buffer.byteLength(missionCard, 'utf8') > MISSION_CARD_LIMITS.maxBytes || Math.ceil(missionCard.length / 4) > MISSION_CARD_LIMITS.maxEstimatedTokens) {
    throw new GeorgeError('validation', 'Structured mission card exceeded its explicit safety bound.');
  }
  return missionCard;
}

function renderSlice(slice: StructuredTaskSlice, stage: 'inspection' | 'implementation' | 'correction'): string {
  return [
    `Structured task ${stage} stage. Work only on this bounded slice.`,
    `WORK UNIT\n${slice.workUnit}`,
    `REQUIREMENTS\n${slice.requirements.join('\n') || '(none)'}`,
    `INVARIANTS\n${slice.invariants.join('\n') || '(none)'}`,
    `VALIDATION\n${slice.validations.join('\n') || '(none)'}`,
    `STOP CONDITIONS\n${slice.stops.join('\n') || '(none)'}`,
    ...(slice.evidence.length ? [`OBSERVED EVIDENCE\n${slice.evidence.join('\n')}`] : []),
    ...(stage === 'inspection' ? [`Use at most ${STAGE_LIMITS.inspection.maxToolCalls} local read/list/search/Git tool calls in this response. Start from observed paths or list the workspace; do not guess paths. George completes inspection after this first round has successful read-only evidence. Do not mutate files or run processes.`] : []),
    ...(stage === 'correction' ? ['Repair only the observed validation failure using the normal tool and permission policy. Do not claim validation passed; George reruns it.'] : []),
    ...(stage === 'inspection' ? [] : [`Use supplied observed evidence. The hard ${stage} runaway ceiling is ${STAGE_LIMITS[stage].maxToolCalls} tool calls; the efficiency target is ${STAGE_LIMITS[stage].efficiencyTargetToolCalls}. Before changing an existing file, use a still-valid read or read it and pass its expectedSha256 while preserving its textFraming. Before writing beneath a missing parent, use create_directory. Perform only the current work unit and stop when its completion condition is satisfied. Do not run declared George-owned validation yourself.`]),
  ].join('\n\n');
}

function request(validation: TaskValidation): ValidationRequest | undefined {
  if (validation.command.kind !== 'literal') return undefined;
  return { label: validation.title, intent: `Structured task validation ${validation.id}.`, executable: validation.command.executable, arguments: validation.command.arguments };
}

function discoveredRequest(validation: TaskValidation, text: string): ValidationRequest {
  if (validation.command.kind !== 'discover') throw new GeorgeError('validation', `Validation ${validation.id} is not DISCOVER.`);
  let proposal: unknown;
  try { proposal = JSON.parse(text.trim()); } catch { throw new GeorgeError('validation', `DISCOVER validation ${validation.id} did not return JSON executable/argv.`); }
  if (!proposal || typeof proposal !== 'object' || Array.isArray(proposal)) throw new GeorgeError('validation', `DISCOVER validation ${validation.id} returned an invalid proposal.`);
  const item = proposal as Record<string, unknown>;
  const invalidExecutable = (value: string) => value.includes('\0') || /[\r\n\s|&;<>()$`\\*?\[\]{}~]/.test(value) || Buffer.byteLength(value, 'utf8') > 8 * 1024;
  const invalidArgument = (value: string) => value.includes('\0') || /[\r\n]/.test(value) || Buffer.byteLength(value, 'utf8') > 8 * 1024;
  if (Object.keys(item).some((key) => key !== 'executable' && key !== 'arguments') || typeof item.executable !== 'string' || !item.executable || invalidExecutable(item.executable) || !Array.isArray(item.arguments) || item.arguments.length > 64 || item.arguments.some((argument) => typeof argument !== 'string' || invalidArgument(argument))) {
    throw new GeorgeError('validation', `DISCOVER validation ${validation.id} returned an invalid executable/argv.`);
  }
  return { label: validation.title, intent: `Structured DISCOVER validation ${validation.id}: ${validation.command.scope}`, executable: item.executable, arguments: item.arguments as string[] };
}

function outcomeFor(completion: CodingWorkflowCompletion): Exclude<import('../tasks/index.ts').TaskTerminalOutcome, 'completed'> {
  return completion.terminalState === 'cancelled' ? 'cancelled' : completion.terminalState === 'budget_exhausted' ? 'budget_exhausted' : 'failed';
}

function correctionWork(state: TaskState, validation: TaskValidation): `W${number}` {
  const unit = [...state.definition.workflow].reverse().find((work) => work.covers.some((requirement) => validation.covers.includes(requirement)));
  if (!unit) throw new GeorgeError('validation', `Validation ${validation.id} has no repairable work context.`);
  return unit.id;
}

function recoveryNeedsPlanning(submission: CodingWorkflowSubmission): boolean {
  return submission.session.events.some((event) => event.type === 'recovery.decision' && event.outcome === 'outcome_unknown' && event.kind !== 'provider-continuation');
}

function text(value: unknown, maximum = 512): string | undefined {
  if (typeof value !== 'string' || value.includes('\0')) return undefined;
  return sanitizeTaskEvidence(value, maximum).text;
}

function inspectionResult(event: Extract<ApplicationEvent, { type: 'tool.completed' }>, request: Readonly<{ name: string; resource?: string; query?: string; existingTarget?: boolean }> | undefined, generation: number): StructuredFreshEvidence | undefined {
  if (!event.result.ok || !event.result.value || typeof event.result.value !== 'object' || Array.isArray(event.result.value)) return undefined;
  const value = event.result.value as Record<string, unknown>;
  const path = text(value.path);
  let projected: Record<string, unknown> | undefined;
  if (event.name === 'read_file' && path !== undefined && typeof value.text === 'string' && typeof value.sha256 === 'string' && /^[a-f0-9]{64}$/.test(value.sha256)) {
    const body = sanitizeTaskEvidence(value.text, 2 * 1024);
    const framing = value.textFraming;
    const textFraming = framing && typeof framing === 'object' && !Array.isArray(framing)
      && ['none', 'lf', 'crlf', 'mixed'].includes(String((framing as Record<string, unknown>).lineEnding))
      && ['none', 'lf', 'crlf'].includes(String((framing as Record<string, unknown>).finalNewline))
      ? { lineEnding: (framing as Record<string, unknown>).lineEnding, finalNewline: (framing as Record<string, unknown>).finalNewline }
      : undefined;
    projected = { path, sha256: value.sha256, text: body.text, bytes: typeof value.bytes === 'number' ? value.bytes : undefined, truncated: value.truncated === true || body.truncated, redacted: body.redacted, ...(textFraming === undefined ? {} : { textFraming }) };
  } else if (event.name === 'list_directory' && path !== undefined && Array.isArray(value.entries)) {
    const entries = value.entries.slice(0, 32).flatMap((entry) => {
      if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return [];
      const item = entry as Record<string, unknown>; const name = text(item.name, 256);
      return name === undefined || !['file', 'directory', 'symlink', 'other'].includes(String(item.kind)) ? [] : [{ name, kind: item.kind }];
    }).sort((left, right) => left.name.localeCompare(right.name) || String(left.kind).localeCompare(String(right.kind)));
    projected = { path, entries, truncated: value.truncated === true || value.entries.length > 32 };
  } else if (event.name === 'search_text' && path !== undefined && Array.isArray(value.matches)) {
    const matches = value.matches.slice(0, 16).flatMap((match) => {
      if (!match || typeof match !== 'object' || Array.isArray(match)) return [];
      const item = match as Record<string, unknown>; const matchPath = text(item.path); const line = item.line; const matchText = typeof item.text === 'string' ? sanitizeTaskEvidence(item.text, 512) : undefined;
      return matchPath === undefined || !Number.isInteger(line) || matchText === undefined ? [] : [{ path: matchPath, line, text: matchText.text, redacted: matchText.redacted }];
    }).sort((left, right) => left.path.localeCompare(right.path) || Number(left.line) - Number(right.line) || left.text.localeCompare(right.text));
    projected = { path, matches, scannedFiles: typeof value.scannedFiles === 'number' ? value.scannedFiles : undefined, scannedBytes: typeof value.scannedBytes === 'number' ? value.scannedBytes : undefined, truncated: value.truncated === true || value.matches.length > 16 };
  } else if ((event.name === 'git_status' || event.name === 'git_diff') && typeof value.stdout === 'string' && typeof value.stderr === 'string') {
    const stdout = sanitizeTaskEvidence(value.stdout, 2 * 1024); const stderr = sanitizeTaskEvidence(value.stderr, 1024);
    projected = { stdout: stdout.text, stderr: stderr.text, exitCode: typeof value.exitCode === 'number' ? value.exitCode : null, stdoutTruncated: value.stdoutTruncated === true || stdout.truncated, stderrTruncated: value.stderrTruncated === true || stderr.truncated, redacted: stdout.redacted || stderr.redacted };
  }
  if (projected === undefined) return undefined;
  const resource = path ?? request?.resource;
  const qualifier = request?.query === undefined ? '' : `:${request.query}`;
  const source = `${event.name}:${event.callId}${request?.query === undefined ? '' : ` query=${JSON.stringify(request.query)}`}`;
  return Object.freeze({
    identity: `${event.name}:${resource ?? '.'}${qualifier}`,
    source,
    kind: 'observation',
    ...(resource === undefined ? {} : { resource }),
    fact: sanitizeTaskEvidence(`inspection result ${event.name}:${event.callId} ${JSON.stringify(projected)}`, 3 * 1024).text,
    observedGeneration: generation,
    state: 'valid',
  });
}

function requested(arguments_: string): Readonly<{ resource?: string; query?: string; existingTarget?: boolean }> {
  try {
    const value = JSON.parse(arguments_) as unknown;
    if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
    const path = (value as Record<string, unknown>).path;
    const query = (value as Record<string, unknown>).query;
    return Object.freeze({
      ...(typeof path === 'string' ? { resource: path || '.' } : {}),
      ...(typeof query === 'string' ? { query: sanitizeTaskEvidence(query, 256).text } : {}),
      ...('expectedSha256' in value ? { existingTarget: true } : {}),
    });
  } catch { return {}; }
}

function retainEvidence(cache: EvidenceCache, item: StructuredFreshEvidence): void {
  const identity = sanitizeTaskEvidence(item.identity, 512).text;
  const safe = Object.freeze({
    ...item,
    identity,
    source: sanitizeTaskEvidence(item.source, 512).text,
    ...(item.resource === undefined ? {} : { resource: sanitizeTaskEvidence(item.resource, 512).text }),
    fact: sanitizeTaskEvidence(item.fact, 3 * 1024).text,
  });
  cache.items.delete(identity);
  cache.items.set(identity, safe);
  while (cache.items.size > MAX_FRESHNESS_EVIDENCE) cache.items.delete(cache.items.keys().next().value!);
}

function within(root: string, path: string): boolean {
  const normalizedRoot = root.replaceAll('\\', '/').replace(/\/$/, '') || '.';
  const normalizedPath = path.replaceAll('\\', '/').replace(/\/$/, '') || '.';
  return normalizedRoot === '.' || normalizedPath === normalizedRoot || normalizedPath.startsWith(`${normalizedRoot}/`);
}

function parent(path: string): string {
  const normalized = path.replaceAll('\\', '/').replace(/\/$/, '');
  const index = normalized.lastIndexOf('/');
  return index < 0 ? '.' : normalized.slice(0, index) || '.';
}

function mutationAffects(item: StructuredFreshEvidence, path: string, topologyChanged: boolean): boolean {
  if (item.kind !== 'observation') return item.resource === path;
  if (item.source.startsWith('git_')) return true;
  if (item.resource === undefined) return false;
  if (item.source.startsWith('read_file:')) return item.resource === path;
  if (item.source.startsWith('list_directory:')) return topologyChanged && item.resource === parent(path);
  if (item.source.startsWith('search_text:')) return within(item.resource, path);
  return false;
}

function observeFreshness(cache: EvidenceCache, event: ApplicationEvent): void {
  if (event.type === 'tool.requested') {
    cache.requests.set(event.callId, Object.freeze({ name: event.name, ...requested(event.arguments) }));
    return;
  }
  if (event.type !== 'tool.completed' && event.type !== 'tool.failed') return;
  const request = cache.requests.get(event.callId);
  cache.requests.delete(event.callId);
  if (event.type === 'tool.failed') {
    const safe = sanitizeTaskEvidence(event.result.error.message, 512).text;
    retainEvidence(cache, Object.freeze({
      identity: `failure:${event.name}:${request?.resource ?? event.callId}`,
      source: `${event.name}:${event.callId}`,
      kind: 'failure',
      ...(request?.resource === undefined ? {} : { resource: request.resource }),
      fact: `tool failure ${event.name}:${event.callId} code=${event.result.error.code}: ${safe}`,
      observedGeneration: cache.generation,
      state: 'valid',
    }));
    return;
  }
  if (INSPECTION_TOOLS.includes(event.name as typeof INSPECTION_TOOLS[number])) {
    const item = inspectionResult(event, request, cache.generation);
    if (item) retainEvidence(cache, item);
    return;
  }
  if (!['write_file', 'apply_patch', 'create_directory'].includes(event.name) || !event.result.value || typeof event.result.value !== 'object' || Array.isArray(event.result.value)) return;
  const value = event.result.value as Record<string, unknown>;
  const path = text(value.path);
  if (path === undefined) return;
  cache.generation += 1;
  const topologyChanged = event.name === 'create_directory' || (event.name === 'write_file' && request?.existingTarget !== true);
  for (const [identity, item] of cache.items) {
    if (item.state === 'valid' && mutationAffects(item, path, topologyChanged)) cache.items.set(identity, Object.freeze({ ...item, state: 'stale', invalidatedGeneration: cache.generation }));
  }
  const receipt = event.name === 'create_directory'
    ? `George observed directory mutation ${path} at generation ${cache.generation}.`
    : `George observed ${event.name} ${path}${typeof value.sha256 === 'string' ? ` sha256=${value.sha256}` : ''} at generation ${cache.generation}.`;
  retainEvidence(cache, Object.freeze({ identity: `mutation:${path}`, source: `${event.name}:${event.callId}`, kind: 'mutation', resource: path, fact: receipt, observedGeneration: cache.generation, state: 'valid' }));
}

function observedInspection(events: readonly ApplicationEvent[], cache: EvidenceCache): Readonly<{ source?: string; evidence: readonly string[] }> {
  for (const event of events) observeFreshness(cache, event);
  const observed = [...cache.items.values()].filter((item) => item.kind === 'observation' && item.state === 'valid').sort((left, right) => left.identity.localeCompare(right.identity));
  const evidence: string[] = [];
  let bytes = 0;
  for (const item of observed) {
    if (evidence.length === MAX_SLICE_EVIDENCE) break;
    const remaining = MAX_STAGE_EVIDENCE_BYTES - bytes;
    if (remaining <= 3) break;
    const bounded = sanitizeTaskEvidence(item.fact, remaining).text;
    evidence.push(bounded); bytes += Buffer.byteLength(bounded, 'utf8');
  }
  return { source: observed[0]?.source, evidence: Object.freeze(evidence) };
}

/** Provider-independent structured orchestration over the canonical coding workflow. */
export class StructuredTaskApplicationService extends CodingWorkflowApplicationService {
  private readonly structuredStore: LocalSessionStore | undefined;
  private readonly correctionLimit: number | undefined;

  constructor(agent: ConstructorParameters<typeof CodingWorkflowApplicationService>[0], store?: LocalSessionStore, clock?: () => number, correctionLimit?: number) {
    super(agent, store, clock);
    this.structuredStore = store;
    this.correctionLimit = correctionLimit;
  }

  private async lifecycle(submission: CodingWorkflowSubmission, state: TaskState, message: string): Promise<void> {
    if (submission.session.stackState?.currentTaskIndex !== undefined) submission.session.stackState = updateCurrentStackTask(submission.session.stackState, state);
    const turnId = submission.turnId ?? 'structured-task';
    const projection = projectTaskState(state);
    const events = [
      ...this.agent.record(submission.session, { type: 'task.updated', turnId, fingerprint: projection.fingerprint, status: projection.status, ...(projection.currentWorkUnit === undefined ? {} : { currentWorkUnit: projection.currentWorkUnit }), blockerCount: projection.blockerCount }),
      ...this.agent.record(submission.session, { type: 'progress.milestone', turnId, category: 'completion', message: message.slice(0, 512) }),
    ];
    for (const item of events) await submission.onEvent?.(item);
    await this.structuredStore?.save(submission.session);
  }

  private async routed(definition: TaskDefinition): Promise<readonly string[]> {
    const paths: string[] = [];
    for (const entry of definition.readFirst) {
      const result = await loadWorkspaceContextFile(this.agent.workspace, entry.source);
      if (result.status !== 'loaded' && entry.required) throw new GeorgeError('validation', `Required READ FIRST source is unavailable: ${entry.source}.`);
      // Pass optional failures through the inherited routed-source observation path as visible, non-blocking evidence.
      paths.push(entry.source);
    }
    return Object.freeze([...new Set(paths)].sort());
  }

  override async run(submission: CodingWorkflowSubmission): Promise<CodingWorkflowCompletion> {
    const parsed = parseTaskPrompt(submission.input); // Marker detection is before provider/tool execution.
    if (parsed.kind === 'ordinary') return super.run(submission);
    const budget = submission.budget ?? this.agent.createRunBudget();
    const definition = parsed.task;
    const executionPolicy = this.agent.effectiveExecutionPolicy(definition.permissions);
    if (submission.session.taskState && submission.session.taskState.definitionFingerprint !== createTaskState({ sessionId: submission.session.id, workspace: submission.session.workspace, definition }).definitionFingerprint) {
      throw new GeorgeError('validation', 'Session already has a different structured task.');
    }
    let state = submission.session.taskState ?? createTaskState({ sessionId: submission.session.id, workspace: submission.session.workspace, definition, effectivePermissionExpectations: permissionProjection(executionPolicy), ...(this.correctionLimit === undefined ? {} : { correctionLimit: this.correctionLimit }) });
    submission.session.taskState = state;
    if (recoveryNeedsPlanning(submission) && !['completed', 'failed', 'blocked', 'planning_needed', 'cancelled', 'budget_exhausted'].includes(state.status)) {
      state = blockTask(state, 'planning_needed', 'Recovery left an ambiguous side effect; inspect and plan before resuming.');
      submission.session.taskState = state;
      await this.lifecycle(submission, state, 'Structured task needs planning after ambiguous recovery.');
      throw new GeorgeError('validation', 'Structured task needs planning after ambiguous recovery.');
    }
    let routed: readonly string[];
    try { routed = await this.routed(definition); }
    catch (error) { state = blockTask(state, 'blocked', error instanceof Error ? error.message : 'READ FIRST failed.'); submission.session.taskState = state; await this.lifecycle(submission, state, 'Structured task blocked: READ FIRST failed.'); throw error; }

    let last: CodingWorkflowCompletion | undefined;
    const freshness: EvidenceCache = { generation: 0, items: new Map(), requests: new Map() };
    const validEvidence = () => [...freshness.items.values()].filter((item) => item.state === 'valid');
    const observeStage = async (event: ApplicationEvent) => { observeFreshness(freshness, event); await submission.onEvent?.(event); };
    for (const unit of definition.workflow) {
      if (state.workUnits[unit.id] === 'addressed') continue;
      if (state.workUnits[unit.id] === 'blocked') break;
      if (state.workUnits[unit.id] === 'pending') state = beginTaskWorkUnit(state, unit.id);
      else if (state.currentWorkUnit !== unit.id) throw new GeorgeError('validation', 'Structured task has an invalid active work unit.');
      submission.session.taskState = state;
      await this.lifecycle(submission, state, `Structured task started ${unit.id}.`);
      const slice = projectStructuredTaskSlice(state, unit.id);
      if (definition.inspect.length && validEvidence().every((item) => item.kind !== 'observation')) {
        const events: ApplicationEvent[] = [];
        for await (const event of this.agent.run({ session: submission.session, input: renderSlice(slice, 'inspection'), turnId: `${submission.turnId ?? randomUUID()}-inspect`, routedDocuments: routed, toolNames: INSPECTION_TOOLS, initialToolChoice: 'required', completeAfterSuccessfulToolRound: true, omitHistory: true, signal: submission.signal, executionPolicy, budget, limits: STAGE_LIMITS.inspection })) {
          events.push(event); await submission.onEvent?.(event);
        }
        const observed = observedInspection(events, freshness);
        const failure = events.findLast((event): event is Extract<ApplicationEvent, { type: 'turn.failed' | 'turn.cancelled' }> => event.type === 'turn.failed' || event.type === 'turn.cancelled');
        if (failure || !observed.source || observed.evidence.length === 0) {
          const exhausted = failure?.type === 'turn.failed' && failure.error.code === 'budget';
          state = blockTask(state, exhausted ? 'budget_exhausted' : 'blocked', exhausted ? 'Structured inspection exhausted its convergence or task-wide run budget.' : 'INSPECT requires observed local read/list/search/Git evidence.');
          submission.session.taskState = state;
          await this.lifecycle(submission, state, 'Structured task blocked: inspection evidence is missing.');
          throw new GeorgeError('validation', 'Structured INSPECT preflight produced no read-only evidence.');
        }
        for (const item of definition.inspect) state = recordTaskInspection(state, { item, source: observed.source });
        submission.session.taskState = state;
      }
      const currentEvidence = validEvidence();
      last = await super.run({
        ...submission,
        input: renderSlice(projectStructuredTaskSlice(state, unit.id, currentEvidence.map((item) => item.fact)), 'implementation'),
        alignment: () => projectStructuredMissionCard(state, unit.id, 'implementation', [...freshness.items.values()]),
        allowCanonicalRebase: true,
        onEvent: observeStage,
        routedDocuments: routed, toolNames: CODING_TOOLS, omitHistory: true, validations: [], executionPolicy, budget, limits: STAGE_LIMITS.implementation,
      });
      if (last.terminalState !== 'completed') {
        state = blockTask(state, outcomeFor(last), `Work unit ${unit.id} did not complete.`);
        submission.session.taskState = state;
        await this.lifecycle(submission, state, `Structured task stopped at ${unit.id}.`);
        return last;
      }
      state = addressTaskWorkUnit(state, unit.id);
      submission.session.taskState = state;
      await this.lifecycle(submission, state, `Structured task addressed ${unit.id}.`);
    }
    for (const validation of definition.validations) {
      if (state.validations[validation.id]!.status === 'passed') continue;
      let literal = request(validation);
      if (!literal) {
        if (validation.command.kind !== 'discover') throw new GeorgeError('validation', `Validation ${validation.id} has an invalid command.`);
        const proposal = await super.run({ ...submission, input: `For validation ${validation.id}, scope: ${validation.command.scope}\nReturn only JSON: {"executable":"...","arguments":["..."]}. Propose a bounded local test command; do not execute tools.`, routedDocuments: routed, toolNames: [], omitHistory: true, validations: [], executionPolicy, budget, limits: STAGE_LIMITS.discover });
        if (proposal.terminalState !== 'completed') {
          state = blockTask(state, outcomeFor(proposal), `Validation ${validation.id} discovery did not complete.`);
          submission.session.taskState = state; await this.lifecycle(submission, state, `Structured validation discovery stopped at ${validation.id}.`); return proposal;
        }
        literal = discoveredRequest(validation, proposal.finalAssistantResponse);
      }
      for (;;) {
        const pendingCorrection = state.corrections.find((item) => item.status !== 'completed');
        if (pendingCorrection?.validationId !== undefined && pendingCorrection.validationId !== validation.id) throw new GeorgeError('validation', 'A different structured correction is active.');
        if (pendingCorrection?.status === 'active') {
          const repair = correctionWork(state, validation);
          const repaired = await super.run({
            ...submission,
            input: renderSlice(projectStructuredTaskSlice(state, repair, validEvidence().map((item) => item.fact), validation.id), 'correction'),
            alignment: () => projectStructuredMissionCard(state, repair, 'correction', [...freshness.items.values()], validation.id),
            allowCanonicalRebase: true,
            onEvent: observeStage,
            routedDocuments: routed, toolNames: CODING_TOOLS, omitHistory: true, validations: [], executionPolicy, budget, limits: STAGE_LIMITS.correction,
          });
          if (repaired.terminalState !== 'completed') {
            state = blockTask(state, outcomeFor(repaired), `Correction for ${validation.id} did not complete.`);
            submission.session.taskState = state; await this.lifecycle(submission, state, `Structured correction stopped at ${validation.id}.`); return repaired;
          }
          state = repairTaskCorrection(state, pendingCorrection.cycle);
          submission.session.taskState = state;
          await this.lifecycle(submission, state, `Structured correction repair completed for ${validation.id}; rerunning validation.`);
          continue;
        }
        last = await super.validate({ ...submission, input: `George-owned validation ${validation.id}.`, routedDocuments: routed, toolNames: [], omitHistory: true, executionPolicy, budget }, literal);
        const observed = last.validations[0];
        if (!observed) throw new GeorgeError('validation', `Validation ${validation.id} produced no process evidence.`);
        state = recordTaskValidationAttempt(state, validation.id, {
          turnId: last.turnId, callId: observed.callId, status: observed.status, exitCode: observed.exitCode, signal: observed.signal,
          ...(observed.outcome === undefined ? {} : { outcome: observed.outcome }), stdout: observed.stdout, stderr: observed.stderr,
          stdoutTruncated: observed.stdoutTruncated, stderrTruncated: observed.stderrTruncated, ...(observed.error === undefined ? {} : { error: observed.error }),
        });
        const active = state.corrections.find((item) => item.status === 'repaired');
        if (active) state = completeTaskCorrection(state, active.cycle);
        submission.session.taskState = state;
        if (last.terminalState === 'budget_exhausted') {
          state = blockTask(state, 'budget_exhausted', `Validation ${validation.id} exhausted the run budget.`);
          submission.session.taskState = state; await this.lifecycle(submission, state, `Structured task exhausted its budget at ${validation.id}.`); return last;
        }
        if (observed.status === 'passed') break;
        if (observed.status === 'cancelled') {
          state = blockTask(state, 'cancelled', `Validation ${validation.id} is cancelled.`);
          submission.session.taskState = state; await this.lifecycle(submission, state, `Structured task stopped at ${validation.id}.`); return last;
        }
        if (observed.status !== 'failed' || state.corrections.length >= state.correctionLimit) {
          state = blockTask(state, observed.status === 'denied' ? 'blocked' : 'failed', `Validation ${validation.id} is ${observed.status}; correction is unavailable or exhausted.`);
          submission.session.taskState = state; await this.lifecycle(submission, state, `Structured task stopped at ${validation.id}.`); return last;
        }
        state = beginTaskCorrection(state, validation.id);
        submission.session.taskState = state;
        await this.lifecycle(submission, state, `Structured correction ${state.corrections.at(-1)!.cycle} started for ${validation.id}.`);
      }
    }
    state = completeTask(state);
    submission.session.taskState = state;
    await this.lifecycle(submission, state, 'Structured task completed.');
    if (!last) throw new GeorgeError('validation', 'Structured task has no executable work.');
    return last;
  }
}
