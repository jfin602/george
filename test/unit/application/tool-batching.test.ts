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

test('independent replay-safe local reads overlap and continue once in provider order', async (t) => {
  const root = await workspace(); t.after(() => rm(root, { recursive: true, force: true }));
  const started: string[] = [];
  let release!: () => void;
  const ready = new Promise<void>((resolve) => { release = resolve; });
  const delayed: ToolDefinition = {
    name: 'delayed_read', description: 'Read after a deterministic delay.',
    inputSchema: { type: 'object', properties: { id: { type: 'string' }, delayMs: { type: 'integer' } }, required: ['id', 'delayMs'], additionalProperties: false },
    execution: { effect: 'local_read', replaySafety: 'replay_safe', source: { kind: 'builtin' } },
    execute: async (arguments_) => {
      started.push(arguments_.id as string);
      if (started.length === 3) release();
      await ready;
      await new Promise((resolve) => setTimeout(resolve, arguments_.delayMs as number));
      return { id: arguments_.id as string };
    },
  };
  const provider = new Provider([batch([
    { type: 'provider.tool.call', callId: 'a', name: 'delayed_read', arguments: '{"id":"a","delayMs":30}' },
    { type: 'provider.tool.call', callId: 'b', name: 'delayed_read', arguments: '{"id":"b","delayMs":10}' },
    { type: 'provider.tool.call', callId: 'c', name: 'delayed_read', arguments: '{"id":"c","delayMs":20}' },
  ]), [{ type: 'provider.response.completed' }]]);
  const service = await createAgentLoopApplicationService({ provider, workspace: root, toolNames: ['delayed_read'], additionalTools: [delayed] });
  const events = await collect(service.run({ session: createSession({ workspace: root }), input: 'read' }));
  assert.deepEqual(started, ['a', 'b', 'c']);
  assert.deepEqual(events.filter((event) => event.type === 'tool.completed').map((event) => event.callId), ['b', 'c', 'a']);
  assert.deepEqual(provider.requests[1]?.continuation?.toolResults.map((result) => result.callId), ['a', 'b', 'c']);
  const metric = events.find((event) => event.type === 'tool.concurrent-read-batch.completed');
  assert.ok(metric && metric.width === 3 && metric.summedMemberMs > metric.wallMs && metric.observedOverlapMs > 0);
  for (const callId of ['a', 'b', 'c']) {
    assert.equal(events.filter((event) => event.type === 'tool.requested' && event.callId === callId).length, 1);
    assert.equal(events.filter((event) => event.type === 'tool.started' && event.callId === callId).length, 1);
    assert.equal(events.filter((event) => event.type === 'tool.completed' && event.callId === callId).length, 1);
  }
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

test('mutations and calls dependent on their results retain sequential semantics inside a batch', async (t) => {
  const root = await workspace(); t.after(() => rm(root, { recursive: true, force: true }));
  const provider = new Provider([batch([
    { type: 'provider.tool.call', callId: 'directory', name: 'create_directory', arguments: '{"path":"src"}' },
    { type: 'provider.tool.call', callId: 'write', name: 'write_file', arguments: '{"path":"src/app.js","content":"ok\\n"}' },
    { type: 'provider.tool.call', callId: 'list', name: 'list_directory', arguments: '{"path":"src"}' },
  ]), [{ type: 'provider.response.completed' }]]);
  const service = await createAgentLoopApplicationService({ provider, workspace: root, toolNames: ['create_directory', 'write_file', 'list_directory'], approvalPort: allow });
  const events = await collect(service.run({ session: createSession({ workspace: root }), input: 'write' }));
  assert.deepEqual(events.filter((event) => event.type === 'tool.completed').map((event) => event.callId), ['directory', 'write', 'list']);
  assert.equal(await readFile(join(root, 'src/app.js'), 'utf8'), 'ok\n');
  assert.deepEqual(provider.requests[1]?.continuation?.toolResults.map((result) => result.callId), ['directory', 'write', 'list']);
  assert.equal(events.some((event) => event.type === 'tool.concurrent-read-batch.completed'), false);
});

test('a successful mutation advances the duplicate-read epoch inside one batch', async (t) => {
  const root = await workspace(); t.after(() => rm(root, { recursive: true, force: true }));
  const read: ToolDefinition = { name: 'observe', description: 'observe', inputSchema: { type: 'object', properties: {}, additionalProperties: false }, execution: { effect: 'local_read', replaySafety: 'replay_safe', source: { kind: 'builtin' } }, execute: async () => ({ ok: true }) };
  const mutate: ToolDefinition = { name: 'mutate', description: 'mutate', inputSchema: { type: 'object', properties: { path: { type: 'string' } }, required: ['path'], additionalProperties: false }, execution: { effect: 'workspace_mutation', replaySafety: 'not_replay_safe', source: { kind: 'builtin' } }, execute: async () => ({ ok: true }) };
  const provider = new Provider([batch([
    { type: 'provider.tool.call', callId: 'before', name: 'observe', arguments: '{}' },
    { type: 'provider.tool.call', callId: 'mutation', name: 'mutate', arguments: '{"path":"a.txt"}' },
    { type: 'provider.tool.call', callId: 'after', name: 'observe', arguments: '{}' },
  ]), [{ type: 'provider.response.completed' }]]);
  const service = await createAgentLoopApplicationService({ provider, workspace: root, toolNames: ['observe', 'mutate'], additionalTools: [read, mutate], approvalPort: allow });
  const events = await collect(service.run({ session: createSession({ workspace: root }), input: 'read', limits: { maxDuplicateLocalReads: 1 } }));
  assert.deepEqual(events.filter((event) => event.type === 'tool.completed').map((event) => event.callId), ['before', 'mutation', 'after']);
  assert.equal(events.some((event) => event.type === 'tool.failed' && /Equivalent unchanged/.test(event.result.error.message)), false);
});

test('caller cancellation reaches every member of a concurrent read batch', async (t) => {
  const root = await workspace(); t.after(() => rm(root, { recursive: true, force: true }));
  const cancelled: string[] = [];
  const slow: ToolDefinition = {
    name: 'slow', description: 'Wait for cancellation.', inputSchema: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'], additionalProperties: false },
    execution: { effect: 'local_read', replaySafety: 'replay_safe', source: { kind: 'builtin' } },
    execute: async (arguments_, options) => new Promise((_, reject) => options.signal?.addEventListener('abort', () => { cancelled.push(arguments_.id as string); reject(options.signal?.reason); }, { once: true })),
  };
  const provider = new Provider([batch([
    { type: 'provider.tool.call', callId: 'first', name: 'slow', arguments: '{"id":"first"}' },
    { type: 'provider.tool.call', callId: 'second', name: 'slow', arguments: '{"id":"second"}' },
  ])]);
  const service = await createAgentLoopApplicationService({ provider, workspace: root, toolNames: ['slow'], additionalTools: [slow] });
  const controller = new AbortController();
  const iterator = service.run({ session: createSession({ workspace: root }), input: 'read', signal: controller.signal });
  const events: ApplicationEvent[] = [];
  while (events.filter((event) => event.type === 'tool.started').length < 2) {
    const next = await iterator.next();
    if (next.done) break;
    events.push(next.value);
  }
  const pending = iterator.next();
  controller.abort(new GeorgeError('cancelled', 'stop'));
  const next = await pending; if (!next.done) events.push(next.value);
  for await (const event of iterator) events.push(event);
  assert.equal(events.at(-1)?.type, 'turn.cancelled');
  assert.deepEqual(cancelled.sort(), ['first', 'second']);
  assert.deepEqual(events.filter((event) => event.type === 'tool.started').map((event) => event.callId), ['first', 'second']);
  assert.equal(events.some((event) => event.type === 'tool.completed'), false);
  assert.equal(provider.requests.length, 1);
});

test('canonical unsafe effects are barriers even when paired with a replay-safe local read', async (t) => {
  const effects: readonly ToolDefinition['execution'][] = [
    { effect: 'workspace_mutation', replaySafety: 'not_replay_safe', source: { kind: 'builtin' } },
    { effect: 'sandboxed_workspace_process', replaySafety: 'not_replay_safe', source: { kind: 'builtin' } },
    { effect: 'host_process', replaySafety: 'not_replay_safe', source: { kind: 'builtin' } },
    { effect: 'external_read', replaySafety: 'replay_safe', source: { kind: 'adapter', id: 'test' } },
    { effect: 'remote_mutation', replaySafety: 'not_replay_safe', source: { kind: 'adapter', id: 'test' } },
    { effect: 'browser_observation', replaySafety: 'replay_safe', source: { kind: 'adapter', id: 'test' } },
    { effect: 'browser_interaction', replaySafety: 'not_replay_safe', source: { kind: 'adapter', id: 'test' } },
    { effect: 'unknown_external', replaySafety: 'not_replay_safe', source: { kind: 'adapter', id: 'test' } },
  ];
  for (const execution of effects) await t.test(execution.effect, async (t) => {
    const root = await workspace(); t.after(() => rm(root, { recursive: true, force: true }));
    let active = 0; let maximum = 0;
    const execute = async () => { active += 1; maximum = Math.max(maximum, active); await new Promise((resolve) => setTimeout(resolve, 10)); active -= 1; return { ok: true }; };
    const local: ToolDefinition = { name: 'local', description: 'local', inputSchema: { type: 'object', properties: {}, additionalProperties: false }, execution: { effect: 'local_read', replaySafety: 'replay_safe', source: { kind: 'builtin' } }, execute };
    const unsafe: ToolDefinition = {
      name: 'unsafe', description: 'unsafe',
      inputSchema: { type: 'object', properties: { path: { type: 'string' }, cwd: { type: 'string' }, executable: { type: 'string' }, arguments: { type: 'array', items: { type: 'string' } } }, additionalProperties: false },
      execution, execute,
    };
    const provider = new Provider([batch([
      { type: 'provider.tool.call', callId: 'local', name: 'local', arguments: '{}' },
      { type: 'provider.tool.call', callId: 'unsafe', name: 'unsafe', arguments: '{"path":"a.txt","cwd":".","executable":"node","arguments":[]}' },
    ]), [{ type: 'provider.response.completed' }]]);
    const service = await createAgentLoopApplicationService({ provider, workspace: root, toolNames: ['local', 'unsafe'], additionalTools: [local, unsafe], approvalPort: allow });
    const events = await collect(service.run({ session: createSession({ workspace: root }), input: 'read' }));
    assert.equal(maximum, 1);
    assert.equal(events.some((event) => event.type === 'tool.concurrent-read-batch.completed'), false);
    assert.deepEqual(events.filter((event) => event.type === 'tool.started').map((event) => event.callId), ['local', 'unsafe']);
  });
});

test('an outside-workspace approval is a concurrency barrier for canonical local reads', async (t) => {
  const root = await workspace(); t.after(() => rm(root, { recursive: true, force: true }));
  const outside = await mkdtemp(join(tmpdir(), 'george-batch-outside-')); t.after(() => rm(outside, { recursive: true, force: true }));
  const path = join(outside, 'outside.txt'); await writeFile(path, 'outside\n');
  const provider = new Provider([batch([
    { type: 'provider.tool.call', callId: 'outside', name: 'read_file', arguments: JSON.stringify({ path }) },
    { type: 'provider.tool.call', callId: 'inside', name: 'read_file', arguments: '{"path":"a.txt"}' },
  ]), [{ type: 'provider.response.completed' }]]);
  const service = await createAgentLoopApplicationService({
    provider, workspace: root, toolNames: ['read_file'], approvalPort: allow,
    executionPolicy: { workspace: 'workspace_autonomous', outsideWorkspace: 'ask', network: 'ask', remoteMutation: 'ask', browserInteraction: 'ask', credentialsEnvironment: 'ask' },
  });
  const events = await collect(service.run({ session: createSession({ workspace: root }), input: 'read' }));
  assert.equal(events.some((event) => event.type === 'approval.requested' && event.callId === 'outside'), true);
  assert.equal(events.some((event) => event.type === 'tool.concurrent-read-batch.completed'), false);
  assert.deepEqual(provider.requests[1]?.continuation?.toolResults.map((result) => [result.callId, result.result.ok]), [['outside', true], ['inside', true]]);
});

test('run-budget exhaustion remains authoritative inside a concurrent batch', async (t) => {
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
