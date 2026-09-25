import {
  BoxRenderable,
  CliRenderEvents,
  ScrollBoxRenderable,
  StyledText,
  TextareaRenderable,
  TextRenderable,
  bold,
  createHostClipboard,
  fg,
  type CliRenderer,
  type HostClipboardService,
  type KeyBinding as TextareaKeyBinding,
} from '@opentui/core';

import { CodingWorkflowApplicationService, type AgentLoopApplicationService } from '../application/index.ts';
import { createSession, type ApprovalRequest, type ApprovalResolver, type ApplicationEvent, type ContextDiagnostics, type Measurement, type Session, type TranscriptEntry, type WorkItem } from '../core/index.ts';
import { type TaskState } from '../tasks/index.ts';

export const COMPOSER_KEY_BINDINGS: TextareaKeyBinding[] = [
  { name: 'return', action: 'submit' },
  { name: 'return', shift: true, action: 'newline' },
  { name: 'a', ctrl: true, action: 'select-all' },
];

export const NEON_THEME = {
  background: '#04130d',
  transcript: '#25292b',
  foreground: '#d7ffe8',
  muted: '#7dbf9f',
  green: '#18d976',
  mint: '#5cffb1',
  border: '#199958',
  user: '#38bdf8',
  assistant: '#5cffb1',
  error: '#ff6b6b',
} as const;

const ASCII_BORDER = {
  topLeft: '+', topRight: '+', bottomLeft: '+', bottomRight: '+',
  horizontal: '-', vertical: '|', topT: '+', bottomT: '+', leftT: '+', rightT: '+', cross: '+',
} as const;

type Clipboard = Pick<HostClipboardService, 'read' | 'writeText' | 'dispose'>;
type ThinkingTimer = ReturnType<typeof setInterval> | number;

/** Presentation-only clock seam so thinking animation stays deterministic in tests. */
export type ThinkingClock = Readonly<{
  setInterval(callback: () => void, delayMs: number): ThinkingTimer;
  clearInterval(timer: ThinkingTimer): void;
}>;

export type GeorgeTuiOptions = Readonly<{
  renderer: CliRenderer;
  service: AgentLoopApplicationService | CodingWorkflowApplicationService;
  provider: string;
  model: string;
  workspace?: string;
  session?: Session;
  approvals: ApprovalResolver;
  clipboard?: Clipboard;
  thinkingClock?: ThinkingClock;
  /** Optional derived timing observer; presentation timing never changes canonical response timing. */
  onMeasurement?: (measurement: Measurement) => void;
}>;

export type TranscriptDiagnosticEntry = Readonly<{
  afterEntryCount: number;
  order?: number;
  title: 'Error' | 'Tool failure';
  source: string;
  code: string;
  message: string;
  details: readonly string[];
}>;

/** A TUI-only position for one stable, already-sanitized P3 work item. */
export type TranscriptWorkEntry = Readonly<{
  afterEntryCount: number;
  order?: number;
  item: WorkItem;
}>;

export type TuiPage = 'transcript' | 'task';

function taskAccess(state: TaskState): string {
  const entries = Object.entries(state.effectivePermissionExpectations)
    .filter(([, value]) => value !== undefined)
    .map(([name, value]) => `${name.replace(/([A-Z])/g, ' $1').toLowerCase()} ${value}`);
  return entries.length ? entries.join(', ') : 'standard approvals';
}

/** Bounded presentation projection; it reads canonical state but has no authority over it. */
export function renderTask(state: TaskState | undefined, work: readonly TranscriptWorkEntry[], width = Number.MAX_SAFE_INTEGER): string {
  if (!state) return 'No structured task is active.\n\nOrdinary chat remains available. Submit a GEORGE TASK FORMAT: 1 prompt to show task progress.';
  const definition = state.definition;
  const current = state.currentWorkUnit === undefined ? undefined : definition.workflow.find((item) => item.id === state.currentWorkUnit);
  const line = (text: string) => wrapTranscriptBody(bounded(text, 480), Math.max(1, width - 2)).join('\n  ');
  const requirements = definition.requirements.map((item) => `  ${item.id} (${state.requirements[item.id]}): ${line(item.text)}`);
  const workflow = definition.workflow.map((item) => `  ${item.id} (${state.workUnits[item.id]}): ${line(item.title)}${item.dependsOn.length ? ` [after ${item.dependsOn.join(', ')}]` : ''}`);
  const validations = definition.validations.map((item) => {
    const result = state.validations[item.id]!;
    return `  ${item.id} (${result.status}, ${result.attempts.length} attempt${result.attempts.length === 1 ? '' : 's'}): ${line(item.title)}`;
  });
  const recent = work.slice(-12).map(({ item }) => `  (${item.status}) ${line(workPrimary(item))}`);
  return [
    `${definition.task.title} · ${state.status}`,
    '', 'Goal', ...definition.goal.lines.map((item) => `  ${line(item)}`),
    '', `Current work: ${current ? `${current.id} (${state.workUnits[current.id]}) — ${line(current.title)}` : 'none'}`,
    '', 'Requirements', ...(requirements.length ? requirements : ['  none']),
    '', 'Workflow', ...(workflow.length ? workflow : ['  none']),
    '', 'Validation', ...(validations.length ? validations : ['  none']),
    '', `Corrections: ${state.corrections.length ? state.corrections.map((item) => `${item.validationId} #${item.cycle} ${item.status}`).join(', ') : 'none'}`,
    `Blockers: ${state.blockers.length ? state.blockers.slice(-4).map((item) => line(item)).join(' | ') : 'none'}`,
    `Effective access: ${taskAccess(state)}`,
    '', 'Recent work', ...(recent.length ? recent : ['  none']),
  ].join('\n');
}

