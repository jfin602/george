import {
  BoxRenderable,
  CliRenderEvents,
  ScrollBoxRenderable,
  TextareaRenderable,
  TextRenderable,
  createHostClipboard,
  type CliRenderer,
  type HostClipboardService,
  type KeyBinding as TextareaKeyBinding,
} from '@opentui/core';

import { type AgentLoopApplicationService } from '../application/index.ts';
import { createSession, type ApprovalRequest, type ApprovalResolver, type ApplicationEvent, type ContextDiagnostics, type Session, type TranscriptEntry } from '../core/index.ts';

export const COMPOSER_KEY_BINDINGS: TextareaKeyBinding[] = [
  { name: 'return', action: 'submit' },
  { name: 'return', shift: true, action: 'newline' },
];

type Clipboard = Pick<HostClipboardService, 'read' | 'dispose'>;

export type GeorgeTuiOptions = Readonly<{
  renderer: CliRenderer;
  service: AgentLoopApplicationService;
  provider: string;
  model: string;
  workspace?: string;
  approvals: ApprovalResolver;
  clipboard?: Clipboard;
}>;

function transcriptText(entries: readonly TranscriptEntry[]): string {
  return entries.map((entry) => `${entry.role === 'user' ? 'You' : 'George'}\n${entry.text}`).join('\n\n');
}

function activityFor(event: ApplicationEvent): string | undefined {
  switch (event.type) {
    case 'provider.response.started': return 'Thinking…';
    case 'provider.response.completed': return 'Response complete';
    case 'tool.requested': return `Tool requested: ${event.name}`;
    case 'tool.started': return `Running tool: ${event.name}`;
    case 'tool.completed': return `Tool completed: ${event.name}`;
    case 'tool.failed': return `Tool failed: ${event.name}`;
    case 'approval.requested': return `Approval required: ${event.request.toolName}`;
    case 'approval.allowed': return `Approved once: ${event.request.toolName}`;
    case 'approval.denied': return `Denied: ${event.request.toolName}`;
    case 'turn.cancelled': return 'Turn cancelled';
    case 'turn.failed': return `Failed: ${event.error.message}`;
    default: return undefined;
  }
}

function bounded(value: string, limit = 72): string {
  const normalized = value.replace(/\s+/g, ' ').trim();
  return normalized.length <= limit ? normalized : `${normalized.slice(0, limit - 1)}…`;
}

