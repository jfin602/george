import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { chmod, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { createAgentLoopApplicationService } from '../../src/application/index.ts';
import { createSession, GeorgeError, PendingApprovalPort, type ApprovalDecision, type ApprovalPort, type ApprovalRequest, type ApplicationEvent, type ModelProvider, type ProviderEvent, type ProviderRequest, type ProviderStreamOptions } from '../../src/core/index.ts';

class ScriptedProvider implements ModelProvider {
  readonly calls: Array<{ request: ProviderRequest; options: ProviderStreamOptions }> = [];
  private readonly rounds: readonly (readonly ProviderEvent[])[];

  constructor(rounds: readonly (readonly ProviderEvent[])[]) {
    this.rounds = rounds;
  }

  async *stream(request: ProviderRequest, options: ProviderStreamOptions = {}): AsyncGenerator<ProviderEvent> {
    this.calls.push({ request, options });
    yield* (this.rounds[this.calls.length - 1] ?? [{ type: 'provider.response.completed' }]);
  }
}

async function fixture(): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), 'george-loop-'));
  await Promise.all([
    writeFile(join(root, 'BOOT.md'), 'fixture boot\n'),
    writeFile(join(root, 'AGENTS.md'), 'fixture agents\n'),
    writeFile(join(root, 'two.txt'), 'second file\n'),
  ]);
  return root;
}

async function collect<T>(events: AsyncIterable<T>): Promise<T[]> {
  const result: T[] = [];
  for await (const event of events) result.push(event);
  return result;
}

class ScriptedApproval implements ApprovalPort {
  readonly requests: ApprovalRequest[] = [];
  private readonly decisions: readonly ApprovalDecision[];
  constructor(decisions: readonly ApprovalDecision[]) { this.decisions = decisions; }
  async request(request: ApprovalRequest): Promise<ApprovalDecision> {
    this.requests.push(request);
    return this.decisions[this.requests.length - 1] ?? 'deny';
  }
}

test('fixture repository completes read tool -> result -> final answer with original call ID evidence', async (t) => {
  const root = await fixture();
  t.after(() => rm(root, { recursive: true, force: true }));
  const provider = new ScriptedProvider([
    [
      { type: 'provider.response.started', responseId: 'response-1' },
      { type: 'provider.tool.call', callId: 'call-read', name: 'read_file', arguments: '{"path":"BOOT.md"}' },
      { type: 'provider.response.completed' },
    ],
    [{ type: 'provider.text.delta', delta: 'The fixture boot was read.' }, { type: 'provider.response.completed' }],
  ]);
  const service = await createAgentLoopApplicationService({ provider, workspace: root });
  const session = createSession({ workspace: root });
  const events = await collect(service.run({ session, input: 'Read the boot.', turnId: 'turn-read' }));

  assert.equal(provider.calls.length, 2);
  assert.deepEqual(provider.calls[0]?.request.tools?.map((tool) => tool.name), ['read_file', 'list_directory', 'search_text', 'git_status', 'git_diff', 'write_file', 'apply_patch', 'run_process']);
  assert.deepEqual(provider.calls[1]?.request.continuation?.toolResults[0]?.callId, 'call-read');
  assert.equal(provider.calls[1]?.request.continuation?.toolResults[0]?.result.ok, true);
  assert.deepEqual(events.filter((event) => event.type.startsWith('tool.')).map((event) => event.type), ['tool.requested', 'tool.started', 'tool.completed']);
  assert.deepEqual(session.events, events);
  assert.deepEqual(session.transcript, [{ role: 'user', text: 'Read the boot.' }, { role: 'assistant', text: 'The fixture boot was read.' }]);
});

