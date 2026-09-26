import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { createAgentLoopApplicationService } from '../../../src/application/index.ts';
import { createSession, DEFAULT_RUN_BUDGET, GeorgeError, type ApprovalPort, type ApplicationEvent, type ModelProvider, type ProviderEvent, type ProviderRequest } from '../../../src/core/index.ts';
import type { ToolDefinition } from '../../../src/tools/index.ts';

class Provider implements ModelProvider {
  readonly requests: ProviderRequest[] = [];
  private readonly rounds: readonly (readonly ProviderEvent[])[];
  constructor(rounds: readonly (readonly ProviderEvent[])[]) { this.rounds = rounds; }
  async *stream(request: ProviderRequest): AsyncGenerator<ProviderEvent> {
    this.requests.push(request);
    yield* (this.rounds[this.requests.length - 1] ?? [{ type: 'provider.response.completed' }]);
  }
}

const allow: ApprovalPort = { request: async () => 'allow_once' };

async function workspace(): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), 'george-batch-'));
  await Promise.all([
    writeFile(join(root, 'BOOT.md'), 'boot\n'),
    writeFile(join(root, 'AGENTS.md'), 'agents\n'),
    writeFile(join(root, 'a.txt'), 'A\n'),
    writeFile(join(root, 'b.txt'), 'B\n'),
  ]);
  return root;
}

function batch(calls: readonly Extract<ProviderEvent, { type: 'provider.tool.call' }>[]): readonly ProviderEvent[] {
  return [{ type: 'provider.response.started', responseId: 'batch-response' }, ...calls, { type: 'provider.response.completed' }];
}

async function collect(events: AsyncIterable<ApplicationEvent>): Promise<ApplicationEvent[]> {
  const result: ApplicationEvent[] = [];
  for await (const event of events) result.push(event);
  return result;
}

test('all successful batch members execute sequentially and continue once in provider order', async (t) => {
  const root = await workspace(); t.after(() => rm(root, { recursive: true, force: true }));
  const provider = new Provider([batch([
    { type: 'provider.tool.call', callId: 'a', name: 'read_file', arguments: '{"path":"a.txt"}' },
    { type: 'provider.tool.call', callId: 'b', name: 'read_file', arguments: '{"path":"b.txt"}' },
  ]), [{ type: 'provider.response.completed' }]]);
  const service = await createAgentLoopApplicationService({ provider, workspace: root, toolNames: ['read_file'] });
  const events = await collect(service.run({ session: createSession({ workspace: root }), input: 'read' }));
  assert.deepEqual(events.filter((event) => event.type === 'tool.completed').map((event) => event.callId), ['a', 'b']);
  assert.deepEqual(provider.requests[1]?.continuation?.toolResults.map((result) => result.callId), ['a', 'b']);
  assert.equal(provider.requests.length, 2);
});

test('mixed batch success and failure stay explicit per call in one continuation', async (t) => {
  const root = await workspace(); t.after(() => rm(root, { recursive: true, force: true }));
  const provider = new Provider([batch([
    { type: 'provider.tool.call', callId: 'missing', name: 'read_file', arguments: '{"path":"missing.txt"}' },
    { type: 'provider.tool.call', callId: 'present', name: 'read_file', arguments: '{"path":"a.txt"}' },
  ]), [{ type: 'provider.response.completed' }]]);
  const service = await createAgentLoopApplicationService({ provider, workspace: root, toolNames: ['read_file'] });
  await collect(service.run({ session: createSession({ workspace: root }), input: 'read' }));
  assert.deepEqual(provider.requests[1]?.continuation?.toolResults.map((result) => [result.callId, result.result.ok]), [['missing', false], ['present', true]]);
});

test('a malformed batch member never starts and does not suppress a valid peer', async (t) => {
  const root = await workspace(); t.after(() => rm(root, { recursive: true, force: true }));
  const provider = new Provider([batch([
    { type: 'provider.tool.call', callId: 'malformed', name: 'read_file', arguments: '{' },
    { type: 'provider.tool.call', callId: 'valid', name: 'read_file', arguments: '{"path":"a.txt"}' },
  ]), [{ type: 'provider.response.completed' }]]);
  const service = await createAgentLoopApplicationService({ provider, workspace: root, toolNames: ['read_file'] });
  const events = await collect(service.run({ session: createSession({ workspace: root }), input: 'read' }));
  assert.deepEqual(events.filter((event) => event.type === 'tool.started').map((event) => event.callId), ['valid']);
  assert.deepEqual(provider.requests[1]?.continuation?.toolResults.map((result) => [result.callId, result.result.ok]), [['malformed', false], ['valid', true]]);
});

test('duplicate provider call identities fail before batch execution', async (t) => {
  const root = await workspace(); t.after(() => rm(root, { recursive: true, force: true }));
  const provider = new Provider([batch([
    { type: 'provider.tool.call', callId: 'same', name: 'read_file', arguments: '{"path":"a.txt"}' },
    { type: 'provider.tool.call', callId: 'same', name: 'read_file', arguments: '{"path":"b.txt"}' },
  ])]);
  const service = await createAgentLoopApplicationService({ provider, workspace: root, toolNames: ['read_file'] });
  const events = await collect(service.run({ session: createSession({ workspace: root }), input: 'read' }));
  assert.equal(events.some((event) => event.type === 'tool.requested'), false);
  assert.match(events.at(-1)?.type === 'turn.failed' ? events.at(-1).error.message : '', /duplicate call ID/);
});

