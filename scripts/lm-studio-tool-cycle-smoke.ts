import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { createAgentLoopApplicationService, diagnoseLmStudioToolCycle } from '../src/application/index.ts';
import { createSession, type ApplicationEvent } from '../src/core/index.ts';
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
    const service = await createAgentLoopApplicationService({ provider, workspace: root, toolNames: ['read_file'], maxToolCalls: 2, maxToolRounds: 2 });
    const started = performance.now();
    const events: ApplicationEvent[] = [];
    for await (const event of service.run({
      session: createSession({ workspace: root }),
      input: 'Use read_file to read BOOT.md, then answer with its exact one-line content.',
      timeoutMs: timeout === undefined ? undefined : Number(timeout),
    })) {
      events.push(event);
    }
    const diagnostic = diagnoseLmStudioToolCycle(events, performance.now() - started);
    if (diagnostic.classification !== 'success') {
      console.error(JSON.stringify({ error: 'LM Studio read-only tool-cycle smoke failed.', diagnostic }));
      process.exitCode = 1;
    } else {
      console.log(JSON.stringify({
        endpoint: provider.baseUrl.origin,
        model: model.slice(0, 128),
        completed: diagnostic.completed,
        toolCompleted: diagnostic.toolCompleted,
        requestedTools: diagnostic.requestedTools,
        elapsedMs: diagnostic.elapsedMs,
        ...(diagnostic.usage === undefined ? {} : { usage: diagnostic.usage }),
      }));
    }
  } catch {
    console.error(JSON.stringify({ error: 'LM Studio read-only tool-cycle smoke failed.', diagnostic: { classification: 'smoke-did-not-complete' } }));
    process.exitCode = 1;
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}
