import assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { GeorgeError } from '../../../src/core/index.ts';
import { SkillRegistry } from '../../../src/skills/index.ts';

async function fixture(): Promise<string> {
  return mkdtemp(join(tmpdir(), 'george-skills-'));
}

async function skill(root: string, name: string, body = 'Use this declarative guidance.', metadata = `name: ${name}\ndescription: ${name} description`): Promise<void> {
  await mkdir(join(root, name), { recursive: true });
  await writeFile(join(root, name, 'SKILL.md'), `---\n${metadata}\n---\n${body}\n`);
}

test('discoveries from all portable roots are ordered metadata only and missing roots are normal', async (t) => {
  const root = await fixture();
  t.after(() => rm(root, { recursive: true, force: true }));
  const roots = { builtin: join(root, 'builtin'), user: join(root, 'user'), workspace: join(root, 'workspace') };
  await Promise.all([
    skill(roots.builtin, 'alpha'),
    skill(roots.user, 'external', 'Portable body.', 'name: external\ndescription: >\n  external portable skill\nargument-hint: "[file]"\nunknown-field: ignored'),
    skill(roots.workspace, 'zeta'),
  ]);
  const registry = new SkillRegistry(roots);
  const catalog = await registry.catalog();
  assert.deepEqual(catalog.skills.map((item) => item.id), ['builtin:alpha', 'user:external', 'workspace:zeta']);
  assert.deepEqual(catalog.skills.map((item) => Object.keys(item).sort()), [
    ['description', 'id', 'name', 'origin'], ['argumentHint', 'description', 'id', 'name', 'origin'], ['description', 'id', 'name', 'origin'],
  ]);
  assert.equal(catalog.skills[1]?.description, 'external portable skill');
  assert.equal(catalog.skills[1]?.argumentHint, '[file]');
  assert.equal(JSON.stringify(catalog), JSON.stringify(await registry.catalog()));
  assert.deepEqual((await new SkillRegistry({ builtin: join(root, 'missing-a'), user: join(root, 'missing-b'), workspace: join(root, 'missing-c') }).catalog()).skills, []);
});

test('qualified and unique unqualified activation loads bodies only at activation and collisions fail visibly', async (t) => {
  const root = await fixture();
  t.after(() => rm(root, { recursive: true, force: true }));
  const roots = { builtin: join(root, 'builtin'), user: join(root, 'user'), workspace: join(root, 'workspace') };
  await Promise.all([skill(roots.builtin, 'unique', 'BUILTIN BODY'), skill(roots.user, 'same', 'USER BODY'), skill(roots.workspace, 'same', 'WORKSPACE BODY')]);
  const registry = new SkillRegistry(roots);
  const catalog = await registry.catalog();
  assert.doesNotMatch(JSON.stringify(catalog), /BODY/);
  assert.deepEqual(catalog.collisions, [{ name: 'same', ids: ['user:same', 'workspace:same'] }]);
  assert.deepEqual(await registry.activate(['unique']), [{ id: 'builtin:unique', origin: 'builtin', text: 'BUILTIN BODY' }]);
  await assert.rejects(() => registry.activate(['same']), (error: unknown) => error instanceof GeorgeError && /Ambiguous skill same/.test(error.message));
  assert.deepEqual(await registry.activate(['workspace:same']), [{ id: 'workspace:same', origin: 'workspace', text: 'WORKSPACE BODY' }]);
});

test('malformed, missing, oversized, and escaped skill files stay visible and never activate', async (t) => {
  const root = await fixture();
  const outside = await fixture();
  t.after(() => Promise.all([rm(root, { recursive: true, force: true }), rm(outside, { recursive: true, force: true })]));
  const roots = { builtin: join(root, 'builtin'), user: join(root, 'user'), workspace: join(root, 'workspace') };
  await mkdir(join(roots.builtin, 'missing'), { recursive: true });
  await skill(roots.user, 'bad', '', 'name: bad');
  await skill(roots.workspace, 'large', 'x'.repeat(200));
  await skill(outside, 'escape');
  await mkdir(roots.builtin, { recursive: true });
  await symlink(join(outside, 'escape'), join(roots.builtin, 'escape'));
  const registry = new SkillRegistry(roots, { maxSkillBytes: 100, maxMetadataBytes: 80 });
  const catalog = await registry.catalog();
  assert.equal(catalog.skills.length, 0);
  assert.ok(catalog.issues.some((issue) => /ENOENT/.test(issue.reason)));
  assert.ok(catalog.issues.some((issue) => /requires a non-empty description/.test(issue.reason)));
  assert.ok(catalog.issues.some((issue) => /exceeds the 100 byte/.test(issue.reason)));
  assert.ok(catalog.issues.some((issue) => /symbolic link/.test(issue.reason)));
  await assert.rejects(() => registry.activate(['large']), /Unknown skill large/);
});

test('catalog bounds discovery without loading large bodies', async (t) => {
  const root = await fixture();
  t.after(() => rm(root, { recursive: true, force: true }));
  const roots = { builtin: join(root, 'builtin'), user: join(root, 'user'), workspace: join(root, 'workspace') };
  await Promise.all([skill(roots.builtin, 'one'), skill(roots.user, 'two')]);
  const catalog = await new SkillRegistry(roots, { maxSkills: 1 }).catalog();
  assert.deepEqual(catalog.skills.map((item) => item.id), ['builtin:one']);
  assert.ok(catalog.issues.some((issue) => /catalog exceeds/.test(issue.reason)));
});