test('calls execute in provider order across same-response and multiple tool rounds', async (t) => {
  const root = await fixture();
  t.after(() => rm(root, { recursive: true, force: true }));
  const provider = new ScriptedProvider([
    [
      { type: 'provider.response.started', responseId: 'response-1' },
      { type: 'provider.tool.call', callId: 'first', name: 'read_file', arguments: '{"path":"BOOT.md"}' },
      { type: 'provider.tool.call', callId: 'second', name: 'read_file', arguments: '{"path":"two.txt"}' },
      { type: 'provider.response.completed' },
    ],
    [
      { type: 'provider.response.started', responseId: 'response-2' },
      { type: 'provider.tool.call', callId: 'third', name: 'list_directory', arguments: '{"path":"."}' },
      { type: 'provider.response.completed' },
    ],
    [{ type: 'provider.text.delta', delta: 'Done.' }, { type: 'provider.response.completed' }],
  ]);
  const service = await createAgentLoopApplicationService({ provider, workspace: root });
  const events = await collect(service.run({ session: createSession({ workspace: root }), input: 'Inspect.' }));

  assert.deepEqual(events.filter((event) => event.type === 'tool.completed').map((event) => event.callId), ['first', 'second', 'third']);
  assert.deepEqual(provider.calls[1]?.request.continuation?.toolResults.map((result) => result.callId), ['first', 'second']);
  assert.deepEqual(provider.calls[2]?.request.continuation?.toolResults.map((result) => result.callId), ['third']);
});

test('invalid calls never start an executor and recover through structured continuation results', async (t) => {
  const root = await fixture();
  t.after(() => rm(root, { recursive: true, force: true }));
  const provider = new ScriptedProvider([
    [
      { type: 'provider.response.started', responseId: 'response-invalid' },
      { type: 'provider.tool.call', callId: 'unknown', name: 'nope', arguments: '{}' },
      { type: 'provider.tool.call', callId: 'json', name: 'read_file', arguments: '{' },
      { type: 'provider.tool.call', callId: 'schema', name: 'read_file', arguments: '{"path":3}' },
      { type: 'provider.response.completed' },
    ],
    [{ type: 'provider.text.delta', delta: 'Corrected.' }, { type: 'provider.response.completed' }],
  ]);
  const approval = new ScriptedApproval(['allow_once']);
  const service = await createAgentLoopApplicationService({ provider, workspace: root, approvalPort: approval });
  const events = await collect(service.run({ session: createSession({ workspace: root }), input: 'Try tools.' }));
  const failures = events.filter((event) => event.type === 'tool.failed');

  assert.equal(events.some((event) => event.type === 'tool.started'), false);
  assert.deepEqual(failures.map((event) => event.callId), ['unknown', 'json', 'schema']);
  assert.deepEqual(provider.calls[1]?.request.continuation?.toolResults.map((result) => result.result.ok), [false, false, false]);
  assert.equal(approval.requests.length, 0);
  assert.equal(events.at(-1)?.type, 'turn.completed');
});

test('executor failures recover, while every proposed call consumes the deterministic hard limit', async (t) => {
  const root = await fixture();
  t.after(() => rm(root, { recursive: true, force: true }));
  const recover = new ScriptedProvider([
    [
      { type: 'provider.response.started', responseId: 'response-failure' },
      { type: 'provider.tool.call', callId: 'missing', name: 'read_file', arguments: '{"path":"missing.txt"}' },
      { type: 'provider.response.completed' },
    ],
    [{ type: 'provider.text.delta', delta: 'I will try another path.' }, { type: 'provider.response.completed' }],
  ]);
  const recoverService = await createAgentLoopApplicationService({ provider: recover, workspace: root });
  const recoverEvents = await collect(recoverService.run({ session: createSession({ workspace: root }), input: 'Read missing.' }));
  assert.equal(recover.calls[1]?.request.continuation?.toolResults[0]?.result.ok, false);
  assert.equal(recoverEvents.at(-1)?.type, 'turn.completed');

  const limited = new ScriptedProvider([[
    { type: 'provider.response.started', responseId: 'response-limit' },
    { type: 'provider.tool.call', callId: 'valid', name: 'read_file', arguments: '{"path":"BOOT.md"}' },
    { type: 'provider.tool.call', callId: 'invalid-counts', name: 'nope', arguments: '{}' },
    { type: 'provider.response.completed' },
  ]]);
  const limitService = await createAgentLoopApplicationService({ provider: limited, workspace: root, maxToolCalls: 1 });
  const limitEvents = await collect(limitService.run({ session: createSession({ workspace: root }), input: 'Loop.' }));
  assert.deepEqual(limitEvents.filter((event) => event.type === 'tool.requested').map((event) => event.callId), ['valid', 'invalid-counts']);
  assert.equal(limitEvents.at(-1)?.type, 'turn.failed');
  assert.equal(limited.calls.length, 1);

  const roundLimited = new ScriptedProvider([
    [
      { type: 'provider.response.started', responseId: 'round-1' },
      { type: 'provider.tool.call', callId: 'round-first', name: 'read_file', arguments: '{"path":"BOOT.md"}' },
      { type: 'provider.response.completed' },
    ],
    [
      { type: 'provider.response.started', responseId: 'round-2' },
      { type: 'provider.tool.call', callId: 'round-second', name: 'nope', arguments: '{}' },
      { type: 'provider.response.completed' },
    ],
  ]);
  const roundService = await createAgentLoopApplicationService({ provider: roundLimited, workspace: root, maxToolRounds: 1 });
  const roundEvents = await collect(roundService.run({ session: createSession({ workspace: root }), input: 'Rounds.' }));
  assert.deepEqual(roundEvents.filter((event) => event.type === 'tool.requested').map((event) => event.callId), ['round-first', 'round-second']);
  assert.equal(roundEvents.at(-1)?.type, 'turn.failed');
});