function contextText(diagnostics: ContextDiagnostics): string {
  const categories = Object.entries(diagnostics.categoryTokens)
    .filter(([, tokens]) => tokens > 0)
    .map(([category, tokens]) => `${category} ${tokens}`)
    .join(', ') || 'none';
  const skills = diagnostics.activeSourceIds
    .filter((id) => id.startsWith('skill:'))
    .map((id) => bounded(id.slice('skill:'.length), 64))
    .join(', ') || 'none';
  return [
    `Context estimated ${diagnostics.estimatedTokens} tokens; profile ${bounded(diagnostics.profileId, 13)}; input ${diagnostics.estimatedTokens}/${diagnostics.providerInputBudget}`,
    `Headroom ${diagnostics.remainingHeadroom}; pressure ${diagnostics.softPressure ? 'yes' : 'no'}; categories ${bounded(categories, 26)}`,
    ...(skills === 'none' ? [] : [`Active skill: ${skills}`]),
  ].join('\n');
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
  private readonly contextView: TextRenderable;
  private readonly activityView: TextRenderable;
  private readonly approvalView: TextRenderable;
  private readonly commandView: TextRenderable;
  private readonly statusDetails: string;
  private readonly approvals: ApprovalResolver;
  private readonly clipboard: Clipboard;
  private readonly ownsClipboard: boolean;
  private readonly done: Promise<void>;
  private resolveDone!: () => void;
  private controller: AbortController | undefined;
  private active: Promise<void> | undefined;
  private pendingApproval: ApprovalRequest | undefined;
  private closed = false;

  constructor(options: GeorgeTuiOptions) {
    this.renderer = options.renderer;
    this.service = options.service;
    this.approvals = options.approvals;
    this.clipboard = options.clipboard ?? createHostClipboard();
    this.ownsClipboard = options.clipboard === undefined;
    this.session = createSession({ workspace: options.workspace ?? options.service.workspace.root });
    this.statusDetails = `${options.provider} · ${options.model} · ${this.session.workspace}`;
    this.done = new Promise<void>((resolve) => { this.resolveDone = resolve; });

    const layout = new BoxRenderable(this.renderer, { id: 'george', width: '100%', height: '100%', flexDirection: 'column', padding: 1 });
    layout.add(new TextRenderable(this.renderer, { id: 'header', width: '100%', height: 1, flexShrink: 0, content: 'George — local coding agent' }));
    this.statusView = new TextRenderable(this.renderer, { id: 'status', width: '100%', height: 1, flexShrink: 0, content: this.status('Ready') });
    layout.add(this.statusView);
    this.contextView = new TextRenderable(this.renderer, { id: 'context', width: '100%', height: 2, flexShrink: 0, content: 'Context: awaiting first turn' });
    layout.add(this.contextView);
    this.transcript = new ScrollBoxRenderable(this.renderer, { id: 'transcript', flexGrow: 1, scrollY: true, stickyScroll: true, stickyStart: 'bottom', border: true, title: 'Transcript' });
    this.transcriptView = new TextRenderable(this.renderer, { id: 'transcript-text', content: '' });
    this.transcript.add(this.transcriptView);
    layout.add(this.transcript);
    this.activityView = new TextRenderable(this.renderer, { id: 'activity', width: '100%', height: 1, flexShrink: 0, content: 'Idle' });
    layout.add(this.activityView);
    this.approvalView = new TextRenderable(this.renderer, { id: 'approval', width: '100%', height: 0, flexShrink: 0, content: '' });
    layout.add(this.approvalView);
    this.commandView = new TextRenderable(this.renderer, { id: 'commands', width: '100%', height: 0, flexShrink: 0, content: '' });
    layout.add(this.commandView);
    this.input = new TextareaRenderable(this.renderer, {
      id: 'input', height: 3, minHeight: 3, maxHeight: 6, wrapMode: 'word', placeholder: 'Message George (Enter submits, Ctrl+V pastes, Shift+Enter adds a line)', keyBindings: COMPOSER_KEY_BINDINGS,
      onSubmit: () => { void this.submit(); },
    });
    layout.add(this.input);
    this.renderer.root.add(layout);
    this.renderer._internalKeyInput.onInternal('keypress', (key) => {
      if (key.ctrl && key.name === 'c') {
        key.preventDefault();
        this.ctrlC();
      } else if (this.pendingApproval && key.ctrl && key.name === 'a') {
        key.preventDefault();
        this.decide('allow_once');
      } else if (this.pendingApproval && key.ctrl && key.name === 'd') {
        key.preventDefault();
        this.decide('deny');
      } else if (key.ctrl && key.name === 'v') {
        key.preventDefault();
        void this.pasteClipboard();
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
    if (text.trim() === '/skills') {
      this.input.clear();
      await this.showSkills();
      return;
    }
    if (text.trimStart().startsWith('/skill')) {
      const command = /^\/skill\s+(\S+)\s+([\s\S]*\S)\s*$/.exec(text);
      if (!command) {
        this.showCommand('Usage: /skill <id> <message>');
        return;
      }
      try {
        const submission = await this.service.skillTurn(command[1]!, command[2]!);
        await this.start(submission.input, submission.activatedSkills);
      } catch (error) {
        this.showCommand(`Skill activation: ${error instanceof Error ? bounded(error.message, 180) : 'failed'}`);
      }
      return;
    }
    await this.start(text);
  }

  private async start(text: string, activatedSkills?: readonly string[]): Promise<void> {
    this.input.clear();
    this.controller = new AbortController();
    this.statusView.content = this.status('Working');
    this.activityView.content = 'Starting turn';
    this.active = this.consume(text, this.controller.signal, activatedSkills).finally(() => {
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
    if (this.ownsClipboard) void this.clipboard.dispose();
    this.finish();
  }

  private async consume(input: string, signal: AbortSignal, activatedSkills?: readonly string[]): Promise<void> {
    for await (const event of this.service.run({ session: this.session, input, signal, ...(activatedSkills === undefined ? {} : { activatedSkills }) })) {
      this.render(event);
    }
  }

  private async pasteClipboard(): Promise<void> {
    const result = await this.clipboard.read({ preferredTypes: ['text/plain'] });
    if (result.status !== 'read') return;
    this.input.insertText(new TextDecoder().decode(result.representation.bytes));
    this.renderer.requestRender();
  }

  private render(event: ApplicationEvent): void {
    this.transcriptView.content = transcriptText(this.session.transcript);
    if (event.type === 'context.assembled') {
      this.contextView.content = contextText(event.diagnostics);
      this.contextView.height = event.diagnostics.activeSourceIds.some((id) => id.startsWith('skill:')) ? 3 : 2;
    }
    if (event.type === 'approval.requested') {
      this.pendingApproval = event.request;
      this.approvalView.content = this.approvalText(event.request);
      this.approvalView.height = 6;
    }
    if (event.type === 'approval.allowed' || event.type === 'approval.denied' || event.type === 'turn.cancelled') {
      this.pendingApproval = undefined;
      this.approvalView.content = '';
      this.approvalView.height = 0;
    }
    const activity = activityFor(event);
    if (activity) this.activityView.content = activity;
    this.renderer.requestRender();
  }

  private status(state: string): string {
    return `${state} · ${this.statusDetails}`;
  }

  private async showSkills(): Promise<void> {
    try {
      const catalog = await this.service.skillCatalog();
      const shown = catalog.skills.slice(0, 3);
      const details = shown.map((skill) => `${bounded(skill.id, 48)} — ${bounded(skill.description, 84)}`);
      if (catalog.skills.length > shown.length) details.push(`… ${catalog.skills.length - shown.length} more skill(s)`);
      if (catalog.collisions.length > 0) details.push(`Collisions: ${catalog.collisions.slice(0, 2).map((item) => bounded(item.name, 32)).join(', ')} (use qualified IDs)`);
      if (catalog.issues.length > 0) details.push(`Discovery issues: ${catalog.issues.length}`);
      this.showCommand(details.length === 0 ? 'Skills: none discovered' : `Skills (${catalog.skills.length}):\n${details.slice(0, 4).join('\n')}`);
    } catch (error) {
      this.showCommand(`Skills unavailable: ${error instanceof Error ? bounded(error.message, 180) : 'failed'}`);
    }
  }

  private showCommand(content: string): void {
    this.commandView.content = content;
    this.commandView.height = Math.min(5, content.split('\n').length);
    this.renderer.requestRender();
  }

  private decide(decision: 'allow_once' | 'deny'): void {
    const request = this.pendingApproval;
    if (request && this.approvals.decide(request.id, decision)) this.activityView.content = decision === 'allow_once' ? `Approved once: ${request.toolName}` : `Denied: ${request.toolName}`;
  }

  private approvalText(request: ApprovalRequest): string {
    const detail = request.target
      ? `Target: ${request.target.path}${request.target.alreadyDirty ? ' (already dirty)' : ''}`
      : `Executable: ${request.process!.executable}\nArgv: ${JSON.stringify(request.process!.argv)}\nCwd: ${request.process!.cwd}\nWarning: ${request.process!.warning}`;
    return `Approval required — ${request.toolName} (${request.risk})\n${detail}\n[Ctrl+A]llow once  [Ctrl+D]eny`;
  }

  private finish(): void {
    this.resolveDone();
  }
}
