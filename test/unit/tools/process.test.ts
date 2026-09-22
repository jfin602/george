import assert from 'node:assert/strict';
import { access, mkdtemp, mkdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { GeorgeError, resolveWorkspaceRoot } from '../../../src/core/index.ts';
import { createProcessToolExecutor, ProcessCancellationError, ProcessSpawnError } from '../../../src/tools/index.ts';

async function fixture() {
  const root = await mkdtemp(join(tmpdir(), 'george-process-'));
  await mkdir(join(root, 'nested'));
  return root;
}

function node(arguments_: readonly string[]) {
  return { name: 'run_process' as const, executable: 'node', arguments: arguments_ };
}

test('process executor uses literal argv, bounded output, workspace cwd, closed stdin, and sanitized environment', async (t) => {
  const root = await fixture();
  t.after(() => rm(root, { recursive: true, force: true }));
  const sentinel = process.env.GEORGE_PROCESS_TEST_SECRET;
  process.env.GEORGE_PROCESS_TEST_SECRET = 'must-not-leak';
  t.after(() => { process.env.GEORGE_PROCESS_TEST_SECRET = sentinel; });
  const executor = createProcessToolExecutor(await resolveWorkspaceRoot(root), { maxOutputBytes: 3 });
  assert.deepEqual(executor.registry.registrations.map(({ name, permission }) => ({ name, permission })), [{ name: 'run_process', permission: 'process' }]);

  const literal = await executor.execute(node(['-e', 'process.stdout.write(process.argv[1])', '$(touch escaped);$HOME']));
  assert.equal(literal.stdout, '$(t');
  assert.equal(literal.stdoutTruncated, true);
  await assert.rejects(() => access(join(root, 'escaped')));
  const bounded = await executor.execute(node(['-e', 'process.stdout.write("12345");process.stderr.write("abcde");process.exit(7)']));
  assert.deepEqual({ stdout: bounded.stdout, stderr: bounded.stderr, stdoutTruncated: bounded.stdoutTruncated, stderrTruncated: bounded.stderrTruncated, exitCode: bounded.exitCode, signal: bounded.signal, outcome: bounded.outcome }, {
    stdout: '123', stderr: 'abc', stdoutTruncated: true, stderrTruncated: true, exitCode: 7, signal: null, outcome: 'failed',
  });
  const stdin = await executor.execute(node(['-e', 'process.stdin.on("end", () => process.stdout.write("closed"));process.stdin.resume()']));
  assert.equal(stdin.stdout, 'clo');
  assert.equal(stdin.stdoutTruncated, true);
  const environment = await executor.execute(node(['-e', 'process.stdout.write(`${process.env.GEORGE_PROCESS_TEST_SECRET ?? "absent"}:${process.env.PATH ? "path" : "missing"}`)']));
  assert.equal(environment.stdout, 'abs');
  assert.equal(environment.stdoutTruncated, true);
  const cwd = await executor.execute({ ...node(['-e', 'process.stdout.write(process.cwd())']), cwd: 'nested' });
  assert.equal(cwd.cwd, 'nested');
  assert.equal(cwd.stdout, join(root, 'nested').slice(0, 3));
  await assert.rejects(() => executor.execute({ ...node(['-e', '']), cwd: '../' }), GeorgeError);
  await assert.rejects(
    () => executor.execute({ ...node([]), executable: 'george-no-such-executable' }),
    (error: unknown) => error instanceof ProcessSpawnError && error.result.outcome === 'spawn_failed',
  );
});

test('process executor terminates timed-out and cancelled process groups', async (t) => {
  const root = await fixture();
  t.after(() => rm(root, { recursive: true, force: true }));
  const executor = createProcessToolExecutor(await resolveWorkspaceRoot(root));
  const timeout = await executor.execute({ ...node(['-e', 'setInterval(() => {}, 1_000)']), timeoutMs: 20 });
  assert.equal(timeout.outcome, 'timed_out');
  assert.ok(timeout.signal === 'SIGTERM' || timeout.signal === 'SIGKILL');
  const controller = new AbortController();
  const pending = executor.execute(node(['-e', 'setInterval(() => {}, 1_000)']), { signal: controller.signal });
  setTimeout(() => controller.abort(new GeorgeError('cancelled', 'Stopped')), 20);
  await assert.rejects(() => pending, (error: unknown) => error instanceof ProcessCancellationError && error.result.stdout === '');

  if (process.platform !== 'linux') return t.skip('The deterministic descendant fixture requires Linux /proc cleanup.');
  const marker = join(root, 'orphaned.txt');
  const source = `require('node:child_process').spawn(process.execPath, ['-e', ${JSON.stringify(`setTimeout(() => require('node:fs').writeFileSync(${JSON.stringify(marker)}, 'orphan'), 350)`) }], { stdio: 'ignore' });setInterval(() => {}, 1_000)`;
  const descendants = await executor.execute({ ...node(['-e', source]), timeoutMs: 20 });
  assert.equal(descendants.outcome, 'timed_out');
  await new Promise((resolve) => setTimeout(resolve, 500));
  await assert.rejects(() => access(marker));
});
