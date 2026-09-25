import { GeorgeError, type ApplicationEvent, type LocalSessionStore } from '../core/index.ts';
import {
  beginStackTask, blockTask, createStackState, parseTaskPrompt, projectStackState, stackFingerprint, updateCurrentStackTask, validateTaskStack,
  type StackState, type TaskDefinition,
} from '../tasks/index.ts';
import type { CodingWorkflowCompletion, CodingWorkflowSubmission } from './coding-workflow.ts';
import { permissionProjection, StructuredTaskApplicationService } from './structured-task.ts';

export type StructuredTaskStackSubmission = Readonly<Omit<CodingWorkflowSubmission, 'input' | 'budget'> & {
  prompts: readonly string[];
}>;

export type StructuredTaskStackCompletion = Readonly<{
  state: StackState;
  taskCompletions: readonly CodingWorkflowCompletion[];
}>;

function definitions(prompts: readonly string[]): readonly TaskDefinition[] {
  const parsed = prompts.map(parseTaskPrompt);
  if (parsed.some((prompt) => prompt.kind !== 'structured')) throw new GeorgeError('validation', 'A structured task stack may contain only Task Prompt v1 definitions.');
  const result = parsed.map((prompt) => prompt.kind === 'structured' ? prompt.task : undefined).filter((task): task is TaskDefinition => task !== undefined);
  validateTaskStack(result);
  return result;
}

/** Production owner for validated, ordered, fail-stop structured task stacks. */
export class StructuredTaskStackApplicationService {
  readonly taskService: StructuredTaskApplicationService;
  private readonly store: LocalSessionStore | undefined;

  constructor(taskService: StructuredTaskApplicationService, store?: LocalSessionStore) {
    this.taskService = taskService;
    this.store = store;
  }

  private async lifecycle(submission: StructuredTaskStackSubmission, state: StackState, message: string): Promise<void> {
    submission.session.stackState = state;
    const projection = projectStackState(state);
    const turnId = submission.turnId ?? 'structured-stack';
    const events: ApplicationEvent[] = [
      ...this.taskService.agent.record(submission.session, { type: 'stack.updated', turnId, fingerprint: projection.fingerprint, stackId: projection.stackId, status: projection.status, ...(projection.currentTaskOrdinal === undefined ? {} : { currentTaskOrdinal: projection.currentTaskOrdinal }), completedTasks: projection.completedTaskOrdinals.length, totalTasks: projection.tasks.length }),
      ...this.taskService.agent.record(submission.session, { type: 'progress.milestone', turnId, category: 'completion', message: message.slice(0, 512) }),
    ];
    for (const event of events) await submission.onEvent?.(event);
    await this.store?.save(submission.session);
  }

  async run(submission: StructuredTaskStackSubmission): Promise<StructuredTaskStackCompletion> {
    const parsed = definitions(submission.prompts); // Complete parse/stack validation precedes provider or tool work.
    const expectedFingerprint = stackFingerprint(parsed);
    const permissions = parsed.map((definition) => permissionProjection(this.taskService.agent.effectiveExecutionPolicy(definition.permissions)));
    let state = submission.session.stackState ?? createStackState({ sessionId: submission.session.id, workspace: submission.session.workspace, definitions: parsed, effectivePermissionExpectations: permissions[0], taskEffectivePermissionExpectations: permissions });
    if (state.fingerprint !== expectedFingerprint) throw new GeorgeError('validation', 'Session already has a different structured task stack.');
    submission.session.stackState = state;
    if (state.terminalOutcome !== undefined) return { state, taskCompletions: Object.freeze([]) };
    if (submission.session.interruptions.length) throw new GeorgeError('validation', 'Structured stack resume requires Phase 5 recovery reconciliation first.');

    const completions: CodingWorkflowCompletion[] = [];
    for (let index = 0; index < state.tasks.length; index += 1) {
      if (state.tasks[index]!.status === 'completed') continue;
      if (state.currentTaskIndex === undefined) {
        state = beginStackTask(state, index);
        await this.lifecycle(submission, state, `Structured stack started P${state.tasks[index]!.ordinal}.`);
      } else if (state.currentTaskIndex !== index) throw new GeorgeError('validation', 'Structured stack current task is inconsistent with ordered progress.');
      submission.session.taskState = state.tasks[index]!.taskState;
      try {
        const completion = await this.taskService.run({ ...submission, input: submission.prompts[index]! });
        completions.push(completion);
      } catch (error) {
        if (!submission.session.taskState || !['blocked', 'planning_needed', 'cancelled', 'budget_exhausted', 'completed', 'failed'].includes(submission.session.taskState.status)) {
          submission.session.taskState = blockTask(submission.session.taskState ?? state.tasks[index]!.taskState, 'failed', error instanceof Error ? error.message : 'Structured task failed.');
        }
      }
      state = submission.session.stackState?.currentTaskIndex === undefined
        ? submission.session.stackState ?? updateCurrentStackTask(state, submission.session.taskState!)
        : updateCurrentStackTask(submission.session.stackState, submission.session.taskState!);
      await this.lifecycle(submission, state, state.status === 'completed' ? 'Structured stack completed.' : state.terminalOutcome === undefined ? `Structured stack completed P${state.tasks[index]!.ordinal}.` : `Structured stack stopped at P${state.tasks[index]!.ordinal}.`);
      if (state.terminalOutcome !== undefined) break;
    }
    return { state, taskCompletions: Object.freeze(completions) };
  }
}
