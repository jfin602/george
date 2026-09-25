import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { StructuredTaskApplicationService, createCodingWorkflowApplicationService } from '../../../src/application/index.ts';
import { createSession, DEFAULT_RUN_BUDGET, RunBudget, type ApplicationEvent, type ApprovalDecision, type ApprovalPort, type ApprovalRequest, type ModelProvider, type ProviderEvent, type ProviderRequest } from '../../../src/core/index.ts';
import { addressTaskWorkUnit, beginTaskCorrection, beginTaskWorkUnit, createTaskState, parseTaskPrompt, recordTaskInspection, recordTaskValidationAttempt } from '../../../src/tasks/index.ts';

class Provider implements ModelProvider {
  readonly requests: ProviderRequest[] = [];
  private readonly rounds: (readonly ProviderEvent[])[];
  constructor(rounds: readonly (readonly ProviderEvent[])[]) { this.rounds = [...rounds]; }
  async *stream(request: ProviderRequest): AsyncGenerator<ProviderEvent> { this.requests.push(request); yield* (this.rounds.shift() ?? [{ type: 'provider.response.completed' }]); }
}

class Allow implements ApprovalPort { async request(_request: ApprovalRequest): Promise<ApprovalDecision> { return 'allow_once'; } }

class RecordingApproval implements ApprovalPort {
  readonly requests: ApprovalRequest[] = [];
  async request(request: ApprovalRequest): Promise<ApprovalDecision> { this.requests.push(request); return 'allow_once'; }
}

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

