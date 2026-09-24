import assert from 'node:assert/strict';
import test from 'node:test';

import {
  DEFAULT_LM_STUDIO_BASE_URL,
  DEFAULT_LM_STUDIO_MODEL_ID,
  DEFAULT_PROVIDER_TIMEOUT_MS,
  DEFAULT_CONTEXT_PROFILE,
  CONTEXT_PROFILE_REGISTRY,
  LARGE_CONTEXT_PROFILE,
  MEDIUM_CONTEXT_PROFILE,
  ORDINARY_CONTEXT_PROFILE,
  GeorgeError,
  appendSessionEvent,
  cancellationError,
  createCancellation,
  createSession,
  resolveGeorgeConfig,
  resolveGeorgeUserConfigRoot,
  contextProfileForName,
  validateContextOperatingMode,
  validateContextProfile,
  validateModelId,
  validateProviderBaseUrl,
  validateWorkspace,
} from '../../../src/core/index.ts';

test('configuration resolves the pinned Qwen default while preserving model overrides', () => {
  const config = resolveGeorgeConfig({}, '/workspace');
  assert.equal(config.workspace, '/workspace');
  assert.equal(config.provider.baseUrl.href, `${DEFAULT_LM_STUDIO_BASE_URL}/`);
  assert.equal(config.provider.model, DEFAULT_LM_STUDIO_MODEL_ID);
  assert.equal(DEFAULT_LM_STUDIO_MODEL_ID, 'qwen3-coder-30b-a3b-instruct@q4_k_m');
  const environmentOverride = resolveGeorgeConfig({}, '/workspace', {
    environment: { GEORGE_MODEL: 'environment-model' },
  });
  assert.equal(environmentOverride.provider.model, 'environment-model');
  const explicitOverride = resolveGeorgeConfig({ model: 'explicit-model' }, '/workspace', {
    environment: { GEORGE_MODEL: 'environment-model' },
  });
  assert.equal(explicitOverride.provider.model, 'explicit-model');
  assert.equal(config.provider.timeoutMs, 120_000);
  assert.equal(DEFAULT_PROVIDER_TIMEOUT_MS, 120_000);
  assert.equal(validateWorkspace('project', '/workspace'), '/workspace/project');
  assert.equal(validateModelId(' qwen-local '), 'qwen-local');
  assert.equal(resolveGeorgeUserConfigRoot({ XDG_CONFIG_HOME: '/tmp/config' }, 'linux', '/home/tester'), '/tmp/config/george');
  assert.equal(resolveGeorgeUserConfigRoot({}, 'linux', '/home/tester'), '/home/tester/.config/george');
  const configured = resolveGeorgeConfig({ userConfigRoot: '/tmp/george-config', contextProfile: DEFAULT_CONTEXT_PROFILE }, '/workspace');
  assert.equal(configured.userConfigRoot, '/tmp/george-config');
  assert.equal(configured.context.profile.providerInputTokens, 24_576);
  assert.equal(configured.context.profile.softPressureTokens, 20_000);
  assert.equal(configured.context.profile.reservedHeadroomTokens, 8_192);
  assert.equal(configured.context.mode, 'fixed');
  assert.equal(config.context.mode, 'adaptive');
  assert.equal(resolveGeorgeConfig({ contextMode: 'adaptive' }, '/workspace').context.mode, 'adaptive');
  assert.equal(validateContextOperatingMode('fixed'), 'fixed');
  assert.equal(validateContextOperatingMode('adaptive'), 'adaptive');
  assert.throws(() => validateContextOperatingMode('large' as never), GeorgeError);
  assert.throws(() => resolveGeorgeConfig({ contextMode: 'adaptive', contextProfile: DEFAULT_CONTEXT_PROFILE }, '/workspace'), GeorgeError);
});

