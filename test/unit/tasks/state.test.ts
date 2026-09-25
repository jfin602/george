import assert from 'node:assert/strict';
import test from 'node:test';

import {
  DEFAULT_MAX_CORRECTION_CYCLES,
  addressTaskWorkUnit,
  beginTaskCorrection,
  beginTaskWorkUnit,
  blockTask,
  completeTask,
  completeTaskCorrection,
  createTaskState,
  repairTaskCorrection,
  parseTaskPrompt,
  projectTaskState,
  recordTaskInspection,
  recordTaskValidationAttempt,
  validateTaskStack,
} from '../../../src/tasks/index.ts';

const prompt = `GEORGE TASK FORMAT: 1

TASK: P2 — State
KIND: implementation

GOAL

Keep task truth in George.

INSPECT

- current state

REQUIREMENTS

- R1: State is addressed then verified.

WORKFLOW

W1 — Inspect
Covers: R1
Depends on: none

W2 — Implement
Covers: R1
Depends on: W1

VALIDATION

V1 — Unit
Covers: R1
Run: node --test test/unit/tasks/state.test.ts

STOP CONDITIONS

- S1: Stop on failure.
`;

function state() {
  const parsed = parseTaskPrompt(prompt);
  if (parsed.kind !== 'structured') throw new Error('Expected structured fixture.');
  return createTaskState({ sessionId: 'session', workspace: '/workspace', definition: parsed.task });
}

test('TaskState gates dependencies and inspection before application-owned addressed state', () => {
  let current = state();
  assert.equal(current.correctionLimit, DEFAULT_MAX_CORRECTION_CYCLES);
  assert.throws(() => beginTaskWorkUnit(current, 'W2'), /not ready/);
  current = beginTaskWorkUnit(current, 'W1');
  assert.throws(() => addressTaskWorkUnit(current, 'W1'), /inspection evidence/);
  current = recordTaskInspection(current, { item: 'current state', source: 'read_file:src/tasks/state.ts' });
  current = addressTaskWorkUnit(current, 'W1');
  assert.equal(current.requirements.R1, 'addressed');
  current = beginTaskWorkUnit(current, 'W2');
  current = addressTaskWorkUnit(current, 'W2');
  assert.equal(current.workUnits.W2, 'addressed');
});

test('validation observations append failures, then verify only after an observed pass', () => {
  let current = state();
  current = beginTaskWorkUnit(current, 'W1');
  current = recordTaskInspection(current, { item: 'current state', source: 'read' });
  current = addressTaskWorkUnit(current, 'W1');
  current = beginTaskWorkUnit(current, 'W2');
  current = addressTaskWorkUnit(current, 'W2');
  assert.throws(() => completeTask(current), /validations/);
  current = recordTaskValidationAttempt(current, 'V1', { turnId: 't1', callId: 'v1', status: 'failed', exitCode: 1, signal: null, outcome: 'failed' });
  assert.equal(current.requirements.R1, 'addressed');
  current = beginTaskCorrection(current, 'V1');
  current = completeTaskCorrection(repairTaskCorrection(current, 1), 1);
  current = recordTaskValidationAttempt(current, 'V1', { turnId: 't2', callId: 'v2', status: 'passed', exitCode: 0, signal: null, outcome: 'completed' });
  assert.deepEqual(current.validations.V1?.attempts.map((attempt) => attempt.status), ['failed', 'passed']);
  assert.equal(current.requirements.R1, 'verified');
  assert.equal(completeTask(current).status, 'completed');
});

test('TaskState correction bounds and projection do not expose task prompt bodies', () => {
  assert.throws(() => createTaskState({ ...state(), definition: state().definition, correctionLimit: 11 }), /between/);
  const view = projectTaskState(blockTask(state(), 'blocked', 'SECRET_PROVIDER_PAYLOAD'));
  assert.equal(JSON.stringify(view).includes('Keep task truth'), false);
  assert.equal(JSON.stringify(view).includes('node --test'), false);
  assert.equal(JSON.stringify(view).includes('SECRET_PROVIDER_PAYLOAD'), false);
  assert.equal(view.blockerCount, 1);
});

test('TaskState rejects correction once its configured cycle budget is exhausted', () => {
  let current = createTaskState({ sessionId: 'limited', workspace: '/workspace', definition: state().definition, correctionLimit: 0 });
  current = beginTaskWorkUnit(current, 'W1');
  current = recordTaskInspection(current, { item: 'current state', source: 'read' });
  current = addressTaskWorkUnit(current, 'W1');
  current = addressTaskWorkUnit(beginTaskWorkUnit(current, 'W2'), 'W2');
  current = recordTaskValidationAttempt(current, 'V1', { turnId: 'failed', callId: 'failed', status: 'failed', exitCode: 1, signal: null, outcome: 'failed' });
  assert.throws(() => beginTaskCorrection(current, 'V1'), /exhausted/);
});

test('new structured stacks require agreeing ordered metadata without changing historical prompt handling', () => {
  const first = state().definition;
  const second = { ...first, stack: 'p9', task: { ordinal: 2, title: 'Second' } } as typeof first;
  const stacked = { ...first, stack: 'p9', task: { ordinal: 1, title: 'First' } } as typeof first;
  validateTaskStack([stacked, second]);
  assert.throws(() => validateTaskStack([second, stacked]), /numbering/);
  assert.throws(() => validateTaskStack([first, second]), /identity/);
});
