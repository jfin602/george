import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { appendSessionEvent, classifySessionInterruptions, createSession, LocalSessionStore, type ModelProvider, type ProviderEvent, type ProviderRequest, type ProviderStreamOptions } from '../../../src/core/index.ts';
import { createOneTurnApplicationService } from '../../../src/application/index.ts';

const sha256 = (text: string) => createHash('sha256').update(text).digest('hex');

class NeverProvider implements ModelProvider {
  calls = 0;
  async *stream(_request: ProviderRequest, _options: ProviderStreamOptions = {}): AsyncGenerator<ProviderEvent> {
    this.calls += 1;
    throw new Error('Recovery must not submit a provider continuation.');
  }
}

function interruptedWrite(workspace: string, id: string, path: string, desired: string, precondition: 'absent' | string) {
  const session = createSession({ id, workspace });
  appendSessionEvent(session, { type: 'tool.requested', turnId: 'turn', callId: id, name: 'write_file', arguments: '{}' });
  appendSessionEvent(session, { type: 'recovery.intent', turnId: 'turn', callId: id, intent: { name: 'write_file', path, desiredBytes: Buffer.byteLength(desired), desiredSha256: sha256(desired), precondition } });
  appendSessionEvent(session, { type: 'tool.started', turnId: 'turn', callId: id, name: 'write_file' });
  session.interruptions = classifySessionInterruptions(session.events);
  return session;
}

test('recovery confirms only exact writes, preserves history, and never replays ambiguous work', async (t) => {
  const workspace = await mkdtemp(join(tmpdir(), 'george-recovery-'));
  const state = await mkdtemp(join(tmpdir(), 'george-recovery-state-'));
  t.after(() => Promise.all([rm(workspace, { recursive: true, force: true }), rm(state, { recursive: true, force: true })]));
  const provider = new NeverProvider();
  const service = await createOneTurnApplicationService({ provider, workspace });
  const store = new LocalSessionStore({ root: state });

  await writeFile(join(workspace, 'exact.txt'), 'SECRET_WRITE_BODY');
  const exact = interruptedWrite(workspace, 'exact', 'exact.txt', 'SECRET_WRITE_BODY', sha256('before'));
  const absent = interruptedWrite(workspace, 'absent', 'absent.txt', 'SECRET_WRITE_BODY', 'absent');
  const unknown = interruptedWrite(workspace, 'unknown', 'unknown.txt', 'SECRET_WRITE_BODY', sha256('before'));
  await writeFile(join(workspace, 'unknown.txt'), 'someone else');
  appendSessionEvent(unknown, { type: 'tool.requested', turnId: 'turn', callId: 'patch', name: 'apply_patch', arguments: '{}' });
  appendSessionEvent(unknown, { type: 'recovery.intent', turnId: 'turn', callId: 'patch', intent: { name: 'apply_patch', path: 'unknown.txt', precondition: sha256('before'), edits: 1 } });
  appendSessionEvent(unknown, { type: 'tool.started', turnId: 'turn', callId: 'patch', name: 'apply_patch' });
  appendSessionEvent(unknown, { type: 'tool.started', turnId: 'turn', callId: 'process', name: 'run_process' });
  appendSessionEvent(unknown, { type: 'approval.requested', turnId: 'turn', callId: 'approval', request: { id: 'approval', toolName: 'write_file', risk: 'write', arguments: {}, target: { path: 'unknown.txt', alreadyDirty: true } } });
  appendSessionEvent(unknown, { type: 'provider.response.started', responseId: 'old-response' });
  unknown.interruptions = classifySessionInterruptions(unknown.events);

  for (const session of [exact, absent, unknown]) {
    const historical = structuredClone(session.events);
    await store.save(session);
    const reopened = await store.open(session.id, workspace);
    const decisions = await service.recover(reopened);
    assert.deepEqual(reopened.events.slice(0, historical.length), historical);
    assert.equal(decisions.some((event) => event.type === 'work.updated'), true);
    await store.save(reopened);
    assert.equal((await store.open(session.id, workspace)).interruptions.length, 0);
  }

  const exactDecisions = (await store.open('exact', workspace)).events.filter((event) => event.type === 'recovery.decision');
  const absentDecisions = (await store.open('absent', workspace)).events.filter((event) => event.type === 'recovery.decision');
  const unknownDecisions = (await store.open('unknown', workspace)).events.filter((event) => event.type === 'recovery.decision');
  assert.equal(exactDecisions[0]?.outcome, 'confirmed_complete');
  assert.equal(absentDecisions[0]?.outcome, 'confirmed_incomplete');
  assert.deepEqual(unknownDecisions.map((event) => event.outcome).sort(), ['interrupted', 'interrupted', 'outcome_unknown', 'outcome_unknown', 'outcome_unknown']);
  assert.equal(provider.calls, 0);
  assert.equal(await readFile(join(workspace, 'exact.txt'), 'utf8'), 'SECRET_WRITE_BODY');
  await assert.rejects(readFile(join(workspace, 'absent.txt')), /ENOENT/);
  const durable = await readFile(join(state, 'unknown.json'), 'utf8');
  assert.doesNotMatch(durable, /SECRET_WRITE_BODY|unknown patch body/i);
});
