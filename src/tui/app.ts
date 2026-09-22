import {
  BoxRenderable,
  CliRenderEvents,
  ScrollBoxRenderable,
  TextareaRenderable,
  TextRenderable,
  type CliRenderer,
  type KeyBinding as TextareaKeyBinding,
} from '@opentui/core';

import { type AgentLoopApplicationService } from '../application/index.ts';
import { createSession, type ApplicationEvent, type Session, type TranscriptEntry } from '../core/index.ts';

export const COMPOSER_KEY_BINDINGS: TextareaKeyBinding[] = [
  { name: 'return', action: 'submit' },
  { name: 'return', shift: true, action: 'newline' },
];

export type GeorgeTuiOptions = Readonly<{
  renderer: CliRenderer;
  service: AgentLoopApplicationService;
  provider: string;
  model: string;
  workspace?: string;
}>;

function transcriptText(entries: readonly TranscriptEntry[]): string {
  return entries.map((entry) => `${entry.role === 'user' ? 'You' : 'George'}\n${entry.text}`).join('\n\n');
}

function activityFor(event: ApplicationEvent): string | undefined {
  switch (event.type) {
    case 'provider.response.started': return 'Thinking…';
    case 'provider.response.completed': return 'Response complete';
    case 'tool.requested': return `Read-only tool requested: ${event.name}`;
    case 'tool.started': return `Running read-only tool: ${event.name}`;
    case 'tool.completed': return `Read-only tool completed: ${event.name}`;
    case 'tool.failed': return `Read-only tool failed: ${event.name}`;
    case 'turn.cancelled': return 'Turn cancelled';
    case 'turn.failed': return `Failed: ${event.error.message}`;
    default: return undefined;
  }
}

/** A presentation-only adapter from canonical agent-loop events to OpenTUI renderables. */
export class GeorgeTui {
  readonly input: TextareaRenderable;
  readonly transcript: ScrollBoxRenderable;
  readonly session: Session;
  private readonly renderer: CliRenderer;
  private readonly service: AgentLoopApplicationService;
  private readonly transcriptView: TextRenderable;
  private readonly statusView: TextRenderable;
  private readonly activityView: TextRenderable;
  private readonly statusDetails: string;
  private readonly done: Promise<void>;
  private resolveDone!: () => void;
  private controller: AbortController | undefined;
  private active: Promise<void> | undefined;
  private closed = false;

  constructor(options: GeorgeTuiOptions) {
    this.renderer = options.renderer;
    this.service = options.service;
    this.session = createSession({ workspace: options.workspace ?? options.service.workspace.root });
    this.statusDetails = `${options.provider} · ${options.model} · ${this.session.workspace}`;
    this.done = new Promise<void>((resolve) => { this.resolveDone = resolve; });

    const layout = new BoxRenderable(this.renderer, { id: 'george', width: '100%', height: '100%', flexDirection: 'column', padding: 1 });
    layout.add(new TextRenderable(this.renderer, { id: 'header', width: '100%', height: 1, flexShrink: 0, content: 'George — local coding agent' }));
    this.statusView = new TextRenderable(this.renderer, { id: 'status', width: '100%', height: 1, flexShrink: 0, content: this.status('Ready') });
    layout.add(this.statusView);
    this.transcript = new ScrollBoxRenderable(this.renderer, { id: 'transcript', flexGrow: 1, scrollY: true, stickyScroll: true, stickyStart: 'bottom', border: true, title: 'Transcript' });
    this.transcriptView = new TextRenderable(this.renderer, { id: 'transcript-text', content: '' });
    this.transcript.add(this.transcriptView);
    layout.add(this.transcript);
    this.activityView = new TextRenderable(this.renderer, { id: 'activity', width: '100%', height: 1, flexShrink: 0, content: 'Idle' });
    layout.add(this.activityView);
    this.input = new TextareaRenderable(this.renderer, {
      id: 'input', height: 3, minHeight: 3, maxHeight: 6, wrapMode: 'word', placeholder: 'Message George (Enter submits, Shift+Enter adds a line)', keyBindings: COMPOSER_KEY_BINDINGS,
      onSubmit: () => { void this.submit(); },
    });
    layout.add(this.input);
    this.renderer.root.add(layout);
    this.renderer._internalKeyInput.onInternal('keypress', (key) => {
      if (key.ctrl && key.name === 'c') {
        key.preventDefault();
        this.ctrlC();
      }
    });
    this.renderer.on(CliRenderEvents.RESIZE, () => this.renderer.requestRender());
    this.renderer.on(CliRenderEvents.DESTROY, () => {
      this.controller?.abort();
      this.closed = true;
      this.finish();
    });
    this.input.focus();
  }

  async run(): Promise<void> {
    return this.done;
  }

  async submit(): Promise<void> {
    if (this.active || this.closed) return;
    const text = this.input.plainText;
    if (!text.trim()) return;
    this.input.clear();
    this.controller = new AbortController();
    this.statusView.content = this.status('Working');
    this.activityView.content = 'Starting turn';
    this.active = this.consume(text, this.controller.signal).finally(() => {
      this.controller = undefined;
      this.active = undefined;
      if (!this.closed) this.statusView.content = this.status('Ready');
      this.input.focus();
    });
    await this.active;
  }

  async waitForIdle(): Promise<void> {
    await this.active;
  }

  ctrlC(): boolean {
    if (this.controller) {
      this.activityView.content = 'Cancelling…';
      this.controller.abort();
      return true;
    }
    this.close();
    return true;
  }

  scrollTranscript(lines: number): void {
    this.transcript.scrollBy(lines);
  }

  close(): void {
    if (this.closed) return;
    this.closed = true;
    this.controller?.abort();
    this.renderer.destroy();
    this.finish();
  }

  private async consume(input: string, signal: AbortSignal): Promise<void> {
    for await (const event of this.service.run({ session: this.session, input, signal })) {
      this.render(event);
    }
  }

  private render(event: ApplicationEvent): void {
    this.transcriptView.content = transcriptText(this.session.transcript);
    const activity = activityFor(event);
    if (activity) this.activityView.content = activity;
    this.renderer.requestRender();
  }

  private status(state: string): string {
    return `${state} · ${this.statusDetails}`;
  }

  private finish(): void {
    this.resolveDone();
  }
}
