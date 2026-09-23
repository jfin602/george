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
