import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { WorkflowTimer, createCodingWorkflowApplicationService } from '../../../src/application/index.ts';
import { createSession, LocalSessionStore, type ApplicationEvent, type ApprovalDecision, type ApprovalPort, type ApprovalRequest, type ModelProvider, type ProviderEvent, type ProviderRequest, type ProviderStreamOptions } from '../../../src/core/index.ts';

class ScriptedProvider implements ModelProvider {
  calls = 0;
  readonly requests: ProviderRequest[] = [];
  private readonly rounds: readonly (readonly ProviderEvent[])[];
  constructor(rounds: readonly (readonly ProviderEvent[])[]) { this.rounds = rounds; }
  async *stream(request: ProviderRequest, _options: ProviderStreamOptions = {}): AsyncGenerator<ProviderEvent> {
    this.requests.push(request);
    yield* (this.rounds[this.calls++] ?? [{ type: 'provider.response.completed' }]);
  }
}

class Approval implements ApprovalPort {
  private readonly decisions: ApprovalDecision[];
  constructor(decisions: readonly ApprovalDecision[]) { this.decisions = [...decisions]; }
  async request(_request: ApprovalRequest): Promise<ApprovalDecision> { return this.decisions.shift() ?? 'deny'; }
}

async function fixture(git = true): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), 'george-workflow-'));
  await Promise.all([writeFile(join(root, 'BOOT.md'), 'boot'), writeFile(join(root, 'AGENTS.md'), 'agents')]);
  if (git) {
    execFileSync('git', ['init', '--quiet'], { cwd: root });
    execFileSync('git', ['add', '.'], { cwd: root });
    execFileSync('git', ['-c', 'user.name=George test', '-c', 'user.email=george@example.invalid', 'commit', '--quiet', '-m', 'fixture'], { cwd: root });
  }
  return root;
}

const hash = (text: string) => createHash('sha256').update(text).digest('hex');

test('coding workflow preserves dirty work, records direct mutations, and does not over-attribute process changes', async (t) => {
  const root = await fixture();
  const state = await mkdtemp(join(tmpdir(), 'george-workflow-state-'));
  t.after(() => Promise.all([rm(root, { recursive: true, force: true }), rm(state, { recursive: true, force: true })]));
  await writeFile(join(root, 'user-work.txt'), 'do not normalize');
  const provider = new ScriptedProvider([
    [
      { type: 'provider.response.started', responseId: 'one' },
      { type: 'provider.tool.call', callId: 'write', name: 'write_file', arguments: JSON.stringify({ path: 'george.txt', content: 'written' }) },
      { type: 'provider.tool.call', callId: 'process', name: 'run_process', arguments: JSON.stringify({ executable: 'node', arguments: ['-e', "require('node:fs').writeFileSync('process.txt','side effect')"] }) },
      { type: 'provider.response.completed' },
    ],
    [{ type: 'provider.text.delta', delta: 'Validation passed.' }, { type: 'provider.response.completed' }],
  ]);
  const workflow = await createCodingWorkflowApplicationService({ provider, workspace: root, approvalPort: new Approval(['allow_once', 'allow_once', 'allow_once']), sessionStore: new LocalSessionStore({ root: state }) });
  const session = createSession({ id: 'workflow', workspace: root });
  const completion = await workflow.run({
    session, input: 'Make the change.', turnId: 'turn-workflow',
    validations: [{ label: 'failing check', intent: 'prove failure is retained', executable: 'node', arguments: ['-e', 'process.exit(7)'] }],
  });

  assert.equal(await readFile(join(root, 'user-work.txt'), 'utf8'), 'do not normalize');
  assert.deepEqual(completion.changes, [
    { path: 'george.txt', relationship: 'newly-observed', directGeorgeMutation: true },
    { path: 'process.txt', relationship: 'newly-observed', directGeorgeMutation: false },
    { path: 'user-work.txt', relationship: 'pre-existing', directGeorgeMutation: false },
  ]);
  assert.deepEqual(completion.directMutations, [{ tool: 'write_file', path: 'george.txt', bytes: 7, sha256: hash('written') }]);
  const canonicalMutation = session.events.find((event) => event.type === 'tool.completed' && event.callId === 'write');
  assert.equal(canonicalMutation?.type === 'tool.completed' && canonicalMutation.result.ok && 'git' in (canonicalMutation.result.value as Record<string, unknown>), true);
  const providerMutation = provider.requests[1]?.continuation?.toolResults.find((result) => result.callId === 'write');
  assert.deepEqual(providerMutation, { callId: 'write', name: 'write_file', result: { ok: true, value: { name: 'write_file', path: 'george.txt', bytes: 7, sha256: hash('written') } } });
  assert.equal(completion.validations[0]?.status, 'failed');
  assert.ok(completion.validations[0]?.callId);
  assert.equal(completion.terminalState, 'failed');
  assert.equal(completion.finalAssistantResponse, 'Validation passed.');
  assert.match(provider.requests[0]?.instructions ?? '', /For a coding completion/);
  assert.deepEqual(session.transcript, [{ role: 'user', text: 'Make the change.' }, { role: 'assistant', text: 'Validation passed.' }]);
  assert.deepEqual(completion.warnings.filter((warning) => warning.includes('not persisted')), []);
  assert.ok(completion.warnings.some((warning) => warning.includes('not attributed')));
  const reopened = await new LocalSessionStore({ root: state }).open('workflow', root);
  const durable = reopened.events.find((event) => event.type === 'workflow.completed');
  assert.equal(durable?.type, 'workflow.completed');
  if (durable?.type === 'workflow.completed') assert.equal(durable.completion.validations[0]?.status, 'failed');
});

