import assert from 'node:assert/strict';
import test from 'node:test';

import { normalizeFailureLedger, runQualificationSweep, type FailureLedgerEntryInput, type SweepObservedResult } from '../../../src/qualification/index.ts';

const ids = ['greeting', 'three-file', 'gate-a', 'b2', 'c2'] as const;

function workloads(outcomes: Partial<Record<(typeof ids)[number], Exclude<SweepObservedResult, 'Not Run'>>>, called: string[]) {
  return ids.map((id, index) => ({
    id,
    prerequisites: index === 0 ? [] : [ids[index - 1]!],
    run: async () => { called.push(id); return outcomes[id] ?? 'Green'; },
  }));
}

test('full sweep keeps ordered functional failures diagnostic without spending a workload twice', async () => {
  const cases = [
    { outcomes: {}, statuses: ['qualifying', 'qualifying', 'qualifying', 'qualifying', 'qualifying'] },
    { outcomes: { 'three-file': 'Not Green' }, statuses: ['qualifying', 'qualifying', 'diagnostic-only', 'diagnostic-only', 'diagnostic-only'] },
    { outcomes: { 'gate-a': 'Not Green' }, statuses: ['qualifying', 'qualifying', 'qualifying', 'diagnostic-only', 'diagnostic-only'] },
    { outcomes: { b2: 'Not Green' }, statuses: ['qualifying', 'qualifying', 'qualifying', 'qualifying', 'diagnostic-only'] },
  ];
  for (const item of cases) {
    const called: string[] = [];
    const result = await runQualificationSweep({ common: { state: 'Green' }, workloads: workloads(item.outcomes, called) });
    assert.deepEqual(called, ids);
    assert.deepEqual(result.results.map(({ qualificationStatus }) => qualificationStatus), item.statuses);
    assert.deepEqual(result.results.map(({ attempts }) => attempts), [1, 1, 1, 1, 1]);
  }
});

test('common invalidity and evidence-writer failure abort later workload callbacks', async () => {
  const invalidCalls: string[] = [];
  const invalid = await runQualificationSweep({ common: { state: 'Not Green', reason: 'Runtime invalid.' }, workloads: workloads({}, invalidCalls) });
  assert.deepEqual(invalidCalls, []);
  assert.equal(invalid.commonAbortReason, 'Runtime invalid.');
  assert.deepEqual(invalid.results.map(({ observedResult, qualificationStatus, attempts }) => [observedResult, qualificationStatus, attempts]), ids.map(() => ['Not Run', 'not-run', 0]));

  const writerCalls: string[] = [];
  let writes = 0;
  const writerFailure = await runQualificationSweep({
    common: { state: 'Green' },
    workloads: workloads({}, writerCalls),
    persist: async () => { writes += 1; throw new Error('disk unavailable'); },
  });
  assert.deepEqual(writerCalls, ['greeting']);
  assert.equal(writes, 1);
  assert.equal(writerFailure.commonState, 'Evidence Gap');
  assert.match(writerFailure.commonAbortReason ?? '', /Evidence writer failed: disk unavailable/);
  assert.deepEqual(writerFailure.results.map(({ attempts }) => attempts), [1, 0, 0, 0, 0]);
});

test('duplicate workload identities fail before any sweep attempt', async () => {
  let calls = 0;
  await assert.rejects(runQualificationSweep({ common: { state: 'Green' }, workloads: [
    { id: 'same', prerequisites: [], run: async () => { calls += 1; return 'Green'; } },
    { id: 'same', prerequisites: [], run: async () => { calls += 1; return 'Green'; } },
  ] }), /Duplicate sweep workload ID/);
  assert.equal(calls, 0);
});

