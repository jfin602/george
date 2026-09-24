import { execFile } from 'node:child_process';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { cpus, platform, release, tmpdir, totalmem } from 'node:os';
import { join, resolve } from 'node:path';
import { promisify } from 'node:util';

import { createCodingWorkflowApplicationService, createAgentLoopApplicationService } from '../application/index.ts';
import { createSession, DEFAULT_CONTEXT_PROFILE, resolveGeorgeConfig, type ApplicationEvent, type ApprovalPort, type ModelProvider } from '../core/index.ts';
import { LmStudioResponsesProvider } from '../provider/index.ts';

const execFileAsync = promisify(execFile);
export const BENCHMARK_SCHEMA_VERSION = 2;
export const BENCHMARK_SUITE_VERSION = 'v2';
const DEFAULT_REPETITIONS = 1;

export type BenchmarkSuiteName = 'quick' | 'full' | 'context';
export type BenchmarkCategory = 'short-reasoning' | 'long-context-retrieval' | 'code-understanding' | 'structured-tool-use' | 'independent-multi-tool-inspection' | 'repository-investigation' | 'coding-edit-workflow' | 'repository-repair-workflow' | 'extended-agent-loop' | 'compaction-noisy-evidence';
export type BenchmarkOptions = Readonly<{ suite: BenchmarkSuiteName; model?: string; baseUrl?: string; repetitions: number; label?: string; compare?: string; artifactRoot?: string; contextBands?: readonly number[] }>;
export type BenchmarkCase = Readonly<{ id: string; version: number; category: BenchmarkCategory; suites: readonly BenchmarkSuiteName[]; contextProfileId?: string; fixture: 'none' | 'code' | 'tools' | 'investigation' | 'edit' | 'repository-workflow' | 'extended'; input: (band?: number) => string; expected: Readonly<{ answer?: string; requiredText?: string; tools?: readonly string[]; toolCallRange?: readonly [number, number]; edit?: Readonly<{ path: string; content: string }>; validation?: Readonly<{ executable: string; arguments: readonly string[] }> }>; band?: number }>;
export type BenchmarkRecord = Readonly<{
  suiteVersion: typeof BENCHMARK_SUITE_VERSION; caseId: string; caseVersion: number; category: BenchmarkCategory; label?: string; timestamp: string; repetition: number; execution: 'first-run-in-benchmark-process' | 'warm-repeat';
  model: string; provider: Readonly<{ type: 'lm-studio-responses'; origin: string }>; contextProfileId?: string; requestedContextBand?: number; estimatedContextTokens?: number; actualInputTokens?: number; actualOutputTokens?: number;
  responseStartLatencyMs?: number; firstOutputLatencyMs?: number; elapsedMs: number; providerActiveMs: number; providerRoundActiveMs: number; averageProviderRoundMs: number; providerActivePercent: number; toolExecutionMs: number; toolExecutionPercent: number; approvalWaitMs: number; approvalWaitPercent: number; otherMs: number; otherPercent: number; providerAttempts: number; providerRounds: number; retries: number; toolCalls: number; uniqueTools: readonly string[]; validationCount: number; rssBytes: number; heapUsedBytes: number;
  passed: boolean; failureReason?: string; notes: readonly string[];
}>;
export type BenchmarkTimingSummary = Readonly<{ elapsedMs: number; providerActiveMs: number; providerRoundActiveMs: number; averageProviderRoundMs: number; providerActivePercent: number; toolExecutionMs: number; toolExecutionPercent: number; approvalWaitMs: number; approvalWaitPercent: number; otherMs: number; otherPercent: number; providerRounds: number; providerAttempts: number; retries: number }>;
export type BenchmarkResults = Readonly<{ schemaVersion: typeof BENCHMARK_SCHEMA_VERSION; suiteVersion: typeof BENCHMARK_SUITE_VERSION; run: Readonly<{ id: string; startedAt: string; label?: string; suite: BenchmarkSuiteName; repetitions: number; gitCommit: string; dirty: boolean; node: string; platform: string; architecture: string; cpu: string; cpuCount: number; memoryBytes: number; provider: Readonly<{ type: 'lm-studio-responses'; origin: string; model: string }> }>; records: readonly BenchmarkRecord[]; aggregates: Readonly<Record<string, Readonly<{ passed: number; total: number; elapsedMs: Readonly<{ min: number; median: number; max: number }> }>>> }>;
export type BenchmarkRunProgress = Readonly<{ suite: BenchmarkSuiteName; suiteVersion: typeof BENCHMARK_SUITE_VERSION; repetitions: number; caseCount: number; totalExecutions: number; label?: string; gitCommit: string; dirty: boolean; provider: BenchmarkResults['run']['provider'] }>;
export type BenchmarkCaseProgress = Readonly<{ current: number; total: number; case_: BenchmarkCase; repetition: number; repetitions: number }>;
export type BenchmarkProgressObserver = Readonly<{ onRunStarted?: (run: BenchmarkRunProgress) => void; onCaseStarted?: (progress: BenchmarkCaseProgress) => void; onCaseCompleted?: (progress: BenchmarkCaseProgress & Readonly<{ record: BenchmarkRecord }>) => void }>;

