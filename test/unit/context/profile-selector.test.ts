import assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import {
  LARGE_CONTEXT_PROFILE,
  MEDIUM_CONTEXT_PROFILE,
  ORDINARY_CONTEXT_PROFILE,
  resolveWorkspaceRoot,
} from '../../../src/core/index.ts';
import { assembleContext, selectContextProfile } from '../../../src/context/index.ts';

async function fixture(): Promise<string> {
  return mkdtemp(join(tmpdir(), 'george-profile-selector-'));
}

async function adaptive(assemble: Parameters<typeof selectContextProfile>[0]['assemble']) {
  return selectContextProfile({ mode: 'adaptive', assemble });
}

test('fixed selection validates one profile and never probes or promotes', async () => {
  let probes = 0;
  const selected = await selectContextProfile({
    mode: 'fixed', profile: MEDIUM_CONTEXT_PROFILE,
    assemble: async () => { probes += 1; return assembleContext({ invariants: 'never', userInput: 'never', maxTokens: 1 }); },
  });
  assert.equal(selected.profile.id, MEDIUM_CONTEXT_PROFILE.id);
  assert.deepEqual(selected.attemptedProfileIds, []);
  assert.deepEqual(selected.promotionReasons, []);
  assert.equal(probes, 0);
  await assert.rejects(
    () => selectContextProfile({ mode: 'fixed', assemble: async () => assembleContext({ invariants: 'never', userInput: 'never', maxTokens: 1 }) }),
    /requires a profile/,
  );
});

test('adaptive selection is deterministic and promotes required-source assembly failures monotonically', async () => {
  const select = (size: number) => adaptive((profile) => assembleContext({
    invariants: 'invariant', userInput: 'x'.repeat(size), maxTokens: profile.providerInputTokens, optionalMaxTokens: profile.softPressureTokens,
  }));
  const mediumFirst = await select(36_000);
  const mediumSecond = await select(36_000);
  assert.deepEqual(mediumFirst, mediumSecond);
  assert.equal(mediumFirst.profile.id, MEDIUM_CONTEXT_PROFILE.id);
  assert.deepEqual(mediumFirst.attemptedProfileIds, [ORDINARY_CONTEXT_PROFILE.id, MEDIUM_CONTEXT_PROFILE.id]);
  assert.deepEqual(mediumFirst.promotionReasons, ['required-source-failure']);
  const large = await select(70_000);
  assert.equal(large.profile.id, LARGE_CONTEXT_PROFILE.id);
  assert.deepEqual(large.attemptedProfileIds, [ORDINARY_CONTEXT_PROFILE.id, MEDIUM_CONTEXT_PROFILE.id, LARGE_CONTEXT_PROFILE.id]);
  assert.deepEqual(large.promotionReasons, ['required-source-failure']);
});

test('selected project, routed-document, and activated-skill pressure promote, while low-value defaults may omit', async (t) => {
  const root = await fixture();
  t.after(() => rm(root, { recursive: true, force: true }));
  const workspace = await resolveWorkspaceRoot(root);
  const projectText = 'p'.repeat(32_000);
  const routedText = 'r'.repeat(32_000);
  const optionalText = 'o'.repeat(32_000);
  await mkdir(join(root, '.george'));
  await mkdir(join(root, 'docs'));
  await Promise.all([
    writeFile(join(root, '.george', 'instructions.md'), projectText),
    writeFile(join(root, 'docs', 'selected.md'), routedText),
    writeFile(join(root, 'personality.md'), optionalText),
  ]);
  const select = (extra: Partial<Parameters<typeof assembleContext>[0]> = {}) => adaptive((profile) => assembleContext({
    invariants: 'invariant', userInput: 'task', workspace,
    maxTokens: profile.providerInputTokens, optionalMaxTokens: profile.softPressureTokens, ...extra,
  }));
  const project = await select();
  assert.equal(project.profile.id, MEDIUM_CONTEXT_PROFILE.id);
  assert.deepEqual(project.promotionReasons, ['selected-project-instructions']);
  const routed = await select({ routedDocuments: ['docs/selected.md'] });
  assert.equal(routed.profile.id, LARGE_CONTEXT_PROFILE.id);
  assert.ok(routed.promotionReasons.includes('routed-document'));
  const skill = await select({ activatedSkills: [{ id: 'selected', text: 's'.repeat(32_000), origin: 'workspace' }] });
  assert.equal(skill.profile.id, LARGE_CONTEXT_PROFILE.id);
  assert.ok(skill.promotionReasons.includes('activated-skill'));
  const optionalRoot = await fixture();
  t.after(() => rm(optionalRoot, { recursive: true, force: true }));
  const personality = join(optionalRoot, 'personality.md');
  await writeFile(personality, optionalText);
  const optionalWorkspace = await resolveWorkspaceRoot(optionalRoot);
  const optional = await select({ workspace: optionalWorkspace, personalityPath: personality });
  assert.equal(optional.profile.id, ORDINARY_CONTEXT_PROFILE.id);
  assert.deepEqual(optional.promotionReasons, []);
});

test('real assembly probes emit no lifecycle evidence or provider, tool, hook, permission, or session side effects', async () => {
  const events: unknown[] = [];
  let providerCalls = 0;
  let toolCalls = 0;
  let hookCalls = 0;
  let permissionCalls = 0;
  const session = { mutations: 0 };
  const selected = await adaptive(async (profile) => {
    // This is the entire probe boundary: real assembly receives no canonical observer.
    const context = await assembleContext({ invariants: 'invariant', userInput: 'task', maxTokens: profile.providerInputTokens, optionalMaxTokens: profile.softPressureTokens });
    return context;
  });
  assert.equal(selected.profile.id, ORDINARY_CONTEXT_PROFILE.id);
  assert.deepEqual(events, []);
  assert.equal(providerCalls, 0);
  assert.equal(toolCalls, 0);
  assert.equal(hookCalls, 0);
  assert.equal(permissionCalls, 0);
  assert.equal(session.mutations, 0);
});
