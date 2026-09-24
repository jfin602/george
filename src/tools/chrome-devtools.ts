import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import { GeorgeError, resolveGeorgeUserConfigRoot, type JsonObject, type JsonValue, type ToolEffect } from '../core/index.ts';
import { McpAdapter, parseMcpServerConfig, type McpAdapterOptions, type McpCatalogIssue, type McpServerConfig } from './mcp.ts';
import type { ToolDefinition } from './registry.ts';

export const CHROME_DEVTOOLS_CONFIG_FILE = 'chrome-devtools.json';
export const DEFAULT_CHROME_DEVTOOLS_MAX_RESULT_BYTES = 16 * 1024;

export type ChromeDevtoolsProfile = 'dedicated' | 'authenticated';
export type ChromeDevtoolsConfig = Readonly<{ enabled?: boolean; profile?: ChromeDevtoolsProfile; server: McpServerConfig }>;
export type ChromeDevtoolsAdapterOptions = Readonly<{ configuration?: ChromeDevtoolsConfig | false; userConfigRoot?: string }>;
export type ChromeDevtoolsCatalog = Readonly<{ definitions: readonly ToolDefinition[]; issues: readonly McpCatalogIssue[] }>;

const OBSERVE = new Set(['list_pages', 'take_snapshot', 'take_screenshot', 'list_console_messages', 'get_console_message', 'get_runtime_errors', 'list_network_requests', 'get_network_request']);
const INTERACT = new Set(['select_page', 'navigate_page', 'click', 'fill', 'hover', 'press_key', 'evaluate_script', 'wait_for']);
const KNOWN = new Set([...OBSERVE, ...INTERACT]);
const SECRET_KEY = /(?:authorization|cookie|headers?|storage|credential|password|secret|token|api[-_]?key|session)/i;
const SECRET_TEXT = /(?:(['"])(?:authorization|cookie|set-cookie|localstorage|sessionstorage|credential|password|secret|token|api[-_]?key)\1|authorization|cookie|set-cookie|localstorage|sessionstorage|credential|password|secret|token|api[-_]?key)\s*[:=]\s*(?:"[^"]*"|'[^']*'|[^,;\n}]+)/gi;

function record(value: unknown, name: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new GeorgeError('configuration', `${name} must be an object.`);
  return value as Record<string, unknown>;
}

/** Reads only George's user-global Chrome profile; a repository cannot configure a browser server. */
export async function loadChromeDevtoolsConfiguration(userConfigRoot = resolveGeorgeUserConfigRoot()): Promise<ChromeDevtoolsConfig | undefined> {
  const source = await readFile(join(userConfigRoot, CHROME_DEVTOOLS_CONFIG_FILE), 'utf8').catch((error: NodeJS.ErrnoException) => error.code === 'ENOENT' ? undefined : Promise.reject(error));
  if (source === undefined) return undefined;
  if (Buffer.byteLength(source, 'utf8') > 64 * 1024) throw new GeorgeError('configuration', 'Chrome DevTools configuration exceeds its size limit.');
  let raw: unknown;
  try { raw = JSON.parse(source); } catch { throw new GeorgeError('configuration', 'Chrome DevTools configuration must be valid JSON.'); }
  const config = record(raw, 'Chrome DevTools configuration');
  if (Object.keys(config).some((key) => !['version', 'enabled', 'profile', 'server'].includes(key)) || config.version !== 1 || !('server' in config)) throw new GeorgeError('configuration', 'Chrome DevTools configuration is invalid.');
  if (config.enabled !== undefined && typeof config.enabled !== 'boolean') throw new GeorgeError('configuration', 'Chrome DevTools enabled is invalid.');
  if (config.profile !== undefined && config.profile !== 'dedicated' && config.profile !== 'authenticated') throw new GeorgeError('configuration', 'Chrome DevTools profile is invalid.');
  return { ...(config.enabled === undefined ? {} : { enabled: config.enabled }), ...(config.profile === undefined ? {} : { profile: config.profile }), server: parseMcpServerConfig(config.server) };
}

function clipped(value: string, maximum: number): string {
  return Buffer.byteLength(value, 'utf8') <= maximum ? value : `${Buffer.from(value, 'utf8').subarray(0, maximum - 3).toString('utf8')}...`;
}

/** Browser responses are untrusted data; omit credential-bearing fields before provider/session exposure. */
function boundedBrowserResult(value: unknown): JsonValue {
  const visit = (item: unknown, depth = 0): JsonValue => {
    if (depth > 6) return '[truncated]';
    if (item === null || typeof item === 'boolean') return item;
    if (typeof item === 'number') return Number.isFinite(item) ? item : '[invalid number]';
    if (typeof item === 'string') return clipped(item.replace(SECRET_TEXT, '[redacted]'), 4 * 1024);
    if (Array.isArray(item)) return item.slice(0, 16).map((child) => visit(child, depth + 1));
    if (!item || typeof item !== 'object') return '[unsupported result]';
    return Object.fromEntries(Object.entries(item as Record<string, unknown>)
      .filter(([key]) => !SECRET_KEY.test(key))
      .slice(0, 24)
      .map(([key, child]) => [clipped(key, 128), visit(child, depth + 1)])) as JsonObject;
  };
  const result = visit(value);
  return Buffer.byteLength(JSON.stringify(result), 'utf8') <= DEFAULT_CHROME_DEVTOOLS_MAX_RESULT_BYTES
    ? result
    : { truncated: true, content: '[browser result exceeded the size limit]' };
}

function profileEffect(name: string): ToolEffect | undefined {
  if (OBSERVE.has(name)) return 'browser_observation';
  if (INTERACT.has(name)) return 'browser_interaction';
  return undefined;
}

/** A narrow profile over the generic MCP boundary; it never starts Chrome or a CDP transport itself. */
export class ChromeDevtoolsAdapter {
  private readonly options: ChromeDevtoolsAdapterOptions;

  constructor(options: ChromeDevtoolsAdapterOptions = {}) { this.options = options; }

  async discover(): Promise<ChromeDevtoolsCatalog> {
    const configuration = this.options.configuration === undefined
      ? await loadChromeDevtoolsConfiguration(this.options.userConfigRoot)
      : this.options.configuration;
    if (!configuration) return { definitions: [], issues: [] };
    if (configuration.enabled === false) return { definitions: [], issues: [{ server: configuration.server.id, reason: 'disabled' }] };
    const allowed = new Set([...KNOWN, ...(configuration.server.allowTools ?? [])]);
    const server: McpServerConfig = { ...configuration.server, allowTools: [...allowed], effects: undefined };
    const catalog = await new McpAdapter({ servers: [server], maxResultBytes: DEFAULT_CHROME_DEVTOOLS_MAX_RESULT_BYTES } satisfies McpAdapterOptions).discover();
    const profile = configuration.profile ?? 'dedicated';
    const definitions = catalog.definitions.flatMap((tool) => {
      const name = tool.execution.descriptor?.resource;
      const effect = name ? profileEffect(name) : undefined;
      if (!name || (!effect && !allowed.has(name))) return [];
      return [{
        ...tool,
        name: `chrome:${name}`,
        execution: {
          effect: effect ?? 'unknown_external',
          replaySafety: effect === 'browser_observation' ? 'replay_safe' : 'not_replay_safe',
          source: { kind: 'adapter' as const, id: 'chrome-devtools', server: configuration.server.id },
          descriptor: {
            service: 'Chrome DevTools',
            ...(configuration.server.transport === 'http' ? { origin: new URL(configuration.server.url).origin } : {}),
            resource: name,
            operation: effect === 'browser_observation' ? 'browser observation' : effect === 'browser_interaction' ? 'browser interaction' : 'unclassified browser tool',
            ...(profile === 'authenticated' ? { warning: 'This server may access content in the logged-in browser session.' } : {}),
          },
        },
        execute: async (arguments_: JsonObject, options: Parameters<typeof tool.execute>[1]) => boundedBrowserResult(await tool.execute(arguments_, options)),
      } satisfies ToolDefinition];
    });
    return { definitions, issues: catalog.issues };
  }
}
