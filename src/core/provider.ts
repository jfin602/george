import type { ProviderEvent } from './events.ts';

export type ProviderRequest = Readonly<{
  instructions?: string;
  input: string;
}>;

export type ProviderStreamOptions = Readonly<{
  signal?: AbortSignal;
  timeoutMs?: number;
}>;

export interface ModelProvider {
  stream(
    request: ProviderRequest,
    options?: ProviderStreamOptions,
  ): AsyncIterable<ProviderEvent>;
}
