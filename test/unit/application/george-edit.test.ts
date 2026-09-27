import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { GeorgeError, resolveWorkspaceRoot, type JsonValue } from '../../../src/core/index.ts';
import { GeorgeEditReceiptRegistry, MAX_GEP_DUAL_PROJECTION_BYTES, isStaleGeorgeEditError, parseGeorgeEditPacket } from '../../../src/application/index.ts';
import { createWorkspaceMutationToolExecutor, type ToolResult } from '../../../src/tools/index.ts';

const hash = (text: string | Buffer) => createHash('sha256').update(text).digest('hex');
const payload = (value: string) => `${Buffer.byteLength(value, 'utf8')}\n${value}\n`;
const edit = (receipt: string, ranges: readonly [number, number, string][]) => `E ${receipt} ${ranges.length}\n${ranges.map(([start, end, replacement]) => `R ${start} ${end} ${payload(replacement)}`).join('')}`;
const create = (path: string, content: string) => `C ${Buffer.byteLength(path)} ${Buffer.byteLength(content)}\n${path}\n${content}\n`;
const packet = (...operations: string[]) => `GEP/1\n${operations.join('')}END\n`;

function readResult(path: string, text: string, lineEnding: 'none' | 'lf' | 'crlf' | 'mixed' = text.includes('\n') ? 'lf' : 'none', epoch = 0): { registry: GeorgeEditReceiptRegistry; inherited: ToolResult; projected: ToolResult } {
  const registry = new GeorgeEditReceiptRegistry();
  const finalNewline = text.endsWith('\r\n') ? 'crlf' : text.endsWith('\n') ? 'lf' : 'none';
  const result: ToolResult = { callId: 'read', name: 'read_file', result: { ok: true, value: { name: 'read_file', path, text, bytes: Buffer.byteLength(text), truncated: false, sha256: hash(text), textFraming: { lineEnding, finalNewline } } as unknown as JsonValue } };
  return { registry, inherited: result, projected: registry.project(result, epoch) };
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

test('eligible reads preserve legacy evidence and add one bounded namespaced GEP projection', () => {
  const eligible = readResult('file.txt', 'one\ntwo\n');
  assert.deepEqual(eligible.projected.result, { ok: true, value: {
    name: 'read_file', path: 'file.txt', text: 'one\ntwo\n', bytes: 8, truncated: false, sha256: hash('one\ntwo\n'),
    textFraming: { lineEnding: 'lf', finalNewline: 'lf' }, gep: { receipt: 'R1', numberedLines: '1|one\n2|two' },
  } });
  assert.ok(Buffer.byteLength(JSON.stringify(eligible.projected.result)) <= MAX_GEP_DUAL_PROJECTION_BYTES);
  assert.equal(eligible.registry.count, 1);

  const unsafe = readResult('mixed.txt', 'one\ntwo\r\n', 'mixed');
  assert.strictEqual(unsafe.projected, unsafe.inherited);
  assert.equal(unsafe.registry.count, 0);
});

test('oversized, truncated, and unsupported reads retain unchanged legacy evidence without a usable receipt', () => {
  const oversized = readResult('large.txt', 'line content\n'.repeat(1_000));
  assert.strictEqual(oversized.projected, oversized.inherited);
  assert.equal(oversized.registry.count, 0);

  const small = { callId: 'read', name: 'read_file', result: { ok: true, value: {
    name: 'read_file', path: 'small.txt', text: 'small\n', bytes: 6, truncated: false, sha256: hash('small\n'),
    textFraming: { lineEnding: 'lf', finalNewline: 'lf' },
  } as unknown as JsonValue } } satisfies ToolResult;
  const projectedSmall = oversized.registry.project(small, 0);
  assert.equal((projectedSmall.result as { value: { gep: { receipt: string } } }).value.gep.receipt, 'R1');

  for (const value of [
    { name: 'read_file', path: 'truncated.txt', text: 'prefix', bytes: 6, truncated: true, sha256: hash('longer'), textFraming: { lineEnding: 'none', finalNewline: 'none' } },
    { name: 'read_file', path: 'binary.txt', text: '\ufffd', bytes: 1, truncated: false, sha256: hash(Buffer.from([0xff])) },
    { name: 'read_file', path: 'mixed.txt', text: 'a\nb\r\n', bytes: 6, truncated: false, sha256: hash('a\nb\r\n'), textFraming: { lineEnding: 'mixed', finalNewline: 'crlf' } },
  ]) {
    const registry = new GeorgeEditReceiptRegistry();
    const inherited = { callId: value.path, name: 'read_file', result: { ok: true, value: value as unknown as JsonValue } } satisfies ToolResult;
    assert.strictEqual(registry.project(inherited, 0), inherited);
    assert.equal(registry.count, 0);
  }
});

test('receipt registry stays bounded and assigns deterministic run-local IDs', () => {
  const registry = new GeorgeEditReceiptRegistry();
  for (let index = 1; index <= 40; index += 1) {
    const text = `file ${index}`;
    const result: ToolResult = { callId: String(index), name: 'read_file', result: { ok: true, value: { name: 'read_file', path: `${index}.txt`, text, bytes: Buffer.byteLength(text), truncated: false, sha256: hash(text), textFraming: { lineEnding: 'none', finalNewline: 'none' } } as unknown as JsonValue } };
    const projected = registry.project(result, 0);
    assert.equal((projected.result as { value: { gep: { receipt: string } } }).value.gep.receipt, `R${index}`);
  }
  assert.equal(registry.count, 32);
});

test('one existing-file edit is net cheaper across the complete read-to-edit exchange', async (t) => {
  const root = await mkdtemp(join(tmpdir(), 'george-gep-transport-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const lines = Array.from({ length: 80 }, (_, index) => `line ${String(index + 1).padStart(2, '0')} ${'x'.repeat(24)}`);
  const original = `${lines.join('\n')}\n`;
  const expected = `${lines.slice(0, 19).join('\n')}\ncompact replacement\n${lines.slice(30).join('\n')}\n`;
  await writeFile(join(root, 'target.txt'), original);
  const workspace = await resolveWorkspaceRoot(root);
  const read = readResult('target.txt', original);
  const gepPacket = packet(edit('R1', [[20, 30, 'compact replacement']]));
  const prepared = await read.registry.prepare(gepPacket, workspace, 0);
  const legacyReadBytes = Buffer.byteLength(JSON.stringify(read.inherited.result));
  const dualReadBytes = Buffer.byteLength(JSON.stringify(read.projected.result));
  const legacyMutationBytes = Buffer.byteLength(prepared.calls[0]!.arguments);
  const gepPacketBytes = Buffer.byteLength(gepPacket);
  const mutationRatio = gepPacketBytes / legacyMutationBytes;
  const netRatio = (dualReadBytes + gepPacketBytes) / (legacyReadBytes + legacyMutationBytes);

  assert.equal(prepared.expandedMutationBytes, legacyMutationBytes);
  assert.ok(dualReadBytes <= MAX_GEP_DUAL_PROJECTION_BYTES);
  assert.ok(mutationRatio <= 0.70);
  assert.ok(netRatio < 1);
  const mutations = createWorkspaceMutationToolExecutor(workspace, {}, { captureGit: false });
  assert.equal((await mutations.registry.dispatch(prepared.calls[0]!)).result.ok, true);
  assert.equal(await readFile(join(root, 'target.txt'), 'utf8'), expected);
  t.diagnostic(`legacy read ${legacyReadBytes} bytes; dual GEP read ${dualReadBytes} bytes; legacy mutation ${legacyMutationBytes} bytes; GEP packet ${gepPacketBytes} bytes; mutation ratio ${mutationRatio}; net edit transport ratio ${netRatio}`);
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
