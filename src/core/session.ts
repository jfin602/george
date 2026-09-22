import { randomUUID } from 'node:crypto';

import type { ApplicationEvent } from './events.ts';

export type TranscriptEntry = Readonly<{
  role: 'user' | 'assistant';
  text: string;
}>;

export type Session = {
  id: string;
  workspace: string;
  transcript: TranscriptEntry[];
  events: ApplicationEvent[];
};

export function createSession({
  workspace,
  id = randomUUID(),
}: Readonly<{ workspace: string; id?: string }>): Session {
  return { id, workspace, transcript: [], events: [] };
}

export function appendSessionEvent(session: Session, event: ApplicationEvent): void {
  session.events.push(event);
  if (event.type === 'input.submitted') {
    session.transcript.push({ role: 'user', text: event.text });
    return;
  }
  if (event.type !== 'provider.text.delta') return;
  const previous = session.transcript.at(-1);
  if (previous?.role === 'assistant') {
    session.transcript[session.transcript.length - 1] = {
      role: 'assistant',
      text: previous.text + event.delta,
    };
  } else {
    session.transcript.push({ role: 'assistant', text: event.delta });
  }
}
