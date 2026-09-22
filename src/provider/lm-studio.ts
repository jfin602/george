import {
  GeorgeError,
  cancellationError,
  validateModelId,
  validateProviderBaseUrl,
  type ModelProvider,
  type ProviderEvent,
  type ProviderRequest,
  type ProviderStreamOptions,
  type ProviderUsage,
} from '../core/index.ts';

export const DEFAULT_PROVIDER_TIMEOUT_MS = 30_000;
export const MAX_PROVIDER_TIMEOUT_MS = 120_000;

type SseMessage = Readonly<{ event?: string; data: string }>;

export type LmStudioProviderConfig = Readonly<{
  baseUrl: URL | string;
  model?: string;
  timeoutMs?: number;
}>;

function providerError(message: string, cause?: unknown): GeorgeError {
  return new GeorgeError('provider', message, cause === undefined ? undefined : { cause });
}

function timeoutMs(value: number | undefined): number {
  const timeout = value ?? DEFAULT_PROVIDER_TIMEOUT_MS;
  if (!Number.isInteger(timeout) || timeout < 1 || timeout > MAX_PROVIDER_TIMEOUT_MS) {
    throw new GeorgeError(
      'configuration',
      `Provider timeout must be an integer between 1 and ${MAX_PROVIDER_TIMEOUT_MS} ms.`,
    );
  }
  return timeout;
}

function usageFrom(value: unknown): ProviderUsage | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const usage = value as Record<string, unknown>;
  const inputTokens = usage.input_tokens;
  const outputTokens = usage.output_tokens;
  const normalized = {
    ...(typeof inputTokens === 'number' && Number.isFinite(inputTokens)
      ? { inputTokens }
      : {}),
    ...(typeof outputTokens === 'number' && Number.isFinite(outputTokens)
      ? { outputTokens }
      : {}),
  };
  return Object.keys(normalized).length === 0 ? undefined : normalized;
}

function stringAt(value: unknown, key: string): string | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const candidate = (value as Record<string, unknown>)[key];
  return typeof candidate === 'string' ? candidate : undefined;
}

function functionCallFrom(value: unknown): Extract<ProviderEvent, { type: 'provider.tool.call' }> | undefined {
  const item = value && typeof value === 'object' && 'item' in value
    ? (value as { item: unknown }).item
    : value;
  if (stringAt(item, 'type') !== 'function_call') return undefined;
  const callId = stringAt(item, 'call_id');
  const name = stringAt(item, 'name');
  const arguments_ = stringAt(item, 'arguments');
  if (!callId || !name || arguments_ === undefined) {
    throw providerError('LM Studio sent an incomplete function call.');
  }
  return { type: 'provider.tool.call', callId, name, arguments: arguments_ };
}

function normalizeMessage(message: SseMessage): ProviderEvent | undefined {
  if (message.data === '[DONE]') return undefined;

  let payload: unknown;
  try {
    payload = JSON.parse(message.data);
  } catch {
    throw providerError('LM Studio sent malformed SSE JSON.');
  }
  if (!payload || typeof payload !== 'object') {
    throw providerError('LM Studio sent an invalid SSE event payload.');
  }

  const wireType = message.event && message.event !== 'message'
    ? message.event
    : stringAt(payload, 'type');
  const response = (payload as Record<string, unknown>).response;
  switch (wireType) {
    case 'response.created':
      return {
        type: 'provider.response.started',
        ...(stringAt(response, 'id') ? { responseId: stringAt(response, 'id') } : {}),
      };
    case 'response.output_text.delta': {
      const delta = stringAt(payload, 'delta');
      if (delta === undefined) throw providerError('LM Studio sent a text delta without text.');
      return { type: 'provider.text.delta', delta };
    }
    case 'response.function_call_arguments.done': {
      const callId = stringAt(payload, 'call_id');
      const name = stringAt(payload, 'name');
      const arguments_ = stringAt(payload, 'arguments');
      if (!callId || !name || arguments_ === undefined) {
        throw providerError('LM Studio sent an incomplete function call.');
      }
      return { type: 'provider.tool.call', callId, name, arguments: arguments_ };
    }
    case 'response.output_item.done':
      return functionCallFrom(payload);
    case 'response.completed': {
      const responseUsage = response && typeof response === 'object'
        ? (response as Record<string, unknown>).usage
        : undefined;
      const usage = usageFrom(responseUsage) ?? usageFrom((payload as Record<string, unknown>).usage);
      return { type: 'provider.response.completed', ...(usage === undefined ? {} : { usage }) };
    }
    case 'error':
    case 'response.failed':
    case 'response.incomplete':
      throw providerError('LM Studio reported a provider error.', { event: wireType });
    default:
      return undefined;
  }
}

