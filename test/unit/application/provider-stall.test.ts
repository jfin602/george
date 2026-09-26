import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import {
  DEFAULT_CONTEXT_PROFILE,
  DEFAULT_PROVIDER_TIMEOUT_MS,
  DEFAULT_RUN_BUDGET,
  GeorgeError,
  createSession,
  type ContextProfile,
  type ModelProvider,
  type ProviderEvent,
  type ProviderRequest,
  type ProviderStreamOptions,
} from '../../../src/core/index.ts';
import {
  DEFAULT_PROVIDER_STALL_POLICY,
  ProviderAttemptWatchdog,
  createOneTurnApplicationService,
  validateProviderStallPolicy,
  type ProviderStallScheduler,
} from '../../../src/application/index.ts';
import type { ContextCompactor } from '../../../src/context/index.ts';
import type { ToolDefinition } from '../../../src/tools/index.ts';

const POLICY = validateProviderStallPolicy({
  suspectedInactivityMs: 5,
  firstEvidenceTimeoutMs: 10,
  activeInactivityTimeoutMs: 5,
  compactionTimeoutMs: 4,
  maxFreshRetries: 1,
  maxRebases: 1,
});

class FakeScheduler implements ProviderStallScheduler {
  time = 0;
  private id = 0;
  private readonly tasks = new Map<number, { due: number; callback: () => void }>();
  now = (): number => this.time;
  setTimeout = (callback: () => void, delayMs: number): number => {
    const id = ++this.id;
    this.tasks.set(id, { due: this.time + delayMs, callback });
    return id;
  };
  clearTimeout = (handle: unknown): void => { this.tasks.delete(handle as number); };
  advance(ms: number): void {
    const target = this.time + ms;
    for (;;) {
      const next = [...this.tasks].filter(([, task]) => task.due <= target).sort((left, right) => left[1].due - right[1].due || left[0] - right[0])[0];
      if (!next) break;
      this.time = next[1].due;
      this.tasks.delete(next[0]);
      next[1].callback();
    }
    this.time = target;
  }
  get pending(): number { return this.tasks.size; }
}

type Round = (request: ProviderRequest, options: ProviderStreamOptions) => AsyncGenerator<ProviderEvent>;

class ScriptedProvider implements ModelProvider {
  readonly calls: Array<{ request: ProviderRequest; options: ProviderStreamOptions }> = [];
  private readonly rounds: readonly Round[];
  constructor(rounds: readonly Round[]) { this.rounds = rounds; }
  async *stream(request: ProviderRequest, options: ProviderStreamOptions = {}): AsyncGenerator<ProviderEvent> {
    this.calls.push({ request, options });
    yield* this.rounds[this.calls.length - 1]!(request, options);
  }
}

async function* stall(options: ProviderStreamOptions, events: readonly ProviderEvent[] = []): AsyncGenerator<ProviderEvent> {
  yield* events;
  await new Promise<never>((_resolve, reject) => {
    const abort = () => reject(options.signal?.reason ?? new GeorgeError('cancelled', 'aborted'));
    if (options.signal?.aborted) abort();
    else options.signal?.addEventListener('abort', abort, { once: true });
  });
}

async function* completed(text = 'Recovered.'): AsyncGenerator<ProviderEvent> {
  yield { type: 'provider.response.started', responseId: 'complete' };
  yield { type: 'provider.text.delta', delta: text };
  yield { type: 'provider.response.completed' };
}

async function workspace(): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), 'george-stall-'));
  await writeFile(join(root, 'AGENTS.md'), 'Keep evidence authoritative.');
  return root;
}

async function collect<T>(source: AsyncIterable<T>): Promise<T[]> {
  const events: T[] = [];
  for await (const event of source) events.push(event);
  return events;
}

async function waitFor(predicate: () => boolean): Promise<void> {
  for (let count = 0; count < 500 && !predicate(); count += 1) await new Promise<void>((resolve) => setTimeout(resolve, 1));
  assert.equal(predicate(), true, 'condition did not become true');
}

