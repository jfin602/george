import { GeorgeError, asGeorgeError } from './errors.ts';

/** A deliberately small, provider- and presentation-independent observer contract. */
export const HOOK_EVENTS = [
  'session.started', 'session.reopened', 'session.ended', 'turn.started', 'input.submitted',
  'context.assembled', 'provider.requested', 'provider.responded', 'tool.before', 'tool.after', 'turn.completed',
] as const;
export type HookEventName = typeof HOOK_EVENTS[number];

export type HookEvent = Readonly<{
  name: HookEventName;
  sessionId: string;
  turnId?: string;
  runId?: string;
  operation?: Readonly<{ callId: string; name: string; hookId?: string }>;
  provider?: Readonly<{ responseId?: string; completed: boolean; hadToolCalls: boolean }>;
  configuration?: Readonly<Record<string, string | number | boolean | null>>;
}>;

export type HookOutput = Readonly<{ message?: string }>;
export type HookContext = Readonly<{ signal?: AbortSignal }>;
export type InProcessHook = Readonly<{ kind: 'in-process'; run: (event: Readonly<HookEvent>, context: HookContext) => Promise<HookOutput | void> | HookOutput | void }>;
export type ProcessHook = Readonly<{ kind: 'process'; executable: string; arguments?: readonly string[]; cwd?: string; timeoutMs?: number }>;
export type HookRegistration = Readonly<{
  id: string;
  event: HookEventName;
  priority?: number;
  enabled?: boolean;
  configuration?: Readonly<Record<string, string | number | boolean | null>>;
} & (InProcessHook | ProcessHook)>;

export type HookInvocation = Readonly<{
  id: string;
  event: HookEventName;
  status: 'started' | 'succeeded' | 'failed' | 'timed_out' | 'cancelled';
  message?: string;
}>;

export type ProcessHookRunner = (hook: ProcessHook & Pick<HookRegistration, 'id'>, input: string, signal?: AbortSignal) => Promise<Readonly<{ outcome: 'completed' | 'failed' | 'timed_out'; stdout: string }>>;
type StoredHook = (InProcessHook | ProcessHook) & Omit<HookRegistration, 'kind' | 'enabled'> & { enabled: boolean; order: number };

const MAX_EVENT_BYTES = 8 * 1024;
const MAX_OUTPUT_BYTES = 4 * 1024;

function bounded(value: string, limit: number, name: string): string {
  if (value.includes('\0') || Buffer.byteLength(value, 'utf8') > limit) throw new GeorgeError('configuration', `${name} must be bounded text.`);
  return value;
}

function validate(registration: HookRegistration): HookRegistration {
  if (!/^[A-Za-z0-9][A-Za-z0-9_.-]{0,127}$/.test(registration.id)) throw new GeorgeError('configuration', 'Hook ID is unsafe.');
  if (!HOOK_EVENTS.includes(registration.event)) throw new GeorgeError('configuration', 'Hook event is invalid.');
  if (registration.priority !== undefined && (!Number.isInteger(registration.priority) || registration.priority < -1_000 || registration.priority > 1_000)) throw new GeorgeError('configuration', 'Hook priority is invalid.');
  JSON.stringify(registration.configuration ?? {}); // rejects nothing useful, but makes the size check deterministic.
  bounded(JSON.stringify(registration.configuration ?? {}), MAX_OUTPUT_BYTES, 'Hook configuration');
  if (registration.kind === 'process') {
    bounded(registration.executable, 1024, 'Hook executable');
    if (!registration.executable) throw new GeorgeError('configuration', 'Hook executable is required.');
    if ((registration.arguments?.length ?? 0) > 64 || registration.arguments?.some((item) => !item || bounded(item, 8192, 'Hook argument') !== item)) throw new GeorgeError('configuration', 'Hook arguments are invalid.');
    if (registration.timeoutMs !== undefined && (!Number.isInteger(registration.timeoutMs) || registration.timeoutMs < 1 || registration.timeoutMs > 120_000)) throw new GeorgeError('configuration', 'Hook timeout is invalid.');
  }
  return registration;
}

