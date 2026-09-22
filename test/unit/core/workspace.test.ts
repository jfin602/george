import assert from 'node:assert/strict';
import { mkdtemp, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import {
  GeorgeError,
  loadRepositoryInstructions,
  resolveWorkspaceRoot,
} from '../../../src/core/index.ts';

async function workspace(): Promise<string> {
  return mkdtemp(join(tmpdir(), 'george-workspace-'));
}

test('workspace instructions are root-only, ordered, and byte bounded', async (t) => {
  const root = await workspace();
  t.after(() => rm(root, { recursive: true, force: true }));
  await writeFile(join(root, 'BOOT.md'), 'boot instructions');
  await writeFile(join(root, 'AGENTS.md'), 'agent instructions');
  const resolved = await resolveWorkspaceRoot(root);

  const full = await loadRepositoryInstructions(resolved, 100);
  assert.deepEqual(full.instructions.map((instruction) => instruction.path), ['BOOT.md', 'AGENTS.md']);
  assert.equal(full.instructions[0]?.text, 'boot instructions');
  assert.equal(full.instructions[1]?.text, 'agent instructions');

  const bounded = await loadRepositoryInstructions(resolved, 4);
  assert.deepEqual(bounded.instructions.map((instruction) => instruction.path), ['BOOT.md']);
  assert.equal(bounded.bytes, 4);
  assert.equal(bounded.truncated, true);
  assert.equal(bounded.instructions[0]?.truncated, true);
});

test('workspace resolution rejects traversal and symlink escapes', async (t) => {
  const root = await workspace();
  const outside = await workspace();
  t.after(async () => { await Promise.all([rm(root, { recursive: true, force: true }), rm(outside, { recursive: true, force: true })]); });
  await writeFile(join(outside, 'secret.txt'), 'secret');
  await symlink(join(outside, 'secret.txt'), join(root, 'escape'));
  const { createReadOnlyToolExecutor } = await import('../../../src/tools/index.ts');
  const executor = createReadOnlyToolExecutor(await resolveWorkspaceRoot(root));

  await assert.rejects(() => executor.execute({ name: 'read_file', path: '../secret.txt' }), GeorgeError);
  await assert.rejects(() => executor.execute({ name: 'read_file', path: join(outside, 'secret.txt') }), GeorgeError);
  await assert.rejects(() => executor.execute({ name: 'read_file', path: 'escape' }), GeorgeError);
});
