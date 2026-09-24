import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { promisify } from 'node:util';
import test from 'node:test';

import { createContextProfileFixture, formatContextCompositionProfile, parseContextProfileArguments, profileContextComposition } from '../../../src/context/profiler.ts';
import { assembleContext } from '../../../src/context/index.ts';

const exec = promisify(execFile);

test('context composition scenarios are deterministic and report real assembly evidence', async () => {
  for (const scenario of ['ordinary', 'medium', 'large'] as const) {
    const first = await profileContextComposition(scenario);
    const second = await profileContextComposition(scenario);
    assert.deepEqual(first, second);
    assert.deepEqual(first.context.sources.map((source) => source.id), [
      'george:invariants', 'conversation:current-user-input', 'conversation:history', 'state:authoritative', 'skill:builtin:deterministic-fixtures', 'tools:normalized-definition-overhead', 'workspace:.george/instructions.md', 'skill:workspace:duplicate-agents', 'workspace:AGENTS.md', 'workspace:BOOT.md', 'workspace:routed:docs/deferred.md', 'workspace:routed:docs/missing.md', 'workspace:routed:docs/not-a-file', 'workspace:routed:docs/selected.md',
    ]);
    assert.equal(first.context.sources.find((source) => source.id === 'workspace:BOOT.md')?.disposition, 'routed');
    assert.equal(first.context.sources.find((source) => source.id === 'workspace:routed:docs/deferred.md')?.disposition, 'deferred');
    assert.equal(first.context.sources.find((source) => source.id === 'workspace:routed:docs/missing.md')?.disposition, 'omitted');
    assert.equal(first.context.sources.find((source) => source.id === 'workspace:AGENTS.md')?.disposition, 'duplicate');
    assert.equal(first.context.sources.find((source) => source.id === 'workspace:routed:docs/not-a-file')?.disposition, 'failed');
    assert.equal(first.activeSourceTokens, first.context.sources.filter((source) => source.disposition === 'active').reduce((total, source) => total + (source.estimatedTokens ?? 0), 0));
    assert.equal(first.remainingProviderInputHeadroom, first.profile.providerInputTokens - first.context.estimatedTokens);
  }
});

test('profile and scenario selection are independent and fixture assembly is read-only after setup', async (t) => {
  const result = await profileContextComposition('ordinary', 'medium');
  assert.equal(result.profile.providerInputTokens, 8_192);
  assert.equal(result.scenario, 'medium');
  const fixture = await createContextProfileFixture('ordinary');
  t.after(fixture.cleanup);
  const before = await readFile(`${fixture.root}/docs/selected.md`, 'utf8');
  await assembleContext(fixture.options);
  assert.equal(await readFile(`${fixture.root}/docs/selected.md`, 'utf8'), before);
});

test('context profile CLI arguments are bounded', () => {
  assert.deepEqual(parseContextProfileArguments(['--profile', 'ordinary']), { profile: 'ordinary', scenario: 'ordinary' });
  assert.deepEqual(parseContextProfileArguments(['--profile', 'ordinary', '--scenario', 'medium']), { profile: 'ordinary', scenario: 'medium' });
  assert.deepEqual(parseContextProfileArguments(['--all']), { all: true });
  for (const arguments_ of [[], ['--profile', 'unknown'], ['--scenario', 'ordinary'], ['--profile'], ['--profile', '--scenario'], ['--bad', 'ordinary'], ['--all', '--profile', 'ordinary']]) {
    assert.throws(() => parseContextProfileArguments(arguments_), Error);
  }
});

test('context profile CLI output is deterministic ASCII and rejects invalid selections', async () => {
  const options = { cwd: process.cwd(), encoding: 'utf8' as const };
  const first = await exec(process.execPath, ['scripts/context-profile.ts', '--profile', 'ordinary'], options);
  const second = await exec(process.execPath, ['scripts/context-profile.ts', '--profile', 'ordinary'], options);
  assert.equal(first.stdout, second.stdout);
  assert.match(first.stdout, /Context composition[\s\S]*Profile summary/);
  assert.match(first.stdout, /^[\x00-\x7F]*$/);
  await assert.rejects(exec(process.execPath, ['scripts/context-profile.ts', '--profile', 'unknown'], options), /Unknown profile/);
  await assert.rejects(exec(process.execPath, ['scripts/context-profile.ts', '--scenario', 'ordinary'], options), /Missing --profile/);
  assert.match(formatContextCompositionProfile(await profileContextComposition('large')), /^[\x00-\x7F]*$/);
});
