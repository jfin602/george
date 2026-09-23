import assert from 'node:assert/strict';
import test from 'node:test';

import { WorkProjection } from '../../../src/application/index.ts';
import { appendSessionEvent, createSession, type ApplicationEvent } from '../../../src/core/index.ts';

function completion(): Extract<ApplicationEvent, { type: 'workflow.completed' }>['completion'] {
  return { baselineAvailable: true, finalStateAvailable: true, changes: [], directMutations: [], validations: [], warnings: [], terminalState: 'completed', finalAssistantResponse: '' };
}

test('projection is presentation-independent, bounded, and keeps one tool work item through lifecycle', () => {
  const projection = new WorkProjection({ maxWorkItems: 2, maxProgress: 2 });
  const events: ApplicationEvent[] = [
    { type: 'turn.started', turnId: 'turn' },
    { type: 'tool.requested', turnId: 'turn', callId: 'read', name: 'read_file', arguments: JSON.stringify({ path: 'private.txt', ignored: 'SECRET_BODY' }) },
    { type: 'tool.started', turnId: 'turn', callId: 'read', name: 'read_file' },
    { type: 'tool.completed', turnId: 'turn', callId: 'read', name: 'read_file', result: { ok: true, value: { name: 'read_file', path: 'private.txt', text: 'SECRET_BODY', bytes: 7, truncated: false } } },
  ];
  const projected = events.flatMap((event) => projection.observe(event));
  const updates = projected.filter((event): event is Extract<ApplicationEvent, { type: 'work.updated' }> => event.type === 'work.updated' && event.item.operationId === 'read');
  assert.equal(new Set(updates.map((event) => event.item.id)).size, 1);
  assert.deepEqual(updates.map((event) => event.item.status), ['requested', 'running', 'succeeded']);
  assert.equal(updates.at(-1)?.item.details.path, 'private.txt');
  assert.equal(JSON.stringify(projected).includes('SECRET_BODY'), false);
  assert.ok(projection.snapshot().progress.length <= 2);
});

