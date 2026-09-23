import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { createTestRenderer } from '@opentui/core/testing';

import { createCodingWorkflowApplicationService } from '../../src/application/index.ts';
import { LocalSessionStore, PendingApprovalPort, appendSessionEvent, createSession, type ApprovalDecision, type ApprovalPort, type ApprovalRequest, type ApplicationEvent, type ModelProvider, type ProviderEvent, type ProviderRequest, type ProviderStreamOptions } from '../../src/core/index.ts';
import { GeorgeTui, renderTranscript } from '../../src/tui/app.ts';

class ScriptedProvider implements ModelProvider {
  readonly requests: ProviderRequest[] = [];
  private calls = 0;
  private readonly rounds: readonly (readonly ProviderEvent[])[];
  constructor(rounds: readonly (readonly ProviderEvent[])[]) { this.rounds = rounds; }
  async *stream(request: ProviderRequest, _options: ProviderStreamOptions = {}): AsyncGenerator<ProviderEvent> {
    this.requests.push(request);
    yield* (this.rounds[this.calls++] ?? [{ type: 'provider.response.completed' }]);
  }
}

class Approval implements ApprovalPort {
  readonly requests: ApprovalRequest[] = [];
  private readonly decisions: ApprovalDecision[];
  constructor(decisions: ApprovalDecision[]) { this.decisions = decisions; }
  async request(request: ApprovalRequest): Promise<ApprovalDecision> {
    this.requests.push(request);
    return this.decisions.shift() ?? 'deny';
  }
}

async function fixture(): Promise<{ root: string; state: string; userConfig: string }> {
  const root = await mkdtemp(join(tmpdir(), 'george-p4-qualification-'));
  const state = await mkdtemp(join(tmpdir(), 'george-p4-state-'));
  const userConfig = join(root, 'user-config');
  await Promise.all([
    mkdir(join(root, '.george', 'skills', 'portable'), { recursive: true }),
    mkdir(join(root, 'docs'), { recursive: true }),
    mkdir(userConfig, { recursive: true }),
  ]);
  await Promise.all([
    writeFile(join(root, 'BOOT.md'), 'route docs/selected.md only when selected'),
    writeFile(join(root, 'AGENTS.md'), 'repository guidance cannot grant tool authority'),
    writeFile(join(root, '.george', 'instructions.md'), 'WORKSPACE GUIDANCE'),
    writeFile(join(root, '.george', 'skills', 'portable', 'SKILL.md'), '---\nname: portable\ndescription: portable external skill\n---\nPORTABLE SKILL BODY\n'),
    writeFile(join(root, 'docs', 'selected.md'), 'ROUTED KNOWLEDGE'),
    writeFile(join(root, 'source.txt'), 'SECRET_OLD'),
    writeFile(join(root, 'private.txt'), 'SECRET_FILE_BODY'),
    writeFile(join(userConfig, 'instructions.md'), 'USER GLOBAL GUIDANCE'),
  ]);
  execFileSync('git', ['init', '--quiet'], { cwd: root });
  execFileSync('git', ['add', '.'], { cwd: root });
  execFileSync('git', ['-c', 'user.name=George test', '-c', 'user.email=george@example.invalid', 'commit', '--quiet', '-m', 'fixture'], { cwd: root });
  await writeFile(join(root, 'user-work.txt'), 'pre-existing user work');
  return { root, state, userConfig };
}