/** Parse SSE frames without assuming network chunk boundaries. */
export async function* parseSse(
  body: ReadableStream<Uint8Array>,
): AsyncGenerator<SseMessage> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let event: string | undefined;
  let data: string[] = [];

  const processLine = (line: string): SseMessage | undefined => {
    if (line === '') {
      const message = data.length === 0
        ? undefined
        : { ...(event === undefined ? {} : { event }), data: data.join('\n') };
      event = undefined;
      data = [];
      return message;
    }
    if (line.startsWith(':')) return undefined;
    const colon = line.indexOf(':');
    const field = colon === -1 ? line : line.slice(0, colon);
    const value = colon === -1 ? '' : line.slice(colon + 1).replace(/^ /, '');
    if (field === 'event') event = value;
    if (field === 'data') data.push(value);
    return undefined;
  };

  try {
    while (true) {
      const { done, value } = await reader.read();
      buffer += decoder.decode(value, { stream: !done });
      let newline: number;
      while ((newline = buffer.indexOf('\n')) !== -1) {
        const rawLine = buffer.slice(0, newline);
        buffer = buffer.slice(newline + 1);
        const message = processLine(rawLine.endsWith('\r') ? rawLine.slice(0, -1) : rawLine);
        if (message) yield message;
      }
      if (done) break;
    }
  } finally {
    reader.releaseLock();
  }
  if (buffer || data.length > 0 || event !== undefined) {
    throw providerError('LM Studio closed an incomplete SSE event.');
  }
}

export class LmStudioResponsesProvider implements ModelProvider {
  readonly baseUrl: URL;
  readonly model: string | undefined;
  readonly defaultTimeoutMs: number;

  constructor(config: LmStudioProviderConfig) {
    this.baseUrl = validateProviderBaseUrl(config.baseUrl);
    this.model = config.model === undefined ? undefined : validateModelId(config.model);
    this.defaultTimeoutMs = timeoutMs(config.timeoutMs);
  }

  async *stream(
    request: ProviderRequest,
    options: ProviderStreamOptions = {},
  ): AsyncGenerator<ProviderEvent> {
    if (!this.model) {
      const error = new GeorgeError('configuration', 'LM Studio model ID is required.');
      yield { type: 'provider.error', error };
      throw error;
    }
    const requestTimeout = timeoutMs(options.timeoutMs ?? this.defaultTimeoutMs);
    const timeoutController = new AbortController();
    const timer = setTimeout(() => timeoutController.abort(), requestTimeout);
    const signal = options.signal
      ? AbortSignal.any([options.signal, timeoutController.signal])
      : timeoutController.signal;

    const failure = (error: unknown): GeorgeError => {
      if (options.signal?.aborted) {
        return cancellationError(options.signal) ?? new GeorgeError('cancelled', 'Operation cancelled.');
      }
      if (timeoutController.signal.aborted) {
        return providerError(`LM Studio request timed out after ${requestTimeout} ms.`, {
          kind: 'timeout',
        });
      }
      return error instanceof GeorgeError ? error : providerError('LM Studio request failed.', error);
    };

    try {
      let response: Response;
      try {
        response = await fetch(new URL('/v1/responses', this.baseUrl), {
          method: 'POST',
          headers: { 'content-type': 'application/json', accept: 'text/event-stream' },
          body: JSON.stringify({
            model: this.model,
            ...(request.instructions === undefined ? {} : { instructions: request.instructions }),
            input: request.input,
            stream: true,
          }),
          signal,
        });
      } catch (error) {
        const normalized = failure(error);
        yield { type: 'provider.error', error: normalized };
        throw normalized;
      }
      if (!response.ok) {
        const error = providerError(`LM Studio returned HTTP ${response.status}.`, {
          kind: 'http',
          status: response.status,
        });
        yield { type: 'provider.error', error };
        throw error;
      }
      if (!response.body) {
        const error = providerError('LM Studio returned an empty response body.');
        yield { type: 'provider.error', error };
        throw error;
      }

      let completed = false;
      const callIds = new Set<string>();
      try {
        for await (const message of parseSse(response.body)) {
          const event = normalizeMessage(message);
          if (!event) continue;
          if (event.type === 'provider.response.completed') completed = true;
          if (event.type === 'provider.tool.call') {
            if (callIds.has(event.callId)) continue;
            callIds.add(event.callId);
          }
          yield event;
        }
      } catch (error) {
        const normalized = failure(error);
        yield { type: 'provider.error', error: normalized };
        throw normalized;
      }
      if (!completed) {
        const error = providerError('LM Studio stream ended without a completion event.');
        yield { type: 'provider.error', error };
        throw error;
      }
    } finally {
      clearTimeout(timer);
    }
  }
}
