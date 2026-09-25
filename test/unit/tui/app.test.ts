import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { RGBA, TextRenderable } from '@opentui/core';
import { createTestRenderer } from '@opentui/core/testing';

import {
  GeorgeError,
  LocalSessionStore,
  PendingApprovalPort,
  appendSessionEvent,
  createSession,
  type ModelProvider,
  type ProviderEvent,
  type ProviderRequest,
  type ProviderStreamOptions,
} from '../../../src/core/index.ts';
import { createCodingWorkflowApplicationService, createOneTurnApplicationService, WorkProjection, type OneTurnServiceOptions } from '../../../src/application/index.ts';
import { GeorgeTui, NEON_THEME, formatElapsedDuration, formatThinkingElapsed, formatWorkflowTiming, renderTask, renderTranscript, taskHeader, type GeorgeTuiOptions, type ThinkingClock, type TranscriptWorkEntry } from '../../../src/tui/app.ts';
import { createTaskState, parseTaskPrompt } from '../../../src/tasks/index.ts';
import type { ToolDefinition } from '../../../src/tools/index.ts';

class ScriptedProvider implements ModelProvider {
  calls: Array<{ request: ProviderRequest; options: ProviderStreamOptions }> = [];
  private readonly events: readonly ProviderEvent[];

  constructor(events: readonly ProviderEvent[]) {
    this.events = events;
  }

  async *stream(request: ProviderRequest, options: ProviderStreamOptions = {}): AsyncGenerator<ProviderEvent> {
    this.calls.push({ request, options });
    yield* this.events;
  }
}

class PausedProvider implements ModelProvider {
  calls: Array<{ request: ProviderRequest; options: ProviderStreamOptions }> = [];
  started = Promise.withResolvers<void>();
  release = Promise.withResolvers<void>();
  private readonly tool: boolean;

  constructor(tool = false) {
    this.tool = tool;
  }

  async *stream(request: ProviderRequest, options: ProviderStreamOptions = {}): AsyncGenerator<ProviderEvent> {
    this.calls.push({ request, options });
    yield { type: 'provider.response.started', ...(this.tool && this.calls.length === 1 ? { responseId: 'paused-tool-response' } : {}) };
    if (this.tool && this.calls.length === 1) {
      yield { type: 'provider.tool.call', callId: 'call-1', name: 'read_file', arguments: '{"path":"BOOT.md"}' };
      this.started.resolve();
      yield { type: 'provider.response.completed' };
      return;
    }
    this.started.resolve();
    await Promise.race([
      this.release.promise,
      new Promise<never>((_resolve, reject) => options.signal?.addEventListener('abort', () => reject(new GeorgeError('cancelled', 'Stopped')), { once: true })),
    ]);
    yield { type: 'provider.text.delta', delta: 'streamed answer' };
    yield { type: 'provider.response.completed' };
  }
}

class ApprovalProvider implements ModelProvider {
  calls: Array<{ request: ProviderRequest; options: ProviderStreamOptions }> = [];
  private readonly call: ProviderEvent;
  constructor(call: ProviderEvent) { this.call = call; }

  async *stream(request: ProviderRequest, options: ProviderStreamOptions = {}): AsyncGenerator<ProviderEvent> {
    this.calls.push({ request, options });
    if (this.calls.length === 1) {
      yield { type: 'provider.response.started', responseId: 'approval-response' };
      yield this.call;
      yield { type: 'provider.response.completed' };
      return;
    }
    yield { type: 'provider.text.delta', delta: 'approval resolved' };
    yield { type: 'provider.response.completed' };
  }
}

class FakeThinkingClock implements ThinkingClock {
  private nextId = 0;
  private readonly callbacks = new Map<number, () => void>();

  get size(): number { return this.callbacks.size; }
  setInterval(callback: () => void): number {
    const id = ++this.nextId;
    this.callbacks.set(id, callback);
    return id;
  }
  clearInterval(timer: number | ReturnType<typeof setInterval>): void { this.callbacks.delete(timer as number); }
  tick(): void { for (const callback of [...this.callbacks.values()]) callback(); }
}

class ThinkingToolProvider implements ModelProvider {
  calls: Array<{ request: ProviderRequest; options: ProviderStreamOptions }> = [];
  releaseThinking = Promise.withResolvers<void>();

  async *stream(request: ProviderRequest, options: ProviderStreamOptions = {}): AsyncGenerator<ProviderEvent> {
    this.calls.push({ request, options });
    if (this.calls.length === 1) {
      yield { type: 'provider.response.started', responseId: 'thinking-tool' };
      await this.releaseThinking.promise;
      yield { type: 'provider.tool.call', callId: 'write', name: 'write_file', arguments: '{"path":"later.txt","content":"x"}' };
    }
    yield { type: 'provider.response.completed' };
  }
}

class FailingThinkingProvider implements ModelProvider {
  calls: Array<{ request: ProviderRequest; options: ProviderStreamOptions }> = [];
  release = Promise.withResolvers<void>();

  async *stream(request: ProviderRequest, options: ProviderStreamOptions = {}): AsyncGenerator<ProviderEvent> {
    this.calls.push({ request, options });
    yield { type: 'provider.response.started' };
    await this.release.promise;
    yield { type: 'provider.error', error: new GeorgeError('provider', 'offline') };
  }
}

async function tui(
  provider: ModelProvider,
  options: Omit<OneTurnServiceOptions, 'provider' | 'workspace' | 'approvalPort'> = {},
  uiOptions: Pick<GeorgeTuiOptions, 'clipboard' | 'thinkingClock' | 'onMeasurement'> = {},
) {
  const workspace = await mkdtemp(join(tmpdir(), 'george-tui-'));
  await writeFile(join(workspace, 'BOOT.md'), 'fixture boot');
  const setup = await createTestRenderer({ width: 72, height: 18, kittyKeyboard: true, exitOnCtrlC: false });
  const approvals = new PendingApprovalPort();
  const service = await createOneTurnApplicationService({ provider, workspace, approvalPort: approvals, ...options });
  const app = new GeorgeTui({ renderer: setup.renderer, service, provider: 'LM Studio', model: 'test-model', approvals, ...uiOptions });
  return { workspace, setup, app, approvals };
}

async function cleanup(item: Awaited<ReturnType<typeof tui>>): Promise<void> {
  item.app.close();
  await rm(item.workspace, { recursive: true, force: true });
}

test('test renderer shows identity, configuration, streamed text, and read-only activity', async (t) => {
  const provider = new PausedProvider(true);
  const item = await tui(provider);
  t.after(() => cleanup(item));
  await item.setup.flush();
  assert.match(item.setup.captureCharFrame(), /George — local coding agent/);
  assert.match(item.setup.captureCharFrame(), /LM Studio · test-model/);

  await item.setup.mockInput.typeText('Inspect BOOT');
  item.setup.mockInput.pressEnter();
  await provider.started.promise;
  await item.setup.flush();
  provider.release.resolve();
  await item.app.waitForIdle();
  await item.setup.flush();
  assert.equal(item.app.session.events.some((event) => event.type === 'tool.completed'), true);
  assert.deepEqual(item.app.work.filter((entry) => entry.item.operationId === 'call-1').map((entry) => entry.item.status), ['succeeded']);
  assert.match(renderTranscript(item.app.session.transcript, item.app.diagnostics, 80, item.app.work).chunks.map((chunk) => chunk.text).join(''), /Read BOOT\.md \(12 bytes\)/);
  const frame = item.setup.captureCharFrame();
  assert.match(item.app.session.transcript.map((entry) => entry.text).join('\n'), /Inspect BOOT/);
  assert.match(frame, /streamed answer/);
});

