import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
import test from 'node:test';

import { BENCHMARK_CASES, BENCHMARK_SCHEMA_VERSION, BENCHMARK_SUITE_VERSION, DEFAULT_AGENTIC_CONTEXT_BANDS, DEFAULT_CONTEXT_BANDS, aggregates, agenticContextCases, casesFor, colorizeBenchmarkTerminal, compareBenchmark, contextLadderCases, createBenchmarkApproval, createBenchmarkFixture, deriveBenchmarkRecord, formatBenchmarkCaseCompleted, formatBenchmarkCaseStarted, formatBenchmarkRunHeader, formatBenchmarkSummary, formatContextLadderSummary, matchesBenchmarkFixtureEdit, parseBenchmarkArguments, report, runBenchmark, runBenchmarkCase, summarizeBenchmarkTiming, writeBenchmarkArtifacts } from '../../../src/benchmark/index.ts';
import type { ApplicationEvent, ApprovalRequest, ModelProvider, ProviderEvent, ProviderRequest, ProviderStreamOptions } from '../../../src/core/index.ts';
import { assembleContext } from '../../../src/context/index.ts';

const execFileAsync = promisify(execFile);

class ScriptedProvider implements ModelProvider {
  calls: ProviderRequest[] = [];
  private readonly rounds: (readonly ProviderEvent[])[];
  constructor(rounds: readonly (readonly ProviderEvent[])[]) { this.rounds = [...rounds]; }
  async *stream(request: ProviderRequest, _options: ProviderStreamOptions = {}): AsyncGenerator<ProviderEvent> { this.calls.push(request); yield* this.rounds.shift() ?? []; }
}

test('benchmark CLI parsing is bounded and keeps standard suite defaults', () => {
  assert.deepEqual(parseBenchmarkArguments([]), { suite: 'quick', repetitions: 1 });
  assert.deepEqual(parseBenchmarkArguments(['--suite', 'full', '--repetitions', '3', '--model', 'model']), { suite: 'full', repetitions: 3, model: 'model' });
  assert.throws(() => parseBenchmarkArguments(['--suite', 'slow']), /quick, full, context, or agentic-context/);
  assert.throws(() => parseBenchmarkArguments(['--repetitions', '0']), /1 to 20/);
  assert.throws(() => parseBenchmarkArguments(['--unknown', 'x']), /Unknown benchmark flag/);
});

test('agentic context suite has isolated bands and stable family order', () => {
  assert.deepEqual(DEFAULT_AGENTIC_CONTEXT_BANDS, [2048, 4096, 6144, 8192, 10240, 12288]);
  assert.deepEqual(parseBenchmarkArguments(['--suite', 'agentic-context', '--agentic-context-bands', '6144,2048']), { suite: 'agentic-context', repetitions: 1, agenticContextBands: [2048, 6144] });
  assert.throws(() => parseBenchmarkArguments(['--suite', 'quick', '--agentic-context-bands', '2048']), /require --suite agentic-context/);
  assert.throws(() => parseBenchmarkArguments(['--suite', 'agentic-context', '--context-bands', '2048']), /require --suite context/);
  assert.throws(() => parseBenchmarkArguments(['--suite', 'agentic-context', '--agentic-context-bands', '2048,2048']), /duplicates/);
  assert.deepEqual(agenticContextCases([4096, 2048]).map((item) => item.id), [
    'agentic-inspection-2048-001', 'agentic-investigation-2048-001', 'agentic-edit-validation-2048-001',
    'agentic-inspection-4096-001', 'agentic-investigation-4096-001', 'agentic-edit-validation-4096-001',
  ]);
  assert.deepEqual(casesFor('agentic-context', [999], [2048]).map((item) => item.band), [2048, 2048, 2048]);
});