test('stall policy keeps the 120000 ms absolute ceiling and watchdog activity owns clean attempt timers', async () => {
  assert.equal(DEFAULT_PROVIDER_TIMEOUT_MS, 120_000);
  assert.deepEqual(DEFAULT_PROVIDER_STALL_POLICY, {
    suspectedInactivityMs: 60_000, firstEvidenceTimeoutMs: 90_000, activeInactivityTimeoutMs: 60_000,
    compactionTimeoutMs: 30_000, maxFreshRetries: 1, maxRebases: 1,
  });
  assert.throws(() => validateProviderStallPolicy({ ...POLICY, firstEvidenceTimeoutMs: 120_000 }), /below 120000/);

  const scheduler = new FakeScheduler();
  const watchdog = new ProviderAttemptWatchdog(POLICY, scheduler);
  scheduler.advance(4); watchdog.activity();
  scheduler.advance(4); watchdog.activity();
  scheduler.advance(4);
  assert.equal(watchdog.controller.signal.aborted, false, 'bounded activity refreshes liveness');
  watchdog.complete(); watchdog.stop();
  assert.equal(scheduler.pending, 0);
  scheduler.advance(100);
  assert.equal(watchdog.controller.signal.aborted, false, 'a stale timer cannot abort a completed/later attempt');
});

test('provider activity heartbeats prevent a false application stall without becoming events', async (t) => {
  const root = await workspace();
  t.after(() => rm(root, { recursive: true, force: true }));
  const scheduler = new FakeScheduler();
  let pulse: (() => void) | undefined;
  let finish: (() => void) | undefined;
  const provider = new ScriptedProvider([async function* (_request, options) {
    pulse = options.onActivity;
    await new Promise<void>((resolve) => { finish = resolve; });
    yield { type: 'provider.response.completed' };
  }]);
  const service = await createOneTurnApplicationService({ provider, workspace: root, providerStallPolicy: POLICY, providerStallScheduler: scheduler });
  const pending = collect(service.run({ session: createSession({ workspace: root }), input: 'heartbeat' }));
  await waitFor(() => pulse !== undefined && finish !== undefined);
  for (let count = 0; count < 3; count += 1) { scheduler.advance(4); pulse!(); }
  finish!();
  const events = await pending;
  assert.equal(events.some((event) => event.type.startsWith('provider.stall.')), false);
  assert.equal(events.at(-1)?.type, 'turn.completed');
  assert.equal(scheduler.pending, 0);
});

test('no-evidence and active-response stalls get one fresh retry; provisional output is discarded', async (t) => {
  const root = await workspace();
  t.after(() => rm(root, { recursive: true, force: true }));
  for (const [name, provisional, threshold] of [
    ['no evidence', [], 10],
    ['response start', [{ type: 'provider.response.started', responseId: 'partial' }], 5],
    ['provisional text', [{ type: 'provider.response.started', responseId: 'partial' }, { type: 'provider.text.delta', delta: 'SECRET_PROVISIONAL' }], 5],
  ] as const) await t.test(name, async () => {
    const scheduler = new FakeScheduler();
    const provider = new ScriptedProvider([
      (_request, options) => stall(options, provisional),
      () => completed(),
    ]);
    const session = createSession({ workspace: root });
    const service = await createOneTurnApplicationService({ provider, workspace: root, providerStallPolicy: POLICY, providerStallScheduler: scheduler, retrySleeper: async () => {} });
    const pending = collect(service.run({ session, input: name }));
    await waitFor(() => provider.calls.length === 1);
    scheduler.advance(threshold);
    const events = await pending;
    assert.equal(provider.calls.length, 2);
    assert.equal(events.filter((event) => event.type === 'provider.retry.scheduled').length, 1);
    assert.equal(events.filter((event) => event.type === 'provider.stall.detected').length, 1);
    assert.deepEqual(session.transcript, [{ role: 'user', text: name }, { role: 'assistant', text: 'Recovered.' }]);
    assert.doesNotMatch(JSON.stringify(session.transcript), /SECRET_PROVISIONAL/);
    assert.equal(scheduler.pending, 0);
  });
});

