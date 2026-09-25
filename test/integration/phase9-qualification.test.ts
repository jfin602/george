import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { cp, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { projectStructuredTaskSlice } from '../../src/application/index.ts';
import { DEFAULT_EXECUTION_POLICY, LocalSessionStore, createSession, intersectExecutionPolicy } from '../../src/core/index.ts';
import { addressTaskWorkUnit, beginTaskWorkUnit, createTaskState, parseTaskPrompt, projectTaskState, recordTaskValidationAttempt, validateTaskStack } from '../../src/tasks/index.ts';
import { renderTask, taskHeader } from '../../src/tui/app.ts';

const ROOT = process.cwd();
const INSTRUMENTS = join(ROOT, 'test/fixtures/p9-live-work');
const ACCEPTANCE = join(ROOT, 'test/acceptance/p9-live-work');
const GIT_ENV = { ...process.env, GIT_AUTHOR_NAME: 'George fixture', GIT_AUTHOR_EMAIL: 'fixture@example.invalid', GIT_COMMITTER_NAME: 'George fixture', GIT_COMMITTER_EMAIL: 'fixture@example.invalid', GIT_AUTHOR_DATE: '2026-09-25T00:00:00Z', GIT_COMMITTER_DATE: '2026-09-25T00:00:00Z' };

async function text(path: string): Promise<string> { return readFile(path, 'utf8'); }

async function digest(root: string, only?: (path: string) => boolean, part = ''): Promise<string> {
  const names = await readdir(join(root, part), { withFileTypes: true });
  const paths = (await Promise.all(names.map(async (entry) => entry.isDirectory()
    ? (await digestPaths(root, only, join(part, entry.name)))
    : entry.isFile() && (!only || only(join(part, entry.name))) ? [join(part, entry.name)] : []))).flat().sort();
  const hash = createHash('sha256');
  for (const path of paths) { hash.update(path); hash.update('\0'); hash.update(await readFile(join(root, path))); hash.update('\0'); }
  return hash.digest('hex');
}

async function digestPaths(root: string, only: ((path: string) => boolean) | undefined, part: string): Promise<string[]> {
  const names = await readdir(join(root, part), { withFileTypes: true });
  return (await Promise.all(names.map(async (entry) => entry.isDirectory()
    ? digestPaths(root, only, join(part, entry.name))
    : entry.isFile() && (!only || only(join(part, entry.name))) ? [join(part, entry.name)] : []))).flat();
}

async function frozenExistingFixture(parent: string): Promise<Readonly<{ root: string; commit: string }>> {
  const root = join(parent, 'workspace');
  await cp(join(INSTRUMENTS, 'existing-express-feature-v1/base'), root, { recursive: true });
  execFileSync('git', ['init', '--quiet'], { cwd: root, env: GIT_ENV });
  execFileSync('git', ['add', '--all'], { cwd: root, env: GIT_ENV });
  execFileSync('git', ['commit', '--quiet', '--no-gpg-sign', '-m', 'existing-express-feature-v1 fixture v1'], { cwd: root, env: GIT_ENV });
  return { root, commit: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, env: GIT_ENV, encoding: 'utf8' }).trim() };
}

test('Phase 9 freezes versioned task stacks and keeps acceptance outside model-visible workspaces', async (t) => {
  const greenfield = join(INSTRUMENTS, 'greenfield-express-v1');
  const existing = join(INSTRUMENTS, 'existing-express-feature-v1');
  const greenfieldMetadata = JSON.parse(await text(join(greenfield, 'instrument.json')));
  const existingMetadata = JSON.parse(await text(join(existing, 'instrument.json')));
  assert.equal(greenfieldMetadata.version, 1);
  assert.equal(existingMetadata.fixtureVersion, 1);
  assert.equal(await digest(greenfield, (path) => path.endsWith('.task.txt')), greenfieldMetadata.taskStackSha256);
  assert.equal(await digest(join(existing, 'base')), existingMetadata.fixtureSourceSha256);
  const greenfieldTasks = (await readdir(greenfield)).filter((name) => name.endsWith('.task.txt')).sort();
  assert.deepEqual(greenfieldTasks, ['P1-scaffold.task.txt', 'P2-api.task.txt', 'P3-tests-docs-closeout.task.txt']);
  const definitions = [];
  for (const name of greenfieldTasks) {
    const parsed = parseTaskPrompt(await text(join(greenfield, name)));
    assert.equal(parsed.kind, 'structured');
    if (parsed.kind === 'structured') { assert.equal(parsed.task.stack, 'greenfield-express-v1'); definitions.push(parsed.task); }
  }
  validateTaskStack(definitions);
  const existingTask = parseTaskPrompt(await text(join(existing, 'P1-tag-feature.task.txt')));
  assert.equal(existingTask.kind, 'structured');
  if (existingTask.kind === 'structured') assert.equal(existingTask.task.stack, 'existing-express-feature-v1');
  assert.match(await text(join(greenfield, 'README.md')), /network access and `npm install express@5\.1\.0`/);
  assert.match(await text(join(existing, 'README.md')), /fixed author\/committer identity and timestamp/);
  assert.deepEqual((await readdir(ACCEPTANCE)).sort(), ['existing-express-feature-v1.test.mjs', 'greenfield-express-v1.test.mjs']);
  assert.equal((await readdir(join(existing, 'base'))).includes('test/acceptance'), false);

  const firstParent = await mkdtemp(join(tmpdir(), 'george-p9-fixture-'));
  const secondParent = await mkdtemp(join(tmpdir(), 'george-p9-fixture-'));
  t.after(() => Promise.all([rm(firstParent, { recursive: true, force: true }), rm(secondParent, { recursive: true, force: true })]));
  const first = await frozenExistingFixture(firstParent);
  const second = await frozenExistingFixture(secondParent);
  assert.match(first.commit, /^[0-9a-f]{40}$/);
  assert.equal(first.commit, second.commit, 'the existing-app fixture begins from one deterministic frozen commit');
  assert.equal(execFileSync('git', ['status', '--porcelain'], { cwd: first.root, encoding: 'utf8' }), '');
});

