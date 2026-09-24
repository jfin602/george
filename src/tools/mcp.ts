import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { Client, StreamableHTTPClientTransport } from '@modelcontextprotocol/client';
import { StdioClientTransport } from '@modelcontextprotocol/client/stdio';

import { cancellationError, EnvironmentCredentialResolver, GeorgeError, resolveGeorgeUserConfigRoot, type CredentialResolver, type JsonObject, type JsonValue, type ToolEffect } from '../core/index.ts';
import type { ToolDefinition, ToolExecutionOptions, ToolInputSchema } from './registry.ts';

export const MCP_CONFIG_FILE = 'mcp.json';
export const DEFAULT_MCP_MAX_SERVERS = 8;
export const DEFAULT_MCP_MAX_TOOLS_PER_SERVER = 32;
export const DEFAULT_MCP_MAX_SCHEMA_BYTES = 16 * 1024;
export const DEFAULT_MCP_MAX_DESCRIPTION_BYTES = 4 * 1024;
export const DEFAULT_MCP_MAX_RESULT_BYTES = 64 * 1024;

type McpEffect = Exclude<ToolEffect, 'local_read' | 'workspace_mutation' | 'host_process'>;
type McpStdioServer = Readonly<{ transport: 'stdio'; command: string; args?: readonly string[]; cwd?: string; env?: Readonly<Record<string, string>> }>;
type McpHttpServer = Readonly<{ transport: 'http'; url: string; headers?: Readonly<Record<string, string>>; credentialReference?: string }>;
export type McpServerConfig = Readonly<{
  id: string;
  enabled?: boolean;
  allowTools?: readonly string[];
  effects?: Readonly<Record<string, McpEffect>>;
  timeoutMs?: number;
} & (McpStdioServer | McpHttpServer)>;
export type McpAdapterOptions = Readonly<{
  /** Programmatic configuration is George-owned; normal loading uses only `<userConfigRoot>/mcp.json`. */
  servers?: readonly McpServerConfig[];
  userConfigRoot?: string;
  credentialResolver?: CredentialResolver;
  maxServers?: number;
  maxToolsPerServer?: number;
  maxSchemaBytes?: number;
  maxDescriptionBytes?: number;
  maxResultBytes?: number;
}>;
export type McpCatalogIssue = Readonly<{ server: string; tool?: string; reason: string }>;
export type McpToolCatalog = Readonly<{ definitions: readonly ToolDefinition[]; issues: readonly McpCatalogIssue[] }>;

const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/;
const SAFE_HEADER = /^[A-Za-z0-9-]{1,64}$/;
const EFFECTS: readonly McpEffect[] = ['external_read', 'remote_mutation', 'browser_observation', 'browser_interaction', 'unknown_external'];

function bytes(value: string): number { return Buffer.byteLength(value, 'utf8'); }
function clipped(value: string, maximum: number): string { return bytes(value) <= maximum ? value : Buffer.from(value, 'utf8').subarray(0, Math.max(0, maximum - 3)).toString('utf8').trimEnd() + '...'; }
function boundedPositive(value: number | undefined, fallback: number, name: string, maximum: number): number {
  const result = value ?? fallback;
  if (!Number.isInteger(result) || result < 1 || result > maximum) throw new GeorgeError('configuration', `${name} is invalid.`);
  return result;
}
function boundedNonNegative(value: unknown, name: string, maximum: number): number {
  if (!Number.isInteger(value) || (value as number) < 0 || (value as number) > maximum) throw new GeorgeError('validation', `${name} is invalid.`);
  return value as number;
}
function text(value: unknown, name: string, maximum: number): string {
  if (typeof value !== 'string' || !value.trim() || value.includes('\0') || bytes(value) > maximum) throw new GeorgeError('configuration', `${name} is invalid.`);
  return value;
}
function identifier(value: unknown, name: string): string { const result = text(value, name, 64); if (!SAFE_ID.test(result)) throw new GeorgeError('configuration', `${name} is unsafe.`); return result; }
function object(value: unknown, name: string): Record<string, unknown> { if (!value || typeof value !== 'object' || Array.isArray(value)) throw new GeorgeError('configuration', `${name} must be an object.`); return value as Record<string, unknown>; }
function exact(value: Record<string, unknown>, keys: readonly string[], name: string): void { if (Object.keys(value).some((key) => !keys.includes(key))) throw new GeorgeError('configuration', `${name} contains an unknown field.`); }
function strings(value: unknown, name: string, maximum: number, itemMaximum: number): readonly string[] {
  if (!Array.isArray(value) || value.length > maximum) throw new GeorgeError('configuration', `${name} is invalid.`);
  return value.map((item) => text(item, name, itemMaximum));
}

