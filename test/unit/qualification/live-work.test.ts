import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { StructuredTaskApplicationService, StructuredTaskStackApplicationService, createCodingWorkflowApplicationService } from '../../../src/application/index.ts';
import { createSession, type ApplicationEvent, type ApprovalDecision, type ApprovalPort, type ApprovalRequest, type ModelProvider, type ProviderEvent, type ProviderRequest } from '../../../src/core/index.ts';
import { extractLiveWorkTrace, runGreenfieldExpressV1, runLiveWorkInstrument, writeLiveWorkArtifacts, type LiveWorkResult } from '../../../src/qualification/index.ts';
import { createStackState, createTaskState, parseTaskPrompt } from '../../../src/tasks/index.ts';

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
  const failed = await runLiveWorkInstrument({ attemptId: 'failed', humanInterventions: 0, kind: 'stack', service, session: createSession({ workspace }), prompts: [prompt(1, true), prompt(2)], acceptancePath: join(workspace, '..', 'hidden.test.mjs'), runHiddenAcceptance: async () => { acceptanceCalls += 1; return true; } });
  assert.equal(failed.hiddenAcceptance, 'not_run');
  assert.equal(failed.qualifying, false);
  assert.equal(acceptanceCalls, 0);
  assert.equal(failed.metrics.stackUpdates > 0, true);

  const passed = await runLiveWorkInstrument({ attemptId: 'passed', humanInterventions: 0, kind: 'stack', service, session: createSession({ workspace }), prompts: [prompt(1), prompt(2)], acceptancePath: join(workspace, '..', 'hidden.test.mjs'), runHiddenAcceptance: async () => { acceptanceCalls += 1; return true; } });
  assert.equal(passed.qualifying, true);
  assert.equal(acceptanceCalls, 1);
  assert.equal(passed.metrics.providerInputTokens, 8);
});

test('live-work runner rejects model-visible acceptance and unauthorized dependency installation', async (t) => {
  const workspace = await mkdtemp(join(tmpdir(), 'george-live-runner-policy-'));
  t.after(() => rm(workspace, { recursive: true, force: true }));
  const workflow = await createCodingWorkflowApplicationService({ provider: new Provider(), workspace, approvalPort: new Allow() });
  const service = new StructuredTaskApplicationService(workflow.agent);
  await assert.rejects(runLiveWorkInstrument({ attemptId: 'visible', humanInterventions: 0, kind: 'single', service, session: createSession({ workspace }), prompt: prompt(1), acceptancePath: join(workspace, 'hidden.test.mjs'), runHiddenAcceptance: async () => true }), /outside/);
  await assert.rejects(runLiveWorkInstrument({ attemptId: 'dependency', humanInterventions: 0, kind: 'single', service, session: createSession({ workspace }), prompt: prompt(1), acceptancePath: join(workspace, '..', 'hidden.test.mjs'), runHiddenAcceptance: async () => true, dependencyInstallation: { authorized: false, run: async () => undefined } }), /authorization/);
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
    attemptId: 'greenfield',
    humanInterventions: 0,
    service,
    session: createSession({ workspace }),
    instrumentRoot: join(process.cwd(), 'test/fixtures/p9-live-work/greenfield-express-v1'),
    acceptancePath: join(process.cwd(), 'test/acceptance/p9-live-work/greenfield-express-v1.test.mjs'),
    runHiddenAcceptance: async () => true,
  });
  assert.equal(result.qualifying, true);
  assert.deepEqual(received.map((value) => value.match(/TASK: P(\d)/)?.[1]), ['1', '2', '3']);
});

