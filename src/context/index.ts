import { open } from 'node:fs/promises';

import { GeorgeError, resolveWorkspacePath, type Workspace } from '../core/index.ts';

/** A deterministic fallback when an active model tokenizer is unavailable: four UTF-16 code units per token. */
export const defaultContextTokenEstimator: ContextTokenEstimator = {
  kind: 'estimated-4-code-units-per-token',
  estimate: (text) => Math.ceil(text.length / 4),
};

export type ContextTokenEstimator = Readonly<{
  kind: string;
  estimate(text: string): number;
}>;

export type ContextSourceKind =
  | 'george-invariants'
  | 'current-user-input'
  | 'conversation'
  | 'user-global-instructions'
  | 'personality'
  | 'workspace-instructions'
  | 'repository-agents'
  | 'workspace-routing'
  | 'routed-document'
  | 'activated-skill'
  | 'tool-definition-overhead';

export type ContextSourceOrigin = 'george' | 'user' | 'workspace' | 'builtin-skill' | 'user-skill' | 'workspace-skill' | 'tooling';
export type ContextTrust = 'invariant' | 'user-intent' | 'workspace-untrusted' | 'user-default' | 'personality' | 'builtin-skill' | 'user-skill' | 'workspace-skill' | 'tooling';
export type ContextDisposition = 'active' | 'routed' | 'omitted' | 'deferred' | 'duplicate' | 'failed';

export type ContextSource = Readonly<{
  id: string;
  kind: ContextSourceKind;
  origin: ContextSourceOrigin;
  trust: ContextTrust;
  precedence: number;
  order: number;
  required: boolean;
  disposition: ContextDisposition;
  text?: string;
  estimatedTokens?: number;
  reason?: string;
  duplicateOf?: string;
}>;

export type ContextFileLoad = Readonly<
  | { status: 'loaded'; text: string; bytes: number }
  | { status: 'missing' }
  | { status: 'oversized'; bytes: number }
  | { status: 'failed'; reason: string }
>;

export type ActivatedContextSkill = Readonly<{
  id: string;
  text: string;
  origin: 'builtin' | 'user' | 'workspace';
}>;

export type ContextAssemblyOptions = Readonly<{
  invariants: string;
  userInput: string;
  conversation?: string;
  workspace?: Workspace;
  userGlobalInstructionsPath?: string;
  personalityPath?: string;
  routedDocuments?: readonly string[];
  activatedSkills?: readonly ActivatedContextSkill[];
  normalizedToolDefinitions?: string;
  maxSourceBytes?: number;
  maxRoutedDocuments?: number;
  /** Optional sources defer at this pressure point while required sources retain the hard budget. */
  optionalMaxTokens?: number;
  maxTokens: number;
  estimator?: ContextTokenEstimator;
}>;

export type AssembledContext = Readonly<{
  sources: readonly ContextSource[];
  estimator: Readonly<{ kind: string; estimated: true }>;
  estimatedTokens: number;
  rendered: Readonly<{ guidance: string; conversation: string; toolDefinitions: string }>;
}>;

const DEFAULT_SOURCE_BYTES = 32 * 1024;
export const DEFAULT_MAX_ROUTED_DOCUMENTS = 16;
const MISSING_WORKSPACE_PATH = 'Workspace path must exist.';

/** Carries bounded assembly evidence when a required source cannot fit. */
export class ContextAssemblyError extends GeorgeError {
  readonly sources: readonly ContextSource[];
  readonly estimator: AssembledContext['estimator'];
  readonly estimatedTokens: number;

  constructor(message: string, sources: readonly ContextSource[], estimator: AssembledContext['estimator'], estimatedTokens: number) {
    super('validation', message);
    this.name = 'ContextAssemblyError';
    this.sources = sources;
    this.estimator = estimator;
    this.estimatedTokens = estimatedTokens;
  }
}

type Channel = 'guidance' | 'conversation' | 'tools';
type Candidate = Omit<ContextSource, 'disposition' | 'estimatedTokens' | 'reason' | 'duplicateOf'> & Readonly<{
  channel: Channel;
  text?: string;
  disposition?: ContextDisposition;
  reason?: string;
}>;

function validationError(message: string): GeorgeError {
  return new GeorgeError('validation', message);
}