/** Reads only the George user-global configuration root; repository content is never inspected. */
export async function loadMcpServerConfiguration(userConfigRoot = resolveGeorgeUserConfigRoot()): Promise<readonly McpServerConfig[]> {
  const source = await readFile(join(userConfigRoot, MCP_CONFIG_FILE), 'utf8').catch((error: NodeJS.ErrnoException) => error.code === 'ENOENT' ? undefined : Promise.reject(error));
  if (source === undefined) return [];
  if (bytes(source) > 64 * 1024) throw new GeorgeError('configuration', 'MCP configuration exceeds its size limit.');
  let raw: unknown;
  try { raw = JSON.parse(source); } catch { throw new GeorgeError('configuration', 'MCP configuration must be valid JSON.'); }
  const config = object(raw, 'MCP configuration'); exact(config, ['version', 'servers'], 'MCP configuration');
  if (config.version !== 1) throw new GeorgeError('configuration', 'Unsupported MCP configuration version.');
  if (!Array.isArray(config.servers) || config.servers.length > DEFAULT_MCP_MAX_SERVERS) throw new GeorgeError('configuration', 'MCP servers are invalid.');
  const parsed = config.servers.map((item) => parseServer(item));
  if (new Set(parsed.map((server) => server.id)).size !== parsed.length) throw new GeorgeError('configuration', 'MCP server IDs must be unique.');
  return parsed;
}

function parseServer(value: unknown): McpServerConfig {
  const server = object(value, 'MCP server');
  exact(server, ['id', 'enabled', 'transport', 'command', 'args', 'cwd', 'env', 'url', 'headers', 'credentialReference', 'allowTools', 'effects', 'timeoutMs'], 'MCP server');
  const id = identifier(server.id, 'MCP server ID');
  if (server.enabled !== undefined && typeof server.enabled !== 'boolean') throw new GeorgeError('configuration', 'MCP server enabled is invalid.');
  const allowTools = server.allowTools === undefined ? undefined : strings(server.allowTools, 'MCP allowTools', DEFAULT_MCP_MAX_TOOLS_PER_SERVER, 128).map((item) => identifier(item, 'MCP tool name'));
  const effects = server.effects === undefined ? undefined : Object.fromEntries(Object.entries(object(server.effects, 'MCP effects')).map(([name, effect]) => {
    identifier(name, 'MCP effect tool name'); if (typeof effect !== 'string' || !EFFECTS.includes(effect as McpEffect)) throw new GeorgeError('configuration', 'MCP effect is invalid.'); return [name, effect as McpEffect];
  }));
  const timeoutMs = server.timeoutMs === undefined ? undefined : boundedPositive(server.timeoutMs as number, 10_000, 'MCP timeout', 60_000);
  if (server.transport === 'stdio') {
    const command = text(server.command, 'MCP command', 1024);
    const args = server.args === undefined ? undefined : strings(server.args, 'MCP arguments', 64, 8192);
    const cwd = server.cwd === undefined ? undefined : text(server.cwd, 'MCP cwd', 4096);
    const env = server.env === undefined ? undefined : Object.fromEntries(Object.entries(object(server.env, 'MCP environment')).map(([key, item]) => [identifier(key, 'MCP environment name'), text(item, 'MCP environment value', 8192)]));
    return { id, ...(server.enabled === undefined ? {} : { enabled: server.enabled }), ...(allowTools === undefined ? {} : { allowTools }), ...(effects === undefined ? {} : { effects }), ...(timeoutMs === undefined ? {} : { timeoutMs }), transport: 'stdio', command, ...(args === undefined ? {} : { args }), ...(cwd === undefined ? {} : { cwd }), ...(env === undefined ? {} : { env }) };
  }
  if (server.transport === 'http') {
    const url = text(server.url, 'MCP URL', 2048); let endpoint: URL;
    try { endpoint = new URL(url); } catch { throw new GeorgeError('configuration', 'MCP URL is invalid.'); }
    if (!['http:', 'https:'].includes(endpoint.protocol) || endpoint.username || endpoint.password || endpoint.hash) throw new GeorgeError('configuration', 'MCP URL is invalid.');
    const headers = server.headers === undefined ? undefined : Object.fromEntries(Object.entries(object(server.headers, 'MCP headers')).map(([name, item]) => {
      if (!SAFE_HEADER.test(name) || /^(authorization|cookie|proxy-authorization|host|connection|content-length|mcp-session-id|mcp-protocol-version)$/i.test(name)) throw new GeorgeError('configuration', 'MCP header is unsafe.'); return [name, text(item, 'MCP header value', 1024)];
    }));
    const credentialReference = server.credentialReference === undefined ? undefined : identifier(server.credentialReference, 'MCP credential reference');
    return { id, ...(server.enabled === undefined ? {} : { enabled: server.enabled }), ...(allowTools === undefined ? {} : { allowTools }), ...(effects === undefined ? {} : { effects }), ...(timeoutMs === undefined ? {} : { timeoutMs }), transport: 'http', url: endpoint.toString(), ...(headers === undefined ? {} : { headers }), ...(credentialReference === undefined ? {} : { credentialReference }) };
  }
  throw new GeorgeError('configuration', 'MCP transport is unsupported.');
}

