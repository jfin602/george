import { execFile } from 'node:child_process';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { cpus, platform, release, tmpdir, totalmem } from 'node:os';
import { join, resolve } from 'node:path';
import { promisify } from 'node:util';

import { createCodingWorkflowApplicationService, createAgentLoopApplicationService } from '../application/index.ts';
import { createSession, DEFAULT_CONTEXT_PROFILE, resolveGeorgeConfig, type ApplicationEvent, type ApprovalPort, type ModelProvider } from '../core/index.ts';
import { LmStudioResponsesProvider } from '../provider/index.ts';

const execFileAsync = promisify(execFile);
export const BENCHMARK_SCHEMA_VERSION = 1;
export const BENCHMARK_SUITE_VERSION = 'v1';
const DEFAULT_REPETITIONS = 1;

export type BenchmarkSuiteName = 'quick' | 'full';
export type BenchmarkCategory = 'short-reasoning' | 'long-context-retrieval' | 'code-understanding' | 'structured-tool-use' | 'independent-multi-tool-inspection' | 'coding-edit-workflow' | 'extended-agent-loop' | 'compaction-noisy-evidence';
export type BenchmarkOptions = Readonly<{ suite: BenchmarkSuiteName; model?: string; baseUrl?: string; repetitions: number; label?: string; compare?: string; artifactRoot?: string }>;
export type BenchmarkCase = Readonly<{ id: string; version: number; category: BenchmarkCategory; suites: readonly BenchmarkSuiteName[]; contextProfileId?: string; fixture: 'none' | 'code' | 'tools' | 'edit' | 'extended'; input: (band?: number) => string; expected: Readonly<{ answer?: string; requiredText?: string; tools?: readonly string[]; toolCallRange?: readonly [number, number]; edit?: Readonly<{ path: string; content: string }> }>; band?: number }>;
export type BenchmarkRecord = Readonly<{
  suiteVersion: typeof BENCHMARK_SUITE_VERSION; caseId: string; caseVersion: number; category: BenchmarkCategory; label?: string; timestamp: string; repetition: number; execution: 'first-run-in-benchmark-process' | 'warm-repeat';
  model: string; provider: Readonly<{ type: 'lm-studio-responses'; origin: string }>; contextProfileId?: string; estimatedContextTokens?: number; actualInputTokens?: number; actualOutputTokens?: number;
  responseStartLatencyMs?: number; firstOutputLatencyMs?: number; elapsedMs: number; providerAttempts: number; providerRounds: number; retries: number; toolCalls: number; uniqueTools: readonly string[]; validationCount: number; rssBytes: number; heapUsedBytes: number;
  passed: boolean; failureReason?: string; notes: readonly string[];
}>;
export type BenchmarkResults = Readonly<{ schemaVersion: typeof BENCHMARK_SCHEMA_VERSION; suiteVersion: typeof BENCHMARK_SUITE_VERSION; run: Readonly<{ id: string; startedAt: string; label?: string; suite: BenchmarkSuiteName; repetitions: number; gitCommit: string; dirty: boolean; node: string; platform: string; architecture: string; cpu: string; cpuCount: number; memoryBytes: number; provider: Readonly<{ type: 'lm-studio-responses'; origin: string; model: string }> }>; records: readonly BenchmarkRecord[]; aggregates: Readonly<Record<string, Readonly<{ passed: number; total: number; elapsedMs: Readonly<{ min: number; median: number; max: number }> }>>> }>;

const repeat = (value: string, count: number): string => Array.from({ length: count }, () => value).join('');
const longInput = (band: number, token: string): string => `Return exactly ${token}. Do not use tools.\n\n${repeat('noise evidence remains irrelevant. ', Math.max(1, Math.floor((band * 4) / 32)))}\nFACT_A=amber\n${repeat('more ordinary project-like material. ', 8)}\nFACT_B=${token}\n${repeat('trailing material. ', 8)}`;

