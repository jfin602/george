import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { DiagnosticSink, LocalSessionStore, PerformanceMeasurements, appendSessionEvent, createSession, memorySnapshot, resolveGeorgeStateRoot, storageSnapshot, type ModelProvider } from '../../../src/core/index.ts';
import { createOneTurnApplicationService } from '../../../src/application/index.ts';

async function fixture() {
  const root = await mkdtemp(join(tmpdir(), 'george-diagnostics-'));
  const workspace = join(root, 'workspace');
  const state = join(root, 'state');
  await Promise.all([writeFile(join(root, 'marker'), ''), mkdir(workspace)]);
  return { root, workspace, state };
}

function observe(sink: DiagnosticSink, session: ReturnType<typeof createSession>, event: Parameters<DiagnosticSink['observe']>[1]) {
  appendSessionEvent(session, event);
  sink.observe(session, event);
}

test('diagnostics are external, correlated, bounded, and redact non-authoritative payloads', async (t) => {
  const { root, workspace, state } = await fixture();
  t.after(() => rm(root, { recursive: true, force: true }));
  const sink = new DiagnosticSink({ root: state, maxBytes: 4096, maxFiles: 3, clock: (() => { let now = 0; return () => ++now; })() });
  assert.equal(new DiagnosticSink().root, join(resolveGeorgeStateRoot(), 'diagnostics'));
  const session = createSession({ id: 'session-1', workspace });
  observe(sink, session, { type: 'turn.started', turnId: 'turn-1' });
  observe(sink, session, { type: 'provider.attempt.started', turnId: 'turn-1', runId: 'run-1', attemptId: 'attempt-1' });
  observe(sink, session, { type: 'provider.text.delta', delta: 'PROVISIONAL_SECRET' });
  observe(sink, session, { type: 'provider.tool.call', callId: 'call-1', name: 'write_file', arguments: '{"path":"safe.txt","content":"SECRET_WRITE_BODY"}' });
  observe(sink, session, { type: 'tool.completed', turnId: 'turn-1', callId: 'call-1', name: 'run_process', result: { ok: true, value: { stdout: 'SECRET_STDOUT', environment: 'SECRET_ENV', cleanup: { outcome: 'completed', durationMs: 2 } } } });
  observe(sink, session, { type: 'provider.error', error: { code: 'provider', message: 'bounded failure', cause: { providerCode: 'safe-code', raw: 'SECRET_PROVIDER_WIRE' } } });
  observe(sink, session, { type: 'assistant.response.completed', turnId: 'turn-1', text: 'CANONICAL_SECRET' });
  observe(sink, session, { type: 'context.compaction.completed', turnId: 'turn-1', runId: 'run-1', checkpoint: { version: 1, id: 'compact-1', start: 0, end: 2, rangeDigest: 'a'.repeat(64), summaryDigest: 'b'.repeat(64), summary: 'SECRET_COMPACTION_BODY', beforeTokens: 100, afterTokens: 10, reason: 'soft-pressure' } });
  observe(sink, session, { type: 'context.envelope.promoted', turnId: 'turn-1', fromProfileId: 'ordinary', toProfileId: 'medium', reason: 'continuation-estimate', tokens: 9_000, providerInputBudget: 16_384 });
  observe(sink, session, { type: 'recovery.decision', turnId: 'turn-1', callId: 'call-1', kind: 'mutation', outcome: 'outcome_unknown', evidence: 'bounded observation' });
  observe(sink, session, { type: 'hook.completed', turnId: 'turn-1', hookId: 'hook-1', event: 'provider.responded', status: 'succeeded', message: 'ignored output' });
  await sink.flush();

  assert.equal(state.startsWith(workspace), false);
  const files = await readdir(state);
  assert.ok(files.length <= 3);
  const serialized = (await Promise.all(files.map((file) => readFile(join(state, file), 'utf8')))).join('');
  assert.doesNotMatch(serialized, /SECRET_WRITE_BODY|SECRET_STDOUT|SECRET_ENV|SECRET_PROVIDER_WIRE|SECRET_COMPACTION_BODY|CANONICAL_SECRET/);
  assert.match(serialized, /"provisional":true/);
  assert.match(serialized, /"canonical":true/);
  assert.match(serialized, /"providerAttemptId":"attempt-1"/);
  assert.match(serialized, /"operationId":"call-1"/);
  assert.match(serialized, /"compactionCheckpointId":"compact-1"/);
  assert.match(serialized, /"recoveryDecisionId":"call-1"/);
  assert.match(serialized, /"hookInvocationId":"hook-1"/);
  assert.match(serialized, /"type":"context\.envelope\.promoted"/);
  assert.match(serialized, /"tokens":9000/);
  for (let index = 0; index < 100; index += 1) sink.measure({ workload: 'fixture', name: 'rotation', value: index, unit: 'count', fields: { marker: 'x'.repeat(128) } });
  await sink.flush();
  assert.ok((await readdir(state)).length <= 3);
  assert.ok(await sink.logBytes() <= 3 * 4096);
});

