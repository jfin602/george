import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import { colorizeBenchmarkTerminal, compareBenchmark, formatBenchmarkCaseCompleted, formatBenchmarkCaseStarted, formatBenchmarkRunHeader, formatBenchmarkSummary, parseBenchmarkArguments, benchmarkUsage, runBenchmark, writeBenchmarkArtifacts } from '../src/benchmark/index.ts';

const color = Boolean(process.stdout.isTTY && !Object.hasOwn(process.env, 'NO_COLOR'));
const output = (text: string): void => console.log(colorizeBenchmarkTerminal(text, color));

try {
  const options = parseBenchmarkArguments(process.argv.slice(2));
  if ('help' in options) output(benchmarkUsage());
  else {
    const started = performance.now();
    const results = await runBenchmark(options, {
      onRunStarted: (run) => output(formatBenchmarkRunHeader(run)),
      onCaseStarted: (progress) => output(formatBenchmarkCaseStarted(progress)),
      onCaseCompleted: (progress) => output(formatBenchmarkCaseCompleted(progress)),
    });
    const directory = await writeBenchmarkArtifacts(results, options.artifactRoot);
    if (options.compare) await writeFile(join(directory, 'comparison.md'), await compareBenchmark(options.compare, results));
    output(formatBenchmarkSummary(results, performance.now() - started, directory));
    if (results.records.some((record) => !record.passed)) process.exitCode = 1;
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : 'Benchmark failed.');
  console.error(benchmarkUsage());
  process.exitCode = 2;
}
