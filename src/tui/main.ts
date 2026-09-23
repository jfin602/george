import { createCliRenderer } from '@opentui/core';

import { createAgentLoopApplicationService } from '../application/index.ts';
import { PendingApprovalPort, resolveGeorgeConfig } from '../core/index.ts';
import { LmStudioResponsesProvider } from '../provider/index.ts';
import { GeorgeTui } from './app.ts';

async function main(): Promise<void> {
  const config = resolveGeorgeConfig({
    workspace: process.argv[2],
    baseUrl: process.env.GEORGE_BASE_URL,
    model: process.env.GEORGE_MODEL,
  });
  if (!config.provider.model) throw new Error('Set GEORGE_MODEL before starting George.');
  const approvals = new PendingApprovalPort();
  const service = await createAgentLoopApplicationService({
    provider: new LmStudioResponsesProvider(config.provider),
    workspace: config.workspace,
    approvalPort: approvals,
    contextProfile: config.context.profile,
    userConfigRoot: config.userConfigRoot,
  });
  const renderer = await createCliRenderer({ exitOnCtrlC: false, exitSignals: [] });
  let tui: GeorgeTui | undefined;
  try {
    tui = new GeorgeTui({
      renderer,
      service,
      provider: 'LM Studio',
      model: config.provider.model,
      approvals,
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
