import { isAbsolute, relative, resolve } from 'node:path';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import type { StructuredTaskApplicationService, StructuredTaskStackApplicationService } from '../application/index.ts';
import type { ApplicationEvent, Session } from '../core/index.ts';

export type LiveWorkMetrics = Readonly<{
  providerAttempts: number;
  providerRounds: number;
  providerInputTokens: number;
  providerOutputTokens: number;
  toolCalls: number;
  contextAssemblies: number;
  sandboxedProcessCalls: number;
  taskUpdates: number;
  stackUpdates: number;
}>;

export type LiveWorkResult = Readonly<{
  qualifying: boolean;
  terminalStatus: string;
  hiddenAcceptance: 'passed' | 'failed' | 'not_run';
  metrics: LiveWorkMetrics;
  events: readonly ApplicationEvent[];
}>;

type Common = Readonly<{
  session: Session;
  acceptancePath: string;
  runHiddenAcceptance: () => Promise<boolean>;
  dependencyInstallation?: Readonly<{ authorized: boolean; run: () => Promise<void> }>;
  onEvent?: (event: ApplicationEvent) => void | Promise<void>;
}>;

export type LiveWorkSubmission = Common & (
  | Readonly<{ kind: 'stack'; service: StructuredTaskStackApplicationService; prompts: readonly string[] }>
  | Readonly<{ kind: 'single'; service: StructuredTaskApplicationService; prompt: string }>
);

function outsideWorkspace(workspace: string, path: string): boolean {
  const target = resolve(path);
  const pathFromWorkspace = relative(resolve(workspace), target);
  return isAbsolute(pathFromWorkspace) || pathFromWorkspace === '..' || pathFromWorkspace.startsWith(`..${process.platform === 'win32' ? '\\' : '/'}`);
}

function metrics(events: readonly ApplicationEvent[]): LiveWorkMetrics {
  const usage = events.filter((event): event is Extract<ApplicationEvent, { type: 'provider.response.completed' }> => event.type === 'provider.response.completed').map((event) => event.usage);
  return {
    providerAttempts: events.filter((event) => event.type === 'provider.attempt.started').length,
    providerRounds: events.filter((event) => event.type === 'provider.response.completed' || event.type === 'provider.error').length,
    providerInputTokens: usage.reduce((total, item) => total + (item?.inputTokens ?? 0), 0),
    providerOutputTokens: usage.reduce((total, item) => total + (item?.outputTokens ?? 0), 0),
    toolCalls: events.filter((event) => event.type === 'tool.started').length,
    contextAssemblies: events.filter((event) => event.type === 'context.assembled').length,
    sandboxedProcessCalls: events.filter((event) => event.type === 'tool.started' && event.execution?.effect === 'sandboxed_workspace_process').length,
    taskUpdates: events.filter((event) => event.type === 'task.updated').length,
    stackUpdates: events.filter((event) => event.type === 'stack.updated').length,
  };
}

/** Qualification observer: production services own all task parsing, sequencing, fail-stop, and resume behavior. */
export async function runLiveWorkInstrument(submission: LiveWorkSubmission): Promise<LiveWorkResult> {
  if (!outsideWorkspace(submission.session.workspace, submission.acceptancePath)) throw new Error('Hidden acceptance must remain outside the model-visible workspace.');
  if (submission.dependencyInstallation) {
    if (!submission.dependencyInstallation.authorized) throw new Error('Harness dependency installation requires deliberate authorization.');
    await submission.dependencyInstallation.run();
  }
  const events: ApplicationEvent[] = [];
  const onEvent = async (event: ApplicationEvent) => { events.push(event); await submission.onEvent?.(event); };
  let terminalStatus: string;
  if (submission.kind === 'stack') terminalStatus = (await submission.service.run({ session: submission.session, prompts: submission.prompts, onEvent })).state.status;
  else {
    await submission.service.run({ session: submission.session, input: submission.prompt, onEvent });
    terminalStatus = submission.session.taskState?.status ?? 'failed';
  }
  let hiddenAcceptance: LiveWorkResult['hiddenAcceptance'] = 'not_run';
  if (terminalStatus === 'completed') hiddenAcceptance = await submission.runHiddenAcceptance() ? 'passed' : 'failed';
  return { qualifying: terminalStatus === 'completed' && hiddenAcceptance === 'passed', terminalStatus, hiddenAcceptance, metrics: metrics(events), events: Object.freeze(events) };
}

export async function runGreenfieldExpressV1(options: Omit<Extract<LiveWorkSubmission, { kind: 'stack' }>, 'kind' | 'prompts'> & Readonly<{ instrumentRoot: string }>): Promise<LiveWorkResult> {
  const prompts = await Promise.all(['P1-scaffold.task.txt', 'P2-api.task.txt', 'P3-tests-docs-closeout.task.txt'].map((name) => readFile(join(options.instrumentRoot, name), 'utf8')));
  return runLiveWorkInstrument({ ...options, kind: 'stack', prompts });
}

export async function runExistingExpressFeatureV1(options: Omit<Extract<LiveWorkSubmission, { kind: 'single' }>, 'kind' | 'prompt'> & Readonly<{ instrumentRoot: string }>): Promise<LiveWorkResult> {
  const prompt = await readFile(join(options.instrumentRoot, 'P1-tag-feature.task.txt'), 'utf8');
  return runLiveWorkInstrument({ ...options, kind: 'single', prompt });
}
