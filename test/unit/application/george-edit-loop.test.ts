import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { LocalSessionStore, createSession, type ApprovalPort, type ApplicationEvent, type ModelProvider, type ProviderEvent, type ProviderRequest } from '../../../src/core/index.ts';
import { MAX_GEP_DUAL_PROJECTION_BYTES, StructuredTaskApplicationService, createCodingWorkflowApplicationService, createOneTurnApplicationService } from '../../../src/application/index.ts';

const allow: ApprovalPort = { async request() { return 'allow_once'; } };
const payload = (value: string) => `${Buffer.byteLength(value)}\n${value}\n`;
const edit = (receipt: string, start: number, end: number, replacement: string) => `E ${receipt} 1\nR ${start} ${end} ${payload(replacement)}`;
const create = (path: string, content: string) => `C ${Buffer.byteLength(path)} ${Buffer.byteLength(content)}\n${path}\n${content}\n`;
const packet = (...operations: string[]) => `GEP/1\n${operations.join('')}END\n`;

async function collect(events: AsyncIterable<ApplicationEvent>): Promise<ApplicationEvent[]> {
  const result: ApplicationEvent[] = [];
  for await (const event of events) result.push(event);
  return result;
}

test('Operation reads project ephemeral receipts and completed GEP expands through canonical mutation authority', async (t) => {
  const root = await mkdtemp(join(tmpdir(), 'george-gep-loop-'));
  const state = await mkdtemp(join(tmpdir(), 'george-gep-state-'));
  t.after(() => Promise.all([rm(root, { recursive: true, force: true }), rm(state, { recursive: true, force: true })]));
  const lines = Array.from({ length: 80 }, (_, index) => `line ${String(index + 1).padStart(2, '0')} ${'x'.repeat(24)}`);
  const original = `${lines.join('\n')}\n`;
  await writeFile(join(root, 'target.txt'), original);
  const gep = packet(edit('R1', 20, 30, 'compact replacement'), create('created.txt', 'new file\n'));
  const provider = new class implements ModelProvider {
    requests: ProviderRequest[] = [];
    async *stream(request: ProviderRequest): AsyncGenerator<ProviderEvent> {
      this.requests.push(request);
      if (this.requests.length === 1) {
        yield { type: 'provider.response.started', responseId: 'read' };
        yield { type: 'provider.tool.call', callId: 'read-target', name: 'read_file', arguments: '{"path":"target.txt"}' };
      } else yield { type: 'provider.text.delta', delta: gep };
      yield { type: 'provider.response.completed', ...(this.requests.length === 1 ? { usage: { inputTokens: 8_000, outputTokens: 20 } } : {}) };
    }
  }();
  const service = await createOneTurnApplicationService({ provider, workspace: root, approvalPort: allow, toolNames: ['read_file', 'write_file', 'apply_patch'] });
  const session = createSession({ id: 'gep-loop', workspace: root });
  const events = await collect(service.run({ session, input: 'edit', executionMode: 'operation' }));

  const continuation = provider.requests[1]?.continuation?.toolResults[0];
  assert.equal(continuation?.result.ok, true);
  if (!continuation?.result.ok || !continuation.result.value || typeof continuation.result.value !== 'object' || Array.isArray(continuation.result.value)) throw new Error('Expected compact read evidence.');
  assert.equal(continuation.result.value.name, 'read_file');
  assert.equal(continuation.result.value.path, 'target.txt');
  assert.equal(continuation.result.value.text, original);
  assert.equal(continuation.result.value.bytes, Buffer.byteLength(original));
  assert.equal(continuation.result.value.truncated, false);
  assert.equal(typeof continuation.result.value.sha256, 'string');
  assert.deepEqual(continuation.result.value.textFraming, { lineEnding: 'lf', finalNewline: 'lf' });
  const gepProjection = continuation.result.value.gep as { receipt: string; numberedLines: string };
  assert.equal(gepProjection.receipt, 'R1');
  assert.match(gepProjection.numberedLines, /^1\|line 01/m);
  assert.ok(Buffer.byteLength(JSON.stringify(continuation.result)) <= MAX_GEP_DUAL_PROJECTION_BYTES);
  const promotion = events.find((event) => event.type === 'context.envelope.promoted' && event.reason === 'continuation-estimate');
  assert.equal(promotion?.type === 'context.envelope.promoted' ? promotion.tokens : undefined, 8_000 + 20 + Math.ceil(JSON.stringify(provider.requests[1]?.continuation?.toolResults).length / 4) + 32);
  assert.deepEqual(events.filter((event) => event.type === 'tool.requested').map((event) => event.name), ['read_file', 'apply_patch', 'write_file']);
  assert.deepEqual(events.filter((event) => event.type === 'recovery.intent').map((event) => event.intent.name), ['apply_patch', 'write_file']);
  assert.equal(events.filter((event) => event.type === 'approval.allowed').length, 2);
  const metric = events.find((event) => event.type === 'gep.packet.completed');
  assert.ok(metric && metric.transmissionRatioPpm <= 700_000);
  assert.equal(metric?.receiptCount, 1);
  assert.equal(metric?.editCount, 1);
  assert.equal(metric?.fileCount, 2);
  assert.equal(events.at(-1)?.type, 'turn.completed');
  assert.equal(await readFile(join(root, 'target.txt'), 'utf8'), `${lines.slice(0, 19).join('\n')}\ncompact replacement\n${lines.slice(30).join('\n')}\n`);
  assert.equal(await readFile(join(root, 'created.txt'), 'utf8'), 'new file\n');

  const store = new LocalSessionStore({ root: state });
  await store.save(session);
  const reopened = await store.open(session.id, root);
  assert.equal(reopened.events.some((event) => event.type === 'gep.packet.completed'), true);
  assert.equal(JSON.stringify(reopened.events).includes('line 01'), false);
});

