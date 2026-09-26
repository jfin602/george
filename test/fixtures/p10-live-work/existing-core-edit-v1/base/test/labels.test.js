import assert from 'node:assert/strict';
import test from 'node:test';

import { normalizeLabel } from '../src/labels.js';

test('normalizeLabel preserves the baseline contract', () => {
  assert.equal(normalizeLabel(' Release Candidate '), 'release-candidate');
  assert.throws(() => normalizeLabel('   '), RangeError);
});
