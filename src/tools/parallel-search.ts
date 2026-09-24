import { cancellationError, EnvironmentCredentialResolver, GeorgeError, type CredentialResolver, type JsonObject, type JsonValue } from '../core/index.ts';
import type { ToolDefinition, ToolExecutionOptions } from './registry.ts';

export const PARALLEL_SEARCH_DEFAULT_BASE_URL = 'https://api.parallel.ai';
export const PARALLEL_SEARCH_DEFAULT_PATH = '/v1/search';
export const PARALLEL_SEARCH_CREDENTIAL_REFERENCE = 'PARALLEL_API_KEY';

const MAX_OBJECTIVE_BYTES = 2_000;
const MAX_QUERIES = 4;
const MAX_QUERY_BYTES = 300;
const MAX_RESULTS = 10;
const MAX_RESPONSE_BYTES = 256 * 1024;
const MAX_TITLE_BYTES = 512;
const MAX_URL_BYTES = 2_048;
const MAX_EXCERPT_BYTES = 2_000;
const MAX_EXCERPTS = 3;
const MAX_OUTPUT_BYTES = 32 * 1024;
const DEFAULT_TIMEOUT_MS = 10_000;

export type ParallelSearchOptions = Readonly<{
  enabled?: boolean;
  baseUrl?: string;
  path?: string;
  credentialResolver?: CredentialResolver;
  credentialReference?: string;
  timeoutMs?: number;
}>;

type ParallelSearchArguments = Readonly<{ objective: string; queries?: readonly string[]; maxResults?: number }>;
type ParallelResult = Readonly<{ title: string; url: string; excerpts: readonly string[] }>;

function byteLength(value: string): number { return Buffer.byteLength(value, 'utf8'); }

function clipped(value: string, maximum: number): string {
  if (byteLength(value) <= maximum) return value;
  return Buffer.from(value, 'utf8').subarray(0, Math.max(0, maximum - 3)).toString('utf8').trimEnd() + '...';
}

function endpoint(baseUrl: string, path: string): URL {
  let base: URL;
  try { base = new URL(baseUrl); } catch { throw new GeorgeError('configuration', 'Parallel Search base URL is invalid.'); }
  if (!['http:', 'https:'].includes(base.protocol) || base.username || base.password || !path.startsWith('/') || path.startsWith('//')) {
    throw new GeorgeError('configuration', 'Parallel Search endpoint is invalid.');
  }
  return new URL(path, base);
}

