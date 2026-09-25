import { randomUUID } from 'node:crypto';

import { loadWorkspaceContextFile } from '../context/index.ts';
import { GeorgeError, type ApplicationEvent, type LocalSessionStore } from '../core/index.ts';
import {
  addressTaskWorkUnit, beginTaskWorkUnit, blockTask, completeTask, createTaskState,
  parseTaskPrompt, recordTaskInspection, recordTaskValidationAttempt,
  projectTaskState, type TaskDefinition, type TaskState, type TaskValidation,
} from '../tasks/index.ts';
import { CodingWorkflowApplicationService, type CodingWorkflowCompletion, type CodingWorkflowSubmission, type ValidationRequest } from './coding-workflow.ts';

const INSPECTION_TOOLS = ['read_file', 'list_directory', 'search_text', 'git_status', 'git_diff'] as const;
const CODING_TOOLS = [...INSPECTION_TOOLS, 'write_file', 'apply_patch'] as const;
const MAX_SLICE_EVIDENCE = 8;

export type StructuredTaskSlice = Readonly<{
  workUnit: string;
  requirements: readonly string[];
  invariants: readonly string[];
  validations: readonly string[];
  stops: readonly string[];
  evidence: readonly string[];
}>;

/** A deliberately small derived view. Canonical TaskState never crosses this provider seam wholesale. */
export function projectStructuredTaskSlice(state: TaskState, workId: `W${number}`): StructuredTaskSlice {
  const work = state.definition.workflow.find((item) => item.id === workId);
  if (!work) throw new Error('Unknown task work unit.');
  const related = state.definition.validations.filter((item) => item.covers.some((requirement) => work.covers.includes(requirement)));
  const evidence = [
    ...state.inspections.slice(-MAX_SLICE_EVIDENCE).map((item) => `inspection: ${item.item} (${item.source})`),
    ...related.flatMap((item) => state.validations[item.id]!.attempts.slice(-MAX_SLICE_EVIDENCE).map((attempt) => `validation ${item.id}: ${attempt.status}${attempt.exitCode === null ? '' : ` (${attempt.exitCode})`}`)),
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

function renderSlice(slice: StructuredTaskSlice, stage: 'inspection' | 'implementation'): string {
  return [
    `Structured task ${stage} stage. Work only on this bounded slice.`,
    `WORK UNIT\n${slice.workUnit}`,
    `REQUIREMENTS\n${slice.requirements.join('\n') || '(none)'}`,
    `INVARIANTS\n${slice.invariants.join('\n') || '(none)'}`,
    `VALIDATION\n${slice.validations.join('\n') || '(none)'}`,
    `STOP CONDITIONS\n${slice.stops.join('\n') || '(none)'}`,
    ...(slice.evidence.length ? [`OBSERVED EVIDENCE\n${slice.evidence.join('\n')}`] : []),
    ...(stage === 'inspection' ? ['Use a local read/list/search/Git tool before responding. Do not mutate files or run processes.'] : []),
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
  if (Object.keys(item).some((key) => key !== 'executable' && key !== 'arguments') || typeof item.executable !== 'string' || !item.executable || item.executable.includes('\0') || !Array.isArray(item.arguments) || item.arguments.length > 64 || item.arguments.some((argument) => typeof argument !== 'string' || argument.includes('\0') || Buffer.byteLength(argument, 'utf8') > 8 * 1024)) {
    throw new GeorgeError('validation', `DISCOVER validation ${validation.id} returned an invalid executable/argv.`);
  }
  return { label: validation.title, intent: `Structured DISCOVER validation ${validation.id}: ${validation.command.scope}`, executable: item.executable, arguments: item.arguments as string[] };
}

function observedInspection(events: readonly ApplicationEvent[]): string | undefined {
  const event = events.find((item) => item.type === 'tool.completed' && INSPECTION_TOOLS.includes(item.name as typeof INSPECTION_TOOLS[number]) && item.execution?.effect === 'local_read');
  return event?.type === 'tool.completed' ? `${event.name}:${event.callId}` : undefined;
}

/** Provider-independent structured orchestration over the canonical coding workflow. */
export class StructuredTaskApplicationService extends CodingWorkflowApplicationService {
  private readonly structuredStore: LocalSessionStore | undefined;

  constructor(agent: ConstructorParameters<typeof CodingWorkflowApplicationService>[0], store?: LocalSessionStore, clock?: () => number) {
    super(agent, store, clock);
    this.structuredStore = store;
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
    const definition = parsed.task;
    if (submission.session.taskState && submission.session.taskState.definitionFingerprint !== createTaskState({ sessionId: submission.session.id, workspace: submission.session.workspace, definition }).definitionFingerprint) {
      throw new GeorgeError('validation', 'Session already has a different structured task.');
    }
    let state = submission.session.taskState ?? createTaskState({ sessionId: submission.session.id, workspace: submission.session.workspace, definition });
    submission.session.taskState = state;
    let routed: readonly string[];
    try { routed = await this.routed(definition); }
    catch (error) { state = blockTask(state, 'blocked', error instanceof Error ? error.message : 'READ FIRST failed.'); submission.session.taskState = state; await this.structuredStore?.save(submission.session); throw error; }

    let last: CodingWorkflowCompletion | undefined;
    for (const unit of definition.workflow) {
      if (state.workUnits[unit.id] !== 'pending') continue;
      state = beginTaskWorkUnit(state, unit.id);
      submission.session.taskState = state;
      await this.lifecycle(submission, state, `Structured task started ${unit.id}.`);
      const slice = projectStructuredTaskSlice(state, unit.id);
      if (definition.inspect.length && state.inspections.length === 0) {
        const events: ApplicationEvent[] = [];
        for await (const event of this.agent.run({ session: submission.session, input: renderSlice(slice, 'inspection'), turnId: `${submission.turnId ?? randomUUID()}-inspect`, routedDocuments: routed, toolNames: INSPECTION_TOOLS, omitHistory: true, signal: submission.signal })) {
          events.push(event); await submission.onEvent?.(event);
        }
        const source = observedInspection(events);
        if (!source) {
          state = blockTask(state, 'blocked', 'INSPECT requires observed local read/list/search/Git evidence.');
          submission.session.taskState = state;
          await this.lifecycle(submission, state, 'Structured task blocked: inspection evidence is missing.');
          throw new GeorgeError('validation', 'Structured INSPECT preflight produced no read-only evidence.');
        }
        for (const item of definition.inspect) state = recordTaskInspection(state, { item, source });
        submission.session.taskState = state;
      }
      last = await super.run({ ...submission, input: renderSlice(projectStructuredTaskSlice(state, unit.id), 'implementation'), routedDocuments: routed, toolNames: CODING_TOOLS, omitHistory: true, validations: [] });
      if (last.terminalState !== 'completed') {
        state = blockTask(state, last.terminalState === 'cancelled' ? 'cancelled' : 'failed', `Work unit ${unit.id} did not complete.`);
        submission.session.taskState = state;
        await this.lifecycle(submission, state, `Structured task stopped at ${unit.id}.`);
        return last;
      }
      state = addressTaskWorkUnit(state, unit.id);
      submission.session.taskState = state;
      await this.lifecycle(submission, state, `Structured task addressed ${unit.id}.`);
    }
    for (const validation of definition.validations) {
      let literal = request(validation);
      if (!literal) {
        if (validation.command.kind !== 'discover') throw new GeorgeError('validation', `Validation ${validation.id} has an invalid command.`);
        const proposal = await super.run({ ...submission, input: `For validation ${validation.id}, scope: ${validation.command.scope}\nReturn only JSON: {"executable":"...","arguments":["..."]}. Propose a bounded local test command; do not execute tools.`, routedDocuments: routed, toolNames: [], omitHistory: true, validations: [] });
        literal = discoveredRequest(validation, proposal.finalAssistantResponse);
      }
      last = await super.run({ ...submission, input: `Run no provider-owned validation. George will execute ${validation.id}.`, routedDocuments: routed, toolNames: [], omitHistory: true, validations: [literal] });
      const observed = last.validations[0];
      if (!observed) throw new GeorgeError('validation', `Validation ${validation.id} produced no process evidence.`);
      state = recordTaskValidationAttempt(state, validation.id, { turnId: last.turnId, callId: observed.callId, status: observed.status, exitCode: observed.exitCode, signal: observed.signal, ...(observed.outcome === undefined ? {} : { outcome: observed.outcome }) });
      submission.session.taskState = state;
      if (observed.status !== 'passed') { state = blockTask(state, observed.status === 'cancelled' ? 'cancelled' : 'failed', `Validation ${validation.id} is ${observed.status}.`); submission.session.taskState = state; await this.lifecycle(submission, state, `Structured task stopped at ${validation.id}.`); return last; }
    }
    state = completeTask(state);
    submission.session.taskState = state;
    await this.lifecycle(submission, state, 'Structured task completed.');
    if (!last) throw new GeorgeError('validation', 'Structured task has no executable work.');
    return last;
  }
}