/** One registry serves both selections; suite mode only filters these stable definitions. */
export const BENCHMARK_CASES: readonly BenchmarkCase[] = [
  { id: 'short-reasoning-001', version: 1, category: 'short-reasoning', suites: ['quick', 'full'], fixture: 'none', input: () => 'Return exactly 42. Do not explain.', expected: { answer: '42' } },
  ...[2048, 4096, 8192, 16384].map((band) => ({ id: `long-context-${band}-001`, version: 1 as const, category: 'long-context-retrieval' as const, suites: band === 2048 ? ['quick', 'full'] as const : ['full'] as const, fixture: 'none' as const, band, contextProfileId: 'qwen3-coder-30b-a3b-instruct-q4_k_m-lm-studio-32k', input: () => longInput(band, `SENTINEL_${band}_ORCHID`), expected: { answer: `SENTINEL_${band}_ORCHID` } })),
  { id: 'code-understanding-001', version: 2, category: 'code-understanding', suites: ['full'], fixture: 'code', input: () => 'Use read_file to inspect architecture.ts. Explain the dependency direction.', expected: { requiredText: 'adapter-to-core', tools: ['read_file'], toolCallRange: [1, 1] } },
  { id: 'structured-tool-use-001', version: 1, category: 'structured-tool-use', suites: ['quick', 'full'], fixture: 'tools', input: () => 'Use read_file exactly once on answer.txt, then return exactly its content.', expected: { answer: 'STRUCTURED_TOOL_OK', tools: ['read_file'], toolCallRange: [1, 1] } },
  { id: 'independent-multi-tool-001', version: 1, category: 'independent-multi-tool-inspection', suites: ['quick', 'full'], fixture: 'tools', input: () => 'Use read_file once each on alpha.txt, beta.txt, and gamma.txt. Then return exactly ALPHA-BETA-GAMMA.', expected: { answer: 'ALPHA-BETA-GAMMA', tools: ['read_file'], toolCallRange: [3, 3] } },
  { id: 'coding-edit-001', version: 1, category: 'coding-edit-workflow', suites: ['full'], fixture: 'edit', input: () => 'Read target.txt. Write answer.txt with exactly PATCHED. Then state exactly PATCHED.', expected: { answer: 'PATCHED', tools: ['read_file', 'write_file'], edit: { path: 'answer.txt', content: 'PATCHED' } } },
  { id: 'extended-agent-loop-001', version: 1, category: 'extended-agent-loop', suites: ['full'], fixture: 'extended', input: () => 'Read target.txt, write answer.txt with exactly FIXED, then return exactly FIXED.', expected: { answer: 'FIXED', tools: ['read_file', 'write_file'], edit: { path: 'answer.txt', content: 'FIXED' } } },
  { id: 'compaction-noisy-evidence-001', version: 1, category: 'compaction-noisy-evidence', suites: ['full'], fixture: 'none', input: () => longInput(8192, 'NOISY_EVIDENCE_PRESERVED'), expected: { answer: 'NOISY_EVIDENCE_PRESERVED' } },
];

export function parseBenchmarkArguments(argv: readonly string[]): BenchmarkOptions | Readonly<{ help: true }> {
  const result: { suite: BenchmarkSuiteName; model?: string; baseUrl?: string; repetitions: number; label?: string; compare?: string; artifactRoot?: string } = { suite: 'quick', repetitions: DEFAULT_REPETITIONS };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index]!;
    if (argument === '--help' || argument === '-h') return { help: true };
    if (!['--suite', '--model', '--base-url', '--repetitions', '--label', '--compare', '--artifacts'].includes(argument)) throw new Error(`Unknown benchmark flag: ${argument}`);
    const value = argv[++index];
    if (value === undefined || value.startsWith('--')) throw new Error(`Missing value for ${argument}.`);
    if (argument === '--suite') { if (value !== 'quick' && value !== 'full') throw new Error('Suite must be quick or full.'); result.suite = value; }
    if (argument === '--model') result.model = value;
    if (argument === '--base-url') result.baseUrl = value;
    if (argument === '--label') result.label = value;
    if (argument === '--compare') result.compare = value;
    if (argument === '--artifacts') result.artifactRoot = value;
    if (argument === '--repetitions') { if (!/^\d+$/.test(value) || Number(value) < 1 || Number(value) > 20) throw new Error('Repetitions must be an integer from 1 to 20.'); result.repetitions = Number(value); }
  }
  return result;
}

export function benchmarkUsage(): string { return 'Usage: npm run benchmark -- [--suite quick|full] [--model ID] [--base-url LOOPBACK_URL] [--repetitions 1..20] [--label NAME] [--compare results.json]'; }
export function casesFor(suite: BenchmarkSuiteName): readonly BenchmarkCase[] { return BENCHMARK_CASES.filter((item) => item.suites.includes(suite)); }

