import type { GeorgeErrorShape } from './errors.ts';

export type ProviderUsage = Readonly<{
  inputTokens?: number;
  outputTokens?: number;
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
  | Readonly<{ type: 'turn.completed'; turnId: string }>
  | Readonly<{ type: 'turn.cancelled'; turnId: string; error: GeorgeErrorShape }>
  | Readonly<{ type: 'turn.failed'; turnId: string; error: GeorgeErrorShape }>;