test('workflow completion takes only the final tool-free provider round', async (t) => {
  const root = await fixture();
  const state = await mkdtemp(join(tmpdir(), 'george-workflow-buffer-state-'));
  t.after(() => Promise.all([rm(root, { recursive: true, force: true }), rm(state, { recursive: true, force: true })]));
  const provider = new ScriptedProvider([
    [
      { type: 'provider.response.started', responseId: 'mixed' },
      { type: 'provider.text.delta', delta: 'Provisional answer' },
      { type: 'provider.tool.call', callId: 'read', name: 'read_file', arguments: '{"path":"BOOT.md"}' },
      { type: 'provider.response.completed' },
    ],
    [{ type: 'provider.text.delta', delta: 'Final answer' }, { type: 'provider.response.completed' }],
  ]);
  const workflow = await createCodingWorkflowApplicationService({ provider, workspace: root, sessionStore: new LocalSessionStore({ root: state }) });
  const session = createSession({ id: 'buffered-workflow', workspace: root });
  const completion = await workflow.run({ session, input: 'Inspect.' });
  assert.equal(completion.finalAssistantResponse, 'Final answer');
  assert.deepEqual(session.transcript, [{ role: 'user', text: 'Inspect.' }, { role: 'assistant', text: 'Final answer' }]);
  assert.deepEqual((await new LocalSessionStore({ root: state }).open('buffered-workflow', root)).transcript, session.transcript);
});

test('workflow completion accepts a successful bounded tool round without fabricated assistant text', async (t) => {
  const root = await fixture();
  t.after(() => rm(root, { recursive: true, force: true }));
  const provider = new ScriptedProvider([[
    { type: 'provider.response.started', responseId: 'inspect' },
    { type: 'provider.text.delta', delta: 'provisional' },
    { type: 'provider.tool.call', callId: 'read', name: 'read_file', arguments: '{"path":"BOOT.md"}' },
    { type: 'provider.response.completed' },
  ]]);
  const workflow = await createCodingWorkflowApplicationService({ provider, workspace: root });
  const session = createSession({ workspace: root });
  const completion = await workflow.run({ session, input: 'Inspect.', completeAfterSuccessfulToolRound: true });

  assert.equal(provider.calls, 1);
  assert.equal(completion.terminalState, 'completed');
  assert.equal(completion.finalAssistantResponse, '');
  assert.deepEqual(session.transcript, [{ role: 'user', text: 'Inspect.' }]);
  assert.equal(session.events.some((event) => event.type === 'workflow.completed' && event.completion.terminalState === 'completed'), true);
});

