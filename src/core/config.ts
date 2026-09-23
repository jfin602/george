import { homedir } from 'node:os';
import { join, resolve } from 'node:path';

import { GeorgeError } from './errors.ts';
import { DEFAULT_RUN_BUDGET, type RunBudgetConfig, validateRunBudget } from './run-budget.ts';

export const DEFAULT_LM_STUDIO_BASE_URL = 'http://127.0.0.1:1234';
export const DEFAULT_LM_STUDIO_MODEL_ID = 'qwen3-coder-30b-a3b-instruct@q4_k_m';
export const DEFAULT_PROVIDER_TIMEOUT_MS = 120_000;
export const MAX_PROVIDER_TIMEOUT_MS = 120_000;
export const DEFAULT_CONTEXT_PROFILE: ContextProfile = {
  id: 'qwen3-coder-30b-a3b-instruct-q4_k_m-lm-studio-32k',
  physicalContextTokens: 32_768,
  preferredWorkingSetTokens: { min: 12_000, max: 18_000 },
  softPressureTokens: 20_000,
  providerInputTokens: 24_576,
  reservedHeadroomTokens: 8_192,
  alwaysOnInstructionTokens: 2_560,
};

/** Operating policy, not provider wire semantics or a claim about model capability. */
export type ContextProfile = Readonly<{
  id: string;
  physicalContextTokens: number;
  preferredWorkingSetTokens: Readonly<{ min: number; max: number }>;
  softPressureTokens: number;
  providerInputTokens: number;
  reservedHeadroomTokens: number;
  alwaysOnInstructionTokens: number;
}>;

export type GeorgeConfig = Readonly<{
  workspace: string;
  userConfigRoot: string;
  context: Readonly<{ profile: ContextProfile }>;
  runBudget: RunBudgetConfig;
  provider: Readonly<{
    baseUrl: URL;
    model: string;
    timeoutMs: number;
  }>;
}>;

export type GeorgeConfigInput = Readonly<{
  workspace?: string;
  baseUrl?: string | URL;
  model?: string;
  providerTimeoutMs?: number;
  userConfigRoot?: string;
  contextProfile?: ContextProfile;
  runBudget?: RunBudgetConfig;
}>;

export type GeorgeConfigEnvironment = Readonly<{
  environment?: Readonly<Record<string, string | undefined>>;
  platform?: NodeJS.Platform;
  homeDirectory?: string;
}>;

function configurationError(message: string): never {
  throw new GeorgeError('configuration', message);
}

export function validateWorkspace(value: string, cwd = process.cwd()): string {
  if (!value.trim()) configurationError('Workspace must not be empty.');
  if (value.includes('\0')) configurationError('Workspace must not contain NUL.');
  return resolve(cwd, value);
}

export function validateModelId(value: string): string {
  const model = value.trim();
  if (!model) configurationError('Model ID must not be empty.');
  if (/\p{Cc}/u.test(model)) {
    configurationError('Model ID must not contain control characters.');
  }
  return model;
}

export function validateProviderTimeoutMs(value: number): number {
  if (!Number.isInteger(value) || value < 1 || value > MAX_PROVIDER_TIMEOUT_MS) {
    configurationError(`Provider timeout must be an integer between 1 and ${MAX_PROVIDER_TIMEOUT_MS} ms.`);
  }
  return value;
}

function providerTimeoutFromEnvironment(value: string | undefined): number {
  if (value === undefined) return DEFAULT_PROVIDER_TIMEOUT_MS;
  if (!/^\d+$/.test(value)) {
    configurationError(`GEORGE_PROVIDER_TIMEOUT_MS must be an integer between 1 and ${MAX_PROVIDER_TIMEOUT_MS} ms.`);
  }
  return validateProviderTimeoutMs(Number(value));
}

function positiveContextNumber(value: number, name: string): number {
  if (!Number.isInteger(value) || value < 1) configurationError(`${name} must be a positive integer.`);
  return value;
}

