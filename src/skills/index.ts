import { open, readdir, realpath, stat } from 'node:fs/promises';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

import { GeorgeError } from '../core/index.ts';
import { loadBoundedContextFile } from '../context/index.ts';

export type SkillOrigin = 'builtin' | 'user' | 'workspace';

export type SkillRoots = Readonly<Record<SkillOrigin, string>>;

export type SkillMetadata = Readonly<{
  id: string;
  name: string;
  description: string;
  origin: SkillOrigin;
  help?: string;
  argumentHint?: string;
}>;

export type SkillCatalogIssue = Readonly<{
  origin: SkillOrigin;
  path: string;
  reason: string;
}>;

export type SkillCatalog = Readonly<{
  skills: readonly SkillMetadata[];
  issues: readonly SkillCatalogIssue[];
  collisions: readonly Readonly<{ name: string; ids: readonly string[] }>[];
}>;

type DiscoveredSkill = Readonly<{ metadata: SkillMetadata; path: string }>;

export type ActivatedSkill = Readonly<{ id: string; text: string; origin: SkillOrigin }>;

export const DEFAULT_SKILL_MAX_BYTES = 32 * 1024;
export const DEFAULT_SKILL_METADATA_BYTES = 4 * 1024;
export const DEFAULT_MAX_SKILLS = 128;

export function defaultSkillRoots(userConfigRoot: string, workspaceRoot: string): SkillRoots {
  return {
    builtin: join(dirname(fileURLToPath(import.meta.url)), 'builtin'),
    user: join(userConfigRoot, 'skills'),
    workspace: join(workspaceRoot, '.george', 'skills'),
  };
}

function invalid(message: string): GeorgeError {
  return new GeorgeError('validation', message);
}

function isWithin(root: string, path: string): boolean {
  const value = relative(root, path);
  return value === '' || (!value.startsWith('..') && !value.includes('../'));
}

function safeName(name: string): boolean {
  return /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/.test(name);
}

function unquote(value: string): string {
  const trimmed = value.trim();
  return (trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))
    ? trimmed.slice(1, -1).trim()
    : trimmed;
}

type ParsedMetadata = Readonly<{ name: string; description: string; help?: string; argumentHint?: string; bodyStart: number }>;

/** Small portable frontmatter reader; it deliberately accepts no general YAML features. */
export function parseSkillMetadata(source: string): ParsedMetadata {
  const text = source.replace(/\r\n/g, '\n');
  if (!text.startsWith('---\n')) throw invalid('SKILL.md must start with a metadata delimiter.');
  const end = text.indexOf('\n---\n', 4);
  if (end < 0) throw invalid('SKILL.md metadata delimiter is missing.');
  const lines = text.slice(4, end).split('\n');
  const values = new Map<string, string>();
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index]!;
    if (!line.trim()) continue;
    const match = /^([A-Za-z][A-Za-z0-9-]*):(?:[ \t]*(.*))?$/.exec(line);
    if (!match) throw invalid('SKILL.md metadata contains an invalid line.');
    const key = match[1]!;
    let value = match[2] ?? '';
    if (value === '>' || value === '|') {
      const folded = value === '>';
      const continuation: string[] = [];
      while (index + 1 < lines.length && /^[ \t]+/.test(lines[index + 1]!)) continuation.push(lines[++index]!.trim());
      value = continuation.join(folded ? ' ' : '\n').trim();
    }
    if (key === 'name' || key === 'description' || key === 'help' || key === 'argument-hint') {
      if (values.has(key)) throw invalid(`SKILL.md metadata repeats ${key}.`);
      values.set(key, unquote(value));
    }
  }
  const name = values.get('name');
  const description = values.get('description');
  if (!name || !safeName(name)) throw invalid('SKILL.md requires a safe non-empty name.');
  if (!description) throw invalid('SKILL.md requires a non-empty description.');
  const bodyStart = end + 5;
  if (!text.slice(bodyStart).trim() && text.length > bodyStart) throw invalid('SKILL.md requires a non-empty body.');
  return { name, description, ...(values.get('help') ? { help: values.get('help') } : {}), ...(values.get('argument-hint') ? { argumentHint: values.get('argument-hint') } : {}), bodyStart };
}

async function readMetadata(path: string, maxBytes: number): Promise<string> {
  const handle = await open(path, 'r');
  try {
    const buffer = Buffer.alloc(maxBytes);
    const { bytesRead } = await handle.read(buffer, 0, buffer.length, 0);
    return buffer.subarray(0, bytesRead).toString('utf8');
  } finally {
    await handle.close();
  }
}

export class SkillRegistry {
  private readonly roots: SkillRoots;
  private readonly maxSkillBytes: number;
  private readonly maxMetadataBytes: number;
  private readonly maxSkills: number;

  constructor(roots: SkillRoots, options: Readonly<{ maxSkillBytes?: number; maxMetadataBytes?: number; maxSkills?: number }> = {}) {
    this.roots = roots;
    this.maxSkillBytes = options.maxSkillBytes ?? DEFAULT_SKILL_MAX_BYTES;
    this.maxMetadataBytes = options.maxMetadataBytes ?? DEFAULT_SKILL_METADATA_BYTES;
    this.maxSkills = options.maxSkills ?? DEFAULT_MAX_SKILLS;
    for (const [name, value] of Object.entries({ maxSkillBytes: this.maxSkillBytes, maxMetadataBytes: this.maxMetadataBytes, maxSkills: this.maxSkills })) {
      if (!Number.isInteger(value) || value < 1) throw invalid(`${name} must be a positive integer.`);
    }
    if (this.maxMetadataBytes > this.maxSkillBytes) throw invalid('maxMetadataBytes must not exceed maxSkillBytes.');
  }

