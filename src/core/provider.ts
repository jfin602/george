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

export type ProviderToolChoice = 'auto' | 'required' | 'none';
export type ProviderActivity = 'accepted' | 'output_progress';
export type ExecutionMode = 'human' | 'operation';
export type GeorgeOperationControl = Readonly<{ version: 1; control: 'handoff' }>;
export type ProviderOutputPolicy = Readonly<{ maxOutputTokens: number }>;
export const GEORGE_OPERATION_PROTOCOL_VERSION = 1;
export const MAX_OPERATION_TEXT_BYTES = 4 * 1024;
export const MAX_PROVIDER_ROUND_CONTEXT_BYTES = 8 * 1024;
export const MAX_PROVIDER_OUTPUT_TOKENS = 1_000_000;
export function validateProviderOutputPolicy(policy: ProviderOutputPolicy): ProviderOutputPolicy {
  if (!Number.isSafeInteger(policy.maxOutputTokens) || policy.maxOutputTokens < 1 || policy.maxOutputTokens > MAX_PROVIDER_OUTPUT_TOKENS) {
    throw new Error(`Provider output policy maxOutputTokens must be an integer between 1 and ${MAX_PROVIDER_OUTPUT_TOKENS}.`);
  }
  return Object.freeze({ maxOutputTokens: policy.maxOutputTokens });
}

export type ProviderRequest = Readonly<{
  executionMode: ExecutionMode;
  instructions?: string;
  input: string;
  /** Application-owned context appended after stable input/tool results for this logical round. */
  roundContext?: string;
  tools?: readonly ProviderToolDefinition[];
  toolChoice?: ProviderToolChoice;
  /** Provider-neutral intent; adapters opt in and translate their own wire field. */
  outputPolicy?: ProviderOutputPolicy;
  continuation?: ProviderContinuation;
}>;

export type ProviderStreamOptions = Readonly<{
  signal?: AbortSignal;
  timeoutMs?: number;
  /** Non-authoritative liveness only; no payload crosses this seam. */
  onActivity?: (activity: ProviderActivity) => void;
}>;

export interface ModelProvider {
  /** Explicit opt-in: adapters must not silently discard provider-visible round context. */
  readonly supportsRoundContext?: true;
  /** Explicit opt-in: adapters must translate ProviderOutputPolicy without truncating locally. */
  readonly supportsOutputPolicy?: true;
  stream(
    request: ProviderRequest,
    options?: ProviderStreamOptions,
  ): AsyncIterable<ProviderEvent>;
}
