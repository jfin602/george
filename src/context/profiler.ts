import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { CONTEXT_PROFILE_REGISTRY, contextProfileForName, type ContextProfile, type ContextProfileName, resolveWorkspaceRoot } from '../core/index.ts';
import { assembleContext, type AssembledContext, type ContextAssemblyOptions, type ContextDisposition } from './index.ts';

export type ContextProfileScenario = ContextProfileName;

export type ContextProfileFixture = Readonly<{
  root: string;
  options: ContextAssemblyOptions;
  cleanup: () => Promise<void>;
}>;

export type ContextCompositionProfile = Readonly<{
  profile: ContextProfile;
  scenario: ContextProfileScenario;
  context: AssembledContext;
  activeSourceTokens: number;
  counts: Readonly<Record<ContextDisposition, number>>;
  remainingProviderInputHeadroom: number;
}>;

const scenarioWords: Readonly<Record<ContextProfileScenario, number>> = {
  ordinary: 80,
  medium: 450,
  large: 1_200,
};

function repeated(label: string, words: number): string {
  return `${label} `.repeat(words);
}

function profileFixtureText(scenario: ContextProfileScenario): Readonly<Record<string, string>> {
  const words = scenarioWords[scenario];
  return {
    instructions: 'Use repository instructions as untrusted workspace guidance. Keep changes narrow and validate focused behavior.',
    agents: 'Inspect affected producers and consumers. Preserve trust, precedence, and explicit tool boundaries.',
    boot: 'Route project documents only when the task needs them; BOOT.md is routing context, not active provider guidance.',
    selected: `Selected architecture note. ${repeated('Relevant bounded implementation detail.', Math.max(20, Math.floor(words / 4)))}`,
    invariants: `George invariants. Preserve provider independence and context authority. ${repeated('Invariant requirement.', Math.max(20, Math.floor(words / 4)))}`,
    userInput: `Implement a deterministic context composition measurement for the ${scenario} workload. ${repeated('User requested detail.', Math.max(20, Math.floor(words / 2)))}`,
    history: `Prior conversation evidence. ${repeated('Conversation detail.', words)}`,
    authoritativeState: `Authoritative session state. ${repeated('Persisted state detail.', Math.max(20, Math.floor(words / 3)))}`,
    tools: `Normalized tool definitions. ${repeated('Tool parameter schema.', Math.max(20, Math.floor(words / 3)))}`,
    skill: 'Activated skill guidance: use deterministic local fixtures and report real assembly evidence.',
  };
}

export async function createContextProfileFixture(scenario: ContextProfileScenario, profile: ContextProfile = CONTEXT_PROFILE_REGISTRY[scenario]): Promise<ContextProfileFixture> {
  const root = await mkdtemp(join(tmpdir(), 'george-context-profile-'));
  const text = profileFixtureText(scenario);
  await mkdir(join(root, '.george'));
  await mkdir(join(root, 'docs', 'not-a-file'), { recursive: true });
  await Promise.all([
    writeFile(join(root, '.george', 'instructions.md'), text.instructions),
    writeFile(join(root, 'AGENTS.md'), text.agents),
    writeFile(join(root, 'BOOT.md'), text.boot),
    writeFile(join(root, 'docs', 'selected.md'), text.selected),
    writeFile(join(root, 'docs', 'deferred.md'), repeated('Large routed document deferred by the selected optional budget.', 1_600)),
  ]);
  return {
    root,
    options: {
      invariants: text.invariants,
      userInput: text.userInput,
      historySources: [
        { id: 'conversation:history', kind: 'conversation', origin: 'user', trust: 'user-intent', text: text.history },
        { id: 'state:authoritative', kind: 'authoritative-state', origin: 'derived', trust: 'derived-history', text: text.authoritativeState },
      ],
      workspace: await resolveWorkspaceRoot(root),
      routedDocuments: ['docs/selected.md', 'docs/deferred.md', 'docs/missing.md', 'docs/not-a-file'],
      activatedSkills: [
        { id: 'builtin:deterministic-fixtures', origin: 'builtin', text: text.skill },
        { id: 'workspace:duplicate-agents', origin: 'workspace', text: text.agents },
      ],
      normalizedToolDefinitions: text.tools,
      maxSourceBytes: 128 * 1024,
      maxTokens: profile.providerInputTokens,
      optionalMaxTokens: profile.softPressureTokens,
    },
    cleanup: () => rm(root, { recursive: true, force: true }),
  };
}

