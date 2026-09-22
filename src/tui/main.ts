import { createCliRenderer } from '@opentui/core';

import { createAgentLoopApplicationService } from '../application/index.ts';
import { resolveGeorgeConfig } from '../core/index.ts';
import { LmStudioResponsesProvider } from '../provider/index.ts';
import { GeorgeTui } from './app.ts';

async function main(): Promise<void> {
  const config = resolveGeorgeConfig({
    workspace: process.argv[2],
    baseUrl: process.env.GEORGE_BASE_URL,
    model: process.env.GEORGE_MODEL,
  });
  if (!config.provider.model) throw new Error('Set GEORGE_MODEL before starting George.');
  const service = await createAgentLoopApplicationService({
    provider: new LmStudioResponsesProvider(config.provider),
    workspace: config.workspace,
  });
  const renderer = await createCliRenderer({ exitOnCtrlC: false });
  let tui: GeorgeTui | undefined;
  try {
    tui = new GeorgeTui({
      renderer,
      service,
      provider: 'LM Studio',
      model: config.provider.model,
    });
    await tui.run();
  } finally {
    tui?.close();
    if (!renderer.isDestroyed) renderer.destroy();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
