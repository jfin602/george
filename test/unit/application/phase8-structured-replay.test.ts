import assert from 'node:assert/strict';
import { readFile, rm } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { StructuredTaskApplicationService, createCodingWorkflowApplicationService } from '../../../src/application/index.ts';
import { agenticContextCases, createBenchmarkFixture, createBenchmarkApproval } from '../../../src/benchmark/index.ts';
import { createSession, type ApplicationEvent, type ModelProvider, type ProviderEvent, type ProviderRequest } from '../../../src/core/index.ts';
import { parseTaskPrompt } from '../../../src/tasks/index.ts';

const fixturePath = join(dirname(fileURLToPath(import.meta.url)), '../../fixtures/p9-phase8-structured-edit-validation.task.txt');

class ObservedHashProvider implements ModelProvider {
  readonly requests: ProviderRequest[] = [];
  observedSha256: string | undefined;
  private readonly path: string;
  private readonly content: string;
  constructor(path: string, content: string) { this.path = path; this.content = content; }
  async *stream(request: ProviderRequest): AsyncGenerator<ProviderEvent> {
    this.requests.push(request);
    const round = this.requests.length;
    if (round === 1 || round === 2) {
      yield { type: 'provider.response.started', responseId: round === 1 ? 'inspect' : 'repair-read' };
      yield { type: 'provider.tool.call', callId: round === 1 ? 'inspect-read' : 'repair-read', name: 'read_file', arguments: JSON.stringify({ path: this.path }) };
    } else if (round === 3) {
      const result = request.continuation?.toolResults[0]?.result;
      const value = result?.ok && result.value && typeof result.value === 'object' && !Array.isArray(result.value) ? result.value : undefined;
      if (!value || typeof value.sha256 !== 'string') throw new Error('George did not expose read_file.sha256 to the provider continuation.');
      this.observedSha256 = value.sha256;
      yield { type: 'provider.response.started', responseId: 'repair-write' };
      yield { type: 'provider.tool.call', callId: 'repair-write', name: 'write_file', arguments: JSON.stringify({ path: this.path, content: this.content, expectedSha256: value.sha256 }) };
    } else if (round === 4) {
      yield { type: 'provider.text.delta', delta: 'repaired' };
    }
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
  const workflow = await createCodingWorkflowApplicationService({ provider, workspace: root, approvalPort: createBenchmarkApproval(repair), mcp: false, chromeDevtools: false, parallelSearch: false });
  const session = createSession({ workspace: root });
  const events: ApplicationEvent[] = [];
  await new StructuredTaskApplicationService(workflow.agent).run({ session, input: task, turnId: 'p4-replay', onEvent: (event) => { events.push(event); } });
  assert.equal(await readFile(join(root, repair.expected.edit!.path), 'utf8'), repair.expected.edit!.content);
  assert.equal(session.taskState?.status, 'completed');
  assert.equal(session.taskState?.requirements.R1, 'verified');
  assert.equal(session.taskState?.requirements.R2, 'verified');
  assert.equal(session.taskState?.validations.V1?.status, 'passed');
  assert.equal(provider.observedSha256, '4cd4635c7d8ef07c10bf7a2296d0f4d79cd3e753c1794774656eac5e764d4352');
  assert.deepEqual(events.filter((event): event is Extract<ApplicationEvent, { type: 'tool.requested' }> => event.type === 'tool.requested').map((event) => event.name), ['read_file', 'read_file', 'write_file', 'run_process']);
  assert.deepEqual(provider.requests.map((request) => request.tools.map((tool) => tool.name)), [
    ['read_file', 'list_directory', 'search_text', 'git_status', 'git_diff'],
    ['read_file', 'list_directory', 'search_text', 'git_status', 'git_diff', 'write_file', 'apply_patch'],
    ['read_file', 'list_directory', 'search_text', 'git_status', 'git_diff', 'write_file', 'apply_patch'],
    ['read_file', 'list_directory', 'search_text', 'git_status', 'git_diff', 'write_file', 'apply_patch'],
  ]);
  assert.deepEqual(provider.requests.map((request) => request.toolChoice), ['required', undefined, undefined, undefined]);
  assert.equal(provider.requests.length, 4);
  assert.equal(events.filter((event) => event.type === 'validation.started').length, 1);
});