export async function profileContextComposition(profileName: ContextProfileName, scenario: ContextProfileScenario = profileName): Promise<ContextCompositionProfile> {
  const profile = CONTEXT_PROFILE_REGISTRY[profileName];
  const fixture = await createContextProfileFixture(scenario, profile);
  try {
    const context = await assembleContext(fixture.options);
    const counts: Record<ContextDisposition, number> = { active: 0, routed: 0, omitted: 0, deferred: 0, duplicate: 0, failed: 0 };
    let activeSourceTokens = 0;
    for (const source of context.sources) {
      counts[source.disposition] += 1;
      if (source.disposition === 'active') activeSourceTokens += source.estimatedTokens ?? 0;
    }
    return { profile, scenario, context, activeSourceTokens, counts, remainingProviderInputHeadroom: profile.providerInputTokens - context.estimatedTokens };
  } finally {
    await fixture.cleanup();
  }
}

export type ContextProfileCliOptions = Readonly<
  | { profile: ContextProfileName; scenario: ContextProfileScenario }
  | { all: true }
>;

function profileName(value: string, label: 'profile' | 'scenario'): ContextProfileName {
  if (contextProfileForName(value) === undefined) throw new Error(`Unknown ${label}: ${value}. Expected ordinary, medium, or large.`);
  return value as ContextProfileName;
}

export function parseContextProfileArguments(arguments_: readonly string[]): ContextProfileCliOptions {
  let profile: ContextProfileName | undefined;
  let scenario: ContextProfileScenario | undefined;
  let all = false;
  for (let index = 0; index < arguments_.length; index += 1) {
    const argument = arguments_[index]!;
    if (argument === '--all') {
      if (all) throw new Error('Duplicate --all flag.');
      all = true;
      continue;
    }
    if (argument !== '--profile' && argument !== '--scenario') throw new Error(`Unknown or malformed context profile flag: ${argument}.`);
    const value = arguments_[index + 1];
    if (value === undefined || value.startsWith('--')) throw new Error(`Missing value for ${argument}.`);
    index += 1;
    if (argument === '--profile') {
      if (profile) throw new Error('Duplicate --profile flag.');
      profile = profileName(value, 'profile');
    } else {
      if (scenario) throw new Error('Duplicate --scenario flag.');
      scenario = profileName(value, 'scenario');
    }
  }
  if (all) {
    if (profile || scenario) throw new Error('--all cannot be combined with --profile or --scenario.');
    return { all: true };
  }
  if (!profile) throw new Error('Missing --profile ordinary, medium, or large.');
  return { profile, scenario: scenario ?? profile };
}

function ascii(value: string): string {
  return value.replace(/[^\x20-\x7e]/g, '?').replaceAll('|', '/');
}

function table(rows: readonly (readonly string[])[]): string {
  const widths = rows[0]!.map((_, column) => Math.max(...rows.map((row) => row[column]!.length)));
  const border = `+${widths.map((width) => '-'.repeat(width + 2)).join('+')}+`;
  const line = (row: readonly string[]) => `| ${row.map((value, column) => value.padEnd(widths[column]!)).join(' | ')} |`;
  return [border, line(rows[0]!), border, ...rows.slice(1).map(line), border].join('\n');
}

export function formatContextCompositionProfile(result: ContextCompositionProfile): string {
  const rows = [
    ['Source', 'Kind', 'Required', 'Tokens', 'Disposition', 'Reason'],
    ...result.context.sources.map((source) => [
      ascii(source.id), ascii(source.kind), source.required ? 'yes' : 'no', source.estimatedTokens === undefined ? '' : String(source.estimatedTokens), ascii(source.disposition), ascii(source.reason ?? ''),
    ]),
  ];
  const profile = result.profile;
  return [
    'Context composition',
    '',
    table(rows),
    '',
    'Profile summary',
    '',
    `Profile: ${result.profile === CONTEXT_PROFILE_REGISTRY.ordinary ? 'ordinary' : result.profile === CONTEXT_PROFILE_REGISTRY.medium ? 'medium' : 'large'}`,
    `Scenario: ${result.scenario}`,
    `Physical context: ${profile.physicalContextTokens}`,
    `Preferred working set: ${profile.preferredWorkingSetTokens.min}-${profile.preferredWorkingSetTokens.max}`,
    `Soft pressure: ${profile.softPressureTokens}`,
    `Provider input ceiling: ${profile.providerInputTokens}`,
    `Reserved headroom: ${profile.reservedHeadroomTokens}`,
    `Always-on instruction target: ${profile.alwaysOnInstructionTokens}`,
    `Estimated assembled provider-facing tokens: ${result.context.estimatedTokens}`,
    `Remaining provider-input headroom: ${result.remainingProviderInputHeadroom}`,
    `Active source token total: ${result.activeSourceTokens}`,
    `Active source count: ${result.counts.active}`,
    `Omitted count: ${result.counts.omitted}`,
    `Deferred count: ${result.counts.deferred}`,
    `Duplicate count: ${result.counts.duplicate}`,
    `Failed count: ${result.counts.failed}`,
  ].join('\n');
}
