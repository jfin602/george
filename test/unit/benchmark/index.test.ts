import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { BENCHMARK_CASES, BENCHMARK_SCHEMA_VERSION, BENCHMARK_SUITE_VERSION, aggregates, casesFor, compareBenchmark, deriveBenchmarkRecord, parseBenchmarkArguments, report, runBenchmark, writeBenchmarkArtifacts } from '../../../src/benchmark/index.ts';
import type { ApplicationEvent } from '../../../src/core/index.ts';

test('benchmark CLI parsing is bounded and keeps standard suite defaults', () => {
  assert.deepEqual(parseBenchmarkArguments([]), { suite: 'quick', repetitions: 1 });
  assert.deepEqual(parseBenchmarkArguments(['--suite', 'full', '--repetitions', '3', '--model', 'model']), { suite: 'full', repetitions: 3, model: 'model' });
  assert.throws(() => parseBenchmarkArguments(['--suite', 'slow']), /quick or full/);
  assert.throws(() => parseBenchmarkArguments(['--repetitions', '0']), /1 to 20/);
  assert.throws(() => parseBenchmarkArguments(['--unknown', 'x']), /Unknown benchmark flag/);
});

test('the versioned registry covers each v1 category and quick is a selection of it', () => {
  assert.deepEqual([...new Set(BENCHMARK_CASES.map((item) => item.category))].length, 8);
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
  const code = BENCHMARK_CASES.find((item) => item.id === 'code-understanding-001')!;
  const explanation = deriveBenchmarkRecord(code, [
    { type: 'tool.requested', turnId: 't', callId: 'read', name: 'read_file', arguments: '{"path":"architecture.ts"}' },
    { type: 'assistant.response.completed', turnId: 't', text: 'The dependency is adapter-to-core.' },
    { type: 'turn.completed', turnId: 't' },
  ], 1, 1, 'warm-repeat', 'model', 'http://127.0.0.1:1234');
  assert.equal(explanation.passed, true, 'objective fact checks allow an explanation without LLM grading');
  const tooManyTools = deriveBenchmarkRecord(BENCHMARK_CASES.find((item) => item.id === 'structured-tool-use-001')!, [...pass.slice(0, -1), { type: 'tool.requested', turnId: 't', callId: 'extra', name: 'read_file', arguments: '{"path":"answer.txt"}' }, { type: 'turn.completed', turnId: 't' }], 1, 1, 'warm-repeat', 'model', 'http://127.0.0.1:1234');
  assert.equal(tooManyTools.passed, false);
});

test('JSON artifacts, report, aggregates, and comparison remain stable', async (t) => {
  const root = await mkdtemp(join(tmpdir(), 'george-benchmark-test-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const record = deriveBenchmarkRecord(BENCHMARK_CASES[0]!, [{ type: 'turn.completed', turnId: 't' }], 10, 1, 'first-run-in-benchmark-process', 'model', 'http://127.0.0.1:1234');
  const results = { schemaVersion: BENCHMARK_SCHEMA_VERSION, suiteVersion: BENCHMARK_SUITE_VERSION, run: { id: 'fixture-run', startedAt: '2026-01-01T00:00:00.000Z', suite: 'quick' as const, repetitions: 1, gitCommit: 'abc', dirty: false, node: 'v26', platform: 'linux', architecture: 'x64', cpu: 'fixture', cpuCount: 1, memoryBytes: 1, provider: { type: 'lm-studio-responses' as const, origin: 'http://127.0.0.1:1234', model: 'model' } }, records: [record], aggregates: aggregates([record]) };
  const directory = await writeBenchmarkArtifacts(results, root);
  assert.match(await readFile(join(directory, 'results.json'), 'utf8'), /"schemaVersion": 1/);
  assert.match(await readFile(join(directory, 'report.md'), 'utf8'), /short-reasoning-001/);
  assert.match(report(results), /Response-start/);
  assert.match(await compareBenchmark(join(directory, 'results.json'), results), /elapsed ms delta/);
});

test('an unavailable loopback provider produces failed records instead of benchmark passes', async () => {
  const results = await runBenchmark({ suite: 'quick', repetitions: 1, baseUrl: 'http://127.0.0.1:1' });
  assert.equal(results.records.length, casesFor('quick').length);
  assert.ok(results.records.every((record) => !record.passed));
});
