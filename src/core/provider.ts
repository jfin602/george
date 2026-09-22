import type { ProviderEvent } from './events.ts';

export type JsonValue = null | boolean | number | string | JsonObject | readonly JsonValue[];
export interface JsonObject {
  readonly [key: string]: JsonValue;
}

export type ProviderToolDefinition = Readonly<{
  name: string;
  description: string;
  inputSchema: JsonObject;
}>;

export type ProviderToolResult = Readonly<{
  callId: string;
  name: string;
  result:
    | Readonly<{ ok: true; value: JsonValue }>
    | Readonly<{ ok: false; error: Readonly<{ code: string; message: string }> }>;
}>;

export type ProviderContinuation = Readonly<{
  responseId: string;
  toolResults: readonly ProviderToolResult[];
}>;

export type ProviderRequest = Readonly<{
  instructions?: string;
  input: string;
  tools?: readonly ProviderToolDefinition[];
  continuation?: ProviderContinuation;
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
