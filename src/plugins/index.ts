import { createHash, randomUUID } from 'node:crypto';
import { copyFile, lstat, mkdir, open, opendir, readFile, rename, rm } from 'node:fs/promises';
import { isAbsolute, join, relative, resolve, sep } from 'node:path';

import { GeorgeError, resolveGeorgeUserConfigRoot } from '../core/index.ts';
import type { HookEventName } from '../core/index.ts';
import type { ToolInputSchema } from '../tools/index.ts';

export const PLUGIN_MANIFEST_FILE = 'george-plugin.json';
export const PLUGIN_MANIFEST_VERSION = 1;
export const DEFAULT_PLUGIN_MAX_MANIFEST_BYTES = 64 * 1024;
export const DEFAULT_PLUGIN_MAX_FILE_BYTES = 1024 * 1024;
export const DEFAULT_PLUGIN_MAX_TREE_BYTES = 8 * 1024 * 1024;
export const DEFAULT_PLUGIN_MAX_FILES = 256;
export const DEFAULT_PLUGIN_MAX_DEPTH = 16;

export type PluginSkill = Readonly<{ id: string; path: string }>;
export type PluginHook = Readonly<{ id: string; event: HookEventName; path: string; arguments: readonly string[]; priority?: number; timeoutMs?: number; configuration?: Readonly<Record<string, string | number | boolean | null>> }>;
export type PluginCommand = Readonly<{ id: string; skill: string }>;
export type PluginTool = Readonly<{ id: string; description: string; path: string; arguments: readonly string[]; inputSchema: ToolInputSchema }>;
export type PluginManifest = Readonly<{ manifestVersion: 1; id: string; version: string; skills: readonly PluginSkill[]; hooks: readonly PluginHook[]; commands: readonly PluginCommand[]; tools: readonly PluginTool[] }>;
export type PluginRecord = Readonly<{ id: string; version: string; enabled: boolean; capabilityFingerprint: string }>;
export type PluginManagerOptions = Readonly<{
  root?: string;
  userConfigRoot?: string;
  maxManifestBytes?: number;
  maxFileBytes?: number;
  maxTreeBytes?: number;
  maxFiles?: number;
  maxDepth?: number;
}>;

type Limits = Required<Omit<PluginManagerOptions, 'root' | 'userConfigRoot'>>;
type StoredState = Readonly<{ version: 1; plugins: Readonly<Record<string, PluginRecord>> }>;
type Tree = Readonly<{ root: string; files: ReadonlyMap<string, string>; entries: readonly Readonly<{ relativePath: string; source: string }>[] }>;

const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/;
const SAFE_PLUGIN_ID = /^[a-z0-9][a-z0-9._-]{0,127}$/;
const SEMVER = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;
const HOOK_EVENTS: readonly HookEventName[] = ['session.started', 'session.reopened', 'session.ended', 'turn.started', 'input.submitted', 'context.assembled', 'provider.requested', 'provider.responded', 'tool.before', 'tool.after', 'turn.completed'];

function invalid(message: string): never { throw new GeorgeError('validation', message); }
function object(value: unknown, name: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) invalid(`${name} must be an object.`);
  return value as Record<string, unknown>;
}
function exact(value: Record<string, unknown>, keys: readonly string[], name: string): void {
  if (Object.keys(value).some((key) => !keys.includes(key))) invalid(`${name} contains an unknown field.`);
}
function text(value: unknown, name: string, maximum = 1024): string {
  if (typeof value !== 'string' || !value.trim() || Buffer.byteLength(value, 'utf8') > maximum || /[\u0000-\u001f\u007f]/.test(value)) invalid(`${name} must be bounded text.`);
  return value;
}
function identifier(value: unknown, name: string, plugin = false): string {
  const result = text(value, name, 128);
  if (!(plugin ? SAFE_PLUGIN_ID : SAFE_ID).test(result)) invalid(`${name} is unsafe.`);
  return result;
}
function integer(value: unknown, name: string, minimum: number, maximum: number): number {
  if (!Number.isInteger(value) || (value as number) < minimum || (value as number) > maximum) invalid(`${name} is invalid.`);
  return value as number;
}
function array(value: unknown, name: string, maximum: number): readonly unknown[] {
  if (!Array.isArray(value) || value.length > maximum) invalid(`${name} must be a bounded array.`);
  return value;
}
function pathReference(value: unknown, name: string): string {
  const path = text(value, name, 512);
  if (isAbsolute(path) || path.split(/[\\/]/).some((part) => !SAFE_ID.test(part))) invalid(`${name} must be a safe package-relative path.`);
  return path.replace(/\\/g, '/');
}
function argumentsList(value: unknown, name: string): readonly string[] {
  if (value === undefined) return [];
  return array(value, name, 64).map((item) => text(item, name, 8192));
}
function configuration(value: unknown): Readonly<Record<string, string | number | boolean | null>> | undefined {
  if (value === undefined) return undefined;
  const result = object(value, 'hook configuration');
  if (Object.keys(result).length > 32) invalid('hook configuration is too large.');
  for (const [key, item] of Object.entries(result)) {
    identifier(key, 'hook configuration key');
    if (!(item === null || typeof item === 'string' || typeof item === 'number' || typeof item === 'boolean') || (typeof item === 'string' && Buffer.byteLength(item, 'utf8') > 1024) || (typeof item === 'number' && !Number.isFinite(item))) invalid('hook configuration is invalid.');
  }
  if (Buffer.byteLength(JSON.stringify(result), 'utf8') > 4096) invalid('hook configuration is too large.');
  return result as Readonly<Record<string, string | number | boolean | null>>;
}

