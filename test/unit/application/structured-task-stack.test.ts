import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { StructuredTaskApplicationService, StructuredTaskStackApplicationService, createCodingWorkflowApplicationService } from '../../../src/application/index.ts';
import { LocalSessionStore, createSession, type ApprovalDecision, type ApprovalPort, type ApprovalRequest, type ModelProvider, type ProviderEvent, type ProviderRequest } from '../../../src/core/index.ts';
import { addressTaskWorkUnit, beginStackTask, beginTaskWorkUnit, completeTask, createStackState, parseTaskPrompt, recordTaskValidationAttempt, updateCurrentStackTask } from '../../../src/tasks/index.ts';
import { renderTask, taskHeader } from '../../../src/tui/app.ts';

class Provider implements ModelProvider {
  readonly requests: ProviderRequest[] = [];
  async *stream(request: ProviderRequest): AsyncGenerator<ProviderEvent> { this.requests.push(request); yield { type: 'provider.response.completed' }; }
}
class Allow implements ApprovalPort { async request(_request: ApprovalRequest): Promise<ApprovalDecision> { return 'allow_once'; } }

const prompt = (ordinal: number, fails = false, stack = 'production-stack', kind = 'implementation') => `GEORGE TASK FORMAT: 1

STACK: ${stack}
TASK: P${ordinal} — Task ${ordinal}
KIND: ${kind}

GOAL

Complete task ${ordinal}.

REQUIREMENTS

- R1: Task completes.

WORKFLOW

W1 — Work
Covers: R1
Depends on: none

VALIDATION

V1 — Check
Covers: R1
Run: node ${fails ? '--definitely-not-a-node-option' : '--version'}

STOP CONDITIONS

- S1: Stop truthfully.
`;
const prompts = (failure?: number) => [prompt(1, failure === 1), prompt(2, failure === 2), prompt(3, failure === 3, 'production-stack', 'closeout')];

async function fixture(t: test.TestContext) {
  const workspace = await mkdtemp(join(tmpdir(), 'george-stack-'));
  const durable = await mkdtemp(join(tmpdir(), 'george-stack-state-'));
  t.after(() => Promise.all([rm(workspace, { recursive: true, force: true }), rm(durable, { recursive: true, force: true })]));
  const provider = new Provider();
  const store = new LocalSessionStore({ root: durable });
  const workflow = await createCodingWorkflowApplicationService({ provider, workspace, approvalPort: new Allow(), sessionStore: store });
  const taskService = new StructuredTaskApplicationService(workflow.agent, store, undefined, 0);
  return { workspace, durable, provider, store, service: new StructuredTaskStackApplicationService(taskService, store) };
}

test('stack validates every definition before P1 and executes only after prior completion', async (t) => {
  const { workspace, provider, service } = await fixture(t);
  const session = createSession({ workspace });
  await assert.rejects(service.run({ session, prompts: [prompt(1), prompt(2), prompt(3, false, 'other', 'closeout')] }), /identity/);
  assert.equal(provider.requests.length, 0);

  const completion = await service.run({ session, prompts: prompts() });
  assert.equal(completion.state.status, 'completed');
  assert.deepEqual(completion.state.completedTaskOrdinals, [1, 2, 3]);
  assert.deepEqual(completion.state.tasks.map((item) => item.taskState.validations.V1.status), ['passed', 'passed', 'passed']);
  assert.deepEqual(provider.requests.map((request) => request.input.match(/W1 — Work/)?.[0]), ['W1 — Work', 'W1 — Work', 'W1 — Work']);
});

test('stack fail-stops after P1 or P2 and terminal failure cannot be resumed', async (t) => {
  for (const failure of [1, 2]) {
    const { workspace, provider, service } = await fixture(t);
    const session = createSession({ workspace });
    const first = await service.run({ session, prompts: prompts(failure) });
    assert.equal(first.state.status, 'failed');
    assert.equal(provider.requests.length, failure + 2, 'later tasks receive no provider calls; the failing task uses its bounded corrections');
    assert.deepEqual(first.state.tasks.slice(failure).map((item) => item.status), Array(3 - failure).fill('pending'));
    await service.run({ session, prompts: prompts(failure) });
    assert.equal(provider.requests.length, failure + 2, 'terminal stack must not restart provider work');
  }
});

test('reopen retains completed P1 and resumes at P2 without replaying P1', async (t) => {
  const { workspace, provider, store, service } = await fixture(t);
  const session = createSession({ id: 'resume-stack', workspace });
  const definitions = prompts().map((value) => { const parsed = parseTaskPrompt(value); if (parsed.kind !== 'structured') throw new Error('Expected task.'); return parsed.task; });
  let stack = beginStackTask(createStackState({ sessionId: session.id, workspace, definitions }), 0);
  let p1 = addressTaskWorkUnit(beginTaskWorkUnit(stack.tasks[0]!.taskState, 'W1'), 'W1');
  p1 = recordTaskValidationAttempt(p1, 'V1', { turnId: 'p1', callId: 'p1-v1', status: 'passed', exitCode: 0, signal: null, outcome: 'completed' });
  p1 = completeTask(p1);
  stack = updateCurrentStackTask(stack, p1);
  session.stackState = stack;
  session.taskState = p1;
  await store.save(session);

  const reopened = await store.open(session.id, workspace);
  const result = await service.run({ session: reopened, prompts: prompts() });
  assert.equal(result.state.status, 'completed');
  assert.deepEqual(result.state.completedTaskOrdinals, [1, 2, 3]);
  assert.equal(result.state.tasks[0]?.taskState.validations.V1.attempts[0]?.callId, 'p1-v1');
  assert.equal(provider.requests.length, 2, 'only P2 and P3 invoke the provider after reopen');
  assert.match(taskHeader(result.state), /Stack: production-stack.*3\/3 tasks completed/);
  assert.match(renderTask(result.state, []), /P1 \(completed\).*P2 \(completed\).*P3 \(completed\)/s);
});

test('incomplete stack resume requires Phase 5 reconciliation before provider work', async (t) => {
  const { workspace, provider, service } = await fixture(t);
  const session = createSession({ workspace });
  session.interruptions = [{ kind: 'process', turnId: 'old', callId: 'process', name: 'run_process' }];
  await assert.rejects(service.run({ session, prompts: prompts() }), /recovery reconciliation/);
  assert.equal(provider.requests.length, 0);
});
