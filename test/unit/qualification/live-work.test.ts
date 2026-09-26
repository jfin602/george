import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtemp, readFile, readdir, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { StructuredTaskApplicationService, StructuredTaskStackApplicationService, createAgentLoopApplicationService, createCodingWorkflowApplicationService } from '../../../src/application/index.ts';
import { CONTEXT_PROFILE_REGISTRY, createSession, type ApplicationEvent, type ApprovalDecision, type ApprovalPort, type ApprovalRequest, type ModelProvider, type ProviderEvent, type ProviderRequest } from '../../../src/core/index.ts';
import { THREE_FILE_INSPECTION_SMOKE, acceptGreetingSmoke, acceptThreeFileSmoke, createFrozenEditQualificationApproval, extractLiveWorkTrace, prepareThreeFileInspectionFixture, recognizeLiveWorkArtifactSchema, runExistingExpressFeatureV1, runExistingExpressFeatureV2, runGreenfieldExpressV1, runGreenfieldExpressV2, runLiveWorkInstrument, runOrdinaryTurnQualification, writeLiveWorkArtifacts, type LiveWorkResult } from '../../../src/qualification/index.ts';
import { createStackState, createTaskState, parseTaskPrompt } from '../../../src/tasks/index.ts';

class Provider implements ModelProvider {
  async *stream(_request: ProviderRequest): AsyncGenerator<ProviderEvent> { yield { type: 'provider.response.completed', usage: { inputTokens: 4, outputTokens: 1 } }; }
}
class NoInspectionProvider implements ModelProvider {
  async *stream(_request: ProviderRequest): AsyncGenerator<ProviderEvent> {
    yield { type: 'provider.response.started', responseId: 'inspection-without-tool' };
    yield { type: 'provider.text.delta', delta: 'raw-provider-secret=TOP_SECRET_PROVIDER_PAYLOAD' };
    yield { type: 'provider.response.completed', usage: { inputTokens: 7, outputTokens: 2 } };
  }
}
class OrdinaryProvider implements ModelProvider {
  readonly requests: ProviderRequest[] = [];
  private readonly rounds: readonly (readonly ProviderEvent[])[];
  constructor(rounds: readonly (readonly ProviderEvent[])[]) { this.rounds = rounds; }
  async *stream(request: ProviderRequest): AsyncGenerator<ProviderEvent> {
    this.requests.push(request);
    yield* this.rounds[this.requests.length - 1] ?? [];
  }
}
class Allow implements ApprovalPort { async request(_request: ApprovalRequest): Promise<ApprovalDecision> { return 'allow_once'; } }
const mutationExecution = { effect: 'workspace_mutation', replaySafety: 'not_replay_safe', source: { kind: 'builtin' } } as const;
const processExecution = { effect: 'host_process', replaySafety: 'not_replay_safe', source: { kind: 'builtin' } } as const;
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

const inspectionPrompt = `${prompt(1)}\nINSPECT\n\n- current implementation\n`;

test('frozen edit qualification approval allows only ordinary exact-target mutations and exact validation', async () => {
  const approval = createFrozenEditQualificationApproval({ targetPath: 'src/label.js', validation: { executable: 'node', arguments: ['--test', 'test/label.test.js'] } });
  const target = (toolName: 'write_file' | 'apply_patch', path = 'src/label.js', mutation?: ApprovalRequest['mutation'], outsideWorkspace = false): ApprovalRequest => ({
    id: `${toolName}-${path}`, toolName, execution: mutationExecution,
    target: { path, alreadyDirty: false, ...(outsideWorkspace ? { outsideWorkspace: true } : {}) }, ...(mutation === undefined ? {} : { mutation }),
  });
  const process = (argv: readonly string[], executable = 'node', toolName = 'run_process'): ApprovalRequest => ({ id: toolName, toolName, execution: processExecution, process: { executable, argv, cwd: '.', warning: '' } });
  const framing = { intent: 'text_framing_change' as const, warning: 'Existing text framing will change if this mutation is allowed.' };

  assert.equal(await approval.request(target('write_file')), 'allow_once');
  assert.equal(await approval.request(target('apply_patch')), 'allow_once');
  assert.equal(await approval.request(target('write_file', 'src/other.js')), 'deny');
  assert.equal(await approval.request(target('apply_patch', 'src/other.js')), 'deny');
  assert.equal(await approval.request(target('write_file', 'src/label.js', framing)), 'deny');
  assert.equal(await approval.request(target('apply_patch', 'src/label.js', framing)), 'deny');
  assert.equal(await approval.request(target('write_file', 'src/label.js', undefined, true)), 'deny');
  assert.equal(await approval.request(process(['--test', 'test/label.test.js'])), 'allow_once');
  assert.equal(await approval.request(process(['--test', 'test/other.test.js'])), 'deny');
  assert.equal(await approval.request(process(['--test', 'test/label.test.js'], 'npm')), 'deny');
  assert.equal(await approval.request(process(['--test', 'test/label.test.js'], 'node', 'other_tool')), 'deny');
});

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

  const passed = await runLiveWorkInstrument({ attemptId: 'passed', humanInterventions: 0, kind: 'stack', service, session: createSession({ workspace }), prompts: [prompt(1), prompt(2)], acceptancePath: join(workspace, '..', 'hidden.test.mjs'), runHiddenAcceptance: async () => { acceptanceCalls += 1; return true; }, onEvent: () => { throw new Error('optional observer failed'); } });
  assert.equal(passed.qualifying, true);
  assert.equal(passed.terminalError, null);
  assert.match(passed.observerError?.message ?? '', /optional observer failed/);
  assert.equal(passed.events.length > 0, true, 'core evidence is captured before the optional observer runs');
  assert.equal(acceptanceCalls, 1);
  assert.equal(passed.metrics.providerInputTokens, 8);
});