function positive(value: number, name: string): void {
  if (!Number.isInteger(value) || value < 1) throw validationError(`${name} must be a positive integer.`);
}

function normalize(text: string): string {
  return text.replace(/\r\n/g, '\n');
}

function fingerprint(text: string): string {
  return normalize(text);
}

function sourceText(source: ContextSource): string {
  return `[${source.id}; ${source.trust}]\n${source.text ?? ''}`;
}

function rendered(sources: readonly ContextSource[]): AssembledContext['rendered'] {
  const active = (channel: Channel) => sources
    .filter((source) => source.disposition === 'active' && channelFor(source.kind) === channel)
    .map(sourceText)
    .join('\n\n');
  return { guidance: active('guidance'), conversation: active('conversation'), toolDefinitions: active('tools') };
}

function providerFacingText(value: AssembledContext['rendered']): string {
  return `guidance:\n${value.guidance}\n\nconversation:\n${value.conversation}\n\ntool-definitions:\n${value.toolDefinitions}`;
}

function channelFor(kind: ContextSourceKind): Channel {
  if (kind === 'current-user-input' || kind === 'conversation') return 'conversation';
  if (kind === 'tool-definition-overhead') return 'tools';
  return 'guidance';
}

function finalSource(candidate: Candidate, disposition: ContextDisposition, extra: Partial<ContextSource> = {}): ContextSource {
  return {
    id: candidate.id,
    kind: candidate.kind,
    origin: candidate.origin,
    trust: candidate.trust,
    precedence: candidate.precedence,
    order: candidate.order,
    required: candidate.required,
    disposition,
    ...(candidate.text === undefined ? {} : { text: candidate.text }),
    ...(candidate.reason === undefined ? {} : { reason: candidate.reason }),
    ...extra,
  };
}

async function readWholeFile(path: string, maxBytes: number): Promise<ContextFileLoad> {
  positive(maxBytes, 'maxSourceBytes');
  let handle;
  try {
    handle = await open(path, 'r');
  } catch (error: unknown) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return { status: 'missing' };
    return { status: 'failed', reason: error instanceof Error ? error.message : String(error) };
  }
  try {
    const details = await handle.stat();
    if (!details.isFile()) return { status: 'failed', reason: 'Context source must be a regular file.' };
    const buffer = Buffer.alloc(maxBytes + 1);
    const { bytesRead } = await handle.read(buffer, 0, buffer.length, 0);
    if (bytesRead > maxBytes) return { status: 'oversized', bytes: bytesRead };
    const text = buffer.subarray(0, bytesRead).toString('utf8');
    if (text.includes('\0')) return { status: 'failed', reason: 'Context source must not contain NUL.' };
    return { status: 'loaded', text: normalize(text), bytes: bytesRead };
  } catch (error) {
    return { status: 'failed', reason: error instanceof Error ? error.message : String(error) };
  } finally {
    await handle.close();
  }
}

/** Reads no more than maxBytes + one byte; an oversized file has no returned text. */
export async function loadBoundedContextFile(path: string, maxBytes = DEFAULT_SOURCE_BYTES): Promise<ContextFileLoad> {
  return readWholeFile(path, maxBytes);
}

/** Loads a canonical workspace-contained file. Traversal and symlink escapes reject rather than becoming context. */
export async function loadWorkspaceContextFile(workspace: Workspace, path: string, maxBytes = DEFAULT_SOURCE_BYTES): Promise<ContextFileLoad> {
  let resolved: string;
  try {
    resolved = await resolveWorkspacePath(workspace, path);
  } catch (error) {
    if (error instanceof GeorgeError && error.message === MISSING_WORKSPACE_PATH) return { status: 'missing' };
    throw error;
  }
  return readWholeFile(resolved, maxBytes);
}

async function fileCandidate(candidate: Candidate, load: Promise<ContextFileLoad>): Promise<Candidate> {
  const result = await load;
  if (result.status === 'loaded') return { ...candidate, text: result.text };
  if (result.status === 'missing') return { ...candidate, disposition: 'omitted', reason: 'optional source is missing' };
  if (result.status === 'oversized') return { ...candidate, disposition: 'deferred', reason: `source exceeds ${result.bytes - 1} byte safety limit` };
  return { ...candidate, disposition: 'failed', reason: result.reason };
}