const singleWorkTask = (title: string) => `GEORGE TASK FORMAT: 1

TASK: P3 — ${title}
KIND: implementation

GOAL

Complete one bounded work unit.

REQUIREMENTS

- R1: Work is complete.

WORKFLOW

W1 — Work
Covers: R1
Depends on: none

VALIDATION

V1 — Node check
Covers: R1
Run: node --version

STOP CONDITIONS

- S1: Stop truthfully.
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
  const events: ApplicationEvent[] = [];
  await service.run({ session: createSession({ workspace: root }), input, budget: new RunBudget('discover-task-wide'), onEvent: (event) => { events.push(event); } });
  assert.match(provider.requests[4]?.input ?? '', /focused local check/);
  assert.equal(provider.requests.length, 5);
  assert.equal(events.filter((event) => event.type === 'validation.started').length, 2);
  assert.deepEqual([...new Set(events.filter((event): event is Extract<ApplicationEvent, { type: 'reliability.run.started' }> => event.type === 'reliability.run.started').map((event) => event.runId))], ['discover-task-wide']);
});

test('literal validation skips provider orchestration and retains canonical process, approval, budget, and events', async (t) => {
  const root = await workspace();
  t.after(() => rm(root, { recursive: true, force: true }));
  const input = singleWorkTask('Direct validation');
  const provider = new Provider([[{ type: 'provider.response.completed' }]]);
  const approval = new RecordingApproval();
  const workflow = await createCodingWorkflowApplicationService({ provider, workspace: root, approvalPort: approval });
  const events: ApplicationEvent[] = [];
  const budget = new RunBudget('direct-validation');
  const session = createSession({ workspace: root });
  await new StructuredTaskApplicationService(workflow.agent).run({ session, input, budget, onEvent: (event) => { events.push(event); } });

  assert.equal(provider.requests.length, 1);
  assert.equal(approval.requests.length, 1);
  assert.equal(approval.requests[0]?.toolName, 'run_process');
  assert.deepEqual(events.filter((event) => event.type === 'validation.started' || event.type === 'tool.requested' || event.type === 'tool.started' || event.type === 'tool.completed' || event.type === 'validation.completed').map((event) => event.type), [
    'validation.started', 'tool.requested', 'tool.started', 'tool.completed', 'validation.completed',
  ]);
  assert.ok(events.some((event) => event.type === 'budget.state' && event.runId === 'direct-validation' && event.budget.consumed.processExecutions === 1));
  assert.equal(session.taskState?.validations.V1?.status, 'passed');
});

test('direct validation budget exhaustion terminates the structured task without correction', async (t) => {
  const root = await workspace();
  t.after(() => rm(root, { recursive: true, force: true }));
  const input = singleWorkTask('Validation budget');
  const provider = new Provider([[{ type: 'provider.response.completed' }]]);
  const workflow = await createCodingWorkflowApplicationService({ provider, workspace: root, approvalPort: new Allow() });
  const budget = new RunBudget('validation-exhausted');
  budget.consume('processExecutions', DEFAULT_RUN_BUDGET.processExecutions);
  const session = createSession({ workspace: root });
  const completion = await new StructuredTaskApplicationService(workflow.agent).run({ session, input, budget });

  assert.equal(provider.requests.length, 1);
  assert.equal(completion.terminalState, 'budget_exhausted');
  assert.equal(session.taskState?.status, 'budget_exhausted');
  assert.equal(session.taskState?.corrections.length, 0);
  assert.equal(session.taskState?.validations.V1?.attempts[0]?.error?.code, 'budget');
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
  taskState = recordTaskValidationAttempt(taskState, 'V1', { turnId: 'old', callId: 'old-check', status: 'failed', exitCode: 1, signal: null, outcome: 'failed', stderr: 'old diagnostic' });
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
  assert.equal(session.taskState?.validations.V1?.attempts[0]?.stderr, 'old diagnostic');
  assert.deepEqual(session.taskState?.corrections.map((correction) => correction.status), ['completed']);
});

test('structured stages carry bounded safe evidence and share one task-wide budget', async (t) => {
  const root = await workspace();
  t.after(() => rm(root, { recursive: true, force: true }));
  await writeFile(join(root, 'target.txt'), `INSPECTION_PAYLOAD_ONLY_9E7C\nAPI_TOKEN=RAW_INSPECTION_SECRET\n${'x'.repeat(3000)}`);
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
  const budget = new RunBudget('task-wide-test');
  await new StructuredTaskApplicationService(workflow.agent, undefined, undefined, 1).run({ session, input, turnId: 'diagnostic', budget, onEvent: (event) => { events.push(event); } });

  assert.equal(provider.requests[1]?.continuation?.toolResults[0]?.result.ok, true);
  assert.match(JSON.stringify(provider.requests[1]?.continuation), /INSPECTION_PAYLOAD_ONLY_9E7C/);
  assert.match(provider.requests[2]?.input ?? '', /inspection result read_file:inspect-read/);
  assert.match(JSON.stringify(provider.requests[2]), /INSPECTION_PAYLOAD_ONLY_9E7C/);
  assert.match(JSON.stringify(provider.requests[2]), /API_TOKEN=\[redacted\]/);
  assert.doesNotMatch(JSON.stringify(provider.requests[2]), /RAW_INSPECTION_SECRET/);
  assert.match(provider.requests[2]?.input ?? '', /"truncated":true/);

  const failedValidation = events.find((event) => event.type === 'workflow.completed' && event.completion.validations[0]?.status === 'failed');
  assert.ok(failedValidation?.type === 'workflow.completed');
  assert.match(failedValidation.completion.validations[0]?.stderr ?? '', /CORRECTION_DIAGNOSTIC_4B2A/);
  assert.match(provider.requests[3]?.input ?? '', /validation V1: failed outcome=failed exit=1/);
  assert.match(JSON.stringify(provider.requests[3]), /CORRECTION_DIAGNOSTIC_4B2A/);
  assert.match(JSON.stringify(session.taskState), /CORRECTION_DIAGNOSTIC_4B2A/);

  assert.equal(provider.requests.length, 4);
  const runIds = events.filter((event): event is Extract<typeof event, { type: 'reliability.run.started' }> => event.type === 'reliability.run.started').map((event) => event.runId);
  assert.equal(runIds.length, 3);
  assert.deepEqual([...new Set(runIds)], ['task-wide-test']);
  assert.equal(session.taskState?.status, 'failed');
});

test('structured duplicate local reads execute once and terminate truthfully before inherited limits', async (t) => {
  const root = await workspace();
  t.after(() => rm(root, { recursive: true, force: true }));
  const input = singleWorkTask('Duplicate guard');
  const provider = new Provider([
    [{ type: 'provider.response.started', responseId: 'one' }, { type: 'provider.tool.call', callId: 'read-1', name: 'search_text', arguments: '{"query":"target","path":"."}' }, { type: 'provider.response.completed' }],
    [{ type: 'provider.response.started', responseId: 'two' }, { type: 'provider.tool.call', callId: 'read-2', name: 'search_text', arguments: '{"path":".","query":"target"}' }, { type: 'provider.response.completed' }],
    [{ type: 'provider.response.started', responseId: 'three' }, { type: 'provider.tool.call', callId: 'read-3', name: 'search_text', arguments: '{"query":"target","path":"."}' }, { type: 'provider.response.completed' }],
  ]);
  const workflow = await createCodingWorkflowApplicationService({ provider, workspace: root });
  const session = createSession({ workspace: root });
  const events: ApplicationEvent[] = [];
  const completion = await new StructuredTaskApplicationService(workflow.agent).run({ session, input, onEvent: (event) => { events.push(event); } });

  assert.equal(events.filter((event) => event.type === 'tool.started' && event.name === 'search_text').length, 1);
  assert.equal(events.filter((event) => event.type === 'tool.failed' && /Equivalent unchanged/.test(event.result.error.message)).length, 2);
  assert.equal(provider.requests.length, 3);
  assert.equal(completion.terminalState, 'budget_exhausted');
  assert.equal(session.taskState?.status, 'budget_exhausted');
  assert.match(session.taskState?.blockers.at(-1) ?? '', /did not complete/);
});

test('successful workspace mutation advances the structured read epoch', async (t) => {
  const root = await workspace();
  t.after(() => rm(root, { recursive: true, force: true }));
  const input = singleWorkTask('Mutation epoch');
  const provider = new Provider([
    [{ type: 'provider.response.started', responseId: 'one' }, { type: 'provider.tool.call', callId: 'read-before', name: 'read_file', arguments: '{"path":"target.txt"}' }, { type: 'provider.response.completed' }],
    [{ type: 'provider.response.started', responseId: 'two' }, { type: 'provider.tool.call', callId: 'write', name: 'write_file', arguments: '{"path":"new.txt","content":"new"}' }, { type: 'provider.response.completed' }],
    [{ type: 'provider.response.started', responseId: 'three' }, { type: 'provider.tool.call', callId: 'read-after', name: 'read_file', arguments: '{"path":"target.txt"}' }, { type: 'provider.response.completed' }],
    [{ type: 'provider.response.completed' }],
  ]);
  const workflow = await createCodingWorkflowApplicationService({ provider, workspace: root, approvalPort: new Allow() });
  const session = createSession({ workspace: root });
  const events: ApplicationEvent[] = [];
  await new StructuredTaskApplicationService(workflow.agent).run({ session, input, onEvent: (event) => { events.push(event); } });

  assert.deepEqual(events.filter((event) => event.type === 'tool.started' && event.name !== 'run_process').map((event) => event.callId), ['read-before', 'write', 'read-after']);
  assert.equal(events.filter((event) => event.type === 'tool.started' && event.name === 'run_process').length, 1);
  assert.equal(events.some((event) => event.type === 'tool.failed' && /Equivalent unchanged/.test(event.result.error.message)), false);
  assert.equal(session.taskState?.status, 'completed');
});

test('structured stage tool ceiling reduces execution without changing ordinary loop defaults', async (t) => {
  const root = await workspace();
  t.after(() => rm(root, { recursive: true, force: true }));
  const calls = Array.from({ length: 9 }, (_, index) => ({ type: 'provider.tool.call' as const, callId: `read-${index}`, name: 'read_file', arguments: JSON.stringify({ path: `missing-${index}.txt` }) }));
  const round = [{ type: 'provider.response.started' as const, responseId: 'many' }, ...calls, { type: 'provider.response.completed' as const }];
  const input = singleWorkTask('Stage ceiling');
  const structuredProvider = new Provider([round]);
  const structuredWorkflow = await createCodingWorkflowApplicationService({ provider: structuredProvider, workspace: root });
  const structuredSession = createSession({ workspace: root });
  const structuredEvents: ApplicationEvent[] = [];
  await new StructuredTaskApplicationService(structuredWorkflow.agent).run({ session: structuredSession, input, onEvent: (event) => { structuredEvents.push(event); } });
  assert.equal(structuredEvents.filter((event) => event.type === 'tool.started').length, 8);
  assert.equal(structuredSession.taskState?.status, 'budget_exhausted');

  const ordinaryProvider = new Provider([round, [{ type: 'provider.response.completed' }]]);
  const ordinary = await createCodingWorkflowApplicationService({ provider: ordinaryProvider, workspace: root });
  const ordinaryCompletion = await ordinary.run({ session: createSession({ workspace: root }), input: 'Read these paths.' });
  assert.equal(ordinaryCompletion.terminalState, 'completed');
  assert.equal(ordinaryProvider.requests.length, 2);
});

test('workspace mutation invalidates inspection evidence before the next work unit', async (t) => {
  const root = await workspace();
  t.after(() => rm(root, { recursive: true, force: true }));
  await writeFile(join(root, 'target.txt'), 'STALE_STAGE_EVIDENCE');
  const input = `GEORGE TASK FORMAT: 1