/** The exact JSON-schema subset accepted by ToolRegistry, parsed without executing package code. */
function inputSchema(value: unknown, depth = 0): ToolInputSchema {
  if (depth > 8) invalid('tool input schema is too deeply nested.');
  const schema = object(value, 'tool input schema');
  const type = schema.type;
  if (type === 'null' || type === 'boolean') { exact(schema, ['type'], 'tool input schema'); return { type }; }
  if (type === 'string') {
    exact(schema, ['type', 'minLength', 'maxLength'], 'tool input schema');
    const minLength = schema.minLength === undefined ? undefined : integer(schema.minLength, 'string minimum length', 0, 1_000_000);
    const maxLength = schema.maxLength === undefined ? undefined : integer(schema.maxLength, 'string maximum length', 0, 1_000_000);
    if (minLength !== undefined && maxLength !== undefined && minLength > maxLength) invalid('string schema bounds are invalid.');
    return { type, ...(minLength === undefined ? {} : { minLength }), ...(maxLength === undefined ? {} : { maxLength }) };
  }
  if (type === 'number' || type === 'integer') {
    exact(schema, ['type', 'minimum', 'maximum'], 'tool input schema');
    const minimum = schema.minimum === undefined ? undefined : schema.minimum;
    const maximum = schema.maximum === undefined ? undefined : schema.maximum;
    if ((minimum !== undefined && (typeof minimum !== 'number' || !Number.isFinite(minimum))) || (maximum !== undefined && (typeof maximum !== 'number' || !Number.isFinite(maximum))) || (minimum !== undefined && maximum !== undefined && minimum > maximum)) invalid('numeric schema bounds are invalid.');
    return { type, ...(minimum === undefined ? {} : { minimum: minimum as number }), ...(maximum === undefined ? {} : { maximum: maximum as number }) };
  }
  if (type === 'array') {
    exact(schema, ['type', 'items', 'minItems', 'maxItems'], 'tool input schema');
    const minItems = schema.minItems === undefined ? undefined : integer(schema.minItems, 'array minimum items', 0, 10_000);
    const maxItems = schema.maxItems === undefined ? undefined : integer(schema.maxItems, 'array maximum items', 0, 10_000);
    if (minItems !== undefined && maxItems !== undefined && minItems > maxItems) invalid('array schema bounds are invalid.');
    return { type, items: inputSchema(schema.items, depth + 1), ...(minItems === undefined ? {} : { minItems }), ...(maxItems === undefined ? {} : { maxItems }) };
  }
  if (type === 'object') {
    exact(schema, ['type', 'properties', 'required', 'additionalProperties'], 'tool input schema');
    if (schema.additionalProperties !== false) invalid('object tool schemas must reject additional properties.');
    const properties = object(schema.properties, 'object schema properties');
    if (Object.keys(properties).length > 64) invalid('object schema has too many properties.');
    const parsed: Record<string, ToolInputSchema> = {};
    for (const [name, property] of Object.entries(properties)) { identifier(name, 'object schema property'); parsed[name] = inputSchema(property, depth + 1); }
    const required = schema.required === undefined ? undefined : array(schema.required, 'object schema required fields', 64).map((item) => identifier(item, 'object schema required field'));
    if (required && (new Set(required).size !== required.length || required.some((name) => !(name in parsed)))) invalid('object schema required fields are invalid.');
    return { type, properties: parsed, ...(required === undefined ? {} : { required }), additionalProperties: false };
  }
  invalid('tool input schema type is unsupported.');
}

