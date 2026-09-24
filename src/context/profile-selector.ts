import {
  CONTEXT_PROFILE_ORDER,
  CONTEXT_PROFILE_REGISTRY,
  type ContextOperatingMode,
  type ContextProfile,
  type ContextProfileName,
  validateContextOperatingMode,
  validateContextProfile,
} from '../core/index.ts';
import { ContextAssemblyError, type AssembledContext, type ContextSource } from './index.ts';

export type ContextPromotionReason =
  | 'required-source-failure'
  | 'soft-pressure'
  | 'selected-project-instructions'
  | 'routed-document'
  | 'activated-skill';

export type ContextProfileSelection = Readonly<{
  mode: ContextOperatingMode;
  profile: ContextProfile;
  attemptedProfileIds: readonly string[];
  promotionReasons: readonly ContextPromotionReason[];
}>;

export type ContextProfileSelectorOptions = Readonly<{
  mode: ContextOperatingMode;
  /** Fixed mode requires this validated concrete profile; adaptive mode ignores it. */
  profile?: ContextProfile;
  /** A probe must be a non-canonical assembly: no provider, tool, hook, session, or lifecycle-event work. */
  assemble: (profile: ContextProfile) => Promise<AssembledContext>;
}>;

type Probe = Readonly<{ profile: ContextProfile; context?: AssembledContext; error?: ContextAssemblyError }>;

function promotionReason(source: ContextSource): ContextPromotionReason | undefined {
  if (source.kind === 'workspace-instructions' || source.kind === 'repository-agents') return 'selected-project-instructions';
  if (source.kind === 'routed-document') return 'routed-document';
  if (source.kind === 'activated-skill') return 'activated-skill';
  return undefined;
}

function reasonsRelievedByLargerProfile(probe: Probe, larger: readonly Probe[]): readonly ContextPromotionReason[] {
  if (!probe.context) return [];
  const reasons = new Set<ContextPromotionReason>();
  for (const source of probe.context.sources) {
    const reason = promotionReason(source);
    if (reason === undefined || (source.disposition !== 'omitted' && source.disposition !== 'deferred')) continue;
    if (larger.some((candidate) => candidate.context?.sources.some((next) => next.id === source.id && next.disposition === 'active'))) reasons.add(reason);
  }
  return [...reasons];
}

function hasSelectedSourcePressure(probe: Probe): boolean {
  return probe.context?.sources.some((source) => promotionReason(source) !== undefined && (source.disposition === 'omitted' || source.disposition === 'deferred')) ?? false;
}

function hasSoftPressure(probe: Probe): boolean {
  return probe.context !== undefined && probe.context.estimatedTokens >= probe.profile.softPressureTokens;
}

/**
 * Selects an operating profile from real assembly outcomes. Probe outputs are deliberately discarded;
 * callers assemble once more with canonical observations after selection.
 */
export async function selectContextProfile(options: ContextProfileSelectorOptions): Promise<ContextProfileSelection> {
  const mode = validateContextOperatingMode(options.mode);
  if (mode === 'fixed') {
    if (!options.profile) throw new Error('Fixed context mode requires a profile.');
    return { mode: 'fixed', profile: validateContextProfile(options.profile), attemptedProfileIds: [], promotionReasons: [] };
  }

  const probes: Probe[] = [];
  const probe = async (name: ContextProfileName): Promise<Probe> => {
    const profile = CONTEXT_PROFILE_REGISTRY[name];
    try {
      const result = { profile, context: await options.assemble(profile) };
      probes.push(result);
      return result;
    } catch (error) {
      if (!(error instanceof ContextAssemblyError)) throw error;
      const result = { profile, error };
      probes.push(result);
      return result;
    }
  };

  const promotionReasons = new Set<ContextPromotionReason>();
  for (let index = 0; index < CONTEXT_PROFILE_ORDER.length; index += 1) {
    if (probes.length === index) await probe(CONTEXT_PROFILE_ORDER[index]!);
    const current = probes[index]!;
    if (current.error) {
      if (index === CONTEXT_PROFILE_ORDER.length - 1) throw current.error;
      promotionReasons.add('required-source-failure');
      continue;
    }
    if (hasSoftPressure(current) && index !== CONTEXT_PROFILE_ORDER.length - 1) {
      promotionReasons.add('soft-pressure');
      continue;
    }
    if (!hasSelectedSourcePressure(current) || index === CONTEXT_PROFILE_ORDER.length - 1) return {
      mode: 'adaptive', profile: current.profile, attemptedProfileIds: probes.map((item) => item.profile.id), promotionReasons: [...promotionReasons],
    };
    let reasons: readonly ContextPromotionReason[] = [];
    for (let next = index + 1; next < CONTEXT_PROFILE_ORDER.length; next += 1) {
      if (probes.length === next) await probe(CONTEXT_PROFILE_ORDER[next]!);
      reasons = reasonsRelievedByLargerProfile(current, probes.slice(index + 1, next + 1));
      if (reasons.length > 0) break;
    }
    if (reasons.length === 0) return {
      mode: 'adaptive', profile: current.profile, attemptedProfileIds: probes.map((item) => item.profile.id), promotionReasons: [...promotionReasons],
    };
    for (const reason of reasons) promotionReasons.add(reason);
  }
  throw new Error('Context profile selection ended without a profile.');
}
