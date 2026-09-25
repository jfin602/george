import assert from 'node:assert/strict';
import test from 'node:test';

const node26 = Number(process.versions.node.split('.')[0]) === 26;
const realTty = process.stdin.isTTY === true && process.stdout.isTTY === true;

test('native OpenTUI launches and restores a real Node 26 terminal', { skip: !node26 || !realTty }, async () => {
  const { createCliRenderer } = await import('@opentui/core');
  const renderer = await createCliRenderer({ exitOnCtrlC: false, exitSignals: [] });
  assert.equal(renderer.isDestroyed, false);
  renderer.destroy();
  assert.equal(renderer.isDestroyed, true);
});