test('Phase 9 deterministic projection preserves canonical state, task slicing, persistence, TUI, and restrictive policy', async (t) => {
  const parsed = parseTaskPrompt(await text(join(INSTRUMENTS, 'greenfield-express-v1/P1-scaffold.task.txt')));
  assert.equal(parsed.kind, 'structured');
  if (parsed.kind !== 'structured') throw new Error('Expected frozen structured task.');
  const workspace = await mkdtemp(join(tmpdir(), 'george-p9-state-'));
  const durableRoot = await mkdtemp(join(tmpdir(), 'george-p9-durable-'));
  t.after(() => Promise.all([rm(workspace, { recursive: true, force: true }), rm(durableRoot, { recursive: true, force: true })]));
  await writeFile(join(workspace, 'BOOT.md'), 'fixture');
  const session = createSession({ id: 'phase9', workspace });
  let state = createTaskState({ sessionId: session.id, workspace, definition: parsed.task, effectivePermissionExpectations: { workspace: 'autonomous', network: 'ask' } });
  state = beginTaskWorkUnit(state, 'W1');
  const slice = projectStructuredTaskSlice(state, 'W1');
  assert.match(slice.workUnit, /W1 — Inspect the clean repository/);
  assert.equal(slice.requirements.some((value) => value.includes('R1')), true);
  assert.equal(slice.stops.length, 2);
  state = addressTaskWorkUnit(state, 'W1');
  state = recordTaskValidationAttempt(state, 'V1', { turnId: 'phase9', callId: 'v1', status: 'passed', exitCode: 0, signal: null, outcome: 'completed' });
  session.taskState = state;
  const store = new LocalSessionStore({ root: durableRoot });
  await store.save(session);
  const reopened = await store.open(session.id, workspace);
  assert.equal(reopened.taskState?.validations.V1.status, 'passed');
  assert.equal(projectTaskState(reopened.taskState!).currentWorkUnit, undefined);
  assert.match(taskHeader(reopened.taskState), /Task: Scaffold the service/);
  assert.match(renderTask(reopened.taskState, []), /Effective access: workspace autonomous, network ask/);
  const effective = intersectExecutionPolicy(DEFAULT_EXECUTION_POLICY, { workspace: 'workspace_autonomous', outsideWorkspace: 'ask', network: 'ask' });
  assert.deepEqual(effective, DEFAULT_EXECUTION_POLICY, 'task expectations cannot raise the configured user policy');
});

test('Phase 9 inherited deterministic floors remain executable', () => {
  const files = [
    'test/unit/tasks/parser.test.ts', 'test/unit/tasks/state.test.ts', 'test/unit/application/structured-task.test.ts',
    'test/unit/application/recovery.test.ts', 'test/unit/tools/sandbox-process.test.ts',
    'test/integration/agent-loop.test.ts', 'test/integration/phase5-qualification.test.ts', 'test/integration/phase6-qualification.test.ts',
  ];
  for (const file of files) {
    const result = spawnSync(process.execPath, ['--test', file], { cwd: ROOT, encoding: 'utf8', timeout: 240_000, maxBuffer: 2 * 1024 * 1024 });
    assert.equal(result.error, undefined, result.error?.message);
    assert.equal(result.status, 0, `${file}\n${result.stdout}\n${result.stderr}`);
  }
});
