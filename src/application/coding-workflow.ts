import { randomUUID } from 'node:crypto';

import {
  asGeorgeError,
  type ApplicationEvent,
  type LocalSessionStore,
  type Session,
  type WorkflowChange,
  type WorkflowCompletion,
  type WorkflowTiming,
  type WorkflowValidation,
} from '../core/index.ts';
import { captureGitWorkingTreeSnapshot, type GitWorkingTreeSnapshot } from '../tools/index.ts';
import {
  AgentLoopApplicationService,
  createAgentLoopApplicationService,
  type AgentLoopServiceOptions,
  type AgentLoopSubmission,
} from './one-turn.ts';

export const CODING_WORKFLOW_GUIDANCE = 'For a coding completion, summarize what you inspected, what changed, validation performed, and unresolved issues or evidence gaps. Do not narrate routine tool progress.';

export type ValidationRequest = Readonly<{
  label: string;
  intent: string;
  executable: string;
  arguments: readonly string[];
  cwd?: string;
  timeoutMs?: number;
}>;

export type CodingWorkflowSubmission = AgentLoopSubmission & Readonly<{
  validations?: readonly ValidationRequest[];
  /** Presentation observer; it cannot affect the canonical session evidence. */
  onEvent?: (event: ApplicationEvent) => void | Promise<void>;
}>;

export type CodingWorkflowCompletion = WorkflowCompletion & Readonly<{
  turnId: string;
  baseline?: GitWorkingTreeSnapshot;
  finalState?: GitWorkingTreeSnapshot;
}>;

function bounded(value: string, maximum = 4096): string {
  return Buffer.byteLength(value, 'utf8') <= maximum ? value : `${Buffer.from(value, 'utf8').subarray(0, maximum - 3).toString('utf8')}...`;
}

/** Attributes sequential lifecycle intervals once; the remainder is explicit harness time. */
class WorkflowTimer {
  private readonly clock: () => number;
  private readonly startedAt: number;
  private providerStarted: number | undefined;
  private readonly tools = new Map<string, number>();
  private readonly approvals = new Map<string, number>();
  private providerMs = 0;
  private toolMs = 0;
  private approvalMs = 0;

  constructor(clock: () => number) { this.clock = clock; this.startedAt = clock(); }

  observe(event: ApplicationEvent): void {
    const now = this.clock();
    const close = (started: number | undefined, add: (value: number) => void) => { if (started !== undefined) add(Math.max(0, now - started)); };
    if (event.type === 'provider.attempt.started') this.providerStarted ??= now;
    else if (event.type === 'provider.response.completed' || event.type === 'provider.error' || event.type === 'provider.retry.scheduled') { close(this.providerStarted, (value) => { this.providerMs += value; }); this.providerStarted = undefined; }
    else if (event.type === 'tool.started') this.tools.set(event.callId, now);
    else if (event.type === 'tool.completed' || event.type === 'tool.failed') { close(this.tools.get(event.callId), (value) => { this.toolMs += value; }); this.tools.delete(event.callId); }
    else if (event.type === 'approval.requested') this.approvals.set(event.callId, now);
    else if (event.type === 'approval.allowed' || event.type === 'approval.denied') { close(this.approvals.get(event.callId), (value) => { this.approvalMs += value; }); this.approvals.delete(event.callId); }
  }

  finish(): WorkflowTiming {
    const now = this.clock();
    if (this.providerStarted !== undefined) this.providerMs += Math.max(0, now - this.providerStarted);
    for (const started of this.tools.values()) this.toolMs += Math.max(0, now - started);
    for (const started of this.approvals.values()) this.approvalMs += Math.max(0, now - started);
    this.providerStarted = undefined; this.tools.clear(); this.approvals.clear();
    const totalMs = Math.max(0, now - this.startedAt);
    const providerMs = Math.round(this.providerMs); const toolMs = Math.round(this.toolMs); const approvalMs = Math.round(this.approvalMs);
    return { totalMs: Math.round(totalMs), providerMs, toolMs, approvalMs, otherMs: Math.max(0, Math.round(totalMs) - providerMs - toolMs - approvalMs) };
  }
}

function directMutation(event: ApplicationEvent): WorkflowCompletion['directMutations'][number] | undefined {
  if (event.type !== 'tool.completed' || (event.name !== 'write_file' && event.name !== 'apply_patch') || !event.result.ok) return undefined;
  const value = event.result.value;
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;
  const result = value as Record<string, unknown>;
  return typeof result.path === 'string' && typeof result.bytes === 'number' && typeof result.sha256 === 'string'
    ? { tool: event.name, path: result.path, bytes: result.bytes, sha256: result.sha256 }
    : undefined;
}