test('provisional stalled tool proposals never execute and caller cancellation wins', async (t) => {
  const root = await workspace();
  t.after(() => rm(root, { recursive: true, force: true }));
  let executions = 0;
  const tool: ToolDefinition = {
    name: 'provisional_effect', description: 'Never execute incomplete proposals.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    execution: { effect: 'workspace_mutation', replaySafety: 'not_replay_safe', source: { kind: 'builtin' } },
    execute: async () => { executions += 1; return {}; },
  };
  const scheduler = new FakeScheduler();
  const provider = new ScriptedProvider([
    (_request, options) => stall(options, [
      { type: 'provider.response.started', responseId: 'discard-me' },
      { type: 'provider.tool.call', callId: 'never', name: tool.name, arguments: '{}' },
    ]),
    () => completed(),
  ]);
  const service = await createOneTurnApplicationService({ provider, workspace: root, additionalTools: [tool], providerStallPolicy: POLICY, providerStallScheduler: scheduler, retrySleeper: async () => {} });
  const eventsPromise = collect(service.run({ session: createSession({ workspace: root }), input: 'proposals' }));
  await waitFor(() => provider.calls.length === 1); scheduler.advance(5);
  const events = await eventsPromise;
  assert.equal(executions, 0);
  assert.equal(events.some((event) => event.type === 'tool.requested'), false);
  assert.equal(provider.calls[1]?.request.continuation, undefined);

  const controller = new AbortController();
  const cancelScheduler = new FakeScheduler();
  const cancelledProvider = new ScriptedProvider([(_request, options) => stall(options, [{ type: 'provider.response.started', responseId: 'cancelled' }])]);
  const cancelledService = await createOneTurnApplicationService({ provider: cancelledProvider, workspace: root, providerStallPolicy: POLICY, providerStallScheduler: cancelScheduler });
  const cancelled = collect(cancelledService.run({ session: createSession({ workspace: root }), input: 'cancel', signal: controller.signal }));
  await waitFor(() => cancelledProvider.calls.length === 1); controller.abort(new GeorgeError('cancelled', 'User stopped.'));
  const cancelledEvents = await cancelled;
  assert.equal(cancelledEvents.at(-1)?.type, 'turn.cancelled');
  assert.equal(cancelledEvents.some((event) => event.type === 'provider.stall.terminal'), false);
  assert.equal(cancelScheduler.pending, 0);
});

test('repeated low-pressure stall rebases once from structured authority and never reuses failed native state', async (t) => {
  const root = await workspace();
  t.after(() => rm(root, { recursive: true, force: true }));
  const scheduler = new FakeScheduler();
  let compactions = 0;
  const compactor: ContextCompactor = { compact: async () => { compactions += 1; return 'must not compact'; } };
  const provider = new ScriptedProvider([
    (_request, options) => stall(options),
    (_request, options) => stall(options),
    () => completed('Rebased.'),
  ]);
  const service = await createOneTurnApplicationService({ provider, workspace: root, compactor, providerStallPolicy: POLICY, providerStallScheduler: scheduler, retrySleeper: async () => {} });
  const session = createSession({ workspace: root });
  const pending = collect(service.run({
    session, input: 'CURRENT STRUCTURED OBJECTIVE', alignment: () => 'MISSION CARD\nEffective permissions: workspace=standard.\nNEXT COMPLETION CONDITION\nV1.',
    omitHistory: true, allowCanonicalRebase: true,
  }));
  await waitFor(() => provider.calls.length === 1); scheduler.advance(10);
  await waitFor(() => provider.calls.length === 2); scheduler.advance(10);
  const events = await pending;
  assert.equal(provider.calls.length, 3);
  assert.equal(compactions, 0);
  assert.equal(events.filter((event) => event.type === 'provider.rebase.started').length, 1);
  assert.equal(events.some((event) => event.type === 'context.compaction.started'), false);
  assert.equal(provider.calls[2]?.request.continuation, undefined);
  assert.match(provider.calls[2]?.request.input ?? '', /CURRENT STRUCTURED OBJECTIVE[\s\S]*canonical provider request rebuild/);
  assert.match(provider.calls[2]?.request.instructions ?? '', /MISSION CARD[\s\S]*Effective permissions[\s\S]*V1/);
  assert.deepEqual(session.transcript, [{ role: 'user', text: 'CURRENT STRUCTURED OBJECTIVE' }, { role: 'assistant', text: 'Rebased.' }]);
});