export function taskHeader(state: TaskState | undefined): string {
  if (!state) return 'Task: ordinary chat · progress inactive · access standard approvals';
  const total = Object.keys(state.requirements).length;
  const verified = Object.values(state.requirements).filter((status) => status === 'verified').length;
  return bounded(`Task: ${state.definition.task.title} · ${state.currentWorkUnit ?? 'no active work'} · ${verified}/${total} requirements verified · ${state.status} · access ${taskAccess(state)}`, 480);
}

function formatElapsedDurationParts(value: number): Readonly<{ milliseconds: string; seconds: string }> {
  const ms = Math.max(0, Math.round(value));
  return { milliseconds: `${ms}ms`, seconds: `${(ms / 1_000).toFixed(2)}s` };
}

export function formatElapsedDuration(value: number): string {
  const { milliseconds, seconds } = formatElapsedDurationParts(value);
  return `${milliseconds} | ${seconds}`;
}

export function formatThinkingElapsed(value: number): string {
  const seconds = Math.floor(Math.max(0, value) / 1_000);
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}

/** Presentation-only timing table; all widths come from the formatted values. */
export function formatWorkflowTiming(timing: NonNullable<WorkItem['details']['timing']>): string[] {
  const entries = [
    ['Model calls', timing.providerMs],
    ['Tool calls', timing.toolMs],
    ['Approvals', timing.approvalMs],
    ['Other / harness', timing.otherMs],
    ['Total', timing.totalMs],
  ] as const;
  const values = entries.map(([label, value]) => {
    return { label, ...formatElapsedDurationParts(value) };
  });
  const labelWidth = Math.max(...values.map(({ label }) => label.length));
  const millisecondsWidth = Math.max(...values.map(({ milliseconds }) => milliseconds.length));
  const secondsWidth = Math.max(...values.map(({ seconds }) => seconds.length));
  return ['Time', ...values.map(({ label, milliseconds, seconds }) =>
    `${label.padEnd(labelWidth)} ${milliseconds.padStart(millisecondsWidth)} | ${seconds.padStart(secondsWidth)}`,
  )];
}

function plain(text: string): StyledText['chunks'][number] {
  return { __isChunk: true, text, attributes: 0 };
}

function errorFingerprint(code: string, message: string): string {
  return `${code}\u0000${message}`;
}

function safeCauseDetails(cause: unknown): string[] {
  if (!cause || typeof cause !== 'object' || Array.isArray(cause)) return [];
  const record = cause as Record<string, unknown>;
  const detail = (value: unknown, limit: number): string | undefined => {
    if (typeof value !== 'string') return undefined;
    const normalized = value.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim();
    return normalized ? bounded(normalized, limit) : undefined;
  };
  const details: string[] = [];
  const kind = detail(record.kind, 64);
  if (kind) details.push(`Kind: ${kind}`);
  if (typeof record.status === 'number' && Number.isInteger(record.status)) details.push(`HTTP status: ${record.status}`);
  const event = detail(record.providerEventType, 64) ?? detail(record.eventType, 64);
  if (event) details.push(`Provider event: ${event}`);
  const code = detail(record.providerCode, 128);
  if (code) details.push(`Provider code: ${code}`);
  const reason = detail(record.providerReason, 128);
  if (reason) details.push(`Provider reason: ${reason}`);
  return details;
}

/** Builds presentation-only styled transcript content; canonical transcript entries remain clean text. */
export function renderTranscript(
  entries: readonly TranscriptEntry[],
  diagnostics: readonly TranscriptDiagnosticEntry[],
  bodyWidth = Number.MAX_SAFE_INTEGER,
  work: readonly TranscriptWorkEntry[] = [],
): StyledText {
  const chunks: StyledText['chunks'] = [];
  let blockCount = 0;
  const separator = () => { if (blockCount++ > 0) chunks.push(plain('\n\n')); };
  const renderWork = (item: WorkItem) => {
    const status = `(${item.status})`;
    const primary = workPrimary(item);
    const elapsed = item.elapsedMs === undefined ? undefined : formatElapsedDuration(item.elapsedMs);
    const lines = wrapTranscriptBody(primary, Math.max(1, bodyWidth - status.length - (elapsed === undefined ? 1 : elapsed.length + 2)));
    for (const [index, line] of lines.entries()) {
      chunks.push(fg(NEON_THEME.muted)('\n│   '));
      chunks.push(plain(line));
      if (index === lines.length - 1) {
        chunks.push(plain(' '));
        chunks.push(fg(workColor(item.status))(status));
        if (elapsed !== undefined) {
          chunks.push(plain(' '));
          chunks.push(fg(NEON_THEME.muted)(elapsed));
        }
      }
    }
    for (const line of workDetails(item, bodyWidth)) {
      chunks.push(fg(NEON_THEME.muted)('\n│     '));
      chunks.push(plain(line));
    }
  };
  const presentationAt = (count: number) => {
    const items = [
      ...diagnostics.filter((item) => item.afterEntryCount === count).map((item, index) => ({ kind: 'diagnostic' as const, item, order: item.order ?? index })),
      ...work.filter((item) => item.afterEntryCount === count).map((item, index) => ({ kind: 'work' as const, item, order: item.order ?? diagnostics.length + index })),
    ].sort((left, right) => left.order - right.order);
    let workGroup: WorkItem[] = [];
    const flushWork = () => {
      if (workGroup.length === 0) return;
      separator();
      chunks.push(bold(fg(NEON_THEME.assistant)('Work')));
      for (const item of workGroup) renderWork(item);
      workGroup = [];
    };
    for (const entry of items) {
      if (entry.kind === 'work') {
        workGroup.push(entry.item.item);
        continue;
      }
      flushWork();
      separator();
      if (entry.kind === 'diagnostic') {
        const diagnostic = entry.item;
        chunks.push(bold(fg(NEON_THEME.error)(diagnostic.title)));
        chunks.push(plain(`\n${diagnostic.source}\nCode: ${diagnostic.code}\n${diagnostic.message}`));
        if (diagnostic.details.length > 0) chunks.push(plain(`\n${diagnostic.details.join('\n')}`));
      }
    }
    flushWork();
  };
  presentationAt(0);
  entries.forEach((entry, index) => {
    separator();
    chunks.push(bold(fg(entry.role === 'user' ? NEON_THEME.user : NEON_THEME.assistant)(entry.role === 'user' ? 'You' : 'George')));
    for (const line of wrapTranscriptBody(entry.text, bodyWidth)) {
      chunks.push(fg(NEON_THEME.muted)('\n│   '));
      chunks.push(plain(line));
    }
    presentationAt(index + 1);
  });
  return new StyledText(chunks);
}