test('sink failures degrade observability without corrupting the canonical run or recursively logging', async (t) => {
  const root = await mkdtemp(join(tmpdir(), 'george-diagnostic-failure-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const blocked = join(root, 'blocked');
  await writeFile(blocked, 'not a directory');
  const sink = new DiagnosticSink({ root: blocked });
  const provider: ModelProvider = { async *stream() { yield { type: 'provider.text.delta', delta: 'canonical answer' } as const; yield { type: 'provider.response.completed' } as const; } };
  const service = await createOneTurnApplicationService({ provider, workspace: root, diagnostics: sink });
  const session = createSession({ id: 'session-1', workspace: root });
  const events = [];
  for await (const event of service.run({ session, input: 'go', turnId: 'turn-1' })) events.push(event);
  await sink.flush();
  assert.equal(sink.status().degraded, true);
  assert.ok(sink.status().failures < events.length * 2); // failure records are never sent back through the failing sink.
  assert.deepEqual(session.transcript, [{ role: 'user', text: 'go' }, { role: 'assistant', text: 'canonical answer' }]);
  assert.equal(events.at(-1)?.type, 'turn.completed');
});

test('measurement helpers use explicit units and deterministic event timing', async (t) => {
  let now = 0;
  const measurements = new PerformanceMeasurements(() => now);
  const session = createSession({ id: 'session-1', workspace: '/tmp/workspace' });
  const observeEvent = (event: Parameters<PerformanceMeasurements['observe']>[1]) => { appendSessionEvent(session, event); return measurements.observe(session, event, 'fixture'); };
  now = 0; observeEvent({ type: 'turn.started', turnId: 'turn-1' });
  now = 10; observeEvent({ type: 'context.assembled', turnId: 'turn-1', diagnostics: { profileId: 'fixture', profile: { id: 'fixture', physicalContextTokens: 10, preferredWorkingSetTokens: { min: 1, max: 9 }, softPressureTokens: 8, providerInputTokens: 9, reservedHeadroomTokens: 1, alwaysOnInstructionTokens: 1 }, estimatedTokens: 5, estimator: 'fixture', providerInputBudget: 9, remainingHeadroom: 4, softPressure: false, reservedHeadroom: 1, categoryTokens: { core: 1, project: 0, tools: 0, task: 1, skills: 0, routed: 0, conversation: 3, toolResults: 0 }, activeSourceIds: [], evidence: [] } });
  now = 20; observeEvent({ type: 'provider.attempt.started', turnId: 'turn-1', runId: 'run-1', attemptId: 'attempt-1' });
  now = 25; observeEvent({ type: 'provider.response.started', responseId: 'response-1' });
  now = 26; const first = observeEvent({ type: 'provider.text.delta', delta: 'first token' });
  now = 30; const complete = observeEvent({ type: 'provider.response.completed' });
  now = 31; const commit = observeEvent({ type: 'assistant.response.completed', turnId: 'turn-1', text: 'final' });
  now = 40; observeEvent({ type: 'tool.requested', turnId: 'turn-1', callId: 'call-1', name: 'read_file', arguments: '{"path":"a"}' });
  now = 45; observeEvent({ type: 'tool.completed', turnId: 'turn-1', callId: 'call-1', name: 'read_file', result: { ok: true, value: {} } });
  now = 50; const loop = observeEvent({ type: 'provider.attempt.started', turnId: 'turn-1', runId: 'run-1', attemptId: 'attempt-2' });
  assert.deepEqual(first.find((item) => item.name === 'provider.time_to_first_token'), { workload: 'fixture', name: 'provider.time_to_first_token', value: 6, unit: 'ms' });
  assert.deepEqual(complete.find((item) => item.name === 'provider.attempt.latency'), { workload: 'fixture', name: 'provider.attempt.latency', value: 10, unit: 'ms' });
  assert.deepEqual(complete.find((item) => item.name === 'final_response.eligibility_latency'), { workload: 'fixture', name: 'final_response.eligibility_latency', value: 10, unit: 'ms' });
  assert.deepEqual(commit.find((item) => item.name === 'final_response.commit_latency'), { workload: 'fixture', name: 'final_response.commit_latency', value: 1, unit: 'ms' });
  assert.deepEqual(loop.find((item) => item.name === 'tool_loop.latency'), { workload: 'fixture', name: 'tool_loop.latency', value: 10, unit: 'ms' });
  const memory = memorySnapshot('fixture');
  assert.equal(memory.unit, 'bytes');
  const root = await mkdtemp(join(tmpdir(), 'george-metric-storage-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const path = join(root, 'session.json');
  await writeFile(path, 'fixture');
  assert.deepEqual(await storageSnapshot('fixture', 'durable_session.size', path), { workload: 'fixture', name: 'durable_session.size', value: 7, unit: 'bytes' });
});

test('repeated fixtures report observed session, log, and memory growth without a speculative threshold', async (t) => {
  const { root, workspace, state } = await fixture();
  t.after(() => rm(root, { recursive: true, force: true }));
  const store = new LocalSessionStore({ root: join(state, 'sessions') });
  const sink = new DiagnosticSink({ root: join(state, 'diagnostics') });
  const session = createSession({ id: 'session-1', workspace });
  const sessionSizes: number[] = [];
  const logSizes: number[] = [];
  const memory: number[] = [];
  for (let index = 0; index < 2; index += 1) {
    const turnId = `turn-${index}`;
    for (const event of [
      { type: 'turn.started' as const, turnId },
      { type: 'input.submitted' as const, text: `fixture input ${'x'.repeat(index * 64)}` },
      { type: 'assistant.response.completed' as const, turnId, text: `fixture answer ${'y'.repeat(index * 64)}` },
      { type: 'turn.completed' as const, turnId },
    ]) observe(sink, session, event);
    await store.save(session);
    await sink.flush();
    sessionSizes.push((await storageSnapshot('repeat-fixture', 'durable_session.size', join(store.root, 'session-1.json'))).value);
    logSizes.push((await storageSnapshot('repeat-fixture', 'diagnostic_log.size', join(sink.root, 'diagnostics.ndjson'))).value);
    memory.push(memorySnapshot('repeat-fixture').value);
  }
  assert.ok(sessionSizes[1]! > sessionSizes[0]!);
  assert.ok(logSizes[1]! > logSizes[0]!);
  assert.equal(memory.every((value) => Number.isInteger(value) && value > 0), true);
  t.diagnostic(`observed repeat fixture: session ${sessionSizes.join(' -> ')} bytes; diagnostics ${logSizes.join(' -> ')} bytes; RSS ${memory.join(' -> ')} bytes`);
});
