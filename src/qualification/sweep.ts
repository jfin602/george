import { asGeorgeError } from '../core/index.ts';
import { sanitizeTaskEvidence, type StackStateProjection, type TaskStateProjection } from '../tasks/index.ts';

export type SweepObservedResult = 'Green' | 'Not Green' | 'Evidence Gap' | 'Not Run';
export type SweepQualificationStatus = 'qualifying' | 'diagnostic-only' | 'not-run';
export type SweepCommonState = 'Green' | 'Not Green' | 'Evidence Gap';

export type FunctionalEfficiencyResult = Readonly<{
  functionalResult: Exclude<SweepObservedResult, 'Not Run'>;
  efficiencyTarget: 'met' | 'missed' | 'not-measured';
  toolCalls: number | null;
  providerRounds: number | null;
}>;

/** Keeps nonblocking efficiency measurements separate from functional/hard-budget truth. */
export function classifyFunctionalEfficiency(options: Readonly<{
  functionalResult: Exclude<SweepObservedResult, 'Not Run'>;
  hardBudgetExhausted: boolean;
  toolCalls?: number | null;
  providerRounds?: number | null;
  targetToolCalls: number;
  targetProviderRounds: number;
}>): FunctionalEfficiencyResult {
  const toolCalls = options.toolCalls ?? null;
  const providerRounds = options.providerRounds ?? null;
  for (const [label, value] of [['tool calls', toolCalls], ['provider rounds', providerRounds], ['tool-call target', options.targetToolCalls], ['provider-round target', options.targetProviderRounds]] as const) {
    if (value !== null && (!Number.isSafeInteger(value) || value < 0)) throw new Error(`Efficiency ${label} must be a non-negative safe integer.`);
  }
  const functionalResult = options.hardBudgetExhausted ? 'Not Green' : options.functionalResult;
  const efficiencyTarget = toolCalls === null || providerRounds === null
    ? 'not-measured'
    : toolCalls <= options.targetToolCalls && providerRounds <= options.targetProviderRounds ? 'met' : 'missed';
  return Object.freeze({ functionalResult, efficiencyTarget, toolCalls, providerRounds });
}

const SWEEP_PREFLIGHT_POLICY = Object.freeze({
  'supported-runtime': 'abort',
  'pinned-model': 'abort',
  'runtime-controls': 'abort',
  'application-runnable': 'abort',
  typecheck: 'abort',
  'instrument-identity': 'abort',
  'evidence-writer': 'abort',
  'permission-security-recovery': 'abort',
  'workspace-autonomous-containment': 'abort',
  'provider-tool-contract': 'abort',
  'qualification-harness': 'abort',
  'opentui-renderer': 'record',
  'functional-test': 'record',
  'broad-functional-test': 'record',
  'live-functional': 'record',
  'model-task-behavior': 'record',
  'historical-intermittent': 'record',
  'native-real-tty': 'record',
  'gpu-offload-26': 'record',
} as const);

export type SweepPreflightKind = keyof typeof SWEEP_PREFLIGHT_POLICY;

export type SweepPreflightObservation = Readonly<{
  identity: string;
  kind: SweepPreflightKind;
  state: SweepCommonState;
  message?: string;
}>;

export type SweepAbortClassification = Readonly<{
  liveSweepEligible: boolean;
  abortState: SweepCommonState;
  abortReasons: readonly string[];
  recordAndContinue: readonly SweepPreflightObservation[];
}>;

const SWEEP_PREFLIGHT_KINDS = Object.keys(SWEEP_PREFLIGHT_POLICY) as SweepPreflightKind[];

