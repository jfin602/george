import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { GeorgeError, resolveWorkspaceRoot, type JsonValue } from '../../../src/core/index.ts';
import { GeorgeEditReceiptRegistry, isStaleGeorgeEditError, parseGeorgeEditPacket } from '../../../src/application/index.ts';
import { createWorkspaceMutationToolExecutor, type ToolResult } from '../../../src/tools/index.ts';

const hash = (text: string) => createHash('sha256').update(text).digest('hex');
const payload = (value: string) => `${Buffer.byteLength(value, 'utf8')}\n${value}\n`;
const edit = (receipt: string, ranges: readonly [number, number, string][]) => `E ${receipt} ${ranges.length}\n${ranges.map(([start, end, replacement]) => `R ${start} ${end} ${payload(replacement)}`).join('')}`;
const create = (path: string, content: string) => `C ${Buffer.byteLength(path)} ${Buffer.byteLength(content)}\n${path}\n${content}\n`;
const packet = (...operations: string[]) => `GEP/1\n${operations.join('')}END\n`;

function readResult(path: string, text: string, lineEnding: 'none' | 'lf' | 'crlf' | 'mixed' = text.includes('\n') ? 'lf' : 'none', epoch = 0): { registry: GeorgeEditReceiptRegistry; projected: ToolResult } {
  const registry = new GeorgeEditReceiptRegistry();
  const finalNewline = text.endsWith('\r\n') ? 'crlf' : text.endsWith('\n') ? 'lf' : 'none';
  const result: ToolResult = { callId: 'read', name: 'read_file', result: { ok: true, value: { name: 'read_file', path, text, bytes: Buffer.byteLength(text), truncated: false, sha256: hash(text), textFraming: { lineEnding, finalNewline } } as unknown as JsonValue } };
  return { registry, projected: registry.project(result, epoch) };
}

test('GEP/1 parses length-framed edits and creates without delimiter collisions', () => {
  const source = packet(edit('R1', [[2, 3, 'END\nGEP/1']]), create('new.txt', 'line 1\nEND\nline 3'));
  const parsed = parseGeorgeEditPacket(source);
  assert.equal(parsed.bytes, Buffer.byteLength(source));
  assert.deepEqual(parsed.operations, [
    { kind: 'edit', receiptId: 'R1', ranges: [{ start: 2, end: 3, replacement: 'END\nGEP/1' }] },
    { kind: 'create', path: 'new.txt', content: 'line 1\nEND\nline 3' },
  ]);
});

test('GEP/1 parser rejects malformed, unknown, oversized, NUL, invalid text, and ambiguous replacement framing', () => {
  for (const value of [
    'GEP/2\nEND\n',
    'GEP/1\nEND\ntrailing',
    'GEP/1\nE R1 1\nR 2 1 0\n\nEND\n',
    'GEP/1\nC 1 1\na\n\0\nEND\n',
    packet(edit('R1', [[1, 1, 'trailing\n']])),
    `GEP/1\nC 1 1\na\n${'\ud800'}\nEND\n`,
    `GEP/1\nC 1 4090\na\n${'x'.repeat(4090)}\nEND\n`,
  ]) assert.throws(() => parseGeorgeEditPacket(value), GeorgeError);
});

test('eligible reads receive bounded deterministic line receipts while unsafe reads retain legacy evidence', () => {
  const eligible = readResult('file.txt', 'one\ntwo\n');
  assert.deepEqual(eligible.projected.result, { ok: true, value: { name: 'read_file', path: 'file.txt', receipt: 'R1', lines: '1|one\n2|two', bytes: 8, textFraming: { lineEnding: 'lf', finalNewline: 'lf' } } });
  assert.equal(eligible.registry.count, 1);

  const unsafe = readResult('mixed.txt', 'one\ntwo\r\n', 'mixed');
  assert.equal((unsafe.projected.result as { value: Record<string, unknown> }).value.receipt, undefined);
  assert.equal((unsafe.projected.result as { value: Record<string, unknown> }).value.text, 'one\ntwo\r\n');
  assert.equal(unsafe.registry.count, 0);
});

test('receipt registry stays bounded and assigns deterministic run-local IDs', () => {
  const registry = new GeorgeEditReceiptRegistry();
  for (let index = 1; index <= 40; index += 1) {
    const text = `file ${index}`;
    const result: ToolResult = { callId: String(index), name: 'read_file', result: { ok: true, value: { name: 'read_file', path: `${index}.txt`, text, bytes: Buffer.byteLength(text), truncated: false, sha256: hash(text), textFraming: { lineEnding: 'none', finalNewline: 'none' } } as unknown as JsonValue } };
    const projected = registry.project(result, 0);
    assert.equal((projected.result as { value: Record<string, unknown> }).value.receipt, `R${index}`);
  }
  assert.equal(registry.count, 32);
});

