import assert from 'node:assert/strict';
import { readFile, rm } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { StructuredTaskApplicationService, createCodingWorkflowApplicationService } from '../../../src/application/index.ts';
import { agenticContextCases, createBenchmarkFixture } from '../../../src/benchmark/index.ts';
import { createSession, type ApplicationEvent, type ModelProvider, type ProviderEvent, type ProviderRequest } from '../../../src/core/index.ts';
import { createFrozenEditQualificationApproval } from '../../../src/qualification/index.ts';
import { parseTaskPrompt } from '../../../src/tasks/index.ts';

const fixturePath = join(dirname(fileURLToPath(import.meta.url)), '../../fixtures/p9-phase8-structured-edit-validation.task.txt');

class ObservedHashProvider implements ModelProvider {
  readonly requests: ProviderRequest[] = [];
  observedSha256: string | undefined;
  rejection: string | undefined;
  private readonly path: string;
  private readonly content: string;
  constructor(path: string, content: string) { this.path = path; this.content = content; }
  async *stream(request: ProviderRequest): AsyncGenerator<ProviderEvent> {
    this.requests.push(request);
    const round = this.requests.length;
    if (round === 1) {
      yield { type: 'provider.response.started', responseId: 'inspect' };
      yield { type: 'provider.tool.call', callId: 'inspect-read', name: 'read_file', arguments: JSON.stringify({ path: this.path }) };
    } else if (round === 2) {
      const sha = request.input.match(/"sha256":"([a-f0-9]{64})"/)?.[1];
      if (!sha || !request.input.includes('"textFraming":{"lineEnding":"lf","finalNewline":"lf"}')) throw new Error('George did not project read_file SHA and framing into implementation evidence.');
      this.observedSha256 = sha;
      yield { type: 'provider.response.started', responseId: 'bad-write' };
      yield { type: 'provider.tool.call', callId: 'bad-write', name: 'write_file', arguments: JSON.stringify({ path: this.path, content: this.content.slice(0, -1), expectedSha256: sha }) };
    } else if (round === 3) {
      const result = request.continuation?.toolResults[0]?.result;
      if (!result || result.ok || result.error.code !== 'validation') throw new Error('George did not return the framing rejection as a recoverable validation failure.');
      this.rejection = result.error.message;
      yield { type: 'provider.response.started', responseId: 'reread' };
      yield { type: 'provider.tool.call', callId: 'reread', name: 'read_file', arguments: JSON.stringify({ path: this.path }) };
    } else if (round === 4) {
      const result = request.continuation?.toolResults[0]?.result;
      if (!result?.ok || typeof result.value !== 'object' || result.value === null || (result.value as { sha256?: string }).sha256 !== this.observedSha256) throw new Error('George did not preserve the target after the framing rejection.');
      yield { type: 'provider.response.started', responseId: 'corrected-patch' };
      yield { type: 'provider.tool.call', callId: 'corrected-patch', name: 'apply_patch', arguments: JSON.stringify({ path: this.path, expectedSha256: this.observedSha256, edits: [{ oldText: 'export const label = (value) => value.trim();\n', newText: this.content }] }) };
    } else if (round === 5) {
      yield { type: 'provider.text.delta', delta: 'repaired' };
    }
    yield { type: 'provider.response.completed' };
  }
}