/** Classifies bounded preflight evidence by semantic safety scope, not aggregate test state. */
export function classifySweepAbortScope(observations: readonly SweepPreflightObservation[]): SweepAbortClassification {
  if (observations.length > 256) throw new Error('Sweep preflight exceeds 256 observations.');
  const identities = new Set<string>();
  const abortReasons: string[] = [];
  const recordAndContinue: SweepPreflightObservation[] = [];
  let abortState: SweepCommonState = 'Green';

  for (const item of observations) {
    const identity = boundedRequired(item.identity, 'Sweep preflight identity', 512);
    if (identities.has(identity)) throw new Error(`Duplicate sweep preflight identity: ${identity}.`);
    identities.add(identity);
    const kind = oneOf(item.kind, SWEEP_PREFLIGHT_KINDS, 'Sweep preflight kind');
    const state = oneOf(item.state, ['Green', 'Not Green', 'Evidence Gap'], 'Sweep preflight state');
    const message = item.message === undefined ? undefined : boundedDiagnostic(item.message, 1024);
    if (state === 'Green') continue;
    const observation = Object.freeze({ identity, kind, state, ...(message === undefined ? {} : { message }) });
    if (SWEEP_PREFLIGHT_POLICY[kind] === 'record') {
      recordAndContinue.push(observation);
      continue;
    }
    if (state === 'Not Green' || abortState === 'Green') abortState = state;
    abortReasons.push(boundedDiagnostic(`${identity}: ${message ?? kind}`, 1024));
  }

  return Object.freeze({
    liveSweepEligible: abortState === 'Green',
    abortState,
    abortReasons: Object.freeze(abortReasons),
    recordAndContinue: Object.freeze(recordAndContinue),
  });
}

export function sweepCommonFromAbortScope(classification: SweepAbortClassification): Readonly<{ state: SweepCommonState; reason?: string }> {
  return classification.liveSweepEligible
    ? Object.freeze({ state: 'Green' })
    : Object.freeze({ state: classification.abortState, reason: boundedDiagnostic(classification.abortReasons.join('; '), 1024) });
}

export type SweepWorkloadResult = Readonly<{
  id: string;
  observedResult: SweepObservedResult;
  qualificationStatus: SweepQualificationStatus;
  attempts: 0 | 1;
  harnessError?: Readonly<{ code: string; message: string }>;
}>;

export type QualificationSweep = Readonly<{
  commonState: SweepCommonState;
  commonAbortReason: string | null;
  orderedWorkloadIds: readonly string[];
  results: readonly SweepWorkloadResult[];
}>;