async function responseText(response: Response, signal?: AbortSignal): Promise<string> {
  if (!response.body) throw new GeorgeError('tool', 'Parallel Search returned an empty response.');
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let bytes = 0;
  try {
    while (true) {
      if (signal?.aborted) throw cancellationError(signal);
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > MAX_RESPONSE_BYTES) {
        await reader.cancel().catch(() => undefined);
        throw new GeorgeError('tool', 'Parallel Search response exceeded the size limit.');
      }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  return Buffer.concat(chunks).toString('utf8');
}

function normalizedResult(value: unknown): ParallelResult {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new GeorgeError('tool', 'Parallel Search returned an invalid response.');
  const result = value as Record<string, unknown>;
  if (typeof result.url !== 'string' || !result.url || byteLength(result.url) > MAX_URL_BYTES) throw new GeorgeError('tool', 'Parallel Search returned an invalid response.');
  let url: URL;
  try { url = new URL(result.url); } catch { throw new GeorgeError('tool', 'Parallel Search returned an invalid response.'); }
  if (!['http:', 'https:'].includes(url.protocol)) throw new GeorgeError('tool', 'Parallel Search returned an invalid response.');
  if (result.title !== undefined && typeof result.title !== 'string') throw new GeorgeError('tool', 'Parallel Search returned an invalid response.');
  if (!Array.isArray(result.excerpts) || result.excerpts.some((excerpt) => typeof excerpt !== 'string')) throw new GeorgeError('tool', 'Parallel Search returned an invalid response.');
  return {
    url: clipped(result.url, MAX_URL_BYTES),
    title: clipped(result.title ?? '', MAX_TITLE_BYTES),
    excerpts: result.excerpts.slice(0, MAX_EXCERPTS).map((excerpt) => clipped(excerpt, MAX_EXCERPT_BYTES)),
  };
}

function normalizeResponse(value: unknown, maximum: number): JsonValue {
  if (!value || typeof value !== 'object' || Array.isArray(value) || !Array.isArray((value as Record<string, unknown>).results)) {
    throw new GeorgeError('tool', 'Parallel Search returned an invalid response.');
  }
  const sources: ParallelResult[] = [];
  let truncated = false;
  for (const result of (value as Record<string, unknown>).results as unknown[]) {
    if (sources.length === maximum) { truncated = true; break; }
    const source = normalizedResult(result);
    const candidate = { sources: [...sources, source], truncated: true };
    if (byteLength(JSON.stringify(candidate)) > MAX_OUTPUT_BYTES) { truncated = true; break; }
    sources.push(source);
  }
  return { sources, truncated };
}

function validArguments(value: JsonObject): ParallelSearchArguments {
  const objective = value.objective;
  const queries = value.queries;
  const maxResults = value.maxResults;
  if (typeof objective !== 'string' || !objective.trim() || byteLength(objective) > MAX_OBJECTIVE_BYTES
    || (queries !== undefined && (!Array.isArray(queries) || queries.some((query) => typeof query !== 'string' || !query.trim() || byteLength(query) > MAX_QUERY_BYTES)))
    || (maxResults !== undefined && (typeof maxResults !== 'number' || !Number.isInteger(maxResults) || maxResults < 1 || maxResults > MAX_RESULTS))) {
    throw new GeorgeError('validation', 'Parallel Search arguments are invalid.');
  }
  return { objective, ...(queries === undefined ? {} : { queries: queries as readonly string[] }), ...(maxResults === undefined ? {} : { maxResults: maxResults as number }) };
}

/** Built-in bounded Parallel Search adapter; remote results remain ordinary untrusted tool data. */
export function createParallelSearchTool(options: ParallelSearchOptions = {}): ToolDefinition {
  const enabled = options.enabled ?? true;
  const url = endpoint(options.baseUrl ?? PARALLEL_SEARCH_DEFAULT_BASE_URL, options.path ?? PARALLEL_SEARCH_DEFAULT_PATH);
  const resolver = options.credentialResolver ?? new EnvironmentCredentialResolver();
  const credentialReference = options.credentialReference ?? PARALLEL_SEARCH_CREDENTIAL_REFERENCE;
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  if (!Number.isInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 60_000) throw new GeorgeError('configuration', 'Parallel Search timeout is invalid.');

  return {
    name: 'parallel_search',
    description: 'Search the public web through Parallel and return bounded source excerpts.',
    inputSchema: {
      type: 'object', properties: {
        objective: { type: 'string', minLength: 1, maxLength: MAX_OBJECTIVE_BYTES },
        queries: { type: 'array', items: { type: 'string', minLength: 1, maxLength: MAX_QUERY_BYTES }, minItems: 1, maxItems: MAX_QUERIES },
        maxResults: { type: 'integer', minimum: 1, maximum: MAX_RESULTS },
      }, required: ['objective'], additionalProperties: false,
    },
    execution: { effect: 'external_read', replaySafety: 'replay_safe', source: { kind: 'adapter', id: 'parallel' }, descriptor: { service: 'Parallel Search', origin: url.origin, resource: url.pathname, operation: 'web search' } },
    async execute(arguments_: JsonObject, execution: ToolExecutionOptions): Promise<JsonValue> {
      if (!enabled) throw new GeorgeError('configuration', 'Parallel Search adapter is disabled.');
      const input = validArguments(arguments_);
      if (execution.signal?.aborted) throw cancellationError(execution.signal)!;
      let key: string | undefined;
      try { key = await resolver.resolve(credentialReference); } catch { throw new GeorgeError('configuration', 'Parallel Search credential could not be resolved.'); }
      if (!key) throw new GeorgeError('configuration', 'Parallel Search credential is not configured.');
      if (execution.signal?.aborted) throw cancellationError(execution.signal)!;
      const controller = new AbortController();
      const cancel = () => controller.abort(cancellationError(execution.signal!));
      execution.signal?.addEventListener('abort', cancel, { once: true });
      const timeout = setTimeout(() => controller.abort(new GeorgeError('tool', 'Parallel Search request timed out.')), timeoutMs);
      try {
        let response: Response;
        try {
          response = await fetch(url, {
            method: 'POST', redirect: 'error', signal: controller.signal,
            headers: { 'content-type': 'application/json', 'x-api-key': key },
            body: JSON.stringify({ objective: input.objective, search_queries: input.queries ?? [input.objective], max_chars_total: MAX_EXCERPT_BYTES * MAX_EXCERPTS * MAX_RESULTS, advanced_settings: { max_results: input.maxResults ?? MAX_RESULTS } }),
          });
        } catch (error) {
          if (execution.signal?.aborted) throw cancellationError(execution.signal)!;
          if (controller.signal.reason instanceof GeorgeError) throw controller.signal.reason;
          throw new GeorgeError('tool', 'Parallel Search request failed.');
        }
        if (!response.ok) throw new GeorgeError('tool', `Parallel Search request failed (HTTP ${response.status}).`);
        if (!/^application\/json(?:;|$)/i.test(response.headers.get('content-type') ?? '')) throw new GeorgeError('tool', 'Parallel Search returned a non-JSON response.');
        let parsed: unknown;
        try { parsed = JSON.parse(await responseText(response, execution.signal)); } catch (error) {
          if (error instanceof GeorgeError) throw error;
          if (execution.signal?.aborted) throw cancellationError(execution.signal)!;
          throw new GeorgeError('tool', 'Parallel Search returned malformed JSON.');
        }
        return normalizeResponse(parsed, input.maxResults ?? MAX_RESULTS);
      } finally {
        clearTimeout(timeout);
        execution.signal?.removeEventListener('abort', cancel);
      }
    },
  };
}
