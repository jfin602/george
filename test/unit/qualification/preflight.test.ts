import assert from 'node:assert/strict';
import test from 'node:test';

import { classifyQualificationPreflight, type BroadObservation, type BroadRunSummary, type QualificationState } from '../../../src/qualification/index.ts';

const failures = Array.from({ length: 5 }, (_, index): BroadObservation => ({ identity: `renderer ${index + 1}`, outcome: 'failed', category: 'renderer-assertion', signature: `actual frame ${index + 1} differs from expected frame` }));
const nativeSkip: BroadObservation = { identity: 'native TTY smoke', outcome: 'skipped', category: 'native-environment', signature: 'usable real TTY unavailable' };
const summary = (observations: readonly BroadObservation[], overrides: Partial<BroadRunSummary> = {}): BroadRunSummary => {
  const failed = observations.filter(({ outcome }) => outcome === 'failed').length;
  const skipped = observations.filter(({ outcome }) => outcome === 'skipped').length;
  const passed = 100;
  return { state: failed || skipped ? 'not_green' : 'green', commit: 'commit', nodeVersion: 'v26.10.0', npmVersion: '11.19.1', command: 'npm test', dependencyIdentity: 'sha256:dependencies', environment: 'non-tty; TERM=dumb; CI unset', total: passed + failed + skipped, passed, failed, skipped, observations, ...overrides };
};
const classify = (baseline: BroadRunSummary, candidate: BroadRunSummary, hardPreflight: QualificationState = 'green') => classifyQualificationPreflight({ hardPreflight, baseline, candidate });

test('retained broad failures stay aggregate Not Green while the delta and live eligibility are Green', () => {
  const observations = [...failures, nativeSkip];
  const result = classify(summary(observations, { commit: 'baseline' }), summary([...observations].reverse(), { commit: 'candidate' }));
  assert.equal(result.aggregateBroad, 'not_green');
  assert.equal(result.broadRegressionDelta, 'green');
  assert.equal(result.liveEligibility, 'green');
  assert.deepEqual(result.matched.map(({ identity }) => identity), [...observations].sort((a, b) => `${a.outcome}\0${a.identity}`.localeCompare(`${b.outcome}\0${b.identity}`)).map(({ identity }) => identity));
});

test('new identities and affected pass-to-fail or pass-to-skip transitions are Not Green even when counts match', () => {
  const baseline = summary([failures[0]!]);
  for (const outcome of ['failed', 'skipped'] as const) {
    const changed: BroadObservation = { identity: 'previously passing affected test', outcome, category: 'assertion', signature: 'new candidate outcome' };
    const result = classify(baseline, summary([changed]));
    assert.equal(result.broadRegressionDelta, 'not_green');
    assert.equal(result.liveEligibility, 'not_green');
    assert.deepEqual(result.new, [changed]);
  }
});

test('a materially changed retained category or signature is Not Green', () => {
  for (const changed of [{ ...failures[0]!, category: 'timeout' }, { ...failures[0]!, signature: 'process now crashes' }]) {
    const result = classify(summary([failures[0]!]), summary([changed]));
    assert.equal(result.broadRegressionDelta, 'not_green');
    assert.deepEqual(result.worsened, [changed]);
  }
});

test('missing, inconsistent, unbounded, or non-equivalent evidence is an Evidence Gap', () => {
  const baseline = summary([failures[0]!]);
  const cases = [
    summary([failures[0]!], { state: 'evidence_gap' }),
    summary([failures[0]!], { failed: 2, total: 103 }),
    summary([{ ...failures[0]!, signature: 'x'.repeat(301) }]),
    summary([failures[0]!], { environment: '' }),
    summary([failures[0]!], { nodeVersion: 'v26.11.0' }),
  ];
  for (const candidate of cases) {
    const result = classify(baseline, candidate);
    assert.equal(result.broadRegressionDelta, 'evidence_gap');
    assert.equal(result.liveEligibility, 'evidence_gap');
    if (candidate.failed === 2) assert.equal(result.aggregateBroad, 'evidence_gap');
    assert.equal(result.reasons.every((reason) => reason.length < 160), true);
  }
});

test('hard Not Green or Evidence Gap blocks regardless of a Green broad delta', () => {
  const broad = summary([failures[0]!]);
  assert.equal(classify(broad, broad, 'not_green').liveEligibility, 'not_green');
  assert.equal(classify(broad, broad, 'evidence_gap').liveEligibility, 'evidence_gap');
});

test('a fully passing broad candidate is aggregate and delta Green', () => {
  const result = classify(summary([failures[0]!]), summary([]));
  assert.equal(result.aggregateBroad, 'green');
  assert.equal(result.broadRegressionDelta, 'green');
  assert.equal(result.liveEligibility, 'green');
});