const repeat = (value: string, count: number): string => Array.from({ length: count }, () => value).join('');
const longInput = (band: number, token: string): string => `Return exactly ${token}. Do not use tools.\n\n${repeat('noise evidence remains irrelevant. ', Math.max(1, Math.floor((band * 4) / 32)))}\nFACT_A=amber\n${repeat('more ordinary project-like material. ', 8)}\nFACT_B=${token}\n${repeat('trailing material. ', 8)}`;
export const DEFAULT_CONTEXT_BANDS = [2048, 4096, 8192, 16384] as const;
const MAX_CONTEXT_BAND = 16384;
const contextSentinel = (band: number): string => `SENTINEL_${band}_ORCHID`;
const longContextCase = (band: number, suites: readonly BenchmarkSuiteName[], contextProfileId?: string): BenchmarkCase => ({ id: `long-context-${band}-001`, version: 1, category: 'long-context-retrieval', suites, fixture: 'none', band, ...(contextProfileId === undefined ? {} : { contextProfileId }), input: () => longInput(band, contextSentinel(band)), expected: { answer: contextSentinel(band) } });

/** Generated separately so context runs do not execute the general benchmark registry. */
export function contextLadderCases(bands: readonly number[] = DEFAULT_CONTEXT_BANDS): readonly BenchmarkCase[] {
  return [...bands].sort((left, right) => left - right).map((band) => longContextCase(band, ['context']));
}

/** One registry serves both selections; suite mode only filters these stable definitions. */
export const BENCHMARK_CASES: readonly BenchmarkCase[] = [
  { id: 'short-reasoning-001', version: 1, category: 'short-reasoning', suites: ['quick', 'full'], fixture: 'none', input: () => 'Return exactly 42. Do not explain.', expected: { answer: '42' } },
  ...DEFAULT_CONTEXT_BANDS.map((band) => longContextCase(band, band === 2048 ? ['quick', 'full'] : ['full'], 'qwen3-coder-30b-a3b-instruct-q4_k_m-lm-studio-32k')),
  { id: 'code-understanding-001', version: 3, category: 'code-understanding', suites: ['full'], fixture: 'code', input: () => 'Use read_file exactly once to inspect architecture.ts. Then return exactly adapter-to-core.', expected: { answer: 'adapter-to-core', tools: ['read_file'], toolCallRange: [1, 1] } },
  { id: 'structured-tool-use-001', version: 1, category: 'structured-tool-use', suites: ['quick', 'full'], fixture: 'tools', input: () => 'Use read_file exactly once on answer.txt, then return exactly its content.', expected: { answer: 'STRUCTURED_TOOL_OK', tools: ['read_file'], toolCallRange: [1, 1] } },
  { id: 'independent-multi-tool-001', version: 1, category: 'independent-multi-tool-inspection', suites: ['quick', 'full'], fixture: 'tools', input: () => 'Use read_file once each on alpha.txt, beta.txt, and gamma.txt. Then return exactly ALPHA-BETA-GAMMA.', expected: { answer: 'ALPHA-BETA-GAMMA', tools: ['read_file'], toolCallRange: [3, 3] } },
  { id: 'multi-round-repository-001', version: 1, category: 'repository-investigation', suites: ['full'], fixture: 'investigation', input: () => 'Start with investigation/entry.txt and trace every next artifact it identifies. Do not infer missing facts. Then return exactly the final token found in the repository.', expected: { answer: 'REPOSITORY_TRACE_CONFIRMED', tools: ['read_file'], toolCallRange: [4, 4] } },
  { id: 'coding-edit-001', version: 1, category: 'coding-edit-workflow', suites: ['full'], fixture: 'edit', input: () => 'Read target.txt. Write answer.txt with exactly PATCHED. Then state exactly PATCHED.', expected: { answer: 'PATCHED', tools: ['read_file', 'write_file'], edit: { path: 'answer.txt', content: 'PATCHED' } } },
  { id: 'multi-round-coding-workflow-001', version: 2, category: 'repository-repair-workflow', suites: ['full'], fixture: 'repository-workflow', input: () => 'Trace the repair trail beginning with README.md; each file identifies the next artifact. Do not infer missing facts. Repair the defect, run node --test test/contract.test.js, then return exactly REPAIR_VERIFIED.', expected: { answer: 'REPAIR_VERIFIED', tools: ['read_file', 'write_file', 'run_process'], toolCallRange: [7, 12], edit: { path: 'src/formatter.js', content: "export const formatLabel = (value) => value.trim().toUpperCase();\n" }, validation: { executable: 'node', arguments: ['--test', 'test/contract.test.js'] } } },
  { id: 'extended-agent-loop-001', version: 1, category: 'extended-agent-loop', suites: ['full'], fixture: 'extended', input: () => 'Read target.txt, write answer.txt with exactly FIXED, then return exactly FIXED.', expected: { answer: 'FIXED', tools: ['read_file', 'write_file'], edit: { path: 'answer.txt', content: 'FIXED' } } },
  { id: 'compaction-noisy-evidence-001', version: 1, category: 'compaction-noisy-evidence', suites: ['full'], fixture: 'none', input: () => longInput(8192, 'NOISY_EVIDENCE_PRESERVED'), expected: { answer: 'NOISY_EVIDENCE_PRESERVED' } },
];

