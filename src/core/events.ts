import type { GeorgeErrorShape } from './errors.ts';
import type { ApprovalRequest } from './approval.ts';
import type { ContextProfile } from './config.ts';

export type ProviderUsage = Readonly<{
  inputTokens?: number;
  outputTokens?: number;
}>;

export type ContextDiagnosticEvidence = Readonly<{
  id: string;
  disposition: 'omitted' | 'deferred' | 'duplicate' | 'failed' | 'routed';
  reason?: string;
  duplicateOf?: string;
}>;

export type ContextDiagnostics = Readonly<{
  profileId: string;
  profile: ContextProfile;
  estimatedTokens: number;
  estimator: string;
  providerInputBudget: number;
  remainingHeadroom: number;
  softPressure: boolean;
  reservedHeadroom: number;
  categoryTokens: Readonly<{ core: number; project: number; tools: number; task: number; skills: number; routed: number; conversation: number; toolResults: number }>;
  activeSourceIds: readonly string[];
  evidence: readonly ContextDiagnosticEvidence[];
}>;

export type WorkflowChange = Readonly<{
  path: string;
  relationship: 'pre-existing' | 'newly-observed' | 'no-longer-observed';
  directGeorgeMutation: boolean;
}>;

export type WorkflowValidation = Readonly<{
  callId: string;
  label: string;
  intent: string;
  executable: string;
  arguments: readonly string[];
  cwd: string;
  status: 'passed' | 'failed' | 'denied' | 'cancelled';
  exitCode: number | null;
  signal: string | null;
  outcome?: 'completed' | 'failed' | 'timed_out' | 'spawn_failed';
  stdout: string;
  stderr: string;
  stdoutTruncated: boolean;
  stderrTruncated: boolean;
  error?: Readonly<{ code: string; message: string }>;
}>;

export type WorkflowCompletion = Readonly<{
  baselineAvailable: boolean;
  finalStateAvailable: boolean;
  changes: readonly WorkflowChange[];
  directMutations: readonly Readonly<{ tool: 'write_file' | 'apply_patch'; path: string; bytes: number; sha256: string }>[];
  validations: readonly WorkflowValidation[];
  warnings: readonly string[];
  terminalState: 'completed' | 'failed' | 'cancelled';
  finalAssistantResponse: string;
}>;

export type WorkStatus = 'requested' | 'running' | 'waiting' | 'succeeded' | 'missing' | 'skipped' | 'failed' | 'denied' | 'cancelled' | 'interrupted';
export type WorkCategory = 'context' | 'inspection' | 'editing' | 'approval' | 'process' | 'validation' | 'recovery' | 'completion';
export type ProgressCategory = 'context' | 'inspection' | 'editing' | 'validation' | 'recovery' | 'completion';

/** Deliberately small, display-safe operation metadata. It never contains result bodies or environment data. */
export type WorkDetails = Readonly<{
  path?: string;
  query?: string;
  count?: number;
  bytes?: number;
  scannedFiles?: number;
  scannedBytes?: number;
  executable?: string;
  argv?: readonly string[];
  cwd?: string;
  timeoutMs?: number;
  exitCode?: number | null;
  signal?: string | null;
  outcome?: 'completed' | 'failed' | 'timed_out' | 'spawn_failed';
  truncated?: boolean;
  error?: string;
  requestedArguments?: string;
}>;

export type WorkItem = Readonly<{
  id: string;
  turnId: string;
  operationId: string;
  category: WorkCategory;
  status: WorkStatus;
  summary: string;
  details: WorkDetails;
}>;

export type ProviderEvent =
  | Readonly<{ type: 'provider.response.started'; responseId?: string }>
  | Readonly<{ type: 'provider.text.delta'; delta: string }>
  | Readonly<{
      type: 'provider.tool.call';
      callId: string;
      name: string;
      arguments: string;
    }>
  | Readonly<{ type: 'provider.response.completed'; usage?: ProviderUsage }>
  | Readonly<{ type: 'provider.error'; error: GeorgeErrorShape }>;

export type ApplicationEvent =
  | ProviderEvent
  | Readonly<{ type: 'turn.started'; turnId: string }>
  | Readonly<{ type: 'input.submitted'; text: string }>
  | Readonly<{ type: 'assistant.response.completed'; turnId: string; text: string }>
  | Readonly<{ type: 'context.source'; turnId: string; sourceId: string; kind: string; status: 'loading' | 'loaded' | 'missing' | 'oversized' | 'failed'; bytes?: number }>
  | Readonly<{ type: 'context.assembled'; turnId: string; diagnostics: ContextDiagnostics }>
  | Readonly<{ type: 'turn.completed'; turnId: string }>
  | Readonly<{ type: 'turn.cancelled'; turnId: string; error: GeorgeErrorShape }>
  | Readonly<{ type: 'turn.failed'; turnId: string; error: GeorgeErrorShape }>
  | Readonly<{
      type: 'tool.requested';
      turnId: string;
      callId: string;
      name: string;
      arguments: string;
    }>
  | Readonly<{ type: 'tool.started'; turnId: string; callId: string; name: string }>
  | Readonly<{ type: 'approval.requested'; turnId: string; callId: string; request: ApprovalRequest }>
  | Readonly<{ type: 'approval.allowed'; turnId: string; callId: string; request: ApprovalRequest }>
  | Readonly<{ type: 'approval.denied'; turnId: string; callId: string; request: ApprovalRequest }>
  | Readonly<{ type: 'validation.started'; turnId: string; callId: string; label: string; intent: string }>
  | Readonly<{ type: 'validation.completed'; turnId: string; callId: string; status: 'passed' | 'failed' | 'denied' | 'cancelled'; exitCode: number | null; signal: string | null; outcome?: 'completed' | 'failed' | 'timed_out' | 'spawn_failed'; stdoutTruncated: boolean; stderrTruncated: boolean; error?: Readonly<{ code: string; message: string }> }>
  | Readonly<{ type: 'workflow.completed'; turnId: string; completion: WorkflowCompletion }>
  | Readonly<{ type: 'activity.updated'; turnId?: string; category: WorkCategory; message: string }>
  | Readonly<{ type: 'progress.milestone'; turnId: string; category: ProgressCategory; message: string }>
  | Readonly<{ type: 'work.updated'; item: WorkItem }>
  | Readonly<{
      type: 'tool.completed';
      turnId: string;
      callId: string;
      name: string;
      result: Readonly<{ ok: true; value: import('./provider.ts').JsonValue }>;
    }>
  | Readonly<{
      type: 'tool.failed';
      turnId: string;
      callId: string;
      name: string;
      result: Readonly<{ ok: false; error: Readonly<{ code: string; message: string }> }>;
    }>;
