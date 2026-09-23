/** George-owned execution classification; adapters and providers cannot alter it at call time. */
export type ToolEffect = 'local_read' | 'workspace_mutation' | 'host_process' | 'external_read' | 'remote_mutation' | 'browser_observation' | 'browser_interaction' | 'unknown_external';
export type ToolReplaySafety = 'replay_safe' | 'not_replay_safe';
export type ToolSource = Readonly<{ kind: 'builtin' }> | Readonly<{ kind: 'plugin'; id: string }> | Readonly<{ kind: 'adapter'; id: string; server?: string }>;
/** Bounded display/evidence fields only. Credential values never belong here. */
export type ToolExecutionDescriptor = Readonly<{ service?: string; origin?: string; resource?: string; operation?: string; credentialConfigured?: boolean }>;
export type ToolExecutionMetadata = Readonly<{ effect: ToolEffect; replaySafety: ToolReplaySafety; source: ToolSource; descriptor?: ToolExecutionDescriptor }>;