function workColor(status: WorkItem['status']): string {
  if (status === 'failed' || status === 'denied' || status === 'cancelled' || status === 'interrupted') return NEON_THEME.error;
  if (status === 'missing' || status === 'skipped') return NEON_THEME.muted;
  return status === 'requested' || status === 'running' || status === 'waiting' ? NEON_THEME.user : NEON_THEME.assistant;
}

function workPrimary(item: WorkItem): string {
  const exit = item.details.exitCode;
  return exit === undefined || /\bexit\s/.test(item.summary) ? item.summary : `${item.summary} · Exit: ${exit === null ? 'none' : exit}`;
}

function workDetails(item: WorkItem, width: number): string[] {
  const { details } = item;
  const argv = details.argv === undefined ? [] : [
    `Argv: ${bounded(JSON.stringify(details.argv.slice(0, 8).map((argument) => bounded(argument, 48))), 240)}${details.argv.length > 8 ? ` … ${details.argv.length - 8} more` : ''}`,
  ];
  const values = [
    ...(details.timing === undefined ? [] : formatWorkflowTiming(details.timing)),
    ...(details.query === undefined ? [] : [`Query: ${bounded(details.query, 160)}`]),
    ...(details.executable === undefined ? [] : [`Executable: ${bounded(details.executable, 160)}`]),
    ...argv,
    ...(details.cwd === undefined ? [] : [`Cwd: ${bounded(details.cwd, 160)}`]),
    ...(details.timeoutMs === undefined ? [] : [`Timeout: ${formatElapsedDuration(details.timeoutMs)}`]),
    ...(details.signal === undefined || details.signal === null ? [] : [`Signal: ${bounded(details.signal, 80)}`]),
    ...(details.outcome === undefined ? [] : [`Outcome: ${details.outcome}`]),
    ...(details.truncated ? ['Output truncated'] : []),
    ...(details.error === undefined ? [] : [`Error: ${bounded(details.error, 240)}`]),
    ...(item.status === 'failed' && details.requestedArguments !== undefined ? [`Requested args: ${bounded(details.requestedArguments, 480)}`] : []),
  ];
  return values.flatMap((value) => wrapTranscriptBody(value, width));
}

function wrapTranscriptBody(text: string, width: number): string[] {
  const lines: string[] = [];
  for (const line of text.split('\n')) {
    let remaining = line;
    do {
      if (remaining.length <= width) {
        lines.push(remaining);
        break;
      }
      const breakAt = remaining.lastIndexOf(' ', width);
      lines.push(remaining.slice(0, breakAt > 0 ? breakAt : width));
      remaining = remaining.slice(breakAt > 0 ? breakAt + 1 : width);
    } while (remaining);
  }
  return lines;
}