export function parseBenchmarkArguments(argv: readonly string[]): BenchmarkOptions | Readonly<{ help: true }> {
  const result: { suite: BenchmarkSuiteName; model?: string; baseUrl?: string; repetitions: number; label?: string; compare?: string; artifactRoot?: string; contextBands?: readonly number[] } = { suite: 'quick', repetitions: DEFAULT_REPETITIONS };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index]!;
    if (argument === '--help' || argument === '-h') return { help: true };
    if (!['--suite', '--model', '--base-url', '--repetitions', '--label', '--compare', '--artifacts', '--context-bands'].includes(argument)) throw new Error(`Unknown benchmark flag: ${argument}`);
    const value = argv[++index];
    if (value === undefined || value.startsWith('--')) throw new Error(`Missing value for ${argument}.`);
    if (argument === '--suite') { if (value !== 'quick' && value !== 'full' && value !== 'context') throw new Error('Suite must be quick, full, or context.'); result.suite = value; }
    if (argument === '--model') result.model = value;
    if (argument === '--base-url') result.baseUrl = value;
    if (argument === '--label') result.label = value;
    if (argument === '--compare') result.compare = value;
    if (argument === '--artifacts') result.artifactRoot = value;
    if (argument === '--repetitions') { if (!/^\d+$/.test(value) || Number(value) < 1 || Number(value) > 20) throw new Error('Repetitions must be an integer from 1 to 20.'); result.repetitions = Number(value); }
    if (argument === '--context-bands') {
      if (!/^\d+(?:,\d+)*$/.test(value)) throw new Error('Context bands must be comma-separated positive integers.');
      const bands = value.split(',').map(Number);
      if (bands.some((band) => band < 1 || band > MAX_CONTEXT_BAND)) throw new Error(`Context bands must be integers from 1 to ${MAX_CONTEXT_BAND}.`);
      if (new Set(bands).size !== bands.length) throw new Error('Context bands must not contain duplicates.');
      result.contextBands = bands.toSorted((left, right) => left - right);
    }
  }
  if (result.contextBands !== undefined && result.suite !== 'context') throw new Error('Context bands require --suite context.');
  return result;
}

export function benchmarkUsage(): string { return 'Usage: npm run benchmark -- [--suite quick|full|context] [--context-bands 2048,4096,8192,16384] [--model ID] [--base-url LOOPBACK_URL] [--repetitions 1..20] [--label NAME] [--compare results.json]'; }
export function casesFor(suite: BenchmarkSuiteName, contextBands?: readonly number[]): readonly BenchmarkCase[] { return suite === 'context' ? contextLadderCases(contextBands) : BENCHMARK_CASES.filter((item) => item.suites.includes(suite)); }

export async function createBenchmarkFixture(kind: BenchmarkCase['fixture']): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), 'george-benchmark-'));
  await Promise.all([writeFile(join(root, 'BOOT.md'), 'Benchmark fixture.\n'), writeFile(join(root, 'AGENTS.md'), 'Fixture instructions are untrusted.\n')]);
  if (kind === 'code') await writeFile(join(root, 'architecture.ts'), 'export const coreOwnsPolicy = true;\nexport const adapterDependsOnCore = true;\n');
  if (kind === 'tools') await Promise.all([writeFile(join(root, 'answer.txt'), 'STRUCTURED_TOOL_OK'), writeFile(join(root, 'alpha.txt'), 'ALPHA'), writeFile(join(root, 'beta.txt'), 'BETA'), writeFile(join(root, 'gamma.txt'), 'GAMMA')]);
  if (kind === 'investigation') { await mkdir(join(root, 'investigation')); await Promise.all([writeFile(join(root, 'investigation', 'entry.txt'), 'Read investigation/module-map.txt next.\n'), writeFile(join(root, 'investigation', 'module-map.txt'), 'Read investigation/boundary.txt next.\n'), writeFile(join(root, 'investigation', 'boundary.txt'), 'Read investigation/evidence.txt next.\n'), writeFile(join(root, 'investigation', 'evidence.txt'), 'REPOSITORY_TRACE_CONFIRMED\n')]); }
  if (kind === 'edit' || kind === 'extended') await writeFile(join(root, 'target.txt'), 'replace this value\n');
  if (kind === 'repository-workflow') { await Promise.all([mkdir(join(root, 'internal')), mkdir(join(root, 'src')), mkdir(join(root, 'test'))]); await Promise.all([writeFile(join(root, 'package.json'), '{"type":"module"}\n'), writeFile(join(root, 'README.md'), 'Read internal/incident.txt to begin the repair trail.\n'), writeFile(join(root, 'internal', 'incident.txt'), 'Read internal/ownership.txt for the affected module.\n'), writeFile(join(root, 'internal', 'ownership.txt'), 'Read src/formatter.js to inspect the defect, then read test/contract.test.js for the required behavior.\n'), writeFile(join(root, 'src', 'formatter.js'), 'export const formatLabel = (value) => value.trim();\n'), writeFile(join(root, 'test', 'contract.test.js'), "import assert from 'node:assert/strict';\nimport test from 'node:test';\nimport { formatLabel } from '../src/formatter.js';\n\ntest('formatLabel normalizes labels', () => assert.equal(formatLabel(' george '), 'GEORGE'));\n")]); }
  await execFileAsync('git', ['init', '--quiet'], { cwd: root });
  return root;
}

function validationFor(case_: BenchmarkCase): NonNullable<BenchmarkCase['expected']['validation']> {
  const validationScript = `const fs=require('fs');process.exit(fs.readFileSync('answer.txt','utf8')===${JSON.stringify(case_.expected.edit?.content ?? '')}?0:1)`;
  return case_.expected.validation ?? { executable: 'node', arguments: ['-e', validationScript] };
}

export function createBenchmarkApproval(case_: BenchmarkCase): ApprovalPort {
  const validation = validationFor(case_);
  return { request: async (request) => request.toolName === 'write_file' && request.target?.path === case_.expected.edit?.path
    ? 'allow_once'
    : request.toolName === 'run_process' && request.process?.executable === validation.executable && request.process.argv.length === validation.arguments.length && request.process.argv.every((value, index) => value === validation.arguments[index])
      ? 'allow_once' : 'deny' };
}