  async discover(): Promise<{ catalog: SkillCatalog; discovered: readonly DiscoveredSkill[] }> {
    const discovered: DiscoveredSkill[] = [];
    const issues: SkillCatalogIssue[] = [];
    for (const origin of ['builtin', 'user', 'workspace'] as const) {
      const root = this.roots[origin];
      let canonicalRoot: string;
      try {
        canonicalRoot = await realpath(root);
      } catch (error: unknown) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') continue;
        issues.push({ origin, path: root, reason: error instanceof Error ? error.message : String(error) });
        continue;
      }
      let entries;
      try {
        entries = await readdir(canonicalRoot, { withFileTypes: true });
      } catch (error) {
        issues.push({ origin, path: root, reason: error instanceof Error ? error.message : String(error) });
        continue;
      }
      for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
        if (entry.isSymbolicLink()) {
          issues.push({ origin, path: join(canonicalRoot, entry.name), reason: 'Skill directory must not be a symbolic link.' });
          continue;
        }
        if (!entry.isDirectory()) continue;
        if (!safeName(entry.name)) {
          issues.push({ origin, path: join(canonicalRoot, entry.name), reason: 'Skill directory name is unsafe.' });
          continue;
        }
        const path = join(canonicalRoot, entry.name, 'SKILL.md');
        try {
          const canonicalPath = await realpath(path);
          if (!isWithin(canonicalRoot, canonicalPath)) throw invalid('SKILL.md escapes its skill root.');
          const details = await stat(canonicalPath);
          if (!details.isFile()) throw invalid('SKILL.md must be a regular file.');
          if (details.size > this.maxSkillBytes) throw invalid(`SKILL.md exceeds the ${this.maxSkillBytes} byte safety limit.`);
          const metadata = await readMetadata(canonicalPath, this.maxMetadataBytes);
          const parsed = parseSkillMetadata(metadata);
          if (parsed.name !== entry.name) throw invalid('SKILL.md name must match its containing directory.');
          if (!metadata.slice(parsed.bodyStart).trim() && details.size <= Buffer.byteLength(metadata)) throw invalid('SKILL.md requires a non-empty body.');
          if (discovered.length >= this.maxSkills) throw invalid(`Skill catalog exceeds the ${this.maxSkills} skill limit.`);
          discovered.push({ metadata: { id: `${origin}:${parsed.name}`, name: parsed.name, description: parsed.description, origin, ...(parsed.help ? { help: parsed.help } : {}), ...(parsed.argumentHint ? { argumentHint: parsed.argumentHint } : {}) }, path: canonicalPath });
        } catch (error) {
          issues.push({ origin, path, reason: error instanceof Error ? error.message : String(error) });
        }
      }
    }
    discovered.sort((left, right) => left.metadata.id.localeCompare(right.metadata.id));
    const skills = discovered.map((skill) => skill.metadata);
    const collisions = [...new Map(skills.map((skill) => [skill.name, skills.filter((other) => other.name === skill.name).map((other) => other.id)]))]
      .filter(([, ids]) => ids.length > 1)
      .map(([name, ids]) => ({ name, ids }));
    return { catalog: { skills, issues, collisions }, discovered };
  }

  async catalog(): Promise<SkillCatalog> {
    return (await this.discover()).catalog;
  }

  /** Resolves one explicit request without loading its declarative body. */
  async resolve(requestedId: string): Promise<SkillMetadata> {
    const { discovered } = await this.discover();
    const matches = requestedId.includes(':')
      ? discovered.filter((skill) => skill.metadata.id === requestedId)
      : discovered.filter((skill) => skill.metadata.name === requestedId);
    if (matches.length === 0) throw invalid(`Unknown skill ${requestedId}.`);
    if (matches.length > 1) throw invalid(`Ambiguous skill ${requestedId}; use a qualified ID.`);
    return matches[0]!.metadata;
  }

  async activate(requested: readonly string[]): Promise<readonly ActivatedSkill[]> {
    const { discovered } = await this.discover();
    const activated: ActivatedSkill[] = [];
    for (const requestedId of requested) {
      const matches = requestedId.includes(':')
        ? discovered.filter((skill) => skill.metadata.id === requestedId)
        : discovered.filter((skill) => skill.metadata.name === requestedId);
      if (matches.length === 0) throw invalid(`Unknown skill ${requestedId}.`);
      if (matches.length > 1) throw invalid(`Ambiguous skill ${requestedId}; use a qualified ID.`);
      const skill = matches[0]!;
      if (activated.some((item) => item.id === skill.metadata.id)) continue;
      const loaded = await loadBoundedContextFile(skill.path, this.maxSkillBytes);
      if (loaded.status !== 'loaded') throw invalid(`Skill ${skill.metadata.id} cannot be activated: ${loaded.status === 'failed' ? loaded.reason : loaded.status}.`);
      const parsed = parseSkillMetadata(loaded.text);
      if (parsed.name !== skill.metadata.name || !loaded.text.slice(parsed.bodyStart).trim()) throw invalid(`Skill ${skill.metadata.id} has malformed body.`);
      activated.push({ id: skill.metadata.id, origin: skill.metadata.origin, text: loaded.text.slice(parsed.bodyStart).trim() });
    }
    return activated;
  }
}
