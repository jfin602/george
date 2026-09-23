import assert from 'node:assert/strict';
import test from 'node:test';

import { diagnoseLmStudioToolCycle } from '../../../src/application/index.ts';
import type { ApplicationEvent } from '../../../src/core/index.ts';

const turnId = 'smoke-turn';
const runId = 'smoke-run';

test('live smoke diagnostics preserve the completed read-tool pass condition', () => {
  const result = diagnoseLmStudioToolCycle([
    { type: 'provider.attempt.started', turnId, runId, attemptId: 'a1' },
    { type: 'provider.response.started', responseId: 'r1' },
    { type: 'provider.tool.call', callId: 'read', name: 'read_file', arguments: '{"path":"BOOT.md"}' },
    { type: 'tool.started', turnId, callId: 'read', name: 'read_file' },
    { type: 'tool.completed', turnId, callId: 'read', name: 'read_file', result: { ok: true, value: { text: 'Smoke fixture boot.' } } },
    { type: 'provider.attempt.started', turnId, runId, attemptId: 'a2' },
    { type: 'provider.response.completed', usage: { inputTokens: 12, outputTokens: 3 } },
    { type: 'turn.completed', turnId },
  ], 12.8);

  assert.equal(result.classification, 'success');
  assert.equal(result.toolCompleted, true);
  assert.deepEqual(result.usage, { inputTokens: 12, outputTokens: 3 });
  assert.equal(result.elapsedMs, 13);
});

test('live smoke diagnostics classify completed no-tool, tool failure, and post-tool turn failure', () => {
  const noTool = diagnoseLmStudioToolCycle([{ type: 'turn.completed', turnId }], 1);
  assert.equal(noTool.classification, 'completed-without-tool');

  const toolFailure = diagnoseLmStudioToolCycle([
    { type: 'provider.tool.call', callId: 'bad', name: 'read_file', arguments: '{"path":"missing"}' },
    { type: 'tool.failed', turnId, callId: 'bad', name: 'read_file', result: { ok: false, error: { code: 'validation', message: 'Path must name a file.' } } },
    { type: 'turn.failed', turnId, error: { code: 'tool', message: 'Tool failed.' } },
  ], 1);
  assert.equal(toolFailure.classification, 'tool-failed');
  assert.deepEqual(toolFailure.toolFailure, { code: 'validation', message: 'Path must name a file.' });

  const continuationFailure = diagnoseLmStudioToolCycle([
    { type: 'tool.completed', turnId, callId: 'read', name: 'read_file', result: { ok: true, value: {} } },
    { type: 'turn.failed', turnId, error: { code: 'provider', message: 'Continuation failed.' } },
  ], 1);
  assert.equal(continuationFailure.classification, 'turn-failed-after-successful-tool');

  const unrelatedTool = diagnoseLmStudioToolCycle([
    { type: 'provider.tool.call', callId: 'read', name: 'read_file', arguments: '{"path":"BOOT.md"}' },
    { type: 'tool.completed', turnId, callId: 'read', name: 'read_file', result: { ok: true, value: {} } },
    { type: 'provider.tool.call', callId: 'write', name: 'write_file', arguments: '{"path":"blocked.txt"}' },
    { type: 'turn.completed', turnId },
  ], 1);
  assert.notEqual(unrelatedTool.classification, 'success');
  assert.deepEqual(unrelatedTool.requestedTools, ['read_file', 'write_file']);

  const unsafeName = diagnoseLmStudioToolCycle([
    { type: 'provider.tool.call', callId: 'read', name: 'read_file', arguments: '{"path":"BOOT.md"}' },
    { type: 'tool.completed', turnId, callId: 'read', name: 'read_file', result: { ok: true, value: {} } },
    { type: 'provider.tool.call', callId: 'unsafe', name: '../write_file', arguments: '{}' },
    { type: 'turn.completed', turnId },
  ], 1);
  assert.notEqual(unsafeName.classification, 'success');
  assert.deepEqual(unsafeName.requestedTools, ['read_file']);
});

test('live smoke diagnostics classify retry exhaustion, post-response provider failures, budgets, and cancellation', () => {
  const retried = diagnoseLmStudioToolCycle([
    { type: 'provider.attempt.started', turnId, runId, attemptId: 'a1' },
    { type: 'provider.retry.scheduled', turnId, runId, attemptId: 'a1', retry: 1, delayMs: 1, category: 'provider' },
    { type: 'provider.attempt.started', turnId, runId, attemptId: 'a2' },
    { type: 'provider.retry.exhausted', turnId, runId, attemptId: 'a2', retries: 1, category: 'provider' },
    { type: 'turn.failed', turnId, error: { code: 'provider', message: 'Offline.' } },
  ], 1);
  assert.equal(retried.classification, 'provider-failed-before-response-retry-exhausted');
  assert.equal(retried.providerAttempts, 2);
  assert.equal(retried.retriesScheduled, 1);

  const afterResponse = diagnoseLmStudioToolCycle([
    { type: 'provider.response.started', responseId: 'r1' },
    { type: 'provider.text.delta', delta: 'partial' },
    { type: 'turn.failed', turnId, error: { code: 'provider', message: 'Disconnected.' } },
  ], 1);
  assert.equal(afterResponse.classification, 'provider-failed-after-response-start');

  const budget = diagnoseLmStudioToolCycle([
    { type: 'budget.pressure', turnId, runId, dimensions: ['providerAttempts'], budget: {} as never },
    { type: 'budget.exhausted', turnId, runId, dimension: 'providerAttempts', budget: {} as never },
    { type: 'turn.failed', turnId, error: { code: 'budget', message: 'Run budget exhausted.' } },
  ], 1);
  assert.equal(budget.classification, 'budget-exhausted');
  assert.deepEqual(budget.budgetPressure, ['providerAttempts']);

  const cancelled = diagnoseLmStudioToolCycle([{ type: 'turn.cancelled', turnId, error: { code: 'cancelled', message: 'Stopped.' } }], 1);
  assert.equal(cancelled.classification, 'cancelled');

  const incomplete = diagnoseLmStudioToolCycle([
    { type: 'provider.attempt.started', turnId, runId, attemptId: 'a1' },
    { type: 'provider.error', error: { code: 'provider', message: 'Disconnected.' } },
  ], 1);
  assert.equal(incomplete.classification, 'provider-or-tool-activity-without-terminal-turn');
  assert.equal(incomplete.providerError, true);
});

test('live smoke diagnostics never include arguments, results, or provider causes', () => {
  const secret = 'SUPER-SECRET-FILE-CONTENT';
  const events: ApplicationEvent[] = [
    { type: 'provider.tool.call', callId: 'read', name: 'read_file', arguments: `{"path":"secret.txt","content":"${secret}"}` },
    { type: 'tool.completed', turnId, callId: 'read', name: 'read_file', result: { ok: true, value: { text: secret } } },
    { type: 'turn.failed', turnId, error: { code: 'provider', message: 'Continuation failed.', cause: { payload: secret } } },
  ];
  const serialized = JSON.stringify(diagnoseLmStudioToolCycle(events, 1));
  assert.doesNotMatch(serialized, new RegExp(secret));
  assert.doesNotMatch(serialized, /secret\.txt|"arguments"|"payload"/);
});
