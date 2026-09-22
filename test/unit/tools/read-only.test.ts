import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { chmod, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { resolveWorkspaceRoot } from '../../../src/core/index.ts';
import { createReadOnlyToolExecutor } from '../../../src/tools/index.ts';

async function fixture(): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), 'george-tools-'));
  await Promise.all([
    writeFile(join(root, 'long.txt'), '0123456789abcdefghij'),
    writeFile(join(root, 'first.txt'), 'needle one\n'),
    writeFile(join(root, 'second.txt'), 'needle two\n'),
  ]);
  return root;
}

test('read-only filesystem tools bound reads, listings, and search work', async (t) => {
  const root = await fixture();
  t.after(() => rm(root, { recursive: true, force: true }));
  const executor = createReadOnlyToolExecutor(await resolveWorkspaceRoot(root), {
    maxReadBytes: 5,
    maxListEntries: 1,
    maxSearchFiles: 10,
    maxSearchBytes: 100,
    maxSearchResults: 1,
  });

  const read = await executor.execute({ name: 'read_file', path: 'long.txt' });
  assert.deepEqual(read, { name: 'read_file', path: 'long.txt', text: '01234', bytes: 5, truncated: true });
  const listing = await executor.execute({ name: 'list_directory', path: '.' });
  assert.equal(listing.name, 'list_directory');
  assert.equal(listing.entries.length, 1);
  assert.equal(listing.truncated, true);
  const search = await executor.execute({ name: 'search_text', query: 'needle' });
  assert.equal(search.name, 'search_text');
  assert.equal(search.matches.length, 1);
  assert.equal(search.truncated, true);
  assert.ok(search.scannedFiles >= 1);
  assert.ok(search.scannedBytes <= 100);
});

test('Git executor uses bounded fixed read-only commands and preserves this dirty tree', async (t) => {
  const before = execFileSync('git', ['status', '--porcelain=v1'], { cwd: process.cwd(), encoding: 'utf8' });
  const executor = createReadOnlyToolExecutor(await resolveWorkspaceRoot(process.cwd()), { maxGitOutputBytes: 1 });
  const status = await executor.execute({ name: 'git_status' });
  const diff = await executor.execute({ name: 'git_diff' });
  const after = execFileSync('git', ['status', '--porcelain=v1'], { cwd: process.cwd(), encoding: 'utf8' });
  assert.equal(status.name, 'git_status');
  assert.equal(diff.name, 'git_diff');
  assert.equal(before, after);
  assert.ok(status.stdout.length <= 1 && status.stderr.length <= 1);
  t.diagnostic('Git status/diff were invoked through the fixed executor without changing the tree.');
});

test('Git stdout and stderr capture are bounded', async (t) => {
  const root = await fixture();
  const bin = join(root, 'bin');
  await (await import('node:fs/promises')).mkdir(bin);
  const fakeGit = join(bin, 'git');
  await writeFile(fakeGit, '#!/bin/sh\nprintf 1234567890\nprintf abcdefghij >&2\n');
  await chmod(fakeGit, 0o755);
  const originalPath = process.env.PATH;
  process.env.PATH = `${bin}:${originalPath ?? ''}`;
  t.after(async () => {
    process.env.PATH = originalPath;
    await rm(root, { recursive: true, force: true });
  });
  const executor = createReadOnlyToolExecutor(await resolveWorkspaceRoot(root), { maxGitOutputBytes: 3 });
  const result = await executor.execute({ name: 'git_status' });
  assert.deepEqual(result, {
    name: 'git_status', stdout: '123', stderr: 'abc', exitCode: 0, stdoutTruncated: true, stderrTruncated: true,
  });
});