test('projection safely summarizes every built-in plus truthful denial, interruption, validation, and completion', () => {
  const projection = new WorkProjection();
  const calls: ApplicationEvent[] = [
    { type: 'tool.requested', turnId: 't', callId: 'list', name: 'list_directory', arguments: '{"path":"src"}' },
    { type: 'tool.completed', turnId: 't', callId: 'list', name: 'list_directory', result: { ok: true, value: { entries: [{ name: 'x' }], truncated: false } } },
    { type: 'tool.requested', turnId: 't', callId: 'search', name: 'search_text', arguments: '{"path":"src","query":"needle"}' },
    { type: 'tool.completed', turnId: 't', callId: 'search', name: 'search_text', result: { ok: true, value: { matches: [{}], scannedFiles: 3, scannedBytes: 9, truncated: false } } },
    { type: 'tool.requested', turnId: 't', callId: 'status', name: 'git_status', arguments: '{}' },
    { type: 'tool.completed', turnId: 't', callId: 'status', name: 'git_status', result: { ok: true, value: { stdout: 'SECRET', exitCode: 0, stdoutTruncated: false, stderrTruncated: false } } },
    { type: 'tool.requested', turnId: 't', callId: 'diff', name: 'git_diff', arguments: '{}' },
    { type: 'tool.completed', turnId: 't', callId: 'diff', name: 'git_diff', result: { ok: true, value: { stdout: 'SECRET', exitCode: 0, stdoutTruncated: false, stderrTruncated: false } } },
    { type: 'tool.requested', turnId: 't', callId: 'write', name: 'write_file', arguments: '{"path":"a.txt","content":"SECRET_WRITE"}' },
    { type: 'approval.requested', turnId: 't', callId: 'write', request: { id: 'write', toolName: 'write_file', risk: 'write', arguments: {}, target: { path: 'a.txt', alreadyDirty: false } } },
    { type: 'approval.denied', turnId: 't', callId: 'write', request: { id: 'write', toolName: 'write_file', risk: 'write', arguments: {}, target: { path: 'a.txt', alreadyDirty: false } } },
    { type: 'tool.failed', turnId: 't', callId: 'write', name: 'write_file', result: { ok: false, error: { code: 'denied', message: 'no' } } },
    { type: 'tool.requested', turnId: 't', callId: 'patch', name: 'apply_patch', arguments: '{"path":"a.txt","edits":[{"oldText":"SECRET_OLD","newText":"SECRET_NEW"}]}' },
    { type: 'tool.completed', turnId: 't', callId: 'patch', name: 'apply_patch', result: { ok: true, value: { bytes: 3 } } },
    { type: 'tool.requested', turnId: 't', callId: 'process', name: 'run_process', arguments: '{"executable":"node","arguments":["-e","SECRET_ENV"],"cwd":"test"}' },
    { type: 'tool.completed', turnId: 't', callId: 'process', name: 'run_process', result: { ok: true, value: { executable: 'node', arguments: ['-e', 'SECRET_ENV'], cwd: 'test', stdout: 'SECRET_STDOUT', stderr: 'SECRET_STDERR', stdoutTruncated: true, stderrTruncated: false, exitCode: 7, signal: null, outcome: 'failed' } } },
    { type: 'validation.started', turnId: 't', callId: 'validation', label: 'typecheck', intent: 'check types' },
    { type: 'validation.completed', turnId: 't', callId: 'validation', status: 'failed', exitCode: 2, signal: null, outcome: 'failed', stdoutTruncated: false, stderrTruncated: true, error: { code: 'tool', message: 'failed' } },
    { type: 'turn.failed', turnId: 't', error: { code: 'provider', message: 'offline' } },
    { type: 'workflow.completed', turnId: 't', completion: completion() },
  ];
  calls.flatMap((event) => projection.observe(event));
  const work = projection.snapshot().work;
  assert.equal(work.find((item) => item.operationId === 'write')?.status, 'denied');
  assert.equal(work.find((item) => item.operationId === 'process')?.status, 'failed');
  assert.equal(work.find((item) => item.operationId === 'validation')?.status, 'failed');
  assert.equal(work.find((item) => item.operationId === 'recovery')?.status, 'interrupted');
  const process = work.find((item) => item.operationId === 'process');
  assert.deepEqual(process?.details, { executable: 'node', argv: ['-e', 'SECRET_ENV'], cwd: 'test', exitCode: 7, signal: null, outcome: 'failed', truncated: true });
  assert.equal(JSON.stringify(work).includes('SECRET_STDOUT'), false);
  assert.equal(JSON.stringify(work).includes('SECRET_WRITE'), false);
  assert.equal(JSON.stringify(work).includes('SECRET_OLD'), false);
  assert.equal(work.find((item) => item.operationId === 'completion')?.status, 'succeeded');
});

test('root list work normalizes omitted and empty paths with one truthful row', () => {
  const projection = new WorkProjection();
  projection.observe({ type: 'tool.requested', turnId: 't', callId: 'root', name: 'list_directory', arguments: '{}' });
  assert.equal(projection.snapshot().work.find((item) => item.operationId === 'root')?.summary, 'List .');
  projection.observe({ type: 'tool.completed', turnId: 't', callId: 'root', name: 'list_directory', result: { ok: true, value: { entries: [], truncated: false } } });
  const success = projection.snapshot().work.find((item) => item.operationId === 'root');
  assert.equal(success?.summary, 'Listed . (0 entries)');
  assert.equal(success?.details.path, '.');

  projection.observe({ type: 'tool.requested', turnId: 't', callId: 'empty', name: 'list_directory', arguments: '{"path":""}' });
  projection.observe({ type: 'tool.completed', turnId: 't', callId: 'empty', name: 'list_directory', result: { ok: true, value: { entries: [], truncated: false } } });
  const empty = projection.snapshot().work.find((item) => item.operationId === 'empty');
  assert.equal(empty?.summary, 'Listed . (0 entries)');
  assert.equal(empty?.details.path, '.');

  const error = 'x'.repeat(500);
  projection.observe({ type: 'tool.requested', turnId: 't', callId: 'failed-root', name: 'list_directory', arguments: '{}' });
  projection.observe({ type: 'tool.failed', turnId: 't', callId: 'failed-root', name: 'list_directory', result: { ok: false, error: { code: 'tool', message: error } } });
  const failure = projection.snapshot().work.find((item) => item.operationId === 'failed-root');
  assert.equal(failure?.status, 'failed');
  assert.match(failure?.summary ?? '', /^List \. failed: /);
  assert.ok(Buffer.byteLength(failure?.summary ?? '', 'utf8') <= 240);
  assert.ok(Buffer.byteLength(failure?.details.error ?? '', 'utf8') <= 240);
});