function stableRoutedPaths(paths: readonly string[], maxPaths: number): string[] {
  positive(maxPaths, 'maxRoutedDocuments');
  const normalized = [...new Set(paths.map((path) => path.replace(/\\/g, '/')))].sort((left, right) => left.localeCompare(right));
  if (normalized.length > maxPaths) throw validationError(`At most ${maxPaths} routed documents are allowed per turn.`);
  if (normalized.some((path) => path.length > 1_024)) throw validationError('Routed document paths must be at most 1024 characters.');
  return normalized;
}

function optional(candidate: Candidate, text: string | undefined): Candidate {
  return text === undefined || text === ''
    ? { ...candidate, disposition: 'omitted', reason: 'optional source is missing' }
    : { ...candidate, text: normalize(text) };
}

/**
 * Provider-independent context assembly. The returned rendered fields are normalized model material,
 * not any provider's request shape.
 */
export async function assembleContext(options: ContextAssemblyOptions): Promise<AssembledContext> {
  positive(options.maxTokens, 'maxTokens');
  if (options.optionalMaxTokens !== undefined && (!Number.isInteger(options.optionalMaxTokens) || options.optionalMaxTokens < 1 || options.optionalMaxTokens > options.maxTokens)) {
    throw validationError('optionalMaxTokens must be a positive integer no greater than maxTokens.');
  }
  const maxSourceBytes = options.maxSourceBytes ?? DEFAULT_SOURCE_BYTES;
  positive(maxSourceBytes, 'maxSourceBytes');
  const estimator = options.estimator ?? defaultContextTokenEstimator;
  const estimate = (text: string) => {
    const tokens = estimator.estimate(text);
    if (!Number.isInteger(tokens) || tokens < 0) throw validationError('Context token estimator must return a non-negative integer.');
    return tokens;
  };
  const candidates: Candidate[] = [
    { id: 'george:invariants', kind: 'george-invariants', origin: 'george', trust: 'invariant', precedence: 0, order: 0, required: true, channel: 'guidance', text: normalize(options.invariants) },
    { id: 'conversation:current-user-input', kind: 'current-user-input', origin: 'user', trust: 'user-intent', precedence: 10, order: 0, required: true, channel: 'conversation', text: normalize(options.userInput) },
  ];
  if (options.conversation) candidates.push({ id: 'conversation:history', kind: 'conversation', origin: 'user', trust: 'user-intent', precedence: 10, order: 1, required: true, channel: 'conversation', text: normalize(options.conversation) });
  if (options.normalizedToolDefinitions) candidates.push({ id: 'tools:normalized-definition-overhead', kind: 'tool-definition-overhead', origin: 'tooling', trust: 'tooling', precedence: 20, order: 0, required: true, channel: 'tools', text: normalize(options.normalizedToolDefinitions) });

  if (options.workspace) {
    const workspaceCandidates = await Promise.all([
      fileCandidate({ id: 'workspace:.george/instructions.md', kind: 'workspace-instructions', origin: 'workspace', trust: 'workspace-untrusted', precedence: 30, order: 0, required: false, channel: 'guidance' }, loadWorkspaceContextFile(options.workspace, '.george/instructions.md', maxSourceBytes)),
      fileCandidate({ id: 'workspace:AGENTS.md', kind: 'repository-agents', origin: 'workspace', trust: 'workspace-untrusted', precedence: 30, order: 1, required: false, channel: 'guidance' }, loadWorkspaceContextFile(options.workspace, 'AGENTS.md', maxSourceBytes)),
      fileCandidate({ id: 'workspace:BOOT.md', kind: 'workspace-routing', origin: 'workspace', trust: 'workspace-untrusted', precedence: 30, order: 2, required: false, channel: 'guidance', disposition: 'routed' }, loadWorkspaceContextFile(options.workspace, 'BOOT.md', maxSourceBytes)),
    ]);
    candidates.push(...workspaceCandidates);
    const paths = stableRoutedPaths(options.routedDocuments ?? [], options.maxRoutedDocuments ?? DEFAULT_MAX_ROUTED_DOCUMENTS);
    candidates.push(...await Promise.all(paths.map((path, order) => fileCandidate(
      { id: `workspace:routed:${path}`, kind: 'routed-document', origin: 'workspace', trust: 'workspace-untrusted', precedence: 30, order: order + 3, required: false, channel: 'guidance' },
      loadWorkspaceContextFile(options.workspace!, path, maxSourceBytes),
    ))));
  }

  if (options.userGlobalInstructionsPath) candidates.push(await fileCandidate(
    { id: 'user:global-instructions', kind: 'user-global-instructions', origin: 'user', trust: 'user-default', precedence: 40, order: 0, required: false, channel: 'guidance' },
    loadBoundedContextFile(options.userGlobalInstructionsPath, maxSourceBytes),
  ));
  if (options.personalityPath) candidates.push(await fileCandidate(
    { id: 'user:personality', kind: 'personality', origin: 'user', trust: 'personality', precedence: 50, order: 0, required: false, channel: 'guidance' },
    loadBoundedContextFile(options.personalityPath, maxSourceBytes),
  ));
  for (const [order, skill] of (options.activatedSkills ?? []).entries()) {
    const source = skill.origin === 'builtin'
      ? { origin: 'builtin-skill' as const, trust: 'builtin-skill' as const, precedence: 20 }
      : skill.origin === 'user'
        ? { origin: 'user-skill' as const, trust: 'user-skill' as const, precedence: 40 }
        : { origin: 'workspace-skill' as const, trust: 'workspace-skill' as const, precedence: 30 };
    candidates.push(optional({ id: `skill:${skill.id}`, kind: 'activated-skill', ...source, order, required: false, channel: 'guidance' }, skill.text));
  }

  const ordered = candidates.sort((left, right) => left.precedence - right.precedence || left.order - right.order || left.id.localeCompare(right.id));
  const seen = new Map<string, string>();
  const sources: ContextSource[] = [];
  for (const candidate of ordered) {
    if (candidate.disposition) {
      sources.push(finalSource(candidate, candidate.disposition));
      continue;
    }
    const duplicateOf = seen.get(fingerprint(candidate.text ?? ''));
    if (duplicateOf) {
      const { text: _text, ...duplicate } = candidate;
      sources.push(finalSource(duplicate, 'duplicate', { duplicateOf, reason: 'exact normalized content duplicates an earlier source' }));
      continue;
    }
    seen.set(fingerprint(candidate.text ?? ''), candidate.id);
    sources.push(finalSource(candidate, candidate.kind === 'workspace-routing' ? 'routed' : 'active'));
  }

  const budgetable = sources.map((source) => source.disposition === 'active');
  for (let index = 0; index < sources.length; index += 1) {
    if (budgetable[index]) sources[index] = { ...sources[index]!, disposition: 'omitted' };
  }
  for (let index = 0; index < sources.length; index += 1) {
    if (!budgetable[index]) continue;
    const source = sources[index]!;
    const before = rendered(sources);
    const beforeTokens = estimate(providerFacingText(before));
    sources[index] = { ...source, disposition: 'active' };
    const afterTokens = estimate(providerFacingText(rendered(sources)));
    const budget = source.required ? options.maxTokens : options.optionalMaxTokens ?? options.maxTokens;
    if (afterTokens > budget) {
      if (source.required) {
        const message = `Required context source ${source.id} exceeds the ${options.maxTokens} token budget.`;
        sources[index] = { ...source, disposition: 'failed', reason: message };
        const partial = rendered(sources);
        throw new ContextAssemblyError(message, sources, { kind: estimator.kind, estimated: true }, estimate(providerFacingText(partial)));
      }
      const { text: _text, estimatedTokens: _tokens, ...omitted } = source;
      sources[index] = { ...omitted, disposition: source.kind === 'routed-document' ? 'deferred' : 'omitted', reason: `would exceed the ${budget} token ${source.required ? 'hard' : 'optional'} budget` };
      continue;
    }
    sources[index] = { ...source, disposition: 'active', estimatedTokens: afterTokens - beforeTokens };
  }

  const output = rendered(sources);
  return {
    sources,
    estimator: { kind: estimator.kind, estimated: true },
    estimatedTokens: estimate(providerFacingText(output)),
    rendered: output,
  };
}
