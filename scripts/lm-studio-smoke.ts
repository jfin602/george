import { LmStudioResponsesProvider } from '../src/provider/index.ts';

function argument(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  return index === -1 ? undefined : process.argv[index + 1];
}

const baseUrl = argument('--base-url');
const model = argument('--model');
const timeout = argument('--timeout-ms');
if (!baseUrl || !model || process.argv.some((value) => value.startsWith('--') && !['--base-url', '--model', '--timeout-ms'].includes(value))) {
  console.error('Usage: npm run smoke:lm-studio -- --base-url <loopback-url> --model <model-id> [--timeout-ms <ms>]');
  process.exitCode = 2;
} else {
  try {
    const provider = new LmStudioResponsesProvider({
      baseUrl,
      model,
      ...(timeout === undefined ? {} : { timeoutMs: Number(timeout) }),
    });
    const started = performance.now();
    let textLength = 0;
    let completed = false;
    let usage: unknown;
    for await (const event of provider.stream({ input: 'Reply with OK.' })) {
      if (event.type === 'provider.text.delta') textLength += event.delta.length;
      if (event.type === 'provider.response.completed') {
        completed = true;
        usage = event.usage;
      }
    }
    if (!completed || textLength === 0) throw new Error('No streamed completion text.');
    console.log(JSON.stringify({
      endpoint: provider.baseUrl.origin,
      model: model.slice(0, 128),
      completed,
      textLength,
      elapsedMs: Math.round(performance.now() - started),
      ...(usage === undefined ? {} : { usage }),
    }));
  } catch {
    console.error('LM Studio smoke failed.');
    process.exitCode = 1;
  }
}