export async function runQualificationSweep(options: Readonly<{
  common: Readonly<{ state: SweepCommonState; reason?: string }>;
  workloads: readonly Readonly<{
    id: string;
    prerequisites: readonly string[];
    run: () => Promise<Exclude<SweepObservedResult, 'Not Run'>>;
  }>[];
  persist?: (result: SweepWorkloadResult) => Promise<void>;
}>): Promise<QualificationSweep> {
  const initialCommonState = oneOf(options.common.state, ['Green', 'Not Green', 'Evidence Gap'], 'Common qualification state');
  const orderedWorkloadIds = options.workloads.map(({ id }) => boundedRequired(id, 'workload ID', 256));
  const positions = new Map<string, number>();
  for (const [index, id] of orderedWorkloadIds.entries()) {
    if (positions.has(id)) throw new Error(`Duplicate sweep workload ID: ${id}.`);
    positions.set(id, index);
  }
  for (const [index, workload] of options.workloads.entries()) {
    for (const prerequisite of workload.prerequisites) {
      const prerequisiteIndex = positions.get(prerequisite);
      if (prerequisiteIndex === undefined || prerequisiteIndex >= index) throw new Error(`Sweep prerequisite must name an earlier workload: ${prerequisite}.`);
    }
  }

  const notRun = (): readonly SweepWorkloadResult[] => Object.freeze(orderedWorkloadIds.map((id) => Object.freeze({ id, observedResult: 'Not Run', qualificationStatus: 'not-run', attempts: 0 })));
  if (initialCommonState !== 'Green') {
    return Object.freeze({ commonState: initialCommonState, commonAbortReason: boundedDiagnostic(options.common.reason ?? 'Common qualification validity failed.', 1024), orderedWorkloadIds: Object.freeze(orderedWorkloadIds), results: notRun() });
  }

  const results: SweepWorkloadResult[] = [];
  let commonState: SweepCommonState = 'Green';
  let commonAbortReason: string | null = null;
  for (const workload of options.workloads) {
    if (commonState !== 'Green') {
      results.push(Object.freeze({ id: workload.id, observedResult: 'Not Run', qualificationStatus: 'not-run', attempts: 0 }));
      continue;
    }
    const qualifying = workload.prerequisites.every((id) => {
      const prerequisite = results[positions.get(id)!];
      return prerequisite?.observedResult === 'Green' && prerequisite.qualificationStatus === 'qualifying';
    });
    let observedResult: Exclude<SweepObservedResult, 'Not Run'>;
    let harnessError: SweepWorkloadResult['harnessError'];
    try { observedResult = oneOf(await workload.run(), ['Green', 'Not Green', 'Evidence Gap'], 'Observed result'); }
    catch (error) {
      const normalized = asGeorgeError(error);
      observedResult = 'Evidence Gap';
      harnessError = Object.freeze({ code: boundedDiagnostic(normalized.code, 128), message: boundedDiagnostic(normalized.message, 1024) });
    }
    const result = Object.freeze({ id: workload.id, observedResult, qualificationStatus: qualifying ? 'qualifying' as const : 'diagnostic-only' as const, attempts: 1 as const, ...(harnessError === undefined ? {} : { harnessError }) });
    results.push(result);
    if (options.persist) {
      try { await options.persist(result); }
      catch (error) {
        const normalized = asGeorgeError(error);
        commonState = 'Evidence Gap';
        commonAbortReason = boundedDiagnostic(`Evidence writer failed: ${normalized.message}`, 1024);
      }
    }
  }
  return Object.freeze({ commonState, commonAbortReason, orderedWorkloadIds: Object.freeze(orderedWorkloadIds), results: Object.freeze(results) });
}

export type FailureLedgerClassification = 'new' | 'retained' | 'intermittent' | 'environment-only' | 'unresolved';
export type FailureRepairCluster = 'agent-provider-context' | 'ui-test-stability' | 'environment-only' | 'unresolved';
export type FailureClass = 'provider' | 'turn' | 'tool' | 'validation' | 'harness' | 'observer' | 'test' | 'environment' | 'evidence' | 'unknown';

export type FailureLedgerEntryInput = Readonly<{
  identity: string;
  layer: 'deterministic' | 'broad' | 'live';
  workload: string;
  observedState: 'Not Green' | 'Evidence Gap';
  qualificationStatus: SweepQualificationStatus;
  failureClass: FailureClass;
  code?: string;
  message?: string;
  tool?: Readonly<{ name: string; callId?: string }>;
  validation?: Readonly<{ id: string; callId?: string }>;
  provider?: Readonly<{ attempts?: number; rounds?: number; inputTokens?: number | null; outputTokens?: number | null }>;
  toolCount?: number;
  profile?: Readonly<{ selected?: string; promotions?: readonly string[] }>;
  taskState?: TaskStateProjection;
  stackState?: StackStateProjection;
  hiddenAcceptance?: 'passed' | 'failed' | 'not_run';
  interventions?: number;
  exhausted?: boolean;
  classification: FailureLedgerClassification;
  evidence?: readonly Readonly<{ path: string; sha256: string }>[];
  repairCluster: FailureRepairCluster;
}>;