function schema(value: unknown, depth = 0): ToolInputSchema {
  if (depth > 8) throw new GeorgeError('validation', 'MCP schema is too deeply nested.');
  const item = object(value, 'MCP schema');
  const type = item.type;
  const allowed = (keys: readonly string[]) => {
    if (item.$schema !== undefined && (typeof item.$schema !== 'string' || bytes(item.$schema) > 1024)) throw new GeorgeError('validation', 'MCP schema declaration is invalid.');
    if (Object.keys(item).some((key) => key !== '$schema' && !keys.includes(key))) throw new GeorgeError('validation', 'MCP schema uses unsupported JSON Schema features.');
  };
  if (type === 'null' || type === 'boolean') { allowed(['type', 'title', 'description']); return { type }; }
  if (type === 'string') { allowed(['type', 'title', 'description', 'minLength', 'maxLength']); const minLength = item.minLength === undefined ? undefined : boundedNonNegative(item.minLength, 'MCP string minimum', 1_000_000); const maxLength = item.maxLength === undefined ? undefined : boundedNonNegative(item.maxLength, 'MCP string maximum', 1_000_000); if (minLength !== undefined && maxLength !== undefined && minLength > maxLength) throw new GeorgeError('validation', 'MCP string schema bounds are invalid.'); return { type, ...(minLength === undefined ? {} : { minLength }), ...(maxLength === undefined ? {} : { maxLength }) }; }
  if (type === 'number' || type === 'integer') { allowed(['type', 'title', 'description', 'minimum', 'maximum']); const minimum = item.minimum; const maximum = item.maximum; if ((minimum !== undefined && (typeof minimum !== 'number' || !Number.isFinite(minimum))) || (maximum !== undefined && (typeof maximum !== 'number' || !Number.isFinite(maximum))) || (typeof minimum === 'number' && typeof maximum === 'number' && minimum > maximum)) throw new GeorgeError('validation', 'MCP numeric schema bounds are invalid.'); return { type, ...(minimum === undefined ? {} : { minimum: minimum as number }), ...(maximum === undefined ? {} : { maximum: maximum as number }) }; }
  if (type === 'array') { allowed(['type', 'title', 'description', 'items', 'minItems', 'maxItems']); const minItems = item.minItems === undefined ? undefined : boundedNonNegative(item.minItems, 'MCP array minimum', 10_000); const maxItems = item.maxItems === undefined ? undefined : boundedNonNegative(item.maxItems, 'MCP array maximum', 10_000); if (minItems !== undefined && maxItems !== undefined && minItems > maxItems) throw new GeorgeError('validation', 'MCP array schema bounds are invalid.'); return { type, items: schema(item.items, depth + 1), ...(minItems === undefined ? {} : { minItems }), ...(maxItems === undefined ? {} : { maxItems }) }; }
  if (type === 'object') { allowed(['type', 'title', 'description', 'properties', 'required', 'additionalProperties']); if (item.additionalProperties !== false) throw new GeorgeError('validation', 'MCP object schemas must reject additional properties.'); const properties = object(item.properties, 'MCP object properties'); if (Object.keys(properties).length > 64) throw new GeorgeError('validation', 'MCP object schema has too many properties.'); const parsed = Object.fromEntries(Object.entries(properties).map(([name, child]) => [identifier(name, 'MCP property name'), schema(child, depth + 1)])); const required = item.required === undefined ? undefined : strings(item.required, 'MCP required properties', 64, 128).map((name) => identifier(name, 'MCP required property')); if (required && (new Set(required).size !== required.length || required.some((name) => !(name in parsed)))) throw new GeorgeError('validation', 'MCP required properties are invalid.'); return { type, properties: parsed, ...(required === undefined ? {} : { required }), additionalProperties: false }; }
  throw new GeorgeError('validation', 'MCP schema type is unsupported.');
}

