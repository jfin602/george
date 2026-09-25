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

class ScriptedProvider implements ModelProvider {
  readonly requests: ProviderRequest[] = [];
  private readonly rounds: (readonly ProviderEvent[])[];
  constructor(rounds: (readonly ProviderEvent[])[]) { this.rounds = rounds; }
  async *stream(request: ProviderRequest): AsyncGenerator<ProviderEvent> {
    this.requests.push(request);
    yield* (this.rounds.shift() ?? [{ type: 'provider.response.completed' }]);
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
  const provider = new ScriptedProvider([
    [{ type: 'provider.response.started', responseId: 'inspect' }, { type: 'provider.tool.call', callId: 'inspect-read', name: 'read_file', arguments: '{"path":"src/label.js"}' }, { type: 'provider.response.completed' }],
    [{ type: 'provider.text.delta', delta: 'inspected' }, { type: 'provider.response.completed' }],
    [{ type: 'provider.response.started', responseId: 'repair-read' }, { type: 'provider.tool.call', callId: 'repair-read', name: 'read_file', arguments: '{"path":"src/label.js"}' }, { type: 'provider.response.completed' }],
    [{ type: 'provider.response.started', responseId: 'repair-write' }, { type: 'provider.tool.call', callId: 'repair-write', name: 'write_file', arguments: JSON.stringify({ path: repair.expected.edit!.path, content: repair.expected.edit!.content, expectedSha256: '4cd4635c7d8ef07c10bf7a2296d0f4d79cd3e753c1794774656eac5e764d4352' }) }, { type: 'provider.response.completed' }],
    [{ type: 'provider.text.delta', delta: 'repaired' }, { type: 'provider.response.completed' }],
    [{ type: 'provider.response.completed' }],
  ]);
  const workflow = await createCodingWorkflowApplicationService({ provider, workspace: root, approvalPort: createBenchmarkApproval(repair), mcp: false, chromeDevtools: false, parallelSearch: false });
  const session = createSession({ workspace: root });
  const events: ApplicationEvent[] = [];
  await new StructuredTaskApplicationService(workflow.agent).run({ session, input: task, turnId: 'p4-replay', onEvent: (event) => { events.push(event); } });
  assert.equal(await readFile(join(root, repair.expected.edit!.path), 'utf8'), repair.expected.edit!.content);
  assert.equal(session.taskState?.status, 'completed');
  assert.equal(session.taskState?.requirements.R1, 'verified');
  assert.equal(session.taskState?.requirements.R2, 'verified');
  assert.equal(session.taskState?.validations.V1?.status, 'passed');
  assert.deepEqual(events.filter((event): event is Extract<ApplicationEvent, { type: 'tool.requested' }> => event.type === 'tool.requested').map((event) => event.name), ['read_file', 'read_file', 'write_file', 'run_process']);
  assert.deepEqual(provider.requests.map((request) => request.tools.map((tool) => tool.name)), [
    ['read_file', 'list_directory', 'search_text', 'git_status', 'git_diff'],
    ['read_file', 'list_directory', 'search_text', 'git_status', 'git_diff'],
    ['read_file', 'list_directory', 'search_text', 'git_status', 'git_diff', 'write_file', 'apply_patch'],
    ['read_file', 'list_directory', 'search_text', 'git_status', 'git_diff', 'write_file', 'apply_patch'],
    ['read_file', 'list_directory', 'search_text', 'git_status', 'git_diff', 'write_file', 'apply_patch'],
    [],
  ]);
});
