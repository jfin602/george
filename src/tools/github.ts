import { cancellationError, EnvironmentCredentialResolver, GeorgeError, type CredentialResolver, type JsonObject, type JsonValue } from '../core/index.ts';
import type { ToolDefinition, ToolExecutionOptions } from './registry.ts';

export const GITHUB_DEFAULT_API_ROOT = 'https://api.github.com/';
export const GITHUB_CREDENTIAL_REFERENCE = 'GITHUB_TOKEN';
/** Keep GitHub REST versioning in one place; this is the current public REST version. */
export const GITHUB_REST_API_VERSION = '2026-03-10';

const MAX_OWNER_REPO_BYTES = 100;
const MAX_PATH_BYTES = 1_024;
const MAX_REF_BYTES = 256;
const MAX_BODY_BYTES = 16 * 1024;
const MAX_PAGE = 1_000;
const MAX_PER_PAGE = 20;
const MAX_RESPONSE_BYTES = 256 * 1024;
const MAX_OUTPUT_BYTES = 64 * 1024;
const MAX_FILE_BYTES = 64 * 1024;
const MAX_TEXT_BYTES = 16 * 1024;
const MAX_TITLE_BYTES = 1_024;
const MAX_URL_BYTES = 2_048;
const DEFAULT_TIMEOUT_MS = 10_000;

export type GitHubOptions = Readonly<{
  enabled?: boolean;
  apiRoot?: string;
  credentialResolver?: CredentialResolver;
  credentialReference?: string;
  timeoutMs?: number;
}>;

type Repository = Readonly<{ owner: string; repo: string }>;
type Page = Readonly<{ page: number; perPage: number }>;

function bytes(value: string): number { return Buffer.byteLength(value, 'utf8'); }

function clipped(value: string, maximum: number): string {
  if (bytes(value) <= maximum) return value;
  return Buffer.from(value, 'utf8').subarray(0, Math.max(0, maximum - 3)).toString('utf8').trimEnd() + '...';
}

function apiRoot(value: string): URL {
  let root: URL;
  try { root = new URL(value); } catch { throw new GeorgeError('configuration', 'GitHub API root is invalid.'); }
  if (!['http:', 'https:'].includes(root.protocol) || root.username || root.password || root.search || root.hash) {
    throw new GeorgeError('configuration', 'GitHub API root is invalid.');
  }
  root.pathname = root.pathname.endsWith('/') ? root.pathname : `${root.pathname}/`;
  return root;
}

function endpoint(root: URL, path: string): URL { return new URL(path, root); }

function repository(value: JsonObject): Repository {
  const owner = value.owner;
  const repo = value.repo;
  const valid = (item: unknown) => typeof item === 'string' && /^[A-Za-z0-9][A-Za-z0-9_.-]*$/.test(item) && bytes(item) <= MAX_OWNER_REPO_BYTES;
  if (!valid(owner) || !valid(repo)) throw new GeorgeError('validation', 'GitHub owner and repository are invalid.');
  return { owner: owner as string, repo: repo as string };
}

function positive(value: unknown, name: string): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 1 || value > 1_000_000_000) throw new GeorgeError('validation', `GitHub ${name} is invalid.`);
  return value;
}

function path(value: unknown): string {
  if (typeof value !== 'string' || !value || value.includes('\0') || bytes(value) > MAX_PATH_BYTES || value.startsWith('/') || value.includes('\\') || value.split('/').some((part) => !part || part === '.' || part === '..')) {
    throw new GeorgeError('validation', 'GitHub file path is invalid.');
  }
  return value;
}

function ref(value: unknown): string | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== 'string' || !value || value.includes('\0') || bytes(value) > MAX_REF_BYTES) throw new GeorgeError('validation', 'GitHub ref is invalid.');
  return value;
}

function body(value: unknown): string {
  if (typeof value !== 'string' || !value.trim() || value.includes('\0') || bytes(value) > MAX_BODY_BYTES) throw new GeorgeError('validation', 'GitHub comment body is invalid.');
  return value;
}

