import { createHash } from 'node:crypto';

import type { PermissionExpectation, TaskDefinition, TaskValidation, TaskWorkUnit } from './types.ts';
import { parseTaskPrompt } from './parser.ts';

export const TASK_STATE_SCHEMA_VERSION = 1;
export const DEFAULT_MAX_CORRECTION_CYCLES = 2;
export const MAX_CORRECTION_CYCLES = 10;
export const MAX_TASK_EVIDENCE = 64;
export const MAX_VALIDATION_ATTEMPTS = 32;

export type TaskStatus = 'pending' | 'in_progress' | 'blocked' | 'planning_needed' | 'cancelled' | 'budget_exhausted' | 'completed' | 'failed';
export type RequirementStatus = 'pending' | 'addressed' | 'verified';
export type WorkUnitStatus = 'pending' | 'active' | 'addressed' | 'blocked';
export type ValidationStatus = 'pending' | 'passed' | 'failed' | 'denied' | 'cancelled';
export type TaskTerminalOutcome = Exclude<TaskStatus, 'pending' | 'in_progress'>;

export type TaskInspectionEvidence = Readonly<{ item: string; source: string }>;
export type TaskValidationAttempt = Readonly<{
  turnId: string;
  callId: string;
  status: Exclude<ValidationStatus, 'pending'>;
  exitCode: number | null;
  signal: string | null;
  outcome?: 'completed' | 'failed' | 'timed_out' | 'spawn_failed';
}>;
export type TaskCorrection = Readonly<{ cycle: number; validationId: `V${number}`; status: 'active' | 'repaired' | 'completed' }>;

export type TaskState = Readonly<{
  schemaVersion: 1;
  sessionId: string;
  workspace: string;
  definition: TaskDefinition;
  definitionFingerprint: string;
  status: TaskStatus;
  currentWorkUnit?: `W${number}`;
  requirements: Readonly<Record<`R${number}`, RequirementStatus>>;
  workUnits: Readonly<Record<`W${number}`, WorkUnitStatus>>;
  inspections: readonly TaskInspectionEvidence[];
  validations: Readonly<Record<`V${number}`, Readonly<{ status: ValidationStatus; attempts: readonly TaskValidationAttempt[] }>>>;
  correctionLimit: number;
  corrections: readonly TaskCorrection[];
  blockers: readonly string[];
  terminalOutcome?: TaskTerminalOutcome;
  effectivePermissionExpectations: PermissionExpectation;
}>;

export type TaskStateProjection = Readonly<{
  fingerprint: string;
  status: TaskStatus;
  currentWorkUnit?: `W${number}`;
  requirements: readonly Readonly<{ id: `R${number}`; status: RequirementStatus }>[];
  workUnits: readonly Readonly<{ id: `W${number}`; status: WorkUnitStatus }>[];
  validations: readonly Readonly<{ id: `V${number}`; status: ValidationStatus; attempts: number }>[];
  corrections: readonly TaskCorrection[];
  blockerCount: number;
  terminalOutcome?: TaskTerminalOutcome;
  effectivePermissionExpectations: PermissionExpectation;
}>;

