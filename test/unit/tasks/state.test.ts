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
  parseTaskPrompt,
  projectTaskState,
  recordTaskInspection,
  recordTaskValidationAttempt,
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
  current = completeTaskCorrection(current, 1);
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