test('context suite parses default and custom deterministic ladder bands', () => {
  assert.deepEqual(DEFAULT_CONTEXT_BANDS, [2048, 4096, 8192, 16384]);
  assert.deepEqual(casesFor('context').map((item) => item.band), DEFAULT_CONTEXT_BANDS);
  assert.deepEqual(parseBenchmarkArguments(['--suite', 'context']), { suite: 'context', repetitions: 1 });
  assert.deepEqual(parseBenchmarkArguments(['--suite', 'context', '--context-bands', '24576,8192,2048,4096']), { suite: 'context', repetitions: 1, contextBands: [2048, 4096, 8192, 24576] });
  assert.throws(() => parseBenchmarkArguments(['--suite', 'context', '--context-bands', '2048,,4096']), /comma-separated/);
  assert.throws(() => parseBenchmarkArguments(['--suite', 'context', '--context-bands', '2048,2048']), /duplicates/);
  assert.throws(() => parseBenchmarkArguments(['--suite', 'context', '--context-bands', '0']), /1 to 24576/);
  assert.throws(() => parseBenchmarkArguments(['--suite', 'context', '--context-bands', '24577']), /1 to 24576/);
  assert.throws(() => parseBenchmarkArguments(['--suite', 'quick', '--context-bands', '2048']), /require --suite context/);
});

test('generated context ladder cases retain identity, order, exact sentinels, and no tools', async () => {
  const cases = contextLadderCases([8192, 2048, 4096]);
  assert.deepEqual(cases.map((item) => ({ id: item.id, band: item.band })), [
    { id: 'long-context-2048-001', band: 2048 }, { id: 'long-context-4096-001', band: 4096 }, { id: 'long-context-8192-001', band: 8192 },
  ]);
  for (const case_ of cases) {
    assert.equal(case_.fixture, 'none');
    assert.equal(case_.expected.answer, `SENTINEL_${case_.band}_ORCHID`);
    assert.match(case_.input(), new RegExp(`FACT_B=SENTINEL_${case_.band}_ORCHID`));
    assert.match(case_.input(), /noise evidence remains irrelevant/);
    assert.equal(case_.expected.tools, undefined);
  }
  const large = contextLadderCases([24_576])[0]!;
  const assembled = await assembleContext({ invariants: 'invariant', userInput: large.input(), maxTokens: 24_576, optionalMaxTokens: 20_000 });
  assert.ok(assembled.estimatedTokens <= 24_576);
  assert.deepEqual(casesFor('quick').map((item) => item.id), BENCHMARK_CASES.filter((item) => item.suites.includes('quick')).map((item) => item.id));
  assert.deepEqual(casesFor('full').map((item) => item.id), BENCHMARK_CASES.filter((item) => item.suites.includes('full')).map((item) => item.id));
});