export async function matchesBenchmarkFixtureEdit(root: string, edit: BenchmarkCase['expected']['edit']): Promise<boolean> {
  if (!edit) return true;
  return await readFile(join(root, edit.path), 'utf8').then((content) => content === edit.content).catch(() => false);
}

function median(values: readonly number[]): number { const sorted = [...values].sort((a, b) => a - b); return sorted.length === 0 ? 0 : sorted[Math.floor(sorted.length / 2)]!; }
function now(): number { return performance.now(); }
function number(value: number | undefined): string { return value === undefined ? '-' : value.toLocaleString('en-US'); }
type Interval = readonly [number, number];
const percent = (value: number, total: number): number => total === 0 ? 0 : Math.round((value / total) * 1_000) / 10;
function unionDuration(intervals: readonly Interval[]): number { const sorted = intervals.filter(([start, end]) => end > start).toSorted(([a], [b]) => a - b); let total = 0; let start: number | undefined; let end = 0; for (const [nextStart, nextEnd] of sorted) { if (start === undefined) { start = nextStart; end = nextEnd; } else if (nextStart > end) { total += end - start; start = nextStart; end = nextEnd; } else end = Math.max(end, nextEnd); } return total + (start === undefined ? 0 : end - start); }
function timingSummary(records: readonly BenchmarkRecord[]): BenchmarkTimingSummary { const elapsedMs = records.reduce((total, record) => total + record.elapsedMs, 0); const providerActiveMs = records.reduce((total, record) => total + record.providerActiveMs, 0); const providerRoundActiveMs = records.reduce((total, record) => total + record.providerRoundActiveMs, 0); const toolExecutionMs = records.reduce((total, record) => total + record.toolExecutionMs, 0); const approvalWaitMs = records.reduce((total, record) => total + record.approvalWaitMs, 0); const otherMs = records.reduce((total, record) => total + record.otherMs, 0); const providerRounds = records.reduce((total, record) => total + record.providerRounds, 0); return { elapsedMs, providerActiveMs, providerRoundActiveMs, averageProviderRoundMs: providerRounds === 0 ? 0 : Math.round(providerRoundActiveMs / providerRounds), providerActivePercent: percent(providerActiveMs, elapsedMs), toolExecutionMs, toolExecutionPercent: percent(toolExecutionMs, elapsedMs), approvalWaitMs, approvalWaitPercent: percent(approvalWaitMs, elapsedMs), otherMs, otherPercent: percent(otherMs, elapsedMs), providerRounds, providerAttempts: records.reduce((total, record) => total + record.providerAttempts, 0), retries: records.reduce((total, record) => total + record.retries, 0) }; }
export { timingSummary as summarizeBenchmarkTiming };
function formatTiming(timing: BenchmarkTimingSummary): string { return [`Provider/model: ${formatBenchmarkDuration(timing.providerActiveMs)} (${timing.providerActivePercent.toFixed(1)}%)`, `Tools:          ${formatBenchmarkDuration(timing.toolExecutionMs)} (${timing.toolExecutionPercent.toFixed(1)}%)`, `Approval/wait:  ${formatBenchmarkDuration(timing.approvalWaitMs)} (${timing.approvalWaitPercent.toFixed(1)}%)`, `Other:          ${formatBenchmarkDuration(timing.otherMs)} (${timing.otherPercent.toFixed(1)}%)`, `Provider rounds: ${timing.providerRounds}`, `Avg round:       ${formatBenchmarkDuration(timing.averageProviderRoundMs)}`].join('\n'); }