class IntentThenPatchProvider implements ModelProvider {
  readonly requests: ProviderRequest[] = [];
  observedSha256: string | undefined;
  rereadSha256: string | undefined;
  private readonly path: string;
  private readonly content: string;
  constructor(path: string, content: string) { this.path = path; this.content = content; }
  async *stream(request: ProviderRequest): AsyncGenerator<ProviderEvent> {
    this.requests.push(request);
    const round = this.requests.length;
    yield { type: 'provider.response.started', responseId: `intent-${round}` };
    if (round === 1) yield { type: 'provider.tool.call', callId: 'inspect-read', name: 'read_file', arguments: JSON.stringify({ path: this.path }) };
    else if (round === 2) {
      this.observedSha256 = request.input.match(/"sha256":"([a-f0-9]{64})"/)?.[1];
      yield { type: 'provider.tool.call', callId: 'framing-intent', name: 'write_file', arguments: JSON.stringify({ path: this.path, content: this.content.slice(0, -1), expectedSha256: this.observedSha256, allowTextFramingChange: true }) };
    } else if (round === 3) {
      const result = request.continuation?.toolResults[0]?.result;
      if (!result || result.ok || result.error.code !== 'denied') throw new Error('Exceptional mutation intent was not denied before dispatch.');
      yield { type: 'provider.tool.call', callId: 'reread-after-denial', name: 'read_file', arguments: JSON.stringify({ path: this.path }) };
    } else if (round === 4) {
      const result = request.continuation?.toolResults[0]?.result;
      if (!result?.ok || typeof result.value !== 'object' || result.value === null) throw new Error('Target reread failed.');
      this.rereadSha256 = (result.value as { sha256?: string }).sha256;
      yield { type: 'provider.tool.call', callId: 'safe-patch', name: 'apply_patch', arguments: JSON.stringify({ path: this.path, expectedSha256: this.rereadSha256, edits: [{ oldText: 'export const label = (value) => value.trim();\n', newText: this.content }] }) };
    } else if (round === 5) yield { type: 'provider.text.delta', delta: 'recovered safely' };
    yield { type: 'provider.response.completed' };
  }
}

test('frozen structured Phase 8 counterpart repairs the exact fixture and leaves validation to George', async (t) => {
  const task = await readFile(fixturePath, 'utf8');
  const parsed = parseTaskPrompt(task);
  assert.equal(parsed.kind, 'structured');
  if (parsed.kind !== 'structured') throw new Error('Frozen task did not parse.');
  assert.equal(parsed.task.task.ordinal, 4);
  assert.deepEqual(parsed.task.validations[0]?.command, { kind: 'literal', executable: 'node', arguments: ['--test', 'test/label.test.js'] });

  const repair = agenticContextCases([2048]).find((item) => item.id === 'agentic-edit-validation-2048-001')!;
  const root = await createBenchmarkFixture(repair.fixture, repair);
  t.after(() => rm(root, { recursive: true, force: true }));
  const provider = new ObservedHashProvider(repair.expected.edit!.path, repair.expected.edit!.content);
  const workflow = await createCodingWorkflowApplicationService({
    provider, workspace: root,
    approvalPort: createFrozenEditQualificationApproval({ targetPath: repair.expected.edit!.path, validation: repair.expected.validation! }),
    mcp: false, chromeDevtools: false, parallelSearch: false,
  });
  const session = createSession({ workspace: root });
  const events: ApplicationEvent[] = [];
  await new StructuredTaskApplicationService(workflow.agent).run({ session, input: task, turnId: 'p4-replay', onEvent: (event) => { events.push(event); } });
  assert.equal(await readFile(join(root, repair.expected.edit!.path), 'utf8'), repair.expected.edit!.content);
  assert.equal(session.taskState?.status, 'completed');
  assert.equal(session.taskState?.requirements.R1, 'verified');
  assert.equal(session.taskState?.requirements.R2, 'verified');
  assert.equal(session.taskState?.validations.V1?.status, 'passed');
  assert.equal(provider.observedSha256, '4cd4635c7d8ef07c10bf7a2296d0f4d79cd3e753c1794774656eac5e764d4352');
  assert.equal(provider.rejection, 'Text framing change requires explicit acknowledgement: current lineEnding=lf finalNewline=lf; proposed lineEnding=none finalNewline=none.');
  const requested = events.filter((event): event is Extract<ApplicationEvent, { type: 'tool.requested' }> => event.type === 'tool.requested');
  assert.deepEqual(requested.map((event) => event.name), ['read_file', 'write_file', 'read_file', 'apply_patch', 'run_process']);
  assert.equal(Buffer.byteLength(JSON.parse(requested[1]!.arguments).content), 59);
  assert.equal(Buffer.byteLength(JSON.parse(requested[3]!.arguments).edits[0].newText), 60);
  assert.equal(events.filter((event) => event.type === 'tool.failed' && event.name === 'write_file').length, 1);
  assert.equal(events.some((event) => event.type === 'approval.allowed' && event.request.toolName === 'apply_patch'), true);
  assert.deepEqual(provider.requests.map((request) => request.tools.map((tool) => tool.name)), [
    ['read_file', 'list_directory', 'search_text', 'git_status', 'git_diff'],
    ['read_file', 'list_directory', 'search_text', 'git_status', 'git_diff', 'write_file', 'apply_patch', 'create_directory'],
    ['read_file', 'list_directory', 'search_text', 'git_status', 'git_diff', 'write_file', 'apply_patch', 'create_directory'],
    ['read_file', 'list_directory', 'search_text', 'git_status', 'git_diff', 'write_file', 'apply_patch', 'create_directory'],
    ['read_file', 'list_directory', 'search_text', 'git_status', 'git_diff', 'write_file', 'apply_patch', 'create_directory'],
  ]);
  assert.deepEqual(provider.requests.map((request) => request.toolChoice), ['required', undefined, undefined, undefined, undefined]);
  assert.equal(provider.requests.length, 5);
  assert.match(provider.requests[4]?.instructions ?? '', /Do not create completion\/report artifacts unless the authored task requires them/);
  assert.match(provider.requests[4]?.instructions ?? '', /stop unrelated verification or mutation and allow George to run: V1:/);
  assert.equal(requested.some((event) => /completion/i.test(event.name)), false);
  assert.equal(events.filter((event) => event.type === 'validation.started').length, 1);
});

