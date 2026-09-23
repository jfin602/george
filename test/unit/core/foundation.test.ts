import assert from 'node:assert/strict';
import test from 'node:test';

import {
  DEFAULT_LM_STUDIO_BASE_URL,
  DEFAULT_CONTEXT_PROFILE,
  GeorgeError,
  appendSessionEvent,
  cancellationError,
  createCancellation,
  createSession,
  resolveGeorgeConfig,
  resolveGeorgeUserConfigRoot,
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
  assert.equal(resolveGeorgeUserConfigRoot({ XDG_CONFIG_HOME: '/tmp/config' }, 'linux', '/home/tester'), '/tmp/config/george');
  assert.equal(resolveGeorgeUserConfigRoot({}, 'linux', '/home/tester'), '/home/tester/.config/george');
  const configured = resolveGeorgeConfig({ userConfigRoot: '/tmp/george-config', contextProfile: DEFAULT_CONTEXT_PROFILE }, '/workspace');
  assert.equal(configured.userConfigRoot, '/tmp/george-config');
  assert.equal(configured.context.profile.providerInputTokens, 24_576);
  assert.equal(configured.context.profile.softPressureTokens, 20_000);
  assert.equal(configured.context.profile.reservedHeadroomTokens, 8_192);
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