test('agentic fixtures stay source-bounded and scripted runs use the normal coding tool surface', async (t) => {
  const [inspection, investigation, repair] = agenticContextCases([12_288]);
  const root = await createBenchmarkFixture(inspection!.fixture, inspection);
  t.after(() => rm(root, { recursive: true, force: true }));
  for (const path of ['.george/instructions.md', 'AGENTS.md', 'docs/task-brief.md', 'docs/evidence-notes.md']) assert.ok((await readFile(join(root, path))).byteLength <= 64 * 1024);
  assert.match(await readFile(join(root, '.george/instructions.md'), 'utf8'), /local fixture/);
  assert.match(await readFile(join(root, 'docs/ownership.md'), 'utf8'), /AGENTIC_INSPECTION_12288_ORCHID/);
  const unexpected = deriveBenchmarkRecord(inspection!, [
    { type: 'tool.requested', turnId: 't', callId: 'read', name: 'read_file', arguments: '{}' },
    { type: 'tool.requested', turnId: 't', callId: 'external', name: 'parallel_search', arguments: '{}' },
    { type: 'assistant.response.completed', turnId: 't', text: inspection!.expected.answer! }, { type: 'turn.completed', turnId: 't' },
  ], 1, 1, 'warm-repeat', 'scripted', 'http://127.0.0.1:1234');
  assert.match(unexpected.failureReason ?? '', /Unexpected tools: parallel_search/);

  const run = async (case_: NonNullable<typeof inspection>, rounds: readonly (readonly ProviderEvent[])[]) => {
    const provider = new ScriptedProvider(rounds);
    const record = await runBenchmarkCase(case_, provider, { suite: 'agentic-context', repetitions: 1 }, 1, 'first-run-in-benchmark-process', 'scripted', 'http://127.0.0.1:1234');
    assert.ok(provider.calls[0]?.tools?.some((tool) => tool.name === 'parallel_search'));
    assert.ok(provider.calls[0]?.tools?.some((tool) => tool.name === 'read_file'));
    assert.equal(record.passed, true, JSON.stringify(record.failureReason));
    assert.equal(record.contextSelection?.mode, 'adaptive');
    assert.ok(record.contextSelection?.attemptedProfileIds.length);
    assert.deepEqual(Object.keys(record.contextSelection?.categoryTokens ?? {}).toSorted(), ['conversation', 'core', 'project', 'routed', 'skills', 'task', 'toolResults', 'tools']);
    assert.deepEqual(Object.keys(record.contextSelection?.dispositions ?? {}).toSorted(), ['deferred', 'duplicate', 'failed', 'omitted', 'routed']);
    const rendered = report({ schemaVersion: BENCHMARK_SCHEMA_VERSION, suiteVersion: BENCHMARK_SUITE_VERSION, run: { id: 'agentic', startedAt: '', suite: 'agentic-context', repetitions: 1, gitCommit: 'abc', dirty: false, node: 'v26', platform: 'linux', architecture: 'x64', cpu: 'fixture', cpuCount: 1, memoryBytes: 1, provider: { type: 'lm-studio-responses', origin: 'http://127.0.0.1:1234', model: 'scripted' } }, records: [record], aggregates: aggregates([record]) });
    assert.match(rendered, /Context selection/);
    for (const artifact of [JSON.stringify(record), rendered]) assert.doesNotMatch(artifact, /component local-workflow-1 owns a compact local contract/);
  };
  let response = 0;
  const complete = (events: readonly ProviderEvent[]): readonly ProviderEvent[] => [{ type: 'provider.response.started', responseId: `script-${++response}` }, ...events, { type: 'provider.response.completed' }];
  await run(inspection!, [complete([{ type: 'provider.tool.call', callId: 'read', name: 'read_file', arguments: '{"path":"docs/ownership.md"}' }]), complete([{ type: 'provider.text.delta', delta: inspection!.expected.answer! }])]);
  await run(investigation!, ['entry.txt', 'module-map.txt', 'boundary.txt', 'evidence.txt'].map((path, index) => complete([{ type: 'provider.tool.call', callId: `read-${index}`, name: 'read_file', arguments: JSON.stringify({ path: `investigation/${path}` }) }])).concat([complete([{ type: 'provider.text.delta', delta: investigation!.expected.answer! }])]));
  const expectedSha256 = createHash('sha256').update('export const label = (value) => value.trim();\n').digest('hex');
  await run(repair!, [complete([{ type: 'provider.tool.call', callId: 'read', name: 'read_file', arguments: '{"path":"src/label.js"}' }]), complete([{ type: 'provider.tool.call', callId: 'write', name: 'write_file', arguments: JSON.stringify({ path: 'src/label.js', content: repair!.expected.edit!.content, expectedSha256 }) }]), complete([{ type: 'provider.text.delta', delta: repair!.expected.answer! }])]);
});

test('the v3 standard registry keeps quick as a selection of it', () => {
  assert.deepEqual([...new Set(BENCHMARK_CASES.map((item) => item.category))].length, 10);
  assert.ok(casesFor('quick').every((item) => BENCHMARK_CASES.includes(item)));
  assert.ok(casesFor('full').length > casesFor('quick').length);
  assert.equal(new Set(BENCHMARK_CASES.map((item) => item.id)).size, BENCHMARK_CASES.length);
});