function boundedResult(value: unknown, maximum: number): JsonValue {
  const seen = new WeakSet<object>();
  const visit = (item: unknown, depth = 0): JsonValue => {
    if (depth > 8) return '[truncated]';
    if (item === null || typeof item === 'boolean') return item;
    if (typeof item === 'number') return Number.isFinite(item) ? item : '[invalid number]';
    if (typeof item === 'string') return clipped(item, Math.min(maximum, 16 * 1024));
    if (Array.isArray(item)) return item.slice(0, 32).map((child) => visit(child, depth + 1));
    if (!item || typeof item !== 'object') return '[unsupported result]';
    if (seen.has(item)) return '[cycle]'; seen.add(item);
    return Object.fromEntries(Object.entries(item as Record<string, unknown>).slice(0, 64).map(([key, child]) => [clipped(key, 128), visit(child, depth + 1)])) as JsonObject;
  };
  const result = visit(value);
  return bytes(JSON.stringify(result)) <= maximum ? result : { truncated: true, content: clipped(JSON.stringify(result), maximum) };
}

type Session = Readonly<{ client: Client; close: () => Promise<void> }>;

async function closeWithin(client: Client, timeoutMs: number): Promise<void> {
  const closed = client.close().catch(() => undefined);
  let timer: NodeJS.Timeout | undefined;
  try { await Promise.race([closed, new Promise<void>((resolve) => { timer = setTimeout(resolve, Math.min(timeoutMs, 2_000)); })]); }
  finally { if (timer) clearTimeout(timer); }
}

/** The SDK owns wire framing; George only bounds the HTTP body before the SDK parses it. */
function boundedFetch(maximum: number): typeof fetch {
  return async (input, init) => {
    const response = await fetch(input, { ...init, redirect: 'error' });
    if (!response.body) return response;
    const reader = response.body.getReader(); const chunks: Uint8Array[] = []; let length = 0;
    try {
      while (true) {
        const part = await reader.read(); if (part.done) break;
        length += part.value.byteLength;
        if (length > maximum) { await reader.cancel().catch(() => undefined); throw new GeorgeError('tool', 'MCP HTTP response exceeded the size limit.'); }
        chunks.push(part.value);
      }
    } finally { reader.releaseLock(); }
    return new Response(Buffer.concat(chunks), { status: response.status, statusText: response.statusText, headers: response.headers });
  };
}

export class McpAdapter {
  private readonly options: Required<Pick<McpAdapterOptions, 'maxServers' | 'maxToolsPerServer' | 'maxSchemaBytes' | 'maxDescriptionBytes' | 'maxResultBytes'>> & McpAdapterOptions;
  private readonly resolver: CredentialResolver;

