import { createHash } from 'node:crypto';

import { createTaskState, taskDefinitionFingerprint, type TaskState, type TaskStatus, type TaskTerminalOutcome } from './state.ts';
import type { PermissionExpectation, TaskDefinition } from './types.ts';
import { validateTaskStack } from './state.ts';

export const STACK_STATE_SCHEMA_VERSION = 1;
export const MAX_STACK_TASKS = 64;

export type StackTaskState = Readonly<{
  ordinal: number;
  fingerprint: string;
  status: TaskStatus;
  taskState: TaskState;
}>;

export type StackState = Readonly<{
  schemaVersion: 1;
  sessionId: string;
  workspace: string;
  stackId: string;
  fingerprint: string;
  tasks: readonly StackTaskState[];
  currentTaskIndex?: number;
  completedTaskOrdinals: readonly number[];
  status: TaskStatus;
  terminalOutcome?: TaskTerminalOutcome;
  blockerSummary?: string;
  effectivePermissionExpectations: PermissionExpectation;
}>;

export type StackStateProjection = Readonly<{
  stackId: string;
  fingerprint: string;
  status: TaskStatus;
  currentTaskIndex?: number;
  currentTaskOrdinal?: number;
  currentWorkUnit?: string;
  tasks: readonly Readonly<{ ordinal: number; title: string; status: TaskStatus; currentWorkUnit?: string }>[];
  completedTaskOrdinals: readonly number[];
  terminalOutcome?: TaskTerminalOutcome;
  blockerSummary?: string;
}>;

const terminal = (status: TaskStatus): status is TaskTerminalOutcome => !['pending', 'in_progress'].includes(status);
const bounded = (value: string, name: string, maximum: number): string => {
  if (!value || value.includes('\0') || Buffer.byteLength(value, 'utf8') > maximum) throw new Error(`Invalid stack state ${name}.`);
  return value;
};
const freeze = <T>(value: T): T => Object.freeze(value);

export function stackFingerprint(definitions: readonly TaskDefinition[]): string {
  return createHash('sha256').update(JSON.stringify(definitions.map(taskDefinitionFingerprint))).digest('hex');
}

export function createStackState(options: Readonly<{
  sessionId: string;
  workspace: string;
  definitions: readonly TaskDefinition[];
  effectivePermissionExpectations?: PermissionExpectation;
  taskEffectivePermissionExpectations?: readonly PermissionExpectation[];
}>): StackState {
  validateTaskStack(options.definitions);
  if (options.definitions.length > MAX_STACK_TASKS) throw new Error(`Structured task stack exceeds ${MAX_STACK_TASKS} tasks.`);
  if (options.taskEffectivePermissionExpectations && options.taskEffectivePermissionExpectations.length !== options.definitions.length) throw new Error('Structured task stack permission expectations do not match its tasks.');
  const tasks = options.definitions.map((definition, index) => {
    const taskState = createTaskState({ sessionId: options.sessionId, workspace: options.workspace, definition, ...(options.taskEffectivePermissionExpectations === undefined ? {} : { effectivePermissionExpectations: options.taskEffectivePermissionExpectations[index] }) });
    return freeze({ ordinal: definition.task.ordinal, fingerprint: taskState.definitionFingerprint, status: taskState.status, taskState });
  });
  const stackId = options.definitions[0]!.stack ?? `task-P${options.definitions[0]!.task.ordinal}`;
  return freeze({
    schemaVersion: STACK_STATE_SCHEMA_VERSION,
    sessionId: bounded(options.sessionId, 'session ID', 128),
    workspace: bounded(options.workspace, 'workspace', 64 * 1024),
    stackId: bounded(stackId, 'stack ID', 512),
    fingerprint: stackFingerprint(options.definitions),
    tasks: freeze(tasks),
    completedTaskOrdinals: freeze([]),
    status: 'pending',
    effectivePermissionExpectations: freeze({ ...(options.effectivePermissionExpectations ?? options.taskEffectivePermissionExpectations?.[0] ?? options.definitions[0]!.permissions) }),
  });
}

function clone(state: StackState, changes: Partial<StackState>): StackState {
  const { currentTaskIndex, terminalOutcome, blockerSummary, ...required } = { ...state, ...changes };
  return freeze({ ...required, ...(currentTaskIndex === undefined ? {} : { currentTaskIndex }), ...(terminalOutcome === undefined ? {} : { terminalOutcome }), ...(blockerSummary === undefined ? {} : { blockerSummary }) });
}

export function beginStackTask(state: StackState, index: number): StackState {
  if (terminal(state.status) || state.currentTaskIndex !== undefined || !Number.isInteger(index) || index < 0 || index >= state.tasks.length) throw new Error('Stack task cannot begin.');
  if (state.tasks[index]!.status !== 'pending' || state.tasks.slice(0, index).some((task) => task.status !== 'completed')) throw new Error('Stack task is not ready.');
  return clone(state, { status: 'in_progress', currentTaskIndex: index });
}

