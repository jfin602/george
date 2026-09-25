import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import test from 'node:test';

import { resolveWorkspaceRoot } from '../../../src/core/index.ts';
import {
  buildBubblewrapCommand,
  createSandboxProcessToolExecutor,
  detectSandboxProcessCapability,
  ProcessCancellationError,
} from '../../../src/tools/index.ts';

async function fixture(): Promise<Readonly<{ root: string; outside: string }>> {
  const parent = await mkdtemp(join(tmpdir(), 'george-sandbox-'));
  const root = join(parent, 'workspace');
  const outside = join(parent, 'outside.txt');
  await mkdir(root);
  await writeFile(outside, 'outside-secret');
  return { root, outside };
}

test('bubblewrap construction mounts only explicit runtime roots and the canonical workspace', async (t) => {
  const { root } = await fixture();
  t.after(() => rm(dirname(root), { recursive: true, force: true }));
  const workspace = await resolveWorkspaceRoot(root);
  const command = await buildBubblewrapCommand(workspace, { backend: 'bubblewrap', available: true, executable: '/usr/bin/bwrap', version: 'fixture' }, {
    name: 'run_process', executable: 'node', arguments: ['-e', 'process.stdout.write(process.argv[1])', '$HOME;$(id)'], cwd: '.',
  });
  assert.equal(command.executable, '/usr/bin/bwrap');
  assert.equal(command.arguments.includes('--unshare-all'), true);
  assert.equal(command.arguments.includes('--share-net'), false);
  assert.equal(command.arguments.includes('--clearenv'), true);
  assert.equal(command.arguments.some((value, index) => value === '--ro-bind' && command.arguments[index + 1] === '/' && command.arguments[index + 2] === '/'), false);
  const bind = command.arguments.indexOf('--bind');
  assert.deepEqual(command.arguments.slice(bind + 1, bind + 3), [root, root]);
  assert.deepEqual(command.arguments.slice(-4), ['node', '-e', 'process.stdout.write(process.argv[1])', '$HOME;$(id)']);
  const network = await buildBubblewrapCommand(workspace, { backend: 'bubblewrap', available: true, executable: '/usr/bin/bwrap' }, { name: 'run_process', executable: 'node', arguments: [] }, true);
  assert.equal(network.arguments.includes('--share-net'), true);
  assert.equal(network.arguments.includes('/etc/resolv.conf'), true);
});

test('real bubblewrap containment denies outside paths, secrets, network, and descendant escape when available', async (t) => {
  const { root, outside } = await fixture();
  t.after(() => rm(dirname(root), { recursive: true, force: true }));
  const workspace = await resolveWorkspaceRoot(root);
  const capability = await detectSandboxProcessCapability(workspace);
  if (!capability.available) return t.skip(capability.reason ?? 'Bubblewrap unavailable.');
  assert.match(capability.version ?? '', /^bubblewrap \d/);
  const executor = createSandboxProcessToolExecutor(workspace, capability);
  assert.equal(executor.registry.registrations[0]?.execution.effect, 'sandboxed_workspace_process');
  assert.equal(executor.network, 'isolated');

  const previous = process.env.GEORGE_SANDBOX_SECRET;
  process.env.GEORGE_SANDBOX_SECRET = 'must-not-leak';
  t.after(() => { if (previous === undefined) delete process.env.GEORGE_SANDBOX_SECRET; else process.env.GEORGE_SANDBOX_SECRET = previous; });
  const inside = await executor.execute({ name: 'run_process', executable: 'node', arguments: ['-e', 'require("node:fs").writeFileSync("inside.txt", "ok");process.stdout.write(`${process.env.GEORGE_SANDBOX_SECRET ?? "absent"}:${process.env.HOME}:${process.env.TMPDIR}`)'] });
  assert.equal(inside.outcome, 'completed');
  assert.equal(inside.stdout, 'absent:/.george-sandbox/home:/.george-sandbox/tmp');
  assert.equal(await readFile(join(root, 'inside.txt'), 'utf8'), 'ok');

  const outsideRead = await executor.execute({ name: 'run_process', executable: 'node', arguments: ['-e', `require("node:fs").readFileSync(${JSON.stringify(outside)})`] });
  assert.equal(outsideRead.outcome, 'failed');
  const outsideWrite = await executor.execute({ name: 'run_process', executable: 'node', arguments: ['-e', `require("node:fs").writeFileSync(${JSON.stringify(outside)}, "changed")`] });
  assert.equal(outsideWrite.outcome, 'failed');
  assert.equal(await readFile(outside, 'utf8'), 'outside-secret');
  await symlink(outside, join(root, 'escape'));
  const symlinkRead = await executor.execute({ name: 'run_process', executable: 'node', arguments: ['-e', 'require("node:fs").readFileSync("escape")'] });
  assert.equal(symlinkRead.outcome, 'failed');

  const routes = await executor.execute({ name: 'run_process', executable: 'node', arguments: ['-e', 'process.stdout.write(require("node:fs").readFileSync("/proc/net/route", "utf8"))'] });
  assert.equal(routes.outcome, 'completed');
  assert.equal(routes.stdout.trim().split('\n').length, 1);

  const orphan = join(root, 'orphan.txt');
  const source = `require('node:child_process').spawn(process.execPath, ['-e', ${JSON.stringify(`setTimeout(() => require('node:fs').writeFileSync(${JSON.stringify(orphan)}, 'orphan'), 400)`) }], { stdio: 'ignore' });setInterval(() => {}, 1_000)`;
  const timeout = await executor.execute({ name: 'run_process', executable: 'node', arguments: ['-e', source], timeoutMs: 30 });
  assert.equal(timeout.outcome, 'timed_out');
  await new Promise((resolve) => setTimeout(resolve, 500));
  await assert.rejects(() => readFile(orphan));

  const controller = new AbortController();
  const pending = executor.execute({ name: 'run_process', executable: 'node', arguments: ['-e', 'setInterval(() => {}, 1_000)'] }, { signal: controller.signal });
  setTimeout(() => controller.abort(), 20);
  await assert.rejects(() => pending, ProcessCancellationError);
});

test('real sandbox supports repository Node, npm, test, typecheck, and Git reads when available', async (t) => {
  const workspace = await resolveWorkspaceRoot(process.cwd());
  const capability = await detectSandboxProcessCapability(workspace);
  if (!capability.available) return t.skip(capability.reason ?? 'Bubblewrap unavailable.');
  const executor = createSandboxProcessToolExecutor(workspace, capability);
  for (const [executable, arguments_] of [
    ['node', ['--version']],
    ['npm', ['--version']],
    ['node', ['--test', 'test/unit/tools/process.test.ts']],
    ['npm', ['run', 'typecheck']],
    ['git', ['status', '--short']],
  ] as const) {
    const result = await executor.execute({ name: 'run_process', executable, arguments: arguments_, timeoutMs: 120_000 });
    assert.equal(result.outcome, 'completed', `${executable} ${arguments_.join(' ')}: ${result.stderr}`);
  }
});
