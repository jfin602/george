import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { promisify } from 'node:util';

const node26 = Number(process.versions.node.split('.')[0]) === 26;
const realTty = process.stdin.isTTY === true && process.stdout.isTTY === true;

test('native OpenTUI launches and restores a real Node 26 terminal', { skip: !node26 || !realTty }, async () => {
  const { createCliRenderer } = await import('@opentui/core');
  const renderer = await createCliRenderer({ exitOnCtrlC: false, exitSignals: [] });
  assert.equal(renderer.isDestroyed, false);
  renderer.destroy();
  assert.equal(renderer.isDestroyed, true);
});

test('native OpenTUI PTY shows structured submission and work, then routes keyboard and mouse tabs', { skip: !node26 || process.platform === 'win32' }, async (t) => {
  const root = await mkdtemp(join(tmpdir(), 'george-native-tabs-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const { stdout } = await promisify(execFile)('python3', [join(process.cwd(), 'test/fixtures/tui/native-navigation.py'), process.execPath, join(process.cwd(), 'test/fixtures/tui/native-navigation.ts'), root, join(root, 'state.json')], { timeout: 20_000 });
  assert.deepEqual(JSON.parse(stdout), { submission: true, work: true, keyboard: true, mouse: true, draft: 'preserved draft', sessionUnchanged: true });
});
