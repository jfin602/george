import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { cp, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { parseTaskPrompt, validateTaskStack } from '../../src/tasks/index.ts';

const ROOT = process.cwd();
const FIXTURES = join(ROOT, 'test/fixtures/p10-live-work');
const ACCEPTANCE = join(ROOT, 'test/acceptance/p10-live-work');

async function paths(root: string, part = '', only: (path: string) => boolean = () => true): Promise<string[]> {
  const entries = await readdir(join(root, part), { withFileTypes: true });
  return (await Promise.all(entries.map(async (entry) => {
    const path = join(part, entry.name);
    return entry.isDirectory() ? paths(root, path, only) : entry.isFile() && only(path) ? [path] : [];
  }))).flat().sort();
}

async function digest(root: string, only?: (path: string) => boolean): Promise<string> {
  const hash = createHash('sha256');
  for (const path of await paths(root, '', only)) { hash.update(path); hash.update('\0'); hash.update(await readFile(join(root, path))); hash.update('\0'); }
  return hash.digest('hex');
}

test('Phase 10 B3/C3 identities, fixtures, tasks, and independently versioned hidden acceptance are frozen', async () => {
  const b3 = join(FIXTURES, 'greenfield-core-v1');
  const c3 = join(FIXTURES, 'existing-core-edit-v1');
  const b3Metadata = JSON.parse(await readFile(join(b3, 'instrument.json'), 'utf8'));
  const c3Metadata = JSON.parse(await readFile(join(c3, 'instrument.json'), 'utf8'));
  assert.deepEqual({ instrument: b3Metadata.instrument, version: b3Metadata.version, acceptanceVersion: b3Metadata.acceptanceVersion }, { instrument: 'greenfield-core-v1', version: 1, acceptanceVersion: 1 });
  assert.deepEqual({ instrument: c3Metadata.instrument, version: c3Metadata.version, fixtureVersion: c3Metadata.fixtureVersion, acceptanceVersion: c3Metadata.acceptanceVersion }, { instrument: 'existing-core-edit-v1', version: 1, fixtureVersion: 1, acceptanceVersion: 1 });
  assert.equal(await digest(b3, (path) => path.endsWith('.task.txt')), b3Metadata.taskStackSha256);
  assert.equal(await digest(c3, (path) => path.endsWith('.task.txt')), c3Metadata.taskStackSha256);
  assert.equal(await digest(join(c3, 'base')), c3Metadata.fixtureSourceSha256);
  assert.equal(createHash('sha256').update(await readFile(join(ACCEPTANCE, b3Metadata.acceptance))).digest('hex'), b3Metadata.acceptanceSha256);
  assert.equal(createHash('sha256').update(await readFile(join(ACCEPTANCE, c3Metadata.acceptance))).digest('hex'), c3Metadata.acceptanceSha256);
  assert.equal((await paths(b3)).some((path) => path.includes('acceptance')), false);
  assert.equal((await paths(c3)).some((path) => path.includes('acceptance')), false);

  const b3Tasks = await Promise.all(['P1-core.task.txt', 'P2-store.task.txt'].map(async (name) => parseTaskPrompt(await readFile(join(b3, name), 'utf8'))));
  assert.equal(b3Tasks.every((item) => item.kind === 'structured'), true);
  const definitions = b3Tasks.flatMap((item) => item.kind === 'structured' ? [item.task] : []);
  validateTaskStack(definitions);
  assert.deepEqual(definitions.map(({ stack, task }) => [stack, task.ordinal]), [['greenfield-core-v1', 1], ['greenfield-core-v1', 2]]);
  assert.match(definitions[1]?.requirements.map(({ text }) => text).join(' ') ?? '', /import normalizeTitle/);
  const c3Task = parseTaskPrompt(await readFile(join(c3, 'P1-release-label.task.txt'), 'utf8'));
  assert.equal(c3Task.kind, 'structured');
  if (c3Task.kind === 'structured') {
    assert.deepEqual(c3Task.task.inspect, ['src/labels.js', 'focused baseline tests and package scripts', 'README and Git status']);
    assert.deepEqual(c3Task.task.validations.map(({ command }) => command), [
      { kind: 'literal', executable: 'node', arguments: ['--test', 'test/release-label.test.js'] },
      { kind: 'literal', executable: 'npm', arguments: ['test'] },
    ]);
  }
  assert.match(`${b3Metadata.dependencyPrerequisite} ${c3Metadata.dependencyPrerequisite}`, /network and dependency installation prohibited/);
});

test('C3 baseline is Green and both hidden acceptances are literal and model-external', async (t) => {
  const parent = await mkdtemp(join(tmpdir(), 'george-p10-acceptance-'));
  t.after(() => rm(parent, { recursive: true, force: true }));
  const c3 = join(parent, 'c3');
  await cp(join(FIXTURES, 'existing-core-edit-v1/base'), c3, { recursive: true });
  const baseline = await import('node:child_process').then(({ spawnSync }) => spawnSync(process.execPath, ['--test'], { cwd: c3, encoding: 'utf8' }));
  assert.equal(baseline.status, 0, `${baseline.stdout}\n${baseline.stderr}`);
  await writeFile(join(c3, 'src/labels.js'), `${await readFile(join(c3, 'src/labels.js'), 'utf8')}\nexport function formatReleaseLabel(value, channel = 'stable') {\n  const normalizedChannel = normalizeLabel(channel);\n  if (!['stable', 'beta', 'next'].includes(normalizedChannel)) throw new RangeError('invalid channel');\n  return \`${'${normalizeLabel(value)}@${normalizedChannel}'}\`;\n}\n`);
  await writeFile(join(c3, 'README.md'), `${await readFile(join(c3, 'README.md'), 'utf8')}\nAllowed release channels: stable, beta, or next.\n`);
  const { acceptExistingCoreEdit } = await import('../../test/acceptance/p10-live-work/existing-core-edit-v1.test.mjs');
  await acceptExistingCoreEdit(c3);

  const b3 = join(parent, 'b3');
  await cp(join(FIXTURES, 'existing-core-edit-v1/base'), b3, { recursive: true });
  await writeFile(join(b3, 'src/title.js'), "export const normalizeTitle = (value) => { if (typeof value !== 'string') throw new TypeError(); const result = value.trim().replace(/\\s+/g, ' '); if (!result) throw new RangeError(); return result; };\n");
  await writeFile(join(b3, 'src/task-store.js'), "import { normalizeTitle } from './title.js';\nexport const createTaskStore = () => { const tasks = []; return { add(title) { const task = { id: tasks.length + 1, title: normalizeTitle(title), done: false }; tasks.push(task); return { ...task }; }, complete(id) { const task = tasks.find((item) => item.id === id); if (!task) throw new RangeError(); task.done = true; return { ...task }; }, list() { return tasks.map((task) => ({ ...task })); } }; };\n");
  const { acceptGreenfieldCore } = await import('../../test/acceptance/p10-live-work/greenfield-core-v1.test.mjs');
  await acceptGreenfieldCore(b3);
});