test('GEP/1 expands multiple original-snapshot ranges and creates through canonical mutation calls', async (t) => {
  const root = await mkdtemp(join(tmpdir(), 'george-gep-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const original = 'one\ntwo\nthree\nfour\n';
  const second = 'alpha\nbeta\n';
  await writeFile(join(root, 'file.txt'), original);
  await writeFile(join(root, 'second.txt'), second);
  const workspace = await resolveWorkspaceRoot(root);
  const { registry } = readResult('file.txt', original);
  registry.project({ callId: 'second', name: 'read_file', result: { ok: true, value: { name: 'read_file', path: 'second.txt', text: second, bytes: Buffer.byteLength(second), truncated: false, sha256: hash(second), textFraming: { lineEnding: 'lf', finalNewline: 'lf' } } as unknown as JsonValue } }, 0);
  const prepared = await registry.prepare(packet(edit('R1', [[1, 1, 'ONE'], [3, 4, 'THREE\nFOUR']]), edit('R2', [[2, 2, 'BETA']]), create('new.txt', 'created\n')), workspace, 0);
  assert.equal(prepared.calls.length, 3);
  assert.equal(prepared.editCount, 3);
  assert.ok(prepared.packetBytes / prepared.expandedMutationBytes <= 0.70);
  const mutations = createWorkspaceMutationToolExecutor(workspace, {}, { captureGit: false });
  for (const call of prepared.calls) assert.equal((await mutations.registry.dispatch(call)).result.ok, true);
  assert.equal(await readFile(join(root, 'file.txt'), 'utf8'), 'ONE\ntwo\nTHREE\nFOUR\n');
  assert.equal(await readFile(join(root, 'second.txt'), 'utf8'), 'alpha\nBETA\n');
  assert.equal(await readFile(join(root, 'new.txt'), 'utf8'), 'created\n');
});

test('GEP/1 preserves CRLF and supports empty replacement deletion', async (t) => {
  const root = await mkdtemp(join(tmpdir(), 'george-gep-crlf-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const original = 'one\r\ntwo\r\nthree\r\n';
  await writeFile(join(root, 'file.txt'), original);
  const workspace = await resolveWorkspaceRoot(root);
  const { registry } = readResult('file.txt', original, 'crlf');
  const prepared = await registry.prepare(packet(edit('R1', [[2, 2, '']])), workspace, 0);
  const mutations = createWorkspaceMutationToolExecutor(workspace, {}, { captureGit: false });
  assert.equal((await mutations.registry.dispatch(prepared.calls[0]!)).result.ok, true);
  assert.equal(await readFile(join(root, 'file.txt'), 'utf8'), 'one\r\nthree\r\n');
});

test('GEP/1 prevalidation rejects unknown/stale receipts, drift, overlap, ranges, and duplicate targets before mutation', async (t) => {
  const root = await mkdtemp(join(tmpdir(), 'george-gep-reject-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const original = 'one\ntwo\nthree\n';
  await writeFile(join(root, 'file.txt'), original);
  const workspace = await resolveWorkspaceRoot(root);
  const { registry } = readResult('file.txt', original);
  const cases: Array<[string, number]> = [
    [packet(edit('R9', [[1, 1, 'x']])), 0],
    [packet(edit('R1', [[1, 1, 'x']])), 1],
    [packet(edit('R1', [[1, 2, 'x'], [2, 3, 'y']])), 0],
    [packet(edit('R1', [[4, 4, 'x']])), 0],
    [packet(edit('R1', [[1, 1, 'x']]), edit('R1', [[2, 2, 'y']])), 0],
    [packet(create('parent', ''), create('parent/child', 'x')), 0],
  ];
  for (const [value, epoch] of cases) await assert.rejects(() => registry.prepare(value, workspace, epoch), GeorgeError);
  await writeFile(join(root, 'file.txt'), 'drifted\n');
  await assert.rejects(() => registry.prepare(packet(edit('R1', [[1, 1, 'x']])), workspace, 0), isStaleGeorgeEditError);
  assert.equal(await readFile(join(root, 'file.txt'), 'utf8'), 'drifted\n');

  const restarted = new GeorgeEditReceiptRegistry();
  await assert.rejects(() => restarted.prepare(packet(edit('R1', [[1, 1, 'x']])), workspace, 0), (error: unknown) => error instanceof GeorgeError && !isStaleGeorgeEditError(error));
});