function changes(
  baseline: GitWorkingTreeSnapshot | undefined,
  finalState: GitWorkingTreeSnapshot | undefined,
  directMutations: readonly WorkflowCompletion['directMutations'][number][],
): WorkflowChange[] {
  if (!baseline || !finalState || !baseline.isRepository || !finalState.isRepository) return [];
  const direct = new Set(directMutations.map((mutation) => mutation.path));
  const initial = new Set(baseline.entries.map((entry) => entry.path));
  const final = new Set(finalState.entries.map((entry) => entry.path));
  return [...new Set([...initial, ...final])].sort().map((path) => ({
    path,
    relationship: initial.has(path) ? final.has(path) ? 'pre-existing' : 'no-longer-observed' : 'newly-observed',
    directGeorgeMutation: direct.has(path),
  }));
}

function validationFromEvents(request: ValidationRequest, events: readonly ApplicationEvent[], error?: unknown): WorkflowValidation {
  const terminal = [...events].reverse().find((event): event is Extract<ApplicationEvent, { type: 'tool.completed' | 'tool.failed' }> =>
    (event.type === 'tool.completed' || event.type === 'tool.failed') && event.name === 'run_process');
  const requested = events.find((event): event is Extract<ApplicationEvent, { type: 'tool.requested' }> => event.type === 'tool.requested' && event.name === 'run_process');
  const base = { callId: requested?.callId ?? '', label: bounded(request.label, 1024), intent: bounded(request.intent), executable: request.executable, arguments: [...request.arguments], cwd: request.cwd ?? '.', exitCode: null, signal: null, stdout: '', stderr: '', stdoutTruncated: false, stderrTruncated: false };
  if (error) {
    const normalized = asGeorgeError(error);
    return { ...base, status: normalized.code === 'cancelled' ? 'cancelled' : 'failed', error: { code: normalized.code, message: bounded(normalized.message) } };
  }
  if (!terminal) return { ...base, status: 'failed', error: { code: 'tool', message: 'Validation did not reach a terminal tool result.' } };
  if (!terminal.result.ok) return { ...base, status: terminal.result.error.code === 'denied' ? 'denied' : 'failed', error: { code: terminal.result.error.code, message: bounded(terminal.result.error.message) } };
  const value = terminal.result.value;
  if (!value || typeof value !== 'object' || Array.isArray(value)) return { ...base, status: 'failed', error: { code: 'tool', message: 'Validation returned an invalid process result.' } };
  const result = value as Record<string, unknown>;
  const outcome = result.outcome;
  if (outcome !== 'completed' && outcome !== 'failed' && outcome !== 'timed_out' && outcome !== 'spawn_failed') return { ...base, status: 'failed', error: { code: 'tool', message: 'Validation returned an invalid process outcome.' } };
  const exitCode = typeof result.exitCode === 'number' ? result.exitCode : null;
  const signal = typeof result.signal === 'string' ? result.signal : null;
  return {
    ...base, status: outcome === 'completed' && exitCode === 0 ? 'passed' : 'failed', outcome, exitCode, signal,
    stdout: bounded(typeof result.stdout === 'string' ? result.stdout : ''), stderr: bounded(typeof result.stderr === 'string' ? result.stderr : ''),
    stdoutTruncated: result.stdoutTruncated === true, stderrTruncated: result.stderrTruncated === true,
  };
}

/** Provider-independent coding evidence around, not inside, the canonical model/tool loop. */
export class CodingWorkflowApplicationService {
  readonly agent: AgentLoopApplicationService;
  private readonly store: LocalSessionStore | undefined;
  private readonly clock: () => number;

  constructor(agent: AgentLoopApplicationService, store?: LocalSessionStore, clock: () => number = performance.now.bind(performance)) {
    this.agent = agent;
    this.store = store;
    this.clock = clock;
  }

  async run(submission: CodingWorkflowSubmission): Promise<CodingWorkflowCompletion> {
    return this.execute(submission, true);
  }

  /** Executes George-owned validation without spending a provider round. */
  async validate(submission: Omit<CodingWorkflowSubmission, 'validations'>, validation: ValidationRequest): Promise<CodingWorkflowCompletion> {
    return this.execute({ ...submission, validations: [validation] }, false);
  }

