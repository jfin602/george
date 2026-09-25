import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtemp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import {
  DURABLE_SESSION_SCHEMA_VERSION,
  LocalSessionStore,
  MAX_DURABLE_SESSION_BYTES,
  appendSessionEvent,
  createSession,
  resolveGeorgeStateRoot,
} from '../../../src/core/index.ts';
import { addressTaskWorkUnit, beginTaskWorkUnit, createTaskState, parseTaskPrompt, recordTaskInspection, recordTaskValidationAttempt } from '../../../src/tasks/index.ts';

async function fixture(): Promise<{ root: string; workspace: string; state: string }> {
  const root = await mkdtemp(join(tmpdir(), 'george-session-store-'));
  const workspace = join(root, 'workspace');
  const state = join(root, 'state');
  await mkdir(workspace);
  return { root, workspace, state };
}

test('state roots honor platform defaults and explicit stores use their exact override', () => {
  assert.equal(resolveGeorgeStateRoot({ XDG_STATE_HOME: '/tmp/state' }, 'linux', '/home/tester'), '/tmp/state/george');
  assert.equal(resolveGeorgeStateRoot({}, 'linux', '/home/tester'), '/home/tester/.local/state/george');
  assert.equal(resolveGeorgeStateRoot({}, 'darwin', '/Users/tester'), '/Users/tester/Library/Application Support/george');
  assert.equal(resolveGeorgeStateRoot({ LOCALAPPDATA: 'C:/State' }, 'win32', 'C:/Users/tester'), 'C:/State/george');
  assert.equal(new LocalSessionStore({ root: '/tmp/fixture-state' }).root, '/tmp/fixture-state');
});

test('durable sessions bind a canonical workspace and reconstruct clean completed history', async () => {
  const { workspace, state } = await fixture();
  const store = new LocalSessionStore({ root: state });
  const session = createSession({ id: 'session-1', workspace });
  appendSessionEvent(session, { type: 'turn.started', turnId: 'turn-1' });
  appendSessionEvent(session, { type: 'input.submitted', text: 'Inspect this workspace.' });
  appendSessionEvent(session, { type: 'provider.text.delta', delta: 'It is ' });
  appendSessionEvent(session, { type: 'provider.text.delta', delta: 'ready.' });
  appendSessionEvent(session, { type: 'provider.response.completed', usage: { inputTokens: 3, outputTokens: 2 } });
  appendSessionEvent(session, { type: 'assistant.response.completed', turnId: 'turn-1', text: 'It is ready.' });
  appendSessionEvent(session, { type: 'turn.completed', turnId: 'turn-1' });
  await store.save(session);

  const raw = JSON.parse(await readFile(join(state, 'session-1.json'), 'utf8')) as { schemaVersion: number; workspace: string };
  assert.equal(raw.schemaVersion, DURABLE_SESSION_SCHEMA_VERSION);
  assert.equal(raw.workspace, workspace);
  const reopened = await store.open('session-1', workspace);
  assert.deepEqual(reopened.transcript, [
    { role: 'user', text: 'Inspect this workspace.' },
    { role: 'assistant', text: 'It is ready.' },
  ]);
  assert.equal(reopened.events.some((event) => event.type === 'provider.text.delta'), false);

  const other = join(state, '..', 'other-workspace');
  await mkdir(other);
  await assert.rejects(store.open('session-1', other), /different workspace/);
});

test('resaving a reopened session preserves prior canonical history without persisting an unfinished tail', async () => {
  const { workspace, state } = await fixture();
  const store = new LocalSessionStore({ root: state });
  const session = createSession({ id: 'resave-1', workspace });
  appendSessionEvent(session, { type: 'input.submitted', text: 'completed request' });
  appendSessionEvent(session, { type: 'assistant.response.completed', turnId: 'completed', text: 'completed answer' });
  appendSessionEvent(session, { type: 'turn.completed', turnId: 'completed' });
  await store.save(session);

  const reopened = await store.open('resave-1', workspace);
  appendSessionEvent(reopened, { type: 'input.submitted', text: 'unfinished request' });
  await store.save(reopened);
  assert.deepEqual((await store.open('resave-1', workspace)).transcript, [
    { role: 'user', text: 'completed request' }, { role: 'assistant', text: 'completed answer' },
  ]);
});