function highPressureProfile(): ContextProfile {
  return {
    ...DEFAULT_CONTEXT_PROFILE,
    id: 'stall-test-profile',
    preferredWorkingSetTokens: { min: 1, max: 50 },
    softPressureTokens: 100,
    providerInputTokens: 8_192,
  };
}

function evidenceTools(): ToolDefinition[] {
  return Array.from({ length: 5 }, (_, index) => ({
    name: `evidence_${index}`, description: `Evidence ${index}.`, inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    execution: { effect: 'local_read' as const, replaySafety: 'replay_safe' as const, source: { kind: 'builtin' as const } },
    execute: async () => ({ index, sha256: `${index}`.repeat(64), textFraming: { lineEnding: 'lf', finalNewline: 'lf' } }),
  }));
}

function completedEvidenceRound(tools: readonly ToolDefinition[]): Round {
  return async function* () {
    yield { type: 'provider.response.started', responseId: 'completed-before-stall' };
    for (const [index, tool] of tools.entries()) yield { type: 'provider.tool.call', callId: `evidence-${index}`, name: tool.name, arguments: '{}' };
    yield { type: 'provider.response.completed' };
  };
}

test('repeated high-pressure stall compacts once, rebases with authoritative evidence, and succeeds', async (t) => {
  const root = await workspace();
  t.after(() => rm(root, { recursive: true, force: true }));
  const scheduler = new FakeScheduler();
  const tools = evidenceTools();
  let compactions = 0;
  const compactor: ContextCompactor = { compact: async ({ history }) => { compactions += 1; assert.match(history, /evidence_0/); return 'COMPACTED COMPLETED TOOL EVIDENCE'; } };
  const provider = new ScriptedProvider([
    completedEvidenceRound(tools),
    (_request, options) => stall(options),
    (_request, options) => stall(options),
    () => completed('Recovered after compaction.'),
  ]);
  const service = await createOneTurnApplicationService({
    provider, workspace: root, additionalTools: tools, contextProfile: highPressureProfile(), compactor,
    providerStallPolicy: POLICY, providerStallScheduler: scheduler, retrySleeper: async () => {},
  });
  const pending = collect(service.run({ session: createSession({ workspace: root }), input: 'STRUCTURED HIGH PRESSURE OBJECTIVE', alignment: () => 'MISSION CARD WITH SHA AND TEXT FRAMING AUTHORITY', omitHistory: true, allowCanonicalRebase: true }));
  await waitFor(() => provider.calls.length === 2); scheduler.advance(10);
  await waitFor(() => provider.calls.length === 3); scheduler.advance(10);
  const events = await pending;
  assert.equal(compactions, 1);
  assert.equal(provider.calls.length, 4);
  assert.deepEqual(provider.calls.slice(1, 3).map((call) => call.request.continuation?.responseId), ['completed-before-stall', 'completed-before-stall']);
  assert.equal(provider.calls[3]?.request.continuation, undefined);
  assert.match(provider.calls[3]?.request.input ?? '', /COMPACTED COMPLETED TOOL EVIDENCE[\s\S]*evidence_4/);
  assert.match(provider.calls[3]?.request.instructions ?? '', /MISSION CARD WITH SHA AND TEXT FRAMING AUTHORITY/);
  assert.equal(events.filter((event) => event.type === 'context.compaction.started' && event.reason === 'stall-pressure').length, 1);
  assert.equal(events.filter((event) => event.type === 'provider.rebase.started' && event.compaction === 'completed').length, 1);
});