test('event-derived records retain correctness separately from timing and failed streams cannot pass', () => {
  const case_ = BENCHMARK_CASES[0]!;
  const pass: ApplicationEvent[] = [
    { type: 'context.assembled', turnId: 't', diagnostics: { estimatedTokens: 22 } as never },
    { type: 'provider.attempt.started', turnId: 't', runId: 'r', attemptId: 'a' },
    { type: 'provider.response.started', responseId: 'response' },
    { type: 'provider.text.delta', delta: '42' },
    { type: 'provider.response.completed', usage: { inputTokens: 12, outputTokens: 1 } },
    { type: 'assistant.response.completed', turnId: 't', text: '42' },
    { type: 'turn.completed', turnId: 't' },
  ];
  const record = deriveBenchmarkRecord(case_, pass, 25, 1, 'first-run-in-benchmark-process', 'model', 'http://127.0.0.1:1234', undefined, [0, 1, 5, 8, 15, 16, 25]);
  assert.equal(record.passed, true);
  assert.equal(record.responseStartLatencyMs, 4);
  assert.equal(record.firstOutputLatencyMs, 7);
  assert.equal(record.actualInputTokens, 12);
  const failed = deriveBenchmarkRecord(case_, pass.slice(0, -1), 25, 1, 'warm-repeat', 'model', 'http://127.0.0.1:1234');
  assert.equal(failed.passed, false);
  const tooManyTools = deriveBenchmarkRecord(BENCHMARK_CASES.find((item) => item.id === 'structured-tool-use-001')!, [...pass.slice(0, -1), { type: 'tool.requested', turnId: 't', callId: 'extra', name: 'read_file', arguments: '{"path":"answer.txt"}' }, { type: 'turn.completed', turnId: 't' }], 1, 1, 'warm-repeat', 'model', 'http://127.0.0.1:1234');
  assert.equal(tooManyTools.passed, false);
});

test('code-understanding requires one read and its exact deterministic answer', () => {
  const case_ = BENCHMARK_CASES.find((item) => item.id === 'code-understanding-001')!;
  assert.equal(case_.version, 3);
  assert.match(case_.input(), /Use read_file exactly once to inspect architecture\.ts\. Then return exactly adapter-to-core\./);
  assert.deepEqual(case_.expected, { answer: 'adapter-to-core', tools: ['read_file'], toolCallRange: [1, 1] });
  const events: ApplicationEvent[] = [
    { type: 'tool.requested', turnId: 't', callId: 'read', name: 'read_file', arguments: '{"path":"architecture.ts"}' },
    { type: 'assistant.response.completed', turnId: 't', text: 'adapter-to-core' },
    { type: 'turn.completed', turnId: 't' },
  ];
  assert.equal(deriveBenchmarkRecord(case_, events, 1, 1, 'warm-repeat', 'model', 'http://127.0.0.1:1234').passed, true);
  assert.equal(deriveBenchmarkRecord(case_, events.map((event) => event.type === 'assistant.response.completed' ? { ...event, text: 'The dependency is adapter-to-core.' } : event), 1, 1, 'warm-repeat', 'model', 'http://127.0.0.1:1234').passed, false);
  assert.equal(deriveBenchmarkRecord(case_, events.filter((event) => event.type !== 'tool.requested'), 1, 1, 'warm-repeat', 'model', 'http://127.0.0.1:1234').passed, false);
});

