/** George-owned execution classification; adapters and providers cannot alter it at call time. */
export type ToolEffect = 'local_read' | 'workspace_mutation' | 'sandboxed_workspace_process' | 'host_process' | 'external_read' | 'remote_mutation' | 'browser_observation' | 'browser_interaction' | 'unknown_external';
export type ToolReplaySafety = 'replay_safe' | 'not_replay_safe';
export type ToolSource = Readonly<{ kind: 'builtin' }> | Readonly<{ kind: 'plugin'; id: string }> | Readonly<{ kind: 'adapter'; id: string; server?: string }>;
/** Bounded display/evidence fields only. Credential values never belong here. */
export type ToolExecutionDescriptor = Readonly<{ service?: string; origin?: string; resource?: string; operation?: string; warning?: string; credentialConfigured?: boolean }>;
export type ToolExecutionMetadata = Readonly<{ effect: ToolEffect; replaySafety: ToolReplaySafety; source: ToolSource; descriptor?: ToolExecutionDescriptor }>;

/** User-owned ceiling. `ask` is intentionally not an automatic grant. */
export type ExecutionPolicy = Readonly<{
  workspace: 'standard' | 'workspace_autonomous';
  outsideWorkspace: 'reject' | 'ask';
  network: 'reject' | 'ask';
  remoteMutation: 'reject' | 'ask';
  browserInteraction: 'reject' | 'ask';
  credentialsEnvironment: 'reject' | 'ask';
}>;

export const DEFAULT_EXECUTION_POLICY: ExecutionPolicy = Object.freeze({
  workspace: 'standard', outsideWorkspace: 'reject', network: 'ask', remoteMutation: 'ask', browserInteraction: 'ask', credentialsEnvironment: 'ask',
});

export function validateExecutionPolicy(value: ExecutionPolicy): ExecutionPolicy {
  if (!['standard', 'workspace_autonomous'].includes(value.workspace)
    || !['reject', 'ask'].includes(value.outsideWorkspace)
    || !['reject', 'ask'].includes(value.network)
    || !['reject', 'ask'].includes(value.remoteMutation)
    || !['reject', 'ask'].includes(value.browserInteraction)
    || !['reject', 'ask'].includes(value.credentialsEnvironment)) throw new Error('Invalid execution policy.');
  return Object.freeze({ ...value });
}

/** The restrictive value wins; a submitted task can only reduce this ceiling. */
export function intersectExecutionPolicy(configured: ExecutionPolicy, requested: Partial<ExecutionPolicy> = {}): ExecutionPolicy {
  const ask = (key: Exclude<keyof ExecutionPolicy, 'workspace'>) => configured[key] === 'ask' && requested[key] !== 'reject' ? 'ask' : 'reject';
  const workspace = configured.workspace === 'workspace_autonomous' && requested.workspace !== 'standard' ? 'workspace_autonomous' : 'standard';
  return validateExecutionPolicy({
    workspace,
    // Standard retains the historical workspace-only filesystem contract.
    outsideWorkspace: workspace === 'workspace_autonomous' ? ask('outsideWorkspace') : 'reject', network: ask('network'), remoteMutation: ask('remoteMutation'),
    browserInteraction: ask('browserInteraction'), credentialsEnvironment: ask('credentialsEnvironment'),
  });
}