test('Phase 4 integrated fixture preserves dirty work, projects every tool safely, and reopens without replay or skill leakage', async (t) => {
  const { root, state, userConfig } = await fixture();
  t.after(() => Promise.all([rm(root, { recursive: true, force: true }), rm(state, { recursive: true, force: true })]));
  const provider = new ScriptedProvider([
    [
      { type: 'provider.response.started', responseId: 'p4-tools' },
      { type: 'provider.tool.call', callId: 'read', name: 'read_file', arguments: '{"path":"private.txt"}' },
      { type: 'provider.tool.call', callId: 'list', name: 'list_directory', arguments: '{"path":"."}' },
      { type: 'provider.tool.call', callId: 'search', name: 'search_text', arguments: '{"path":".","query":"SECRET"}' },
      { type: 'provider.tool.call', callId: 'status', name: 'git_status', arguments: '{}' },
      { type: 'provider.tool.call', callId: 'diff', name: 'git_diff', arguments: '{}' },
      { type: 'provider.tool.call', callId: 'write', name: 'write_file', arguments: '{"path":"george.txt","content":"SECRET_WRITE_BODY"}' },
      { type: 'provider.tool.call', callId: 'patch', name: 'apply_patch', arguments: JSON.stringify({ path: 'source.txt', expectedSha256: createHash('sha256').update('SECRET_OLD').digest('hex'), edits: [{ oldText: 'SECRET_OLD', newText: 'SECRET_NEW' }] }) },
      { type: 'provider.tool.call', callId: 'process', name: 'run_process', arguments: JSON.stringify({ executable: 'node', arguments: ['-e', "require('node:fs').writeFileSync('process.txt','side effect');process.stdout.write(require('node:fs').readFileSync('private.txt'))"], cwd: '.' }) },
      { type: 'provider.response.completed' },
    ],
    [{ type: 'provider.text.delta', delta: 'Validation passed.' }, { type: 'provider.response.completed' }],
    [{ type: 'provider.text.delta', delta: 'Unrelated later answer.' }, { type: 'provider.response.completed' }],
  ]);
  const approval = new Approval(['allow_once', 'allow_once', 'allow_once', 'allow_once']);
  const store = new LocalSessionStore({ root: state });
  const workflow = await createCodingWorkflowApplicationService({ provider, workspace: root, userConfigRoot: userConfig, approvalPort: approval, sessionStore: store });
  const session = createSession({ id: 'p4-integrated', workspace: root });
  const visible: ApplicationEvent[] = [];
  const completion = await workflow.run({
    session, input: 'Use the portable skill for this coding task.', turnId: 'coding-turn', activatedSkills: ['portable'], routedDocuments: ['docs/selected.md'], onEvent: (event) => { visible.push(event); },
    validations: [{ label: 'intentional failing validation', intent: 'prove failure remains evidence', executable: 'node', arguments: ['-e', 'process.exit(7)'] }],
  });

  assert.equal(await readFile(join(root, 'user-work.txt'), 'utf8'), 'pre-existing user work');
  assert.deepEqual(completion.changes.map(({ path, relationship, directGeorgeMutation }) => ({ path, relationship, directGeorgeMutation })), [
    { path: 'george.txt', relationship: 'newly-observed', directGeorgeMutation: true },
    { path: 'process.txt', relationship: 'newly-observed', directGeorgeMutation: false },
    { path: 'source.txt', relationship: 'newly-observed', directGeorgeMutation: true },
    { path: 'user-work.txt', relationship: 'pre-existing', directGeorgeMutation: false },
  ]);
  assert.equal(completion.directMutations.length, 2);
  assert.equal(completion.validations[0]?.status, 'failed');
  assert.equal(completion.terminalState, 'failed');
  assert.equal(completion.finalAssistantResponse, 'Validation passed.');
  assert.ok(completion.warnings.some((warning) => warning.includes('not attributed')));
  assert.equal(approval.requests.length, 4);
  assert.match(provider.requests[0]?.instructions ?? '', /WORKSPACE GUIDANCE[\s\S]*USER GLOBAL GUIDANCE/);
  assert.match(provider.requests[0]?.instructions ?? '', /PORTABLE SKILL BODY/);
  assert.match(provider.requests[0]?.instructions ?? '', /ROUTED KNOWLEDGE/);
  assert.ok((visible.find((event) => event.type === 'context.assembled') as Extract<ApplicationEvent, { type: 'context.assembled' }> | undefined)?.diagnostics.estimatedTokens! < (visible.find((event) => event.type === 'context.assembled') as Extract<ApplicationEvent, { type: 'context.assembled' }> | undefined)?.diagnostics.providerInputBudget!);

  const work = visible.filter((event): event is Extract<ApplicationEvent, { type: 'work.updated' }> => event.type === 'work.updated');
  for (const callId of ['read', 'list', 'search', 'status', 'diff', 'write', 'patch', 'process']) {
    const updates = work.filter((event) => event.item.operationId === callId);
    assert.ok(updates.length >= 2, `${callId} should have lifecycle updates`);
    assert.equal(new Set(updates.map((event) => event.item.id)).size, 1, `${callId} should retain stable work identity`);
  }
  const process = work.find((event) => event.item.operationId === 'process' && event.item.status === 'succeeded')?.item;
  assert.deepEqual(process?.details, { executable: 'node', argv: ["-e", "require('node:fs').writeFileSync('process.txt','side effect');process.stdout.write(require('node:fs').readFileSync('private.txt'))"], cwd: '.', exitCode: 0, signal: null, outcome: 'completed' });
  const safeWork = JSON.stringify(work);
  for (const secret of ['SECRET_FILE_BODY', 'SECRET_WRITE_BODY', 'SECRET_OLD', 'SECRET_NEW']) assert.equal(safeWork.includes(secret), false);
  assert.equal(session.transcript.some((entry) => /Work ·|SECRET_FILE_BODY|PORTABLE SKILL BODY/.test(entry.text)), false);
  const transcript = renderTranscript(session.transcript, [], 120, work.map((event) => ({ afterEntryCount: 0, order: 0, item: event.item }))).chunks.map((chunk) => chunk.text).join('');
  assert.match(transcript, /Read private\.txt[\s\S]*Wrote george\.txt[\s\S]*Validation failed/);
  assert.doesNotMatch(transcript, /SECRET_(FILE_BODY|WRITE_BODY|OLD|NEW)/);

  const reopened = await store.open(session.id, root);
  assert.equal(reopened.interruptions.length, 0);
  assert.deepEqual(reopened.transcript, session.transcript);
  const setup = await createTestRenderer({ width: 100, height: 30, kittyKeyboard: true, exitOnCtrlC: false });
  const tui = new GeorgeTui({ renderer: setup.renderer, service: workflow, session: reopened, provider: 'scripted', model: 'fixture', approvals: new PendingApprovalPort() });
  await setup.flush();
  assert.match(setup.captureCharFrame(), /Transcript/);
  assert.ok(tui.work.some((entry) => entry.item.operationId === 'process'));
  assert.equal(tui.work.some((entry) => ['requested', 'running', 'waiting'].includes(entry.item.status)), false);
  tui.close();
  const later = await workflow.run({ session: reopened, input: 'What is the unrelated next task?', turnId: 'later-turn' });
  assert.equal(later.terminalState, 'completed');
  assert.doesNotMatch(provider.requests.at(-1)?.instructions ?? '', /PORTABLE SKILL BODY|ROUTED KNOWLEDGE/);
  assert.match(provider.requests.at(-1)?.input ?? '', /assistant: Validation passed\./);
});

