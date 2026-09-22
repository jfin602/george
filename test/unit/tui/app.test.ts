import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { createTestRenderer } from '@opentui/core/testing';

import {
  GeorgeError,
  type ModelProvider,
  type ProviderEvent,
  type ProviderRequest,
  type ProviderStreamOptions,
} from '../../../src/core/index.ts';
import { createOneTurnApplicationService } from '../../../src/application/index.ts';
import { GeorgeTui } from '../../../src/tui/app.ts';

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
    yield { type: 'provider.response.started' };
    if (this.tool && this.calls.length === 1) yield { type: 'provider.tool.call', callId: 'call-1', name: 'read_file', arguments: '{"path":"BOOT.md"}' };
    this.started.resolve();
    await Promise.race([
      this.release.promise,
      new Promise<never>((_resolve, reject) => options.signal?.addEventListener('abort', () => reject(new GeorgeError('cancelled', 'Stopped')), { once: true })),
    ]);
    yield { type: 'provider.text.delta', delta: 'streamed answer' };
    yield { type: 'provider.response.completed' };
  }
}

async function tui(provider: ModelProvider) {
  const workspace = await mkdtemp(join(tmpdir(), 'george-tui-'));
  const setup = await createTestRenderer({ width: 72, height: 18, kittyKeyboard: true });
  const service = await createOneTurnApplicationService({ provider, workspace });
  const app = new GeorgeTui({ renderer: setup.renderer, service, provider: 'LM Studio', model: 'test-model' });
  return { workspace, setup, app };
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
  const frame = item.setup.captureCharFrame();
  assert.match(frame, /You/);
  assert.match(frame, /Inspect BOOT/);
  assert.match(frame, /streamed answer/);
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

test('Ctrl+C cancels an active turn, then exits and destroys the renderer while idle', async (t) => {
  const provider = new PausedProvider();
  const item = await tui(provider);
  t.after(async () => {
    if (!item.setup.renderer.isDestroyed) item.app.close();
    await rm(item.workspace, { recursive: true, force: true });
  });

  await item.setup.mockInput.typeText('cancel me');
  item.setup.mockInput.pressEnter();
  await provider.started.promise;
  item.setup.mockInput.pressCtrlC();
  await item.app.waitForIdle();
  assert.equal(provider.calls[0]?.options.signal?.aborted, true);
  assert.equal(item.setup.renderer.isDestroyed, false);
  assert.equal(item.app.session.events.at(-1)?.type, 'turn.cancelled');
  assert.equal(item.setup.renderer.isDestroyed, false);
  item.setup.mockInput.pressCtrlC();
  assert.equal(item.setup.renderer.isDestroyed, true);
});
