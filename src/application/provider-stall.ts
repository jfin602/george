import { DEFAULT_PROVIDER_TIMEOUT_MS, GeorgeError, type ProviderStallPhase } from '../core/index.ts';

export type ProviderStallPolicy = Readonly<{
  suspectedInactivityMs: number;
  firstEvidenceTimeoutMs: number;
  activeInactivityTimeoutMs: number;
  compactionTimeoutMs: number;
  maxFreshRetries: number;
  maxRebases: number;
}>;

export const DEFAULT_PROVIDER_STALL_POLICY: ProviderStallPolicy = Object.freeze({
  suspectedInactivityMs: 60_000,
  firstEvidenceTimeoutMs: 90_000,
  activeInactivityTimeoutMs: 60_000,
  compactionTimeoutMs: 30_000,
  maxFreshRetries: 1,
  maxRebases: 1,
});

export function validateProviderStallPolicy(value: ProviderStallPolicy): ProviderStallPolicy {
  const boundedMs = (item: number) => Number.isInteger(item) && item >= 1 && item < DEFAULT_PROVIDER_TIMEOUT_MS;
  if (!boundedMs(value.suspectedInactivityMs)
    || !boundedMs(value.firstEvidenceTimeoutMs)
    || !boundedMs(value.activeInactivityTimeoutMs)
    || !boundedMs(value.compactionTimeoutMs)
    || value.suspectedInactivityMs > value.firstEvidenceTimeoutMs
    || value.suspectedInactivityMs > value.activeInactivityTimeoutMs
    || !Number.isInteger(value.maxFreshRetries) || value.maxFreshRetries < 0 || value.maxFreshRetries > 1
    || !Number.isInteger(value.maxRebases) || value.maxRebases < 0 || value.maxRebases > 1) {
    throw new GeorgeError('configuration', `Provider stall policy must use bounded thresholds below ${DEFAULT_PROVIDER_TIMEOUT_MS} ms and at most one retry/rebase.`);
  }
  return Object.freeze({ ...value });
}

export type ProviderStallScheduler = Readonly<{
  now(): number;
  setTimeout(callback: () => void, delayMs: number): unknown;
  clearTimeout(handle: unknown): void;
}>;

export const providerStallScheduler: ProviderStallScheduler = {
  now: Date.now,
  setTimeout: (callback, delayMs) => setTimeout(callback, delayMs),
  clearTimeout: (handle) => clearTimeout(handle as ReturnType<typeof setTimeout>),
};

export type ProviderStallNotice = Readonly<{
  kind: 'suspected' | 'stalled';
  phase: Exclude<ProviderStallPhase, 'response_completed'>;
  inactivityMs: number;
}>;

type Waiter = { resolve: (notice: ProviderStallNotice) => void };

/** Attempt-scoped inactivity controller. It owns no retry or rebase policy. */
export class ProviderAttemptWatchdog {
  readonly controller = new AbortController();
  private readonly policy: ProviderStallPolicy;
  private readonly scheduler: ProviderStallScheduler;
  private phase: ProviderStallPhase = 'awaiting_first_evidence';
  private lastActivityAt: number;
  private generation = 0;
  private timers: unknown[] = [];
  private notices: ProviderStallNotice[] = [];
  private waiters = new Set<Waiter>();

  constructor(
    policy: ProviderStallPolicy,
    scheduler: ProviderStallScheduler,
  ) {
    this.policy = policy;
    this.scheduler = scheduler;
    this.lastActivityAt = scheduler.now();
    this.arm();
  }

  get stalled(): boolean { return this.controller.signal.aborted && this.phase !== 'response_completed'; }

  activity(): void {
    if (this.controller.signal.aborted || this.phase === 'response_completed') return;
    this.phase = 'response_active';
    this.lastActivityAt = this.scheduler.now();
    this.arm();
  }

  complete(): void {
    this.phase = 'response_completed';
    this.clearTimers();
  }

  wait(): Readonly<{ promise: Promise<ProviderStallNotice>; cancel(): void }> {
    const notice = this.notices.shift();
    if (notice) return { promise: Promise.resolve(notice), cancel() {} };
    let waiter!: Waiter;
    const promise = new Promise<ProviderStallNotice>((resolve) => { waiter = { resolve }; this.waiters.add(waiter); });
    return { promise, cancel: () => this.waiters.delete(waiter) };
  }

  stop(): void {
    this.generation += 1;
    this.clearTimers();
    this.notices = [];
    this.waiters.clear();
  }

  error(notice?: ProviderStallNotice): GeorgeError {
    const phase = notice?.phase ?? (this.phase === 'response_completed' ? 'response_active' : this.phase);
    const inactivityMs = notice?.inactivityMs ?? Math.max(0, this.scheduler.now() - this.lastActivityAt);
    return new GeorgeError('provider', `Provider stalled while ${phase === 'awaiting_first_evidence' ? 'awaiting first evidence' : 'the response was active'} after ${inactivityMs} ms of inactivity.`, {
      cause: { kind: 'stall', phase, inactivityMs },
    });
  }

  private arm(): void {
    this.generation += 1;
    this.clearTimers();
    const generation = this.generation;
    const phase = this.phase as Exclude<ProviderStallPhase, 'response_completed'>;
    const recoveryMs = phase === 'awaiting_first_evidence' ? this.policy.firstEvidenceTimeoutMs : this.policy.activeInactivityTimeoutMs;
    this.timers.push(this.scheduler.setTimeout(() => {
      if (generation === this.generation) this.publish({ kind: 'suspected', phase, inactivityMs: Math.max(0, this.scheduler.now() - this.lastActivityAt) });
    }, this.policy.suspectedInactivityMs));
    this.timers.push(this.scheduler.setTimeout(() => {
      if (generation !== this.generation) return;
      const notice = { kind: 'stalled', phase, inactivityMs: Math.max(0, this.scheduler.now() - this.lastActivityAt) } as const;
      this.controller.abort(this.error(notice));
      this.publish(notice);
    }, recoveryMs));
  }

  private publish(notice: ProviderStallNotice): void {
    const waiter = this.waiters.values().next().value as Waiter | undefined;
    if (waiter) { this.waiters.delete(waiter); waiter.resolve(notice); }
    else this.notices.push(notice);
  }

  private clearTimers(): void {
    for (const timer of this.timers) this.scheduler.clearTimeout(timer);
    this.timers = [];
  }
}