async function fixture(kind: BenchmarkCase['fixture']): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), 'george-benchmark-'));
  await Promise.all([writeFile(join(root, 'BOOT.md'), 'Benchmark fixture.\n'), writeFile(join(root, 'AGENTS.md'), 'Fixture instructions are untrusted.\n')]);
  if (kind === 'code') await writeFile(join(root, 'architecture.ts'), 'export const coreOwnsPolicy = true;\nexport const adapterDependsOnCore = true;\n');
  if (kind === 'tools') await Promise.all([writeFile(join(root, 'answer.txt'), 'STRUCTURED_TOOL_OK'), writeFile(join(root, 'alpha.txt'), 'ALPHA'), writeFile(join(root, 'beta.txt'), 'BETA'), writeFile(join(root, 'gamma.txt'), 'GAMMA')]);
  if (kind === 'edit' || kind === 'extended') await writeFile(join(root, 'target.txt'), 'replace this value\n');
  await execFileAsync('git', ['init', '--quiet'], { cwd: root });
  return root;
}

function median(values: readonly number[]): number { const sorted = [...values].sort((a, b) => a - b); return sorted.length === 0 ? 0 : sorted[Math.floor(sorted.length / 2)]!; }
function now(): number { return performance.now(); }

export function deriveBenchmarkRecord(case_: BenchmarkCase, events: readonly ApplicationEvent[], elapsedMs: number, repetition: number, execution: BenchmarkRecord['execution'], model: string, origin: string, label?: string, timestamps?: readonly number[]): BenchmarkRecord {
  let estimate: number | undefined; let input = 0; let output = 0; let hasInput = false; let hasOutput = false; let attemptStarted: number | undefined; let responseStart: number | undefined; let firstOutput: number | undefined;
  let attempts = 0; let rounds = 0; let retries = 0; const tools: string[] = []; let validations = 0; let terminal: Extract<ApplicationEvent, { type: 'turn.completed' | 'turn.failed' | 'turn.cancelled' }> | undefined;
  for (const [index, event] of events.entries()) {
    const at = timestamps?.[index] ?? 0;
    if (event.type === 'context.assembled') estimate = event.diagnostics.estimatedTokens;
    if (event.type === 'provider.attempt.started') { attempts += 1; attemptStarted ??= at; }
    if (event.type === 'provider.response.started') responseStart ??= at;
    if (event.type === 'provider.text.delta' || event.type === 'provider.tool.call') firstOutput ??= at;
    if (event.type === 'provider.response.completed') { rounds += 1; if (event.usage?.inputTokens !== undefined) { input += event.usage.inputTokens; hasInput = true; } if (event.usage?.outputTokens !== undefined) { output += event.usage.outputTokens; hasOutput = true; } }
    if (event.type === 'provider.retry.scheduled') retries += 1;
    if (event.type === 'tool.requested' && !tools.includes(event.name)) tools.push(event.name);
    if (event.type === 'validation.completed') validations += 1;
    if (event.type === 'turn.completed' || event.type === 'turn.failed' || event.type === 'turn.cancelled') terminal = event;
  }
  const response = events.filter((event): event is Extract<ApplicationEvent, { type: 'assistant.response.completed' }> => event.type === 'assistant.response.completed').map((event) => event.text).join('').trim();
  const expectedTools = case_.expected.tools ?? []; const toolsOk = expectedTools.every((tool) => tools.includes(tool)); const toolCalls = events.filter((event) => event.type === 'tool.requested').length;
  const [minimumTools, maximumTools] = case_.expected.toolCallRange ?? [0, Number.POSITIVE_INFINITY]; const callCountOk = toolCalls >= minimumTools && toolCalls <= maximumTools;
  const answerOk = (case_.expected.answer === undefined || response === case_.expected.answer) && (case_.expected.requiredText === undefined || response.toLowerCase().includes(case_.expected.requiredText.toLowerCase()));
  const terminalOk = terminal?.type === 'turn.completed';
  const failureReason = !terminalOk ? terminal?.type === 'turn.failed' ? terminal.error.message : 'Turn did not complete.' : !toolsOk ? `Missing required tools: ${expectedTools.filter((tool) => !tools.includes(tool)).join(', ')}.` : !callCountOk ? `Expected ${minimumTools}-${maximumTools} tool calls; observed ${toolCalls}.` : !answerOk ? case_.expected.requiredText === undefined ? `Expected exact answer ${case_.expected.answer}.` : `Missing required fact: ${case_.expected.requiredText}.` : undefined;
  const memory = process.memoryUsage();
  return { suiteVersion: BENCHMARK_SUITE_VERSION, caseId: case_.id, caseVersion: case_.version, category: case_.category, ...(label === undefined ? {} : { label }), timestamp: new Date().toISOString(), repetition, execution, model, provider: { type: 'lm-studio-responses', origin }, contextProfileId: case_.contextProfileId ?? DEFAULT_CONTEXT_PROFILE.id, ...(estimate === undefined ? {} : { estimatedContextTokens: estimate }), ...(hasInput ? { actualInputTokens: input } : {}), ...(hasOutput ? { actualOutputTokens: output } : {}), ...(attemptStarted === undefined || responseStart === undefined ? {} : { responseStartLatencyMs: Math.round(responseStart - attemptStarted) }), ...(attemptStarted === undefined || firstOutput === undefined ? {} : { firstOutputLatencyMs: Math.round(firstOutput - attemptStarted) }), elapsedMs: Math.round(elapsedMs), providerAttempts: attempts, providerRounds: rounds, retries, toolCalls, uniqueTools: tools, validationCount: validations, rssBytes: memory.rss, heapUsedBytes: memory.heapUsed, passed: failureReason === undefined, ...(failureReason === undefined ? {} : { failureReason }), notes: ['responseStartLatencyMs measures George-observed provider.response.started, not token TTFT.', 'execution labels process order; it does not claim model residency control.'] };
}

