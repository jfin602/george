import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { chmod, lstat, mkdir, mkdtemp, readdir, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { GeorgeError, resolveWorkspaceRoot } from '../../../src/core/index.ts';
import { captureGitWorkingTreeSnapshot, createWorkspaceMutationToolExecutor } from '../../../src/tools/index.ts';

const hash = (text: string) => createHash('sha256').update(text).digest('hex');

async function fixture(): Promise<string> {
  return mkdtemp(join(tmpdir(), 'george-mutation-'));
}

async function tempArtifacts(root: string): Promise<string[]> {
  return (await readdir(root)).filter((name) => name.includes('.george-') && name.endsWith('.tmp'));
}

test('workspace mutation creates safely and overwrites only with an exact precondition', async (t) => {
  const root = await fixture();
  t.after(() => rm(root, { recursive: true, force: true }));
  const executor = createWorkspaceMutationToolExecutor(await resolveWorkspaceRoot(root));
  assert.deepEqual(executor.registry.registrations.map(({ name, permission }) => ({ name, permission })), [
    { name: 'write_file', permission: 'write' }, { name: 'apply_patch', permission: 'write' },
  ]);

  const created = await executor.execute({ name: 'write_file', path: 'new.txt', content: 'first' });
  assert.equal(await readFile(join(root, 'new.txt'), 'utf8'), 'first');
  assert.equal(created.sha256, hash('first'));
  await chmod(join(root, 'new.txt'), 0o640);
  const replaced = await executor.execute({ name: 'write_file', path: 'new.txt', content: 'second', expectedSha256: hash('first') });
  assert.equal(await readFile(join(root, 'new.txt'), 'utf8'), 'second');
  assert.equal((await lstat(join(root, 'new.txt'))).mode & 0o777, 0o640);
  assert.equal(replaced.path, 'new.txt');

  await assert.rejects(
    () => executor.execute({ name: 'write_file', path: 'new.txt', content: 'stale', expectedSha256: hash('first') }),
    (error: unknown) => error instanceof GeorgeError && error.code === 'validation',
  );
  await assert.rejects(
    () => executor.execute({ name: 'write_file', path: 'new.txt', content: 'missing-precondition' }),
    GeorgeError,
  );
  assert.equal(await readFile(join(root, 'new.txt'), 'utf8'), 'second');
  assert.deepEqual(await tempArtifacts(root), []);
});

test('patches validate all exact edits before one atomic replacement', async (t) => {
  const root = await fixture();
  t.after(() => rm(root, { recursive: true, force: true }));
  await writeFile(join(root, 'patch.txt'), 'alpha beta');
  const executor = createWorkspaceMutationToolExecutor(await resolveWorkspaceRoot(root));

  const applied = await executor.execute({
    name: 'apply_patch', path: 'patch.txt', expectedSha256: hash('alpha beta'),
    edits: [{ oldText: 'alpha', newText: 'A' }, { oldText: 'beta', newText: 'B' }],
  });
  assert.equal(await readFile(join(root, 'patch.txt'), 'utf8'), 'A B');
  assert.equal(applied.sha256, hash('A B'));

  await writeFile(join(root, 'patch.txt'), 'alpha beta');
  await assert.rejects(
    () => executor.execute({
      name: 'apply_patch', path: 'patch.txt', expectedSha256: hash('alpha beta'),
      edits: [{ oldText: 'alpha', newText: 'A' }, { oldText: 'missing', newText: 'M' }],
    }),
    GeorgeError,
  );
  await assert.rejects(
    () => executor.execute({
      name: 'apply_patch', path: 'patch.txt', expectedSha256: hash('alpha beta'), edits: [{ oldText: 'a', newText: 'A' }],
    }),
    GeorgeError,
  );
  await assert.rejects(
    () => executor.execute({ name: 'apply_patch', path: 'patch.txt', expectedSha256: hash('stale'), edits: [{ oldText: 'alpha', newText: 'A' }] }),
    GeorgeError,
  );
  assert.equal(await readFile(join(root, 'patch.txt'), 'utf8'), 'alpha beta');
  assert.deepEqual(await tempArtifacts(root), []);
});

test('mutation rejects unsafe paths, bounds content, and leaves no cancellation artifacts', async (t) => {
  const root = await fixture();
  const outside = await fixture();
  t.after(() => Promise.all([rm(root, { recursive: true, force: true }), rm(outside, { recursive: true, force: true })]));
  await mkdir(join(root, 'actual-directory'));
  await symlink(outside, join(root, 'escape'));
  const executor = createWorkspaceMutationToolExecutor(await resolveWorkspaceRoot(root), { maxContentBytes: 3, maxFileBytes: 3, maxEditBytes: 2 });

  for (const path of ['/tmp/outside.txt', '../outside.txt', 'bad\0.txt', 'escape/outside.txt', 'missing/new.txt', 'actual-directory']) {
    await assert.rejects(() => executor.execute({ name: 'write_file', path, content: 'ok' }), GeorgeError);
  }
  await assert.rejects(() => executor.execute({ name: 'write_file', path: 'too-big.txt', content: 'four' }), GeorgeError);
  await writeFile(join(root, 'small.txt'), 'ok');
  await assert.rejects(
    () => executor.execute({ name: 'apply_patch', path: 'small.txt', expectedSha256: hash('ok'), edits: [{ oldText: 'ok', newText: 'long' }] }),
    GeorgeError,
  );
  const finalBounded = createWorkspaceMutationToolExecutor(await resolveWorkspaceRoot(root), { maxContentBytes: 10, maxFileBytes: 3, maxEditBytes: 10, maxEdits: 1 });
  await assert.rejects(() => finalBounded.execute({ name: 'write_file', path: 'final-too-big.txt', content: 'four' }), GeorgeError);
  await assert.rejects(
    () => finalBounded.execute({ name: 'apply_patch', path: 'small.txt', expectedSha256: hash('ok'), edits: [{ oldText: 'ok', newText: 'four' }] }),
    GeorgeError,
  );
  await assert.rejects(
    () => finalBounded.execute({ name: 'apply_patch', path: 'small.txt', expectedSha256: hash('ok'), edits: [{ oldText: 'o', newText: 'O' }, { oldText: 'k', newText: 'K' }] }),
    GeorgeError,
  );
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(
    () => executor.execute({ name: 'write_file', path: 'cancelled.txt', content: 'ok' }, { signal: controller.signal }),
    (error: unknown) => error instanceof GeorgeError && error.code === 'cancelled',
  );
  await assert.rejects(() => readFile(join(root, 'cancelled.txt')), /ENOENT/);
  assert.deepEqual(await tempArtifacts(root), []);
});

test('Git snapshots are read-only, distinguish non-Git workspaces, and mark already-dirty targets', async (t) => {
  const root = await fixture();
  t.after(() => rm(root, { recursive: true, force: true }));
  const workspace = await resolveWorkspaceRoot(root);
  assert.deepEqual(await captureGitWorkingTreeSnapshot(workspace), { isRepository: false, repositoryRoot: null, entries: [] });

  execFileSync('git', ['init', '--quiet'], { cwd: root });
  await writeFile(join(root, 'dirty.txt'), 'before');
  const before = execFileSync('git', ['status', '--porcelain=v1'], { cwd: root, encoding: 'utf8' });
  const executor = createWorkspaceMutationToolExecutor(workspace);
  const result = await executor.execute({ name: 'write_file', path: 'dirty.txt', content: 'after', expectedSha256: hash('before') });
  const after = execFileSync('git', ['status', '--porcelain=v1'], { cwd: root, encoding: 'utf8' });
  assert.equal(result.git.isRepository, true);
  assert.deepEqual(result.git.target, { path: 'dirty.txt', dirty: true });
  assert.equal(before, after);
  assert.equal(await readFile(join(root, 'dirty.txt'), 'utf8'), 'after');
});
