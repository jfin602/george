import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { createAgentLoopApplicationService } from '../src/application/index.ts';
import { createSession } from '../src/core/index.ts';
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
  const root = await mkdtemp(join(tmpdir(), 'george-lm-studio-smoke-'));
  try {
    await Promise.all([
      writeFile(join(root, 'BOOT.md'), 'Smoke fixture boot.\n'),
      writeFile(join(root, 'AGENTS.md'), 'Smoke fixture instructions.\n'),
    ]);
    const provider = new LmStudioResponsesProvider({ baseUrl, model, ...(timeout === undefined ? {} : { timeoutMs: Number(timeout) }) });
    const service = await createAgentLoopApplicationService({ provider, workspace: root, maxToolCalls: 2, maxToolRounds: 2 });
    const started = performance.now();
    let completed = false;
    let toolCompleted = false;
    let usage: unknown;
    for await (const event of service.run({
      session: createSession({ workspace: root }),
      input: 'Use read_file to read BOOT.md, then answer with its exact one-line content.',
      timeoutMs: timeout === undefined ? undefined : Number(timeout),
    })) {
      if (event.type === 'tool.completed') toolCompleted = true;
      if (event.type === 'provider.response.completed') usage = event.usage;
      if (event.type === 'turn.completed') completed = true;
    }
    if (!completed || !toolCompleted) throw new Error('The bounded read-only tool cycle did not complete.');
    console.log(JSON.stringify({
      endpoint: provider.baseUrl.origin,
      model: model.slice(0, 128),
      completed,
      toolCompleted,
      elapsedMs: Math.round(performance.now() - started),
      ...(usage === undefined ? {} : { usage }),
    }));
  } catch {
    console.error('LM Studio read-only tool-cycle smoke failed.');
    process.exitCode = 1;
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}