function output(value: unknown): HookOutput | undefined {
  if (value === undefined) return undefined;
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).some((key) => key !== 'message')) throw new GeorgeError('validation', 'Hook output must be an object with an optional message.');
  const message = (value as { message?: unknown }).message;
  if (message === undefined) return {};
  if (typeof message !== 'string') throw new GeorgeError('validation', 'Hook output message must be text.');
  return { message: bounded(message, MAX_OUTPUT_BYTES, 'Hook output') };
}

function processOutput(stdout: string): HookOutput | undefined {
  bounded(stdout, MAX_OUTPUT_BYTES, 'Hook process output');
  if (!stdout.trim()) return undefined;
  try { return output(JSON.parse(stdout)); }
  catch (error) { throw new GeorgeError('validation', `Malformed hook output: ${asGeorgeError(error, 'validation').message}`); }
}

/** Registration is explicit. Failure is isolated: invocations are evidence, never control flow. */
export class HookRegistry {
  private readonly registrations: StoredHook[] = [];

  register(registration: HookRegistration): void {
    const valid = validate(registration);
    if (this.registrations.some((item) => item.id === valid.id)) throw new GeorgeError('configuration', `Duplicate hook ID: ${valid.id}.`);
    this.registrations.push({ ...valid, enabled: valid.enabled !== false, order: this.registrations.length } as StoredHook);
  }

  setEnabled(id: string, enabled: boolean): void {
    const hook = this.registrations.find((item) => item.id === id);
    if (!hook) throw new GeorgeError('configuration', `Unknown hook ID: ${id}.`);
    hook.enabled = enabled;
  }

  list(): readonly Readonly<Pick<HookRegistration, 'id' | 'event' | 'priority' | 'enabled'>>[] {
    return this.registrations.map(({ id, event, priority, enabled }) => ({ id, event, priority: priority ?? 0, enabled: enabled !== false }));
  }

  async dispatch(event: Omit<HookEvent, 'configuration'>, runner?: ProcessHookRunner, signal?: AbortSignal, observe?: (invocation: HookInvocation) => void): Promise<readonly HookInvocation[]> {
    const selected = this.registrations.filter((hook) => hook.event === event.name && hook.enabled !== false)
      .sort((left, right) => (left.priority ?? 0) - (right.priority ?? 0) || left.order - right.order);
    const results: HookInvocation[] = [];
    for (const hook of selected) {
      const start: HookInvocation = { id: hook.id, event: event.name, status: 'started' };
      observe?.(start);
      let result: HookInvocation;
      try {
        if (signal?.aborted) throw new GeorgeError('cancelled', 'Hook execution cancelled.');
        const input = JSON.stringify({ ...event, configuration: hook.configuration ?? {} });
        bounded(input, MAX_EVENT_BYTES, 'Hook event input');
        const value = hook.kind === 'in-process'
          ? await hook.run(Object.freeze(JSON.parse(input)) as HookEvent, { signal })
          : runner === undefined ? Promise.reject(new GeorgeError('configuration', 'Process hook runner is unavailable.')) : await runner(hook, input, signal);
        const parsed = hook.kind === 'process'
          ? processOutput((value as { stdout: string; outcome: 'completed' | 'failed' | 'timed_out' }).stdout)
          : output(value);
        const process = hook.kind === 'process' ? value as { outcome: 'completed' | 'failed' | 'timed_out' } : undefined;
        result = process?.outcome === 'timed_out' ? { id: hook.id, event: event.name, status: 'timed_out' }
          : process?.outcome === 'failed' ? { id: hook.id, event: event.name, status: 'failed' }
          : { id: hook.id, event: event.name, status: 'succeeded', ...(parsed?.message === undefined ? {} : { message: parsed.message }) };
      } catch (error) {
        const normalized = asGeorgeError(error);
        result = { id: hook.id, event: event.name, status: normalized.code === 'cancelled' ? 'cancelled' : 'failed', message: normalized.message.slice(0, 512) };
      }
      observe?.(result);
      results.push(result);
    }
    return results;
  }
}