export type FailureLedgerEntry = Readonly<{
  identity: string;
  layer: FailureLedgerEntryInput['layer'];
  workload: string;
  observedState: FailureLedgerEntryInput['observedState'];
  qualificationStatus: SweepQualificationStatus;
  failureClass: FailureClass;
  code?: string;
  message?: string;
  tool?: Readonly<{ name: string; callId?: string }>;
  validation?: Readonly<{ id: string; callId?: string }>;
  provider?: Readonly<{ attempts?: number; rounds?: number; inputTokens?: number | null; outputTokens?: number | null }>;
  toolCount?: number;
  profile?: Readonly<{ selected?: string; promotions?: readonly string[] }>;
  taskState?: Readonly<{ fingerprint: string; status: string; currentWorkUnit?: string }>;
  stackState?: Readonly<{ fingerprint: string; status: string; currentTaskOrdinal?: number }>;
  hiddenAcceptance?: FailureLedgerEntryInput['hiddenAcceptance'];
  interventions?: number;
  exhausted?: boolean;
  classification: FailureLedgerClassification;
  evidence?: readonly Readonly<{ path: string; sha256: string }>[];
  repairCluster: FailureRepairCluster;
}>;

export type FailureLedger = Readonly<{ schemaVersion: 1; entries: readonly FailureLedgerEntry[] }>;

const SHA256 = /^[0-9a-f]{64}$/;

function boundedRequired(value: string, label: string, maximum: number): string {
  if (typeof value !== 'string' || value.length === 0 || value.includes('\0') || Buffer.byteLength(value, 'utf8') > maximum) throw new Error(`${label} is missing or unbounded.`);
  return value;
}

function boundedDiagnostic(value: string, maximum: number): string {
  return sanitizeTaskEvidence(value, maximum).text;
}

function count(value: number | undefined, label: string): number | undefined {
  if (value === undefined) return undefined;
  if (!Number.isSafeInteger(value) || value < 0) throw new Error(`${label} must be a non-negative safe integer.`);
  return value;
}

function tokenCount(value: number | null | undefined, label: string): number | null | undefined {
  return value === null ? null : count(value, label);
}

function oneOf<const T extends string>(value: T, allowed: readonly T[], label: string): T {
  if (!allowed.includes(value)) throw new Error(`${label} is invalid.`);
  return value;
}