/** Matches the application's milliseconds-and-seconds presentation convention. */
export function formatBenchmarkDuration(value: number): string { const milliseconds = Math.max(0, Math.round(value)); return `${milliseconds}ms | ${(milliseconds / 1_000).toFixed(2)}s`; }
export function formatBenchmarkRunHeader(run: BenchmarkRunProgress): string {
  const git = run.gitCommit === 'unknown' ? 'unavailable' : `${run.gitCommit} (${run.dirty ? 'dirty' : 'clean'})`;
  return ['Benchmark run', `Suite: ${run.suite} ${run.suiteVersion} | Model: ${run.provider.model}`, `Provider: ${run.provider.origin} | Repetitions: ${run.repetitions}`, `Cases: ${run.caseCount} | Executions: ${run.totalExecutions} | Label: ${run.label ?? '-'}`, `George: ${git}`].join('\n');
}
export function formatBenchmarkCaseStarted(progress: BenchmarkCaseProgress): string { return `[${String(progress.current).padStart(String(progress.total).length)}/${progress.total}] RUN  ${progress.case_.id.padEnd(28)} rep ${progress.repetition}/${progress.repetitions}`; }
export function formatBenchmarkCaseCompleted(progress: BenchmarkCaseProgress & Readonly<{ record: BenchmarkRecord }>): string {
  const { record } = progress;
  const result = `[${String(progress.current).padStart(String(progress.total).length)}/${progress.total}] ${record.passed ? 'PASS' : 'FAIL'} ${record.caseId.padEnd(28)} ${formatBenchmarkDuration(record.elapsedMs)}`;
  if (!record.passed) return `${result}\n         ${record.failureReason ?? 'Benchmark case failed.'}`;
  const tools = record.toolCalls === 0 ? 'tools 0' : `tools ${record.toolCalls}${record.uniqueTools.length === 0 ? '' : ` [${record.uniqueTools.join(', ')}]`}`;
  return `${result}\n         first output ${record.firstOutputLatencyMs === undefined ? '-' : formatBenchmarkDuration(record.firstOutputLatencyMs)} | input ${number(record.actualInputTokens)} | output ${number(record.actualOutputTokens)}\n         provider ${record.providerAttempts} attempt${record.providerAttempts === 1 ? '' : 's'} / ${record.providerRounds} round${record.providerRounds === 1 ? '' : 's'} | active ${formatBenchmarkDuration(record.providerActiveMs)} (${record.providerActivePercent.toFixed(1)}%) | ${tools} | retries ${record.retries}\n         tools ${formatBenchmarkDuration(record.toolExecutionMs)} | approval ${formatBenchmarkDuration(record.approvalWaitMs)} | other ${formatBenchmarkDuration(record.otherMs)}`;
}
function medianValue(records: readonly BenchmarkRecord[], value: (record: BenchmarkRecord) => number | undefined): string {
  const values = records.map(value).filter((item): item is number => item !== undefined);
  return values.length === 0 ? '-' : number(median(values));
}
/** One row per requested band; repeated samples are represented by their deterministic median. */
export function formatContextLadderSummary(records: readonly BenchmarkRecord[]): string {
  const byBand = new Map<number, BenchmarkRecord[]>();
  for (const record of records) if (record.requestedContextBand !== undefined) byBand.set(record.requestedContextBand, [...(byBand.get(record.requestedContextBand) ?? []), record]);
  if (byBand.size === 0) return '';
  const rows = [...byBand.entries()].toSorted(([left], [right]) => left - right).map(([band, entries]) => {
    const passed = entries.filter((record) => record.passed).length;
    return `${band} | ${medianValue(entries, (record) => record.actualInputTokens)} | ${medianValue(entries, (record) => record.firstOutputLatencyMs)}ms | ${median(entries.map((record) => record.providerActiveMs))}ms | ${median(entries.map((record) => record.elapsedMs))}ms | ${passed === entries.length ? 'PASS' : 'FAIL'} (${passed}/${entries.length})`;
  });
  return ['Context ladder', 'Band | Provider input tokens | First output | Provider/model | Elapsed | Result', ...rows].join('\n');
}
export function formatBenchmarkSummary(results: BenchmarkResults, elapsedMs: number, directory: string): string {
  const records = results.records; const passed = records.filter((record) => record.passed).length; const inputs = records.map((record) => record.actualInputTokens).filter((value): value is number => value !== undefined); const outputs = records.map((record) => record.actualOutputTokens).filter((value): value is number => value !== undefined); const timing = timingSummary(records);
  return ['', 'Benchmark complete', '', `Passed:        ${passed} / ${records.length}`, `Elapsed:       ${formatBenchmarkDuration(elapsedMs)}`, `Suite:         ${results.run.suite} ${results.suiteVersion}`, `Model:         ${results.run.provider.model}`, `Artifacts:     ${directory}`, '', `Median case:   ${formatBenchmarkDuration(median(records.map((record) => record.elapsedMs)))}`, `Provider calls: ${timing.providerAttempts}`, `Tool calls:    ${records.reduce((total, record) => total + record.toolCalls, 0)}`, `Retries:       ${timing.retries}`, `Input tokens:  ${inputs.length === 0 ? '-' : number(inputs.reduce((total, value) => total + value, 0))}`, `Output tokens: ${outputs.length === 0 ? '-' : number(outputs.reduce((total, value) => total + value, 0))}`, '', 'Measured case timing', formatTiming(timing), ...(results.run.suite === 'context' ? ['', formatContextLadderSummary(records)] : [])].join('\n');
}
const ansi = { reset: '\u001b[0m', bold: '\u001b[1m', cyan: '\u001b[36m', dim: '\u001b[2m', green: '\u001b[32m', red: '\u001b[31m', yellow: '\u001b[33m' } as const;
const style = (text: string, code: string, enabled: boolean): string => enabled && text ? `${code}${text}${ansi.reset}` : text;

/** Terminal-only presentation; persisted benchmark artifacts always use the plain formatters above. */
export function colorizeBenchmarkTerminal(output: string, enabled: boolean): string {
  if (!enabled) return output;
  return output.split('\n').map((original) => {
    if (original === 'Benchmark run' || original === 'Benchmark complete') return style(original, ansi.bold, true);
    let line = original.replace(/^(\[\s*\d+\/\d+\]) (RUN|PASS|FAIL)\b/, (_, counter: string, status: string) => `${style(counter, ansi.dim, true)} ${style(status, status === 'PASS' ? ansi.green : status === 'FAIL' ? ansi.red : ansi.cyan, true)}`);
    line = line.replace(/(\d+ms \| \d+\.\d+s)/g, (value: string) => style(value, ansi.yellow, true));
    line = line.replace(/^(Artifacts:\s+)(.+)$/, (_, label: string, path: string) => `${label}${style(path, ansi.cyan, true)}`);
    return line.replace(/(first output )-(?= \|)|(Input tokens:\s+|Output tokens:\s+)-$/g, (value: string) => style(value, ansi.yellow, true));
  }).join('\n');
}

