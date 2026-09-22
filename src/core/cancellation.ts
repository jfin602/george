import { GeorgeError } from './errors.ts';

export type Cancellation = Readonly<{
  signal: AbortSignal;
  cancel: (message?: string) => void;
}>;

export function createCancellation(): Cancellation {
  const controller = new AbortController();
  return {
    signal: controller.signal,
    cancel(message = 'Operation cancelled') {
      controller.abort(new GeorgeError('cancelled', message));
    },
  };
}

export function cancellationError(signal: AbortSignal): GeorgeError | undefined {
  if (!signal.aborted) return undefined;
  return signal.reason instanceof GeorgeError
    ? signal.reason
    : new GeorgeError('cancelled', 'Operation cancelled', { cause: signal.reason });
}
