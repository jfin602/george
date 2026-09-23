import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';

import {
  resolveWorkspaceMutationPath,
  type ApplicationEvent,
  type RecoveryOutcome,
  type Session,
  type SessionInterruption,
  type Workspace,
} from '../core/index.ts';

function hash(bytes: Buffer): string {
  return createHash('sha256').update(bytes).digest('hex');
}

function intentFor(session: Session, callId: string | undefined): Extract<ApplicationEvent, { type: 'recovery.intent' }>['intent'] | undefined {
  return callId === undefined ? undefined : [...session.events].reverse().find((event): event is Extract<ApplicationEvent, { type: 'recovery.intent' }> => event.type === 'recovery.intent' && event.callId === callId)?.intent;
}

async function writeOutcome(workspace: Workspace, intent: Extract<ApplicationEvent, { type: 'recovery.intent' }>['intent']): Promise<readonly [RecoveryOutcome, string]> {
  if (intent.name !== 'write_file') return ['outcome_unknown', 'Patch body is intentionally not retained; final state cannot be proven.'];
  try {
    const target = await resolveWorkspaceMutationPath(workspace, intent.path);
    if (!target.exists) return ['confirmed_incomplete', 'Canonical target is absent.'];
    const bytes = await readFile(target.path);
    if (bytes.length === intent.desiredBytes && hash(bytes) === intent.desiredSha256) return ['confirmed_complete', 'Canonical target bytes and SHA-256 match the recorded write intent.'];
    if (intent.precondition !== 'absent' && hash(bytes) === intent.precondition) return ['confirmed_incomplete', 'Canonical target still matches the recorded precondition.'];
    return ['outcome_unknown', 'Canonical target does not prove the recorded desired bytes and SHA-256.'];
  } catch {
    return ['outcome_unknown', 'Workspace observation could not establish the mutation outcome.'];
  }
}

/** Read-only reconciliation. It never invokes tools, approvals, provider continuations, or process cleanup. */
export class RecoveryCoordinator {
  private readonly workspace: Workspace;

  constructor(workspace: Workspace) {
    this.workspace = workspace;
  }

  async observe(session: Session): Promise<readonly Extract<ApplicationEvent, { type: 'recovery.decision' }>[]> {
    const decisions: Extract<ApplicationEvent, { type: 'recovery.decision' }>[] = [];
    for (const interruption of session.interruptions) {
      const decision = await this.classify(session, interruption);
      decisions.push(decision);
    }
    return decisions;
  }

  private async classify(session: Session, item: SessionInterruption): Promise<Extract<ApplicationEvent, { type: 'recovery.decision' }>> {
    let outcome: RecoveryOutcome = 'interrupted';
    let evidence = 'No side effect is replayed during recovery.';
    if (item.kind === 'mutation') {
      const intent = intentFor(session, item.callId);
      if (intent) [outcome, evidence] = await writeOutcome(this.workspace, intent);
      else { outcome = 'outcome_unknown'; evidence = 'No bounded mutation intent was recorded before interruption.'; }
    } else if (item.kind === 'process') {
      outcome = 'outcome_unknown';
      evidence = 'No verified live process identity is available after reopen; a persisted PID is never signalled.';
    } else if (item.kind === 'approval') {
      evidence = 'Approval remained unresolved and is not reused.';
    } else {
      evidence = 'Provider continuation is interrupted and is not resubmitted.';
    }
    return { type: 'recovery.decision', turnId: item.turnId ?? 'unknown', ...(item.callId === undefined ? {} : { callId: item.callId }), kind: item.kind, ...(item.name === undefined ? {} : { name: item.name }), outcome, evidence };
  }
}
