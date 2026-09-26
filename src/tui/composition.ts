import {
  StructuredTaskApplicationService,
  createAgentLoopApplicationService,
  type AgentLoopServiceOptions,
} from '../application/index.ts';
import type { LocalSessionStore, Session } from '../core/index.ts';

export type TuiApplicationServiceOptions = AgentLoopServiceOptions & Readonly<{
  sessionStore: LocalSessionStore;
  session?: Session;
}>;

/** Production composition only; agent-loop and structured-task behavior remain application-owned. */
export async function createTuiApplicationService(options: TuiApplicationServiceOptions): Promise<StructuredTaskApplicationService> {
  const { sessionStore, session, ...agentOptions } = options;
  const service = new StructuredTaskApplicationService(await createAgentLoopApplicationService(agentOptions), sessionStore);
  if (session) {
    await service.agent.recover(session);
    await sessionStore.save(session);
  }
  return service;
}