test('Phase 8 context profiles are validated, stable, and preserve the large default', () => {
  assert.deepEqual(ORDINARY_CONTEXT_PROFILE, {
    id: 'qwen3-coder-30b-a3b-instruct-q4_k_m-lm-studio-32k-ordinary', physicalContextTokens: 32_768, preferredWorkingSetTokens: { min: 4_096, max: 6_144 }, softPressureTokens: 7_168, providerInputTokens: 8_192, reservedHeadroomTokens: 8_192, alwaysOnInstructionTokens: 2_560,
  });
  assert.deepEqual(MEDIUM_CONTEXT_PROFILE, {
    id: 'qwen3-coder-30b-a3b-instruct-q4_k_m-lm-studio-32k-medium', physicalContextTokens: 32_768, preferredWorkingSetTokens: { min: 8_192, max: 12_288 }, softPressureTokens: 14_336, providerInputTokens: 16_384, reservedHeadroomTokens: 8_192, alwaysOnInstructionTokens: 2_560,
  });
  assert.deepEqual(LARGE_CONTEXT_PROFILE, {
    id: 'qwen3-coder-30b-a3b-instruct-q4_k_m-lm-studio-32k', physicalContextTokens: 32_768, preferredWorkingSetTokens: { min: 12_000, max: 18_000 }, softPressureTokens: 20_000, providerInputTokens: 24_576, reservedHeadroomTokens: 8_192, alwaysOnInstructionTokens: 2_560,
  });
  for (const profile of Object.values(CONTEXT_PROFILE_REGISTRY)) assert.deepEqual(validateContextProfile(profile), profile);
  assert.equal(contextProfileForName('ordinary'), ORDINARY_CONTEXT_PROFILE);
  assert.equal(contextProfileForName('medium'), MEDIUM_CONTEXT_PROFILE);
  assert.equal(contextProfileForName('large'), LARGE_CONTEXT_PROFILE);
  assert.equal(contextProfileForName('unknown'), undefined);
  assert.equal(contextProfileForName('toString'), undefined);
  assert.equal(DEFAULT_CONTEXT_PROFILE, LARGE_CONTEXT_PROFILE);
});

test('configuration resolves and validates GEORGE_PROVIDER_TIMEOUT_MS', () => {
  const configured = resolveGeorgeConfig({}, '/workspace', {
    environment: { GEORGE_PROVIDER_TIMEOUT_MS: '120000' },
  });
  assert.equal(configured.provider.timeoutMs, 120_000);

  for (const value of ['', 'abc', '1.5', '0', '-1', '120001']) {
    assert.throws(
      () => resolveGeorgeConfig({}, '/workspace', { environment: { GEORGE_PROVIDER_TIMEOUT_MS: value } }),
      (error: unknown) => error instanceof GeorgeError && error.code === 'configuration',
    );
  }
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

test('session records provider deltas without committing them before a completed response', () => {
  const session = createSession({ id: 'session-1', workspace: '/workspace' });
  appendSessionEvent(session, { type: 'turn.started', turnId: 'turn-1' });
  appendSessionEvent(session, { type: 'input.submitted', text: 'Hello' });
  appendSessionEvent(session, { type: 'provider.text.delta', delta: 'Hi' });
  appendSessionEvent(session, { type: 'provider.text.delta', delta: ' there' });
  assert.deepEqual(session.transcript, [{ role: 'user', text: 'Hello' }]);
  appendSessionEvent(session, { type: 'assistant.response.completed', turnId: 'turn-1', text: 'Hi there' });
  assert.deepEqual(session.transcript, [
    { role: 'user', text: 'Hello' },
    { role: 'assistant', text: 'Hi there' },
  ]);
  assert.equal(session.events.length, 5);
});

test('cancellation exposes a normalized cancellation error', () => {
  const cancellation = createCancellation();
  assert.equal(cancellationError(cancellation.signal), undefined);
  cancellation.cancel('Stopped by user');
  assert.equal(cancellationError(cancellation.signal)?.code, 'cancelled');
  assert.equal(cancellationError(cancellation.signal)?.message, 'Stopped by user');
});