test('ordinary workflow runs still create independent budgets when none is supplied', async (t) => {
  const root = await fixture();
  t.after(() => rm(root, { recursive: true, force: true }));
  const workflow = await createCodingWorkflowApplicationService({ provider: new ScriptedProvider([[{ type: 'provider.response.completed' }], [{ type: 'provider.response.completed' }]]), workspace: root });
  const runIds: string[] = [];
  const observe = (event: ApplicationEvent) => { if (event.type === 'reliability.run.started') runIds.push(event.runId); };
  await workflow.run({ session: createSession({ workspace: root }), input: 'first ordinary turn', onEvent: observe });
  await workflow.run({ session: createSession({ workspace: root }), input: 'second ordinary turn', onEvent: observe });
  assert.equal(runIds.length, 2);
  assert.equal(new Set(runIds).size, 2);
});

test('workflow timing accumulates provider rounds and tools without entering canonical conversation', async (t) => {
  const root = await fixture();
  t.after(() => rm(root, { recursive: true, force: true }));
  let now = 0;
  const provider: ModelProvider = {
    calls: 0,
    async *stream(this: { calls: number }, _request: ProviderRequest): AsyncGenerator<ProviderEvent> {
      if (this.calls++ === 0) {
        now = 10; yield { type: 'provider.response.started', responseId: 'first' };
        now = 20; yield { type: 'provider.tool.call', callId: 'clock-tool', name: 'clock_tool', arguments: '{}' };
        now = 20; yield { type: 'provider.response.completed' };
      } else {
        now = 57; yield { type: 'provider.text.delta', delta: 'done' };
        now = 57; yield { type: 'provider.response.completed' };
      }
    },
  };
  const workflow = await createCodingWorkflowApplicationService({
    provider, workspace: root, clock: () => now,
    additionalTools: [{ name: 'clock_tool', description: 'Deterministic timing fixture.', inputSchema: { type: 'object', properties: {}, additionalProperties: false }, execution: { effect: 'local_read', replaySafety: 'replay_safe', source: { kind: 'builtin' } }, execute: async () => { now = 27; return {}; } }],
  });
  const session = createSession({ workspace: root });
  const completion = await workflow.run({ session, input: 'time this' });
  assert.deepEqual(completion.timing, { totalMs: 57, providerMs: 50, toolMs: 7, approvalMs: 0, otherMs: 0 });
  assert.equal(completion.timing!.providerMs + completion.timing!.toolMs + completion.timing!.approvalMs + completion.timing!.otherMs, completion.timing!.totalMs);
  assert.equal(session.transcript.at(-1)?.text, 'done');
  assert.doesNotMatch(JSON.stringify(session.transcript), /providerMs|toolMs|timing/);
  const work = session.events.filter((event): event is Extract<typeof event, { type: 'work.updated' }> => event.type === 'work.updated');
  assert.equal(work.find((event) => event.item.operationId === 'clock-tool' && event.item.status === 'succeeded')?.item.elapsedMs, 7);
});

test('workflow timing measures the union of overlapping tools, independent of completion order and batch metrics', () => {
  let now = 0;
  const timer = new WorkflowTimer(() => now);
  const observe = (at: number, event: ApplicationEvent) => { now = at; timer.observe(event); };
  const start = (callId: string): ApplicationEvent => ({ type: 'tool.started', turnId: 't', callId, name: 'read_file' });
  const done = (callId: string): ApplicationEvent => ({ type: 'tool.completed', turnId: 't', callId, name: 'read_file', result: { ok: true, value: {} } });
  observe(2, start('a'));
  observe(3, start('b'));
  observe(7, done('b'));
  observe(12, done('a'));
  observe(13, { type: 'tool.concurrent-read-batch.completed', turnId: 't', callIds: ['a', 'b'], width: 2, wallMs: 10, summedMemberMs: 14, observedOverlapMs: 999 });
  now = 15;
  assert.deepEqual(timer.finish(), { totalMs: 15, providerMs: 0, toolMs: 10, approvalMs: 0, otherMs: 5 });
});