function page(value: JsonObject): Page {
  const current = value.page === undefined ? 1 : positive(value.page, 'page');
  const perPage = value.perPage === undefined ? MAX_PER_PAGE : positive(value.perPage, 'per-page');
  if (current > MAX_PAGE || perPage > MAX_PER_PAGE) throw new GeorgeError('validation', 'GitHub pagination is invalid.');
  return { page: current, perPage };
}

async function text(response: Response, signal?: AbortSignal): Promise<string> {
  if (!response.body) throw new GeorgeError('tool', 'GitHub returned an empty response.');
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    while (true) {
      if (signal?.aborted) throw cancellationError(signal);
      const item = await reader.read();
      if (item.done) break;
      length += item.value.byteLength;
      if (length > MAX_RESPONSE_BYTES) {
        await reader.cancel().catch(() => undefined);
        throw new GeorgeError('tool', 'GitHub response exceeded the size limit.');
      }
      chunks.push(item.value);
    }
  } finally { reader.releaseLock(); }
  return Buffer.concat(chunks).toString('utf8');
}

function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new GeorgeError('tool', 'GitHub returned an invalid response.');
  return value as Record<string, unknown>;
}

function string(value: unknown, maximum: number): string {
  if (typeof value !== 'string') throw new GeorgeError('tool', 'GitHub returned an invalid response.');
  return clipped(value, maximum);
}

function url(value: unknown): string {
  const result = string(value, MAX_URL_BYTES);
  try {
    const parsed = new URL(result);
    if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error();
  } catch { throw new GeorgeError('tool', 'GitHub returned an invalid response.'); }
  return result;
}

function issue(value: unknown): JsonObject {
  const item = object(value);
  return {
    number: positive(item.number, 'issue number'), title: string(item.title, MAX_TITLE_BYTES), body: string(item.body ?? '', MAX_TEXT_BYTES),
    state: string(item.state, 64), url: url(item.html_url),
    ...(typeof item.user === 'object' && item.user !== null && !Array.isArray(item.user) && typeof (item.user as Record<string, unknown>).login === 'string'
      ? { author: clipped((item.user as Record<string, unknown>).login as string, 256) } : {}),
  };
}

function pullRequest(value: unknown): JsonObject {
  const item = object(value);
  return {
    number: positive(item.number, 'pull request number'), title: string(item.title, MAX_TITLE_BYTES), body: string(item.body ?? '', MAX_TEXT_BYTES),
    state: string(item.state, 64), url: url(item.html_url),
    ...(typeof item.user === 'object' && item.user !== null && !Array.isArray(item.user) && typeof (item.user as Record<string, unknown>).login === 'string'
      ? { author: clipped((item.user as Record<string, unknown>).login as string, 256) } : {}),
  };
}

function pullRequests(value: readonly unknown[], maximum: number): JsonObject {
  const results: JsonObject[] = [];
  let truncated = value.length > maximum;
  for (const item of value.slice(0, maximum)) {
    const candidate = pullRequest(item);
    if (bytes(JSON.stringify({ pullRequests: [...results, candidate], truncated: true })) > MAX_OUTPUT_BYTES) { truncated = true; break; }
    results.push(candidate);
  }
  return { pullRequests: results, truncated };
}

function file(value: unknown): JsonObject {
  const item = object(value);
  if (item.type !== 'file' || item.encoding !== 'base64' || typeof item.content !== 'string') throw new GeorgeError('tool', 'GitHub returned an invalid file response.');
  const encoded = item.content.replace(/\s/g, '');
  if (!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(encoded)) throw new GeorgeError('tool', 'GitHub returned invalid file content.');
  const decoded = Buffer.from(encoded, 'base64');
  return { path: string(item.path, MAX_PATH_BYTES), sha: string(item.sha, 128), content: decoded.subarray(0, MAX_FILE_BYTES).toString('utf8'), truncated: decoded.length > MAX_FILE_BYTES };
}