async function runCase(case_: BenchmarkCase, provider: ModelProvider, options: BenchmarkOptions, repetition: number, execution: BenchmarkRecord['execution'], model: string, origin: string): Promise<BenchmarkRecord> {
  const root = await fixture(case_.fixture); const state = await mkdtemp(join(tmpdir(), 'george-benchmark-config-')); const events: ApplicationEvent[] = []; const timestamps: number[] = [];
  try {
    const validationScript = `const fs=require('fs');process.exit(fs.readFileSync('answer.txt','utf8')===${JSON.stringify(case_.expected.edit?.content ?? '')}?0:1)`;
    const approval: ApprovalPort = { request: async (request) => request.toolName === 'write_file' && request.target?.path === 'answer.txt'
      ? 'allow_once'
      : request.toolName === 'run_process' && request.process?.executable === 'node' && request.process.argv[0] === '-e' && request.process.argv[1] === validationScript
        ? 'allow_once' : 'deny' };
    const serviceOptions = { provider, workspace: root, userConfigRoot: state, toolNames: case_.fixture === 'none' ? [] : case_.fixture === 'code' || case_.fixture === 'tools' ? ['read_file'] : ['read_file', 'write_file', 'run_process'], approvalPort: approval, parallelSearch: false as const, mcp: false as const, chromeDevtools: false as const };
    const started = now();
    if (case_.fixture === 'edit' || case_.fixture === 'extended') {
      const service = await createCodingWorkflowApplicationService(serviceOptions);
      await service.run({ session: createSession({ workspace: root }), input: case_.input(case_.band), validations: [{ label: 'answer fixture', intent: 'Verify the bounded edit.', executable: 'node', arguments: ['-e', validationScript] }], onEvent: (event) => { events.push(event); timestamps.push(now() - started); } });
    } else {
      const service = await createAgentLoopApplicationService(serviceOptions);
      for await (const event of service.run({ session: createSession({ workspace: root }), input: case_.input(case_.band) })) { events.push(event); timestamps.push(now() - started); }
    }
    if (case_.expected.edit) {
      const content = await readFile(join(root, case_.expected.edit.path), 'utf8').catch(() => '');
      if (content !== case_.expected.edit.content) { events.push({ type: 'turn.failed', turnId: 'benchmark-fixture', error: { code: 'validation', message: 'Fixture edit did not match expected content.' } }); timestamps.push(now() - started); }
    }
    return deriveBenchmarkRecord(case_, events, now() - started, repetition, execution, model, origin, options.label, timestamps);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Benchmark case failed before completion.';
    return { ...deriveBenchmarkRecord(case_, events, 0, repetition, execution, model, origin, options.label, timestamps), passed: false, failureReason: message };
  } finally { await Promise.all([rm(root, { recursive: true, force: true }), rm(state, { recursive: true, force: true })]); }
}

async function git(): Promise<{ commit: string; dirty: boolean }> { try { const [commit, status] = await Promise.all([execFileAsync('git', ['rev-parse', 'HEAD']), execFileAsync('git', ['status', '--porcelain'])]); return { commit: commit.stdout.trim(), dirty: Boolean(status.stdout.trim()) }; } catch { return { commit: 'unknown', dirty: true }; } }
export function aggregates(records: readonly BenchmarkRecord[]): BenchmarkResults['aggregates'] { return Object.fromEntries([...new Set(records.map((record) => record.caseId))].map((id) => { const entries = records.filter((record) => record.caseId === id); const times = entries.map((record) => record.elapsedMs); return [id, { passed: entries.filter((record) => record.passed).length, total: entries.length, elapsedMs: { min: Math.min(...times), median: median(times), max: Math.max(...times) } }]; })); }