export function deriveBenchmarkRecord(case_: BenchmarkCase, events: readonly ApplicationEvent[], elapsedMs: number, repetition: number, execution: BenchmarkRecord['execution'], model: string, origin: string, label?: string, timestamps?: readonly number[]): BenchmarkRecord {
  let estimate: number | undefined; let input = 0; let output = 0; let hasInput = false; let hasOutput = false; let attemptStarted: number | undefined; let responseStart: number | undefined; let firstOutput: number | undefined;
  let attempts = 0; let rounds = 0; let retries = 0; const tools: string[] = []; let validations = 0; let terminal: Extract<ApplicationEvent, { type: 'turn.completed' | 'turn.failed' | 'turn.cancelled' }> | undefined; let providerStarted: number | undefined; const providerIntervals: Interval[] = []; const providerRoundIntervals: Interval[] = []; const toolStarted = new Map<string, number>(); const toolIntervals: Interval[] = []; const approvalStarted = new Map<string, number>(); const approvalIntervals: Interval[] = []; let lastAt = 0;
  const closeProvider = (at: number, completed = false) => { if (providerStarted === undefined) return; const interval: Interval = [providerStarted, Math.max(providerStarted, at)]; providerIntervals.push(interval); if (completed) providerRoundIntervals.push(interval); providerStarted = undefined; };
  const close = (starts: Map<string, number>, intervals: Interval[], callId: string, at: number) => { const started = starts.get(callId); if (started !== undefined) intervals.push([started, Math.max(started, at)]); starts.delete(callId); };
  for (const [index, event] of events.entries()) {
    const at = timestamps?.[index] ?? 0; lastAt = Math.max(lastAt, at);
    if (event.type === 'context.assembled') estimate = event.diagnostics.estimatedTokens;
    if (event.type === 'provider.attempt.started') { attempts += 1; attemptStarted ??= at; closeProvider(at); providerStarted = at; }
    if (event.type === 'provider.response.started') responseStart ??= at;
    if (event.type === 'provider.text.delta' || event.type === 'provider.tool.call') firstOutput ??= at;
    if (event.type === 'provider.response.completed') { closeProvider(at, true); rounds += 1; if (event.usage?.inputTokens !== undefined) { input += event.usage.inputTokens; hasInput = true; } if (event.usage?.outputTokens !== undefined) { output += event.usage.outputTokens; hasOutput = true; } }
    if (event.type === 'provider.error') closeProvider(at);
    if (event.type === 'provider.retry.scheduled') { retries += 1; closeProvider(at); }
    if (event.type === 'tool.requested' && !tools.includes(event.name)) tools.push(event.name);
    if (event.type === 'tool.started') toolStarted.set(event.callId, at);
    if (event.type === 'tool.completed' || event.type === 'tool.failed') close(toolStarted, toolIntervals, event.callId, at);
    if (event.type === 'approval.requested') approvalStarted.set(event.callId, at);
    if (event.type === 'approval.allowed' || event.type === 'approval.denied') close(approvalStarted, approvalIntervals, event.callId, at);
    if (event.type === 'validation.completed') validations += 1;
    if (event.type === 'turn.completed' || event.type === 'turn.failed' || event.type === 'turn.cancelled') terminal = event;
  }
  const finishedAt = Math.max(elapsedMs, lastAt); closeProvider(finishedAt); for (const [callId] of toolStarted) close(toolStarted, toolIntervals, callId, finishedAt); for (const [callId] of approvalStarted) close(approvalStarted, approvalIntervals, callId, finishedAt);
  const providerActiveMs = Math.round(unionDuration(providerIntervals)); const providerRoundActiveMs = Math.round(providerRoundIntervals.reduce((total, [start, end]) => total + end - start, 0)); const toolExecutionMs = Math.round(unionDuration(toolIntervals)); const approvalWaitMs = Math.round(unionDuration(approvalIntervals)); const measuredElapsedMs = Math.round(elapsedMs); const otherMs = Math.max(0, measuredElapsedMs - Math.round(unionDuration([...providerIntervals, ...toolIntervals, ...approvalIntervals])));
  const response = events.filter((event): event is Extract<ApplicationEvent, { type: 'assistant.response.completed' }> => event.type === 'assistant.response.completed').map((event) => event.text).join('').trim();
  const expectedTools = case_.expected.tools ?? []; const toolsOk = expectedTools.every((tool) => tools.includes(tool)); const toolCalls = events.filter((event) => event.type === 'tool.requested').length;
  const [minimumTools, maximumTools] = case_.expected.toolCallRange ?? [0, Number.POSITIVE_INFINITY]; const callCountOk = toolCalls >= minimumTools && toolCalls <= maximumTools;
  const answerOk = (case_.expected.answer === undefined || response === case_.expected.answer) && (case_.expected.requiredText === undefined || response.toLowerCase().includes(case_.expected.requiredText.toLowerCase()));
  const terminalOk = terminal?.type === 'turn.completed';
  const failureReason = !terminalOk ? terminal?.type === 'turn.failed' ? terminal.error.message : 'Turn did not complete.' : !toolsOk ? `Missing required tools: ${expectedTools.filter((tool) => !tools.includes(tool)).join(', ')}.` : !callCountOk ? `Expected ${minimumTools}-${maximumTools} tool calls; observed ${toolCalls}.` : !answerOk ? case_.expected.requiredText === undefined ? `Expected exact answer ${case_.expected.answer}.` : `Missing required fact: ${case_.expected.requiredText}.` : undefined;
  const memory = process.memoryUsage();
  return { suiteVersion: BENCHMARK_SUITE_VERSION, caseId: case_.id, caseVersion: case_.version, category: case_.category, ...(label === undefined ? {} : { label }), timestamp: new Date().toISOString(), repetition, execution, model, provider: { type: 'lm-studio-responses', origin }, contextProfileId: case_.contextProfileId ?? DEFAULT_CONTEXT_PROFILE.id, ...(case_.band === undefined ? {} : { requestedContextBand: case_.band }), ...(estimate === undefined ? {} : { estimatedContextTokens: estimate }), ...(hasInput ? { actualInputTokens: input } : {}), ...(hasOutput ? { actualOutputTokens: output } : {}), ...(attemptStarted === undefined || responseStart === undefined ? {} : { responseStartLatencyMs: Math.round(responseStart - attemptStarted) }), ...(attemptStarted === undefined || firstOutput === undefined ? {} : { firstOutputLatencyMs: Math.round(firstOutput - attemptStarted) }), elapsedMs: measuredElapsedMs, providerActiveMs, providerRoundActiveMs, averageProviderRoundMs: rounds === 0 ? 0 : Math.round(providerRoundActiveMs / rounds), providerActivePercent: percent(providerActiveMs, measuredElapsedMs), toolExecutionMs, toolExecutionPercent: percent(toolExecutionMs, measuredElapsedMs), approvalWaitMs, approvalWaitPercent: percent(approvalWaitMs, measuredElapsedMs), otherMs, otherPercent: percent(otherMs, measuredElapsedMs), providerAttempts: attempts, providerRounds: rounds, retries, toolCalls, uniqueTools: tools, validationCount: validations, rssBytes: memory.rss, heapUsedBytes: memory.heapUsed, passed: failureReason === undefined, ...(failureReason === undefined ? {} : { failureReason }), notes: ['providerActiveMs measures George-observed provider attempt lifecycles, not GPU inference time.', 'otherMs excludes the union of observed provider, tool, and approval intervals.', 'execution labels process order; it does not claim model residency control.'] };
}