test('opening rejects malformed, unsupported, oversized, and invalid normalized durable state', async () => {
  const { workspace, state } = await fixture();
  const store = new LocalSessionStore({ root: state });
  await mkdir(state);
  const path = join(state, 'session-1.json');
  await writeFile(path, '{not json');
  await assert.rejects(store.open('session-1', workspace), /Unable to read durable session/);
  await writeFile(path, JSON.stringify({ schemaVersion: 99, id: 'session-1', workspace, transcript: [], events: [] }));
  await assert.rejects(store.open('session-1', workspace), /unsupported schema/);
  await writeFile(path, JSON.stringify({ schemaVersion: DURABLE_SESSION_SCHEMA_VERSION, id: 'session-1', workspace, transcript: [], events: [{ type: 'not.normalized' }] }));
  await assert.rejects(store.open('session-1', workspace), /event type is invalid/);
  await writeFile(path, 'x'.repeat(MAX_DURABLE_SESSION_BYTES + 1));
  await assert.rejects(store.open('session-1', workspace), /byte bound/);
});

test('legacy sessions remain openable while current TaskState round-trips safely', async () => {
  const { workspace, state } = await fixture();
  const store = new LocalSessionStore({ root: state });
  await mkdir(state);
  await writeFile(join(state, 'legacy.json'), JSON.stringify({ schemaVersion: 1, id: 'legacy', workspace, transcript: [], events: [] }));
  assert.equal((await store.open('legacy', workspace)).taskState, undefined);

  const parsed = parseTaskPrompt(`GEORGE TASK FORMAT: 1

TASK: P2 — Persist
KIND: implementation

GOAL

Persist bounded state.

INSPECT

- session store

REQUIREMENTS

- R1: State reopens.

WORKFLOW

W1 — Persist
Covers: R1
Depends on: none

VALIDATION

V1 — Unit
Covers: R1
Run: node --test test/unit/core/session-store.test.ts

STOP CONDITIONS

- S1: Stop on failure.
`);
  if (parsed.kind !== 'structured') throw new Error('Expected structured task.');
  const session = createSession({ id: 'task-session', workspace });
  let taskState = recordTaskInspection(beginTaskWorkUnit(createTaskState({ sessionId: session.id, workspace, definition: parsed.task }), 'W1'), { item: 'session store', source: 'read_file' });
  taskState = addressTaskWorkUnit(taskState, 'W1');
  taskState = recordTaskValidationAttempt(taskState, 'V1', {
    turnId: 'validation', callId: 'failed', status: 'failed', exitCode: 1, signal: null, outcome: 'failed',
    stdout: 'useful output', stderr: `API_TOKEN=DO_NOT_PERSIST\n${'x'.repeat(3000)}`, stdoutTruncated: false, stderrTruncated: false,
  });
  session.taskState = taskState;
  await store.save(session);
  const serialized = await readFile(join(state, 'task-session.json'), 'utf8');
  assert.match(serialized, /"schemaVersion":3/);
  assert.doesNotMatch(serialized, /raw provider|DO_NOT_PERSIST/i);
  const reopened = await store.open(session.id, workspace);
  assert.equal(reopened.taskState?.definitionFingerprint, session.taskState.definitionFingerprint);
  assert.deepEqual(reopened.taskState?.inspections, [{ item: 'session store', source: 'read_file' }]);
  assert.equal(reopened.taskState?.validations.V1?.attempts[0]?.stdout, 'useful output');
  assert.match(reopened.taskState?.validations.V1?.attempts[0]?.stderr ?? '', /API_TOKEN=\[redacted\]/);
  assert.equal(reopened.taskState?.validations.V1?.attempts[0]?.stderrTruncated, true);
  assert.equal(reopened.taskState?.validations.V1?.attempts[0]?.redacted, true);

  const legacyV2 = JSON.parse(serialized) as { schemaVersion: number; id: string; taskState: { sessionId: string } };
  legacyV2.schemaVersion = 2;
  legacyV2.id = 'task-session-v2';
  legacyV2.taskState.sessionId = legacyV2.id;
  await writeFile(join(state, 'task-session-v2.json'), JSON.stringify(legacyV2));
  assert.equal((await store.open('task-session-v2', workspace)).taskState?.definitionFingerprint, session.taskState.definitionFingerprint);

  const malformed = JSON.parse(serialized) as { taskState: { status: string } };
  malformed.taskState.status = 'green';
  await writeFile(join(state, 'task-session.json'), JSON.stringify(malformed));
  await assert.rejects(store.open(session.id, workspace), /task status is invalid/);
});

test('pre-adaptive context diagnostics reopen as fixed derived evidence', async () => {
  const { workspace, state } = await fixture();
  const store = new LocalSessionStore({ root: state });
  await mkdir(state);
  const profile = { id: 'legacy', physicalContextTokens: 10, preferredWorkingSetTokens: { min: 1, max: 9 }, softPressureTokens: 8, providerInputTokens: 9, reservedHeadroomTokens: 1, alwaysOnInstructionTokens: 1 };
  await writeFile(join(state, 'legacy.json'), JSON.stringify({
    schemaVersion: DURABLE_SESSION_SCHEMA_VERSION, id: 'legacy', workspace, transcript: [], events: [{
      type: 'context.assembled', turnId: 'turn-1', diagnostics: { profileId: 'legacy', profile, estimatedTokens: 5, estimator: 'legacy', providerInputBudget: 9, remainingHeadroom: 4, softPressure: false, reservedHeadroom: 1, categoryTokens: { core: 1, project: 0, tools: 0, task: 1, skills: 0, routed: 0, conversation: 3, toolResults: 0 }, activeSourceIds: [], evidence: [] },
    }],
  }));
  const event = (await store.open('legacy', workspace)).events[0];
  if (event?.type !== 'context.assembled') throw new Error('Expected context diagnostics.');
  assert.equal(event.diagnostics.mode, 'fixed');
  assert.deepEqual(event.diagnostics.attemptedProfileIds, []);
  assert.deepEqual(event.diagnostics.promotionReasons, []);
});