test('thrown structured inspection retains a bounded failed result and durable artifacts', async (t) => {
  const workspace = await mkdtemp(join(tmpdir(), 'george-live-inspection-failure-'));
  const artifacts = await mkdtemp(join(tmpdir(), 'george-live-inspection-artifacts-'));
  t.after(() => Promise.all([rm(workspace, { recursive: true, force: true }), rm(artifacts, { recursive: true, force: true })]));
  const workflow = await createCodingWorkflowApplicationService({ provider: new NoInspectionProvider(), workspace, approvalPort: new Allow() });
  const service = new StructuredTaskApplicationService(workflow.agent);
  const session = createSession({ workspace });
  let acceptanceCalls = 0;
  const observed: ApplicationEvent[] = [];

  const result = await runLiveWorkInstrument({
    attemptId: 'inspection-failure', humanInterventions: 3, kind: 'single', service, session, prompt: inspectionPrompt,
    acceptancePath: join(workspace, '..', 'hidden.test.mjs'), runHiddenAcceptance: async () => { acceptanceCalls += 1; return true; },
    onEvent: (event) => { observed.push(event); },
  });

  assert.equal(result.qualifying, false);
  assert.equal(result.terminalStatus, 'blocked');
  assert.equal(result.hiddenAcceptance, 'not_run');
  assert.equal(acceptanceCalls, 0);
  assert.deepEqual(result.terminalError, { code: 'validation', message: 'Structured INSPECT preflight produced no read-only evidence.' });
  assert.equal(result.trace.taskState?.status, 'blocked');
  assert.equal(result.trace.humanInterventions, 3);
  assert.equal(result.metrics.providerAttempts, 1);
  assert.equal(result.metrics.providerRounds, 1);
  assert.equal(result.metrics.providerInputTokens, 7);
  assert.equal(result.metrics.providerOutputTokens, 2);
  assert.equal(result.metrics.contextAssemblies, 1);
  assert.equal(result.trace.budgets.latest.length > 0, true);
  assert.equal(result.trace.correctionCount, 0);
  assert.equal((result.trace.timing.totalMs ?? -1) >= 0, true);
  assert.deepEqual(result.events, observed.filter((event) => !['provider.text.delta', 'input.submitted', 'assistant.response.completed'].includes(event.type)), 'every bounded operational event observed before the throw is retained');
  assert.equal(result.events.some((event) => event.type === 'provider.attempt.started'), true);
  assert.equal(result.events.some((event) => event.type === 'provider.response.completed'), true);
  assert.equal(result.events.some((event) => event.type === 'turn.failed'), false, 'text-only inspection returns normally before the structured service rejects missing evidence');

  await writeLiveWorkArtifacts({ directory: artifacts, workspace, result });
  const attempt = await readFile(join(artifacts, 'attempt.json'), 'utf8');
  const trace = await readFile(join(artifacts, 'trace.json'), 'utf8');
  assert.match(attempt, /Structured INSPECT preflight produced no read-only evidence/);
  assert.match(trace, /Structured INSPECT preflight produced no read-only evidence/);
  assert.equal(`${attempt}${trace}`.includes('TOP_SECRET_PROVIDER_PAYLOAD'), false);
});

