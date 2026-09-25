import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { chmod, lstat, mkdir, mkdtemp, readdir, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { GeorgeError, resolveWorkspaceRoot } from '../../../src/core/index.ts';
import { captureGitWorkingTreeSnapshot, createReadOnlyToolExecutor, createWorkspaceMutationToolExecutor } from '../../../src/tools/index.ts';

const hash = (text: string | Buffer) => createHash('sha256').update(text).digest('hex');

async function fixture(): Promise<string> {
  return mkdtemp(join(tmpdir(), 'george-mutation-'));
}

async function tempArtifacts(root: string): Promise<string[]> {
  return (await readdir(root)).filter((name) => name.includes('.george-') && name.endsWith('.tmp'));
}

test('workspace mutation creates safely and overwrites only with an exact precondition', async (t) => {
  const root = await fixture();
  t.after(() => rm(root, { recursive: true, force: true }));
  const workspace = await resolveWorkspaceRoot(root);
  const executor = createWorkspaceMutationToolExecutor(workspace);
  const reader = createReadOnlyToolExecutor(workspace);
  assert.deepEqual(executor.registry.registrations.map(({ name, execution }) => ({ name, effect: execution.effect })), [
    { name: 'write_file', effect: 'workspace_mutation' }, { name: 'apply_patch', effect: 'workspace_mutation' },
  ]);
  assert.match(executor.definitions[0]!.description, /latest read_file\.sha256/);
  assert.match(executor.definitions[1]!.description, /latest read_file\.sha256/);
  assert.match(JSON.stringify(executor.definitions.map((definition) => definition.inputSchema)), /Latest observed read_file\.sha256/);
  assert.match(executor.definitions[0]!.description, /Prefer apply_patch.*preserve read_file\.textFraming.*never reformats/);
  assert.match(executor.definitions[1]!.description, /Preferred for localized.*preserving untouched bytes.*read_file\.textFraming/);
  assert.match(JSON.stringify(executor.definitions.map((definition) => definition.inputSchema)), /allowTextFramingChange.*Acknowledge an intentional change.*does not rewrite or format content/);

  const created = await executor.execute({ name: 'write_file', path: 'new.txt', content: 'first' });
  assert.equal(await readFile(join(root, 'new.txt'), 'utf8'), 'first');
  assert.equal(created.sha256, hash('first'));
  await chmod(join(root, 'new.txt'), 0o640);
  const observed = await reader.execute({ name: 'read_file', path: 'new.txt' });
  if (observed.name !== 'read_file') throw new Error('Expected read_file output.');
  const replaced = await executor.execute({ name: 'write_file', path: 'new.txt', content: 'second', expectedSha256: observed.sha256 });
  assert.equal(await readFile(join(root, 'new.txt'), 'utf8'), 'second');
  assert.equal((await lstat(join(root, 'new.txt'))).mode & 0o777, 0o640);
  assert.equal(replaced.path, 'new.txt');

  await assert.rejects(
    () => executor.execute({ name: 'write_file', path: 'new.txt', content: 'stale', expectedSha256: observed.sha256 }),
    (error: unknown) => error instanceof GeorgeError && error.code === 'validation',
  );
  await assert.rejects(
    () => executor.execute({ name: 'write_file', path: 'new.txt', content: 'missing-precondition' }),
    GeorgeError,
  );
  assert.equal(await readFile(join(root, 'new.txt'), 'utf8'), 'second');
  assert.deepEqual(await tempArtifacts(root), []);
});

test('existing text framing changes require explicit acknowledgement and never rewrite bytes', async (t) => {
  const root = await fixture();
  t.after(() => rm(root, { recursive: true, force: true }));
  const workspace = await resolveWorkspaceRoot(root);
  const executor = createWorkspaceMutationToolExecutor(workspace, {}, { captureGit: false });

  await writeFile(join(root, 'lf.txt'), 'before\n');
  await assert.rejects(
    () => executor.execute({ name: 'write_file', path: 'lf.txt', content: 'after', expectedSha256: hash('before\n') }),
    (error: unknown) => error instanceof GeorgeError && error.code === 'validation' && error.message === 'Text framing change requires explicit acknowledgement: current lineEnding=lf finalNewline=lf; proposed lineEnding=none finalNewline=none.',
  );
  assert.equal(await readFile(join(root, 'lf.txt'), 'utf8'), 'before\n');
  assert.equal(hash(await readFile(join(root, 'lf.txt'), 'utf8')), hash('before\n'));
  await executor.execute({ name: 'write_file', path: 'lf.txt', content: 'same\n', expectedSha256: hash('before\n') });
  await executor.execute({ name: 'write_file', path: 'lf.txt', content: 'open', expectedSha256: hash('same\n'), allowTextFramingChange: true });
  assert.equal(await readFile(join(root, 'lf.txt'), 'utf8'), 'open');

  await writeFile(join(root, 'crlf.txt'), 'before\r\n');
  await assert.rejects(() => executor.execute({ name: 'write_file', path: 'crlf.txt', content: 'after\n', expectedSha256: hash('before\r\n') }), /current lineEnding=crlf finalNewline=crlf; proposed lineEnding=lf finalNewline=lf/);
  await executor.execute({ name: 'write_file', path: 'crlf.txt', content: 'after\n', expectedSha256: hash('before\r\n'), allowTextFramingChange: true });
  assert.equal(await readFile(join(root, 'crlf.txt'), 'utf8'), 'after\n');

  await writeFile(join(root, 'mixed.txt'), 'a\r\nb\n');
  await executor.execute({ name: 'apply_patch', path: 'mixed.txt', expectedSha256: hash('a\r\nb\n'), edits: [{ oldText: 'a', newText: 'A' }] });
  assert.equal(await readFile(join(root, 'mixed.txt'), 'utf8'), 'A\r\nb\n');
  await assert.rejects(() => executor.execute({ name: 'write_file', path: 'mixed.txt', content: 'c\r\nd\n', expectedSha256: hash('A\r\nb\n') }), /current lineEnding=mixed/);
  await executor.execute({ name: 'write_file', path: 'mixed.txt', content: 'c\r\nd\n', expectedSha256: hash('A\r\nb\n'), allowTextFramingChange: true });
  assert.equal(await readFile(join(root, 'mixed.txt'), 'utf8'), 'c\r\nd\n');

  const binary = Buffer.from([0xc3, 0x28]);
  await writeFile(join(root, 'binary.txt'), binary);
  await executor.execute({ name: 'write_file', path: 'binary.txt', content: 'text\n', expectedSha256: hash(binary) });
  assert.equal(await readFile(join(root, 'binary.txt'), 'utf8'), 'text\n');
});

test('exact patches preserve framing and reject only resulting framing changes', async (t) => {
  const root = await fixture();
  t.after(() => rm(root, { recursive: true, force: true }));
  const executor = createWorkspaceMutationToolExecutor(await resolveWorkspaceRoot(root), {}, { captureGit: false });

  await writeFile(join(root, 'lf.txt'), 'alpha\nbeta\n');
  await executor.execute({ name: 'apply_patch', path: 'lf.txt', expectedSha256: hash('alpha\nbeta\n'), edits: [{ oldText: 'beta', newText: 'BETA' }] });
  assert.equal(await readFile(join(root, 'lf.txt'), 'utf8'), 'alpha\nBETA\n');

  await writeFile(join(root, 'crlf.txt'), 'alpha\r\nbeta\r\n');
  await executor.execute({ name: 'apply_patch', path: 'crlf.txt', expectedSha256: hash('alpha\r\nbeta\r\n'), edits: [{ oldText: 'beta', newText: 'BETA' }] });
  assert.equal(await readFile(join(root, 'crlf.txt'), 'utf8'), 'alpha\r\nBETA\r\n');

  await assert.rejects(
    () => executor.execute({ name: 'apply_patch', path: 'crlf.txt', expectedSha256: hash('alpha\r\nBETA\r\n'), edits: [{ oldText: 'alpha\r\n', newText: 'alpha\n' }] }),
    /Text framing change requires explicit acknowledgement/,
  );
  assert.equal(await readFile(join(root, 'crlf.txt'), 'utf8'), 'alpha\r\nBETA\r\n');
  await executor.execute({ name: 'apply_patch', path: 'crlf.txt', expectedSha256: hash('alpha\r\nBETA\r\n'), edits: [{ oldText: 'alpha\r\n', newText: 'alpha\n' }], allowTextFramingChange: true });
  assert.equal(await readFile(join(root, 'crlf.txt'), 'utf8'), 'alpha\nBETA\r\n');

  await writeFile(join(root, 'stale.txt'), 'current\n');
  await assert.rejects(() => executor.execute({ name: 'write_file', path: 'stale.txt', content: 'changed', expectedSha256: hash('stale\n') }), /Current-content precondition does not match/);
  assert.equal(await readFile(join(root, 'stale.txt'), 'utf8'), 'current\n');
});

test('patches validate all exact edits before one atomic replacement', async (t) => {
  const root = await fixture();
  t.after(() => rm(root, { recursive: true, force: true }));
  await writeFile(join(root, 'patch.txt'), 'alpha beta');
  const workspace = await resolveWorkspaceRoot(root);
  const executor = createWorkspaceMutationToolExecutor(workspace);
  const reader = createReadOnlyToolExecutor(workspace);
  const observed = await reader.execute({ name: 'read_file', path: 'patch.txt' });
  if (observed.name !== 'read_file') throw new Error('Expected read_file output.');

  const applied = await executor.execute({
    name: 'apply_patch', path: 'patch.txt', expectedSha256: observed.sha256,
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