test('stall-pressure compactor failure is one-shot, cannot recurse, and safely falls back to rebase', async (t) => {
  const root = await workspace();
  t.after(() => rm(root, { recursive: true, force: true }));
  const scheduler = new FakeScheduler();
  const tools = evidenceTools();
  let compactions = 0;
  const compactor: ContextCompactor = { compact: async ({ signal }) => {
    compactions += 1;
    return new Promise<string>((_resolve, reject) => signal?.addEventListener('abort', () => reject(signal.reason), { once: true }));
  } };
  const provider = new ScriptedProvider([
    completedEvidenceRound(tools),
    (_request, options) => stall(options),
    (_request, options) => stall(options),
    () => completed('Fallback rebase.'),
  ]);
  const service = await createOneTurnApplicationService({
    provider, workspace: root, additionalTools: tools, contextProfile: highPressureProfile(), compactor,
    providerStallPolicy: POLICY, providerStallScheduler: scheduler, retrySleeper: async () => {},
  });
  const pending = collect(service.run({ session: createSession({ workspace: root }), input: 'high pressure', alignment: () => 'MISSION CARD', omitHistory: true, allowCanonicalRebase: true }));
  await waitFor(() => provider.calls.length === 2); scheduler.advance(10);
  await waitFor(() => provider.calls.length === 3); scheduler.advance(10);
  await waitFor(() => compactions === 1); scheduler.advance(4);
  const events = await pending;
  assert.equal(compactions, 1);
  assert.equal(provider.calls.length, 4, 'compaction does not enter the provider recovery ladder');
  assert.equal(events.filter((event) => event.type === 'context.compaction.failed').length, 1);
  assert.equal(events.filter((event) => event.type === 'provider.rebase.started' && event.compaction === 'failed').length, 1);
  assert.equal(scheduler.pending, 0);
});

test('rebase stall is terminal provider failure; unsafe ordinary turns terminate without invented rebase', async (t) => {
  const root = await workspace();
  t.after(() => rm(root, { recursive: true, force: true }));
  for (const allowCanonicalRebase of [true, false]) {
    const scheduler = new FakeScheduler();
    const provider = new ScriptedProvider([
      (_request, options) => stall(options),
      (_request, options) => stall(options),
      ...(!allowCanonicalRebase ? [] : [(_request: ProviderRequest, options: ProviderStreamOptions) => stall(options)]),
    ]);
    const service = await createOneTurnApplicationService({ provider, workspace: root, providerStallPolicy: POLICY, providerStallScheduler: scheduler, retrySleeper: async () => {} });
    const pending = collect(service.run({ session: createSession({ workspace: root }), input: allowCanonicalRebase ? 'structured' : 'ordinary', alignment: allowCanonicalRebase ? () => 'MISSION CARD' : undefined, omitHistory: allowCanonicalRebase, allowCanonicalRebase }));
    await waitFor(() => provider.calls.length === 1); scheduler.advance(10);
    await waitFor(() => provider.calls.length === 2); scheduler.advance(10);
    if (allowCanonicalRebase) { await waitFor(() => provider.calls.length === 3); scheduler.advance(10); }
    const events = await pending;
    const terminal = events.find((event) => event.type === 'provider.stall.terminal');
    assert.equal(terminal?.attempts, allowCanonicalRebase ? 3 : 2);
    assert.equal(events.at(-1)?.type === 'turn.failed' && events.at(-1).error.code, 'provider');
    assert.equal(events.some((event) => event.type === 'assistant.response.completed' || event.type === 'tool.requested'), false);
    assert.equal(provider.calls.length, allowCanonicalRebase ? 3 : 2);
  }
});

test('a real provider-attempt budget exhaustion remains budget exhaustion during stall recovery', async (t) => {
  const root = await workspace();
  t.after(() => rm(root, { recursive: true, force: true }));
  const scheduler = new FakeScheduler();
  const provider = new ScriptedProvider([(_request, options) => stall(options)]);
  const service = await createOneTurnApplicationService({
    provider, workspace: root, providerStallPolicy: POLICY, providerStallScheduler: scheduler, retrySleeper: async () => {},
    runBudget: { ...DEFAULT_RUN_BUDGET, providerAttempts: 1 },
  });
  const pending = collect(service.run({ session: createSession({ workspace: root }), input: 'budget' }));
  await waitFor(() => provider.calls.length === 1); scheduler.advance(10);
  const events = await pending;
  assert.equal(events.some((event) => event.type === 'budget.exhausted' && event.dimension === 'providerAttempts'), true);
  assert.equal(events.at(-1)?.type === 'turn.failed' && events.at(-1).error.code, 'budget');
  assert.equal(events.some((event) => event.type === 'provider.stall.terminal'), false);
});