async function runCase(case_: BenchmarkCase, provider: ModelProvider, options: BenchmarkOptions, repetition: number, execution: BenchmarkRecord['execution'], model: string, origin: string): Promise<BenchmarkRecord> {
  const root = await createBenchmarkFixture(case_.fixture); const state = await mkdtemp(join(tmpdir(), 'george-benchmark-config-')); const events: ApplicationEvent[] = []; const timestamps: number[] = [];
  try {
    const validation = validationFor(case_);
    const approval = createBenchmarkApproval(case_);
    const serviceOptions = { provider, workspace: root, userConfigRoot: state, toolNames: case_.fixture === 'none' ? [] : case_.fixture === 'code' || case_.fixture === 'tools' || case_.fixture === 'investigation' ? ['read_file'] : ['read_file', 'write_file', 'run_process'], approvalPort: approval, parallelSearch: false as const, mcp: false as const, chromeDevtools: false as const };
    const started = now();
    if (case_.fixture === 'edit' || case_.fixture === 'repository-workflow' || case_.fixture === 'extended') {
      const service = await createCodingWorkflowApplicationService(serviceOptions);
      await service.run({ session: createSession({ workspace: root }), input: case_.input(case_.band), validations: [{ label: 'fixture validation', intent: 'Verify the bounded edit.', executable: validation.executable, arguments: [...validation.arguments] }], onEvent: (event) => { events.push(event); timestamps.push(now() - started); } });
    } else {
      const service = await createAgentLoopApplicationService(serviceOptions);
      for await (const event of service.run({ session: createSession({ workspace: root }), input: case_.input(case_.band) })) { events.push(event); timestamps.push(now() - started); }
    }
    if (!await matchesBenchmarkFixtureEdit(root, case_.expected.edit)) { events.push({ type: 'turn.failed', turnId: 'benchmark-fixture', error: { code: 'validation', message: 'Fixture edit did not match expected content.' } }); timestamps.push(now() - started); }
    return deriveBenchmarkRecord(case_, events, now() - started, repetition, execution, model, origin, options.label, timestamps);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Benchmark case failed before completion.';
    return { ...deriveBenchmarkRecord(case_, events, 0, repetition, execution, model, origin, options.label, timestamps), passed: false, failureReason: message };
  } finally { await Promise.all([rm(root, { recursive: true, force: true }), rm(state, { recursive: true, force: true })]); }
}

async function git(): Promise<{ commit: string; dirty: boolean }> { try { const [commit, status] = await Promise.all([execFileAsync('git', ['rev-parse', 'HEAD']), execFileAsync('git', ['status', '--porcelain'])]); return { commit: commit.stdout.trim(), dirty: Boolean(status.stdout.trim()) }; } catch { return { commit: 'unknown', dirty: true }; } }
export function aggregates(records: readonly BenchmarkRecord[]): BenchmarkResults['aggregates'] { return Object.fromEntries([...new Set(records.map((record) => record.caseId))].map((id) => { const entries = records.filter((record) => record.caseId === id); const times = entries.map((record) => record.elapsedMs); return [id, { passed: entries.filter((record) => record.passed).length, total: entries.length, elapsedMs: { min: Math.min(...times), median: median(times), max: Math.max(...times) } }]; })); }