test('workflow timing stays coherent across sequential tools, concurrent batches, retries, and active cancellation', () => {
  let now = 0;
  const timer = new WorkflowTimer(() => now);
  const observe = (at: number, event: ApplicationEvent) => { now = at; timer.observe(event); };
  const providerStart: ApplicationEvent = { type: 'provider.attempt.started', turnId: 't', runId: 'r', attemptId: 'p' };
  const start = (callId: string): ApplicationEvent => ({ type: 'tool.started', turnId: 't', callId, name: 'read_file' });
  const done = (callId: string): ApplicationEvent => ({ type: 'tool.completed', turnId: 't', callId, name: 'read_file', result: { ok: true, value: {} } });
  observe(0, providerStart);
  observe(10, { type: 'provider.response.completed' });
  observe(12, start('sequential'));
  observe(17, done('sequential'));
  observe(20, start('a'));
  observe(21, start('b'));
  observe(25, done('b'));
  observe(30, done('a'));
  observe(32, start('c'));
  observe(33, start('d'));
  observe(35, done('d'));
  observe(40, done('c'));
  observe(42, providerStart);
  observe(50, { type: 'provider.retry.scheduled', turnId: 't', runId: 'r', attemptId: 'p', retry: 1, delayMs: 2, category: 'provider' });
  observe(52, providerStart);
  observe(60, { type: 'provider.response.completed' });
  now = 62;
  assert.deepEqual(timer.finish(), { totalMs: 62, providerMs: 26, toolMs: 23, approvalMs: 0, otherMs: 13 });

  now = 0;
  const cancelled = new WorkflowTimer(() => now);
  cancelled.observe(start('a'));
  now = 7;
  cancelled.observe(start('b'));
  now = 10;
  cancelled.observe({ type: 'tool.failed', turnId: 't', callId: 'b', name: 'read_file', result: { ok: false, error: { code: 'cancelled', message: 'cancelled' } } });
  now = 12;
  assert.deepEqual(cancelled.finish(), { totalMs: 12, providerMs: 0, toolMs: 12, approvalMs: 0, otherMs: 0 });
  now = 20;
  assert.deepEqual(cancelled.finish(), { totalMs: 20, providerMs: 0, toolMs: 12, approvalMs: 0, otherMs: 8 });
});

test('workflow timing closes provider errors and gives approval its own elapsed interval', () => {
  let now = 0;
  const timer = new WorkflowTimer(() => now);
  const observe = (at: number, event: ApplicationEvent) => { now = at; timer.observe(event); };
  const request: ApprovalRequest = { id: 'approval', toolName: 'write_file', execution: { effect: 'workspace_mutation', replaySafety: 'not_replay_safe', source: { kind: 'builtin' } } };
  observe(0, { type: 'provider.attempt.started', turnId: 't', runId: 'r', attemptId: 'p' });
  observe(4, { type: 'provider.error', error: { code: 'provider', message: 'failed' } });
  observe(5, { type: 'tool.started', turnId: 't', callId: 'background', name: 'read_file' });
  observe(6, { type: 'approval.requested', turnId: 't', callId: 'approval', request });
  observe(11, { type: 'approval.allowed', turnId: 't', callId: 'approval', request });
  observe(12, { type: 'tool.started', turnId: 't', callId: 'write', name: 'write_file' });
  observe(13, { type: 'tool.completed', turnId: 't', callId: 'background', name: 'read_file', result: { ok: true, value: {} } });
  observe(17, { type: 'tool.failed', turnId: 't', callId: 'write', name: 'write_file', result: { ok: false, error: { code: 'tool', message: 'failed' } } });
  now = 20;
  assert.deepEqual(timer.finish(), { totalMs: 20, providerMs: 4, toolMs: 7, approvalMs: 5, otherMs: 4 });
});

