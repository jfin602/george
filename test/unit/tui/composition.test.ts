import assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { CODING_WORKFLOW_GUIDANCE, createCodingWorkflowApplicationService } from '../../../src/application/index.ts';
import {
  CONTEXT_PROFILE_REGISTRY,
  LocalSessionStore,
  appendSessionEvent,
  classifySessionInterruptions,
  createSession,
  type ApprovalDecision,
  type ApprovalPort,
  type ApprovalRequest,
  type ModelProvider,
  type ProviderEvent,
  type ProviderRequest,
} from '../../../src/core/index.ts';
import { createTuiApplicationService } from '../../../src/tui/composition.ts';

class ScriptedProvider implements ModelProvider {
  readonly requests: ProviderRequest[] = [];
  private readonly rounds: readonly (readonly ProviderEvent[])[];
  constructor(rounds: readonly (readonly ProviderEvent[])[]) { this.rounds = rounds; }
  async *stream(request: ProviderRequest): AsyncGenerator<ProviderEvent> {
    this.requests.push(request);
    yield* this.rounds[this.requests.length - 1] ?? [];
  }
}

class Approval implements ApprovalPort {
  readonly requests: ApprovalRequest[] = [];
  async request(request: ApprovalRequest): Promise<ApprovalDecision> { this.requests.push(request); return 'allow_once'; }
}

const direct = (text: string): readonly ProviderEvent[] => [
  { type: 'provider.response.started', responseId: text },
  { type: 'provider.text.delta', delta: text },
  { type: 'provider.response.completed', usage: { inputTokens: 20, outputTokens: 2 } },
];

test('production TUI composes the base agent while explicit coding workflow keeps its guidance', async (t) => {
  const root = await mkdtemp(join(tmpdir(), 'george-tui-composition-'));
  const state = join(root, 'state');
  const workspace = join(root, 'workspace');
  await Promise.all([mkdir(state), mkdir(workspace)]);
  t.after(() => rm(root, { recursive: true, force: true }));
  const provider = new ScriptedProvider([direct('hello'), direct('implemented')]);
  const approvals = new Approval();
  const store = new LocalSessionStore({ root: state });
  const service = await createTuiApplicationService({
    provider, workspace, approvalPort: approvals, sessionStore: store,
    contextMode: 'fixed', contextProfile: CONTEXT_PROFILE_REGISTRY.medium,
  });
  const ordinary = createSession({ id: 'ordinary', workspace });
  const completion = await service.run({ session: ordinary, input: 'hi' });

  assert.equal(completion.finalAssistantResponse, 'hello');
  assert.equal(provider.requests.length, 1);
  assert.equal((provider.requests[0]?.instructions ?? '').includes(CODING_WORKFLOW_GUIDANCE), false);
  assert.deepEqual(['read_file', 'list_directory', 'search_text', 'git_status', 'git_diff', 'write_file', 'apply_patch', 'create_directory', 'run_process'].filter((name) => !provider.requests[0]?.tools?.some((tool) => tool.name === name)), []);
  assert.equal(ordinary.transcript.at(-1)?.text, 'hello');
  assert.equal((await store.open('ordinary', workspace)).transcript.at(-1)?.text, 'hello');
  assert.equal(ordinary.events.some((event) => event.type === 'context.assembled' && event.diagnostics.profileId === CONTEXT_PROFILE_REGISTRY.medium.id), true);
  assert.equal(approvals.requests.length, 0);

  const structured = createSession({ id: 'structured', workspace });
  await service.run({ session: structured, input: `GEORGE TASK FORMAT: 1

TASK: P1 — Composition
KIND: implementation

GOAL

Keep structured routing available.

REQUIREMENTS

- R1: Complete the work.

WORKFLOW

W1 — Complete
Covers: R1
Depends on: none

VALIDATION

V1 — Node is available
Covers: R1
Run: node --version

STOP CONDITIONS

- S1: Stop truthfully.
` });
  assert.equal(structured.taskState?.status, 'completed');
  assert.equal(provider.requests[1]?.tools?.some((tool) => tool.name === 'write_file'), true);
  assert.equal(approvals.requests.some((request) => request.toolName === 'run_process'), true);

  const cancellation = new AbortController();
  cancellation.abort('test cancellation');
  const cancelled = await service.run({ session: createSession({ workspace }), input: 'cancel me', signal: cancellation.signal });
  assert.equal(cancelled.terminalState, 'cancelled');
  assert.equal(provider.requests.length, 2, 'cancellation is enforced before another provider request');

  const explicitProvider = new ScriptedProvider([direct('done')]);
  const explicit = await createCodingWorkflowApplicationService({ provider: explicitProvider, workspace });
  await explicit.run({ session: createSession({ workspace }), input: 'Implement it.' });
  assert.equal((explicitProvider.requests[0]?.instructions ?? '').includes(CODING_WORKFLOW_GUIDANCE), true);
});

test('production TUI composition recovers and persists a resumed session before use', async (t) => {
  const root = await mkdtemp(join(tmpdir(), 'george-tui-composition-resume-'));
  const state = join(root, 'state');
  const workspace = join(root, 'workspace');
  await Promise.all([mkdir(state), mkdir(workspace)]);
  await mkdir(join(workspace, 'already-created'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const session = createSession({ id: 'resume', workspace });
  appendSessionEvent(session, { type: 'tool.requested', turnId: 'old', callId: 'mkdir', name: 'create_directory', arguments: '{"path":"already-created"}' });
  appendSessionEvent(session, { type: 'recovery.intent', turnId: 'old', callId: 'mkdir', intent: { name: 'create_directory', path: 'already-created' } });
  appendSessionEvent(session, { type: 'tool.started', turnId: 'old', callId: 'mkdir', name: 'create_directory' });
  session.interruptions = classifySessionInterruptions(session.events);
  const store = new LocalSessionStore({ root: state });
  const provider = new ScriptedProvider([]);

  await createTuiApplicationService({ provider, workspace, sessionStore: store, session });

  assert.equal(provider.requests.length, 0);
  assert.equal(session.interruptions.length, 0);
  const reopened = await store.open(session.id, workspace);
  assert.equal(reopened.interruptions.length, 0);
  assert.equal(reopened.events.some((event) => event.type === 'recovery.decision' && event.callId === 'mkdir' && event.outcome === 'confirmed_complete'), true);
});