test('duplicate replay-safe reads remain per-call no-progress decisions inside a batch', async (t) => {
  const root = await workspace(); t.after(() => rm(root, { recursive: true, force: true }));
  const provider = new Provider([batch([
    { type: 'provider.tool.call', callId: 'first', name: 'read_file', arguments: '{"path":"a.txt"}' },
    { type: 'provider.tool.call', callId: 'duplicate', name: 'read_file', arguments: '{"path":"a.txt"}' },
  ]), [{ type: 'provider.response.completed' }]]);
  const service = await createAgentLoopApplicationService({ provider, workspace: root, toolNames: ['read_file'] });
  const events = await collect(service.run({ session: createSession({ workspace: root }), input: 'read', limits: { maxDuplicateLocalReads: 2 } }));
  assert.deepEqual(events.filter((event) => event.type === 'tool.started').map((event) => event.callId), ['first']);
  assert.deepEqual(provider.requests[1]?.continuation?.toolResults.map((result) => [result.callId, result.result.ok]), [['first', true], ['duplicate', false]]);
});

test('a mutation and its dependent peer retain sequential semantics inside a batch', async (t) => {
  const root = await workspace(); t.after(() => rm(root, { recursive: true, force: true }));
  const provider = new Provider([batch([
    { type: 'provider.tool.call', callId: 'directory', name: 'create_directory', arguments: '{"path":"src"}' },
    { type: 'provider.tool.call', callId: 'write', name: 'write_file', arguments: '{"path":"src/app.js","content":"ok\\n"}' },
  ]), [{ type: 'provider.response.completed' }]]);
  const service = await createAgentLoopApplicationService({ provider, workspace: root, toolNames: ['create_directory', 'write_file'], approvalPort: allow });
  const events = await collect(service.run({ session: createSession({ workspace: root }), input: 'write' }));
  assert.deepEqual(events.filter((event) => event.type === 'tool.completed').map((event) => event.callId), ['directory', 'write']);
  assert.equal(await readFile(join(root, 'src/app.js'), 'utf8'), 'ok\n');
  assert.deepEqual(provider.requests[1]?.continuation?.toolResults.map((result) => result.callId), ['directory', 'write']);
});

test('cancellation stops the current batch member without starting later peers', async (t) => {
  const root = await workspace(); t.after(() => rm(root, { recursive: true, force: true }));
  const slow: ToolDefinition = {
    name: 'slow', description: 'Wait for cancellation.', inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    execution: { effect: 'local_read', replaySafety: 'replay_safe', source: { kind: 'builtin' } },
    execute: async (_arguments, options) => new Promise((_, reject) => options.signal?.addEventListener('abort', () => reject(options.signal?.reason), { once: true })),
  };
  const provider = new Provider([batch([
    { type: 'provider.tool.call', callId: 'slow', name: 'slow', arguments: '{}' },
    { type: 'provider.tool.call', callId: 'later', name: 'read_file', arguments: '{"path":"a.txt"}' },
  ])]);
  const service = await createAgentLoopApplicationService({ provider, workspace: root, toolNames: ['slow', 'read_file'], additionalTools: [slow] });
  const controller = new AbortController();
  const iterator = service.run({ session: createSession({ workspace: root }), input: 'read', signal: controller.signal });
  const events: ApplicationEvent[] = [];
  for (;;) {
    const next = await iterator.next();
    if (next.done) break;
    events.push(next.value);
    if (next.value.type === 'tool.started') break;
  }
  const pending = iterator.next();
  controller.abort(new GeorgeError('cancelled', 'stop'));
  const next = await pending; if (!next.done) events.push(next.value);
  for await (const event of iterator) events.push(event);
  assert.equal(events.at(-1)?.type, 'turn.cancelled');
  assert.equal(events.some((event) => event.type === 'tool.requested' && event.callId === 'later'), false);
  assert.equal(provider.requests.length, 1);
});

test('run-budget exhaustion remains authoritative inside a sequential batch', async (t) => {
  const root = await workspace(); t.after(() => rm(root, { recursive: true, force: true }));
  const provider = new Provider([batch([
    { type: 'provider.tool.call', callId: 'first', name: 'read_file', arguments: '{"path":"a.txt"}' },
    { type: 'provider.tool.call', callId: 'over-budget', name: 'read_file', arguments: '{"path":"b.txt"}' },
  ])]);
  const service = await createAgentLoopApplicationService({ provider, workspace: root, toolNames: ['read_file'], runBudget: { ...DEFAULT_RUN_BUDGET, toolExecutions: 1 } });
  const events = await collect(service.run({ session: createSession({ workspace: root }), input: 'read' }));
  assert.deepEqual(events.filter((event) => event.type === 'tool.started').map((event) => event.callId), ['first']);
  assert.equal(events.some((event) => event.type === 'budget.exhausted' && event.dimension === 'toolExecutions'), true);
  assert.equal(events.at(-1)?.type, 'turn.failed');
  assert.equal(provider.requests.length, 1);
});