function duplicate(items: readonly { id: string }[], name: string): void {
  if (new Set(items.map((item) => item.id)).size !== items.length) invalid(`${name} contains duplicate contribution IDs.`);
}

export function parsePluginManifest(source: string): PluginManifest {
  if (Buffer.byteLength(source, 'utf8') > DEFAULT_PLUGIN_MAX_MANIFEST_BYTES) invalid('plugin manifest exceeds its byte limit.');
  let raw: unknown;
  try { raw = JSON.parse(source); } catch { invalid('plugin manifest must be valid JSON.'); }
  const manifest = object(raw, 'plugin manifest');
  exact(manifest, ['manifestVersion', 'id', 'version', 'skills', 'hooks', 'commands', 'tools'], 'plugin manifest');
  if (manifest.manifestVersion !== PLUGIN_MANIFEST_VERSION) invalid('unsupported plugin manifest version.');
  const skills = array(manifest.skills ?? [], 'plugin skills', 64).map((value) => {
    const item = object(value, 'plugin skill'); exact(item, ['id', 'path'], 'plugin skill'); return { id: identifier(item.id, 'plugin skill ID'), path: pathReference(item.path, 'plugin skill path') };
  });
  const hooks = array(manifest.hooks ?? [], 'plugin hooks', 64).map((value) => {
    const item = object(value, 'plugin hook'); exact(item, ['id', 'event', 'path', 'arguments', 'priority', 'timeoutMs', 'configuration'], 'plugin hook');
    const event = text(item.event, 'plugin hook event', 128) as HookEventName;
    if (!HOOK_EVENTS.includes(event)) invalid('plugin hook event is unsupported.');
    const priority = item.priority === undefined ? undefined : integer(item.priority, 'plugin hook priority', -1_000, 1_000);
    const timeoutMs = item.timeoutMs === undefined ? undefined : integer(item.timeoutMs, 'plugin hook timeout', 1, 120_000);
    return { id: identifier(item.id, 'plugin hook ID'), event, path: pathReference(item.path, 'plugin hook path'), arguments: argumentsList(item.arguments, 'plugin hook arguments'), ...(priority === undefined ? {} : { priority }), ...(timeoutMs === undefined ? {} : { timeoutMs }), ...(configuration(item.configuration) === undefined ? {} : { configuration: configuration(item.configuration)! }) };
  });
  const commands = array(manifest.commands ?? [], 'plugin commands', 64).map((value) => {
    const item = object(value, 'plugin command'); exact(item, ['id', 'skill'], 'plugin command'); return { id: identifier(item.id, 'plugin command ID'), skill: identifier(item.skill, 'plugin command skill') };
  });
  const tools = array(manifest.tools ?? [], 'plugin tools', 64).map((value) => {
    const item = object(value, 'plugin tool'); exact(item, ['id', 'description', 'path', 'arguments', 'inputSchema'], 'plugin tool'); return { id: identifier(item.id, 'plugin tool ID'), description: text(item.description, 'plugin tool description', 4096), path: pathReference(item.path, 'plugin tool path'), arguments: argumentsList(item.arguments, 'plugin tool arguments'), inputSchema: inputSchema(item.inputSchema) };
  });
  duplicate(skills, 'plugin skills'); duplicate(hooks, 'plugin hooks'); duplicate(commands, 'plugin commands'); duplicate(tools, 'plugin tools');
  if (commands.some((command) => !skills.some((skill) => skill.id === command.skill))) invalid('plugin command references a missing skill.');
  const all = [...skills, ...hooks, ...commands, ...tools];
  duplicate(all, 'plugin manifest');
  const version = text(manifest.version, 'plugin version', 128);
  if (!SEMVER.test(version)) invalid('plugin version must use semantic versioning.');
  return { manifestVersion: 1, id: identifier(manifest.id, 'plugin ID', true), version, skills, hooks, commands, tools };
}

