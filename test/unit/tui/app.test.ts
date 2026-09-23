import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { RGBA } from '@opentui/core';
import { createTestRenderer } from '@opentui/core/testing';

import {
  GeorgeError,
  PendingApprovalPort,
  type ModelProvider,
  type ProviderEvent,
  type ProviderRequest,
  type ProviderStreamOptions,
} from '../../../src/core/index.ts';
import { createOneTurnApplicationService, type OneTurnServiceOptions } from '../../../src/application/index.ts';
import { GeorgeTui, NEON_THEME, type GeorgeTuiOptions } from '../../../src/tui/app.ts';

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

async function tui(
  provider: ModelProvider,
  options: Omit<OneTurnServiceOptions, 'provider' | 'workspace' | 'approvalPort'> = {},
  uiOptions: Pick<GeorgeTuiOptions, 'clipboard'> = {},
) {
  const workspace = await mkdtemp(join(tmpdir(), 'george-tui-'));
  await writeFile(join(workspace, 'BOOT.md'), 'fixture boot');
  const setup = await createTestRenderer({ width: 72, height: 18, kittyKeyboard: true });
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
  const frame = item.setup.captureCharFrame();
  assert.match(item.app.session.transcript.map((entry) => entry.text).join('\n'), /Inspect BOOT/);
  assert.match(frame, /streamed answer/);
});

test('uses the blue neon palette for the transcript and focused composer', async (t) => {
  const item = await tui(new ScriptedProvider([]));
  t.after(() => cleanup(item));

  assert.deepEqual(item.app.transcript.backgroundColor.toInts(), RGBA.fromHex(NEON_THEME.panel).toInts());
  assert.deepEqual(item.app.transcript.borderColor.toInts(), RGBA.fromHex(NEON_THEME.border).toInts());
  assert.deepEqual(item.app.input.backgroundColor.toInts(), RGBA.fromHex(NEON_THEME.panel).toInts());
  assert.deepEqual(item.app.input.cursorColor.toInts(), RGBA.fromHex(NEON_THEME.cyan).toInts());
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
  assert.match(item.setup.captureCharFrame(), /builtin:focused/);
  assert.equal(provider.calls.length, 0);

  await item.setup.mockInput.typeText('/skill focused write this');
  item.setup.mockInput.pressEnter();
  await item.setup.waitForFrame((frame) => frame.includes('Ambiguous skill focused'));
  assert.equal(provider.calls.length, 0);
  assert.equal(item.app.input.plainText, '/skill focused write this');

  item.app.input.clear();
  item.app.input.focus();
  await item.setup.flush();
  await item.setup.mockInput.typeText('/skill missing write this');
  item.setup.mockInput.pressEnter();
  await item.setup.waitForFrame((frame) => frame.includes('Unknown skill missing'));
  assert.equal(provider.calls.length, 0);
  assert.equal(item.app.input.plainText, '/skill missing write this');

  item.app.input.clear();
  item.app.input.focus();
  await item.setup.flush();
  await item.setup.mockInput.typeText('/skill workspace:focused use it');
  await item.app.submit();
  await item.setup.flush();
  assert.equal(provider.calls.length, 1);
  assert.match(provider.calls[0]?.request.instructions ?? '', /WORKSPACE BODY/);
  assert.match(item.setup.captureCharFrame(), /Context estimated .*profile .*input/);
  assert.match(item.setup.captureCharFrame(), /Headroom .*pressure no/);
  assert.match(item.setup.captureCharFrame(), /categories/);
  assert.match(item.setup.captureCharFrame(), /Active skill: workspace:focused/);

  await item.setup.mockInput.typeText('normal turn');
  await item.app.submit();
  assert.equal(provider.calls.length, 2);
  assert.doesNotMatch(provider.calls[1]?.request.instructions ?? '', /WORKSPACE BODY/);

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
  await denied.setup.waitForFrame((frame) => frame.includes('[Ctrl+A]llow once'));
  assert.match(denied.setup.captureCharFrame(), /Target: denied.txt \(already dirty\)/);
  denied.setup.mockInput.pressKey('d', { ctrl: true });
  await denied.app.waitForIdle();
  assert.equal(await readFile(join(denied.workspace, 'denied.txt'), 'utf8'), 'before');

  const cancelled = await write('cancel', 'cancelled.txt', 'never');
  await cancelled.setup.mockInput.typeText('cancel it');
  cancelled.setup.mockInput.pressEnter();
  await cancelled.setup.waitForFrame((frame) => frame.includes('Approval required'));
  cancelled.setup.resize(48, 12);
  cancelled.setup.mockInput.pressEscape();
  await cancelled.app.waitForIdle();
  assert.equal(cancelled.app.session.events.at(-1)?.type, 'turn.cancelled');
  assert.ok(cancelled.app.input.width > 0 && cancelled.app.input.height >= 3);

  const process = await tui(new ApprovalProvider({ type: 'provider.tool.call', callId: 'process', name: 'run_process', arguments: '{"executable":"node","arguments":["-e","0"]}' }));
  t.after(() => cleanup(process));
  await process.setup.mockInput.typeText('show process');
  process.setup.mockInput.pressEnter();
  await process.setup.waitForFrame((frame) => frame.includes('not OS/workspace sandboxed'));
  assert.match(process.setup.captureCharFrame(), /Executable: node/);
  process.setup.mockInput.pressKey('d', { ctrl: true });
  await process.app.waitForIdle();
});
