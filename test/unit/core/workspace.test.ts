import assert from 'node:assert/strict';
import { mkdtemp, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import {
  GeorgeError,
  loadRepositoryInstructions,
  resolveOutsideFilesystemPath,
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

test('outside capabilities reject traversal, symlink ambiguity, and non-regular mutation targets', async (t) => {
  const root = await workspace();
  const linked = await workspace();
  t.after(async () => { await Promise.all([rm(root, { recursive: true, force: true }), rm(linked, { recursive: true, force: true })]); });
  await writeFile(join(root, 'file.txt'), 'outside');
  await symlink(root, join(linked, 'escape'));
  await assert.rejects(() => resolveOutsideFilesystemPath(`${root}/../file.txt`), GeorgeError);
  await assert.rejects(() => resolveOutsideFilesystemPath(`${join(root, 'file.txt')}\0`), GeorgeError);
  await assert.rejects(() => resolveOutsideFilesystemPath(join(linked, 'escape', 'file.txt')), GeorgeError);
  await assert.rejects(() => resolveOutsideFilesystemPath(root, true), GeorgeError);
  const resolved = await resolveOutsideFilesystemPath(join(root, 'file.txt'), true);
  assert.equal(resolved.path, join(root, 'file.txt'));
  assert.equal(resolved.parent, root);
  assert.equal(resolved.name, 'file.txt');
  assert.equal(resolved.exists, true);
  assert.ok(resolved.mode !== undefined);
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
