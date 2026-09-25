import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { StructuredTaskApplicationService, createCodingWorkflowApplicationService } from '../../../src/application/index.ts';
import { createSession, type ApplicationEvent, type ApprovalDecision, type ApprovalPort, type ApprovalRequest, type ModelProvider, type ProviderEvent, type ProviderRequest } from '../../../src/core/index.ts';
import { addressTaskWorkUnit, beginTaskCorrection, beginTaskWorkUnit, createTaskState, parseTaskPrompt, recordTaskValidationAttempt } from '../../../src/tasks/index.ts';

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

test('task permission expectations cannot elevate the configured execution ceiling', async (t) => {
  const root = await workspace();
  t.after(() => rm(root, { recursive: true, force: true }));
  const provider = new Provider([]);
  const workflow = await createCodingWorkflowApplicationService({
    provider, workspace: root,
    executionPolicy: { workspace: 'standard', outsideWorkspace: 'reject', network: 'ask', remoteMutation: 'ask', browserInteraction: 'ask', credentialsEnvironment: 'ask' },
  });
  const policy = workflow.agent.effectiveExecutionPolicy({ workspace: 'autonomous', outsideWorkspace: 'ask', network: 'ask', remoteMutation: 'ask' });
  assert.equal(policy.workspace, 'standard');
  assert.equal(policy.outsideWorkspace, 'reject');
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

test('failed validation is retained through a bounded normal-tool correction and safe resume', async (t) => {
  const root = await workspace();
  t.after(() => rm(root, { recursive: true, force: true }));
  const input = `GEORGE TASK FORMAT: 1

TASK: P5 — Correction
KIND: implementation

GOAL

Repair only the failed check.

REQUIREMENTS

- R1: The check passes after repair.

WORKFLOW

W1 — Repairable work
Covers: R1
Depends on: none

VALIDATION

V1 — Marker check
Covers: R1
Run: node -e "process.exit(require('node:fs').existsSync('fixed.txt') ? 0 : 1)"

STOP CONDITIONS

- S1: Stop truthfully.
`;
  const parsed = parseTaskPrompt(input);
  if (parsed.kind !== 'structured') throw new Error('Expected structured task.');
  let taskState = createTaskState({ sessionId: 'resume', workspace: root, definition: parsed.task });
  taskState = addressTaskWorkUnit(beginTaskWorkUnit(taskState, 'W1'), 'W1');
  taskState = recordTaskValidationAttempt(taskState, 'V1', { turnId: 'old', callId: 'old-check', status: 'failed', exitCode: 1, signal: null, outcome: 'failed' });
  taskState = beginTaskCorrection(taskState, 'V1');
  const provider = new Provider([
    [{ type: 'provider.response.started', responseId: 'repair' }, { type: 'provider.tool.call', callId: 'repair', name: 'write_file', arguments: '{"path":"fixed.txt","content":"fixed"}' }, { type: 'provider.response.completed' }],
    [{ type: 'provider.response.completed' }],
    [{ type: 'provider.response.completed' }],
  ]);
  const workflow = await createCodingWorkflowApplicationService({ provider, workspace: root, approvalPort: new Allow() });
  const session = createSession({ id: 'resume', workspace: root });
  session.taskState = taskState;
  await new StructuredTaskApplicationService(workflow.agent).run({ session, input, turnId: 'resume' });
  assert.equal(session.taskState?.status, 'completed');
  assert.deepEqual(session.taskState?.validations.V1?.attempts.map((attempt) => attempt.status), ['failed', 'passed']);
  assert.deepEqual(session.taskState?.corrections.map((correction) => correction.status), ['completed']);
});

test('structured convergence diagnostic boundary remains executable without repairing it', async (t) => {
  const root = await workspace();
  t.after(() => rm(root, { recursive: true, force: true }));
  await writeFile(join(root, 'target.txt'), 'INSPECTION_PAYLOAD_ONLY_9E7C');
  const input = `GEORGE TASK FORMAT: 1

TASK: P1 — Diagnostic
KIND: implementation

GOAL

Expose the current structured convergence boundary.

INSPECT

- diagnostic target

REQUIREMENTS

- R1: Observe the current boundary.

WORKFLOW

W1 — Diagnostic work
Covers: R1
Depends on: none

VALIDATION

V1 — Deliberate failure
Covers: R1
Run: node -e "process.stderr.write(['CORRECTION','DIAGNOSTIC','4B2A'].join('_')); process.exit(1)"

STOP CONDITIONS

- S1: Stop truthfully.
`;
  const provider = new Provider([
    [{ type: 'provider.response.started', responseId: 'inspect' }, { type: 'provider.tool.call', callId: 'inspect-read', name: 'read_file', arguments: '{"path":"target.txt"}' }, { type: 'provider.response.completed' }],
    [{ type: 'provider.response.completed' }],
    [{ type: 'provider.response.completed' }],
    [{ type: 'provider.response.completed' }],
    [{ type: 'provider.response.completed' }],
    [{ type: 'provider.response.completed' }],
  ]);
  const workflow = await createCodingWorkflowApplicationService({ provider, workspace: root, approvalPort: new Allow() });
  const session = createSession({ workspace: root });
  const events: ApplicationEvent[] = [];
  await new StructuredTaskApplicationService(workflow.agent, undefined, undefined, 1).run({ session, input, turnId: 'diagnostic', onEvent: (event) => { events.push(event); } });

  assert.equal(provider.requests[1]?.continuation?.toolResults[0]?.result.ok, true);
  assert.match(JSON.stringify(provider.requests[1]?.continuation), /INSPECTION_PAYLOAD_ONLY_9E7C/);
  assert.match(provider.requests[2]?.input ?? '', /inspection: diagnostic target \(read_file:inspect-read\)/);
  assert.doesNotMatch(JSON.stringify(provider.requests[2]), /INSPECTION_PAYLOAD_ONLY_9E7C/);

  const failedValidation = events.find((event) => event.type === 'workflow.completed' && event.completion.validations[0]?.status === 'failed');
  assert.ok(failedValidation?.type === 'workflow.completed');
  assert.match(failedValidation.completion.validations[0]?.stderr ?? '', /CORRECTION_DIAGNOSTIC_4B2A/);
  assert.match(provider.requests[4]?.input ?? '', /validation V1: failed \(1\)/);
  assert.doesNotMatch(JSON.stringify(provider.requests[4]), /CORRECTION_DIAGNOSTIC_4B2A/);
  assert.doesNotMatch(JSON.stringify(session.taskState), /CORRECTION_DIAGNOSTIC_4B2A/);

  for (const request of [provider.requests[3], provider.requests[5]]) {
    assert.match(request?.input ?? '', /Run no provider-owned validation\. George will execute V1\./);
    assert.equal(request?.tools.length, 0);
  }
  const runIds = events.filter((event): event is Extract<typeof event, { type: 'reliability.run.started' }> => event.type === 'reliability.run.started').map((event) => event.runId);
  assert.equal(runIds.length, 5);
  assert.equal(new Set(runIds).size, 5);
  assert.equal(session.taskState?.status, 'failed');
});
