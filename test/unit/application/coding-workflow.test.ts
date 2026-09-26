import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { createCodingWorkflowApplicationService } from '../../../src/application/index.ts';
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