test('cancellation during a read-only tool execution terminates the turn cleanly', async (t) => {
  const root = await fixture();
  const bin = join(root, 'bin');
  await mkdir(bin);
  await writeFile(join(bin, 'git'), '#!/usr/bin/env node\nsetInterval(() => {}, 1_000);\n');
  await chmod(join(bin, 'git'), 0o755);
  t.after(() => rm(root, { recursive: true, force: true }));
  const oldPath = process.env.PATH;
  process.env.PATH = `${bin}:${oldPath ?? ''}`;
  t.after(() => { process.env.PATH = oldPath; });
  const provider = new ScriptedProvider([[
    { type: 'provider.response.started', responseId: 'response-cancel' },
    { type: 'provider.tool.call', callId: 'git', name: 'git_status', arguments: '{}' },
    { type: 'provider.response.completed' },
  ]]);
  const service = await createAgentLoopApplicationService({ provider, workspace: root });
  const controller = new AbortController();
  const iterator = service.run({ session: createSession({ workspace: root }), input: 'Status.', signal: controller.signal });
  let event: IteratorResult<ApplicationEvent>;
  do {
    event = await iterator.next();
  } while (!event.done && event.value.type !== 'tool.started');
  const pending = iterator.next();
  await new Promise((resolve) => setTimeout(resolve, 20));
  controller.abort(new GeorgeError('cancelled', 'Stopped'));
  const firstAfterAbort = await pending;
  const remaining: ApplicationEvent[] = [];
  if (!firstAfterAbort.done) remaining.push(firstAfterAbort.value);
  for await (const item of iterator) remaining.push(item);
  assert.equal(remaining.at(-1)?.type, 'turn.cancelled');
});

