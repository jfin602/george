import assert from 'node:assert/strict';
import test from 'node:test';

import {
  DEFAULT_LM_STUDIO_BASE_URL,
  GeorgeError,
  appendSessionEvent,
  cancellationError,
  createCancellation,
  createSession,
  resolveGeorgeConfig,
  validateModelId,
  validateProviderBaseUrl,
  validateWorkspace,
} from '../../../src/core/index.ts';

test('configuration resolves safe defaults without inventing a model', () => {
  const config = resolveGeorgeConfig({}, '/workspace');
  assert.equal(config.workspace, '/workspace');
  assert.equal(config.provider.baseUrl.href, `${DEFAULT_LM_STUDIO_BASE_URL}/`);
  assert.equal(config.provider.model, undefined);
  assert.equal(validateWorkspace('project', '/workspace'), '/workspace/project');
  assert.equal(validateModelId(' qwen-local '), 'qwen-local');
});

test('configuration rejects invalid workspace, model, and non-loopback provider URLs', () => {
  for (const invalid of ['', '  ', 'model\nname']) {
    assert.throws(() => validateModelId(invalid), GeorgeError);
  }
  assert.throws(() => validateWorkspace(''), GeorgeError);
  for (const url of [
    'https://example.com',
    'ftp://127.0.0.1:1234',
    'http://127.0.0.1:1234/v1',
    'http://user@127.0.0.1:1234',
  ]) {
    assert.throws(() => validateProviderBaseUrl(url), GeorgeError);
  }
  assert.equal(validateProviderBaseUrl('https://localhost:1234').hostname, 'localhost');
  assert.equal(validateProviderBaseUrl('http://[::1]:1234').hostname, '[::1]');
});

test('session retains normalized events and builds a transcript from input and deltas', () => {
  const session = createSession({ id: 'session-1', workspace: '/workspace' });
  appendSessionEvent(session, { type: 'turn.started', turnId: 'turn-1' });
  appendSessionEvent(session, { type: 'input.submitted', text: 'Hello' });
  appendSessionEvent(session, { type: 'provider.text.delta', delta: 'Hi' });
  appendSessionEvent(session, { type: 'provider.text.delta', delta: ' there' });
  assert.deepEqual(session.transcript, [
    { role: 'user', text: 'Hello' },
    { role: 'assistant', text: 'Hi there' },
  ]);
  assert.equal(session.events.length, 4);
});

test('cancellation exposes a normalized cancellation error', () => {
  const cancellation = createCancellation();
  assert.equal(cancellationError(cancellation.signal), undefined);
  cancellation.cancel('Stopped by user');
  assert.equal(cancellationError(cancellation.signal)?.code, 'cancelled');
  assert.equal(cancellationError(cancellation.signal)?.message, 'Stopped by user');
});