test('live-work runner rejects model-visible acceptance and unauthorized dependency installation', async (t) => {
  const workspace = await mkdtemp(join(tmpdir(), 'george-live-runner-policy-'));
  t.after(() => rm(workspace, { recursive: true, force: true }));
  const workflow = await createCodingWorkflowApplicationService({ provider: new Provider(), workspace, approvalPort: new Allow() });
  const service = new StructuredTaskApplicationService(workflow.agent);
  await assert.rejects(runLiveWorkInstrument({ attemptId: 'visible', humanInterventions: 0, kind: 'single', service, session: createSession({ workspace }), prompt: prompt(1), acceptancePath: join(workspace, 'hidden.test.mjs'), runHiddenAcceptance: async () => true }), /outside/);
  await assert.rejects(runLiveWorkInstrument({ attemptId: 'dependency', humanInterventions: 0, kind: 'single', service, session: createSession({ workspace }), prompt: prompt(1), acceptancePath: join(workspace, '..', 'hidden.test.mjs'), runHiddenAcceptance: async () => true, dependencyInstallation: { authorized: false, run: async () => undefined } }), /authorization/);
});

test('qualification harness failures become distinct bounded results instead of losing application evidence', async () => {
  const service = { run: async () => ({ terminalState: 'completed', finalAssistantResponse: 'safe response' }) } as unknown as StructuredTaskApplicationService;
  const result = await runOrdinaryTurnQualification({ attemptId: 'harness-failure', humanInterventions: 0, service, session: createSession({ workspace: '/tmp' }), input: 'hi', accept: () => { throw new Error('acceptance observer failed'); } });
  assert.equal(result.qualifying, false);
  assert.equal(result.terminalStatus, 'completed');
  assert.match(result.terminalError?.message ?? '', /acceptance observer failed/);
  assert.deepEqual(result.trace.failures.at(-1), { source: 'harness', category: 'harness', eventType: 'harness.error', code: 'provider', message: 'acceptance observer failed' });
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

test('versioned live-work runners load only matching instruments at the production boundaries', async (t) => {
  const workspace = await mkdtemp(join(tmpdir(), 'george-versioned-live-runner-'));
  t.after(() => rm(workspace, { recursive: true, force: true }));
  const fixtures = join(process.cwd(), 'test/fixtures/p9-live-work');
  const acceptance = join(process.cwd(), 'test/acceptance/p9-live-work');
  const stackRuns: string[][] = [];
  const stackService = { run: async (submission: { prompts: readonly string[] }) => {
    stackRuns.push(submission.prompts.map((value) => `${value.match(/STACK: ([^\n]+)/)?.[1]}:${value.match(/TASK: P(\d+)/)?.[1]}`));
    return { state: { status: 'completed' }, taskCompletions: [] };
  } } as unknown as StructuredTaskStackApplicationService;
  const common = { humanInterventions: 0, service: stackService, session: createSession({ workspace }), runHiddenAcceptance: async () => true };
  await runGreenfieldExpressV1({ ...common, attemptId: 'greenfield-v1', instrumentRoot: join(fixtures, 'greenfield-express-v1'), acceptancePath: join(acceptance, 'greenfield-express-v1.test.mjs') });
  await runGreenfieldExpressV2({ ...common, attemptId: 'greenfield-v2', instrumentRoot: join(fixtures, 'greenfield-express-v2'), acceptancePath: join(acceptance, 'greenfield-express-v1.test.mjs') });
  assert.deepEqual(stackRuns, [
    ['greenfield-express-v1:1', 'greenfield-express-v1:2', 'greenfield-express-v1:3'],
    ['greenfield-express-v2:1', 'greenfield-express-v2:2', 'greenfield-express-v2:3'],
  ]);

  const singleRuns: string[] = [];
  const singleService = { run: async (submission: { input: string }) => {
    singleRuns.push(submission.input.match(/STACK: ([^\n]+)/)?.[1] ?? '');
    throw new Error('captured fixture');
  } } as unknown as StructuredTaskApplicationService;
  const singleCommon = { humanInterventions: 0, service: singleService, runHiddenAcceptance: async () => true };
  await runExistingExpressFeatureV1({ ...singleCommon, attemptId: 'existing-v1', session: createSession({ workspace }), instrumentRoot: join(fixtures, 'existing-express-feature-v1'), acceptancePath: join(acceptance, 'existing-express-feature-v1.test.mjs') });
  await runExistingExpressFeatureV2({ ...singleCommon, attemptId: 'existing-v2', session: createSession({ workspace }), instrumentRoot: join(fixtures, 'existing-express-feature-v2'), acceptancePath: join(acceptance, 'existing-express-feature-v1.test.mjs') });
  assert.deepEqual(singleRuns, ['existing-express-feature-v1', 'existing-express-feature-v2']);
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
    { type: 'context.envelope.promoted', turnId: 't1', fromProfileId: 'medium', toProfileId: 'large', reason: 'provider-usage', tokens: 16_500, providerInputBudget: 24_576 },
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
  assert.deepEqual(trace.envelopePromotions, [{ turnId: 't1', fromProfileId: 'medium', toProfileId: 'large', reason: 'provider-usage', tokens: 16_500, providerInputBudget: 24_576 }]);
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

test('schema-2 artifacts retain bounded authoritative failures without raw payload, prose, file bodies, or secrets', async (t) => {
  const root = await mkdtemp(join(tmpdir(), 'george-live-failures-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const events: ApplicationEvent[] = [
    { type: 'turn.started', turnId: 'turn-1' },
    { type: 'provider.attempt.started', turnId: 'turn-1', runId: 'run-1', attemptId: 'attempt-1' },
    { type: 'provider.error', error: { code: 'provider', message: 'LM Studio returned HTTP 422. token=TOP_SECRET', cause: { providerCode: 'context_length_exceeded', providerReason: 'input_too_large', status: 422, rawBody: 'RAW_PROVIDER_PAYLOAD' } } },
    { type: 'provider.retry.scheduled', turnId: 'turn-1', runId: 'run-1', attemptId: 'attempt-1', retry: 1, delayMs: 7, category: 'provider' },
    { type: 'provider.attempt.started', turnId: 'turn-1', runId: 'run-1', attemptId: 'attempt-2' },
    { type: 'provider.retry.exhausted', turnId: 'turn-1', runId: 'run-1', attemptId: 'attempt-2', retries: 1, category: 'provider' },
    { type: 'turn.failed', turnId: 'turn-1', error: { code: 'provider', message: 'Continuation failed.' } },
    { type: 'turn.cancelled', turnId: 'turn-2', error: { code: 'cancelled', message: 'Operator cancelled.' } },
    { type: 'tool.requested', turnId: 'turn-2', callId: 'tool-1', name: 'write_file', arguments: JSON.stringify({ path: 'secret.txt', content: 'FILE_BODY', password: 'PASSWORD_VALUE' }) },
    { type: 'tool.failed', turnId: 'turn-2', callId: 'tool-1', name: 'write_file', result: { ok: false, error: { code: 'validation', message: 'Write rejected. secret=TOOL_SECRET' } } },
    { type: 'tool.requested', turnId: 'turn-2', callId: 'tool-2', name: 'apply_patch', arguments: JSON.stringify({ path: 'secret.txt', edits: [{ oldText: 'OLD_FILE_BODY', newText: 'NEW_FILE_BODY' }] }) },
    { type: 'validation.completed', turnId: 'turn-2', callId: 'V1', status: 'failed', exitCode: 1, signal: null, outcome: 'failed', stdoutTruncated: false, stderrTruncated: true, error: { code: 'tool', message: 'Validation failed. api_key=VALIDATION_SECRET' } },
    { type: 'assistant.response.completed', turnId: 'turn-2', text: 'FULL_ASSISTANT_PROSE' },
  ];
  const trace = extractLiveWorkTrace({ events, terminalStatus: 'failed', terminalError: { code: 'validation', message: 'Harness failed. cookie=HARNESS_SECRET' }, observerError: { code: 'provider', message: 'Observer failed. Bearer OBSERVER_SECRET' }, hiddenAcceptance: 'failed', humanInterventions: 0 });
  assert.equal(trace.schemaVersion, 2);
  assert.deepEqual(trace.failures.map(({ category, eventType }) => [category, eventType]), [
    ['provider', 'provider.error'], ['turn', 'turn.failed'], ['turn', 'turn.cancelled'], ['tool', 'tool.failed'], ['validation', 'validation.completed'], ['harness', 'harness.error'], ['observer', 'observer.error'],
  ]);
  assert.deepEqual(trace.failures[0], { source: 'application', category: 'provider', eventType: 'provider.error', code: 'provider', message: 'LM Studio returned HTTP 422. token=[redacted]', providerCode: 'context_length_exceeded', reason: 'input_too_large', status: 422, turnId: 'turn-1', attemptId: 'attempt-1' });
  assert.equal(trace.failures.find(({ category }) => category === 'tool')?.callId, 'tool-1');
  assert.equal(trace.failures.find(({ category }) => category === 'validation')?.callId, 'V1');

  const result: LiveWorkResult = Object.freeze({ attemptId: 'failure-diagnostics', qualifying: false, terminalStatus: 'failed', terminalError: trace.terminalError, observerError: trace.observerError, hiddenAcceptance: 'failed', metrics: trace.metrics, trace, events: Object.freeze(events) });
  await writeLiveWorkArtifacts({ directory: root, workspace: root, result });
  const attempt = await readFile(join(root, 'attempt.json'), 'utf8');
  const durableTrace = await readFile(join(root, 'trace.json'), 'utf8');
  const evidence = `${attempt}${durableTrace}`;
  const envelope = JSON.parse(attempt) as { eventEvidence: Array<Record<string, unknown>> };
  assert.equal(recognizeLiveWorkArtifactSchema(envelope), 2);
  assert.deepEqual(envelope.eventEvidence.filter((event) => event.type === 'provider.attempt.started').map((event) => event.attemptId), ['attempt-1', 'attempt-2']);
  assert.deepEqual(envelope.eventEvidence.filter((event) => event.type === 'provider.retry.scheduled').map((event) => event.retry), [{ attemptId: 'attempt-1', count: 1, delayMs: 7 }]);
  assert.deepEqual(envelope.eventEvidence.filter((event) => event.type === 'provider.retry.exhausted').map((event) => event.retry), [{ attemptId: 'attempt-2', count: 1, exhausted: true }]);
  for (const unsafe of ['RAW_PROVIDER_PAYLOAD', 'FULL_ASSISTANT_PROSE', 'FILE_BODY', 'OLD_FILE_BODY', 'NEW_FILE_BODY', 'PASSWORD_VALUE', 'TOP_SECRET', 'TOOL_SECRET', 'VALIDATION_SECRET', 'HARNESS_SECRET', 'OBSERVER_SECRET']) assert.equal(evidence.includes(unsafe), false, unsafe);
});

test('historical schema-1 evidence remains recognizable and schema-2 writes are deterministic', async (t) => {
  const historicalPath = join(process.cwd(), 'docs/tasks/c9-turn-context-live-qualification/evidence/three-file/attempt.json');
  const historicalTracePath = join(process.cwd(), 'docs/tasks/c9-turn-context-live-qualification/evidence/three-file/trace.json');
  const historical = await readFile(historicalPath);
  const historicalTrace = await readFile(historicalTracePath);
  assert.equal(createHash('sha256').update(historical).digest('hex'), 'eb536899b5b4cac658692b440673b78697aa896d30b2d5270355016b77d88bec');
  assert.equal(createHash('sha256').update(historicalTrace).digest('hex'), 'edaf91604eb3937923ba316a5562060fd220165d6417fc6b59ce022d5ab21f7c');
  assert.equal(recognizeLiveWorkArtifactSchema(JSON.parse(historical.toString('utf8'))), 1);
  assert.equal('failures' in JSON.parse(historicalTrace.toString('utf8')), false, 'schema-1 trace keeps its original event-category-only semantics');

  const first = await mkdtemp(join(tmpdir(), 'george-schema2-first-'));
  const second = await mkdtemp(join(tmpdir(), 'george-schema2-second-'));
  t.after(() => Promise.all([rm(first, { recursive: true, force: true }), rm(second, { recursive: true, force: true })]));
  const trace = extractLiveWorkTrace({ events: [{ type: 'turn.failed', turnId: 'turn', error: { code: 'provider', message: 'Offline.' } }], terminalStatus: 'failed', hiddenAcceptance: 'failed', humanInterventions: 0, totalMs: 12 });
  const result: LiveWorkResult = Object.freeze({ attemptId: 'deterministic', qualifying: false, terminalStatus: 'failed', terminalError: null, observerError: null, hiddenAcceptance: 'failed', metrics: trace.metrics, trace, events: Object.freeze([{ type: 'turn.failed', turnId: 'turn', error: { code: 'provider', message: 'Offline.' } }]) });
  await writeLiveWorkArtifacts({ directory: first, workspace: process.cwd(), result });
  await writeLiveWorkArtifacts({ directory: second, workspace: process.cwd(), result });
  assert.equal(await readFile(join(first, 'attempt.json'), 'utf8'), await readFile(join(second, 'attempt.json'), 'utf8'));
  assert.equal(await readFile(join(first, 'trace.json'), 'utf8'), await readFile(join(second, 'trace.json'), 'utf8'));
  assert.equal(createHash('sha256').update(await readFile(historicalPath)).digest('hex'), 'eb536899b5b4cac658692b440673b78697aa896d30b2d5270355016b77d88bec');
  assert.equal(createHash('sha256').update(await readFile(historicalTracePath)).digest('hex'), 'edaf91604eb3937923ba316a5562060fd220165d6417fc6b59ce022d5ab21f7c');
});

test('artifact envelope survives optional report rendering failure', async (t) => {
  const root = await mkdtemp(join(tmpdir(), 'george-live-artifact-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const events: ApplicationEvent[] = [{ type: 'context.envelope.promoted', turnId: 'turn', fromProfileId: 'ordinary', toProfileId: 'medium', reason: 'provider-usage', tokens: 9_000, providerInputBudget: 16_384 }];
  const trace = extractLiveWorkTrace({ events, terminalStatus: 'failed', hiddenAcceptance: 'not_run', humanInterventions: 0 });
  const result: LiveWorkResult = Object.freeze({ attemptId: 'artifact-failure', qualifying: false, terminalStatus: 'failed', terminalError: null, observerError: null, hiddenAcceptance: 'not_run', metrics: trace.metrics, trace, events: Object.freeze(events) });
  await assert.rejects(writeLiveWorkArtifacts({ directory: root, workspace: root, result, renderReport: () => { throw new TypeError("Cannot read properties of undefined (reading 'id')"); } }), /reading 'id'/);
  const envelope = JSON.parse(await readFile(join(root, 'attempt.json'), 'utf8')) as { attemptId: string; terminalStatus: string; eventEvidence: Array<{ promotion?: { reason?: string } }> };
  assert.equal(recognizeLiveWorkArtifactSchema(envelope), 2);
  assert.equal(envelope.attemptId, 'artifact-failure');
  assert.equal(envelope.terminalStatus, 'failed');
  assert.equal(envelope.eventEvidence[0]?.promotion?.reason, 'provider-usage');
  assert.equal((JSON.parse(await readFile(join(root, 'trace.json'), 'utf8')) as { terminalStatus: string }).terminalStatus, 'failed');
  await assert.rejects(readFile(join(root, 'report.txt'), 'utf8'));
});

test('ordinary greeting qualification records one direct response without prose or fabricated tools', async (t) => {
  const workspace = await mkdtemp(join(tmpdir(), 'george-ordinary-greeting-'));
  const artifacts = await mkdtemp(join(tmpdir(), 'george-ordinary-greeting-artifacts-'));
  t.after(() => Promise.all([rm(workspace, { recursive: true, force: true }), rm(artifacts, { recursive: true, force: true })]));
  const provider = new OrdinaryProvider([[
    { type: 'provider.response.started', responseId: 'greeting' },
    { type: 'provider.text.delta', delta: 'SAFE_RESPONSE_PROSE_NOT_FOR_ARTIFACTS' },
    { type: 'provider.response.completed', usage: { inputTokens: 40, outputTokens: 8 } },
  ]]);
  const agent = await createAgentLoopApplicationService({ provider, workspace });
  const service = new StructuredTaskApplicationService(agent);
  const result = await runOrdinaryTurnQualification({
    attemptId: 'greeting', humanInterventions: 0, service, session: createSession({ workspace }), input: 'hi',
    accept: (trace) => acceptGreetingSmoke(trace, provider.requests[0]?.instructions?.includes('For a coding completion') ?? false).accepted,
  });

  assert.equal(result.qualifying, true);
  assert.equal(result.metrics.providerRounds, 1);
  assert.equal(result.metrics.toolCalls, 0);
  assert.deepEqual(result.trace.finalResponse, {
    present: true,
    bytes: Buffer.byteLength('SAFE_RESPONSE_PROSE_NOT_FOR_ARTIFACTS'),
    sha256: createHash('sha256').update('SAFE_RESPONSE_PROSE_NOT_FOR_ARTIFACTS').digest('hex'),
  });
  await writeLiveWorkArtifacts({ directory: artifacts, workspace, result });
  const evidence = `${await readFile(join(artifacts, 'attempt.json'), 'utf8')}${await readFile(join(artifacts, 'trace.json'), 'utf8')}`;
  assert.equal(evidence.includes('SAFE_RESPONSE_PROSE_NOT_FOR_ARTIFACTS'), false);
});

test('three-file ordinary smoke observes frozen reads and applies modest deterministic acceptance', async (t) => {
  const fixture = join(process.cwd(), 'test/fixtures/c9-turn-context-convergence/three-file-inspection');
  const names = (await readdir(fixture)).sort();
  assert.deepEqual(names, THREE_FILE_INSPECTION_SMOKE.paths);
  for (const name of names) {
    const path = join(fixture, name);
    const contents = await readFile(path);
    assert.equal(createHash('sha256').update(contents).digest('hex'), THREE_FILE_INSPECTION_SMOKE.sha256[name as keyof typeof THREE_FILE_INSPECTION_SMOKE.sha256]);
    assert.equal((await stat(path)).size >= 4 * 1024 && (await stat(path)).size <= 8 * 1024, true);
  }
  assert.equal(/maximum\s+3\s+files/i.test(THREE_FILE_INSPECTION_SMOKE.prompt), false);

  const workspace = await mkdtemp(join(tmpdir(), 'george-three-file-smoke-'));
  t.after(() => rm(workspace, { recursive: true, force: true }));
  await prepareThreeFileInspectionFixture(fixture, workspace);
  assert.equal((await stat(join(workspace, '.git'))).isDirectory(), true);
  assert.deepEqual((await readdir(workspace)).filter((name) => name !== '.git').sort(), THREE_FILE_INSPECTION_SMOKE.paths);
  const calls = names.map((path) => ({ type: 'provider.tool.call' as const, callId: `read-${path}`, name: 'read_file', arguments: JSON.stringify({ path }) }));
  const provider = new OrdinaryProvider([
    [{ type: 'provider.response.started', responseId: 'inspect' }, ...calls, { type: 'provider.response.completed', usage: { inputTokens: 100, outputTokens: 20 } }],
    [{ type: 'provider.response.started', responseId: 'answer' }, { type: 'provider.text.delta', delta: 'Grounded explanation.' }, { type: 'provider.response.completed', usage: { inputTokens: 4_000, outputTokens: 80 } }],
  ]);
  const service = new StructuredTaskApplicationService(await createAgentLoopApplicationService({ provider, workspace }));
  const result = await runOrdinaryTurnQualification({
    attemptId: 'three-file', humanInterventions: 0, service, session: createSession({ workspace }), input: THREE_FILE_INSPECTION_SMOKE.prompt,
    accept: (trace) => acceptThreeFileSmoke(trace, THREE_FILE_INSPECTION_SMOKE.paths).accepted,
  });

  assert.equal(result.qualifying, true);
  assert.deepEqual(result.trace.observedReadPaths, THREE_FILE_INSPECTION_SMOKE.paths);
  assert.equal(result.trace.finalResponse.present, true);
  assert.equal(acceptThreeFileSmoke({ ...result.trace, envelopePromotions: [
    { turnId: 'turn', fromProfileId: CONTEXT_PROFILE_REGISTRY.ordinary.id, toProfileId: CONTEXT_PROFILE_REGISTRY.medium.id, reason: 'provider-usage', tokens: 9_000, providerInputBudget: CONTEXT_PROFILE_REGISTRY.medium.providerInputTokens },
    { turnId: 'turn', fromProfileId: CONTEXT_PROFILE_REGISTRY.medium.id, toProfileId: CONTEXT_PROFILE_REGISTRY.large.id, reason: 'provider-usage', tokens: 17_000, providerInputBudget: CONTEXT_PROFILE_REGISTRY.large.providerInputTokens },
  ] }, THREE_FILE_INSPECTION_SMOKE.paths).accepted, true);
  assert.deepEqual(acceptThreeFileSmoke({ ...result.trace, observedReadPaths: ['plan.js'] }, THREE_FILE_INSPECTION_SMOKE.paths), {
    accepted: false,
    reasons: ['required reads missing: README.md, plan.test.js'],
  });
});
