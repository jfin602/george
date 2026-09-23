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
  PendingApprovalPort,
  type ModelProvider,
  type ProviderEvent,
  type ProviderRequest,
  type ProviderStreamOptions,
} from '../../../src/core/index.ts';
import { createOneTurnApplicationService, WorkProjection, type OneTurnServiceOptions } from '../../../src/application/index.ts';
import { GeorgeTui, NEON_THEME, renderTranscript, type GeorgeTuiOptions, type TranscriptWorkEntry } from '../../../src/tui/app.ts';

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
  assert.match(running, /Work · running\n│   Read src\/app\.ts/);
  assert.equal((visible.match(/Read src\/app\.ts \(12 bytes\)/g) ?? []).length, 1);
  assert.match(visible, /Context source workspace:AGENTS\.md: loaded/);
  assert.match(visible, /Listed src \(2 entries\)/);
  assert.match(visible, /Searched src \(1 matches in 3 files\)\n│   Query: needle/);
  assert.match(visible, /Inspected Git status/);
  assert.match(visible, /Inspected Git diff/);
  assert.match(visible, /Wrote src\/app\.ts \(24 bytes\)/);
  assert.match(visible, /Executable: node\n│   Argv: \["--check","src\/app\.ts"\]\n│   Cwd: \.\n│   Exit: 0\n│   Outcome: completed/);
  assert.match(visible, /Work · succeeded\n│   Validation passed/);
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
  assert.match(visible, /Work · succeeded/);
  assert.match(context, /user: first user question\n\nassistant: first George answer/);
  assert.doesNotMatch(context, /Work ·|Context source|│|\nYou\n|\nGeorge\n/);
});

test('provider failure stays visible once with safe metadata and never enters later model context', async (t) => {
  const timeout = new GeorgeError('provider', 'LM Studio request timed out after 30000 ms.', {
    cause: { kind: 'timeout', status: 504, providerEventType: 'response.error', raw: 'secret'.repeat(10_000) },
  });
  const provider = new class implements ModelProvider {
    calls: Array<{ request: ProviderRequest; options: ProviderStreamOptions }> = [];
    async *stream(request: ProviderRequest, options: ProviderStreamOptions = {}): AsyncGenerator<ProviderEvent> {
      this.calls.push({ request, options });
      if (this.calls.length === 1) {
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
  assert.match(visible, /Error\nProvider failure\nCode: provider\nLM Studio request timed out after 30000 ms\.\nKind: timeout\nHTTP status: 504\nProvider event: response\.error/);
  assert.doesNotMatch(visible, /secret/);
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
  assert.equal(denied.app.work.some((entry) => entry.item.status === 'denied'), true);

  const cancelled = await write('cancel', 'cancelled.txt', 'never');
  await cancelled.setup.mockInput.typeText('cancel it');
  cancelled.setup.mockInput.pressEnter();
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
  await process.setup.waitForFrame((frame) => frame.includes('not OS/workspace sandboxed'));
  assert.match(process.setup.captureCharFrame(), /Executable: node/);
  process.setup.mockInput.pressKey('d', { ctrl: true });
  await process.app.waitForIdle();
});