export function pluginCapabilityFingerprint(manifest: PluginManifest): string {
  const canonical = (value: unknown): unknown => {
    if (Array.isArray(value)) return value.map(canonical);
    if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value as Record<string, unknown>).sort(([left], [right]) => left.localeCompare(right)).map(([key, item]) => [key, canonical(item)]));
    return value;
  };
  const executable = {
    hooks: manifest.hooks.map(({ id, event, path, arguments: arguments_, priority, timeoutMs, configuration: configuration_ }) => ({ id, event, path, arguments: arguments_, ...(priority === undefined ? {} : { priority }), ...(timeoutMs === undefined ? {} : { timeoutMs }), ...(configuration_ === undefined ? {} : { configuration: configuration_ }) })).sort((a, b) => a.id.localeCompare(b.id)),
    tools: manifest.tools.map(({ id, path, arguments: arguments_, inputSchema: schema }) => ({ id, path, arguments: arguments_, inputSchema: schema })).sort((a, b) => a.id.localeCompare(b.id)),
  };
  return createHash('sha256').update(JSON.stringify(canonical(executable))).digest('hex');
}

function limits(options: PluginManagerOptions): Limits {
  const values = {
    maxManifestBytes: options.maxManifestBytes ?? DEFAULT_PLUGIN_MAX_MANIFEST_BYTES,
    maxFileBytes: options.maxFileBytes ?? DEFAULT_PLUGIN_MAX_FILE_BYTES,
    maxTreeBytes: options.maxTreeBytes ?? DEFAULT_PLUGIN_MAX_TREE_BYTES,
    maxFiles: options.maxFiles ?? DEFAULT_PLUGIN_MAX_FILES,
    maxDepth: options.maxDepth ?? DEFAULT_PLUGIN_MAX_DEPTH,
  };
  const maximums: Limits = {
    maxManifestBytes: DEFAULT_PLUGIN_MAX_MANIFEST_BYTES,
    maxFileBytes: DEFAULT_PLUGIN_MAX_FILE_BYTES,
    maxTreeBytes: DEFAULT_PLUGIN_MAX_TREE_BYTES,
    maxFiles: DEFAULT_PLUGIN_MAX_FILES,
    maxDepth: DEFAULT_PLUGIN_MAX_DEPTH,
  };
  for (const [name, value] of Object.entries(values)) if (!Number.isInteger(value) || value < 1 || value > maximums[name as keyof Limits]) throw new GeorgeError('configuration', `${name} must be a bounded positive integer.`);
  return values;
}
function contained(root: string, path: string): boolean { const value = relative(root, path); return value === '' || (!value.startsWith(`..${sep}`) && value !== '..' && !isAbsolute(value)); }
function managedPath(root: string, id: string): string { return join(root, 'packages', identifier(id, 'plugin ID', true)); }

export class PluginManager {
  readonly root: string;
  private readonly limits: Limits;

  constructor(options: PluginManagerOptions = {}) {
    if (options.root !== undefined && options.userConfigRoot !== undefined) throw new GeorgeError('configuration', 'Specify either plugin root or user config root.');
    this.root = resolve(options.root ?? join(options.userConfigRoot ?? resolveGeorgeUserConfigRoot(), 'plugins'));
    this.limits = limits(options);
  }

