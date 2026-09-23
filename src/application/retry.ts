import { cancellationError, GeorgeError } from '../core/index.ts';

/** Small, application-owned policy for the only replay-safe retry class in Phase 5. */
export type ProviderRetryPolicy = Readonly<{
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
}>;

export type RetrySleeper = (delayMs: number, signal?: AbortSignal) => Promise<void>;

export const DEFAULT_PROVIDER_RETRY_POLICY: ProviderRetryPolicy = {
  maxRetries: 2,
  initialDelayMs: 100,
  maxDelayMs: 1_000,
};

export function validateProviderRetryPolicy(value: ProviderRetryPolicy): ProviderRetryPolicy {
  if (!Number.isInteger(value.maxRetries) || value.maxRetries < 0 || value.maxRetries > 32
    || !Number.isInteger(value.initialDelayMs) || value.initialDelayMs < 0 || value.initialDelayMs > 60_000
    || !Number.isInteger(value.maxDelayMs) || value.maxDelayMs < value.initialDelayMs || value.maxDelayMs > 60_000) {
    throw new GeorgeError('configuration', 'Provider retry policy must use bounded integer retries and delays.');
  }
  return value;
}

export function retryDelay(policy: ProviderRetryPolicy, retry: number): number {
  return Math.min(policy.maxDelayMs, policy.initialDelayMs * 2 ** (retry - 1));
}

/** Default backoff observes cancellation without leaving a timer behind. */
export const sleepForRetry: RetrySleeper = (delayMs, signal) => new Promise((resolve, reject) => {
  const cancelled = signal === undefined ? undefined : cancellationError(signal);
  if (cancelled) { reject(cancelled); return; }
  const timer = setTimeout(done, delayMs);
  signal?.addEventListener('abort', abort, { once: true });
  function done(): void { signal?.removeEventListener('abort', abort); resolve(); }
  function abort(): void { clearTimeout(timer); reject((signal === undefined ? undefined : cancellationError(signal)) ?? new GeorgeError('cancelled', 'Operation cancelled.')); }
});