  constructor(options: McpAdapterOptions = {}) {
    this.options = { ...options, maxServers: boundedPositive(options.maxServers, DEFAULT_MCP_MAX_SERVERS, 'MCP server limit', DEFAULT_MCP_MAX_SERVERS), maxToolsPerServer: boundedPositive(options.maxToolsPerServer, DEFAULT_MCP_MAX_TOOLS_PER_SERVER, 'MCP tool limit', 128), maxSchemaBytes: boundedPositive(options.maxSchemaBytes, DEFAULT_MCP_MAX_SCHEMA_BYTES, 'MCP schema limit', 64 * 1024), maxDescriptionBytes: boundedPositive(options.maxDescriptionBytes, DEFAULT_MCP_MAX_DESCRIPTION_BYTES, 'MCP description limit', 16 * 1024), maxResultBytes: boundedPositive(options.maxResultBytes, DEFAULT_MCP_MAX_RESULT_BYTES, 'MCP result limit', 256 * 1024) };
    this.resolver = options.credentialResolver ?? new EnvironmentCredentialResolver();
  }

  private async servers(): Promise<readonly McpServerConfig[]> {
    const servers = this.options.servers ?? await loadMcpServerConfiguration(this.options.userConfigRoot);
    if (servers.length > this.options.maxServers) throw new GeorgeError('configuration', 'MCP server count exceeds its limit.');
    if (new Set(servers.map((server) => server.id)).size !== servers.length) throw new GeorgeError('configuration', 'MCP server IDs must be unique.');
    return servers.map(parseServer);
  }

  private async session(server: McpServerConfig, signal?: AbortSignal): Promise<Session> {
    if (signal?.aborted) throw cancellationError(signal);
    const timeoutMs = server.timeoutMs ?? 10_000;
    let credential: string | undefined;
    if (server.transport === 'http' && server.credentialReference) {
      try { credential = await this.resolver.resolve(server.credentialReference); } catch { throw new GeorgeError('configuration', 'MCP credential could not be resolved.'); }
      if (credential !== undefined && (!credential || credential.includes('\0') || bytes(credential) > 8192)) throw new GeorgeError('configuration', 'MCP credential is invalid.');
    }
    const transport = server.transport === 'stdio'
      ? new StdioClientTransport({ command: server.command, ...(server.args === undefined ? {} : { args: [...server.args] }), ...(server.cwd === undefined ? {} : { cwd: server.cwd }), ...(server.env === undefined ? {} : { env: { ...server.env } }), maxBufferSize: this.options.maxResultBytes })
      : new StreamableHTTPClientTransport(new URL(server.url), { requestInit: { headers: { ...(server.headers ?? {}) }, redirect: 'error' }, fetch: boundedFetch(this.options.maxResultBytes), ...(credential === undefined ? {} : { authProvider: { token: async () => credential } }) });
    const client = new Client({ name: 'george', version: '0.6.6' }, { versionNegotiation: { mode: 'auto', probe: { timeoutMs: Math.min(timeoutMs, 5_000), maxRetries: 0 } } });
    const controller = new AbortController(); const cancel = () => controller.abort(cancellationError(signal!)); signal?.addEventListener('abort', cancel, { once: true });
    const timer = setTimeout(() => controller.abort(new GeorgeError('tool', 'MCP connection timed out.')), timeoutMs);
    try { await client.connect(transport, { signal: controller.signal, timeout: timeoutMs }); }
    catch { await closeWithin(client, timeoutMs); if (signal?.aborted) throw cancellationError(signal); if (controller.signal.reason instanceof GeorgeError) throw controller.signal.reason; throw new GeorgeError('tool', 'MCP connection failed.'); }
    finally { clearTimeout(timer); signal?.removeEventListener('abort', cancel); }
    return { client, close: async () => closeWithin(client, timeoutMs) };
  }

  private async credentialConfigured(server: McpServerConfig): Promise<boolean> {
    if (server.transport !== 'http' || !server.credentialReference) return false;
    try { return Boolean(await this.resolver.resolve(server.credentialReference)); } catch { return false; }
  }

