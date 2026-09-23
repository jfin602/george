import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtemp, mkdir, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { PluginManager, parsePluginManifest } from '../../../src/plugins/index.ts';

async function packageFixture(root: string, name: string, options: Readonly<{ hook?: boolean; duplicate?: boolean; version?: string }> = {}): Promise<string> {
  const source = join(root, name);
  await mkdir(join(source, 'skills'), { recursive: true });
  await mkdir(join(source, 'bin'), { recursive: true });
  await writeFile(join(source, 'skills', 'review.md'), '---\nname: review\ndescription: review\n---\nReview.\n');
  await writeFile(join(source, 'bin', 'tool.js'), 'throw new Error("plugin code must never execute during install");\n');
  const hooks = options.hook ? [{ id: 'audit', event: 'turn.completed', path: 'bin/tool.js' }] : [];
  const tools = [{ id: 'inspect', description: 'Inspect input.', path: 'bin/tool.js', inputSchema: { type: 'object', properties: { value: { type: 'string', maxLength: 20 } }, required: ['value'], additionalProperties: false } }];
  if (options.duplicate) tools.push({ ...tools[0]! });
  await writeFile(join(source, 'george-plugin.json'), JSON.stringify({ manifestVersion: 1, id: 'fixture.plugin', version: options.version ?? '1.0.0', skills: [{ id: 'review', path: 'skills/review.md' }], hooks, commands: [{ id: 'run-review', skill: 'review' }], tools }));
  return source;
}

test('plugin lifecycle is managed, non-executing, and capability changes require re-enable', async (t) => {
  const root = await mkdtemp(join(tmpdir(), 'george-plugin-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const workspace = join(root, 'workspace');
  const state = join(root, 'user-state');
  await mkdir(workspace);
  const source = await packageFixture(workspace, 'plugin');
  const sentinel = join(root, 'plugin-executed');
  await writeFile(join(source, 'bin', 'tool.js'), `require('node:fs').writeFileSync(${JSON.stringify(sentinel)}, 'executed');\n`);
  const manager = new PluginManager({ root: state });

  const installed = await manager.install(source);
  assert.deepEqual({ id: installed.id, version: installed.version, enabled: installed.enabled }, { id: 'fixture.plugin', version: '1.0.0', enabled: false });
  assert.deepEqual(await manager.list(), [installed]);
  await assert.rejects(readFile(sentinel), /ENOENT/);
  assert.equal(await manager.enable('fixture.plugin').then((item) => item.enabled), true);
  assert.equal((await manager.install(source)).enabled, true, 'unchanged executable capability preserves explicit enablement');

  const changed = await packageFixture(root, 'changed', { hook: true, version: '1.0.1' });
  assert.equal((await manager.install(changed)).enabled, false, 'new executable capability requires explicit re-enable');
  assert.equal((await manager.disable('fixture.plugin')).enabled, false);
  await manager.uninstall('fixture.plugin');
  assert.deepEqual(await manager.list(), []);
  await assert.rejects(readFile(sentinel), /ENOENT/);
  await assert.rejects(readFile(join(workspace, 'plugins', 'state.json')), /ENOENT/, 'managed state never mutates the fixture workspace');
});

test('plugin install rejects malformed, oversized, duplicate, traversal, symlink, and special package content without replacing prior state', async (t) => {
  const root = await mkdtemp(join(tmpdir(), 'george-plugin-reject-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const manager = new PluginManager({ root: join(root, 'state'), maxFileBytes: 4 * 1024, maxTreeBytes: 16 * 1024 });
  const valid = await packageFixture(root, 'valid');
  const before = await manager.install(valid);
  const cases: string[] = [];

  const malformed = await packageFixture(root, 'malformed');
  await writeFile(join(malformed, 'george-plugin.json'), '{'); cases.push(malformed);
  const unsupported = await packageFixture(root, 'unsupported');
  await writeFile(join(unsupported, 'george-plugin.json'), JSON.stringify({ manifestVersion: 2, id: 'fixture.plugin', version: '1.0.0' })); cases.push(unsupported);
  const duplicate = await packageFixture(root, 'duplicate', { duplicate: true }); cases.push(duplicate);
  const traversal = await packageFixture(root, 'traversal');
  await writeFile(join(traversal, 'george-plugin.json'), JSON.stringify({ manifestVersion: 1, id: 'fixture.plugin', version: '1.0.0', skills: [{ id: 'review', path: '../outside.md' }] })); cases.push(traversal);
  const oversized = await packageFixture(root, 'oversized');
  await writeFile(join(oversized, 'large.txt'), 'x'.repeat(4 * 1024 + 1)); cases.push(oversized);
  const linked = await packageFixture(root, 'linked');
  await symlink(join(linked, 'bin', 'tool.js'), join(linked, 'linked.js')); cases.push(linked);

  for (const source of cases) {
    await assert.rejects(manager.install(source));
    assert.deepEqual(await manager.list(), [before]);
  }
  const special = await packageFixture(root, 'special');
  execFileSync('mkfifo', [join(special, 'pipe')]);
  await assert.rejects(manager.install(special));
  assert.deepEqual(await manager.list(), [before]);
});

test('manifest parser keeps the ToolRegistry schema subset bounded and deterministic', () => {
  const manifest = parsePluginManifest(JSON.stringify({
    manifestVersion: 1, id: 'fixture.plugin', version: '1.0.0',
    tools: [{ id: 'inspect', description: 'Inspect.', path: 'bin/tool.js', inputSchema: { type: 'object', properties: {}, additionalProperties: false } }],
  }));
  assert.equal(manifest.tools[0]?.inputSchema.type, 'object');
  assert.throws(() => parsePluginManifest(JSON.stringify({ manifestVersion: 1, id: 'fixture.plugin', version: '1.0.0', tools: [{ id: 'inspect', description: 'Inspect.', path: 'bin/tool.js', inputSchema: { type: 'object', properties: {}, additionalProperties: true } }] })));
});