test('failed calls retain bounded safe requested arguments without content or patch bodies', () => {
  const projection = new WorkProjection();
  const failed = (callId: string, name: string, arguments_: string) => {
    projection.observe({ type: 'tool.requested', turnId: 't', callId, name, arguments: arguments_ });
    projection.observe({ type: 'tool.failed', turnId: 't', callId, name, result: { ok: false, error: { code: 'validation', message: 'invalid' } } });
    return projection.snapshot().work.find((item) => item.operationId === callId)!;
  };
  assert.equal(failed('bad-json', 'list_directory', '{').details.requestedArguments, 'malformed JSON');
  const wrong = failed('wrong-field', 'list_directory', '{"directory":"."}');
  assert.match(wrong.details.requestedArguments ?? '', /"unexpected":\["directory"\]/);
  const wrongType = failed('wrong-type', 'read_file', '{"path":null}');
  assert.match(wrongType.details.requestedArguments ?? '', /"path":null/);
  const write = failed('write', 'write_file', '{"path":"a.txt","content":"SECRET_WRITE"}');
  const patch = failed('patch', 'apply_patch', '{"path":"a.txt","edits":[{"oldText":"SECRET_OLD","newText":"SECRET_NEW"}]}');
  assert.doesNotMatch(JSON.stringify([write, patch]), /SECRET_(WRITE|OLD|NEW)/);
  projection.observe({ type: 'tool.requested', turnId: 't', callId: 'process', name: 'run_process', arguments: '{"executable":"node","arguments":["--check","a.ts"],"cwd":"src","timeoutMs":50}' });
  const process = projection.snapshot().work.find((item) => item.operationId === 'process');
  assert.deepEqual(process?.details, { executable: 'node', argv: ['--check', 'a.ts'], cwd: 'src', timeoutMs: 50, requestedArguments: '{"executable":"node","arguments":["--check","a.ts"],"cwd":"src","timeoutMs":50}' });
  assert.ok(Buffer.byteLength(wrong.details.requestedArguments ?? '', 'utf8') <= 480);
});

test('context-source lifecycle projects loading, loaded, missing, oversized, and failed truthfully', () => {
  const projection = new WorkProjection();
  const statuses = [
    ['loading', 'running'],
    ['loaded', 'succeeded'],
    ['missing', 'missing'],
    ['oversized', 'skipped'],
    ['failed', 'failed'],
  ] as const;
  for (const [sourceId, status] of statuses) projection.observe({ type: 'context.source', turnId: 't', sourceId, kind: 'workspace', status });
  const work = new Map(projection.snapshot().work.map((item) => [item.operationId, item]));
  for (const [sourceId, expected] of statuses) {
    assert.equal(work.get(sourceId)?.status, expected);
  }
  assert.notEqual(work.get('missing')?.status, 'succeeded');
  assert.notEqual(work.get('oversized')?.status, 'succeeded');
});

test('work/progress events remain outside the canonical transcript', () => {
  const session = createSession({ workspace: '/tmp/workspace' });
  appendSessionEvent(session, { type: 'progress.milestone', turnId: 't', category: 'context', message: 'Loading context' });
  appendSessionEvent(session, { type: 'work.updated', item: { id: 't:tool:read', turnId: 't', operationId: 'read', category: 'inspection', status: 'succeeded', summary: 'Read secret.txt', details: { path: 'secret.txt' } } });
  assert.deepEqual(session.transcript, []);
});