test('multi-round fixtures require chained tool evidence and deterministic results', async (t) => {
  const investigation = BENCHMARK_CASES.find((item) => item.id === 'multi-round-repository-001')!;
  assert.match(investigation.input(), /Start with investigation\/entry\.txt/);
  assert.deepEqual(investigation.expected, { answer: 'REPOSITORY_TRACE_CONFIRMED', tools: ['read_file'], toolCallRange: [4, 4] });
  const investigationEvents: ApplicationEvent[] = [
    ...Array.from({ length: 4 }, (_, index) => ({ type: 'tool.requested' as const, turnId: 't', callId: `read-${index}`, name: 'read_file', arguments: '{}' })),
    { type: 'assistant.response.completed', turnId: 't', text: 'REPOSITORY_TRACE_CONFIRMED' }, { type: 'turn.completed', turnId: 't' },
  ];
  assert.equal(deriveBenchmarkRecord(investigation, investigationEvents, 1, 1, 'warm-repeat', 'model', 'http://127.0.0.1:1234').passed, true);
  const workflow = BENCHMARK_CASES.find((item) => item.id === 'multi-round-coding-workflow-001')!;
  assert.match(workflow.input(), /node --test test\/contract\.test\.js/);
  assert.deepEqual(workflow.expected.validation, { executable: 'node', arguments: ['--test', 'test/contract.test.js'] });
  const workflowEvents: ApplicationEvent[] = [
    ...Array.from({ length: 5 }, (_, index) => ({ type: 'tool.requested' as const, turnId: 't', callId: `read-${index}`, name: 'read_file', arguments: '{}' })),
    { type: 'tool.requested', turnId: 't', callId: 'write', name: 'write_file', arguments: '{}' }, { type: 'tool.requested', turnId: 't', callId: 'test', name: 'run_process', arguments: '{}' },
    { type: 'assistant.response.completed', turnId: 't', text: 'REPAIR_VERIFIED' }, { type: 'turn.completed', turnId: 't' },
  ];
  assert.equal(deriveBenchmarkRecord(workflow, workflowEvents, 1, 1, 'warm-repeat', 'model', 'http://127.0.0.1:1234').passed, true);
  assert.equal(deriveBenchmarkRecord(workflow, workflowEvents.map((event) => event.type === 'assistant.response.completed' ? { ...event, text: 'fixed' } : event), 1, 1, 'warm-repeat', 'model', 'http://127.0.0.1:1234').passed, false);
  assert.equal(workflow.version, 2);

  const root = await createBenchmarkFixture(workflow.fixture);
  t.after(() => rm(root, { recursive: true, force: true }));
  assert.equal(await readFile(join(root, 'README.md'), 'utf8'), 'Read internal/incident.txt to begin the repair trail.\n');
  assert.equal(await readFile(join(root, 'internal', 'ownership.txt'), 'utf8'), 'Read src/formatter.js to inspect the defect, then read test/contract.test.js for the required behavior.\n');
  assert.equal(await readFile(join(root, 'src', 'formatter.js'), 'utf8'), 'export const formatLabel = (value) => value.trim();\n');
  assert.equal(await matchesBenchmarkFixtureEdit(root, workflow.expected.edit), false);
  await writeFile(join(root, workflow.expected.edit!.path), workflow.expected.edit!.content);
  assert.equal(await matchesBenchmarkFixtureEdit(root, workflow.expected.edit), true);
  await execFileAsync(process.execPath, [...workflow.expected.validation!.arguments], { cwd: root });
  await writeFile(join(root, workflow.expected.edit!.path), "export const formatLabel = (value) => value.trim().toLowerCase();\n");
  assert.equal(await matchesBenchmarkFixtureEdit(root, workflow.expected.edit), false);

  const approval = createBenchmarkApproval(workflow);
  const request = (toolName: string, path?: string, argv?: readonly string[]): ApprovalRequest => ({ id: toolName, toolName, execution: {} as never, ...(path === undefined ? {} : { target: { path, alreadyDirty: false } }), ...(argv === undefined ? {} : { process: { executable: 'node', argv, cwd: '.', warning: '' } }) });
  assert.equal(await approval.request(request('write_file', 'src/formatter.js')), 'allow_once');
  assert.equal(await approval.request(request('write_file', 'src/other.js')), 'deny');
  assert.equal(await approval.request(request('run_process', undefined, ['--test', 'test/contract.test.js'])), 'allow_once');
  assert.equal(await approval.request(request('run_process', undefined, ['--test', 'test/other.test.js'])), 'deny');
});

