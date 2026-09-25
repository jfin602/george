import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { StructuredTaskApplicationService, StructuredTaskStackApplicationService, createCodingWorkflowApplicationService } from '../../../src/application/index.ts';
import { createSession, type ApprovalDecision, type ApprovalPort, type ApprovalRequest, type ModelProvider, type ProviderEvent, type ProviderRequest } from '../../../src/core/index.ts';
import { runGreenfieldExpressV1, runLiveWorkInstrument } from '../../../src/qualification/index.ts';

class Provider implements ModelProvider {
  async *stream(_request: ProviderRequest): AsyncGenerator<ProviderEvent> { yield { type: 'provider.response.completed', usage: { inputTokens: 4, outputTokens: 1 } }; }
}
class Allow implements ApprovalPort { async request(_request: ApprovalRequest): Promise<ApprovalDecision> { return 'allow_once'; } }
const prompt = (ordinal: number, fail = false) => `GEORGE TASK FORMAT: 1

STACK: live-runner
TASK: P${ordinal} — Task ${ordinal}
KIND: ${ordinal === 2 ? 'closeout' : 'implementation'}

GOAL

Complete.

REQUIREMENTS

- R1: Complete.

WORKFLOW

W1 — Work
Covers: R1
Depends on: none

VALIDATION

V1 — Check
Covers: R1
Run: node ${fail ? '--definitely-not-a-node-option' : '--version'}

STOP CONDITIONS

- S1: Stop truthfully.
`;

test('live-work runner delegates stack progression and gates hidden acceptance on full completion', async (t) => {
  const workspace = await mkdtemp(join(tmpdir(), 'george-live-runner-'));
  t.after(() => rm(workspace, { recursive: true, force: true }));
  const workflow = await createCodingWorkflowApplicationService({ provider: new Provider(), workspace, approvalPort: new Allow() });
  const service = new StructuredTaskStackApplicationService(new StructuredTaskApplicationService(workflow.agent, undefined, undefined, 0));
  let acceptanceCalls = 0;
  const failed = await runLiveWorkInstrument({ kind: 'stack', service, session: createSession({ workspace }), prompts: [prompt(1, true), prompt(2)], acceptancePath: join(workspace, '..', 'hidden.test.mjs'), runHiddenAcceptance: async () => { acceptanceCalls += 1; return true; } });
  assert.equal(failed.hiddenAcceptance, 'not_run');
  assert.equal(failed.qualifying, false);
  assert.equal(acceptanceCalls, 0);
  assert.equal(failed.metrics.stackUpdates > 0, true);

  const passed = await runLiveWorkInstrument({ kind: 'stack', service, session: createSession({ workspace }), prompts: [prompt(1), prompt(2)], acceptancePath: join(workspace, '..', 'hidden.test.mjs'), runHiddenAcceptance: async () => { acceptanceCalls += 1; return true; } });
  assert.equal(passed.qualifying, true);
  assert.equal(acceptanceCalls, 1);
  assert.equal(passed.metrics.providerInputTokens, 8);
});

test('live-work runner rejects model-visible acceptance and unauthorized dependency installation', async (t) => {
  const workspace = await mkdtemp(join(tmpdir(), 'george-live-runner-policy-'));
  t.after(() => rm(workspace, { recursive: true, force: true }));
  const workflow = await createCodingWorkflowApplicationService({ provider: new Provider(), workspace, approvalPort: new Allow() });
  const service = new StructuredTaskApplicationService(workflow.agent);
  await assert.rejects(runLiveWorkInstrument({ kind: 'single', service, session: createSession({ workspace }), prompt: prompt(1), acceptancePath: join(workspace, 'hidden.test.mjs'), runHiddenAcceptance: async () => true }), /outside/);
  await assert.rejects(runLiveWorkInstrument({ kind: 'single', service, session: createSession({ workspace }), prompt: prompt(1), acceptancePath: join(workspace, '..', 'hidden.test.mjs'), runHiddenAcceptance: async () => true, dependencyInstallation: { authorized: false, run: async () => undefined } }), /authorization/);
});

test('greenfield frozen runner loads the full instrument into the production stack boundary', async (t) => {
  const workspace = await mkdtemp(join(tmpdir(), 'george-greenfield-runner-'));
  t.after(() => rm(workspace, { recursive: true, force: true }));
  let received: readonly string[] = [];
  const service = { run: async (submission: { prompts: readonly string[] }) => {
    received = submission.prompts;
    return { state: { status: 'completed' }, taskCompletions: [] };
  } } as unknown as StructuredTaskStackApplicationService;
  const result = await runGreenfieldExpressV1({
    service,
    session: createSession({ workspace }),
    instrumentRoot: join(process.cwd(), 'test/fixtures/p9-live-work/greenfield-express-v1'),
    acceptancePath: join(process.cwd(), 'test/acceptance/p9-live-work/greenfield-express-v1.test.mjs'),
    runHiddenAcceptance: async () => true,
  });
  assert.equal(result.qualifying, true);
  assert.deepEqual(received.map((value) => value.match(/TASK: P(\d)/)?.[1]), ['1', '2', '3']);
});
