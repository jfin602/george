import type { GeorgeErrorShape } from './errors.ts';
import type { ApprovalRequest } from './approval.ts';
import type { ContextOperatingMode, ContextProfile } from './config.ts';
import type { RunBudgetDimension, RunBudgetSnapshot } from './run-budget.ts';
import type { ToolExecutionMetadata } from './execution.ts';
import type { TaskStatus } from '../tasks/state.ts';

export type ContextCheckpointEvidence = Readonly<{
  version: number;
  id: string;
  start: number;
  end: number;
  rangeDigest: string;
  summaryDigest: string;
  summary: string;
  beforeTokens: number;
  afterTokens: number;
  reason: 'soft-pressure' | 'hard-pressure';
}>;

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
  mode: ContextOperatingMode;
  profileId: string;
  profile: ContextProfile;
  attemptedProfileIds: readonly string[];
  promotionReasons: readonly ('required-source-failure' | 'soft-pressure' | 'selected-project-instructions' | 'routed-document' | 'activated-skill')[];
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

/** Monotonic workflow measurements; category totals are non-overlapping wall-clock intervals. */
export type WorkflowTiming = Readonly<{
  totalMs: number;
  providerMs: number;
  toolMs: number;
  approvalMs: number;
  otherMs: number;
}>;

export type WorkflowCompletion = Readonly<{
  baselineAvailable: boolean;
  finalStateAvailable: boolean;
  changes: readonly WorkflowChange[];
  directMutations: readonly Readonly<{ tool: 'write_file' | 'apply_patch'; path: string; bytes: number; sha256: string }>[];
  validations: readonly WorkflowValidation[];
  warnings: readonly string[];
  terminalState: 'completed' | 'failed' | 'cancelled' | 'budget_exhausted';
  finalAssistantResponse: string;
  timing?: WorkflowTiming;
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
  timing?: WorkflowTiming;
}>;

export type WorkItem = Readonly<{
  id: string;
  turnId: string;
  operationId: string;
  category: WorkCategory;
  status: WorkStatus;
  summary: string;
  details: WorkDetails;
  /** Monotonic elapsed time, derived solely for presentation/work evidence. */
  elapsedMs?: number;
}>;

export type RecoveryIntent =
  | Readonly<{ name: 'write_file'; path: string; desiredBytes: number; desiredSha256: string; precondition: 'absent' | string }>
  | Readonly<{ name: 'apply_patch'; path: string; precondition: string; edits: number }>
  | Readonly<{ name: 'create_directory'; path: string }>;

