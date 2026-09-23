import assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { GeorgeError, resolveWorkspaceRoot } from '../../../src/core/index.ts';
import { assembleContext, defaultContextTokenEstimator, loadBoundedContextFile } from '../../../src/context/index.ts';

async function fixture(): Promise<string> {
  return mkdtemp(join(tmpdir(), 'george-context-'));
}

async function assemble(root: string, extra: Partial<Parameters<typeof assembleContext>[0]> = {}) {
  return assembleContext({ invariants: 'invariant', userInput: 'user task', workspace: await resolveWorkspaceRoot(root), maxTokens: 10_000, ...extra });
}

test('context sources have stable precedence, IDs, and deterministic workspace ordering', async (t) => {
  const root = await fixture();
  const global = join(root, 'global.md');
  const personality = join(root, 'personality.md');
  t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(join(root, '.george'));
  await Promise.all([
    writeFile(join(root, '.george', 'instructions.md'), 'workspace native'),
    writeFile(join(root, 'AGENTS.md'), 'agents'),
    writeFile(join(root, 'BOOT.md'), 'routing only'),
    writeFile(global, 'global'),
    writeFile(personality, 'style'),
  ]);
  const context = await assemble(root, { userGlobalInstructionsPath: global, personalityPath: personality, normalizedToolDefinitions: 'tool schema' });
  assert.deepEqual(context.sources.map((source) => source.id), [
    'george:invariants', 'conversation:current-user-input', 'tools:normalized-definition-overhead',
    'workspace:.george/instructions.md', 'workspace:AGENTS.md', 'workspace:BOOT.md', 'user:global-instructions', 'user:personality',
  ]);
  assert.equal(context.sources[5]?.disposition, 'routed');
  assert.match(context.rendered.guidance, /workspace native[\s\S]*agents[\s\S]*global[\s\S]*style/);
  assert.doesNotMatch(context.rendered.guidance, /routing only/);
});

test('missing optional files are recorded and oversized files never expose a prefix', async (t) => {
  const root = await fixture();
  t.after(() => rm(root, { recursive: true, force: true }));
  const oversized = join(root, 'big.md');
  await writeFile(oversized, '12345');
  const context = await assemble(root, { userGlobalInstructionsPath: join(root, 'missing-global.md'), personalityPath: oversized, maxSourceBytes: 4 });
  assert.equal(context.sources.find((source) => source.id === 'workspace:.george/instructions.md')?.disposition, 'omitted');
  assert.equal(context.sources.find((source) => source.id === 'user:global-instructions')?.disposition, 'omitted');
  const source = context.sources.find((item) => item.id === 'user:personality');
  assert.equal(source?.disposition, 'deferred');
  assert.equal(source?.text, undefined);
  assert.equal((await loadBoundedContextFile(oversized, 4)).status, 'oversized');
});

test('exact normalized duplicates keep the higher-precedence source and record the duplicate', async (t) => {
  const root = await fixture();
  t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(join(root, '.george'));
  await Promise.all([writeFile(join(root, '.george', 'instructions.md'), 'same\r\ntext'), writeFile(join(root, 'AGENTS.md'), 'same\ntext')]);
  const context = await assemble(root);
  const duplicate = context.sources.find((source) => source.id === 'workspace:AGENTS.md');
  assert.equal(duplicate?.disposition, 'duplicate');
  assert.equal(duplicate?.duplicateOf, 'workspace:.george/instructions.md');
});

test('routed sources are canonical workspace-contained and deterministic by path', async (t) => {
  const root = await fixture();
  const outside = await fixture();
  t.after(() => Promise.all([rm(root, { recursive: true, force: true }), rm(outside, { recursive: true, force: true })]));
  await Promise.all([writeFile(join(root, 'a.md'), 'a'), writeFile(join(root, 'b.md'), 'b'), writeFile(join(outside, 'secret.md'), 'secret')]);
  await symlink(join(outside, 'secret.md'), join(root, 'escape.md'));
  const context = await assemble(root, { routedDocuments: ['b.md', 'a.md', 'b.md'] });
  assert.deepEqual(context.sources.filter((source) => source.kind === 'routed-document').map((source) => source.id), ['workspace:routed:a.md', 'workspace:routed:b.md']);
  await assert.rejects(() => assemble(root, { routedDocuments: ['../secret.md'] }), GeorgeError);
  await assert.rejects(() => assemble(root, { routedDocuments: ['escape.md'] }), GeorgeError);
});

test('token estimates are deterministic, provider-independent, and include all normalized material', async (t) => {
  const root = await fixture();
  t.after(() => rm(root, { recursive: true, force: true }));
  const first = await assemble(root, { conversation: 'earlier', normalizedToolDefinitions: 'schema' });
  const second = await assemble(root, { conversation: 'earlier', normalizedToolDefinitions: 'schema' });
  assert.equal(first.estimator.kind, defaultContextTokenEstimator.kind);
  assert.equal(first.estimator.estimated, true);
  assert.equal(first.estimatedTokens, second.estimatedTokens);
  assert.ok(first.estimatedTokens > 0);
  assert.equal(typeof first.sources.find((source) => source.id === 'conversation:current-user-input')?.estimatedTokens, 'number');
  assert.match(first.rendered.conversation, /user task[\s\S]*earlier/);
  assert.match(first.rendered.toolDefinitions, /schema/);
  assert.equal('instructions' in first, false);
});

test('required sources fail the budget while optional sources are omitted whole and routed sources defer', async (t) => {
  const root = await fixture();
  t.after(() => rm(root, { recursive: true, force: true }));
  await Promise.all([writeFile(join(root, 'extra.md'), 'routed material'), writeFile(join(root, 'global.md'), 'global material')]);
  await assert.rejects(() => assemble(root, { maxTokens: 1 }), (error: unknown) => error instanceof GeorgeError && /Required context source george:invariants/.test(error.message));
  const baseline = await assemble(root);
  const constrained = await assemble(root, { maxTokens: baseline.estimatedTokens, userGlobalInstructionsPath: join(root, 'global.md'), routedDocuments: ['extra.md'] });
  assert.equal(constrained.sources.find((source) => source.id === 'workspace:routed:extra.md')?.disposition, 'deferred');
  assert.equal(constrained.sources.find((source) => source.id === 'user:global-instructions')?.disposition, 'omitted');
  assert.doesNotMatch(constrained.rendered.guidance, /global material|routed material/);
});
