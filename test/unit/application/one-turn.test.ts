import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import {
  GeorgeError,
  createSession,
  type ModelProvider,
  type ProviderEvent,
  type ProviderRequest,
  type ProviderStreamOptions,
} from '../../../src/core/index.ts';
import { createOneTurnApplicationService } from '../../../src/application/index.ts';

class ScriptedProvider implements ModelProvider {
  calls: Array<{ request: ProviderRequest; options: ProviderStreamOptions }> = [];
  private readonly events: readonly ProviderEvent[];
  private readonly failure: Error | undefined;

  constructor(events: readonly ProviderEvent[], failure?: Error) {
    this.events = events;
    this.failure = failure;
  }

  async *stream(request: ProviderRequest, options: ProviderStreamOptions = {}): AsyncGenerator<ProviderEvent> {
    this.calls.push({ request, options });
    if (this.failure) throw this.failure;
    yield* this.events;
  }
}

async function workspace(): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), 'george-service-'));
  await writeFile(join(root, 'BOOT.md'), 'Repository boot.');
  await writeFile(join(root, 'AGENTS.md'), 'Repository agents.');
  return root;
}

async function collect<T>(events: AsyncIterable<T>): Promise<T[]> {
  const result: T[] = [];
  for await (const event of events) result.push(event);
  return result;
}

test('one-turn service keeps George context first and invokes the provider exactly once', async (t) => {
  const root = await workspace();
  t.after(() => rm(root, { recursive: true, force: true }));
  const provider = new ScriptedProvider([
    { type: 'provider.response.started', responseId: 'response-1' },
    { type: 'provider.text.delta', delta: 'Hello.' },
    { type: 'provider.response.completed' },
  ]);
  const service = await createOneTurnApplicationService({ provider, workspace: root, georgeInstructions: 'George policy first.' });
  const session = createSession({ id: 'session-1', workspace: root });
  const events = await collect(service.run({ session, input: 'Hi', turnId: 'turn-1' }));

  assert.equal(provider.calls.length, 1);
  assert.match(provider.calls[0]?.request.instructions ?? '', /^George policy first\./);
  assert.ok((provider.calls[0]?.request.instructions ?? '').indexOf('Repository BOOT.md') < (provider.calls[0]?.request.instructions ?? '').indexOf('Repository AGENTS.md'));
  assert.equal(provider.calls[0]?.request.input, 'user: Hi');
  assert.deepEqual(events.map((event) => event.type), [
    'turn.started', 'input.submitted', 'provider.response.started', 'provider.text.delta', 'provider.response.completed', 'turn.completed',
  ]);
  assert.deepEqual(session.transcript, [{ role: 'user', text: 'Hi' }, { role: 'assistant', text: 'Hello.' }]);
});

test('compatibility factory delegates to the canonical tool loop', async (t) => {
  const root = await workspace();
  t.after(() => rm(root, { recursive: true, force: true }));
  const provider = new class implements ModelProvider {
    calls: Array<{ request: ProviderRequest; options: ProviderStreamOptions }> = [];
    async *stream(request: ProviderRequest, options: ProviderStreamOptions = {}): AsyncGenerator<ProviderEvent> {
      this.calls.push({ request, options });
      if (this.calls.length === 1) {
        yield { type: 'provider.response.started', responseId: 'response-1' };
        yield { type: 'provider.tool.call', callId: 'call-1', name: 'read_file', arguments: '{"path":"BOOT.md"}' };
        yield { type: 'provider.response.completed' };
        return;
      }
      yield { type: 'provider.text.delta', delta: 'Read.' };
      yield { type: 'provider.response.completed' };
    }
  }();
  const service = await createOneTurnApplicationService({ provider, workspace: root });
  const events = await collect(service.run({ session: createSession({ workspace: root }), input: 'Read boot', turnId: 'turn-2' }));

  assert.equal(provider.calls.length, 2);
  assert.equal(provider.calls[1]?.request.continuation?.toolResults[0]?.callId, 'call-1');
  assert.equal(events.some((event) => event.type === 'tool.completed'), true);
  assert.equal(events.some((event) => event.type === 'turn.completed'), true);
});

test('one-turn service reports cancellation and provider failure without a retry', async (t) => {
  const root = await workspace();
  t.after(() => rm(root, { recursive: true, force: true }));
  let providerStarted: (() => void) | undefined;
  const started = new Promise<void>((resolve) => { providerStarted = resolve; });
  const cancelled = new class implements ModelProvider {
    calls = 0;

    async *stream(_request: ProviderRequest, options: ProviderStreamOptions = {}): AsyncGenerator<ProviderEvent> {
      this.calls += 1;
      providerStarted?.();
      if (options.signal?.aborted) throw new GeorgeError('cancelled', 'Stopped');
      await new Promise<never>((_resolve, reject) => options.signal?.addEventListener(
        'abort',
        () => reject(new GeorgeError('cancelled', 'Stopped')),
        { once: true },
      ));
    }
  }();
  const cancelledService = await createOneTurnApplicationService({ provider: cancelled, workspace: root });
  const controller = new AbortController();
  const cancelledRun = collect(cancelledService.run({
    session: createSession({ workspace: root }), input: 'Stop', turnId: 'turn-3', signal: controller.signal,
  }));
  await started;
  controller.abort();
  const cancelledEvents = await cancelledRun;
  assert.equal(cancelled.calls, 1);
  assert.equal(cancelledEvents.at(-1)?.type, 'turn.cancelled');

  const failed = new ScriptedProvider([], new Error('offline'));
  const failedService = await createOneTurnApplicationService({ provider: failed, workspace: root });
  const failedEvents = await collect(failedService.run({ session: createSession({ workspace: root }), input: 'Fail', turnId: 'turn-4' }));
  assert.equal(failed.calls.length, 1);
  assert.equal(failedEvents.at(-1)?.type, 'turn.failed');
});