export type RecoveryOutcome = 'confirmed_complete' | 'confirmed_incomplete' | 'interrupted' | 'outcome_unknown';
export type HookOrigin = Readonly<{ hookId: string }>;

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
  | Readonly<{ type: 'reliability.run.started'; turnId: string; runId: string; budget: RunBudgetSnapshot }>
  | Readonly<{ type: 'provider.attempt.started'; turnId: string; runId: string; attemptId: string }>
  | Readonly<{ type: 'provider.retry.scheduled'; turnId: string; runId: string; attemptId: string; retry: number; delayMs: number; category: 'provider' }>
  | Readonly<{ type: 'provider.retry.exhausted'; turnId: string; runId: string; attemptId: string; retries: number; category: 'provider' }>
  | Readonly<{ type: 'budget.state'; turnId: string; runId: string; budget: RunBudgetSnapshot }>
  | Readonly<{ type: 'budget.pressure'; turnId: string; runId: string; dimensions: readonly RunBudgetDimension[]; budget: RunBudgetSnapshot }>
  | Readonly<{ type: 'budget.exhausted'; turnId: string; runId: string; dimension: RunBudgetDimension; budget: RunBudgetSnapshot }>
  | Readonly<{ type: 'context.compaction.started'; turnId: string; runId: string; start: number; end: number; reason: 'soft-pressure' | 'hard-pressure' }>
  | Readonly<{ type: 'context.compaction.completed'; turnId: string; runId: string; checkpoint: ContextCheckpointEvidence }>
  | Readonly<{ type: 'context.compaction.failed'; turnId: string; runId: string; reason: string }>
  | Readonly<{ type: 'turn.started'; turnId: string }>
  | Readonly<{ type: 'input.submitted'; text: string }>
  | Readonly<{ type: 'assistant.response.completed'; turnId: string; text: string }>
  | Readonly<{ type: 'context.source'; turnId: string; sourceId: string; kind: string; status: 'loading' | 'loaded' | 'missing' | 'oversized' | 'failed'; bytes?: number }>
  | Readonly<{ type: 'context.assembled'; turnId: string; diagnostics: ContextDiagnostics }>
  | Readonly<{ type: 'turn.completed'; turnId: string }>
  | Readonly<{ type: 'turn.cancelled'; turnId: string; error: GeorgeErrorShape }>
  | Readonly<{ type: 'turn.failed'; turnId: string; error: GeorgeErrorShape }>
  | Readonly<{ type: 'hook.started'; turnId?: string; hookId: string; event: string }>
  | Readonly<{ type: 'hook.completed'; turnId?: string; hookId: string; event: string; status: 'succeeded' | 'failed' | 'timed_out' | 'cancelled'; message?: string }>
  | Readonly<{ type: 'recovery.intent'; turnId: string; callId: string; intent: RecoveryIntent }>
  | Readonly<{ type: 'recovery.decision'; turnId: string; callId?: string; kind: 'mutation' | 'process' | 'external' | 'approval' | 'provider-continuation'; name?: string; outcome: RecoveryOutcome; evidence: string }>
  | Readonly<{
      type: 'tool.requested';
      turnId: string;
      callId: string;
      name: string;
      arguments: string;
      execution?: ToolExecutionMetadata;
      origin?: HookOrigin;
    }>
  | Readonly<{ type: 'tool.started'; turnId: string; callId: string; name: string; execution?: ToolExecutionMetadata; origin?: HookOrigin }>
  | Readonly<{ type: 'approval.requested'; turnId: string; callId: string; request: ApprovalRequest; origin?: HookOrigin }>
  | Readonly<{ type: 'approval.allowed'; turnId: string; callId: string; request: ApprovalRequest; origin?: HookOrigin }>
  | Readonly<{ type: 'approval.denied'; turnId: string; callId: string; request: ApprovalRequest; origin?: HookOrigin }>
  | Readonly<{ type: 'validation.started'; turnId: string; callId: string; label: string; intent: string }>
  | Readonly<{ type: 'validation.completed'; turnId: string; callId: string; status: 'passed' | 'failed' | 'denied' | 'cancelled'; exitCode: number | null; signal: string | null; outcome?: 'completed' | 'failed' | 'timed_out' | 'spawn_failed'; stdoutTruncated: boolean; stderrTruncated: boolean; error?: Readonly<{ code: string; message: string }> }>
  | Readonly<{ type: 'workflow.completed'; turnId: string; completion: WorkflowCompletion }>
  /** Bounded structured-task lifecycle/projection evidence; task/provider/tool bodies never appear here. */
  | Readonly<{ type: 'task.updated'; turnId: string; fingerprint: string; status: TaskStatus; currentWorkUnit?: string; blockerCount: number }>
  | Readonly<{ type: 'stack.updated'; turnId: string; fingerprint: string; stackId: string; status: TaskStatus; currentTaskOrdinal?: number; completedTasks: number; totalTasks: number }>
  | Readonly<{ type: 'activity.updated'; turnId?: string; category: WorkCategory; message: string }>
  | Readonly<{ type: 'progress.milestone'; turnId: string; category: ProgressCategory; message: string }>
  | Readonly<{ type: 'work.updated'; item: WorkItem }>
  | Readonly<{
      type: 'tool.completed';
      turnId: string;
      callId: string;
      name: string;
      result: Readonly<{ ok: true; value: import('./provider.ts').JsonValue }>;
      execution?: ToolExecutionMetadata;
      origin?: HookOrigin;
    }>
  | Readonly<{
      type: 'tool.failed';
      turnId: string;
      callId: string;
      name: string;
      result: Readonly<{ ok: false; error: Readonly<{ code: string; message: string }> }>;
      execution?: ToolExecutionMetadata;
      origin?: HookOrigin;
    }>;