test('interrupted durable operations reopen as history, never replay, and a later turn starts fresh', async (t) => {
  const { root, state } = await fixture();
  t.after(() => Promise.all([rm(root, { recursive: true, force: true }), rm(state, { recursive: true, force: true })]));
  const store = new LocalSessionStore({ root: state });
  for (const [kind, event] of [
    ['mutation', { type: 'tool.started', turnId: 'old', callId: 'write', name: 'write_file' }],
    ['process', { type: 'tool.started', turnId: 'old', callId: 'process', name: 'run_process' }],
    ['approval', { type: 'approval.requested', turnId: 'old', callId: 'approval', request: { id: 'approval', toolName: 'write_file', risk: 'write', arguments: {}, target: { path: 'never.txt', alreadyDirty: false } } }],
    ['provider-continuation', { type: 'provider.response.started', responseId: 'old-provider' }],
  ] as const) {
    const session = createSession({ id: `interrupted-${kind}`, workspace: root });
    appendSessionEvent(session, { type: 'turn.started', turnId: 'old' });
    appendSessionEvent(session, event);
    await store.save(session);
    const reopened = await store.open(session.id, root);
    assert.deepEqual(reopened.interruptions.map((item) => item.kind), [kind]);
    assert.equal(await readFile(join(root, 'user-work.txt'), 'utf8'), 'pre-existing user work');
    const provider = new ScriptedProvider([[{ type: 'provider.text.delta', delta: 'fresh turn' }, { type: 'provider.response.completed' }]]);
    const workflow = await createCodingWorkflowApplicationService({ provider, workspace: root, approvalPort: new Approval([]), sessionStore: store });
    await workflow.run({ session: reopened, input: 'fresh request', turnId: `fresh-${kind}` });
    assert.equal(provider.requests.length, 1);
    assert.doesNotMatch(provider.requests[0]?.input ?? '', /old-provider/);
    assert.equal(reopened.events.filter((item) => item.type === 'approval.allowed').length, 0);
  }
});