  private statePath(): string { return join(this.root, 'state.json'); }
  private async prepareRoot(): Promise<void> {
    await mkdir(this.root, { recursive: true, mode: 0o700 });
    const status = await lstat(this.root);
    if (!status.isDirectory() || status.isSymbolicLink()) invalid('plugin root must be a real directory.');
    const packages = join(this.root, 'packages');
    await mkdir(packages, { recursive: true, mode: 0o700 });
    const packageStatus = await lstat(packages);
    if (!packageStatus.isDirectory() || packageStatus.isSymbolicLink()) invalid('plugin package root must be a real directory.');
  }
  private async state(): Promise<StoredState> {
    await this.prepareRoot();
    const path = this.statePath();
    const status = await lstat(path).catch((error: NodeJS.ErrnoException) => error.code === 'ENOENT' ? undefined : Promise.reject(error));
    if (!status) return { version: 1, plugins: {} };
    if (!status.isFile() || status.isSymbolicLink() || status.size > this.limits.maxManifestBytes) invalid('plugin state must be a bounded regular file.');
    let raw: unknown;
    try { raw = JSON.parse(await readFile(path, 'utf8')); } catch { invalid('plugin state is malformed.'); }
    const state = object(raw, 'plugin state'); exact(state, ['version', 'plugins'], 'plugin state');
    if (state.version !== 1) invalid('unsupported plugin state version.');
    const plugins = object(state.plugins, 'plugin state plugins');
    const parsed: Record<string, PluginRecord> = {};
    for (const [id, value] of Object.entries(plugins)) {
      identifier(id, 'plugin ID', true); const entry = object(value, 'plugin state entry'); exact(entry, ['id', 'version', 'enabled', 'capabilityFingerprint'], 'plugin state entry');
      if (entry.id !== id || typeof entry.enabled !== 'boolean' || typeof entry.capabilityFingerprint !== 'string' || !/^[a-f0-9]{64}$/.test(entry.capabilityFingerprint)) invalid('plugin state entry is invalid.');
      const version = text(entry.version, 'plugin state version', 128); if (!SEMVER.test(version)) invalid('plugin state version is invalid.');
      parsed[id] = { id, version, enabled: entry.enabled, capabilityFingerprint: entry.capabilityFingerprint };
    }
    return { version: 1, plugins: parsed };
  }
  private async writeState(next: StoredState): Promise<void> {
    const content = JSON.stringify(next);
    if (Buffer.byteLength(content, 'utf8') > this.limits.maxManifestBytes) invalid('plugin state exceeds its byte limit.');
    const temporary = join(this.root, `.state.${randomUUID()}.tmp`);
    try {
      const handle = await open(temporary, 'wx', 0o600);
      try { await handle.writeFile(content, 'utf8'); await handle.sync(); }
      finally { await handle.close(); }
      await rename(temporary, this.statePath());
    }
    catch (error) { await rm(temporary, { force: true }).catch(() => undefined); throw error; }
  }
  private async inspect(source: string): Promise<{ manifest: PluginManifest; tree: Tree }> {
    const requested = resolve(source);
    const rootStatus = await lstat(requested).catch(() => invalid('plugin source directory does not exist.'));
    if (!rootStatus.isDirectory() || rootStatus.isSymbolicLink()) invalid('plugin source must be a real directory.');
    const files = new Map<string, string>(); const entries: { relativePath: string; source: string }[] = []; let bytes = 0;
    const walk = async (directory: string, prefix: string, depth: number): Promise<void> => {
      if (depth > this.limits.maxDepth) invalid('plugin package exceeds its directory depth limit.');
      const handle = await opendir(directory);
      try {
        for await (const entry of handle) {
          if (!SAFE_ID.test(entry.name)) invalid('plugin package contains an unsafe path name.');
          const path = join(directory, entry.name); const relativePath = prefix ? `${prefix}/${entry.name}` : entry.name; const status = await lstat(path);
          if (status.isSymbolicLink()) invalid('plugin package must not contain symbolic links.');
          if (status.isDirectory()) await walk(path, relativePath, depth + 1);
          else if (status.isFile()) {
            if (status.size > this.limits.maxFileBytes || bytes + status.size > this.limits.maxTreeBytes || entries.length >= this.limits.maxFiles) invalid('plugin package exceeds its safety limits.');
            bytes += status.size; files.set(relativePath, path); entries.push({ relativePath, source: path });
          } else invalid('plugin package must contain only regular files and directories.');
        }
      } finally { await handle.close().catch(() => undefined); }
    };
    await walk(requested, '', 0);
    const manifestPath = files.get(PLUGIN_MANIFEST_FILE);
    if (!manifestPath) invalid(`plugin package requires ${PLUGIN_MANIFEST_FILE}.`);
    const sourceManifest = await readFile(manifestPath, 'utf8');
    if (Buffer.byteLength(sourceManifest, 'utf8') > this.limits.maxManifestBytes) invalid('plugin manifest exceeds its byte limit.');
    const manifest = parsePluginManifest(sourceManifest);
    const references = [...manifest.skills.map((item) => item.path), ...manifest.hooks.map((item) => item.path), ...manifest.tools.map((item) => item.path)];
    for (const reference of references) if (!files.has(reference)) invalid(`plugin manifest references missing file ${reference}.`);
    return { manifest, tree: { root: requested, files, entries: entries.sort((a, b) => a.relativePath.localeCompare(b.relativePath)) } };
  }
  private async copyTree(tree: Tree, target: string): Promise<void> {
    await mkdir(target, { recursive: false, mode: 0o700 });
    for (const entry of tree.entries) {
      const destination = join(target, ...entry.relativePath.split('/'));
      if (!contained(target, destination)) invalid('plugin staging path escapes its root.');
      await mkdir(resolve(destination, '..'), { recursive: true, mode: 0o700 });
      await copyFile(entry.source, destination, 0);
    }
  }