TASK: P2 — Mutation invalidation
KIND: implementation

GOAL

Reinspect after mutation.

INSPECT

- target

REQUIREMENTS

- R1: First work mutates the target.
- R2: Second work sees current evidence.

WORKFLOW

W1 — Mutate
Covers: R1
Depends on: none

W2 — Continue
Covers: R2
Depends on: W1

VALIDATION

V1 — Check
Covers: R1, R2
Run: node --version

STOP CONDITIONS

- S1: Stop truthfully.
`;
  const provider = new Provider([
    [{ type: 'provider.response.started', responseId: 'inspect-old' }, { type: 'provider.tool.call', callId: 'read-old', name: 'read_file', arguments: '{"path":"target.txt"}' }, { type: 'provider.response.completed' }],
    [{ type: 'provider.response.completed' }],
    [{ type: 'provider.response.started', responseId: 'mutate' }, { type: 'provider.tool.call', callId: 'write-new', name: 'write_file', arguments: '{"path":"new.txt","content":"CURRENT_STAGE_EVIDENCE"}' }, { type: 'provider.response.completed' }],
    [{ type: 'provider.response.completed' }],
    [{ type: 'provider.response.started', responseId: 'inspect-new' }, { type: 'provider.tool.call', callId: 'read-new', name: 'read_file', arguments: '{"path":"new.txt"}' }, { type: 'provider.response.completed' }],
    [{ type: 'provider.response.completed' }],
    [{ type: 'provider.response.completed' }],
    [{ type: 'provider.response.completed' }],
  ]);
  const workflow = await createCodingWorkflowApplicationService({ provider, workspace: root, approvalPort: new Allow() });
  await new StructuredTaskApplicationService(workflow.agent).run({ session: createSession({ workspace: root }), input });

  assert.match(provider.requests[4]?.input ?? '', /Structured task inspection stage/);
  assert.doesNotMatch(provider.requests[4]?.input ?? '', /STALE_STAGE_EVIDENCE/);
  assert.match(provider.requests[6]?.input ?? '', /CURRENT_STAGE_EVIDENCE/);
  assert.doesNotMatch(provider.requests[6]?.input ?? '', /STALE_STAGE_EVIDENCE/);
});

test('reopened structured work without ephemeral evidence re-inspects', async (t) => {
  const root = await workspace();
  t.after(() => rm(root, { recursive: true, force: true }));
  await writeFile(join(root, 'target.txt'), 'REOPENED_CURRENT_EVIDENCE');
  const input = `GEORGE TASK FORMAT: 1

