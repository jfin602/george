import { resolve } from 'node:path';

import { GeorgeError } from './errors.ts';

export const DEFAULT_LM_STUDIO_BASE_URL = 'http://127.0.0.1:1234';

export type GeorgeConfig = Readonly<{
  workspace: string;
  provider: Readonly<{
    baseUrl: URL;
    model?: string;
  }>;
}>;

export type GeorgeConfigInput = Readonly<{
  workspace?: string;
  baseUrl?: string | URL;
  model?: string;
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
): GeorgeConfig {
  return {
    workspace: validateWorkspace(input.workspace ?? cwd, cwd),
    provider: {
      baseUrl: validateProviderBaseUrl(
        input.baseUrl ?? DEFAULT_LM_STUDIO_BASE_URL,
      ),
      ...(input.model === undefined ? {} : { model: validateModelId(input.model) }),
    },
  };
}