test('failed persistence preserves the previous complete file', async () => {
  const { workspace, state } = await fixture();
  const store = new LocalSessionStore({ root: state });
  const session = createSession({ id: 'session-1', workspace });
  appendSessionEvent(session, { type: 'input.submitted', text: 'original' });
  await store.save(session);
  const before = await readFile(join(state, 'session-1.json'), 'utf8');
  session.events = Array.from({ length: 2049 }, () => ({ type: 'turn.started', turnId: 'turn-1' }));
  await assert.rejects(store.save(session), /event history exceeds its bound/);
  assert.equal(await readFile(join(state, 'session-1.json'), 'utf8'), before);
});

test('durable evidence is bounded, excludes raw payloads, and classifies incomplete work without replaying it', async () => {
  const { workspace, state } = await fixture();
  const store = new LocalSessionStore({ root: state });
  const session = createSession({ id: 'session-1', workspace });
  appendSessionEvent(session, { type: 'input.submitted', text: 'continue safely' });
  appendSessionEvent(session, { type: 'provider.error', error: { code: 'provider', message: 'LM Studio response.failed: server_error', cause: { providerCode: 'server_error', raw: 'TOP_SECRET_PROVIDER_PAYLOAD' } } });
  appendSessionEvent(session, { type: 'provider.response.started', responseId: 'provider-continuation-id' });
  appendSessionEvent(session, { type: 'provider.tool.call', callId: 'wire', name: 'read_file', arguments: '{"wire":"RAW_PROVIDER_WIRE"}' });
  appendSessionEvent(session, { type: 'tool.completed', turnId: 'turn-1', callId: 'finished', name: 'run_process', result: { ok: true, value: { stdout: 'UNBOUNDED_PROCESS_OUTPUT', renderable: 'TUI_RENDERABLE' } } });
  appendSessionEvent(session, { type: 'tool.requested', turnId: 'turn-1', callId: 'write', name: 'write_file', arguments: '{"content":"SECRET_WRITE_BODY"}' });
  appendSessionEvent(session, { type: 'tool.requested', turnId: 'turn-1', callId: 'process', name: 'run_process', arguments: '{"environment":"SECRET_ENV"}' });
  appendSessionEvent(session, {
    type: 'approval.requested', turnId: 'turn-1', callId: 'approval',
    request: { id: 'approval', toolName: 'write_file', execution: { effect: 'workspace_mutation', replaySafety: 'not_replay_safe', source: { kind: 'builtin' } }, target: { path: 'never-created.txt', alreadyDirty: false } },
  });
  await store.save(session);
  const serialized = await readFile(join(state, 'session-1.json'), 'utf8');
  assert.doesNotMatch(serialized, /SECRET_WRITE_BODY|SECRET_ENV|SECRET_APPROVAL_BODY|RAW_PROVIDER_WIRE|UNBOUNDED_PROCESS_OUTPUT|TUI_RENDERABLE|TOP_SECRET_PROVIDER_PAYLOAD|stdout|stderr|environment/);

  const reopened = await store.open('session-1', workspace);
  assert.deepEqual(reopened.interruptions.map((item) => item.kind).sort(), ['approval', 'mutation', 'process', 'provider-continuation']);
  assert.deepEqual(reopened.transcript, []);
  await assert.rejects(readFile(join(workspace, 'never-created.txt')), /ENOENT/);
});