/** Replaces only the active task record; task history and ordering remain immutable stack authority. */
export function updateCurrentStackTask(state: StackState, taskState: TaskState): StackState {
  const index = state.currentTaskIndex;
  if (index === undefined) throw new Error('Stack has no current task.');
  const current = state.tasks[index]!;
  if (taskState.sessionId !== state.sessionId || taskState.workspace !== state.workspace || taskState.definitionFingerprint !== current.fingerprint) throw new Error('Current task does not belong to this stack.');
  const tasks = state.tasks.map((task, taskIndex) => taskIndex === index ? freeze({ ...task, status: taskState.status, taskState }) : task);
  if (taskState.status === 'completed') {
    const completedTaskOrdinals = freeze([...state.completedTaskOrdinals, current.ordinal]);
    const finished = index === tasks.length - 1;
    return clone(state, { tasks: freeze(tasks), completedTaskOrdinals, currentTaskIndex: undefined, status: finished ? 'completed' : 'in_progress', ...(finished ? { terminalOutcome: 'completed' as const } : {}) });
  }
  if (terminal(taskState.status)) {
    return clone(state, { tasks: freeze(tasks), status: taskState.status, terminalOutcome: taskState.status, blockerSummary: bounded(taskState.blockers.at(-1) ?? `Task P${current.ordinal} ended ${taskState.status}.`, 'blocker summary', 512) });
  }
  return clone(state, { tasks: freeze(tasks), status: 'in_progress' });
}

/** Strict relationship validation used after durable TaskState records have been parsed. */
export function restoreStackState(state: StackState): StackState {
  if (state.schemaVersion !== STACK_STATE_SCHEMA_VERSION || state.tasks.length === 0 || state.tasks.length > MAX_STACK_TASKS) throw new Error('Invalid stack state schema or task count.');
  const definitions = state.tasks.map((task) => task.taskState.definition);
  validateTaskStack(definitions);
  if (state.stackId !== (definitions[0]!.stack ?? `task-P${definitions[0]!.task.ordinal}`)) throw new Error('Stack identity does not match its task definitions.');
  if (state.fingerprint !== stackFingerprint(definitions)) throw new Error('Stack fingerprint does not match its task definitions.');
  if (state.tasks.some((task) => task.ordinal !== task.taskState.definition.task.ordinal || task.fingerprint !== task.taskState.definitionFingerprint || task.status !== task.taskState.status || task.taskState.sessionId !== state.sessionId || task.taskState.workspace !== state.workspace)) throw new Error('Stack task identity, binding, or status does not match TaskState.');
  const completed = state.tasks.filter((task) => task.status === 'completed').map((task) => task.ordinal);
  if (JSON.stringify(completed) !== JSON.stringify(state.completedTaskOrdinals) || completed.length && state.tasks.slice(0, completed.length).some((task) => task.status !== 'completed')) throw new Error('Stack completed-task history is invalid.');
  if (state.currentTaskIndex !== undefined && (state.currentTaskIndex < 0 || state.currentTaskIndex >= state.tasks.length || state.tasks[state.currentTaskIndex]!.status === 'completed')) throw new Error('Stack current task is invalid.');
  if (state.currentTaskIndex !== undefined && (state.currentTaskIndex !== completed.length || state.tasks.slice(state.currentTaskIndex + 1).some((task) => task.status !== 'pending'))) throw new Error('Stack ordered progress is invalid.');
  if (terminal(state.status) !== (state.terminalOutcome !== undefined) || state.terminalOutcome !== undefined && state.terminalOutcome !== state.status) throw new Error('Stack terminal outcome is invalid.');
  if (state.status === 'completed' && completed.length !== state.tasks.length) throw new Error('Completed stack has incomplete tasks.');
  if (
    state.status === 'completed' && state.currentTaskIndex !== undefined
    || state.status === 'pending' && (completed.length !== 0 || state.currentTaskIndex !== undefined || state.tasks.some((task) => task.status !== 'pending'))
    || state.status === 'in_progress' && state.currentTaskIndex !== undefined && !['pending', 'in_progress'].includes(state.tasks[state.currentTaskIndex]!.status)
    || state.status === 'in_progress' && state.currentTaskIndex === undefined && completed.length >= state.tasks.length
    || terminal(state.status) && state.status !== 'completed' && (state.currentTaskIndex === undefined || state.tasks[state.currentTaskIndex]!.status !== state.status)
  ) throw new Error('Stack status does not match ordered task progress.');
  return freeze({ ...state, tasks: freeze(state.tasks.map((task) => freeze({ ...task }))), completedTaskOrdinals: freeze([...state.completedTaskOrdinals]), effectivePermissionExpectations: freeze({ ...state.effectivePermissionExpectations }) });
}

export function projectStackState(state: StackState): StackStateProjection {
  const current = state.currentTaskIndex === undefined ? undefined : state.tasks[state.currentTaskIndex];
  return freeze({
    stackId: state.stackId,
    fingerprint: state.fingerprint,
    status: state.status,
    ...(state.currentTaskIndex === undefined ? {} : { currentTaskIndex: state.currentTaskIndex, currentTaskOrdinal: current!.ordinal, ...(current!.taskState.currentWorkUnit === undefined ? {} : { currentWorkUnit: current!.taskState.currentWorkUnit }) }),
    tasks: freeze(state.tasks.map((task) => freeze({ ordinal: task.ordinal, title: task.taskState.definition.task.title, status: task.status, ...(task.taskState.currentWorkUnit === undefined ? {} : { currentWorkUnit: task.taskState.currentWorkUnit }) }))),
    completedTaskOrdinals: freeze([...state.completedTaskOrdinals]),
    ...(state.terminalOutcome === undefined ? {} : { terminalOutcome: state.terminalOutcome }),
    ...(state.blockerSummary === undefined ? {} : { blockerSummary: state.blockerSummary }),
  });
}