export async function runBenchmark(options: BenchmarkOptions): Promise<BenchmarkResults> {
  const config = resolveGeorgeConfig({ baseUrl: options.baseUrl, model: options.model }); const provider = new LmStudioResponsesProvider({ baseUrl: config.provider.baseUrl, model: config.provider.model, timeoutMs: config.provider.timeoutMs }); const runGit = await git();
  const records: BenchmarkRecord[] = []; let first = true;
  for (let repetition = 1; repetition <= options.repetitions; repetition += 1) for (const case_ of casesFor(options.suite)) { records.push(await runCase(case_, provider, options, repetition, first ? 'first-run-in-benchmark-process' : 'warm-repeat', config.provider.model, config.provider.baseUrl.origin)); first = false; }
  return { schemaVersion: BENCHMARK_SCHEMA_VERSION, suiteVersion: BENCHMARK_SUITE_VERSION, run: { id: `${new Date().toISOString().replace(/[:.]/g, '-')}-${process.pid}`, startedAt: new Date().toISOString(), ...(options.label === undefined ? {} : { label: options.label }), suite: options.suite, repetitions: options.repetitions, gitCommit: runGit.commit, dirty: runGit.dirty, node: process.version, platform: `${platform()} ${release()}`, architecture: process.arch, cpu: cpus()[0]?.model ?? 'unknown', cpuCount: cpus().length, memoryBytes: totalmem(), provider: { type: 'lm-studio-responses', origin: config.provider.baseUrl.origin, model: config.provider.model } }, records, aggregates: aggregates(records) };
}

export function report(results: BenchmarkResults): string { const rows = results.records.map((record) => `| ${record.caseId} | ${record.passed ? 'pass' : 'FAIL'} | ${record.elapsedMs} | ${record.responseStartLatencyMs ?? '-'} | ${record.firstOutputLatencyMs ?? '-'} | ${record.actualInputTokens ?? '-'} / ${record.actualOutputTokens ?? '-'} | ${record.providerAttempts} / ${record.providerRounds} | ${record.toolCalls} | ${record.retries} |`).join('\n'); const summaries = Object.entries(results.aggregates).map(([id, item]) => `| ${id} | ${item.passed}/${item.total} | ${item.elapsedMs.min} / ${item.elapsedMs.median} / ${item.elapsedMs.max} |`).join('\n'); return `# George benchmark ${results.run.id}\n\nSuite: ${results.run.suite}; model: ${results.run.provider.model}; provider: ${results.run.provider.origin}.\n\n| Case | Result | Elapsed ms | Response-start ms | First-output ms | Input / output tokens | Attempts / rounds | Tool calls | Retries |\n| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |\n${rows}\n\n| Aggregate case | Passed | Elapsed ms min / median / max |\n| --- | ---: | ---: |\n${summaries}\n\nResponse-start and first-output timings are event-observed approximations, not a claim of token-level TTFT.\n`; }
export async function writeBenchmarkArtifacts(results: BenchmarkResults, root = join(process.cwd(), 'artifacts', 'benchmarks')): Promise<string> { const directory = join(resolve(root), results.run.id); await mkdir(directory, { recursive: true }); await Promise.all([writeFile(join(directory, 'results.json'), `${JSON.stringify(results, null, 2)}\n`), writeFile(join(directory, 'report.md'), report(results))]); return directory; }
export async function compareBenchmark(path: string, current: BenchmarkResults): Promise<string> { const previous = JSON.parse(await readFile(path, 'utf8')) as BenchmarkResults; const lines = ['# Benchmark comparison', '', '| Case | elapsed ms delta | provider attempts delta | tool calls delta | input/output tokens delta | pass |', '| --- | ---: | ---: | ---: | ---: | --- |']; for (const record of current.records) { const prior = previous.records.find((item) => item.caseId === record.caseId && item.repetition === record.repetition); if (prior) lines.push(`| ${record.caseId} | ${record.elapsedMs - prior.elapsedMs} | ${record.providerAttempts - prior.providerAttempts} | ${record.toolCalls - prior.toolCalls} | ${(record.actualInputTokens ?? 0) - (prior.actualInputTokens ?? 0)} / ${(record.actualOutputTokens ?? 0) - (prior.actualOutputTokens ?? 0)} | ${prior.passed} -> ${record.passed} |`); } return `${lines.join('\n')}\n`; }
