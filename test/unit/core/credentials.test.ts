import assert from 'node:assert/strict';
import test from 'node:test';

import { EnvironmentCredentialResolver } from '../../../src/core/index.ts';

test('environment credentials resolve only at the executor boundary without echoing values', async () => {
  const resolver = new EnvironmentCredentialResolver({ SAFE_TOKEN: 'SECRET_CREDENTIAL_VALUE' });
  assert.equal(await resolver.resolve('SAFE_TOKEN'), 'SECRET_CREDENTIAL_VALUE');
  assert.equal(await resolver.resolve('MISSING_TOKEN'), undefined);
  await assert.rejects(() => resolver.resolve('not-safe'), /Invalid credential reference/);
});