export async function runBenchmark(options: BenchmarkOptions, observer?: BenchmarkProgressObserver): Promise<BenchmarkResults> {
  const config = resolveGeorgeConfig({ baseUrl: options.baseUrl, model: options.model }); const provider = new LmStudioResponsesProvider({ baseUrl: config.provider.baseUrl, model: config.provider.model, timeoutMs: config.provider.timeoutMs }); const runGit = await git();
  const cases = casesFor(options.suite, options.contextBands); const totalExecutions = cases.length * options.repetitions;
  const runProgress: BenchmarkRunProgress = { suite: options.suite, suiteVersion: BENCHMARK_SUITE_VERSION, repetitions: options.repetitions, caseCount: cases.length, totalExecutions, ...(options.label === undefined ? {} : { label: options.label }), gitCommit: runGit.commit, dirty: runGit.dirty, provider: { type: 'lm-studio-responses', origin: config.provider.baseUrl.origin, model: config.provider.model } };
  try { observer?.onRunStarted?.(runProgress); } catch { /* Benchmark presentation must not affect execution. */ }
  const records: BenchmarkRecord[] = []; let first = true; let current = 0;
  for (let repetition = 1; repetition <= options.repetitions; repetition += 1) for (const case_ of cases) { const progress: BenchmarkCaseProgress = { current: ++current, total: totalExecutions, case_, repetition, repetitions: options.repetitions }; try { observer?.onCaseStarted?.(progress); } catch { /* Benchmark presentation must not affect execution. */ } const record = await runCase(case_, provider, options, repetition, first ? 'first-run-in-benchmark-process' : 'warm-repeat', config.provider.model, config.provider.baseUrl.origin); records.push(record); try { observer?.onCaseCompleted?.({ ...progress, record }); } catch { /* Benchmark presentation must not affect execution. */ } first = false; }
  return { schemaVersion: BENCHMARK_SCHEMA_VERSION, suiteVersion: BENCHMARK_SUITE_VERSION, run: { id: `${new Date().toISOString().replace(/[:.]/g, '-')}-${process.pid}`, startedAt: new Date().toISOString(), ...(options.label === undefined ? {} : { label: options.label }), suite: options.suite, repetitions: options.repetitions, gitCommit: runGit.commit, dirty: runGit.dirty, node: process.version, platform: `${platform()} ${release()}`, architecture: process.arch, cpu: cpus()[0]?.model ?? 'unknown', cpuCount: cpus().length, memoryBytes: totalmem(), provider: { type: 'lm-studio-responses', origin: config.provider.baseUrl.origin, model: config.provider.model } }, records, aggregates: aggregates(records) };
}

export function report(results: BenchmarkResults): string { const rows = results.records.map((record) => `| ${record.caseId} | ${record.passed ? 'pass' : 'FAIL'} | ${record.elapsedMs} | ${record.providerActiveMs} | ${record.toolExecutionMs} | ${record.approvalWaitMs} | ${record.otherMs} | ${record.providerAttempts} / ${record.providerRounds} | ${record.averageProviderRoundMs} | ${record.toolCalls} | ${record.retries} |`).join('\n'); const summaries = Object.entries(results.aggregates).map(([id, item]) => `| ${id} | ${item.passed}/${item.total} | ${item.elapsedMs.min} / ${item.elapsedMs.median} / ${item.elapsedMs.max} |`).join('\n'); const timing = timingSummary(results.records); const ladder = results.run.suite === 'context' ? `\n## Context ladder\n\n\`\`\`\n${formatContextLadderSummary(results.records)}\n\`\`\`\n` : ''; return `# George benchmark ${results.run.id}\n\nSuite: ${results.run.suite}; model: ${results.run.provider.model}; provider: ${results.run.provider.origin}.\n\n| Case | Result | Elapsed ms | Provider-active ms | Tool ms | Approval ms | Other ms | Attempts / rounds | Avg round ms | Tool calls | Retries |\n| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |\n${rows}\n\n| Aggregate case | Passed | Elapsed ms min / median / max |\n| --- | ---: | ---: |\n${summaries}${ladder}\n## Measured case timing\n\n${formatTiming(timing)}\n\nProvider-active time is George-observed provider attempt lifecycle time, not GPU inference time. Other time excludes the union of observed provider, tool, and approval intervals.\n`; }
export async function writeBenchmarkArtifacts(results: BenchmarkResults, root = join(process.cwd(), 'artifacts', 'benchmarks')): Promise<string> { const directory = join(resolve(root), results.run.id); await mkdir(directory, { recursive: true }); await Promise.all([writeFile(join(directory, 'results.json'), `${JSON.stringify(results, null, 2)}\n`), writeFile(join(directory, 'report.md'), report(results))]); return directory; }
export async function compareBenchmark(path: string, current: BenchmarkResults): Promise<string> { const previous = JSON.parse(await readFile(path, 'utf8')) as Partial<BenchmarkResults>; if (previous.schemaVersion !== current.schemaVersion || previous.suiteVersion !== current.suiteVersion) throw new Error(`Cannot compare benchmark schema/suite ${previous.schemaVersion ?? 'unknown'}/${previous.suiteVersion ?? 'unknown'} with ${current.schemaVersion}/${current.suiteVersion}.`); const lines = ['# Benchmark comparison', '', '| Case | elapsed ms delta | provider-active ms delta | provider attempts delta | tool calls delta | input/output tokens delta | pass |', '| --- | ---: | ---: | ---: | ---: | ---: | --- |']; for (const record of current.records) { const prior = previous.records?.find((item) => item.caseId === record.caseId && item.repetition === record.repetition); if (prior) lines.push(`| ${record.caseId} | ${record.elapsedMs - prior.elapsedMs} | ${record.providerActiveMs - prior.providerActiveMs} | ${record.providerAttempts - prior.providerAttempts} | ${record.toolCalls - prior.toolCalls} | ${(record.actualInputTokens ?? 0) - (prior.actualInputTokens ?? 0)} / ${(record.actualOutputTokens ?? 0) - (prior.actualOutputTokens ?? 0)} | ${prior.passed} -> ${record.passed} |`); } return `${lines.join('\n')}\n`; }