function activityFor(event: ApplicationEvent): string | undefined {
  switch (event.type) {
    case 'provider.response.started': return 'Thinking...';
    case 'provider.response.completed': return 'Response complete';
    case 'tool.requested': return `Tool requested: ${event.name}`;
    case 'tool.started': return `Running tool: ${event.name}`;
    case 'tool.completed': return `Tool completed: ${event.name}`;
    case 'tool.failed': return `Tool failed: ${event.name}`;
    case 'approval.requested': return `Approval required: ${event.request.toolName}`;
    case 'approval.allowed': return `Approved once: ${event.request.toolName}`;
    case 'approval.denied': return `Denied: ${event.request.toolName}`;
    case 'activity.updated': return event.message;
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
  readonly task: ScrollBoxRenderable;
  readonly session: Session;
  /** UI-only diagnostics: visible history, never part of the session transcript or provider context. */
  readonly diagnostics: TranscriptDiagnosticEntry[] = [];
  /** UI-only work-log entries, keyed by P3 operation identity rather than lifecycle rows. */
  readonly work: TranscriptWorkEntry[] = [];
  private readonly renderer: CliRenderer;
  private readonly service: AgentLoopApplicationService | CodingWorkflowApplicationService;
  private readonly transcriptView: TextRenderable;
  private readonly taskView: TextRenderable;
  private readonly statusView: TextRenderable;
  private readonly taskHeaderView: TextRenderable;
  private readonly pagesView: TextRenderable;
  private readonly contextView: TextRenderable;
  private readonly activityView: TextRenderable;
  private readonly approvalView: TextRenderable;
  private readonly commandView: TextRenderable;
  private readonly composerOverflowView: TextRenderable;
  private readonly composerKeysView: TextRenderable;
  private readonly statusDetails: string;
  private readonly approvals: ApprovalResolver;
  private readonly clipboard: Clipboard;
  private readonly ownsClipboard: boolean;
  private readonly thinkingClock: ThinkingClock;
  private readonly onMeasurement: ((measurement: Measurement) => void) | undefined;
  private readonly done: Promise<void>;
  private resolveDone!: () => void;
  private controller: AbortController | undefined;
  private active: Promise<void> | undefined;
  private pendingApproval: ApprovalRequest | undefined;
  private readonly terminalFailureFingerprints = new Set<string>();
  private presentationOrder = 0;
  private revealedAssistant: Readonly<{ index: number; text: string }> | undefined;
  private thinkingTimer: ThinkingTimer | undefined;
  private thinkingStartedAt: number | undefined;
  private thinkingDots = 0;
  private page: TuiPage = 'transcript';
  private closed = false;

  constructor(options: GeorgeTuiOptions) {
    this.renderer = options.renderer;
    this.service = options.service;
    this.approvals = options.approvals;
    this.clipboard = options.clipboard ?? createHostClipboard();
    this.ownsClipboard = options.clipboard === undefined;
    this.thinkingClock = options.thinkingClock ?? { setInterval, clearInterval };
    this.onMeasurement = options.onMeasurement;
    const agent = options.service instanceof CodingWorkflowApplicationService ? options.service.agent : options.service;
    this.session = options.session ?? createSession({ workspace: options.workspace ?? agent.workspace.root });
    this.statusDetails = `${options.provider} · ${options.model} · session ${this.session.id} · ${this.session.workspace}`;
    this.done = new Promise<void>((resolve) => { this.resolveDone = resolve; });

    const layout = new BoxRenderable(this.renderer, { id: 'george', width: '100%', height: '100%', flexDirection: 'column', padding: 1, backgroundColor: NEON_THEME.background, shouldFill: true });
    layout.add(new TextRenderable(this.renderer, { id: 'header', width: '100%', height: 1, flexShrink: 0, fg: NEON_THEME.mint, content: 'George — local coding agent' }));
    this.statusView = new TextRenderable(this.renderer, { id: 'status', width: '100%', height: 1, flexShrink: 0, fg: NEON_THEME.green, content: this.status('Ready') });
    layout.add(this.statusView);
    this.taskHeaderView = new TextRenderable(this.renderer, { id: 'task-header', width: '100%', height: 1, flexShrink: 0, fg: NEON_THEME.muted, content: taskHeader(this.session.taskState) });
    layout.add(this.taskHeaderView);
    this.contextView = new TextRenderable(this.renderer, { id: 'context', width: '100%', height: 2, flexShrink: 0, fg: NEON_THEME.muted, content: 'Context: awaiting first turn' });
    layout.add(this.contextView);
    this.pagesView = new TextRenderable(this.renderer, {
      id: 'pages', width: '100%', height: 1, flexShrink: 0, fg: NEON_THEME.mint, content: '',
      onMouseDown: (event) => { if (event.button === 0) this.switchPage(event.x < this.pagesView.x + Math.ceil(this.pagesView.width / 2) ? 'transcript' : 'task'); },
    });
    layout.add(this.pagesView);
    this.transcript = new ScrollBoxRenderable(this.renderer, { id: 'transcript', flexGrow: 1, scrollY: true, stickyScroll: true, stickyStart: 'bottom', border: true, borderStyle: 'single', borderColor: NEON_THEME.border, focusedBorderColor: NEON_THEME.mint, backgroundColor: NEON_THEME.transcript, title: 'Transcript', titleColor: NEON_THEME.mint });
    this.transcriptView = new TextRenderable(this.renderer, { id: 'transcript-text', width: '100%', fg: NEON_THEME.foreground, selectionBg: NEON_THEME.green, selectionFg: NEON_THEME.background, content: '', onSizeChange: () => this.refreshTranscript() });
    this.transcript.add(this.transcriptView);
    layout.add(this.transcript);
    this.task = new ScrollBoxRenderable(this.renderer, { id: 'task', flexGrow: 1, scrollY: true, border: true, borderStyle: 'single', borderColor: NEON_THEME.border, focusedBorderColor: NEON_THEME.mint, backgroundColor: NEON_THEME.transcript, title: 'Task', titleColor: NEON_THEME.mint, visible: false });
    this.taskView = new TextRenderable(this.renderer, { id: 'task-text', width: '100%', fg: NEON_THEME.foreground, selectionBg: NEON_THEME.green, selectionFg: NEON_THEME.background, content: '', onSizeChange: () => this.refreshTask() });
    this.task.add(this.taskView);
    layout.add(this.task);
    this.activityView = new TextRenderable(this.renderer, { id: 'activity', width: '100%', height: 1, flexShrink: 0, fg: NEON_THEME.mint, content: 'Idle' });
    layout.add(this.activityView);
    this.approvalView = new TextRenderable(this.renderer, { id: 'approval', width: '100%', height: 0, flexShrink: 0, fg: NEON_THEME.mint, content: '' });
    layout.add(this.approvalView);
    this.commandView = new TextRenderable(this.renderer, { id: 'commands', width: '100%', height: 0, flexShrink: 0, fg: NEON_THEME.green, content: '' });
    layout.add(this.commandView);
    this.composerOverflowView = new TextRenderable(this.renderer, { id: 'composer-overflow', width: '100%', height: 0, flexShrink: 0, fg: NEON_THEME.muted, content: '' });
    layout.add(this.composerOverflowView);
    this.composerKeysView = new TextRenderable(this.renderer, { id: 'composer-keys', width: '100%', height: 1, flexShrink: 0, fg: NEON_THEME.muted, content: 'Enter send · Ctrl+A all · Ctrl+C copy · Ctrl+V paste · Esc exit' });
    layout.add(this.composerKeysView);
    const composer = new BoxRenderable(this.renderer, { id: 'composer', width: '100%', height: 7, flexShrink: 0, border: true, borderColor: NEON_THEME.border, focusedBorderColor: NEON_THEME.mint, customBorderChars: ASCII_BORDER, backgroundColor: NEON_THEME.background });
    this.input = new TextareaRenderable(this.renderer, {
      id: 'input', height: 5, minHeight: 5, maxHeight: 10, wrapMode: 'word', placeholder: 'Message George', keyBindings: COMPOSER_KEY_BINDINGS,
      backgroundColor: NEON_THEME.background, textColor: NEON_THEME.foreground,
      focusedBackgroundColor: NEON_THEME.background, focusedTextColor: NEON_THEME.foreground,
      placeholderColor: NEON_THEME.muted, selectionBg: NEON_THEME.green, selectionFg: NEON_THEME.background,
      cursorColor: NEON_THEME.mint,
      onSubmit: () => { void this.submit(); },
      onContentChange: () => this.updateComposerOverflow(),
      onCursorChange: () => this.updateComposerOverflow(),
    });
    composer.add(this.input);
    layout.add(composer);
    this.renderer.root.add(layout);
    this.restoreHistory();
    this.refreshTranscript();
    this.refreshTask();
    this.refreshPages();
    this.renderer.once(CliRenderEvents.FRAME, () => { this.refreshTranscript(); this.refreshTask(); });
    this.renderer._internalKeyInput.onInternal('keypress', (key) => {
      if (key.name === 'escape') {
        key.preventDefault();
        this.escape();
      } else if (this.pendingApproval && key.ctrl && key.name === 'a') {
        key.preventDefault();
        this.decide('allow_once');
      } else if (this.pendingApproval && key.ctrl && key.name === 'd') {
        key.preventDefault();
        this.decide('deny');
      } else if (key.ctrl && key.name === '1') {
        key.preventDefault();
        this.switchPage('transcript');
      } else if (key.ctrl && key.name === '2') {
        key.preventDefault();
        this.switchPage('task');
      } else if (key.ctrl && key.name === 'v') {
        key.preventDefault();
        void this.pasteClipboard();
      } else if (key.ctrl && key.name === 'c') {
        if (this.hasViewSelection()) {
          key.preventDefault();
          const text = this.renderer.getSelection()?.getSelectedText();
          if (text) {
            this.renderer.copyToClipboardOSC52(text);
            void this.clipboard.writeText(text);
          }
        } else if (this.input.getSelectedText()) {
          key.preventDefault();
          void this.copySelection();
        } else {
          key.preventDefault();
        }
      }
    });
    this.renderer.on(CliRenderEvents.RESIZE, () => {
      this.updateComposerOverflow();
      this.refreshTranscript();
      this.refreshTask();
      this.renderer.requestRender();
    });
    this.renderer.on(CliRenderEvents.DESTROY, () => {
      this.stopThinking();
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
      this.clearComposer();
      await this.showSkills();
      return;
    }
    if (text.trim() === '/plugins') {
      this.clearComposer();
      await this.showPlugins();
      return;
    }
    if (text.trim() === '/commands') {
      this.clearComposer();
      this.showCommands();
      return;
    }
    if (text.trimStart().startsWith('/plugin')) {
      const command = /^\/plugin\s+(install\s+\S+|enable\s+\S+|disable\s+\S+|uninstall\s+\S+)\s*$/.exec(text);
      if (!command) { this.showCommand('Usage: /plugin install|enable|disable|uninstall <path-or-id>'); return; }
      const [action, value] = command[1]!.split(/\s+/, 2) as [string, string];
      try {
        const plugins = this.agent().plugins;
        if (action === 'install') await plugins.install(value);
        else if (action === 'enable') await plugins.enable(value);
        else if (action === 'disable') await plugins.disable(value);
        else await plugins.uninstall(value);
        this.clearComposer();
        this.showCommand(`Plugin ${action} completed. Restart George to refresh enabled contributions.`);
      } catch (error) { this.showCommand(`Plugin ${action} failed: ${error instanceof Error ? bounded(error.message, 180) : 'failed'}`); }
      return;
    }
    if (text.trimStart().startsWith('/command')) {
      const command = /^\/command\s+(plugin:\S+)\s+([\s\S]*\S)\s*$/.exec(text);
      if (!command) { this.showCommand('Usage: /command <plugin:command> <message>'); return; }
      try {
        const submission = await this.agent().plugins.activate(command[1]!, command[2]!);
        await this.start(submission.input, submission.activatedSkills);
      } catch (error) { this.showCommand(`Command activation: ${error instanceof Error ? bounded(error.message, 180) : 'failed'}`); }
      return;
    }
    if (text.trimStart().startsWith('/skill')) {
      const command = /^\/skill\s+(\S+)\s+([\s\S]*\S)\s*$/.exec(text);
      if (!command) {
        this.showCommand('Usage: /skill <id> <message>');
        return;
      }
      try {
        const submission = await (this.service instanceof CodingWorkflowApplicationService ? this.service.agent : this.service).skillTurn(command[1]!, command[2]!);
        await this.start(submission.input, submission.activatedSkills);
      } catch (error) {
        this.showCommand(`Skill activation: ${error instanceof Error ? bounded(error.message, 180) : 'failed'}`);
      }
      return;
    }
    if (text.startsWith('$')) {
      try {
        const submission = await (this.service instanceof CodingWorkflowApplicationService ? this.service.agent : this.service).skillShorthandTurn(text);
        if (submission) {
          await this.start(submission.input, submission.activatedSkills);
          return;
        }
      } catch (error) {
        this.showCommand(`Skill activation: ${error instanceof Error ? bounded(error.message, 180) : 'failed'}`);
        return;
      }
    }
    await this.start(text);
  }

  private async start(text: string, activatedSkills?: readonly string[]): Promise<void> {
    this.stopThinking();
    this.clearComposer();
    this.controller = new AbortController();
    this.statusView.content = this.status('Working');
    this.activityView.content = 'Starting turn';
    this.active = this.consume(text, this.controller.signal, activatedSkills).finally(() => {
      this.stopThinking();
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

  escape(): boolean {
    if (this.controller) {
      this.stopThinking();
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

  scrollTask(lines: number): void {
    this.task.scrollBy(lines);
  }

  currentPage(): TuiPage {
    return this.page;
  }

  hasTranscriptSelection(): boolean {
    let container = this.renderer.getSelectionContainer();
    while (container) {
      if (container === this.transcript) return this.transcriptView.hasSelection();
      container = container.parent;
    }
    return false;
  }

  private hasViewSelection(): boolean {
    let container = this.renderer.getSelectionContainer();
    while (container) {
      if (container === this.transcript) return this.transcriptView.hasSelection();
      if (container === this.task) return this.taskView.hasSelection();
      container = container.parent;
    }
    return false;
  }

  private switchPage(page: TuiPage): void {
    if (this.page === page) return;
    this.page = page;
    this.transcript.visible = page === 'transcript';
    this.task.visible = page === 'task';
    this.refreshPages();
    this.renderer.requestRender();
  }

  private refreshPages(): void {
    this.pagesView.content = `${this.page === 'transcript' ? '[Transcript]' : ' Transcript '}  ${this.page === 'task' ? '[Task]' : ' Task '} · Ctrl+1 / Ctrl+2 switch`;
  }

  close(): void {
    if (this.closed) return;
    this.closed = true;
    this.stopThinking();
    this.controller?.abort();
    this.renderer.destroy();
    if (this.ownsClipboard) void this.clipboard.dispose();
    this.finish();
  }

  private async consume(input: string, signal: AbortSignal, activatedSkills?: readonly string[]): Promise<void> {
    if (this.service instanceof CodingWorkflowApplicationService) {
      await this.service.run({ session: this.session, input, signal, ...(activatedSkills === undefined ? {} : { activatedSkills }), onEvent: async (event) => this.render(event) });
      return;
    }
    for await (const event of this.service.run({ session: this.session, input, signal, ...(activatedSkills === undefined ? {} : { activatedSkills }) })) {
      await this.render(event);
    }
  }

  private async pasteClipboard(): Promise<void> {
    const result = await this.clipboard.read({ preferredTypes: ['text/plain'] });
    if (result.status !== 'read') return;
    this.input.insertText(new TextDecoder().decode(result.representation.bytes));
    this.renderer.requestRender();
  }

  private async copySelection(): Promise<void> {
    const text = this.input.getSelectedText();
    if (text) await this.clipboard.writeText(text);
  }

  private updateComposerOverflow(): void {
    if (!this.input.plainText) {
      this.composerOverflowView.content = '';
      this.composerOverflowView.height = 0;
      return;
    }
    const above = this.input.scrollY > 0;
    const below = this.input.scrollY + this.input.height < this.input.virtualLineCount;
    const content = [above ? '… lines above' : '', below ? '… lines below' : ''].filter(Boolean).join('  ');
    this.composerOverflowView.content = content;
    this.composerOverflowView.height = content ? 1 : 0;
  }

  private clearComposer(): void {
    this.input.clear();
    this.composerOverflowView.content = '';
    this.composerOverflowView.height = 0;
  }

  private async render(event: ApplicationEvent): Promise<void> {
    if (this.closed) return;
    if (event.type === 'turn.started') this.terminalFailureFingerprints.clear();
    this.recordDiagnostic(event);
    this.recordWork(event);
    this.refreshTranscript();
    this.refreshTask();
    this.taskHeaderView.content = taskHeader(this.session.taskState);
    if (event.type === 'context.assembled') {
      this.contextView.content = contextText(event.diagnostics);
      this.contextView.height = event.diagnostics.activeSourceIds.some((id) => id.startsWith('skill:')) ? 3 : 2;
    }
    if (event.type === 'approval.requested') {
      this.pendingApproval = event.request;
      this.approvalView.content = this.approvalText(event.request);
      this.approvalView.height = this.approvalHeight(event.request);
    }
    if (event.type === 'approval.allowed' || event.type === 'approval.denied' || event.type === 'turn.cancelled') {
      this.pendingApproval = undefined;
      this.approvalView.content = '';
      this.approvalView.height = 0;
    }
    if (event.type === 'provider.response.started') this.startThinking();
    else if (this.thinkingTimer !== undefined && !this.thinkingContinues(event)) this.stopThinking();
    const activity = activityFor(event);
    if (activity && event.type !== 'provider.response.started' && !(event.type === 'activity.updated' && event.message === 'Thinking...' && this.thinkingTimer !== undefined)) this.activityView.content = activity;
    this.renderer.requestRender();
    if (event.type === 'assistant.response.completed') await this.revealAssistant(event.text);
  }

  private thinkingContinues(event: ApplicationEvent): boolean {
    return event.type === 'provider.text.delta' || (event.type === 'activity.updated' && event.message === 'Thinking...');
  }

  private startThinking(): void {
    this.stopThinking();
    this.thinkingStartedAt = Date.now();
    this.thinkingDots = 0;
    this.activityView.content = this.thinkingActivity();
    this.thinkingTimer = this.thinkingClock.setInterval(() => {
      this.thinkingDots = (this.thinkingDots + 1) % 4;
      this.activityView.content = this.thinkingActivity();
      this.activityView.requestRender();
    }, 333);
    (this.thinkingTimer as { unref?: () => void }).unref?.();
  }

  private stopThinking(): void {
    if (this.thinkingTimer !== undefined) this.thinkingClock.clearInterval(this.thinkingTimer);
    this.thinkingTimer = undefined;
    this.thinkingStartedAt = undefined;
    this.thinkingDots = 0;
  }

  private thinkingActivity(): string { return `Thinking${'.'.repeat(this.thinkingDots).padEnd(3, ' ')} ${formatThinkingElapsed(Date.now() - (this.thinkingStartedAt ?? Date.now()))}`; }

  private refreshTranscript(): void {
    const bodyWidth = this.transcriptView.width - 4;
    if (bodyWidth < 1) return;
    const entries = this.revealedAssistant === undefined ? this.session.transcript : this.session.transcript.map((entry, index) =>
      index === this.revealedAssistant!.index ? { ...entry, text: this.revealedAssistant!.text } : entry,
    );
    this.transcriptView.content = renderTranscript(entries, this.diagnostics, bodyWidth, this.session.taskState ? [] : this.work);
  }

  private refreshTask(): void {
    const bodyWidth = this.taskView.width - 2;
    if (bodyWidth < 1) return;
    this.taskView.content = renderTask(this.session.taskState, this.work, bodyWidth);
  }

  private async revealAssistant(text: string): Promise<void> {
    const startedAt = Date.now();
    const index = this.session.transcript.length - 1;
    if (!text || this.session.transcript[index]?.role !== 'assistant') return;
    this.revealedAssistant = { index, text: '' };
    const chunkSize = Math.max(4, Math.ceil(text.length / 60));
    for (let end = 0; end < text.length && !this.closed && !this.controller?.signal.aborted;) {
      end = Math.min(text.length, end + chunkSize);
      this.revealedAssistant = { index, text: text.slice(0, end) };
      this.refreshTranscript();
      this.renderer.requestRender();
      if (end < text.length) await this.revealPause();
    }
    this.revealedAssistant = undefined;
    this.refreshTranscript();
    try { this.onMeasurement?.({ workload: 'opentui', name: 'final_response.reveal_duration', value: Math.max(0, Date.now() - startedAt), unit: 'ms', fields: { bytes: Buffer.byteLength(text, 'utf8') } }); } catch { /* Presentation measurements cannot disrupt the transcript. */ }
  }

  private async revealPause(): Promise<void> {
    const signal = this.controller?.signal;
    if (signal?.aborted || this.closed) return;
    await new Promise<void>((resolve) => {
      const timer = setTimeout(done, 12);
      const abort = () => { clearTimeout(timer); done(); };
      function done() {
        signal?.removeEventListener('abort', abort);
        resolve();
      }
      signal?.addEventListener('abort', abort, { once: true });
    });
  }

  private recordWork(event: ApplicationEvent): void {
    if (event.type !== 'work.updated') return;
    const existing = this.work.findIndex((entry) => entry.item.id === event.item.id);
    if (existing >= 0) {
      const prior = this.work[existing]!;
      this.work[existing] = { ...prior, item: event.item };
      return;
    }
    this.work.push({ afterEntryCount: this.session.transcript.length, order: this.presentationOrder++, item: event.item });
  }

  /** Restored operations are evidence, never live work or a reusable approval. */
  private restoreHistory(): void {
    let afterEntryCount = 0;
    for (const event of this.session.events) {
      if (event.type === 'input.submitted' || event.type === 'assistant.response.completed') {
        afterEntryCount += 1;
        continue;
      }
      if (event.type === 'work.updated') {
        const active = event.item.status === 'requested' || event.item.status === 'running' || event.item.status === 'waiting';
        const item = active ? { ...event.item, status: 'interrupted' as const, summary: `Previous operation interrupted: ${event.item.summary}` } : event.item;
        const existing = this.work.findIndex((entry) => entry.item.id === item.id);
        if (existing >= 0) this.work[existing] = { ...this.work[existing]!, item };
        else this.work.push({ afterEntryCount, order: this.presentationOrder++, item });
      }
      if (event.type === 'context.assembled' && this.contextView) this.contextView.content = contextText(event.diagnostics);
    }
    for (const [index, interruption] of this.session.interruptions.entries()) {
      if (interruption.callId && this.work.some((entry) => entry.item.operationId === interruption.callId)) continue;
      this.work.push({
        afterEntryCount, order: this.presentationOrder++,
        item: {
          id: `history:interruption:${index}`, turnId: interruption.turnId ?? 'history', operationId: interruption.callId ?? interruption.kind,
          category: 'recovery', status: 'interrupted', summary: `Previous ${interruption.kind}${interruption.name ? ` (${interruption.name})` : ''} was interrupted`, details: {},
        },
      });
    }
  }

  private recordDiagnostic(event: ApplicationEvent): void {
    if (event.type === 'tool.failed') {
      this.diagnostics.push({
        afterEntryCount: this.session.transcript.length, order: this.presentationOrder++,
        title: 'Tool failure', source: `Tool: ${event.name}`,
        code: bounded(event.result.error.code, 64), message: bounded(event.result.error.message, 480), details: [],
      });
      return;
    }
    if (event.type !== 'provider.error' && event.type !== 'turn.failed') return;
    const fingerprint = errorFingerprint(event.error.code, event.error.message);
    if (this.terminalFailureFingerprints.has(fingerprint)) return;
    this.terminalFailureFingerprints.add(fingerprint);
    this.diagnostics.push({
      afterEntryCount: this.session.transcript.length, order: this.presentationOrder++,
      title: 'Error',
      source: event.type === 'provider.error' ? 'Provider failure' : 'Turn failure',
      code: event.error.code,
      message: bounded(event.error.message, 480),
      details: safeCauseDetails(event.error.cause),
    });
  }

  private status(state: string): string {
    return `${state} · ${this.statusDetails}`;
  }

  private agent(): AgentLoopApplicationService {
    return this.service instanceof CodingWorkflowApplicationService ? this.service.agent : this.service;
  }

  private async showPlugins(): Promise<void> {
    try {
      const plugins = await this.agent().plugins.list();
      const details = plugins.slice(0, 4).map((plugin) => `${plugin.id} ${plugin.version} — ${plugin.enabled ? 'enabled' : 'disabled'}`);
      if (plugins.length > details.length) details.push(`… ${plugins.length - details.length} more plugin(s)`);
      this.showCommand(details.length ? `Plugins (${plugins.length}):\n${details.join('\n')}` : 'Plugins: none installed');
    } catch (error) { this.showCommand(`Plugins unavailable: ${error instanceof Error ? bounded(error.message, 180) : 'failed'}`); }
  }

  private showCommands(): void {
    const commands = this.agent().plugins.listCommands();
    const details = commands.slice(0, 4).map((command) => command.id);
    if (commands.length > details.length) details.push(`… ${commands.length - details.length} more command(s)`);
    this.showCommand(details.length ? `Commands (${commands.length}):\n${details.join('\n')}` : 'Commands: none enabled');
  }

  private async showSkills(): Promise<void> {
    try {
      const catalog = await (this.service instanceof CodingWorkflowApplicationService ? this.service.agent : this.service).skillCatalog();
      const shown = catalog.skills.slice(0, 3);
      const colliding = new Set(catalog.collisions.map((item) => item.name));
      const details = shown.map((skill) => `${colliding.has(skill.name) ? `$${skill.name} (ambiguous)` : `$${skill.name}`} — ${bounded(skill.description, 84)} (${bounded(skill.id, 48)})`);
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
    this.input.focus();
    this.renderer.requestRender();
  }

  private decide(decision: 'allow_once' | 'deny'): void {
    const request = this.pendingApproval;
    if (request && this.approvals.decide(request.id, decision)) this.activityView.content = decision === 'allow_once' ? `Approved once: ${request.toolName}` : `Denied: ${request.toolName}`;
  }

  private approvalText(request: ApprovalRequest): string {
    const detail = request.target
      ? `Target: ${request.target.path}${request.target.alreadyDirty ? ' (already dirty)' : ''}`
      : request.process
        ? `Executable: ${request.process.executable}\nArgv: ${JSON.stringify(request.process.argv)}\nCwd: ${request.process.cwd}\nWarning: ${request.process.warning}`
        : [
          `Effect: ${request.execution.effect.replaceAll('_', ' ')}`,
          ...(request.execution.descriptor?.service ? [`Service: ${request.execution.descriptor.service}`] : []),
          ...(request.execution.descriptor?.origin ? [`Origin: ${request.execution.descriptor.origin}`] : []),
          ...(request.execution.descriptor?.resource ? [`Resource: ${request.execution.descriptor.resource}`] : []),
          ...(request.execution.descriptor?.operation ? [`Operation: ${request.execution.descriptor.operation}`] : []),
          ...(request.execution.descriptor?.credentialConfigured === undefined ? [] : [`Credential configured: ${request.execution.descriptor.credentialConfigured ? 'yes' : 'no'}`]),
          `Warning: ${request.execution.descriptor?.warning ?? (request.execution.effect === 'unknown_external' ? 'External effect is unknown; outcome may be unknown if interrupted.' : 'External operation requires explicit approval.')}`,
        ].join('\n');
    return `Approval required — ${request.toolName} (${request.execution.effect.replaceAll('_', ' ')})\n${detail}\n[Ctrl+A]llow once  [Ctrl+D]eny`;
  }

  private approvalHeight(request: ApprovalRequest): number {
    if (request.target || request.process) return 6; // Preserve the established local write/process layout.
    const detail = request.execution.descriptor;
    return Math.min(10, 4 + Number(detail?.service !== undefined) + Number(detail?.origin !== undefined) + Number(detail?.resource !== undefined) + Number(detail?.operation !== undefined) + Number(detail?.warning !== undefined) + Number(detail?.credentialConfigured !== undefined));
  }

  private finish(): void {
    this.resolveDone();
  }
}