test('out-of-order concurrent batches, validation, and later session saves retain durable timing', async (t) => {
  const root = await fixture();
  const state = await mkdtemp(join(tmpdir(), 'george-workflow-concurrent-state-'));
  t.after(() => Promise.all([rm(root, { recursive: true, force: true }), rm(state, { recursive: true, force: true })]));
  const ids = ['a', 'b', 'c', 'd', 'e', 'f'];
  const release = new Map<string, () => void>();
  const gates = new Map(ids.map((id) => [id, new Promise<void>((resolve) => { release.set(id, resolve); })]));
  const call = (id: string): ProviderEvent => ({ type: 'provider.tool.call', callId: id, name: 'gated_read', arguments: JSON.stringify({ id }) });
  const round = (roundIds: readonly string[]): readonly ProviderEvent[] => [
    { type: 'provider.response.started', responseId: roundIds[0]! }, ...roundIds.map(call), { type: 'provider.response.completed' },
  ];
  const provider = new ScriptedProvider([round(ids.slice(0, 3)), round(ids.slice(3)), [{ type: 'provider.response.completed' }]]);
  const store = new LocalSessionStore({ root: state });
  const workflow = await createCodingWorkflowApplicationService({
    provider, workspace: root, sessionStore: store, approvalPort: new Approval(['allow_once']),
    toolNames: ['gated_read', 'run_process'],
    additionalTools: [{
      name: 'gated_read', description: 'Controlled local read.',
      inputSchema: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'], additionalProperties: false },
      execution: { effect: 'local_read', replaySafety: 'replay_safe', source: { kind: 'builtin' } },
      execute: async (arguments_) => { const id = arguments_.id as string; await gates.get(id); return { id }; },
    }],
  });
  const session = createSession({ id: 'concurrent-workflow', workspace: root });
  const events: ApplicationEvent[] = [];
  const started: string[] = [];
  const completion = await workflow.run({
    session, input: 'Read in two batches.',
    validations: [{ label: 'process check', intent: 'verify later process timing', executable: 'node', arguments: ['-e', 'process.exit(0)'] }],
    onEvent: (event) => {
      events.push(event);
      if (event.type === 'tool.started') {
        started.push(event.callId);
        if (started.length === 3) release.get('b')?.();
        if (started.length === 6) release.get('e')?.();
      }
      if (event.type === 'tool.completed') {
        const next: Record<string, string> = { b: 'a', a: 'c', e: 'd', d: 'f' };
        release.get(next[event.callId] ?? '')?.();
      }
    },
  });
  assert.deepEqual(events.filter((event) => event.type === 'tool.completed' && event.name === 'gated_read').map((event) => event.callId), ['b', 'a', 'c', 'e', 'd', 'f']);
  assert.deepEqual(provider.requests[1]?.continuation?.toolResults.map((result) => result.callId), ['a', 'b', 'c']);
  assert.deepEqual(provider.requests[2]?.continuation?.toolResults.map((result) => result.callId), ['d', 'e', 'f']);
  assert.equal(events.filter((event) => event.type === 'tool.concurrent-read-batch.completed').length, 2);
  assert.equal(completion.validations[0]?.status, 'passed');
  assert.ok(completion.timing && completion.timing.providerMs + completion.timing.toolMs + completion.timing.approvalMs + completion.timing.otherMs <= completion.timing.totalMs + 2);
  const reopened = await store.open(session.id, root);
  const durable = reopened.events.findLast((event) => event.type === 'workflow.completed');
  assert.deepEqual(durable?.type === 'workflow.completed' ? durable.completion.timing : undefined, completion.timing);
  await store.save(reopened);
  assert.deepEqual((await store.open(session.id, root)).events.findLast((event) => event.type === 'workflow.completed'), durable);
  if (durable?.type !== 'workflow.completed') throw new Error('Expected durable workflow completion.');
  reopened.events.push({ ...durable, completion: { ...durable.completion, timing: { totalMs: 0, providerMs: 3, toolMs: 0, approvalMs: 0, otherMs: 0 } } });
  await assert.rejects(store.save(reopened), /workflow timing exceeds total time/);
  assert.deepEqual((await store.open(session.id, root)).events.findLast((event) => event.type === 'workflow.completed'), durable);
});