/** Bounded GitHub REST transport. It never follows redirects, retries, or exposes credential values. */
function transport(options: GitHubOptions) {
  const enabled = options.enabled ?? true;
  const root = apiRoot(options.apiRoot ?? GITHUB_DEFAULT_API_ROOT);
  const resolver = options.credentialResolver ?? new EnvironmentCredentialResolver();
  const credentialReference = options.credentialReference ?? GITHUB_CREDENTIAL_REFERENCE;
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  if (!Number.isInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 60_000) throw new GeorgeError('configuration', 'GitHub timeout is invalid.');

  return async (path_: string, method: 'GET' | 'POST', payload: JsonObject | undefined, execution: ToolExecutionOptions, requireCredential = false): Promise<unknown> => {
    if (!enabled) throw new GeorgeError('configuration', 'GitHub adapter is disabled.');
    if (execution.signal?.aborted) throw cancellationError(execution.signal);
    let credential: string | undefined;
    try { credential = await resolver.resolve(credentialReference); } catch { throw new GeorgeError('configuration', 'GitHub credential could not be resolved.'); }
    if (credential !== undefined && (!credential || credential.includes('\0') || bytes(credential) > 8_192)) throw new GeorgeError('configuration', 'GitHub credential is invalid.');
    if (requireCredential && !credential) throw new GeorgeError('configuration', 'GitHub credential is not configured.');
    const controller = new AbortController();
    const cancel = () => controller.abort(cancellationError(execution.signal!));
    execution.signal?.addEventListener('abort', cancel, { once: true });
    const timeout = setTimeout(() => controller.abort(new GeorgeError('tool', 'GitHub request timed out.')), timeoutMs);
    try {
      let response: Response;
      try {
        response = await fetch(endpoint(root, path_), {
          method, redirect: 'error', signal: controller.signal,
          headers: { accept: 'application/vnd.github+json', 'x-github-api-version': GITHUB_REST_API_VERSION, ...(credential === undefined ? {} : { authorization: `Bearer ${credential}` }), ...(payload === undefined ? {} : { 'content-type': 'application/json' }) },
          ...(payload === undefined ? {} : { body: JSON.stringify(payload) }),
        });
      } catch {
        if (execution.signal?.aborted) throw cancellationError(execution.signal);
        if (controller.signal.reason instanceof GeorgeError) {
          if (method === 'POST' && controller.signal.reason.code === 'tool') throw new GeorgeError('outcome_unknown', 'GitHub comment outcome is unknown; it was not retried.');
          throw controller.signal.reason;
        }
        if (method === 'POST') throw new GeorgeError('outcome_unknown', 'GitHub comment outcome is unknown; it was not retried.');
        throw new GeorgeError('tool', 'GitHub request failed.');
      }
      if (!response.ok) throw new GeorgeError('tool', `GitHub request failed (HTTP ${response.status}).`);
      if (!/^application\/json(?:;|$)/i.test(response.headers.get('content-type') ?? '')) throw new GeorgeError('tool', 'GitHub returned a non-JSON response.');
      try { return JSON.parse(await text(response, execution.signal)); }
      catch (error) {
        if (error instanceof GeorgeError) throw error;
        if (execution.signal?.aborted) throw cancellationError(execution.signal);
        if (method === 'POST') throw new GeorgeError('outcome_unknown', 'GitHub comment outcome is unknown; it was not retried.');
        throw new GeorgeError('tool', 'GitHub returned malformed JSON.');
      }
    } finally {
      clearTimeout(timeout);
      execution.signal?.removeEventListener('abort', cancel);
    }
  };
}

function definition(name: string, description: string, inputSchema: ToolDefinition['inputSchema'], effect: ToolDefinition['execution']['effect'], operation: string, execute: ToolDefinition['execute']): ToolDefinition {
  return { name, description, inputSchema, execution: { effect, replaySafety: effect === 'remote_mutation' ? 'not_replay_safe' : 'replay_safe', source: { kind: 'adapter', id: 'github' }, descriptor: { service: 'GitHub', operation } }, execute };
}

const REPOSITORY_PROPERTIES = {
  owner: { type: 'string', minLength: 1, maxLength: MAX_OWNER_REPO_BYTES }, repo: { type: 'string', minLength: 1, maxLength: MAX_OWNER_REPO_BYTES },
} as const;

