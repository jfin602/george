import { createCliRenderer } from '@opentui/core';

import { createCodingWorkflowApplicationService } from '../application/index.ts';
import { LocalSessionStore, PendingApprovalPort, resolveGeorgeConfig } from '../core/index.ts';
import { LmStudioResponsesProvider } from '../provider/index.ts';
import { GeorgeTui } from './app.ts';

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  let workspace: string | undefined;
  let resume: string | undefined;
  for (let index = 0; index < args.length; index += 1) {
    if (args[index] === '--resume') {
      resume = args[++index];
      if (!resume) throw new Error('Usage: george [workspace] [--resume <session-id>]');
    } else if (workspace === undefined) workspace = args[index];
    else throw new Error('Usage: george [workspace] [--resume <session-id>]');
  }
  const config = resolveGeorgeConfig({
    workspace,
    baseUrl: process.env.GEORGE_BASE_URL,
    model: process.env.GEORGE_MODEL,
  });
  const approvals = new PendingApprovalPort();
  const store = new LocalSessionStore();
  const session = resume === undefined ? undefined : await store.open(resume, config.workspace);
  const service = await createCodingWorkflowApplicationService({
    provider: new LmStudioResponsesProvider(config.provider),
    workspace: config.workspace,
    approvalPort: approvals,
    contextProfile: config.context.profile,
    runBudget: config.runBudget,
    userConfigRoot: config.userConfigRoot,
    sessionStore: store,
  });
  if (session) {
    await service.agent.recover(session);
    await store.save(session);
  }
  const renderer = await createCliRenderer({ exitOnCtrlC: false, exitSignals: [] });
  let tui: GeorgeTui | undefined;
  try {
    tui = new GeorgeTui({
      renderer,
      service,
      provider: 'LM Studio',
      model: config.provider.model,
      approvals,
      session,
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