test('durable sessions retain only bounded normalized run-budget evidence', async () => {
  const { workspace, state } = await fixture();
  const store = new LocalSessionStore({ root: state });
  const session = createSession({ id: 'budget-session', workspace });
  const budget = {
    runId: 'run-1', elapsedMs: 4,
    limits: { providerAttempts: 2, toolExecutions: 2, retryAttempts: 1, compactionAttempts: 1, compactionCheckpoints: 1, processExecutions: 1, processRuntimeMs: 10, wallClockMs: 20, contextTokens: 10, providerInputTokens: 10, providerOutputTokens: 10 },
    consumed: { providerAttempts: 2, toolExecutions: 0, retryAttempts: 0, compactionAttempts: 0, compactionCheckpoints: 0, processExecutions: 0, processRuntimeMs: 0, wallClockMs: 4, contextTokens: 4, providerInputTokens: 0, providerOutputTokens: 0 },
  } as const;
  appendSessionEvent(session, { type: 'reliability.run.started', turnId: 'turn-1', runId: 'run-1', budget });
  appendSessionEvent(session, { type: 'provider.retry.scheduled', turnId: 'turn-1', runId: 'run-1', attemptId: 'p1a1-run-1', retry: 1, delayMs: 7, category: 'provider' });
  appendSessionEvent(session, { type: 'provider.retry.exhausted', turnId: 'turn-1', runId: 'run-1', attemptId: 'p1a3-run-1', retries: 2, category: 'provider' });
  appendSessionEvent(session, { type: 'budget.pressure', turnId: 'turn-1', runId: 'run-1', dimensions: ['providerAttempts'], budget });
  appendSessionEvent(session, { type: 'budget.exhausted', turnId: 'turn-1', runId: 'run-1', dimension: 'providerAttempts', budget });
  await store.save(session);
  const reopened = await store.open('budget-session', workspace);
  assert.deepEqual(reopened.events.map((event) => event.type), ['reliability.run.started', 'provider.retry.scheduled', 'provider.retry.exhausted', 'budget.pressure', 'budget.exhausted']);
  const serialized = await readFile(join(state, 'budget-session.json'), 'utf8');
  assert.doesNotMatch(serialized, /provider payload|stdout|environment/i);
});

test('durable sessions retain bounded valid compaction checkpoints without changing schema-1 transcript history', async () => {
  const { workspace, state } = await fixture();
  const store = new LocalSessionStore({ root: state });
  const session = createSession({ id: 'checkpoint-session', workspace });
  const summary = 'Derived older completed history.';
  appendSessionEvent(session, { type: 'context.compaction.completed', turnId: 'turn-1', runId: 'run-1', checkpoint: {
    version: 1, id: 'compact-123', start: 0, end: 2,
    rangeDigest: 'a'.repeat(64), summaryDigest: createHash('sha256').update(summary).digest('hex'), summary,
    beforeTokens: 100, afterTokens: 8, reason: 'hard-pressure',
  } });
  await store.save(session);
  const reopened = await store.open('checkpoint-session', workspace);
  assert.deepEqual(reopened.events, session.events);
  assert.deepEqual(reopened.transcript, []);
});

test('durable hook evidence retains only bounded normalized outcome metadata', async () => {
  const { workspace, state } = await fixture();
  const store = new LocalSessionStore({ root: state });
  const session = createSession({ id: 'hook-session', workspace });
  appendSessionEvent(session, { type: 'hook.started', turnId: 'turn-1', hookId: 'audit-hook', event: 'provider.responded' });
  appendSessionEvent(session, { type: 'hook.completed', turnId: 'turn-1', hookId: 'audit-hook', event: 'provider.responded', status: 'succeeded', message: 'bounded result' });
  appendSessionEvent(session, { type: 'tool.started', turnId: 'turn-1', callId: 'hook-call', name: 'run_process', origin: { hookId: 'audit-hook' } });
  await store.save(session);
  const reopened = await store.open('hook-session', workspace);
  assert.deepEqual(reopened.events.map((event) => event.type), ['hook.started', 'hook.completed', 'tool.started']);
  assert.equal(reopened.events.at(-1)?.type === 'tool.started' && reopened.events.at(-1).origin?.hookId, 'audit-hook');
  const serialized = await readFile(join(state, 'hook-session.json'), 'utf8');
  assert.doesNotMatch(serialized, /stdout|environment|arguments/i);
});

test('durable external interruption retains only safe metadata and remains outcome unknown', async () => {
  const { workspace, state } = await fixture();
  const store = new LocalSessionStore({ root: state });
  const session = createSession({ id: 'external-session', workspace });
  appendSessionEvent(session, {
    type: 'tool.started', turnId: 'turn-1', callId: 'remote', name: 'remote_fixture',
    execution: { effect: 'remote_mutation', replaySafety: 'not_replay_safe', source: { kind: 'adapter', id: 'fixture' }, descriptor: { service: 'Fixture', origin: 'https://fixture.invalid', operation: 'change', credentialConfigured: true } },
  });
  await store.save(session);
  const serialized = await readFile(join(state, 'external-session.json'), 'utf8');
  assert.match(serialized, /remote_mutation|fixture\.invalid|credentialConfigured/);
  assert.doesNotMatch(serialized, /SECRET|token|authorization/i);
  const reopened = await store.open('external-session', workspace);
  assert.deepEqual(reopened.interruptions, [{ kind: 'external', turnId: 'turn-1', callId: 'remote', name: 'remote_fixture' }]);
});
