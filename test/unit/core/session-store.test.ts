import assert from 'node:assert/strict';
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
  appendSessionEvent(session, { type: 'provider.response.started', responseId: 'provider-continuation-id' });
  appendSessionEvent(session, { type: 'provider.tool.call', callId: 'wire', name: 'read_file', arguments: '{"wire":"RAW_PROVIDER_WIRE"}' });
  appendSessionEvent(session, { type: 'tool.completed', turnId: 'turn-1', callId: 'finished', name: 'run_process', result: { ok: true, value: { stdout: 'UNBOUNDED_PROCESS_OUTPUT', renderable: 'TUI_RENDERABLE' } } });
  appendSessionEvent(session, { type: 'tool.requested', turnId: 'turn-1', callId: 'write', name: 'write_file', arguments: '{"content":"SECRET_WRITE_BODY"}' });
  appendSessionEvent(session, { type: 'tool.requested', turnId: 'turn-1', callId: 'process', name: 'run_process', arguments: '{"environment":"SECRET_ENV"}' });
  appendSessionEvent(session, {
    type: 'approval.requested', turnId: 'turn-1', callId: 'approval',
    request: { id: 'approval', toolName: 'write_file', risk: 'write', arguments: { content: 'SECRET_APPROVAL_BODY' }, target: { path: 'never-created.txt', alreadyDirty: false } },
  });
  await store.save(session);
  const serialized = await readFile(join(state, 'session-1.json'), 'utf8');
  assert.doesNotMatch(serialized, /SECRET_WRITE_BODY|SECRET_ENV|SECRET_APPROVAL_BODY|RAW_PROVIDER_WIRE|UNBOUNDED_PROCESS_OUTPUT|TUI_RENDERABLE|stdout|stderr|environment/);

  const reopened = await store.open('session-1', workspace);
  assert.deepEqual(reopened.interruptions.map((item) => item.kind).sort(), ['approval', 'mutation', 'process', 'provider-continuation']);
  assert.deepEqual(reopened.transcript, []);
  await assert.rejects(readFile(join(workspace, 'never-created.txt')), /ENOENT/);
});
