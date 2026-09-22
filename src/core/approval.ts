import { cancellationError } from './cancellation.ts';

export type ApprovalDecision = 'allow_once' | 'deny';

export type ApprovalRequest = Readonly<{
  id: string;
  toolName: string;
  risk: 'write' | 'process';
  arguments: Readonly<Record<string, unknown>>;
  target?: Readonly<{ path: string; alreadyDirty: boolean }>;
  process?: Readonly<{ executable: string; argv: readonly string[]; cwd: string; warning: string }>;
}>;

/** Presentation-independent boundary for one normalized risky tool call. */
export type ApprovalPort = Readonly<{
  request: (request: ApprovalRequest, options?: Readonly<{ signal?: AbortSignal }>) => Promise<ApprovalDecision>;
}>;

export type ApprovalResolver = Readonly<{
  decide: (id: string, decision: ApprovalDecision) => boolean;
}>;

/** Bridges an application approval request to a presentation adapter. */
export class PendingApprovalPort implements ApprovalPort, ApprovalResolver {
  private readonly pending = new Map<string, { resolve: (decision: ApprovalDecision) => void; reject: (error: Error | undefined) => void; signal?: AbortSignal; cancelled: () => void }>();

  request(request: ApprovalRequest, options: Readonly<{ signal?: AbortSignal }> = {}): Promise<ApprovalDecision> {
    if (options.signal?.aborted) return Promise.reject(cancellationError(options.signal));
    return new Promise<ApprovalDecision>((resolve, reject) => {
      const cancelled = () => {
        this.pending.delete(request.id);
        reject(cancellationError(options.signal!));
      };
      this.pending.set(request.id, { resolve, reject, signal: options.signal, cancelled });
      options.signal?.addEventListener('abort', cancelled, { once: true });
    });
  }

  decide(id: string, decision: ApprovalDecision): boolean {
    const pending = this.pending.get(id);
    if (!pending) return false;
    this.pending.delete(id);
    pending.signal?.removeEventListener('abort', pending.cancelled);
    pending.resolve(decision);
    return true;
  }
}

/** Safe default for non-interactive callers: risky calls are never executed. */
export const denyApprovalPort: ApprovalPort = {
  async request() { return 'deny'; },
};