test('Operation dual reads retain the advertised legacy mutation fallback and bounded provider receipts', async (t) => {
  const root = await mkdtemp(join(tmpdir(), 'george-gep-legacy-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  await writeFile(join(root, 'target.txt'), 'before\n');
  const provider = new class implements ModelProvider {
    requests: ProviderRequest[] = [];
    async *stream(request: ProviderRequest): AsyncGenerator<ProviderEvent> {
      this.requests.push(request);
      yield { type: 'provider.response.started', responseId: `legacy-${this.requests.length}` };
      if (this.requests.length === 1) {
        yield { type: 'provider.tool.call', callId: 'read', name: 'read_file', arguments: '{"path":"target.txt"}' };
      } else if (this.requests.length === 2) {
        const result = request.continuation?.toolResults[0]?.result;
        if (!result?.ok || typeof result.value !== 'object' || result.value === null || Array.isArray(result.value)) throw new Error('Expected dual read evidence.');
        yield { type: 'provider.tool.call', callId: 'write', name: 'write_file', arguments: JSON.stringify({ path: 'target.txt', content: 'after\n', expectedSha256: result.value.sha256 }) };
      } else yield { type: 'provider.text.delta', delta: '{"version":1,"control":"handoff"}' };
      yield { type: 'provider.response.completed' };
    }
  }();
  const service = await createOneTurnApplicationService({ provider, workspace: root, approvalPort: allow, toolNames: ['read_file', 'write_file', 'apply_patch'] });
  const events = await collect(service.run({ session: createSession({ workspace: root }), input: 'edit', executionMode: 'operation' }));

  assert.deepEqual(provider.requests[0]?.tools?.map((tool) => tool.name), ['read_file', 'write_file', 'apply_patch']);
  const read = provider.requests[1]?.continuation?.toolResults[0]?.result;
  assert.equal(read?.ok && typeof read.value === 'object' && read.value !== null && !Array.isArray(read.value) && typeof read.value.sha256, 'string');
  const mutation = provider.requests[2]?.continuation?.toolResults[0];
  assert.equal(mutation?.result.ok, true);
  assert.deepEqual(mutation?.result.ok ? mutation.result.value : undefined, {
    name: 'write_file', path: 'target.txt', bytes: 6, sha256: '7b9a72466d3960eb2aacccfc848939453490db0678bd4725def3f789b891c919',
  });
  assert.equal(events.at(-1)?.type, 'turn.completed');
  assert.equal(await readFile(join(root, 'target.txt'), 'utf8'), 'after\n');
});

test('GEP mixed output, incomplete responses, denial, and cancellation fail before unsafe mutation', async (t) => {
  const root = await mkdtemp(join(tmpdir(), 'george-gep-fail-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  await writeFile(join(root, 'target.txt'), 'one\ntwo\n');

  const run = async (provider: ModelProvider, approvalPort: ApprovalPort = allow, signal?: AbortSignal) => {
    const service = await createOneTurnApplicationService({ provider, workspace: root, approvalPort, providerRetryPolicy: { maxRetries: 0, initialDelayMs: 0, maxDelayMs: 0 }, toolNames: ['read_file', 'apply_patch'] });
    return collect(service.run({ session: createSession({ workspace: root }), input: 'edit', executionMode: 'operation', ...(signal === undefined ? {} : { signal }) }));
  };

  const mixed = new class implements ModelProvider { async *stream(): AsyncGenerator<ProviderEvent> {
    yield { type: 'provider.response.started', responseId: 'mixed' };
    yield { type: 'provider.text.delta', delta: packet(edit('R1', 1, 1, 'changed')) };
    yield { type: 'provider.tool.call', callId: 'also', name: 'apply_patch', arguments: '{}' };
    yield { type: 'provider.response.completed' };
  } }();
  assert.equal((await run(mixed)).at(-1)?.type, 'turn.failed');

  const incomplete = new class implements ModelProvider { async *stream(): AsyncGenerator<ProviderEvent> {
    yield { type: 'provider.text.delta', delta: packet(edit('R1', 1, 1, 'changed')) };
    yield { type: 'provider.error', error: { code: 'provider', message: 'stream ended' } };
  } }();
  assert.equal((await run(incomplete)).at(-1)?.type, 'turn.failed');

  const twoRound = (approvalPort: ApprovalPort, signal?: AbortSignal) => run(new class implements ModelProvider {
    calls = 0;
    async *stream(): AsyncGenerator<ProviderEvent> {
      if (this.calls++ === 0) {
        yield { type: 'provider.response.started', responseId: 'read' };
        yield { type: 'provider.tool.call', callId: 'read', name: 'read_file', arguments: '{"path":"target.txt"}' };
      } else yield { type: 'provider.text.delta', delta: packet(edit('R1', 1, 1, 'changed')) };
      yield { type: 'provider.response.completed' };
    }
  }(), approvalPort, signal);
  const denied = await twoRound({ async request() { return 'deny'; } });
  assert.equal(denied.some((event) => event.type === 'approval.denied'), true);
  assert.equal(denied.at(-1)?.type, 'turn.failed');

  const controller = new AbortController();
  const cancelled = await twoRound({ async request() { controller.abort(); return 'allow_once'; } }, controller.signal);
  assert.equal(cancelled.at(-1)?.type, 'turn.cancelled');
  assert.equal(await readFile(join(root, 'target.txt'), 'utf8'), 'one\ntwo\n');
});

test('structured implementation prefers a fresh GEP receipt and retains George-owned validation', async (t) => {
  const root = await mkdtemp(join(tmpdir(), 'george-gep-structured-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  await writeFile(join(root, 'target.txt'), 'before\n');
  const provider = new class implements ModelProvider {
    readonly supportsRoundContext = true as const;
    calls = 0;
    async *stream(): AsyncGenerator<ProviderEvent> {
      if (this.calls++ === 0) {
        yield { type: 'provider.response.started', responseId: 'read' };
        yield { type: 'provider.tool.call', callId: 'read', name: 'read_file', arguments: '{"path":"target.txt"}' };
      } else yield { type: 'provider.text.delta', delta: packet(edit('R1', 1, 1, 'after')) };
      yield { type: 'provider.response.completed' };
    }
  }();
  const workflow = await createCodingWorkflowApplicationService({ provider, workspace: root, approvalPort: allow });
  const service = new StructuredTaskApplicationService(workflow.agent);
  const session = createSession({ workspace: root });
  const task = `GEORGE TASK FORMAT: 1

TASK: P3 — GEP structured
KIND: implementation

GOAL

Edit target.txt through the compact mutation path.

REQUIREMENTS

- R1: target.txt contains after.

WORKFLOW

W1 — Edit target
Covers: R1
Depends on: none

VALIDATION

V1 — Node available
Covers: R1
Run: node --version

STOP CONDITIONS

- S1: Stop on mutation failure.
`;
  const events: ApplicationEvent[] = [];
  const completion = await service.run({ session, input: task, onEvent: (event) => { events.push(event); } });
  assert.equal(completion.terminalState, 'completed');
  assert.equal(session.taskState?.status, 'completed');
  assert.equal(session.taskState?.validations.V1?.status, 'passed');
  assert.equal(events.some((event) => event.type === 'gep.packet.completed'), true);
  assert.equal(events.some((event) => event.type === 'validation.completed' && event.status === 'passed'), true);
  assert.equal(await readFile(join(root, 'target.txt'), 'utf8'), 'after\n');
});