test('coding workflow captures clean and non-Git baselines without treating either as a mutation', async (t) => {
  const clean = await fixture();
  const nonGit = await fixture(false);
  t.after(() => Promise.all([rm(clean, { recursive: true, force: true }), rm(nonGit, { recursive: true, force: true })]));
  const completed = () => new ScriptedProvider([{ type: 'provider.response.completed' }]);
  const cleanWorkflow = await createCodingWorkflowApplicationService({ provider: completed(), workspace: clean });
  const cleanCompletion = await cleanWorkflow.run({ session: createSession({ workspace: clean }), input: 'Inspect.' });
  assert.equal(cleanCompletion.baseline?.isRepository, true);
  assert.deepEqual(cleanCompletion.changes, []);
  const nonGitWorkflow = await createCodingWorkflowApplicationService({ provider: completed(), workspace: nonGit });
  const nonGitCompletion = await nonGitWorkflow.run({ session: createSession({ workspace: nonGit }), input: 'Inspect.' });
  assert.equal(nonGitCompletion.baseline?.isRepository, false);
  assert.equal(nonGitCompletion.changes.length, 0);
  assert.ok(nonGitCompletion.warnings.some((warning) => warning.includes('outside a Git workspace')));
});

test('validation outcomes remain explicit through approval, timeout, and cancellation', async (t) => {
  const root = await fixture();
  t.after(() => rm(root, { recursive: true, force: true }));
  const request = { label: 'check', intent: 'explicit test validation', executable: 'node', arguments: ['-e', 'setInterval(() => {}, 1000)'], timeoutMs: 20 };
  const denied = await createCodingWorkflowApplicationService({ provider: new ScriptedProvider([{ type: 'provider.response.completed' }]), workspace: root, approvalPort: new Approval(['deny']) });
  const deniedCompletion = await denied.run({ session: createSession({ workspace: root }), input: 'Inspect.', validations: [request] });
  assert.equal(deniedCompletion.validations[0]?.status, 'denied');
  const timedOut = await createCodingWorkflowApplicationService({ provider: new ScriptedProvider([{ type: 'provider.response.completed' }]), workspace: root, approvalPort: new Approval(['allow_once']) });
  const timeoutCompletion = await timedOut.run({ session: createSession({ workspace: root }), input: 'Inspect.', validations: [request] });
  assert.equal(timeoutCompletion.validations[0]?.outcome, 'timed_out');
  assert.equal(timeoutCompletion.validations[0]?.status, 'failed');
  const controller = new AbortController();
  controller.abort();
  const cancelled = await createCodingWorkflowApplicationService({ provider: new ScriptedProvider([{ type: 'provider.response.completed' }]), workspace: root, approvalPort: new Approval(['allow_once']) });
  const cancelledCompletion = await cancelled.run({ session: createSession({ workspace: root }), input: 'Inspect.', signal: controller.signal, validations: [request] });
  assert.equal(cancelledCompletion.validations[0]?.status, 'cancelled');
  assert.equal(cancelledCompletion.terminalState, 'cancelled');
  assert.ok(cancelledCompletion.timing);
  assert.ok(cancelledCompletion.timing!.providerMs + cancelledCompletion.timing!.toolMs + cancelledCompletion.timing!.approvalMs + cancelledCompletion.timing!.otherMs <= cancelledCompletion.timing!.totalMs + 2);
});