function freeze<T>(value: T): T { return Object.freeze(value); }
function freezeArray<T>(values: readonly T[]): readonly T[] { return freeze([...values]); }
function bounded(value: string, name: string, max = 512): string {
  if (typeof value !== 'string' || !value || value.includes('\0') || Buffer.byteLength(value, 'utf8') > max) throw new Error(`Invalid task state ${name}.`);
  return value;
}
function id(value: string, prefix: string): void { if (!new RegExp(`^${prefix}[1-9]\\d*$`).test(value)) throw new Error(`Invalid task state ${prefix} identifier.`); }
function correctionLimit(value: number): number {
  if (!Number.isInteger(value) || value < 0 || value > MAX_CORRECTION_CYCLES) throw new Error(`Task correction limit must be between 0 and ${MAX_CORRECTION_CYCLES}.`);
  return value;
}
function terminal(status: TaskStatus): status is TaskTerminalOutcome { return status === 'blocked' || status === 'planning_needed' || status === 'cancelled' || status === 'budget_exhausted' || status === 'completed' || status === 'failed'; }
function validation(definition: TaskDefinition, validationId: `V${number}`): TaskValidation {
  const result = definition.validations.find((item) => item.id === validationId);
  if (!result) throw new Error('Unknown task validation.');
  return result;
}
function work(definition: TaskDefinition, workId: `W${number}`): TaskWorkUnit {
  const result = definition.workflow.find((item) => item.id === workId);
  if (!result) throw new Error('Unknown task work unit.');
  return result;
}
function nextStatus(state: TaskState): TaskStatus {
  return state.status === 'pending' ? 'in_progress' : state.status;
}
function clone(state: TaskState, changes: Partial<TaskState>): TaskState {
  return freeze({ ...state, ...changes });
}

/** Deterministic identity for one parsed task definition; it is not provider context. */
export function taskDefinitionFingerprint(definition: TaskDefinition): string {
  return createHash('sha256').update(JSON.stringify(definition)).digest('hex');
}

/** Canonical bounded text used only to validate/reconstruct a durable parsed definition. */
export function serializeTaskDefinition(definition: TaskDefinition): string {
  const command = (item: TaskValidation) => item.command.kind === 'discover' ? 'DISCOVER' : [item.command.executable, ...item.command.arguments].map((word) => /\s/.test(word) ? `"${word}"` : word).join(' ');
  const lines = [
    'GEORGE TASK FORMAT: 1', '',
    ...(definition.stack === undefined ? [] : [`STACK: ${definition.stack}`, '']),
    `TASK: P${definition.task.ordinal} — ${definition.task.title}`, `KIND: ${definition.kind}`, '',
    'GOAL', '', ...definition.goal.lines, '',
    ...(definition.readFirst.length ? ['READ FIRST', '', ...definition.readFirst.map((entry) => `- ${entry.required ? 'REQUIRED' : 'OPTIONAL'}: ${entry.source}`), ''] : []),
    ...(definition.inspect.length ? ['INSPECT', '', ...definition.inspect.map((item) => `- ${item}`), ''] : []),
    'REQUIREMENTS', '', ...definition.requirements.map((item) => `- ${item.id}: ${item.text}`), '',
    ...(definition.invariants.length ? ['INVARIANTS', '', ...definition.invariants.map((item) => `- ${item.id}: ${item.text}`), ''] : []),
    'WORKFLOW', '', ...definition.workflow.flatMap((item) => [`${item.id} — ${item.title}`, `Covers: ${item.covers.join(', ') || 'none'}`, `Depends on: ${item.dependsOn.join(', ') || 'none'}`, ...item.description, ...(item.completeWhen.length ? ['Complete when:', ...item.completeWhen.map((criterion) => `- ${criterion}`)] : []), '']),
    'VALIDATION', '', ...definition.validations.flatMap((item) => [`${item.id} — ${item.title}`, `Covers: ${item.covers.join(', ') || 'none'}`, `Run: ${command(item)}`, ...(item.command.kind === 'discover' ? [`Scope: ${item.command.scope}`] : []), '']),
    'STOP CONDITIONS', '', ...definition.stopConditions.map((item) => `- ${item.id}: ${item.text}`), '',
    ...(definition.deliverables.length ? ['DELIVERABLES', '', ...definition.deliverables.map((item) => `- ${item.id}: ${item.text}`), ''] : []),
    ...(definition.nonGoals.length ? ['NON-GOALS', '', ...definition.nonGoals.map((item) => `- ${item}`), ''] : []),
    ...(Object.keys(definition.permissions).length ? ['PERMISSIONS', '', ...(definition.permissions.workspace === undefined ? [] : [`- Workspace: ${definition.permissions.workspace}`]), ...(definition.permissions.outsideWorkspace === undefined ? [] : [`- Outside workspace: ${definition.permissions.outsideWorkspace}`]), ...(definition.permissions.network === undefined ? [] : [`- Network: ${definition.permissions.network}`]), ...(definition.permissions.remoteMutation === undefined ? [] : [`- Remote mutation: ${definition.permissions.remoteMutation}`]), ''] : []),
    ...(definition.versioning === undefined ? [] : ['VERSIONING', '', ...definition.versioning.lines, '']),
    ...(definition.evidence === undefined ? [] : ['EVIDENCE', '', ...definition.evidence.lines, '']),
  ];
  return lines.join('\n');
}

