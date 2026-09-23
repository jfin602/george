import type { ApplicationEvent, ProviderUsage, RunBudgetDimension } from '../core/index.ts';

const MAX_TOOL_NAMES = 8;
const MAX_ERROR_BYTES = 480;
const SAFE_TOOL_NAME = /^[A-Za-z][A-Za-z0-9_-]{0,63}$/;

type SafeError = Readonly<{ code: string; message: string }>;

export type LmStudioSmokeDiagnostic = Readonly<{
  classification: 'success' | 'completed-without-tool' | 'tool-failed' | 'provider-failed-before-response-retry-exhausted' | 'provider-failed-after-response-start' | 'turn-failed-after-successful-tool' | 'budget-exhausted' | 'cancelled' | 'provider-or-tool-activity-without-terminal-turn' | 'turn-failed' | 'smoke-did-not-complete';
  completed: boolean;
  failed: boolean;
  cancelled: boolean;
  providerResponseStarted: boolean;
  providerTextEmitted: boolean;
  providerError: boolean;
  toolRequested: boolean;
  requestedTools: readonly string[];
  toolStarted: boolean;
  toolCompleted: boolean;
  toolFailed: boolean;
  providerAttempts: number;
  retriesScheduled: number;
  retryExhausted: boolean;
  budgetPressure: readonly RunBudgetDimension[];
  budgetExhausted?: RunBudgetDimension;
  toolFailure?: SafeError;
  finalError?: SafeError;
  usage?: ProviderUsage;
  elapsedMs: number;
}>;

function bounded(value: string, limit = MAX_ERROR_BYTES): string {
  const normalized = value.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim();
  return Buffer.byteLength(normalized, 'utf8') <= limit
    ? normalized
    : `${Buffer.from(normalized, 'utf8').subarray(0, limit - 3).toString('utf8')}...`;
}

function safeError(error: SafeError): SafeError {
  return { code: bounded(error.code, 128), message: bounded(error.message) };
}

/** Bounded, redacted summary of authoritative application events for the live smoke only. */
export function diagnoseLmStudioToolCycle(events: readonly ApplicationEvent[], elapsedMs: number): LmStudioSmokeDiagnostic {
  let completed = false;
  let failed = false;
  let cancelled = false;
  let providerResponseStarted = false;
  let providerTextEmitted = false;
  let providerError = false;
  let toolRequested = false;
  let toolStarted = false;
  let toolCompleted = false;
  let toolFailed = false;
  let providerAttempts = 0;
  let retriesScheduled = 0;
  let retryExhausted = false;
  let toolFailure: SafeError | undefined;
  let finalError: SafeError | undefined;
  let usage: ProviderUsage | undefined;
  let budgetExhausted: RunBudgetDimension | undefined;
  let readFileCompleted = false;
  let onlyReadFileRequested = true;
  const requestedTools: string[] = [];
  const budgetPressure = new Set<RunBudgetDimension>();

  for (const event of events) {
    switch (event.type) {
      case 'provider.attempt.started': providerAttempts += 1; break;
      case 'provider.response.started': providerResponseStarted = true; break;
      case 'provider.text.delta': providerTextEmitted = true; break;
      case 'provider.error': providerError = true; break;
      case 'provider.tool.call':
        toolRequested = true;
        if (event.name !== 'read_file') onlyReadFileRequested = false;
        if (SAFE_TOOL_NAME.test(event.name) && requestedTools.length < MAX_TOOL_NAMES && !requestedTools.includes(event.name)) requestedTools.push(event.name);
        break;
      case 'provider.response.completed': usage = event.usage ?? usage; break;
      case 'provider.retry.scheduled': retriesScheduled += 1; break;
      case 'provider.retry.exhausted': retryExhausted = true; break;
      case 'budget.pressure': for (const dimension of event.dimensions) budgetPressure.add(dimension); break;
      case 'budget.exhausted': budgetExhausted = event.dimension; break;
      case 'tool.started': toolStarted = true; break;
      case 'tool.completed':
        toolCompleted = true;
        if (event.name === 'read_file') readFileCompleted = true;
        break;
      case 'tool.failed':
        toolFailed = true;
        toolFailure ??= safeError(event.result.error);
        break;
      case 'turn.completed': completed = true; break;
      case 'turn.failed': failed = true; finalError = safeError(event.error); break;
      case 'turn.cancelled': cancelled = true; finalError = safeError(event.error); break;
      default: break;
    }
  }

  const classification = completed && toolRequested && readFileCompleted && onlyReadFileRequested
    ? 'success'
    : cancelled
      ? 'cancelled'
      : budgetExhausted !== undefined || finalError?.code === 'budget'
        ? 'budget-exhausted'
        : completed
          ? 'completed-without-tool'
          : toolFailed
            ? 'tool-failed'
            : toolCompleted && failed
              ? 'turn-failed-after-successful-tool'
              : retryExhausted && !providerResponseStarted && !providerTextEmitted && !toolRequested
                ? 'provider-failed-before-response-retry-exhausted'
                : failed && finalError?.code === 'provider' && (providerResponseStarted || providerTextEmitted || toolRequested)
                  ? 'provider-failed-after-response-start'
                  : !completed && !failed && !cancelled && (providerAttempts > 0 || providerError || toolRequested || toolStarted || toolCompleted || toolFailed)
                    ? 'provider-or-tool-activity-without-terminal-turn'
                    : failed
                      ? 'turn-failed'
                      : 'smoke-did-not-complete';

  return {
    classification, completed, failed, cancelled, providerResponseStarted, providerTextEmitted, providerError,
    toolRequested, requestedTools, toolStarted, toolCompleted, toolFailed, providerAttempts,
    retriesScheduled, retryExhausted, budgetPressure: [...budgetPressure],
    ...(budgetExhausted === undefined ? {} : { budgetExhausted }),
    ...(toolFailure === undefined ? {} : { toolFailure }),
    ...(finalError === undefined ? {} : { finalError }),
    ...(usage === undefined ? {} : { usage }),
    elapsedMs: Math.max(0, Math.round(elapsedMs)),
  };
}
