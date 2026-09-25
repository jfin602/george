import assert from 'node:assert/strict';
import test from 'node:test';

import { addressTaskWorkUnit, beginStackTask, beginTaskWorkUnit, completeTask, createStackState, parseTaskPrompt, projectStackState, recordTaskValidationAttempt, updateCurrentStackTask } from '../../../src/tasks/index.ts';

const prompt = (ordinal: number, kind = 'implementation') => `GEORGE TASK FORMAT: 1

STACK: stack-state-test
TASK: P${ordinal} — Task ${ordinal}
KIND: ${kind}

GOAL

Complete task ${ordinal}.

REQUIREMENTS

- R1: Task completes.

WORKFLOW

W1 — Work
Covers: R1
Depends on: none

VALIDATION

V1 — Check
Covers: R1
Run: node --version

STOP CONDITIONS

- S1: Stop truthfully.
`;

const definition = (ordinal: number, kind?: string) => {
  const parsed = parseTaskPrompt(prompt(ordinal, kind));
  if (parsed.kind !== 'structured') throw new Error('Expected structured task.');
  return parsed.task;
};

test('StackState preserves completed TaskState history and projects ordered progress', () => {
  let stack = createStackState({ sessionId: 'stack', workspace: '/workspace', definitions: [definition(1), definition(2), definition(3, 'closeout')] });
  stack = beginStackTask(stack, 0);
  let task = beginTaskWorkUnit(stack.tasks[0]!.taskState, 'W1');
  task = addressTaskWorkUnit(task, 'W1');
  task = recordTaskValidationAttempt(task, 'V1', { turnId: 'p1', callId: 'v1', status: 'passed', exitCode: 0, signal: null, outcome: 'completed' });
  task = completeTask(task);
  stack = updateCurrentStackTask(stack, task);
  stack = beginStackTask(stack, 1);

  assert.deepEqual(stack.completedTaskOrdinals, [1]);
  assert.equal(stack.tasks[0]?.taskState.validations.V1.attempts.length, 1);
  assert.equal(stack.tasks[1]?.status, 'pending');
  assert.deepEqual(projectStackState(stack).tasks.map((item) => item.status), ['completed', 'pending', 'pending']);
});
