import { randomUUID } from 'node:crypto';

import { loadWorkspaceContextFile } from '../context/index.ts';
import { GeorgeError, type ApplicationEvent, type LocalSessionStore } from '../core/index.ts';
import {
  addressTaskWorkUnit, beginTaskCorrection, beginTaskWorkUnit, blockTask, completeTask, completeTaskCorrection, createTaskState, repairTaskCorrection,
  parseTaskPrompt, recordTaskInspection, recordTaskValidationAttempt, sanitizeTaskEvidence,
  projectTaskState, type TaskDefinition, type TaskState, type TaskValidation,
} from '../tasks/index.ts';
import { CodingWorkflowApplicationService, type CodingWorkflowCompletion, type CodingWorkflowSubmission, type ValidationRequest } from './coding-workflow.ts';

const INSPECTION_TOOLS = ['read_file', 'list_directory', 'search_text', 'git_status', 'git_diff'] as const;
const CODING_TOOLS = [...INSPECTION_TOOLS, 'write_file', 'apply_patch'] as const;
const MAX_SLICE_EVIDENCE = 8;
const MAX_STAGE_EVIDENCE_BYTES = 8 * 1024;
const STAGE_LIMITS = Object.freeze({
  inspection: Object.freeze({ maxProviderRounds: 6, maxToolCalls: 4, maxDuplicateLocalReads: 2 }),
  implementation: Object.freeze({ maxProviderRounds: 10, maxToolCalls: 8, maxDuplicateLocalReads: 2 }),
  correction: Object.freeze({ maxProviderRounds: 8, maxToolCalls: 6, maxDuplicateLocalReads: 2 }),
  discover: Object.freeze({ maxProviderRounds: 1, maxToolCalls: 1 }),
});

export type StructuredTaskSlice = Readonly<{
  workUnit: string;
  requirements: readonly string[];
  invariants: readonly string[];
  validations: readonly string[];
  stops: readonly string[];
  evidence: readonly string[];
}>;