test('frozen qualification denies model-requested framing authority before dispatch and permits safe patch recovery', async (t) => {
  const task = await readFile(fixturePath, 'utf8');
  const repair = agenticContextCases([2048]).find((item) => item.id === 'agentic-edit-validation-2048-001')!;
  const root = await createBenchmarkFixture(repair.fixture, repair);
  t.after(() => rm(root, { recursive: true, force: true }));
  const provider = new IntentThenPatchProvider(repair.expected.edit!.path, repair.expected.edit!.content);
  const workflow = await createCodingWorkflowApplicationService({
    provider, workspace: root,
    approvalPort: createFrozenEditQualificationApproval({ targetPath: repair.expected.edit!.path, validation: repair.expected.validation! }),
    mcp: false, chromeDevtools: false, parallelSearch: false,
  });
  const session = createSession({ workspace: root });
  const events: ApplicationEvent[] = [];
  await new StructuredTaskApplicationService(workflow.agent).run({ session, input: task, turnId: 'intent-replay', onEvent: (event) => { events.push(event); } });

  assert.equal(provider.rereadSha256, provider.observedSha256, 'denial preserves the original file and SHA');
  assert.equal(await readFile(join(root, repair.expected.edit!.path), 'utf8'), repair.expected.edit!.content);
  assert.equal(session.taskState?.status, 'completed');
  assert.equal(session.taskState?.validations.V1?.status, 'passed');
  assert.equal(events.some((event) => event.type === 'approval.denied' && event.callId === 'framing-intent' && event.request.mutation?.intent === 'text_framing_change'), true);
  assert.equal(events.some((event) => event.type === 'tool.started' && event.callId === 'framing-intent'), false);
  assert.equal(events.some((event) => event.type === 'recovery.intent' && event.callId === 'framing-intent'), false);
  assert.equal(events.some((event) => event.type === 'approval.allowed' && event.callId === 'safe-patch'), true);
});