test('failure ledger keeps independent failures, metrics, state, classifications, and evidence references', () => {
  const base = (identity: string, classification: FailureLedgerEntryInput['classification'], repairCluster: FailureLedgerEntryInput['repairCluster']): FailureLedgerEntryInput => ({
    identity, layer: 'live', workload: identity, observedState: 'Not Green', qualificationStatus: 'diagnostic-only', failureClass: 'provider', classification, repairCluster,
  });
  const entries: FailureLedgerEntryInput[] = [
    { ...base('provider-three-file', 'new', 'agent-provider-context'), code: 'context_length_exceeded', message: 'Provider failed.', tool: { name: 'read_file', callId: 'call-9' }, validation: { id: 'V1', callId: 'validation-1' }, provider: { attempts: 3, rounds: 3, inputTokens: 4_334, outputTokens: 208 }, toolCount: 9, profile: { selected: 'ordinary', promotions: ['ordinary -> medium'] }, taskState: { fingerprint: 'b'.repeat(64), status: 'failed', currentWorkUnit: 'W1' } as never, stackState: { fingerprint: 'c'.repeat(64), status: 'failed', currentTaskOrdinal: 2 } as never, hiddenAcceptance: 'failed', interventions: 0, exhausted: false, evidence: [{ path: 'evidence/three-file/attempt.json', sha256: 'a'.repeat(64) }] },
    { ...base('renderer-frame', 'retained', 'ui-test-stability'), layer: 'broad', failureClass: 'test' },
    { ...base('sandbox-process', 'intermittent', 'ui-test-stability'), layer: 'deterministic', failureClass: 'test', observedState: 'Evidence Gap' },
    { ...base('native-tty', 'environment-only', 'environment-only'), layer: 'broad', failureClass: 'environment', qualificationStatus: 'not-run', observedState: 'Evidence Gap' },
    { ...base('unknown', 'unresolved', 'unresolved'), failureClass: 'unknown' },
  ];
  const ledger = normalizeFailureLedger(entries);
  assert.equal(ledger.schemaVersion, 1);
  assert.deepEqual(ledger.entries.map(({ identity }) => identity), ['native-tty', 'provider-three-file', 'renderer-frame', 'sandbox-process', 'unknown']);
  assert.deepEqual(new Set(ledger.entries.map(({ classification }) => classification)), new Set(['new', 'retained', 'intermittent', 'environment-only', 'unresolved']));
  const provider = ledger.entries.find(({ identity }) => identity === 'provider-three-file');
  assert.deepEqual(provider?.provider, { attempts: 3, rounds: 3, inputTokens: 4_334, outputTokens: 208 });
  assert.deepEqual(provider?.tool, { name: 'read_file', callId: 'call-9' });
  assert.deepEqual(provider?.validation, { id: 'V1', callId: 'validation-1' });
  assert.deepEqual(provider?.taskState, { fingerprint: 'b'.repeat(64), status: 'failed', currentWorkUnit: 'W1' });
  assert.deepEqual(provider?.stackState, { fingerprint: 'c'.repeat(64), status: 'failed', currentTaskOrdinal: 2 });
  assert.equal(provider?.evidence?.[0]?.sha256, 'a'.repeat(64));
});

test('failure ledger rejects duplicate/unbounded identity and omits raw fields while bounding and redacting diagnostics', () => {
  const entry = {
    identity: 'bounded', layer: 'live', workload: 'three-file', observedState: 'Not Green', qualificationStatus: 'qualifying', failureClass: 'provider', classification: 'new', repairCluster: 'agent-provider-context',
    code: 'provider', message: `token=LEDGER_SECRET ${'x'.repeat(4_000)}`, rawProviderPayload: 'RAW_PROVIDER_PAYLOAD', fileBody: 'FILE_BODY',
  } as FailureLedgerEntryInput & { rawProviderPayload: string; fileBody: string };
  const json = JSON.stringify(normalizeFailureLedger([entry]));
  assert.equal(json.includes('LEDGER_SECRET'), false);
  assert.equal(json.includes('RAW_PROVIDER_PAYLOAD'), false);
  assert.equal(json.includes('FILE_BODY'), false);
  assert.equal(Buffer.byteLength(JSON.parse(json).entries[0].message, 'utf8') <= 1024, true);
  assert.throws(() => normalizeFailureLedger([entry, entry]), /Duplicate failure identity/);
  assert.throws(() => normalizeFailureLedger([{ ...entry, identity: 'x'.repeat(513) }]), /Failure identity is missing or unbounded/);
});