test('live trace uses typed diagnostics, pairs tools, retains mutation and safe task projections, and tolerates missing or future evidence', () => {
  const parsed = [1, 2].map((ordinal) => parseTaskPrompt(prompt(ordinal)));
  assert.equal(parsed.every((item) => item.kind === 'structured'), true);
  const definitions = parsed.flatMap((item) => item.kind === 'structured' ? [item.task] : []);
  const session = createSession({ id: 'trace-session', workspace: '/tmp/trace-workspace' });
  session.taskState = createTaskState({ sessionId: session.id, workspace: session.workspace, definition: definitions[0]! });
  session.stackState = createStackState({ sessionId: session.id, workspace: session.workspace, definitions });
  const execution = { effect: 'workspace_mutation', replaySafety: 'not_replay_safe', source: { kind: 'builtin' } } as const;
  const events: ApplicationEvent[] = [
    { type: 'context.assembled', turnId: 't1', diagnostics: { mode: 'adaptive', profileId: 'medium', profile: { id: 'medium', physicalContextTokens: 32_768, preferredWorkingSetTokens: { min: 1, max: 24_000 }, softPressureTokens: 22_000, providerInputTokens: 24_000, reservedHeadroomTokens: 8_768, alwaysOnInstructionTokens: 1_000 }, attemptedProfileIds: ['ordinary', 'medium'], promotionReasons: ['routed-document'], estimatedTokens: 12_000, estimator: 'fixture', providerInputBudget: 24_000, remainingHeadroom: 12_000, softPressure: false, reservedHeadroom: 8_768, categoryTokens: { core: 1, project: 2, tools: 3, task: 4, skills: 5, routed: 6, conversation: 7, toolResults: 8 }, activeSourceIds: [], evidence: [] } },
    { type: 'provider.response.completed' },
    { type: 'tool.requested', turnId: 't1', callId: 'call-1', name: 'write_file', arguments: JSON.stringify({ path: 'src/a.ts', expectedSha256: 'a'.repeat(64), content: 'private body', token: 'secret' }), execution },
    { type: 'tool.completed', turnId: 't1', callId: 'call-1', name: 'write_file', result: { ok: true, value: { path: 'src/a.ts', bytes: 4, sha256: 'b'.repeat(64) } }, execution },
    { type: 'tool.requested', turnId: 't1', callId: 'call-2', name: 'run_process', arguments: '{}' },
    { type: 'approval.denied', turnId: 't1', callId: 'call-2', request: { id: 'approval-1', title: 'Process', description: 'fixture', effect: 'host_process' } as never },
    { type: 'tool.failed', turnId: 't1', callId: 'call-2', name: 'run_process', result: { ok: false, error: { code: 'permission', message: 'Denied.' } } },
    { type: 'validation.completed', turnId: 't1', callId: 'validation-1', status: 'passed', exitCode: 0, signal: null, stdoutTruncated: false, stderrTruncated: false },
    { type: 'future.bounded' } as unknown as ApplicationEvent,
  ];
  const trace = extractLiveWorkTrace({ events, terminalStatus: 'in_progress', taskState: session.taskState, stackState: session.stackState, hiddenAcceptance: 'not_run', humanInterventions: 2 });
  assert.equal(trace.contexts[0]?.profileId, 'medium', 'reads context.assembled.diagnostics.profileId, never a nonexistent profile.id');
  assert.equal(trace.metrics.providerInputTokens, null, 'missing optional usage is explicit unavailable evidence');
  assert.deepEqual(trace.toolCalls.map(({ callId, terminalState }) => [callId, terminalState]), [['call-1', 'succeeded'], ['call-2', 'denied']]);
  assert.equal(trace.toolCalls[0]?.requestedArguments.includes('private body'), false);
  assert.equal(trace.toolCalls[0]?.requestedArguments.includes('secret'), false);
  assert.deepEqual(trace.mutations[0], { callId: 'call-1', tool: 'write_file', path: 'src/a.ts', bytes: 4, sha256: 'b'.repeat(64) });
  assert.equal(trace.validations[0]?.status, 'passed');
  assert.equal(trace.taskState?.fingerprint, session.taskState.definitionFingerprint);
  assert.equal(trace.stackState?.fingerprint, session.stackState.fingerprint);
  assert.equal(trace.humanInterventions, 2);
});

test('artifact envelope survives optional report rendering failure', async (t) => {
  const root = await mkdtemp(join(tmpdir(), 'george-live-artifact-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const trace = extractLiveWorkTrace({ events: [], terminalStatus: 'failed', hiddenAcceptance: 'not_run', humanInterventions: 0 });
  const result: LiveWorkResult = Object.freeze({ attemptId: 'artifact-failure', qualifying: false, terminalStatus: 'failed', hiddenAcceptance: 'not_run', metrics: trace.metrics, trace, events: Object.freeze([]) });
  await assert.rejects(writeLiveWorkArtifacts({ directory: root, workspace: root, result, renderReport: () => { throw new TypeError("Cannot read properties of undefined (reading 'id')"); } }), /reading 'id'/);
  const envelope = JSON.parse(await readFile(join(root, 'attempt.json'), 'utf8')) as { attemptId: string; terminalStatus: string };
  assert.equal(envelope.attemptId, 'artifact-failure');
  assert.equal(envelope.terminalStatus, 'failed');
  assert.equal((JSON.parse(await readFile(join(root, 'trace.json'), 'utf8')) as { terminalStatus: string }).terminalStatus, 'failed');
  await assert.rejects(readFile(join(root, 'report.txt'), 'utf8'));
});