  async install(sourceDirectory: string): Promise<PluginRecord> {
    if (typeof sourceDirectory !== 'string' || !sourceDirectory.trim() || sourceDirectory.includes('\0')) invalid('plugin source directory is required.');
    const inspected = await this.inspect(sourceDirectory);
    await this.prepareRoot();
    const staging = join(this.root, `.plugin.${randomUUID()}.stage`);
    let published = false; let backup: string | undefined;
    try {
      await this.copyTree(inspected.tree, staging);
      const staged = await this.inspect(staging);
      if (staged.manifest.id !== inspected.manifest.id || staged.manifest.version !== inspected.manifest.version || pluginCapabilityFingerprint(staged.manifest) !== pluginCapabilityFingerprint(inspected.manifest)) invalid('plugin package changed while being installed.');
      const previous = await this.state(); const fingerprint = pluginCapabilityFingerprint(staged.manifest); const prior = previous.plugins[staged.manifest.id];
      const destination = managedPath(this.root, staged.manifest.id);
      const destinationStatus = await lstat(destination).catch((error: NodeJS.ErrnoException) => error.code === 'ENOENT' ? undefined : Promise.reject(error));
      if (destinationStatus && (!destinationStatus.isDirectory() || destinationStatus.isSymbolicLink())) invalid('managed plugin destination is unsafe.');
      if (destinationStatus) { backup = join(this.root, `.plugin.${staged.manifest.id}.${randomUUID()}.backup`); await rename(destination, backup); }
      try { await rename(staging, destination); published = true; }
      catch (error) { if (backup) await rename(backup, destination).catch(() => undefined); throw error; }
      const record: PluginRecord = { id: staged.manifest.id, version: staged.manifest.version, enabled: prior?.enabled === true && prior.capabilityFingerprint === fingerprint, capabilityFingerprint: fingerprint };
      await this.writeState({ version: 1, plugins: { ...previous.plugins, [record.id]: record } });
      if (backup) await rm(backup, { recursive: true, force: true }).catch(() => undefined);
      return record;
    } catch (error) {
      await rm(staging, { recursive: true, force: true }).catch(() => undefined);
      if (published) {
        const destination = managedPath(this.root, inspected.manifest.id);
        await rm(destination, { recursive: true, force: true }).catch(() => undefined);
        if (backup) await rename(backup, destination).catch(() => undefined);
      }
      throw error;
    }
  }
  async list(): Promise<readonly PluginRecord[]> { return Object.values((await this.state()).plugins).sort((a, b) => a.id.localeCompare(b.id)); }
  async enable(id: string): Promise<PluginRecord> { return this.setEnabled(id, true); }
  async disable(id: string): Promise<PluginRecord> { return this.setEnabled(id, false); }
  private async setEnabled(id: string, enabled: boolean): Promise<PluginRecord> {
    const safeId = identifier(id, 'plugin ID', true); const previous = await this.state(); const record = previous.plugins[safeId];
    if (!record) invalid(`unknown managed plugin ${safeId}.`);
    const destination = managedPath(this.root, safeId); const status = await lstat(destination).catch(() => undefined);
    if (!status?.isDirectory() || status.isSymbolicLink()) invalid('managed plugin package is unavailable.');
    const next = { ...record, enabled }; await this.writeState({ version: 1, plugins: { ...previous.plugins, [safeId]: next } }); return next;
  }
  async uninstall(id: string): Promise<void> {
    const safeId = identifier(id, 'plugin ID', true); const previous = await this.state();
    if (!previous.plugins[safeId]) invalid(`unknown managed plugin ${safeId}.`);
    const destination = managedPath(this.root, safeId); if (!contained(join(this.root, 'packages'), destination)) invalid('managed plugin path escapes its root.');
    const status = await lstat(destination).catch((error: NodeJS.ErrnoException) => error.code === 'ENOENT' ? undefined : Promise.reject(error));
    if (status && (!status.isDirectory() || status.isSymbolicLink())) invalid('managed plugin package is unsafe.');
    const staging = join(this.root, `.plugin.${safeId}.${randomUUID()}.uninstall`);
    if (status) await rename(destination, staging);
    const plugins = { ...previous.plugins }; delete plugins[safeId];
    try {
      await this.writeState({ version: 1, plugins });
      if (status) await rm(staging, { recursive: true, force: true }).catch(() => undefined);
    } catch (error) {
      if (status) await rename(staging, destination).catch(() => undefined);
      throw error;
    }
  }
}
