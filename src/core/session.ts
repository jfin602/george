import { randomUUID } from 'node:crypto';

import type { ApplicationEvent } from './events.ts';
import type { TaskState } from '../tasks/state.ts';
import type { StackState } from '../tasks/stack-state.ts';

export type TranscriptEntry = Readonly<{
  role: 'user' | 'assistant';
  text: string;
}>;

export type Session = {
  id: string;
  workspace: string;
  transcript: TranscriptEntry[];
  events: ApplicationEvent[];
  /** Historical operations that stopped before George observed a terminal event. */
  interruptions: SessionInterruption[];
  /** Optional canonical structured-task state; ordinary sessions remain taskless. */
  taskState?: TaskState;
  /** Optional canonical ordered task-stack state; contains every task's durable history. */
  stackState?: StackState;
};

export type SessionInterruption = Readonly<{
  kind: 'mutation' | 'process' | 'external' | 'approval' | 'provider-continuation';
  turnId?: string;
  callId?: string;
  name?: string;
}>;

export function createSession({
  workspace,
  id = randomUUID(),
}: Readonly<{ workspace: string; id?: string }>): Session {
  return { id, workspace, transcript: [], events: [], interruptions: [] };
}

export function appendSessionEvent(session: Session, event: ApplicationEvent): void {
  session.events.push(event);
  if (event.type === 'input.submitted') {
    session.transcript.push({ role: 'user', text: event.text });
  } else if (event.type === 'assistant.response.completed') {
    appendAssistantResponse(session, event.text);
  }
}

function appendAssistantResponse(session: Session, text: string): void {
  if (!text) return;
  const previous = session.transcript.at(-1);
  if (previous?.role === 'assistant') {
    session.transcript[session.transcript.length - 1] = {
      role: 'assistant',
      text: previous.text + text,
    };
  } else {
    session.transcript.push({ role: 'assistant', text });
  }
}