test('event timing attributes provider, tools, approval, and non-overlapping residual time', () => {
  const events: ApplicationEvent[] = [
    { type: 'provider.attempt.started', turnId: 't', runId: 'r', attemptId: 'one' }, { type: 'provider.response.completed' },
    { type: 'tool.started', turnId: 't', callId: 'one', name: 'read_file' }, { type: 'tool.started', turnId: 't', callId: 'two', name: 'read_file' },
    { type: 'tool.completed', turnId: 't', callId: 'one', name: 'read_file', result: { ok: true, value: null } }, { type: 'tool.completed', turnId: 't', callId: 'two', name: 'read_file', result: { ok: true, value: null } },
    { type: 'approval.requested', turnId: 't', callId: 'write', request: {} as never }, { type: 'approval.allowed', turnId: 't', callId: 'write', request: {} as never },
    { type: 'provider.attempt.started', turnId: 't', runId: 'r', attemptId: 'two' }, { type: 'provider.response.completed' },
    { type: 'assistant.response.completed', turnId: 't', text: '42' }, { type: 'turn.completed', turnId: 't' },
  ];
  const record = deriveBenchmarkRecord(BENCHMARK_CASES[0]!, events, 60, 1, 'first-run-in-benchmark-process', 'model', 'http://127.0.0.1:1234', undefined, [0, 10, 12, 14, 25, 26, 27, 31, 32, 52, 53, 60]);
  assert.deepEqual({ provider: record.providerActiveMs, round: record.providerRoundActiveMs, average: record.averageProviderRoundMs, tools: record.toolExecutionMs, approval: record.approvalWaitMs, other: record.otherMs, rounds: record.providerRounds }, { provider: 30, round: 30, average: 15, tools: 14, approval: 4, other: 12, rounds: 2 });
  assert.equal(record.providerActivePercent, 50);
  const timing = summarizeBenchmarkTiming([record]);
  assert.deepEqual({ provider: timing.providerActiveMs, tools: timing.toolExecutionMs, other: timing.otherMs, rounds: timing.providerRounds, average: timing.averageProviderRoundMs }, { provider: 30, tools: 14, other: 12, rounds: 2, average: 15 });
  const aggregate = summarizeBenchmarkTiming([record, record]);
  assert.deepEqual({ provider: aggregate.providerActiveMs, tools: aggregate.toolExecutionMs, other: aggregate.otherMs, rounds: aggregate.providerRounds, average: aggregate.averageProviderRoundMs }, { provider: 60, tools: 28, other: 24, rounds: 4, average: 15 });
});

