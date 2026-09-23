import { GeorgeError } from './errors.ts';

/** Application-owned per-run ceilings. These are deliberately generous so the Phase-4 path stays unchanged. */
export type RunBudgetConfig = Readonly<{
  providerAttempts: number;
  toolExecutions: number;
  retryAttempts: number;
  compactionAttempts: number;
  compactionCheckpoints: number;
  processExecutions: number;
  processRuntimeMs: number;
  wallClockMs: number;
  contextTokens: number;
  providerInputTokens: number;
  providerOutputTokens: number;
  softLimitPercent: number;
}>;

export type RunBudgetDimension = Exclude<keyof RunBudgetConfig, 'softLimitPercent'>;
export type RunBudgetSnapshot = Readonly<{
  runId: string;
  limits: Omit<RunBudgetConfig, 'softLimitPercent'>;
  consumed: Readonly<Record<RunBudgetDimension, number>>;
  elapsedMs: number;
}>;

export type RunBudgetDecision = Readonly<{
  snapshot: RunBudgetSnapshot;
  pressure: readonly RunBudgetDimension[];
  exhausted?: RunBudgetDimension;
}>;

export type RunBudgetClock = () => number;

export const DEFAULT_RUN_BUDGET: RunBudgetConfig = {
  providerAttempts: 128,
  toolExecutions: 128,
  retryAttempts: 32,
  compactionAttempts: 32,
  compactionCheckpoints: 32,
  processExecutions: 64,
  processRuntimeMs: 60 * 60 * 1000,
  wallClockMs: 60 * 60 * 1000,
  contextTokens: 1_000_000,
  providerInputTokens: 1_000_000,
  providerOutputTokens: 1_000_000,
  softLimitPercent: 80,
};

const DIMENSIONS: readonly RunBudgetDimension[] = [
  'providerAttempts', 'toolExecutions', 'retryAttempts', 'compactionAttempts', 'compactionCheckpoints',
  'processExecutions', 'processRuntimeMs', 'wallClockMs', 'contextTokens', 'providerInputTokens', 'providerOutputTokens',
];

export function validateRunBudget(value: RunBudgetConfig): RunBudgetConfig {
  const result = {} as Record<keyof RunBudgetConfig, number>;
  for (const key of DIMENSIONS) {
    const amount = value[key];
    if (!Number.isInteger(amount) || amount < 1) throw new GeorgeError('configuration', `Run budget ${key} must be a finite positive integer.`);
    result[key] = amount;
  }
  if (!Number.isInteger(value.softLimitPercent) || value.softLimitPercent < 1 || value.softLimitPercent >= 100) {
    throw new GeorgeError('configuration', 'Run budget softLimitPercent must be an integer between 1 and 99.');
  }
  result.softLimitPercent = value.softLimitPercent;
  return result as RunBudgetConfig;
}

export class RunBudget {
  readonly id: string;
  private readonly limits: Omit<RunBudgetConfig, 'softLimitPercent'>;
  private readonly softLimitPercent: number;
  private readonly clock: RunBudgetClock;
  private readonly startedAt: number;
  private readonly consumed: Record<RunBudgetDimension, number>;
  private readonly pressured = new Set<RunBudgetDimension>();

  constructor(id: string, configured: RunBudgetConfig = DEFAULT_RUN_BUDGET, clock: RunBudgetClock = Date.now) {
    if (!/^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/.test(id)) throw new GeorgeError('configuration', 'Run budget ID is unsafe.');
    const budget = validateRunBudget(configured);
    this.id = id;
    this.limits = Object.fromEntries(DIMENSIONS.map((key) => [key, budget[key]])) as Omit<RunBudgetConfig, 'softLimitPercent'>;
    this.softLimitPercent = budget.softLimitPercent;
    this.clock = clock;
    this.startedAt = this.now();
    this.consumed = Object.fromEntries(DIMENSIONS.map((key) => [key, 0])) as Record<RunBudgetDimension, number>;
  }

  snapshot(): RunBudgetSnapshot {
    const elapsedMs = Math.max(this.consumed.wallClockMs, Math.max(0, this.now() - this.startedAt));
    return { runId: this.id, limits: { ...this.limits }, consumed: { ...this.consumed, wallClockMs: elapsedMs }, elapsedMs };
  }

  consume(dimension: RunBudgetDimension, amount = 1): RunBudgetDecision {
    if (!Number.isInteger(amount) || amount < 0) throw new GeorgeError('configuration', `Run budget consumption for ${dimension} must be a non-negative integer.`);
    const snapshot = this.snapshot();
    if (snapshot.consumed.wallClockMs > snapshot.limits.wallClockMs) return { snapshot, pressure: [], exhausted: 'wallClockMs' };
    if (amount > snapshot.limits[dimension] - snapshot.consumed[dimension]) return { snapshot, pressure: [], exhausted: dimension };
    this.consumed[dimension] += amount;
    const next = this.snapshot();
    const pressure = DIMENSIONS.filter((key) => next.consumed[key] * 100 >= next.limits[key] * this.softLimitPercent && !this.pressured.has(key));
    for (const key of pressure) this.pressured.add(key);
    return { snapshot: next, pressure };
  }

  private now(): number {
    const value = this.clock();
    if (!Number.isFinite(value)) throw new GeorgeError('configuration', 'Run budget clock must return a finite timestamp.');
    return value;
  }
}