function permissionProjection(policy: ReturnType<CodingWorkflowApplicationService['agent']['effectiveExecutionPolicy']>): import('../tasks/index.ts').PermissionExpectation {
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

function renderSlice(slice: StructuredTaskSlice, stage: 'inspection' | 'implementation' | 'correction'): string {
  return [
    `Structured task ${stage} stage. Work only on this bounded slice.`,
    `WORK UNIT\n${slice.workUnit}`,
    `REQUIREMENTS\n${slice.requirements.join('\n') || '(none)'}`,
    `INVARIANTS\n${slice.invariants.join('\n') || '(none)'}`,
    `VALIDATION\n${slice.validations.join('\n') || '(none)'}`,
    `STOP CONDITIONS\n${slice.stops.join('\n') || '(none)'}`,
    ...(slice.evidence.length ? [`OBSERVED EVIDENCE\n${slice.evidence.join('\n')}`] : []),
    ...(stage === 'inspection' ? ['Use a local read/list/search/Git tool before responding. Do not mutate files or run processes.'] : []),
    ...(stage === 'correction' ? ['Repair only the observed validation failure using the normal tool and permission policy. Do not claim validation passed; George reruns it.'] : []),
    ...(stage === 'inspection' ? [] : ['Use supplied observed evidence. Perform only the current work unit. Stop when its completion condition is satisfied. Do not run declared George-owned validation yourself.']),
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

function inspectionResult(event: Extract<ApplicationEvent, { type: 'tool.completed' }>): string | undefined {
  if (!event.result.ok || !event.result.value || typeof event.result.value !== 'object' || Array.isArray(event.result.value)) return undefined;
  const value = event.result.value as Record<string, unknown>;
  const path = text(value.path);
  let projected: Record<string, unknown> | undefined;
  if (event.name === 'read_file' && path !== undefined && typeof value.text === 'string') {
    const body = sanitizeTaskEvidence(value.text, 2 * 1024);
    projected = { path, text: body.text, bytes: typeof value.bytes === 'number' ? value.bytes : undefined, truncated: value.truncated === true || body.truncated, redacted: body.redacted };
  } else if (event.name === 'list_directory' && path !== undefined && Array.isArray(value.entries)) {
    projected = { path, entries: value.entries.slice(0, 32).flatMap((entry) => {
      if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return [];
      const item = entry as Record<string, unknown>; const name = text(item.name, 256);
      return name === undefined || !['file', 'directory', 'symlink', 'other'].includes(String(item.kind)) ? [] : [{ name, kind: item.kind }];
    }), truncated: value.truncated === true || value.entries.length > 32 };
  } else if (event.name === 'search_text' && path !== undefined && Array.isArray(value.matches)) {
    projected = { path, matches: value.matches.slice(0, 16).flatMap((match) => {
      if (!match || typeof match !== 'object' || Array.isArray(match)) return [];
      const item = match as Record<string, unknown>; const matchPath = text(item.path); const line = item.line; const matchText = typeof item.text === 'string' ? sanitizeTaskEvidence(item.text, 512) : undefined;
      return matchPath === undefined || !Number.isInteger(line) || matchText === undefined ? [] : [{ path: matchPath, line, text: matchText.text, redacted: matchText.redacted }];
    }), scannedFiles: typeof value.scannedFiles === 'number' ? value.scannedFiles : undefined, scannedBytes: typeof value.scannedBytes === 'number' ? value.scannedBytes : undefined, truncated: value.truncated === true || value.matches.length > 16 };
  } else if ((event.name === 'git_status' || event.name === 'git_diff') && typeof value.stdout === 'string' && typeof value.stderr === 'string') {
    const stdout = sanitizeTaskEvidence(value.stdout, 2 * 1024); const stderr = sanitizeTaskEvidence(value.stderr, 1024);
    projected = { stdout: stdout.text, stderr: stderr.text, exitCode: typeof value.exitCode === 'number' ? value.exitCode : null, stdoutTruncated: value.stdoutTruncated === true || stdout.truncated, stderrTruncated: value.stderrTruncated === true || stderr.truncated, redacted: stdout.redacted || stderr.redacted };
  }
  return projected === undefined ? undefined : `inspection result ${event.name}:${event.callId} ${JSON.stringify(projected)}`;
}

function observedInspection(events: readonly ApplicationEvent[]): Readonly<{ source?: string; evidence: readonly string[] }> {
  const completed = events.filter((item): item is Extract<ApplicationEvent, { type: 'tool.completed' }> => item.type === 'tool.completed' && INSPECTION_TOOLS.includes(item.name as typeof INSPECTION_TOOLS[number]) && item.execution?.effect === 'local_read');
  const evidence: string[] = [];
  let source: string | undefined;
  let bytes = 0;
  for (const event of completed) {
    const item = inspectionResult(event);
    if (!item || evidence.length === MAX_SLICE_EVIDENCE) continue;
    const remaining = MAX_STAGE_EVIDENCE_BYTES - bytes;
    if (remaining <= 3) break;
    const bounded = sanitizeTaskEvidence(item, remaining).text;
    source ??= `${event.name}:${event.callId}`;
    evidence.push(bounded); bytes += Buffer.byteLength(bounded, 'utf8');
  }
  return { source, evidence: Object.freeze(evidence) };
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
    catch (error) { state = blockTask(state, 'blocked', error instanceof Error ? error.message : 'READ FIRST failed.'); submission.session.taskState = state; await this.structuredStore?.save(submission.session); throw error; }

    let last: CodingWorkflowCompletion | undefined;
    let stageEvidence: readonly string[] = [];
    for (const unit of definition.workflow) {
      if (state.workUnits[unit.id] === 'addressed') continue;
      if (state.workUnits[unit.id] === 'blocked') break;
      if (state.workUnits[unit.id] === 'pending') state = beginTaskWorkUnit(state, unit.id);
      else if (state.currentWorkUnit !== unit.id) throw new GeorgeError('validation', 'Structured task has an invalid active work unit.');
      submission.session.taskState = state;
      await this.lifecycle(submission, state, `Structured task started ${unit.id}.`);
      const slice = projectStructuredTaskSlice(state, unit.id);
      if (definition.inspect.length && stageEvidence.length === 0) {
        const events: ApplicationEvent[] = [];
        for await (const event of this.agent.run({ session: submission.session, input: renderSlice(slice, 'inspection'), turnId: `${submission.turnId ?? randomUUID()}-inspect`, routedDocuments: routed, toolNames: INSPECTION_TOOLS, omitHistory: true, signal: submission.signal, executionPolicy, budget, limits: STAGE_LIMITS.inspection })) {
          events.push(event); await submission.onEvent?.(event);
        }
        const observed = observedInspection(events);
        const failure = events.findLast((event): event is Extract<ApplicationEvent, { type: 'turn.failed' | 'turn.cancelled' }> => event.type === 'turn.failed' || event.type === 'turn.cancelled');
        if (failure || !observed.source || observed.evidence.length === 0) {
          const exhausted = failure?.type === 'turn.failed' && failure.error.code === 'budget';
          state = blockTask(state, exhausted ? 'budget_exhausted' : 'blocked', exhausted ? 'Structured inspection exhausted its convergence or task-wide run budget.' : 'INSPECT requires observed local read/list/search/Git evidence.');
          submission.session.taskState = state;
          await this.lifecycle(submission, state, 'Structured task blocked: inspection evidence is missing.');
          throw new GeorgeError('validation', 'Structured INSPECT preflight produced no read-only evidence.');
        }
        stageEvidence = observed.evidence;
        for (const item of definition.inspect) state = recordTaskInspection(state, { item, source: observed.source });
        submission.session.taskState = state;
      }
      last = await super.run({ ...submission, input: renderSlice(projectStructuredTaskSlice(state, unit.id, stageEvidence), 'implementation'), routedDocuments: routed, toolNames: CODING_TOOLS, omitHistory: true, validations: [], executionPolicy, budget, limits: STAGE_LIMITS.implementation });
      if (last.directMutations.length > 0) stageEvidence = [];
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
          const repaired = await super.run({ ...submission, input: renderSlice(projectStructuredTaskSlice(state, repair, [], validation.id), 'correction'), routedDocuments: routed, toolNames: CODING_TOOLS, omitHistory: true, validations: [], executionPolicy, budget, limits: STAGE_LIMITS.correction });
          if (repaired.directMutations.length > 0) stageEvidence = [];
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