export function normalizeFailureLedger(entries: readonly FailureLedgerEntryInput[]): FailureLedger {
  if (entries.length > 1_000) throw new Error('Failure ledger exceeds 1000 entries.');
  const identities = new Set<string>();
  const normalized = entries.map((entry): FailureLedgerEntry => {
    const identity = boundedRequired(entry.identity, 'Failure identity', 512);
    if (identities.has(identity)) throw new Error(`Duplicate failure identity: ${identity}.`);
    identities.add(identity);
    if (entry.exhausted !== undefined && typeof entry.exhausted !== 'boolean') throw new Error('Exhaustion flag is invalid.');
    if ((entry.evidence?.length ?? 0) > 32) throw new Error(`Failure evidence exceeds 32 references: ${identity}.`);
    const evidence = entry.evidence?.map((item) => {
      const path = boundedRequired(item.path, 'Evidence path', 1024);
      if (!SHA256.test(item.sha256)) throw new Error(`Evidence digest is invalid: ${path}.`);
      return Object.freeze({ path, sha256: item.sha256 });
    });
    if ((entry.profile?.promotions?.length ?? 0) > 8) throw new Error(`Profile promotions exceed 8 entries: ${identity}.`);
    const promotions = entry.profile?.promotions?.map((item) => boundedRequired(item, 'Profile promotion', 256));
    const provider = entry.provider === undefined ? undefined : Object.freeze({
      ...(count(entry.provider.attempts, 'Provider attempts') === undefined ? {} : { attempts: entry.provider.attempts }),
      ...(count(entry.provider.rounds, 'Provider rounds') === undefined ? {} : { rounds: entry.provider.rounds }),
      ...(tokenCount(entry.provider.inputTokens, 'Provider input tokens') === undefined ? {} : { inputTokens: entry.provider.inputTokens }),
      ...(tokenCount(entry.provider.outputTokens, 'Provider output tokens') === undefined ? {} : { outputTokens: entry.provider.outputTokens }),
    });
    return Object.freeze({
      identity,
      layer: oneOf(entry.layer, ['deterministic', 'broad', 'live'], 'Failure layer'),
      workload: boundedRequired(entry.workload, 'Failure workload', 512),
      observedState: oneOf(entry.observedState, ['Not Green', 'Evidence Gap'], 'Observed state'),
      qualificationStatus: oneOf(entry.qualificationStatus, ['qualifying', 'diagnostic-only', 'not-run'], 'Qualification status'),
      failureClass: oneOf(entry.failureClass, ['provider', 'turn', 'tool', 'validation', 'harness', 'observer', 'test', 'environment', 'evidence', 'unknown'], 'Failure class'),
      ...(entry.code === undefined ? {} : { code: boundedDiagnostic(entry.code, 128) }),
      ...(entry.message === undefined ? {} : { message: boundedDiagnostic(entry.message, 1024) }),
      ...(entry.tool === undefined ? {} : { tool: Object.freeze({ name: boundedRequired(entry.tool.name, 'Tool name', 128), ...(entry.tool.callId === undefined ? {} : { callId: boundedRequired(entry.tool.callId, 'Tool call ID', 256) }) }) }),
      ...(entry.validation === undefined ? {} : { validation: Object.freeze({ id: boundedRequired(entry.validation.id, 'Validation ID', 128), ...(entry.validation.callId === undefined ? {} : { callId: boundedRequired(entry.validation.callId, 'Validation call ID', 256) }) }) }),
      ...(provider === undefined ? {} : { provider }),
      ...(count(entry.toolCount, 'Tool count') === undefined ? {} : { toolCount: entry.toolCount }),
      ...(entry.profile === undefined ? {} : { profile: Object.freeze({ ...(entry.profile.selected === undefined ? {} : { selected: boundedRequired(entry.profile.selected, 'Selected profile', 256) }), ...(promotions === undefined ? {} : { promotions: Object.freeze(promotions) }) }) }),
      ...(entry.taskState === undefined ? {} : { taskState: Object.freeze({ fingerprint: boundedRequired(entry.taskState.fingerprint, 'Task fingerprint', 128), status: oneOf(entry.taskState.status, ['pending', 'in_progress', 'blocked', 'planning_needed', 'cancelled', 'budget_exhausted', 'completed', 'failed'], 'Task status'), ...(entry.taskState.currentWorkUnit === undefined ? {} : { currentWorkUnit: entry.taskState.currentWorkUnit }) }) }),
      ...(entry.stackState === undefined ? {} : { stackState: Object.freeze({ fingerprint: boundedRequired(entry.stackState.fingerprint, 'Stack fingerprint', 128), status: oneOf(entry.stackState.status, ['pending', 'in_progress', 'blocked', 'planning_needed', 'cancelled', 'budget_exhausted', 'completed', 'failed'], 'Stack status'), ...(entry.stackState.currentTaskOrdinal === undefined ? {} : { currentTaskOrdinal: count(entry.stackState.currentTaskOrdinal, 'Current task ordinal')! }) }) }),
      ...(entry.hiddenAcceptance === undefined ? {} : { hiddenAcceptance: oneOf(entry.hiddenAcceptance, ['passed', 'failed', 'not_run'], 'Hidden acceptance') }),
      ...(count(entry.interventions, 'Interventions') === undefined ? {} : { interventions: entry.interventions }),
      ...(entry.exhausted === undefined ? {} : { exhausted: entry.exhausted === true }),
      classification: oneOf(entry.classification, ['new', 'retained', 'intermittent', 'environment-only', 'unresolved'], 'Failure classification'),
      ...(evidence === undefined ? {} : { evidence: Object.freeze(evidence) }),
      repairCluster: oneOf(entry.repairCluster, ['agent-provider-context', 'ui-test-stability', 'environment-only', 'unresolved'], 'Repair cluster'),
    });
  });
  normalized.sort((left, right) => left.identity.localeCompare(right.identity));
  return Object.freeze({ schemaVersion: 1, entries: Object.freeze(normalized) });
}
