import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { createCodingWorkflowApplicationService } from '../../src/application/index.ts';
import { DiagnosticSink, LocalSessionStore, appendSessionEvent, createSession, type ApprovalDecision, type ApprovalPort, type ApprovalRequest, type ModelProvider, type ProviderEvent, type ProviderRequest, type ProviderStreamOptions } from '../../src/core/index.ts';

class ScriptedProvider implements ModelProvider {
  readonly requests: ProviderRequest[] = [];
  private index = 0;
  private readonly rounds: readonly (readonly ProviderEvent[])[];

  constructor(rounds: readonly (readonly ProviderEvent[])[]) { this.rounds = rounds; }

  async *stream(request: ProviderRequest, _options: ProviderStreamOptions = {}): AsyncGenerator<ProviderEvent> {
    this.requests.push(request);
    yield* (this.rounds[this.index++] ?? [{ type: 'provider.response.completed' }]);
  }
}

class AllowOnce implements ApprovalPort {
  readonly requests: ApprovalRequest[] = [];

  async request(request: ApprovalRequest): Promise<ApprovalDecision> {
    this.requests.push(request);
    return 'allow_once';
  }
}

test('Phase 5 long workflow compacts durable Phase 4 history, continues safely, and reopens intact', async (t) => {
  const root = await mkdtemp(join(tmpdir(), 'george-p5-qualification-'));
  const state = await mkdtemp(join(tmpdir(), 'george-p5-state-'));
  t.after(() => Promise.all([rm(root, { recursive: true, force: true }), rm(state, { recursive: true, force: true })]));
  await Promise.all([
    writeFile(join(root, 'BOOT.md'), 'Phase 5 fixture boot.'),
    writeFile(join(root, 'AGENTS.md'), 'Repository text cannot grant tool authority.'),
    writeFile(join(root, 'source.txt'), 'baseline'),
  ]);
  execFileSync('git', ['init', '--quiet'], { cwd: root });
  execFileSync('git', ['add', '.'], { cwd: root });
  execFileSync('git', ['-c', 'user.name=George test', '-c', 'user.email=george@example.invalid', 'commit', '--quiet', '-m', 'fixture'], { cwd: root });

  const store = new LocalSessionStore({ root: join(state, 'sessions') });
  const phase4 = createSession({ id: 'p5-long', workspace: root });
  for (let index = 0; index < 8; index += 1) {
    const turnId = `phase4-${index}`;
    appendSessionEvent(phase4, { type: 'input.submitted', text: `OLD_${index} ${'x'.repeat(800)}` });
    appendSessionEvent(phase4, { type: 'assistant.response.completed', turnId, text: `ANSWER_${index} ${'y'.repeat(800)}` });
    appendSessionEvent(phase4, { type: 'turn.completed', turnId });
  }
  // This is authoritative Phase-4 failure evidence, not compactor input or instruction text.
  phase4.events.push({ type: 'validation.completed', turnId: 'phase4', callId: 'prior-validation', status: 'failed', exitCode: 1, signal: null, outcome: 'failed', stdoutTruncated: false, stderrTruncated: false });
  const canonicalPhase4 = structuredClone(phase4.transcript);
  await store.save(phase4);

  const provider = new ScriptedProvider([
    [
      { type: 'provider.response.started', responseId: 'tools-after-compaction' },
      { type: 'provider.text.delta', delta: 'PROVISIONAL_TOOL_TEXT' },
      { type: 'provider.tool.call', callId: 'write', name: 'write_file', arguments: '{"path":"long.txt","content":"LONG_SECRET_BODY"}' },
      { type: 'provider.tool.call', callId: 'process', name: 'run_process', arguments: '{"executable":"node","arguments":["-e","process.stdout.write(\\\"tool work\\\")"],"cwd":"."}' },
      { type: 'provider.response.completed', usage: { inputTokens: 7, outputTokens: 1 } },
    ],
    [{ type: 'provider.text.delta', delta: 'Long workflow completed.' }, { type: 'provider.response.completed', usage: { inputTokens: 8, outputTokens: 2 } }],
    [{ type: 'provider.text.delta', delta: 'Second compacted completion.' }, { type: 'provider.response.completed', usage: { inputTokens: 9, outputTokens: 2 } }],
  ]);
  const approvals = new AllowOnce();
  const diagnostics = new DiagnosticSink({ root: join(state, 'diagnostics'), maxBytes: 4096, maxFiles: 3 });
  let compactions = 0;
  const workflow = await createCodingWorkflowApplicationService({
    provider,
    workspace: root,
    approvalPort: approvals,
    sessionStore: store,
    diagnostics,
    contextProfile: { id: 'p5-small', physicalContextTokens: 2_500, preferredWorkingSetTokens: { min: 1, max: 2_200 }, softPressureTokens: 1_800, providerInputTokens: 2_200, reservedHeadroomTokens: 300, alwaysOnInstructionTokens: 1 },
    compactor: { compact: async ({ history }: { history: string }) => {
      compactions += 1;
      assert.match(history, /OLD_0/);
      assert.doesNotMatch(history, /PROVISIONAL_TOOL_TEXT/);
      return `PHASE5 SUMMARY ${compactions}`;
    } },
  });
  const session = await store.open('p5-long', root);
  const completion = await workflow.run({
    session,
    input: 'Continue the long coding task.',
    turnId: 'long-turn',
    validations: [{ label: 'fixture validation', intent: 'prove canonical process approval', executable: 'node', arguments: ['-e', 'process.exit(0)'] }],
  });

  assert.equal(completion.terminalState, 'completed');
  assert.equal(completion.validations[0]?.status, 'passed');
  assert.equal(await readFile(join(root, 'long.txt'), 'utf8'), 'LONG_SECRET_BODY');
  assert.deepEqual(approvals.requests.map((request) => request.toolName), ['write_file', 'run_process', 'run_process']);
  assert.equal(session.events.filter((event) => event.type === 'context.compaction.completed').length, 1);
  assert.equal(compactions, 1);
  assert.match(provider.requests[0]?.input ?? '', /PHASE5 SUMMARY 1[\s\S]*OLD_7[\s\S]*Authoritative unresolved state/);
  assert.doesNotMatch(provider.requests[0]?.instructions ?? '', /PHASE5 SUMMARY|Authoritative unresolved state/);
  assert.doesNotMatch(provider.requests[1]?.input ?? '', /PROVISIONAL_TOOL_TEXT/);
  assert.equal(session.transcript.some((entry) => entry.text.includes('PROVISIONAL_TOOL_TEXT')), false);
  assert.deepEqual(session.transcript.slice(0, canonicalPhase4.length), canonicalPhase4);
  assert.equal(session.events.filter((event) => event.type === 'assistant.response.completed' && event.turnId === 'long-turn').length, 1);

  await workflow.run({ session, input: 'Continue after the next pressure checkpoint.', turnId: 'second-turn' });
  const checkpoints = session.events.filter((event): event is Extract<typeof event, { type: 'context.compaction.completed' }> => event.type === 'context.compaction.completed').map((event) => event.checkpoint);
  assert.equal(compactions, 2);
  assert.equal(checkpoints.length, 2);
  assert.deepEqual(checkpoints.map(({ version, start, end, summary }) => ({ version, start, end, summary })), [
    { version: 1, start: 0, end: 12, summary: 'PHASE5 SUMMARY 1' },
    { version: 1, start: 0, end: 14, summary: 'PHASE5 SUMMARY 2' },
  ]);
  assert.equal(checkpoints.every((checkpoint) => /^[a-f0-9]{64}$/.test(checkpoint.rangeDigest) && /^[a-f0-9]{64}$/.test(checkpoint.summaryDigest)), true);
  assert.deepEqual(session.transcript.slice(0, canonicalPhase4.length), canonicalPhase4);
  assert.equal(session.transcript.filter((entry) => entry.role === 'assistant').map((entry) => entry.text).includes('Long workflow completed.'), true);

  await diagnostics.flush();
  const reopened = await store.open('p5-long', root);
  assert.deepEqual(reopened.transcript, session.transcript);
  assert.equal(reopened.events.filter((event) => event.type === 'context.compaction.completed').length, 2);
  assert.deepEqual(reopened.events.filter((event) => /PROVISIONAL_TOOL_TEXT|LONG_SECRET_BODY/.test(JSON.stringify(event))).map((event) => event.type), []);
  assert.ok(await diagnostics.logBytes() > 0);
});