export function validateContextProfile(value: ContextProfile): ContextProfile {
  if (!value.id.trim()) configurationError('Context profile ID must not be empty.');
  const physicalContextTokens = positiveContextNumber(value.physicalContextTokens, 'Physical context target');
  const min = positiveContextNumber(value.preferredWorkingSetTokens.min, 'Preferred working-set minimum');
  const max = positiveContextNumber(value.preferredWorkingSetTokens.max, 'Preferred working-set maximum');
  const softPressureTokens = positiveContextNumber(value.softPressureTokens, 'Soft pressure threshold');
  const providerInputTokens = positiveContextNumber(value.providerInputTokens, 'Provider input budget');
  const reservedHeadroomTokens = positiveContextNumber(value.reservedHeadroomTokens, 'Reserved headroom');
  const alwaysOnInstructionTokens = positiveContextNumber(value.alwaysOnInstructionTokens, 'Always-on instruction target');
  if (min > max || max > providerInputTokens || softPressureTokens > providerInputTokens || providerInputTokens + reservedHeadroomTokens > physicalContextTokens || alwaysOnInstructionTokens > providerInputTokens) {
    configurationError('Context profile token targets are inconsistent.');
  }
  return { id: value.id.trim(), physicalContextTokens, preferredWorkingSetTokens: { min, max }, softPressureTokens, providerInputTokens, reservedHeadroomTokens, alwaysOnInstructionTokens };
}

export function resolveGeorgeUserConfigRoot(
  environment: Readonly<Record<string, string | undefined>> = process.env,
  platform: NodeJS.Platform = process.platform,
  homeDirectory = homedir(),
): string {
  if (!homeDirectory || homeDirectory.includes('\0')) configurationError('Home directory must be a non-empty path without NUL.');
  const xdgRoot = platform === 'linux' ? environment.XDG_CONFIG_HOME?.trim() : undefined;
  return join(xdgRoot || join(homeDirectory, '.config'), 'george');
}

function validateUserConfigRoot(value: string, cwd: string): string {
  if (!value.trim() || value.includes('\0')) configurationError('George user config root must be a non-empty path without NUL.');
  return resolve(cwd, value);
}

function isLoopbackHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  return (
    host === 'localhost' ||
    host === '[::1]' ||
    /^127(?:\.\d{1,3}){3}$/.test(host)
  );
}

export function validateProviderBaseUrl(value: string | URL): URL {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    configurationError('Provider base URL must be a valid absolute URL.');
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    configurationError('Provider base URL must use HTTP or HTTPS.');
  }
  if (!isLoopbackHost(url.hostname)) {
    configurationError('Phase 1 provider base URL must use a loopback host.');
  }
  if (url.username || url.password || url.search || url.hash || url.pathname !== '/') {
    configurationError('Provider base URL must not include credentials, a path, query, or fragment.');
  }
  return url;
}

export function resolveGeorgeConfig(
  input: GeorgeConfigInput = {},
  cwd = process.cwd(),
  environment: GeorgeConfigEnvironment = {},
): GeorgeConfig {
  const variables = environment.environment ?? process.env;
  return {
    workspace: validateWorkspace(input.workspace ?? cwd, cwd),
    userConfigRoot: input.userConfigRoot === undefined
      ? resolveGeorgeUserConfigRoot(variables, environment.platform, environment.homeDirectory)
      : validateUserConfigRoot(input.userConfigRoot, cwd),
    context: { profile: validateContextProfile(input.contextProfile ?? DEFAULT_CONTEXT_PROFILE) },
    runBudget: validateRunBudget(input.runBudget ?? DEFAULT_RUN_BUDGET),
    provider: {
      baseUrl: validateProviderBaseUrl(
        input.baseUrl ?? DEFAULT_LM_STUDIO_BASE_URL,
      ),
      model: validateModelId(input.model ?? variables.GEORGE_MODEL ?? DEFAULT_LM_STUDIO_MODEL_ID),
      timeoutMs: input.providerTimeoutMs === undefined
        ? providerTimeoutFromEnvironment(variables.GEORGE_PROVIDER_TIMEOUT_MS)
        : validateProviderTimeoutMs(input.providerTimeoutMs),
    },
  };
}