  private async execute(submission: CodingWorkflowSubmission, runAgent: boolean): Promise<CodingWorkflowCompletion> {
    const timer = new WorkflowTimer(this.clock);
    const turnId = submission.turnId ?? randomUUID();
    const budget = submission.budget ?? this.agent.createRunBudget();
    const warnings: string[] = [];
    let baseline: GitWorkingTreeSnapshot | undefined;
    try { baseline = await captureGitWorkingTreeSnapshot(this.agent.workspace, undefined, { signal: submission.signal }); }
    catch (error) { warnings.push(`Workspace baseline unavailable: ${bounded(asGeorgeError(error).message)}`); }

    const directMutations: WorkflowCompletion['directMutations'][number][] = [];
    const events: ApplicationEvent[] = [];
    let persistenceFailure: string | undefined;
    const observe = async (observed: readonly ApplicationEvent[]): Promise<void> => {
      for (const event of observed) { timer.observe(event); await submission.onEvent?.(event); }
      if (!this.store) return;
      try { await this.store.save(submission.session); }
      catch (error) { persistenceFailure ??= bounded(asGeorgeError(error).message); }
    };
    if (runAgent) {
      for await (const event of this.agent.run({ ...submission, turnId, budget })) {
        events.push(event);
        const mutation = directMutation(event);
        if (mutation) directMutations.push(mutation);
        await observe([event]);
      }
    }

    const validations: WorkflowValidation[] = [];
    for (const request of submission.validations ?? []) {
      if (!request.label.trim() || !request.intent.trim()) throw new Error('Validation label and intent must be explicit.');
      const callId = randomUUID();
      await observe(this.agent.record(submission.session, { type: 'validation.started', turnId, callId, label: bounded(request.label, 1024), intent: bounded(request.intent) }));
      const validationEvents: ApplicationEvent[] = [];
      let failure: unknown;
      try {
        for await (const event of this.agent.runProcess({ session: submission.session, turnId, callId, ...request, signal: submission.signal, budget, executionPolicy: submission.executionPolicy })) {
          validationEvents.push(event);
          await observe([event]);
        }
      } catch (error) { failure = error; }
      const validation = validationFromEvents(request, validationEvents, failure);
      validations.push(validation);
      await observe(this.agent.record(submission.session, {
        type: 'validation.completed', turnId, callId, status: validation.status, exitCode: validation.exitCode, signal: validation.signal,
        ...(validation.outcome === undefined ? {} : { outcome: validation.outcome }), stdoutTruncated: validation.stdoutTruncated, stderrTruncated: validation.stderrTruncated,
        ...(validation.error === undefined ? {} : { error: validation.error }),
      }));
    }

    let finalState: GitWorkingTreeSnapshot | undefined;
    try { finalState = await captureGitWorkingTreeSnapshot(this.agent.workspace); }
    catch (error) { warnings.push(`Final workspace observation unavailable: ${bounded(asGeorgeError(error).message)}`); }
    if (!baseline?.isRepository || !finalState?.isRepository) warnings.push('Git change observation is unavailable outside a Git workspace; only direct George-native mutation evidence is known.');
    if (events.some((event) => event.type === 'tool.started' && event.name === 'run_process' && event.execution?.effect === 'host_process')) warnings.push('An approved arbitrary process ran; newly observed files are not attributed to that process without direct evidence.');
    if (changes(baseline, finalState, directMutations).some((change) => change.relationship === 'no-longer-observed')) warnings.push('Pre-existing dirty paths changed during the run; their original content was not restored or normalized.');
    if (persistenceFailure) warnings.push(`Session evidence could not be persisted: ${persistenceFailure}`);
    const terminalEvent = events.at(-1);
    const terminalState = terminalEvent?.type === 'turn.cancelled' || validations.some((validation) => validation.status === 'cancelled')
      ? 'cancelled' : terminalEvent?.type === 'turn.failed' && terminalEvent.error.code === 'budget' ? 'budget_exhausted'
        : validations.some((validation) => validation.error?.code === 'budget') ? 'budget_exhausted'
        : terminalEvent?.type === 'turn.failed' || validations.some((validation) => validation.status !== 'passed') ? 'failed' : 'completed';
    const completion: CodingWorkflowCompletion = {
      turnId, baseline, finalState, baselineAvailable: baseline !== undefined, finalStateAvailable: finalState !== undefined,
      changes: changes(baseline, finalState, directMutations), directMutations, validations, warnings, terminalState, timing: timer.finish(),
      finalAssistantResponse: events.filter((event): event is Extract<ApplicationEvent, { type: 'assistant.response.completed' }> => event.type === 'assistant.response.completed').map((event) => event.text).join(''),
    };
    const { turnId: _turnId, baseline: _baseline, finalState: _finalState, ...durableCompletion } = completion;
    await observe(this.agent.record(submission.session, { type: 'workflow.completed', turnId, completion: durableCompletion }));
    return completion;
  }
}

export async function createCodingWorkflowApplicationService(
  options: AgentLoopServiceOptions & Readonly<{ sessionStore?: LocalSessionStore }>,
): Promise<CodingWorkflowApplicationService> {
  const instructions = options.georgeInstructions === undefined ? CODING_WORKFLOW_GUIDANCE : `${options.georgeInstructions}\n${CODING_WORKFLOW_GUIDANCE}`;
  const { sessionStore, ...agentOptions } = options;
  return new CodingWorkflowApplicationService(await createAgentLoopApplicationService({ ...agentOptions, georgeInstructions: instructions }), sessionStore, options.clock);
}