test('Transcript and Task pages switch without changing session state or the composer draft', async (t) => {
  const item = await tui(new ScriptedProvider([]));
  t.after(() => cleanup(item));
  const before = JSON.stringify(item.app.session);
  await item.setup.mockInput.typeText('preserve this draft');
  item.setup.mockInput.pressKey('2', { ctrl: true });
  await item.setup.flush();
  assert.equal(item.app.currentPage(), 'task');
  assert.match(item.setup.captureCharFrame(), /\[Task\]/);
  assert.match(item.setup.captureCharFrame(), /No structured task is active/);
  assert.equal(item.app.input.plainText, 'preserve this draft');
  assert.equal(JSON.stringify(item.app.session), before);
  item.setup.mockInput.pressKey('1', { ctrl: true });
  assert.equal(item.app.currentPage(), 'transcript');
  await item.setup.mockMouse.click(60, 6);
  await item.setup.flush();
  assert.equal(item.app.currentPage(), 'task');
});

test('task renderer uses application-owned task and work projections without unsafe bodies', () => {
  const parsed = parseTaskPrompt(`GEORGE TASK FORMAT: 1

TASK: P6 — TUI split
KIND: implementation

GOAL

- Split presentation.

REQUIREMENTS

- R1: Show pages.

WORKFLOW

W1 — Render pages
Covers: R1
Depends on: none

VALIDATION

V1 — TUI unit coverage
Covers: R1
Run: node --test test/unit/tui/app.test.ts

STOP CONDITIONS

- S1: Stop safely.`);
  assert.equal(parsed.kind, 'structured');
  if (parsed.kind !== 'structured') return;
  const state = createTaskState({ sessionId: 'session', workspace: '/workspace', definition: parsed.task });
  const rendered = renderTask(state, [{ afterEntryCount: 0, item: { id: 'work', turnId: 'turn', operationId: 'call', category: 'editing', status: 'succeeded', summary: 'Updated app.ts', details: {} } }], 80);
  assert.match(rendered, /Goal[\s\S]*Split presentation/);
  assert.match(rendered, /Requirements[\s\S]*R1 \(pending\)/);
  assert.match(rendered, /Workflow[\s\S]*W1 \(pending\)/);
  assert.match(rendered, /Validation[\s\S]*V1 \(pending, 0 attempts\)/);
  assert.match(rendered, /Recent work[\s\S]*Updated app\.ts/);
  assert.match(rendered, /Effective access: standard approvals/);
  assert.doesNotMatch(rendered, /\["node"/);
  assert.match(taskHeader(state), /W1|no active work/);
  assert.doesNotMatch(taskHeader(state), /test\/unit\/tui/);
});

test('committed final answers reveal progressively without delaying canonical durability, and cancellation stops the reveal', async (t) => {
  const answer = `START ${'x'.repeat(3_000)} END`;
  const measurements: import('../../../src/core/index.ts').Measurement[] = [];
  const item = await tui(new ScriptedProvider([{ type: 'provider.text.delta', delta: answer }, { type: 'provider.response.completed' }]), {}, { onMeasurement: (measurement) => measurements.push(measurement) });
  const state = await mkdtemp(join(tmpdir(), 'george-tui-reveal-'));
  t.after(async () => {
    await cleanup(item);
    await rm(state, { recursive: true, force: true });
  });

  const began = Date.now();
  await item.setup.mockInput.typeText('show a long answer');
  item.setup.mockInput.pressEnter();
  await item.setup.waitForFrame((frame) => frame.includes('START') && !frame.includes('END'));
  assert.deepEqual(item.app.session.transcript, [{ role: 'user', text: 'show a long answer' }, { role: 'assistant', text: answer }]);
  item.app.escape();
  await item.app.waitForIdle();
  assert.ok(Date.now() - began < 2_000);
  assert.equal(measurements.some((item) => item.name === 'final_response.reveal_duration' && item.unit === 'ms'), true);

  const store = new LocalSessionStore({ root: state });
  await store.save(item.app.session);
  assert.deepEqual((await store.open(item.app.session.id, item.workspace)).transcript, item.app.session.transcript);
});

test('provider waits and continuation rounds render Thinking until tool activity replaces it', async (t) => {
  const provider = new PausedProvider(true);
  const item = await tui(provider);
  t.after(() => cleanup(item));

  await item.setup.mockInput.typeText('inspect boot');
  item.setup.mockInput.pressEnter();
  await provider.started.promise;
  await item.setup.waitForFrame((frame) => /Thinking(?:\.\.\.)?/.test(frame));
  provider.release.resolve();
  await item.app.waitForIdle();
  assert.doesNotMatch(item.setup.captureCharFrame(), /Provider responding/);
});

test('provider thinking animates deterministically without creating transcript, work, durable, or provider-context frames', async (t) => {
  const clock = new FakeThinkingClock();
  const provider = new PausedProvider();
  const item = await tui(provider, {}, { thinkingClock: clock });
  const state = await mkdtemp(join(tmpdir(), 'george-tui-thinking-'));
  t.after(async () => {
    await cleanup(item);
    await rm(state, { recursive: true, force: true });
  });

  await item.setup.mockInput.typeText('wait for an answer');
  item.setup.mockInput.pressEnter();
  await provider.started.promise;
  await item.setup.flush();
  assert.equal(clock.size, 1);
  assert.match(item.setup.captureCharFrame(), /Thinking\s+00:00/);
  const eventCount = item.app.session.events.length;
  const activityCount = item.app.session.events.filter((event) => event.type === 'activity.updated').length;
  const work = JSON.stringify(item.app.work);
  for (const label of ['Thinking.   00:00', 'Thinking..  00:00', 'Thinking... 00:00', 'Thinking    00:00']) {
    clock.tick();
    await item.setup.flush();
    assert.equal(item.setup.captureCharFrame().split('\n').find((line) => line.includes('Thinking'))?.trim(), label);
  }
  assert.equal(item.app.session.events.length, eventCount);
  assert.equal(item.app.session.events.filter((event) => event.type === 'activity.updated').length, activityCount);
  assert.equal(JSON.stringify(item.app.work), work);
  assert.doesNotMatch(provider.calls[0]?.request.input ?? '', /Thinking/);
  const store = new LocalSessionStore({ root: state });
  await store.save(item.app.session);
  assert.doesNotMatch(JSON.stringify((await store.open(item.app.session.id, item.workspace)).events), /Thinking/);

  provider.release.resolve();
  await item.app.waitForIdle();
  assert.equal(clock.size, 0);
});

test('thinking elapsed time renders minutes and seconds', () => {
  assert.equal(formatThinkingElapsed(0), '00:00');
  assert.equal(formatThinkingElapsed(61_999), '01:01');
});

test('tool activity, provider failure, cancellation, and teardown clear the thinking timer', async (t) => {
  const toolClock = new FakeThinkingClock();
  const toolProvider = new ThinkingToolProvider();
  const tool = await tui(toolProvider, {}, { thinkingClock: toolClock });
  t.after(() => cleanup(tool));
  await tool.setup.mockInput.typeText('read boot');
  tool.setup.mockInput.pressEnter();
  await tool.setup.waitForFrame((frame) => frame.includes('Thinking'));
  assert.equal(toolClock.size, 1);
  toolProvider.releaseThinking.resolve();
  await tool.setup.waitForFrame((frame) => frame.includes('Awaiting approval for write_file'));
  assert.equal(toolClock.size, 0);
  tool.setup.mockInput.pressKey('d', { ctrl: true });
  await tool.app.waitForIdle();

  const failureClock = new FakeThinkingClock();
  const failureProvider = new FailingThinkingProvider();
  const failure = await tui(failureProvider, {}, { thinkingClock: failureClock });
  t.after(() => cleanup(failure));
  await failure.setup.mockInput.typeText('fail');
  failure.setup.mockInput.pressEnter();
  await failure.setup.waitForFrame((frame) => frame.includes('Thinking'));
  failureProvider.release.resolve();
  await failure.app.waitForIdle();
  assert.equal(failureClock.size, 0);

  const cancellationClock = new FakeThinkingClock();
  const cancellationProvider = new PausedProvider();
  const cancellation = await tui(cancellationProvider, {}, { thinkingClock: cancellationClock });
  t.after(() => cleanup(cancellation));
  await cancellation.setup.mockInput.typeText('cancel');
  cancellation.setup.mockInput.pressEnter();
  await cancellationProvider.started.promise;
  cancellation.app.escape();
  await cancellation.app.waitForIdle();
  assert.equal(cancellationClock.size, 0);

  const teardownClock = new FakeThinkingClock();
  const teardownProvider = new PausedProvider();
  const teardown = await tui(teardownProvider, {}, { thinkingClock: teardownClock });
  t.after(async () => { await rm(teardown.workspace, { recursive: true, force: true }); });
  await teardown.setup.mockInput.typeText('close');
  teardown.setup.mockInput.pressEnter();
  await teardownProvider.started.promise;
  teardown.app.close();
  assert.equal(teardownClock.size, 0);
});

test('tool-bearing provider text never becomes a George transcript block', async (t) => {
  const provider = new class implements ModelProvider {
    calls = 0;
    async *stream(): AsyncGenerator<ProviderEvent> {
      this.calls += 1;
      if (this.calls === 1) {
        yield { type: 'provider.response.started', responseId: 'tool-round' };
        yield { type: 'provider.text.delta', delta: 'provisional text' };
        yield { type: 'provider.tool.call', callId: 'read', name: 'read_file', arguments: '{"path":"BOOT.md"}' };
      } else yield { type: 'provider.text.delta', delta: 'final text' };
      yield { type: 'provider.response.completed' };
    }
  }();
  const item = await tui(provider);
  t.after(() => cleanup(item));

  await item.setup.mockInput.typeText('read boot');
  item.setup.mockInput.pressEnter();
  await item.app.waitForIdle();
  const visible = renderTranscript(item.app.session.transcript, item.app.diagnostics, 80, item.app.work).chunks.map((chunk) => chunk.text).join('');
  assert.match(visible, /George\n│   final text/);
  assert.doesNotMatch(visible, /provisional text/);
  assert.equal(item.app.session.transcript.filter((entry) => entry.role === 'assistant').length, 1);
});

test('reopened workflow renders historical evidence as idle and starts a fresh provider turn', async (t) => {
  const root = await mkdtemp(join(tmpdir(), 'george-tui-resume-'));
  const workspace = join(root, 'workspace');
  const state = join(root, 'state');
  await mkdir(workspace);
  await writeFile(join(workspace, 'BOOT.md'), 'fixture boot');
  t.after(() => rm(root, { recursive: true, force: true }));
  const store = new LocalSessionStore({ root: state });
  const prior = createSession({ id: 'resume-1', workspace });
  appendSessionEvent(prior, { type: 'turn.started', turnId: 'old' });
  appendSessionEvent(prior, { type: 'input.submitted', text: 'old request' });
  appendSessionEvent(prior, { type: 'provider.text.delta', delta: 'old answer' });
  appendSessionEvent(prior, { type: 'provider.response.completed' });
  appendSessionEvent(prior, { type: 'assistant.response.completed', turnId: 'old', text: 'old answer' });
  appendSessionEvent(prior, { type: 'turn.completed', turnId: 'old' });
  appendSessionEvent(prior, { type: 'work.updated', item: { id: 'old:read', turnId: 'old', operationId: 'read', category: 'inspection', status: 'succeeded', summary: 'Read BOOT.md (12 bytes)', details: { path: 'BOOT.md', bytes: 12 } } });
  appendSessionEvent(prior, { type: 'work.updated', item: { id: 'old:context:missing', turnId: 'old', operationId: 'user:personality', category: 'context', status: 'missing', summary: 'Context source user:personality: missing', details: {} } });
  appendSessionEvent(prior, { type: 'work.updated', item: { id: 'old:write', turnId: 'old', operationId: 'write', category: 'editing', status: 'waiting', summary: 'Awaiting approval for write_file', details: { path: 'later.txt' } } });
  appendSessionEvent(prior, { type: 'provider.response.started', responseId: 'old-provider-id' });
  await store.save(prior);

  const provider = new ScriptedProvider([{ type: 'provider.text.delta', delta: 'new answer' }, { type: 'provider.response.completed' }]);
  const approvals = new PendingApprovalPort();
  const service = await createCodingWorkflowApplicationService({ provider, workspace, approvalPort: approvals, sessionStore: store });
  const setup = await createTestRenderer({ width: 72, height: 18, kittyKeyboard: true, exitOnCtrlC: false });
  const app = new GeorgeTui({ renderer: setup.renderer, service, session: await store.open('resume-1', workspace), provider: 'LM Studio', model: 'test-model', approvals });
  t.after(() => app.close());
  await setup.flush();
  const restored = renderTranscript(app.session.transcript, app.diagnostics, 80, app.work).chunks.map((chunk) => chunk.text).join('');
  assert.match(restored, /old request[\s\S]*old answer/);
  assert.match(restored, /Read BOOT\.md/);
  assert.equal((restored.match(/^Work$/gm) ?? []).length, 1);
  assert.match(restored, /Read BOOT\.md \(12 bytes\) \(succeeded\)\n│   Context source user:personality: missing \(missing\)\n│   Previous operation interrupted: Awaiting approval for write_file \(interrupted\)/);
  assert.equal(app.work.find((entry) => entry.item.operationId === 'user:personality')?.item.status, 'missing');
  setup.resize(48, 12);
  await setup.flush();
  assert.equal((renderTranscript(app.session.transcript, app.diagnostics, 48, app.work).chunks.map((chunk) => chunk.text).join('').match(/^Work$/gm) ?? []).length, 1);
  assert.equal(app.work.some((entry) => ['requested', 'running', 'waiting'].includes(entry.item.status)), false);
  assert.equal(app.work.filter((entry) => entry.item.status === 'interrupted').length, 2);

  await setup.mockInput.typeText('new request');
  setup.mockInput.pressEnter();
  await app.waitForIdle();
  assert.equal(provider.calls.length, 1);
  assert.match(provider.calls[0]?.request.input ?? '', /user: old request\n\nassistant: old answer/);
  assert.doesNotMatch(provider.calls[0]?.request.input ?? '', /Awaiting approval|Previous operation|old-provider-id/);
  assert.match(app.session.transcript.map((entry) => entry.text).join('\n'), /new request\nnew answer/);
  assert.equal((await store.open('resume-1', workspace)).interruptions.some((item) => item.kind === 'provider-continuation'), true);
});

test('resumed transcript waits for measured layout before its first usable frame', async (t) => {
  const workspace = await mkdtemp(join(tmpdir(), 'george-tui-resume-layout-'));
  await writeFile(join(workspace, 'BOOT.md'), 'fixture boot');
  t.after(() => rm(workspace, { recursive: true, force: true }));
  const session = createSession({ workspace });
  appendSessionEvent(session, { type: 'turn.started', turnId: 'old' });
  appendSessionEvent(session, { type: 'input.submitted', text: 'historical request' });
  appendSessionEvent(session, { type: 'assistant.response.completed', turnId: 'old', text: 'historical transcript should render at a sensible measured width before a user submits another prompt' });
  appendSessionEvent(session, { type: 'work.updated', item: { id: 'old:read', turnId: 'old', operationId: 'read', category: 'inspection', status: 'succeeded', summary: 'Read historical evidence', details: {} } });
  const setup = await createTestRenderer({ width: 72, height: 30, kittyKeyboard: true, exitOnCtrlC: false });
  const approvals = new PendingApprovalPort();
  const service = await createOneTurnApplicationService({ provider: new ScriptedProvider([]), workspace, approvalPort: approvals });
  const app = new GeorgeTui({ renderer: setup.renderer, service, session, provider: 'LM Studio', model: 'test-model', approvals });
  t.after(() => app.close());

  await setup.flush();
  const transcript = app.transcript.findDescendantById('transcript-text');
  assert.ok(transcript instanceof TextRenderable);
  assert.ok(transcript.width > 4);
  assert.match(transcript.plainText, /historical transcript should render/);
  assert.match(setup.captureCharFrame(), /historical transcript should render/);
});

test('uses the green neon palette for the transcript and focused composer', async (t) => {
  const item = await tui(new ScriptedProvider([]));
  t.after(() => cleanup(item));

  await item.setup.flush();
  assert.deepEqual(item.app.transcript.backgroundColor.toInts(), RGBA.fromHex(NEON_THEME.transcript).toInts());
  assert.deepEqual(item.app.transcript.borderColor.toInts(), RGBA.fromHex(NEON_THEME.border).toInts());
  assert.deepEqual(item.app.input.backgroundColor.toInts(), RGBA.fromHex(NEON_THEME.background).toInts());
  assert.deepEqual(item.app.input.cursorColor.toInts(), RGBA.fromHex(NEON_THEME.mint).toInts());
  assert.match(item.setup.captureCharFrame(), /┌─Transcript/);
  assert.match(item.setup.captureCharFrame(), /\+-+\+/);
});

test('transcript styles distinct multiline You and George headers without changing canonical text', () => {
  const transcript = renderTranscript([
    { role: 'user', text: 'first user line\nsecond user line' },
    { role: 'assistant', text: 'first George line\nsecond George line' },
  ], []);
  const you = transcript.chunks.find((chunk) => chunk.text === 'You');
  const george = transcript.chunks.find((chunk) => chunk.text === 'George');
  assert.deepEqual(you?.fg?.toInts(), RGBA.fromHex(NEON_THEME.user).toInts());
  assert.deepEqual(george?.fg?.toInts(), RGBA.fromHex(NEON_THEME.assistant).toInts());
  assert.notDeepEqual(you?.fg?.toInts(), george?.fg?.toInts());
  assert.ok((you?.attributes ?? 0) > 0);
  const visible = transcript.chunks.map((chunk) => chunk.text).join('');
  assert.match(visible, /^You\n│   first user line\n│   second user line\n\nGeorge\n│   first George line\n│   second George line$/);
  assert.match(renderTranscript([{ role: 'assistant', text: 'one two three four' }], [], 7).chunks.map((chunk) => chunk.text).join(''), /George\n│   one two\n│   three\n│   four/);
});

test('failed work renders its safe requested arguments but successful work stays concise', () => {
  const failed = renderTranscript([], [], 120, [{ afterEntryCount: 0, item: {
    id: 'bad', turnId: 'turn', operationId: 'bad', category: 'inspection', status: 'failed', summary: 'List . failed: invalid',
    details: { requestedArguments: '{"unexpected":["directory"]}', error: 'invalid' },
  } }]).chunks.map((chunk) => chunk.text).join('');
  const success = renderTranscript([], [], 120, [{ afterEntryCount: 0, item: {
    id: 'good', turnId: 'turn', operationId: 'good', category: 'inspection', status: 'succeeded', summary: 'Listed . (0 entries)',
    details: { path: '.', requestedArguments: '{}' },
  } }]).chunks.map((chunk) => chunk.text).join('');
  assert.match(failed, /Requested args: \{"unexpected":\["directory"\]\}/);
  assert.doesNotMatch(success, /Requested args/);
});

test('groups adjacent work rows, keeps per-row status text and styling, and breaks at transcript or diagnostic blocks', () => {
  const work = (id: string, status: TranscriptWorkEntry['item']['status'], afterEntryCount: number, order: number): TranscriptWorkEntry => ({
    afterEntryCount, order, item: { id, turnId: 'turn', operationId: id, category: 'inspection', status, summary: `Operation ${id}`, details: {} },
  });
  const transcript = renderTranscript(
    [{ role: 'user', text: 'next request' }],
    [{ afterEntryCount: 0, order: 3, title: 'Error', source: 'Provider failure', code: 'provider', message: 'offline', details: [] }],
    80,
    [work('one', 'succeeded', 0, 0), work('missing', 'missing', 0, 1), work('skipped', 'skipped', 0, 1.5), work('two', 'failed', 0, 2), work('three', 'waiting', 0, 4), work('four', 'running', 1, 5)],
  );
  const visible = transcript.chunks.map((chunk) => chunk.text).join('');
  assert.equal((visible.match(/Work/g) ?? []).length, 3);
  assert.match(visible, /Work\n│   Operation one \(succeeded\)\n│   Operation missing \(missing\)\n│   Operation skipped \(skipped\)\n│   Operation two \(failed\)\n\nError/);
  assert.match(visible, /Error[\s\S]*\n\nWork\n│   Operation three \(waiting\)\n\nYou[\s\S]*\n\nWork\n│   Operation four \(running\)/);
  assert.deepEqual(transcript.chunks.find((chunk) => chunk.text === '(succeeded)')?.fg?.toInts(), RGBA.fromHex(NEON_THEME.assistant).toInts());
  assert.deepEqual(transcript.chunks.find((chunk) => chunk.text === '(failed)')?.fg?.toInts(), RGBA.fromHex(NEON_THEME.error).toInts());
  assert.deepEqual(transcript.chunks.find((chunk) => chunk.text === '(waiting)')?.fg?.toInts(), RGBA.fromHex(NEON_THEME.user).toInts());
  assert.deepEqual(transcript.chunks.find((chunk) => chunk.text === '(missing)')?.fg?.toInts(), RGBA.fromHex(NEON_THEME.muted).toInts());
  assert.deepEqual(transcript.chunks.find((chunk) => chunk.text === '(skipped)')?.fg?.toInts(), RGBA.fromHex(NEON_THEME.muted).toInts());
});

test('work durations use canonical milliseconds and seconds in the muted presentation treatment', () => {
  const transcript = renderTranscript([], [], 120, [{ afterEntryCount: 0, item: {
    id: 'context', turnId: 'turn', operationId: 'workspace:BOOT.md', category: 'context', status: 'succeeded', summary: 'Context source workspace:BOOT.md: loaded', elapsedMs: 4, details: {},
  } }, { afterEntryCount: 0, item: {
    id: 'parallel', turnId: 'turn', operationId: 'parallel_search', category: 'inspection', status: 'succeeded', summary: 'Completed parallel_search', elapsedMs: 10_310, details: { timeoutMs: 24_000 },
  } }, { afterEntryCount: 0, item: {
    id: 'timed', turnId: 'turn', operationId: 'timed', category: 'completion', status: 'succeeded', summary: 'Workflow completed', elapsedMs: 92_000,
    details: { timing: { totalMs: 92_000, providerMs: 80_700, toolMs: 3_240, approvalMs: 7_060, otherMs: 1_000 } },
  } }]);
  const visible = transcript.chunks.map((chunk) => chunk.text).join('');
  assert.match(visible, /Context source workspace:BOOT\.md: loaded \(succeeded\) 4ms \| 0\.00s/);
  assert.match(visible, /Completed parallel_search \(succeeded\) 10310ms \| 10\.31s/);
  assert.match(visible, /Timeout: 24000ms \| 24\.00s/);
  assert.match(visible, /Workflow completed \(succeeded\) 92000ms \| 92\.00s/);
  assert.deepEqual(transcript.chunks.find((chunk) => chunk.text === '4ms | 0.00s')?.fg?.toInts(), RGBA.fromHex(NEON_THEME.muted).toInts());
  assert.equal(formatElapsedDuration(4), '4ms | 0.00s');
  assert.equal(formatElapsedDuration(135), '135ms | 0.14s');
  assert.equal(formatElapsedDuration(2_400), '2400ms | 2.40s');
  assert.equal(formatElapsedDuration(24_000), '24000ms | 24.00s');
  assert.equal(formatElapsedDuration(10_310), '10310ms | 10.31s');
});

test('workflow timing columns remain visibly aligned across styled short and long durations', () => {
  const lines = formatWorkflowTiming({ totalMs: 92_000, providerMs: 80_700, toolMs: 3_240, approvalMs: 7_060, otherMs: 4 });
  assert.deepEqual(lines, [
    'Time',
    'Model calls     80700ms | 80.70s',
    'Tool calls       3240ms |  3.24s',
    'Approvals        7060ms |  7.06s',
    'Other / harness     4ms |  0.00s',
    'Total           92000ms | 92.00s',
  ]);
  const timing = { totalMs: 92_000, providerMs: 80_700, toolMs: 3_240, approvalMs: 7_060, otherMs: 4 };
  const transcript = renderTranscript([], [], 120, [{ afterEntryCount: 0, item: {
    id: 'timed', turnId: 'turn', operationId: 'timed', category: 'completion', status: 'succeeded', summary: 'Workflow completed', details: { timing },
  } }]);
  const visible = transcript.chunks.map((chunk) => chunk.text).join('');
  const rows = visible.split('\n').map((line) => line.replace(/^│     /, '')).filter((line) => /ms \| .*s$/.test(line));
  assert.equal(new Set(rows.map((line) => line.indexOf('ms |'))).size, 1);
  assert.equal(new Set(rows.map((line) => line.lastIndexOf('s'))).size, 1);
  assert.equal(visible.includes('\u001b['), false);
});

test('execution transcript updates one stable work row and renders bounded concrete operations', () => {
  const projection = new WorkProjection();
  const projected = [
    { type: 'context.source' as const, turnId: 'turn', sourceId: 'workspace:AGENTS.md', kind: 'workspace-untrusted', status: 'loaded' as const, bytes: 48 },
    { type: 'tool.requested' as const, turnId: 'turn', callId: 'read', name: 'read_file', arguments: '{"path":"src/app.ts"}' },
    { type: 'tool.started' as const, turnId: 'turn', callId: 'read', name: 'read_file' },
    { type: 'tool.completed' as const, turnId: 'turn', callId: 'read', name: 'read_file', result: { ok: true as const, value: { bytes: 12, text: 'SECRET_FILE_BODY', truncated: false } } },
    { type: 'tool.requested' as const, turnId: 'turn', callId: 'list', name: 'list_directory', arguments: '{"path":"src"}' },
    { type: 'tool.completed' as const, turnId: 'turn', callId: 'list', name: 'list_directory', result: { ok: true as const, value: { entries: [{}, {}], truncated: false } } },
    { type: 'tool.requested' as const, turnId: 'turn', callId: 'search', name: 'search_text', arguments: '{"path":"src","query":"needle"}' },
    { type: 'tool.completed' as const, turnId: 'turn', callId: 'search', name: 'search_text', result: { ok: true as const, value: { matches: [{}], scannedFiles: 3, scannedBytes: 32, text: 'SECRET_SEARCH_BODY', truncated: false } } },
    { type: 'tool.requested' as const, turnId: 'turn', callId: 'status', name: 'git_status', arguments: '{}' },
    { type: 'tool.completed' as const, turnId: 'turn', callId: 'status', name: 'git_status', result: { ok: true as const, value: { exitCode: 0, stdout: 'SECRET_GIT_OUTPUT', stdoutTruncated: false, stderrTruncated: false } } },
    { type: 'tool.requested' as const, turnId: 'turn', callId: 'diff', name: 'git_diff', arguments: '{}' },
    { type: 'tool.completed' as const, turnId: 'turn', callId: 'diff', name: 'git_diff', result: { ok: true as const, value: { exitCode: 0, stdout: 'SECRET_DIFF_OUTPUT', stdoutTruncated: false, stderrTruncated: false } } },
    { type: 'tool.requested' as const, turnId: 'turn', callId: 'write', name: 'write_file', arguments: '{"path":"src/app.ts","content":"SECRET_WRITE_BODY"}' },
    { type: 'tool.completed' as const, turnId: 'turn', callId: 'write', name: 'write_file', result: { ok: true as const, value: { bytes: 24 } } },
    { type: 'tool.requested' as const, turnId: 'turn', callId: 'process', name: 'run_process', arguments: '{"executable":"node","arguments":["--check","src/app.ts"],"cwd":"."}' },
    { type: 'tool.completed' as const, turnId: 'turn', callId: 'process', name: 'run_process', result: { ok: true as const, value: { executable: 'node', arguments: ['--check', 'src/app.ts'], cwd: '.', exitCode: 0, signal: null, outcome: 'completed', stdout: 'SECRET_PROCESS_OUTPUT', stderr: '', stdoutTruncated: false, stderrTruncated: false } } },
    { type: 'validation.started' as const, turnId: 'turn', callId: 'validation', label: 'typecheck', intent: 'typecheck' },
    { type: 'validation.completed' as const, turnId: 'turn', callId: 'validation', status: 'passed' as const, exitCode: 0, signal: null, outcome: 'completed' as const, stdoutTruncated: false, stderrTruncated: false },
  ].flatMap((event) => projection.observe(event));
  const updates = projected.filter((event): event is Extract<typeof event, { type: 'work.updated' }> => event.type === 'work.updated');
  const read = updates.filter((event) => event.item.operationId === 'read');
  assert.deepEqual(read.map((event) => event.item.status), ['requested', 'running', 'succeeded']);
  assert.equal(new Set(read.map((event) => event.item.id)).size, 1);

  const work = [...new Map(updates.map((event) => [event.item.id, event.item])).values()].map((item, order): TranscriptWorkEntry => ({ afterEntryCount: 1, order, item }));
  const running = renderTranscript([{ role: 'user', text: 'inspect and validate' }], [], 120, [{ afterEntryCount: 1, item: read[1]!.item }]).chunks.map((chunk) => chunk.text).join('');
  const visible = renderTranscript([{ role: 'user', text: 'inspect and validate' }], [], 120, work).chunks.map((chunk) => chunk.text).join('');
  assert.match(running, /Work\n│   Read src\/app\.ts \(running\)/);
  assert.equal((visible.match(/Read src\/app\.ts \(12 bytes\)/g) ?? []).length, 1);
  assert.match(visible, /Context source workspace:AGENTS\.md: loaded/);
  assert.match(visible, /Listed src \(2 entries\)/);
  assert.match(visible, /Searched src \(1 matches in 3 files\) \(succeeded\)\n│     Query: needle/);
  assert.match(visible, /Inspected Git status · Exit: 0 \(succeeded\)/);
  assert.match(visible, /Inspected Git diff/);
  assert.match(visible, /Wrote src\/app\.ts \(24 bytes\)/);
  assert.match(visible, /Executable: node\n│     Argv: \["--check","src\/app\.ts"\]\n│     Cwd: \.\n│     Outcome: completed/);
  assert.match(visible, /Validation passed · Exit: 0 \(succeeded\)/);
  assert.doesNotMatch(visible, /SECRET_(FILE|SEARCH|GIT|DIFF|WRITE|PROCESS)_/);
});

test('transcript presentation stays out of provider context', async (t) => {
  const provider = new ScriptedProvider([
    { type: 'provider.text.delta', delta: 'first George answer' },
    { type: 'provider.response.completed' },
  ]);
  const item = await tui(provider);
  t.after(() => cleanup(item));

  await item.setup.mockInput.typeText('first user question');
  item.setup.mockInput.pressEnter();
  await item.app.waitForIdle();
  await item.setup.mockInput.typeText('second user question');
  item.setup.mockInput.pressEnter();
  await item.app.waitForIdle();
  const context = provider.calls[1]?.request.input ?? '';
  const visible = renderTranscript(item.app.session.transcript, item.app.diagnostics, 80, item.app.work).chunks.map((chunk) => chunk.text).join('');
  assert.match(visible, /Work\n│   Context source/);
  assert.match(context, /user: first user question\n\nassistant: first George answer/);
  assert.doesNotMatch(context, /Work ·|Context source|│|\nYou\n|\nGeorge\n/);
});

test('provider failure stays visible once with safe metadata and never enters later model context', async (t) => {
  const timeout = new GeorgeError('provider', 'LM Studio request timed out after 30000 ms.', {
    cause: { kind: 'provider_event', status: 504, providerEventType: 'response.failed', providerCode: 'context_length_exceeded', providerReason: 'max_input_tokens', raw: 'secret'.repeat(10_000) },
  });
  const provider = new class implements ModelProvider {
    calls: Array<{ request: ProviderRequest; options: ProviderStreamOptions }> = [];
    async *stream(request: ProviderRequest, options: ProviderStreamOptions = {}): AsyncGenerator<ProviderEvent> {
      this.calls.push({ request, options });
      if (this.calls.length === 1) {
        yield { type: 'provider.response.started', responseId: 'failed-response' };
        yield { type: 'provider.error', error: timeout };
        return;
      }
      yield { type: 'provider.text.delta', delta: 'recovered' };
      yield { type: 'provider.response.completed' };
    }
  }();
  const item = await tui(provider);
  t.after(() => cleanup(item));

  await item.setup.mockInput.typeText('first turn');
  item.setup.mockInput.pressEnter();
  await item.app.waitForIdle();
  const visible = renderTranscript(item.app.session.transcript, item.app.diagnostics).chunks.map((chunk) => chunk.text).join('');
  assert.equal(item.app.diagnostics.length, 1);
  assert.equal(item.app.session.events.filter((event) => event.type === 'provider.error' || event.type === 'turn.failed').length, 2);
  assert.match(visible, /Error\nProvider failure\nCode: provider\nLM Studio request timed out after 30000 ms\.\nKind: provider_event\nHTTP status: 504\nProvider event: response\.failed\nProvider code: context_length_exceeded\nProvider reason: max_input_tokens/);
  assert.doesNotMatch(visible, /secret/);
  assert.doesNotMatch(item.setup.captureCharFrame(), /Thinking\.\.\./);
  assert.deepEqual(item.app.session.transcript, [{ role: 'user', text: 'first turn' }]);
  assert.equal(item.app.work.some((entry) => entry.item.status === 'interrupted'), true);

  await item.setup.mockInput.typeText('second turn');
  item.setup.mockInput.pressEnter();
  await item.app.waitForIdle();
  assert.equal(provider.calls.length, 2);
  assert.doesNotMatch(provider.calls[1]?.request.input ?? '', /LM Studio request timed out|Provider failure|secret/);
});

test('recoverable tool failures remain presentation-only diagnostic history', async (t) => {
  const provider = new class implements ModelProvider {
    calls = 0;
    async *stream(): AsyncGenerator<ProviderEvent> {
      this.calls += 1;
      if (this.calls === 1) {
        yield { type: 'provider.response.started', responseId: 'tool-failure' };
        yield { type: 'provider.tool.call', callId: 'bad-tool', name: 'not_a_tool', arguments: '{}' };
      }
      yield { type: 'provider.response.completed' };
    }
  }();
  const item = await tui(provider);
  t.after(() => cleanup(item));

  await item.setup.mockInput.typeText('run tool');
  item.setup.mockInput.pressEnter();
  await item.app.waitForIdle();
  const visible = renderTranscript(item.app.session.transcript, item.app.diagnostics).chunks.map((chunk) => chunk.text).join('');
  assert.match(visible, /Tool failure\nTool: not_a_tool\nCode: validation/);
  assert.deepEqual(item.app.session.transcript, [{ role: 'user', text: 'run tool' }]);
});

test('Enter submits while Shift+Enter uses the OpenTUI Textarea newline binding', async (t) => {
  const provider = new ScriptedProvider([{ type: 'provider.response.completed' }]);
  const item = await tui(provider);
  t.after(() => cleanup(item));

  await item.setup.mockInput.typeText('first');
  item.setup.mockInput.pressEnter({ shift: true });
  await item.setup.mockInput.typeText('second');
  assert.equal(item.app.input.plainText, 'first\nsecond');
  item.setup.mockInput.pressEnter();
  await item.app.waitForIdle();
  assert.equal(provider.calls.length, 1);
  assert.match(provider.calls[0]?.request.input ?? '', /first\nsecond/);
  assert.equal(item.app.input.plainText, '');
});

test('composer shows its key ledger and supports terminal paste, Ctrl+V, and Ctrl+C copy', async (t) => {
  const clipboardText = 'clipboard\ntext';
  const copied: string[] = [];
  const item = await tui(new ScriptedProvider([]), {}, {
    clipboard: {
      async read() {
        return { status: 'read', representation: { mimeType: 'text/plain', bytes: new TextEncoder().encode(clipboardText) } };
      },
      async writeText(text) {
        copied.push(text);
        return { status: 'written' };
      },
      async dispose() {},
    },
  });
  t.after(() => cleanup(item));

  await item.setup.mockInput.pasteBracketedText('terminal\npaste');
  item.setup.mockInput.pressKey('v', { ctrl: true });
  await item.setup.flush();
  assert.equal(item.app.input.plainText, `terminal\npaste${clipboardText}`);
  assert.match(item.setup.captureCharFrame(), /Ctrl\+C copy.*Esc exit/);
  item.setup.mockInput.pressKey('a', { ctrl: true });
  item.setup.mockInput.pressKey('c', { ctrl: true });
  await item.setup.flush();
  assert.deepEqual(copied, [`terminal\npaste${clipboardText}`]);
});

test('composer selects all with Ctrl+A, clears with Backspace, and marks hidden lines', async (t) => {
  const item = await tui(new ScriptedProvider([]));
  t.after(() => cleanup(item));
  assert.ok(item.app.input.height >= 5);

  await item.setup.mockInput.pasteBracketedText(Array.from({ length: 16 }, (_, index) => `line ${index}`).join('\n'));
  await item.setup.flush();
  assert.match(item.setup.captureCharFrame(), /… lines above/);

  item.setup.mockInput.pressKey('a', { ctrl: true });
  item.setup.mockInput.pressBackspace();
  await item.setup.flush();
  assert.equal(item.app.input.plainText, '');
  assert.doesNotMatch(item.setup.captureCharFrame(), /… lines/);
});

test('submitting a scrolled composer clears its overflow cue', async (t) => {
  const provider = new ScriptedProvider([{ type: 'provider.response.completed' }]);
  const item = await tui(provider);
  t.after(() => cleanup(item));

  await item.setup.mockInput.pasteBracketedText(Array.from({ length: 16 }, (_, index) => `line ${index}`).join('\n'));
  await item.setup.flush();
  assert.match(item.setup.captureCharFrame(), /… lines above/);
  item.setup.mockInput.pressEnter();
  await item.app.waitForIdle();
  await item.setup.flush();
  assert.equal(item.app.input.plainText, '');
  assert.doesNotMatch(item.setup.captureCharFrame(), /… lines/);
});

test('streaming does not overwrite draft input and returns the composer to ready state', async (t) => {
  const provider = new PausedProvider();
  const item = await tui(provider);
  t.after(() => cleanup(item));

  await item.setup.mockInput.typeText('question');
  item.setup.mockInput.pressEnter();
  await provider.started.promise;
  await item.setup.mockInput.typeText('next draft');
  provider.release.resolve();
  await item.app.waitForIdle();
  await item.setup.flush();
  assert.equal(item.app.input.plainText, 'next draft');
  assert.match(item.setup.captureCharFrame(), /streamed answer/);
  assert.match(item.setup.captureCharFrame(), /Ready/);
});

test('/skills stays local and /skill activates exactly one recoverable non-sticky turn', async (t) => {
  const roots = await mkdtemp(join(tmpdir(), 'george-tui-skills-'));
  const provider = new ScriptedProvider([{ type: 'provider.response.completed' }]);
  const item = await tui(provider, {
    skillRoots: { builtin: join(roots, 'builtin'), user: join(roots, 'user'), workspace: join(roots, 'workspace') },
  });
  t.after(async () => {
    await cleanup(item);
    await rm(roots, { recursive: true, force: true });
  });
  const writeSkill = async (root: string, name: string, description: string, body: string) => {
    await mkdir(join(root, name), { recursive: true });
    await writeFile(join(root, name, 'SKILL.md'), `---\nname: ${name}\ndescription: ${description}\n---\n${body}\n`);
  };
  await Promise.all([
    writeSkill(join(roots, 'builtin'), 'focused', 'Built-in focus', 'BUILTIN BODY'),
    writeSkill(join(roots, 'workspace'), 'focused', 'Workspace focus', 'WORKSPACE BODY'),
    writeSkill(join(roots, 'workspace'), 'other', 'Other skill', 'OTHER BODY'),
  ]);

  await item.setup.mockInput.typeText('/skills');
  item.setup.mockInput.pressEnter();
  await item.setup.waitForFrame((frame) => frame.includes('Skills (3):'));
  await new Promise<void>((resolve) => setTimeout(resolve, 50));
  assert.match(item.setup.captureCharFrame(), /builtin:focused/);
  assert.match(item.setup.captureCharFrame(), /\$other/);
  assert.equal(provider.calls.length, 0);

  await item.setup.mockInput.typeText('/skill focused write this');
  await item.app.submit();
  await item.setup.waitForFrame((frame) => frame.includes('Ambiguous skill focused'));
  assert.equal(provider.calls.length, 0);
  assert.equal(item.app.input.plainText, '/skill focused write this');

  item.app.input.clear();
  item.app.input.focus();
  await item.setup.flush();
  await item.setup.mockInput.typeText('/skill missing write this');
  await item.app.submit();
  await item.setup.waitForFrame((frame) => frame.includes('Unknown skill missing'));
  assert.equal(provider.calls.length, 0);
  assert.equal(item.app.input.plainText, '/skill missing write this');

  item.app.input.clear();
  item.app.input.focus();
  await item.setup.flush();
  await item.setup.mockInput.typeText('$other use it');
  await item.app.submit();
  await item.setup.flush();
  assert.equal(provider.calls.length, 1);
  assert.match(provider.calls[0]?.request.instructions ?? '', /OTHER BODY/);
  assert.match(item.setup.captureCharFrame(), /Context estimated .*profile .*input/);
  assert.match(item.setup.captureCharFrame(), /Headroom .*pressure no/);
  assert.match(item.setup.captureCharFrame(), /categories/);
  assert.match(item.setup.captureCharFrame(), /Active skill: workspace:other/);

  await item.setup.mockInput.typeText('normal turn');
  await item.app.submit();
  assert.equal(provider.calls.length, 2);
  assert.doesNotMatch(provider.calls[1]?.request.instructions ?? '', /OTHER BODY/);

  await item.setup.mockInput.typeText('$unknown shell-variable');
  await item.app.submit();
  assert.equal(provider.calls.length, 3);
  assert.match(provider.calls[2]?.request.input ?? '', /\$unknown shell-variable/);

  await item.setup.mockInput.typeText('/skill workspace:focused use it');
  await item.app.submit();
  await item.setup.flush();
  assert.equal(provider.calls.length, 4);
  assert.match(provider.calls[3]?.request.instructions ?? '', /WORKSPACE BODY/);

  await item.setup.mockInput.typeText('/skill');
  item.setup.mockInput.pressEnter();
  await item.setup.waitForFrame((frame) => frame.includes('Usage: /skill'));
  assert.equal(item.app.input.plainText, '/skill');
});

test('transcript scrollback and renderer resize retain a coherent conversation layout', async (t) => {
  const provider = new ScriptedProvider([
    { type: 'provider.text.delta', delta: Array.from({ length: 20 }, (_, index) => `line ${index}`).join('\n') },
    { type: 'provider.response.completed' },
  ]);
  const item = await tui(provider);
  t.after(() => cleanup(item));

  await item.setup.mockInput.typeText('long answer');
  item.setup.mockInput.pressEnter();
  await item.app.waitForIdle();
  await item.setup.flush();
  const before = item.app.transcript.scrollTop;
  item.app.scrollTranscript(-3);
  assert.ok(item.app.transcript.scrollTop <= before);
  item.setup.resize(48, 12);
  await item.setup.flush();
  assert.ok(item.app.transcript.width > 0 && item.app.transcript.height > 0);
  assert.ok(item.app.input.width > 0 && item.app.input.height >= 3);
  assert.match(item.setup.captureCharFrame(), /Transcript/);
});

test('transcript stays selectable after wrapped scrollback and resize', async (t) => {
  const provider = new ScriptedProvider([
    { type: 'provider.text.delta', delta: Array.from({ length: 12 }, (_, index) => `long response line ${index}`).join('\n') },
    { type: 'provider.response.completed' },
  ]);
  const item = await tui(provider);
  t.after(() => cleanup(item));

  await item.setup.mockInput.typeText('select this transcript');
  item.setup.mockInput.pressEnter();
  await item.app.waitForIdle();
  item.app.scrollTranscript(-3);
  item.setup.resize(48, 12);
  await item.setup.flush();
  const text = item.app.transcript.findDescendantById('transcript-text');
  assert.ok(text instanceof TextRenderable);
  item.setup.renderer.startSelection(text, text.x, text.y);
  item.setup.renderer.updateSelection(text, text.x + 12, text.y, { finishDragging: true });
  assert.equal(item.app.hasTranscriptSelection(), true);
  assert.ok(item.setup.renderer.getSelection()?.getSelectedText());
});

test('Ctrl+C gives an active transcript selection precedence over cancellation', async (t) => {
  const provider = new PausedProvider();
  const item = await tui(provider);
  t.after(async () => {
    if (!item.setup.renderer.isDestroyed) item.app.close();
    await rm(item.workspace, { recursive: true, force: true });
  });

  await item.setup.mockInput.typeText('copy this active turn');
  item.setup.mockInput.pressEnter();
  await provider.started.promise;
  await item.setup.flush();
  const text = item.app.transcript.findDescendantById('transcript-text');
  assert.ok(text instanceof TextRenderable);
  item.setup.renderer.startSelection(text, text.x, text.y);
  item.setup.renderer.updateSelection(text, text.x + 8, text.y, { finishDragging: true });
  assert.equal(item.app.hasTranscriptSelection(), true);
  let continuedToDefault = false;
  item.setup.renderer._internalKeyInput.onInternal('keypress', (key) => {
    if (key.ctrl && key.name === 'c' && !key.defaultPrevented) continuedToDefault = true;
  });

  item.setup.mockInput.pressCtrlC();
  await item.setup.flush();
  assert.equal(continuedToDefault, false);
  assert.equal(provider.calls[0]?.options.signal?.aborted, false);
  assert.equal(item.setup.renderer.isDestroyed, false);
  provider.release.resolve();
  await item.app.waitForIdle();
  assert.notEqual(item.app.session.events.at(-1)?.type, 'turn.cancelled');
});

test('Ctrl+C never cancels or exits without a selection', async (t) => {
  const provider = new PausedProvider();
  const active = await tui(provider);
  t.after(async () => {
    if (!active.setup.renderer.isDestroyed) active.app.close();
    await rm(active.workspace, { recursive: true, force: true });
  });

  await active.setup.mockInput.typeText('cancel with Ctrl+C');
  active.setup.mockInput.pressEnter();
  await provider.started.promise;
  active.setup.mockInput.pressCtrlC();
  await active.setup.flush();
  assert.equal(provider.calls[0]?.options.signal?.aborted, false);
  assert.equal(active.setup.renderer.isDestroyed, false);
  provider.release.resolve();
  await active.app.waitForIdle();

  active.setup.mockInput.pressCtrlC();
  assert.equal(active.setup.renderer.isDestroyed, false);
});

test('Esc cancels an active turn, then exits and destroys the renderer while idle', async (t) => {
  const provider = new PausedProvider();
  const item = await tui(provider);
  t.after(async () => {
    if (!item.setup.renderer.isDestroyed) item.app.close();
    await rm(item.workspace, { recursive: true, force: true });
  });

  await item.setup.mockInput.typeText('cancel me');
  item.setup.mockInput.pressEnter();
  await provider.started.promise;
  item.setup.mockInput.pressEscape();
  await item.app.waitForIdle();
  assert.equal(provider.calls[0]?.options.signal?.aborted, true);
  assert.equal(item.setup.renderer.isDestroyed, false);
  assert.equal(item.app.session.events.at(-1)?.type, 'turn.cancelled');
  await item.setup.flush();
  assert.match(item.setup.captureCharFrame(), /Turn cancelled/);
  assert.equal(item.setup.renderer.isDestroyed, false);
  item.setup.mockInput.pressEscape();
  assert.equal(item.setup.renderer.isDestroyed, true);
});

test('test renderer presents normalized approvals and allow, deny, and Esc keep the TUI usable', async (t) => {
  const write = async (callId: string, path: string, content: string) => {
    const item = await tui(new ApprovalProvider({ type: 'provider.tool.call', callId, name: 'write_file', arguments: JSON.stringify({ path, content }) }));
    t.after(() => cleanup(item));
    return item;
  };
  const allowed = await write('allow', 'allowed.txt', 'yes');
  await allowed.setup.mockInput.typeText('write it');
  allowed.setup.mockInput.pressEnter();
  await new Promise<void>((resolve) => setTimeout(resolve, 50));
  await allowed.setup.waitForFrame((frame) => frame.includes('Approval required'));
  assert.match(allowed.setup.captureCharFrame(), /Target: allowed.txt/);
  await allowed.setup.mockInput.typeText('next draft');
  allowed.setup.mockInput.pressKey('a', { ctrl: true });
  await allowed.app.waitForIdle();
  assert.equal(await readFile(join(allowed.workspace, 'allowed.txt'), 'utf8'), 'yes');
  assert.equal(allowed.app.input.plainText, 'next draft');

  const denied = await write('deny', 'denied.txt', 'no');
  execFileSync('git', ['init', '--quiet'], { cwd: denied.workspace });
  await writeFile(join(denied.workspace, 'denied.txt'), 'before');
  await denied.setup.mockInput.typeText('deny it');
  denied.setup.mockInput.pressEnter();
  await new Promise<void>((resolve) => setTimeout(resolve, 50));
  await denied.setup.waitForFrame((frame) => frame.includes('[Ctrl+A]llow once'));
  assert.match(denied.setup.captureCharFrame(), /Target: denied.txt \(already dirty\)/);
  denied.setup.mockInput.pressKey('d', { ctrl: true });
  await denied.app.waitForIdle();
  assert.equal(await readFile(join(denied.workspace, 'denied.txt'), 'utf8'), 'before');
  assert.equal(denied.app.work.some((entry) => entry.item.status === 'denied'), true);

  const framing = await tui(new ApprovalProvider({ type: 'provider.tool.call', callId: 'framing', name: 'write_file', arguments: '{"path":"framing.txt","content":"body","allowTextFramingChange":true}' }));
  t.after(() => cleanup(framing));
  await framing.setup.mockInput.typeText('show exceptional intent');
  framing.setup.mockInput.pressEnter();
  await framing.setup.waitForFrame((frame) => frame.includes('Existing text framing will change'));
  assert.match(framing.setup.captureCharFrame(), /Target: framing.txt/);
  framing.setup.mockInput.pressKey('d', { ctrl: true });
  await framing.app.waitForIdle();

  const cancelled = await write('cancel', 'cancelled.txt', 'never');
  await cancelled.setup.mockInput.typeText('cancel it');
  cancelled.setup.mockInput.pressEnter();
  await new Promise<void>((resolve) => setTimeout(resolve, 50));
  await cancelled.setup.waitForFrame((frame) => frame.includes('Approval required'));
  cancelled.setup.resize(48, 12);
  cancelled.setup.mockInput.pressEscape();
  await cancelled.app.waitForIdle();
  assert.equal(cancelled.app.session.events.at(-1)?.type, 'turn.cancelled');
  assert.equal(cancelled.app.work.some((entry) => entry.item.status === 'cancelled'), true);
  assert.ok(cancelled.app.input.width > 0 && cancelled.app.input.height >= 3);

  const process = await tui(new ApprovalProvider({ type: 'provider.tool.call', callId: 'process', name: 'run_process', arguments: '{"executable":"node","arguments":["-e","0"]}' }));
  t.after(() => cleanup(process));
  await process.setup.mockInput.typeText('show process');
  process.setup.mockInput.pressEnter();
  await new Promise<void>((resolve) => setTimeout(resolve, 50));
  await process.setup.waitForFrame((frame) => frame.includes('not OS/workspace sandboxed'));
  assert.match(process.setup.captureCharFrame(), /Executable: node/);
  process.setup.mockInput.pressKey('d', { ctrl: true });
  await process.app.waitForIdle();
});

test('test renderer presents bounded generic external approval details', async (t) => {
  const tool: ToolDefinition = {
    name: 'fixture_external', description: 'Fixture external tool.',
    execution: { effect: 'unknown_external', replaySafety: 'not_replay_safe', source: { kind: 'adapter', id: 'fixture' }, descriptor: { service: 'Fixture', origin: 'https://fixture.invalid', resource: 'safe', operation: 'inspect', credentialConfigured: true } },
    inputSchema: { type: 'object', properties: {}, additionalProperties: false }, execute: async () => ({}),
  };
  const item = await tui(new ApprovalProvider({ type: 'provider.tool.call', callId: 'external', name: tool.name, arguments: '{}' }), { additionalTools: [tool] });
  t.after(() => cleanup(item));
  await item.setup.mockInput.typeText('show external');
  item.setup.mockInput.pressEnter();
  await item.setup.waitForFrame((frame) => frame.includes('External effect is unknown'));
  const frame = item.setup.captureCharFrame();
  assert.match(frame, /Service: Fixture[\s\S]*Origin: https:\/\/fixture\.invalid[\s\S]*Credential configured: yes/);
  item.setup.mockInput.pressKey('d', { ctrl: true });
  await item.app.waitForIdle();
});

test('test renderer warns before authenticated Chrome browser access', async (t) => {
  const tool: ToolDefinition = {
    name: 'chrome:click', description: 'Chrome fixture.',
    execution: { effect: 'browser_interaction', replaySafety: 'not_replay_safe', source: { kind: 'adapter', id: 'chrome-devtools' }, descriptor: { service: 'Chrome DevTools', operation: 'browser interaction', warning: 'This server may access content in the logged-in browser session.' } },
    inputSchema: { type: 'object', properties: {}, additionalProperties: false }, execute: async () => ({}),
  };
  const item = await tui(new ApprovalProvider({ type: 'provider.tool.call', callId: 'chrome', name: tool.name, arguments: '{}' }), { additionalTools: [tool] });
  t.after(() => cleanup(item));
  await item.setup.mockInput.typeText('reproduce it');
  item.setup.mockInput.pressEnter();
  await item.setup.waitForFrame((frame) => frame.includes('logged-in browser'));
  item.setup.mockInput.pressKey('d', { ctrl: true });
  await item.app.waitForIdle();
});
