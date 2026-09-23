import assert from 'node:assert/strict';
import test from 'node:test';

import { GeorgeError, RunBudget, validateRunBudget } from '../../../src/core/index.ts';

const tiny = {
  providerAttempts: 2, toolExecutions: 2, retryAttempts: 1, compactionAttempts: 1, compactionCheckpoints: 1,
  processExecutions: 1, processRuntimeMs: 10, wallClockMs: 20, contextTokens: 10, providerInputTokens: 10, providerOutputTokens: 10, softLimitPercent: 50,
} as const;

test('run budget is run-local, deterministic, and reports pressure before explicit exhaustion', () => {
  let now = 0;
  const first = new RunBudget('run-one', tiny, () => now);
  const second = new RunBudget('run-two', tiny, () => now);
  assert.deepEqual(first.consume('providerAttempts').pressure, ['providerAttempts']);
  assert.equal(first.consume('providerAttempts').snapshot.consumed.providerAttempts, 2);
  assert.equal(first.consume('providerAttempts').exhausted, 'providerAttempts');
  assert.equal(second.snapshot().consumed.providerAttempts, 0);
  now = 21;
  assert.equal(second.consume('contextTokens').exhausted, 'wallClockMs');
});

test('run budget rejects non-finite ceilings and unsafe soft thresholds', () => {
  assert.throws(() => validateRunBudget({ ...tiny, providerAttempts: Infinity }), (error: unknown) => error instanceof GeorgeError && error.code === 'configuration');
  assert.throws(() => validateRunBudget({ ...tiny, softLimitPercent: 100 }), (error: unknown) => error instanceof GeorgeError && error.code === 'configuration');
});
