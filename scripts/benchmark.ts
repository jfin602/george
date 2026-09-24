import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import { compareBenchmark, parseBenchmarkArguments, benchmarkUsage, runBenchmark, writeBenchmarkArtifacts } from '../src/benchmark/index.ts';

try {
  const options = parseBenchmarkArguments(process.argv.slice(2));
  if ('help' in options) console.log(benchmarkUsage());
  else {
    const results = await runBenchmark(options);
    const directory = await writeBenchmarkArtifacts(results, options.artifactRoot);
    if (options.compare) await writeFile(join(directory, 'comparison.md'), await compareBenchmark(options.compare, results));
    console.log(`Benchmark artifacts: ${directory}`);
    console.log(`${results.records.filter((record) => record.passed).length}/${results.records.length} cases passed.`);
    if (results.records.some((record) => !record.passed)) process.exitCode = 1;
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : 'Benchmark failed.');
  console.error(benchmarkUsage());
  process.exitCode = 2;
}