test('approval is per normalized risky call: allow-once executes once and denial is returned to the model', async (t) => {
  const root = await fixture();
  t.after(() => rm(root, { recursive: true, force: true }));
  const approval = new ScriptedApproval(['allow_once', 'allow_once']);
  const allowed = new ScriptedProvider([
    [
      { type: 'provider.response.started', responseId: 'write-response' },
      { type: 'provider.tool.call', callId: 'write-one', name: 'write_file', arguments: '{"path":"one.txt","content":"one"}' },
      { type: 'provider.tool.call', callId: 'write-two', name: 'write_file', arguments: '{"path":"three.txt","content":"two"}' },
      { type: 'provider.response.completed' },
    ],
    [{ type: 'provider.text.delta', delta: 'Written.' }, { type: 'provider.response.completed' }],
  ]);
  const service = await createAgentLoopApplicationService({ provider: allowed, workspace: root, approvalPort: approval });
  const events = await collect(service.run({ session: createSession({ workspace: root }), input: 'Write both.' }));
  assert.equal(approval.requests.length, 2);
  assert.deepEqual(events.filter((event) => event.type === 'approval.allowed').map((event) => event.callId), ['write-one', 'write-two']);
  assert.equal(await readFile(join(root, 'one.txt'), 'utf8'), 'one');
  assert.equal(await readFile(join(root, 'three.txt'), 'utf8'), 'two');

  const deniedApproval = new ScriptedApproval(['deny']);
  const denied = new ScriptedProvider([
    [
      { type: 'provider.response.started', responseId: 'deny-response' },
      { type: 'provider.tool.call', callId: 'write-denied', name: 'write_file', arguments: '{"path":"denied.txt","content":"never"}' },
      { type: 'provider.response.completed' },
    ],
    [{ type: 'provider.response.completed' }],
  ]);
  const deniedService = await createAgentLoopApplicationService({ provider: denied, workspace: root, approvalPort: deniedApproval });
  const deniedEvents = await collect(deniedService.run({ session: createSession({ workspace: root }), input: 'Do not write.' }));
  assert.equal(deniedEvents.some((event) => event.type === 'tool.started' && event.callId === 'write-denied'), false);
  assert.equal(denied.calls[1]?.request.continuation?.toolResults[0]?.result.error?.code, 'denied');
  await assert.rejects(() => readFile(join(root, 'denied.txt')));
});

test('approval metadata is normalized, marks dirty write targets, warns about processes, and cancellation stops the pending request', async (t) => {
  const root = await fixture();
  t.after(() => rm(root, { recursive: true, force: true }));
  execFileSync('git', ['init', '--quiet'], { cwd: root });
  await writeFile(join(root, 'dirty.txt'), 'before');
  const hash = createHash('sha256').update('before').digest('hex');
  const approval = new PendingApprovalPort();
  const provider = new ScriptedProvider([[
    { type: 'provider.response.started', responseId: 'approval-response' },
    { type: 'provider.tool.call', callId: 'dirty', name: 'write_file', arguments: JSON.stringify({ path: 'dirty.txt', content: 'after', expectedSha256: hash }) },
    { type: 'provider.response.completed' },
  ]]);
  const service = await createAgentLoopApplicationService({ provider, workspace: root, approvalPort: approval });
  const controller = new AbortController();
  const iterator = service.run({ session: createSession({ workspace: root }), input: 'Wait.', signal: controller.signal });
  let event: IteratorResult<ApplicationEvent>;
  do event = await iterator.next(); while (!event.done && event.value.type !== 'approval.requested');
  assert.equal(event.value.type, 'approval.requested');
  if (event.value.type !== 'approval.requested') throw new Error('Expected approval request.');
  assert.deepEqual(event.value.request.target, { path: 'dirty.txt', alreadyDirty: true });
  const pending = iterator.next();
  controller.abort(new GeorgeError('cancelled', 'Stopped'));
  const remainder: ApplicationEvent[] = [];
  const next = await pending;
  if (!next.done) remainder.push(next.value);
  for await (const item of iterator) remainder.push(item);
  assert.equal(remainder.at(-1)?.type, 'turn.cancelled');

  const processApproval = new ScriptedApproval(['deny']);
  const processProvider = new ScriptedProvider([[
    { type: 'provider.response.started', responseId: 'process-response' },
    { type: 'provider.tool.call', callId: 'process', name: 'run_process', arguments: '{"executable":"node","arguments":["-e","0"],"cwd":"."}' },
    { type: 'provider.response.completed' },
  ], [{ type: 'provider.response.completed' }]]);
  const processService = await createAgentLoopApplicationService({ provider: processProvider, workspace: root, approvalPort: processApproval });
  await collect(processService.run({ session: createSession({ workspace: root }), input: 'Inspect process.' }));
  assert.deepEqual(processApproval.requests[0]?.process, {
    executable: 'node', argv: ['-e', '0'], cwd: '.', warning: 'Approved arbitrary processes are not OS/workspace sandboxed.',
  });
});