TASK: P4 — Reopen
KIND: implementation

GOAL

Resume with current inspection evidence.

INSPECT

- target

REQUIREMENTS

- R1: Work resumes safely.

WORKFLOW

W1 — Resume
Covers: R1
Depends on: none

VALIDATION

V1 — Check
Covers: R1
Run: node --version

STOP CONDITIONS

- S1: Stop truthfully.
`;
  const parsed = parseTaskPrompt(input);
  if (parsed.kind !== 'structured') throw new Error('Expected structured task.');
  const session = createSession({ id: 'reopened', workspace: root });
  session.taskState = recordTaskInspection(beginTaskWorkUnit(createTaskState({ sessionId: session.id, workspace: root, definition: parsed.task }), 'W1'), { item: 'target', source: 'read_file:before-reopen' });
  const provider = new Provider([
    [{ type: 'provider.response.started', responseId: 'reinspect' }, { type: 'provider.tool.call', callId: 'read-current', name: 'read_file', arguments: '{"path":"target.txt"}' }, { type: 'provider.response.completed' }],
    [{ type: 'provider.response.completed' }],
    [{ type: 'provider.response.completed' }],
    [{ type: 'provider.response.completed' }],
  ]);
  const workflow = await createCodingWorkflowApplicationService({ provider, workspace: root, approvalPort: new Allow() });
  await new StructuredTaskApplicationService(workflow.agent).run({ session, input });

  assert.match(provider.requests[0]?.input ?? '', /Structured task inspection stage/);
  assert.match(provider.requests[2]?.input ?? '', /REOPENED_CURRENT_EVIDENCE/);
});