export function parseSerializedTaskDefinition(value: string): TaskDefinition {
  const parsed = parseTaskPrompt(value);
  if (parsed.kind !== 'structured') throw new Error('Durable task definition is not structured.');
  return parsed.task;
}

/** Validates only new Task Prompt v1 stacks; historical phase-runner prompts remain its own grammar. */
export function validateTaskStack(definitions: readonly TaskDefinition[]): void {
  if (!definitions.length) throw new Error('Structured task stack must contain at least one task.');
  const stack = definitions[0]!.stack;
  if (definitions.some((definition) => definition.stack !== stack)) throw new Error('Structured task stack identity does not agree.');
  if (definitions.length > 1 && !stack) throw new Error('Multiple structured tasks require STACK metadata.');
  const ordinals = definitions.map((definition) => definition.task.ordinal);
  if (new Set(ordinals).size !== ordinals.length || ordinals.some((ordinal, index) => index && ordinal <= ordinals[index - 1]!)) throw new Error('Structured task stack numbering must be strictly increasing.');
  const closeouts = definitions.filter((definition) => definition.kind === 'closeout');
  if (closeouts.length > 1 || (closeouts.length === 1 && definitions.at(-1) !== closeouts[0])) throw new Error('Structured task stack closeout must be unique and last.');
}

export function createTaskState(options: Readonly<{
  sessionId: string;
  workspace: string;
  definition: TaskDefinition;
  correctionLimit?: number;
  effectivePermissionExpectations?: PermissionExpectation;
}>): TaskState {
  const limit = correctionLimit(options.correctionLimit ?? DEFAULT_MAX_CORRECTION_CYCLES);
  const requirements = Object.fromEntries(options.definition.requirements.map((item) => [item.id, 'pending'])) as TaskState['requirements'];
  const workUnits = Object.fromEntries(options.definition.workflow.map((item) => [item.id, 'pending'])) as TaskState['workUnits'];
  const validations = Object.fromEntries(options.definition.validations.map((item) => [item.id, freeze({ status: 'pending' as const, attempts: freezeArray<TaskValidationAttempt>([]) })])) as TaskState['validations'];
  return freeze({ schemaVersion: TASK_STATE_SCHEMA_VERSION, sessionId: bounded(options.sessionId, 'session ID', 128), workspace: bounded(options.workspace, 'workspace', 64 * 1024), definition: options.definition, definitionFingerprint: taskDefinitionFingerprint(options.definition), status: 'pending', requirements: freeze(requirements), workUnits: freeze(workUnits), inspections: freezeArray([]), validations: freeze(validations), correctionLimit: limit, corrections: freezeArray([]), blockers: freezeArray([]), effectivePermissionExpectations: freeze({ ...(options.effectivePermissionExpectations ?? options.definition.permissions) }) });
}

export function beginTaskWorkUnit(state: TaskState, workId: `W${number}`): TaskState {
  if (terminal(state.status) || state.currentWorkUnit) throw new Error('Task cannot begin another work unit.');
  const unit = work(state.definition, workId);
  if (state.workUnits[workId] !== 'pending' || unit.dependsOn.some((dependency) => state.workUnits[dependency] !== 'addressed')) throw new Error('Task work unit is not ready.');
  return clone(state, { status: nextStatus(state), currentWorkUnit: workId, workUnits: freeze({ ...state.workUnits, [workId]: 'active' }) });
}

