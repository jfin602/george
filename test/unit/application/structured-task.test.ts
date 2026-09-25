import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { StructuredTaskApplicationService, createCodingWorkflowApplicationService } from '../../../src/application/index.ts';
import { createSession, type ApprovalDecision, type ApprovalPort, type ApprovalRequest, type ModelProvider, type ProviderEvent, type ProviderRequest } from '../../../src/core/index.ts';

class Provider implements ModelProvider {
  readonly requests: ProviderRequest[] = [];
  private readonly rounds: (readonly ProviderEvent[])[];
  constructor(rounds: readonly (readonly ProviderEvent[])[]) { this.rounds = [...rounds]; }
  async *stream(request: ProviderRequest): AsyncGenerator<ProviderEvent> { this.requests.push(request); yield* (this.rounds.shift() ?? [{ type: 'provider.response.completed' }]); }
}

class Allow implements ApprovalPort { async request(_request: ApprovalRequest): Promise<ApprovalDecision> { return 'allow_once'; } }

async function workspace(): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), 'george-structured-'));
  await Promise.all([writeFile(join(root, 'BOOT.md'), 'boot'), writeFile(join(root, 'AGENTS.md'), 'agents'), writeFile(join(root, 'target.txt'), 'target')]);
  return root;
}

const task = `GEORGE TASK FORMAT: 1

TASK: P3 — Structured
KIND: implementation

GOAL

Keep unrelated task material out of each provider turn.

READ FIRST

- REQUIRED: BOOT.md

INSPECT

- structured application service

REQUIREMENTS

- R1: First work is bounded.
- R2: UNRELATED_COMPLETED_LEDGER must not be injected into W1.

WORKFLOW

W1 — First work
Covers: R1
Depends on: none

W2 — Second work
Covers: R2
Depends on: W1

VALIDATION

V1 — First check
Covers: R1
Run: node --version

V2 — Second check
Covers: R2
Run: node --version

STOP CONDITIONS

- S1: Stop on validation failure.
`;

test('structured service preflights with local reads, progresses task state, and omits unrelated ledger text', async (t) => {
  const root = await workspace();
  t.after(() => rm(root, { recursive: true, force: true }));
  const provider = new Provider([
    [{ type: 'provider.response.started', responseId: 'inspect' }, { type: 'provider.tool.call', callId: 'read', name: 'read_file', arguments: '{"path":"target.txt"}' }, { type: 'provider.response.completed' }],
    [{ type: 'provider.text.delta', delta: 'inspected' }, { type: 'provider.response.completed' }],
    [{ type: 'provider.text.delta', delta: 'w1' }, { type: 'provider.response.completed' }],
    [{ type: 'provider.text.delta', delta: 'w2' }, { type: 'provider.response.completed' }],
    [{ type: 'provider.response.completed' }],
    [{ type: 'provider.response.completed' }],
  ]);
  const workflow = await createCodingWorkflowApplicationService({ provider, workspace: root, approvalPort: new Allow() });
  const service = new StructuredTaskApplicationService(workflow.agent);
  const session = createSession({ workspace: root });
  await service.run({ session, input: task, turnId: 'structured' });
  assert.equal(session.taskState?.status, 'completed');
  assert.equal(session.taskState?.requirements.R1, 'verified');
  assert.equal(session.taskState?.validations.V1?.status, 'passed');
  assert.ok(provider.requests[0]?.tools.every((tool) => ['read_file', 'list_directory', 'search_text', 'git_status', 'git_diff'].includes(tool.name)));
  assert.match(provider.requests[0]?.input ?? '', /W1 — First work/);
  assert.doesNotMatch(provider.requests[0]?.input ?? '', /UNRELATED_COMPLETED_LEDGER/);
  assert.doesNotMatch(provider.requests[0]?.input ?? '', /W2 — Second work/);
  assert.match(provider.requests[3]?.input ?? '', /W2 — Second work/);
  assert.doesNotMatch(provider.requests[3]?.input ?? '', /W1 — First work|First work is bounded/);
});

test('invalid marked tasks fail closed while ordinary chat keeps the inherited workflow', async (t) => {
  const root = await workspace();
  t.after(() => rm(root, { recursive: true, force: true }));
  const provider = new Provider([[{ type: 'provider.response.completed' }]]);
  const workflow = await createCodingWorkflowApplicationService({ provider, workspace: root });
  const service = new StructuredTaskApplicationService(workflow.agent);
  await assert.rejects(service.run({ session: createSession({ workspace: root }), input: 'GEORGE TASK FORMAT: 1\n\nTASK: broken' }), /Missing required section/);
  assert.equal(provider.requests.length, 0);
  await service.run({ session: createSession({ workspace: root }), input: 'ordinary chat' });
  assert.equal(provider.requests.length, 1);
});

test('DISCOVER validation accepts only an explicit executable/argv proposal and runs it through George', async (t) => {
  const root = await workspace();
  t.after(() => rm(root, { recursive: true, force: true }));
  const provider = new Provider([
    [{ type: 'provider.response.started', responseId: 'inspect' }, { type: 'provider.tool.call', callId: 'read', name: 'read_file', arguments: '{"path":"target.txt"}' }, { type: 'provider.response.completed' }],
    [{ type: 'provider.response.completed' }],
    [{ type: 'provider.response.completed' }],
    [{ type: 'provider.response.completed' }],
    [{ type: 'provider.text.delta', delta: '{"executable":"node","arguments":["--version"]}' }, { type: 'provider.response.completed' }],
    [{ type: 'provider.response.completed' }],
    [{ type: 'provider.response.completed' }],
  ]);
  const workflow = await createCodingWorkflowApplicationService({ provider, workspace: root, approvalPort: new Allow() });
  const service = new StructuredTaskApplicationService(workflow.agent);
  const input = task.replace('Run: node --version\n\nV2 — Second check\nCovers: R2\nRun: node --version', 'Run: DISCOVER\nScope: focused local check for first work\n\nV2 — Second check\nCovers: R2\nRun: node --version');
  await service.run({ session: createSession({ workspace: root }), input });
  assert.match(provider.requests[4]?.input ?? '', /focused local check/);
});
