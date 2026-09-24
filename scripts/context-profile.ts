import { formatContextCompositionProfile, parseContextProfileArguments, profileContextComposition } from '../src/context/profiler.ts';

try {
  const options = parseContextProfileArguments(process.argv.slice(2));
  const pairs = 'all' in options
    ? [['ordinary', 'ordinary'], ['medium', 'medium'], ['large', 'large']] as const
    : [[options.profile, options.scenario]] as const;
  for (const [index, [profile, scenario]] of pairs.entries()) {
    if (index > 0) console.log('');
    console.log(formatContextCompositionProfile(await profileContextComposition(profile, scenario)));
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : 'Context profiling failed.');
  process.exitCode = 2;
}