/** Records observed inspection evidence; model narration has no transition that can call this. */
export function recordTaskInspection(state: TaskState, evidence: TaskInspectionEvidence): TaskState {
  if (!state.currentWorkUnit || terminal(state.status)) throw new Error('Task inspection is not currently allowed.');
  if (!state.definition.inspect.includes(evidence.item)) throw new Error('Inspection evidence is not declared by the task.');
  const item = freeze({ item: bounded(evidence.item, 'inspection item', 8 * 1024), source: bounded(evidence.source, 'inspection source', 512) });
  if (state.inspections.some((existing) => existing.item === item.item && existing.source === item.source)) return state;
  if (state.inspections.length >= MAX_TASK_EVIDENCE) throw new Error('Task inspection evidence exceeds its bound.');
  return clone(state, { inspections: freezeArray([...state.inspections, item]) });
}

export function addressTaskWorkUnit(state: TaskState, workId: `W${number}`): TaskState {
  if (state.currentWorkUnit !== workId || state.workUnits[workId] !== 'active') throw new Error('Task work unit is not active.');
  if (state.definition.inspect.length && state.definition.inspect.some((item) => !state.inspections.some((evidence) => evidence.item === item))) throw new Error('Required inspection evidence is incomplete.');
  const unit = work(state.definition, workId);
  const requirements = { ...state.requirements } as Record<`R${number}`, RequirementStatus>;
  for (const requirement of unit.covers) if (requirements[requirement] === 'pending') requirements[requirement] = 'addressed';
  return clone(state, { currentWorkUnit: undefined, workUnits: freeze({ ...state.workUnits, [workId]: 'addressed' }), requirements: freeze(requirements) });
}

/** Records an observed validation process result. It appends evidence and never accepts model text. */
export function recordTaskValidationAttempt(state: TaskState, validationId: `V${number}`, attempt: TaskValidationAttempt): TaskState {
  if (terminal(state.status)) throw new Error('Task validation is not currently allowed.');
  const activeCorrection = state.corrections.find((item) => item.status !== 'completed');
  if (activeCorrection && activeCorrection.validationId !== validationId) throw new Error('Only the active correction validation may run.');
  if (activeCorrection?.status === 'active') throw new Error('Task correction repair must complete before revalidation.');
  const target = validation(state.definition, validationId);
  if (target.covers.some((requirement) => state.requirements[requirement] === 'pending')) throw new Error('Validation cannot verify an unaddressed requirement.');
  const current = state.validations[validationId];
  if (!current || current.attempts.length >= MAX_VALIDATION_ATTEMPTS) throw new Error('Task validation history exceeds its bound.');
  const safe = freeze({ turnId: bounded(attempt.turnId, 'validation turn ID', 256), callId: bounded(attempt.callId, 'validation call ID', 256), status: attempt.status, exitCode: attempt.exitCode, signal: attempt.signal, ...(attempt.outcome === undefined ? {} : { outcome: attempt.outcome }) });
  if (!['passed', 'failed', 'denied', 'cancelled'].includes(safe.status) || (safe.exitCode !== null && (!Number.isInteger(safe.exitCode) || safe.exitCode < -1_000_000 || safe.exitCode > 1_000_000)) || (safe.signal !== null && (typeof safe.signal !== 'string' || safe.signal.length > 128))) throw new Error('Invalid task validation attempt.');
  const validations = { ...state.validations, [validationId]: freeze({ status: safe.status, attempts: freezeArray([...current.attempts, safe]) }) } as TaskState['validations'];
  const requirements = { ...state.requirements } as Record<`R${number}`, RequirementStatus>;
  for (const requirement of target.covers) {
    const related = state.definition.validations.filter((entry) => entry.covers.includes(requirement));
    if (related.every((entry) => validations[entry.id]!.status === 'passed')) requirements[requirement] = 'verified';
  }
  return clone(state, { validations: freeze(validations), requirements: freeze(requirements) });
}