/** Creates George's narrow GitHub coding-workflow tools; local Git remains separate. */
export function createGitHubTools(options: GitHubOptions = {}): readonly ToolDefinition[] {
  const request = transport(options);
  const prefix = (repo: Repository) => `repos/${encodeURIComponent(repo.owner)}/${encodeURIComponent(repo.repo)}`;
  return [
    definition('github_read_file', 'Read bounded text content from a GitHub repository file.', { type: 'object', properties: { ...REPOSITORY_PROPERTIES, path: { type: 'string', minLength: 1, maxLength: MAX_PATH_BYTES }, ref: { type: 'string', minLength: 1, maxLength: MAX_REF_BYTES } }, required: ['owner', 'repo', 'path'], additionalProperties: false }, 'external_read', 'read repository file', async (arguments_, execution) => {
      const repo = repository(arguments_); const filePath = path(arguments_.path); const reference = ref(arguments_.ref);
      const query = reference === undefined ? '' : `?ref=${encodeURIComponent(reference)}`;
      return file(await request(`${prefix(repo)}/contents/${filePath.split('/').map(encodeURIComponent).join('/')}${query}`, 'GET', undefined, execution));
    }),
    definition('github_read_issue', 'Read one GitHub issue.', { type: 'object', properties: { ...REPOSITORY_PROPERTIES, issueNumber: { type: 'integer', minimum: 1, maximum: 1_000_000_000 } }, required: ['owner', 'repo', 'issueNumber'], additionalProperties: false }, 'external_read', 'read issue', async (arguments_, execution) => {
      const repo = repository(arguments_); return issue(await request(`${prefix(repo)}/issues/${positive(arguments_.issueNumber, 'issue number')}`, 'GET', undefined, execution));
    }),
    definition('github_list_pull_requests', 'List one bounded page of GitHub pull requests.', { type: 'object', properties: { ...REPOSITORY_PROPERTIES, page: { type: 'integer', minimum: 1, maximum: MAX_PAGE }, perPage: { type: 'integer', minimum: 1, maximum: MAX_PER_PAGE } }, required: ['owner', 'repo'], additionalProperties: false }, 'external_read', 'list pull requests', async (arguments_, execution) => {
      const repo = repository(arguments_); const pagination = page(arguments_);
      const value = await request(`${prefix(repo)}/pulls?page=${pagination.page}&per_page=${pagination.perPage}`, 'GET', undefined, execution);
      if (!Array.isArray(value)) throw new GeorgeError('tool', 'GitHub returned an invalid pull-request response.');
      return pullRequests(value, pagination.perPage);
    }),
    definition('github_read_pull_request', 'Read one GitHub pull request.', { type: 'object', properties: { ...REPOSITORY_PROPERTIES, pullNumber: { type: 'integer', minimum: 1, maximum: 1_000_000_000 } }, required: ['owner', 'repo', 'pullNumber'], additionalProperties: false }, 'external_read', 'read pull request', async (arguments_, execution) => {
      const repo = repository(arguments_); return pullRequest(await request(`${prefix(repo)}/pulls/${positive(arguments_.pullNumber, 'pull request number')}`, 'GET', undefined, execution));
    }),
    definition('github_create_issue_comment', 'Create one GitHub issue comment after explicit approval.', { type: 'object', properties: { ...REPOSITORY_PROPERTIES, issueNumber: { type: 'integer', minimum: 1, maximum: 1_000_000_000 }, body: { type: 'string', minLength: 1, maxLength: MAX_BODY_BYTES } }, required: ['owner', 'repo', 'issueNumber', 'body'], additionalProperties: false }, 'remote_mutation', 'create issue comment', async (arguments_, execution) => {
      const repo = repository(arguments_); const issueNumber = positive(arguments_.issueNumber, 'issue number'); const comment = body(arguments_.body);
      const result = object(await request(`${prefix(repo)}/issues/${issueNumber}/comments`, 'POST', { body: comment }, execution, true));
      return { id: positive(result.id, 'comment ID'), url: url(result.html_url), body: string(result.body, MAX_TEXT_BYTES) };
    }),
  ];
}