test('JSON artifacts, report, aggregates, and comparison remain stable', async (t) => {
  const root = await mkdtemp(join(tmpdir(), 'george-benchmark-test-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const record = deriveBenchmarkRecord(BENCHMARK_CASES[0]!, [{ type: 'turn.completed', turnId: 't' }], 10, 1, 'first-run-in-benchmark-process', 'model', 'http://127.0.0.1:1234');
  const results = { schemaVersion: BENCHMARK_SCHEMA_VERSION, suiteVersion: BENCHMARK_SUITE_VERSION, run: { id: 'fixture-run', startedAt: '2026-01-01T00:00:00.000Z', suite: 'quick' as const, repetitions: 1, gitCommit: 'abc', dirty: false, node: 'v26', platform: 'linux', architecture: 'x64', cpu: 'fixture', cpuCount: 1, memoryBytes: 1, provider: { type: 'lm-studio-responses' as const, origin: 'http://127.0.0.1:1234', model: 'model' } }, records: [record], aggregates: aggregates([record]) };
  const directory = await writeBenchmarkArtifacts(results, root);
  assert.match(await readFile(join(directory, 'results.json'), 'utf8'), /"schemaVersion": 3/);
  assert.match(await readFile(join(directory, 'report.md'), 'utf8'), /short-reasoning-001/);
  assert.match(report(results), /Provider-active ms/);
  assert.doesNotMatch(report(results), /\u001b\[/);
  assert.match(await compareBenchmark(join(directory, 'results.json'), results), /provider-active ms delta/);
  await writeFile(join(root, 'v1.json'), JSON.stringify({ ...results, schemaVersion: 1, suiteVersion: 'v1' }));
  await assert.rejects(compareBenchmark(join(root, 'v1.json'), results), /Cannot compare benchmark schema\/suite/);
  await writeFile(join(root, 'v2.json'), JSON.stringify({ ...results, schemaVersion: 2, suiteVersion: 'v2' }));
  assert.match(await compareBenchmark(join(root, 'v2.json'), results), /Legacy v2 artifact/);
});

test('benchmark progress and result formatting is readable without terminal control sequences', () => {
  const pass = deriveBenchmarkRecord(BENCHMARK_CASES[0]!, [{ type: 'provider.attempt.started', turnId: 't', runId: 'r', attemptId: 'a' }, { type: 'provider.text.delta', delta: '42' }, { type: 'provider.response.completed', usage: { inputTokens: 1_284, outputTokens: 3 } }, { type: 'assistant.response.completed', turnId: 't', text: '42' }, { type: 'turn.completed', turnId: 't' }], 12_430, 1, 'first-run-in-benchmark-process', 'model', 'http://127.0.0.1:1234', undefined, [0, 410, 500, 510, 12_430]);
  const started = formatBenchmarkCaseStarted({ current: 1, total: 36, case_: BENCHMARK_CASES[0]!, repetition: 1, repetitions: 3 });
  const completed = formatBenchmarkCaseCompleted({ current: 1, total: 36, case_: BENCHMARK_CASES[0]!, repetition: 1, repetitions: 3, record: pass });
  assert.match(started, /^\[ 1\/36\] RUN  short-reasoning-001/);
  assert.match(completed, /PASS short-reasoning-001.*12430ms \| 12\.43s/);
  assert.match(completed, /first output 410ms \| 0\.41s \| input 1,284 \| output 3/);
  assert.match(completed, /provider 1 attempt \/ 1 round \| active 500ms \| 0\.50s \(4\.0%\) \| tools 0 \| retries 0/);
  assert.match(formatBenchmarkSummary({ ...({ schemaVersion: BENCHMARK_SCHEMA_VERSION, suiteVersion: BENCHMARK_SUITE_VERSION, run: { id: 'timing', startedAt: '', suite: 'quick' as const, repetitions: 1, gitCommit: 'abc', dirty: false, node: 'v26', platform: 'linux', architecture: 'x64', cpu: 'fixture', cpuCount: 1, memoryBytes: 1, provider: { type: 'lm-studio-responses' as const, origin: 'http://127.0.0.1:1234', model: 'model' } }, records: [pass], aggregates: aggregates([pass]) }) }, 12_430, 'artifacts'), /Provider\/model: 500ms \| 0\.50s \(4\.0%\)/);
  assert.equal(completed.includes('\u001b['), false);
  assert.match(formatBenchmarkRunHeader({ suite: 'quick', suiteVersion: BENCHMARK_SUITE_VERSION, repetitions: 1, caseCount: 4, totalExecutions: 4, gitCommit: 'abc', dirty: false, provider: { type: 'lm-studio-responses', origin: 'http://127.0.0.1:1234', model: 'model' } }), /George: abc \(clean\)/);
});

test('context ladder summary reports one deterministic row per band', () => {
  const [small, large] = contextLadderCases([2048, 4096]);
  const record = (case_: NonNullable<typeof small>, input: number, elapsed: number, active: number, firstOutput: number, passed = true) => ({
    ...deriveBenchmarkRecord(case_, [{ type: 'turn.completed', turnId: 't' }], elapsed, 1, 'warm-repeat', 'model', 'http://127.0.0.1:1234'),
    actualInputTokens: input, elapsedMs: elapsed, providerActiveMs: active, firstOutputLatencyMs: firstOutput, passed,
  });
  const records = [record(small!, 2_100, 100, 80, 20), record(small!, 2_200, 120, 90, 30), record(large!, 4_100, 200, 170, 60, false)];
  const rendered = formatContextLadderSummary(records);
  assert.match(rendered, /Band \| Provider input tokens \| First output \| Provider\/model \| Elapsed \| Result/);
  assert.match(rendered, /2048 \| 2,200 \| 30ms \| 90ms \| 120ms \| PASS \(2\/2\)/);
  assert.match(rendered, /4096 \| 4,100 \| 60ms \| 170ms \| 200ms \| FAIL \(0\/1\)/);
  const results = { schemaVersion: BENCHMARK_SCHEMA_VERSION, suiteVersion: BENCHMARK_SUITE_VERSION, run: { id: 'context', startedAt: '', suite: 'context' as const, repetitions: 1, gitCommit: 'abc', dirty: false, node: 'v26', platform: 'linux', architecture: 'x64', cpu: 'fixture', cpuCount: 1, memoryBytes: 1, provider: { type: 'lm-studio-responses' as const, origin: 'http://127.0.0.1:1234', model: 'model' } }, records, aggregates: aggregates(records) };
  assert.match(formatBenchmarkSummary(results, 200, 'artifacts'), /Context ladder/);
  assert.match(report(results), /## Context ladder/);
});

test('benchmark failure formatting keeps the deterministic reason visible', () => {
  const case_ = BENCHMARK_CASES.find((item) => item.id === 'structured-tool-use-001')!;
  const failed = deriveBenchmarkRecord(case_, [{ type: 'tool.requested', turnId: 't', callId: 'one', name: 'read_file', arguments: '{}' }, { type: 'tool.requested', turnId: 't', callId: 'two', name: 'read_file', arguments: '{}' }, { type: 'turn.completed', turnId: 't' }], 21_400, 1, 'warm-repeat', 'model', 'http://127.0.0.1:1234');
  const rendered = formatBenchmarkCaseCompleted({ current: 12, total: 36, case_, repetition: 1, repetitions: 3, record: failed });
  assert.match(rendered, /^\[12\/36\] FAIL structured-tool-use-001/);
  assert.match(rendered, /Expected 1-1 tool calls; observed 2\./);
  const results = { schemaVersion: BENCHMARK_SCHEMA_VERSION, suiteVersion: BENCHMARK_SUITE_VERSION, run: { id: 'fixture-run', startedAt: '2026-01-01T00:00:00.000Z', suite: 'quick' as const, repetitions: 1, gitCommit: 'abc', dirty: false, node: 'v26', platform: 'linux', architecture: 'x64', cpu: 'fixture', cpuCount: 1, memoryBytes: 1, provider: { type: 'lm-studio-responses' as const, origin: 'http://127.0.0.1:1234', model: 'model' } }, records: [failed], aggregates: aggregates([failed]) };
  assert.match(formatBenchmarkSummary(results, 272_000, 'artifacts/benchmarks/fixture-run'), /Elapsed:\s+272000ms \| 272\.00s/);
});

test('benchmark terminal color is semantic and opt-in', () => {
  const plain = 'Benchmark complete\n[ 3/33] RUN  case\n[ 3/33] PASS case 12ms | 0.01s\n[ 3/33] FAIL case 12ms | 0.01s\nArtifacts:     artifacts/benchmarks/run\nInput tokens:  -';
  const colored = colorizeBenchmarkTerminal(plain, true);
  assert.equal(colorizeBenchmarkTerminal(plain, false), plain);
  assert.equal(colored.replace(/\u001b\[[0-9;]*m/g, ''), plain);
  assert.match(colored, /\u001b\[1mBenchmark complete/);
  assert.match(colored, /\u001b\[36mRUN/);
  assert.match(colored, /\u001b\[32mPASS/);
  assert.match(colored, /\u001b\[31mFAIL/);
  assert.match(colored, /\u001b\[33m12ms \| 0\.01s/);
  assert.match(colored, /\u001b\[36martifacts\/benchmarks\/run/);
});

test('an unavailable loopback provider produces failed records instead of benchmark passes', async () => {
  const progress: string[] = [];
  const results = await runBenchmark({ suite: 'quick', repetitions: 1, baseUrl: 'http://127.0.0.1:1' }, { onRunStarted: () => progress.push('header'), onCaseStarted: ({ current }) => progress.push(`start-${current}`), onCaseCompleted: ({ current }) => progress.push(`complete-${current}`) });
  assert.equal(results.records.length, casesFor('quick').length);
  assert.ok(results.records.every((record) => !record.passed));
  assert.ok(results.records.every((record) => record.failureReason !== undefined));
  assert.deepEqual(progress, ['header', ...results.records.flatMap((_, index) => [`start-${index + 1}`, `complete-${index + 1}`])]);
});