  async discover(): Promise<McpToolCatalog> {
    const definitions: ToolDefinition[] = []; const issues: McpCatalogIssue[] = [];
    for (const server of await this.servers()) {
      if (server.enabled === false) { issues.push({ server: server.id, reason: 'disabled' }); continue; }
      if (!server.allowTools) { issues.push({ server: server.id, reason: 'no explicit tool allowlist configured' }); continue; }
      let session: Session;
      try { session = await this.session(server); } catch (error) { issues.push({ server: server.id, reason: error instanceof Error ? clipped(error.message, 256) : 'unavailable' }); continue; }
      try {
        const listed: Array<{ name: string; description?: string; inputSchema: unknown; annotations?: unknown }> = [];
        let cursor = '';
        for (let page = 0; page <= this.options.maxToolsPerServer; page += 1) {
          const result = await session.client.listTools({ cursor }, { timeout: server.timeoutMs ?? 10_000 });
          listed.push(...result.tools);
          if (listed.length > this.options.maxToolsPerServer) break;
          if (!result.nextCursor) break;
          cursor = result.nextCursor;
        }
        if (listed.length > this.options.maxToolsPerServer) { issues.push({ server: server.id, reason: 'tool count exceeds limit' }); continue; }
        const names = new Set<string>();
        for (const tool of listed) {
          try {
            const name = identifier(tool.name, 'MCP tool name');
            if (names.has(name)) throw new GeorgeError('validation', 'duplicate tool name'); names.add(name);
            if (!server.allowTools.includes(name)) { issues.push({ server: server.id, tool: name, reason: 'not allowlisted' }); continue; }
            const description = typeof tool.description === 'string' ? tool.description : '';
            if (bytes(description) > this.options.maxDescriptionBytes) throw new GeorgeError('validation', 'description exceeds limit');
            const rawSchema = tool.inputSchema;
            const serialized = JSON.stringify(rawSchema);
            if (!serialized || bytes(serialized) > this.options.maxSchemaBytes) throw new GeorgeError('validation', 'schema exceeds limit');
            const inputSchema = schema(rawSchema);
            const georgeName = `mcp:${server.id}:${name}`;
            if (definitions.some((definition) => definition.name === georgeName)) throw new GeorgeError('validation', 'catalog collision');
            const effect = server.effects?.[name] ?? 'unknown_external';
            definitions.push({ name: georgeName, description: clipped(description || `MCP tool ${name}`, this.options.maxDescriptionBytes), inputSchema, execution: { effect, replaySafety: effect === 'external_read' || effect === 'browser_observation' ? 'replay_safe' : 'not_replay_safe', source: { kind: 'adapter', id: 'mcp', server: server.id }, descriptor: { service: 'MCP', ...(server.transport === 'http' ? { origin: new URL(server.url).origin } : {}), resource: name, operation: 'MCP tool call', ...(server.transport === 'http' && server.credentialReference ? { credentialConfigured: await this.credentialConfigured(server) } : {}) } }, execute: async (arguments_, options) => this.call(server, name, arguments_, options) });
          } catch (error) { issues.push({ server: server.id, tool: typeof tool.name === 'string' ? clipped(tool.name, 128) : undefined, reason: error instanceof Error ? clipped(error.message, 256) : 'invalid tool' }); }
        }
      } catch (error) { issues.push({ server: server.id, reason: error instanceof Error ? clipped(error.message, 256) : 'tool listing failed' }); }
      finally { await session.close(); }
    }
    return { definitions, issues };
  }

  private async call(server: McpServerConfig, name: string, arguments_: JsonObject, options: ToolExecutionOptions): Promise<JsonValue> {
    const session = await this.session(server, options.signal);
    const timeoutMs = server.timeoutMs ?? 10_000;
    try {
      const result = await session.client.callTool({ name, arguments: arguments_ }, { signal: options.signal, timeout: timeoutMs });
      return boundedResult({ isError: result.isError === true, content: result.content, ...(result.structuredContent === undefined ? {} : { structuredContent: result.structuredContent }) }, this.options.maxResultBytes);
    } catch (error) {
      if (options.signal?.aborted) throw cancellationError(options.signal);
      if (error instanceof GeorgeError) throw error;
      throw new GeorgeError('tool', 'MCP tool call failed.');
    } finally { await session.close(); }
  }
}