export function beginTaskCorrection(state: TaskState, validationId: `V${number}`): TaskState {
  if (terminal(state.status) || state.validations[validationId]?.status !== 'failed' || state.corrections.some((item) => item.status !== 'completed')) throw new Error('Only a failed validation can begin correction.');
  if (state.corrections.length >= state.correctionLimit) throw new Error('Task correction limit is exhausted.');
  validation(state.definition, validationId);
  const correction = freeze({ cycle: state.corrections.length + 1, validationId, status: 'active' as const });
  return clone(state, { status: 'in_progress', corrections: freezeArray([...state.corrections, correction]) });
}

export function completeTaskCorrection(state: TaskState, cycle: number): TaskState {
  const correction = state.corrections.find((item) => item.cycle === cycle);
  if (!correction || correction.status !== 'repaired') throw new Error('Task correction is not ready for completion.');
  return clone(state, { corrections: freezeArray(state.corrections.map((item) => item.cycle === cycle ? freeze({ ...item, status: 'completed' as const }) : item)) });
}

/** Marks a normally completed repair before the canonical process revalidation. */
export function repairTaskCorrection(state: TaskState, cycle: number): TaskState {
  const correction = state.corrections.find((item) => item.cycle === cycle);
  if (!correction || correction.status !== 'active') throw new Error('Task correction is not active.');
  return clone(state, { corrections: freezeArray(state.corrections.map((item) => item.cycle === cycle ? freeze({ ...item, status: 'repaired' as const }) : item)) });
}

export function blockTask(state: TaskState, outcome: Exclude<TaskTerminalOutcome, 'completed'>, blocker: string): TaskState {
  if (terminal(state.status)) throw new Error('Task is already terminal.');
  const message = bounded(blocker, 'blocker');
  if (state.blockers.length >= MAX_TASK_EVIDENCE) throw new Error('Task blocker history exceeds its bound.');
  return clone(state, { status: outcome, terminalOutcome: outcome, blockers: freezeArray([...state.blockers, message]), currentWorkUnit: undefined });
}

export function completeTask(state: TaskState): TaskState {
  if (terminal(state.status) || state.currentWorkUnit || state.corrections.some((item) => item.status !== 'completed') || Object.values(state.workUnits).some((status) => status !== 'addressed') || Object.values(state.requirements).some((status) => status !== 'verified') || Object.values(state.validations).some((entry) => entry.status !== 'passed')) throw new Error('Task cannot complete before all work and validations verify.');
  return clone(state, { status: 'completed', terminalOutcome: 'completed' });
}

/** Presentation-only task data. It intentionally excludes prompt/file/process/provider bodies. */
export function projectTaskState(state: TaskState): TaskStateProjection {
  return freeze({ fingerprint: state.definitionFingerprint, status: state.status, ...(state.currentWorkUnit === undefined ? {} : { currentWorkUnit: state.currentWorkUnit }), requirements: freezeArray(state.definition.requirements.map(({ id }) => freeze({ id, status: state.requirements[id] }))), workUnits: freezeArray(state.definition.workflow.map(({ id }) => freeze({ id, status: state.workUnits[id] }))), validations: freezeArray(state.definition.validations.map(({ id }) => freeze({ id, status: state.validations[id]!.status, attempts: state.validations[id]!.attempts.length }))), corrections: freezeArray(state.corrections), blockerCount: state.blockers.length, ...(state.terminalOutcome === undefined ? {} : { terminalOutcome: state.terminalOutcome }), effectivePermissionExpectations: freeze({ ...state.effectivePermissionExpectations }) });
}
