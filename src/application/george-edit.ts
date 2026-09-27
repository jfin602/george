import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { isAbsolute, relative } from 'node:path';

import { cancellationError, GeorgeError, MAX_OPERATION_TEXT_BYTES, resolveWorkspaceMutationPath, type JsonValue, type Workspace } from '../core/index.ts';
import type { ToolCall, ToolResult } from '../tools/index.ts';
import type { TextFraming } from '../tools/text-framing.ts';

export const GEORGE_EDIT_PROTOCOL_VERSION = 1;
export const MAX_GEP_PACKET_BYTES = MAX_OPERATION_TEXT_BYTES;
const MAX_RECEIPTS = 32;
const MAX_RECEIPT_BYTES = 64 * 1024;
const MAX_OPERATIONS = 8;
const MAX_EDITS = 32;
const MAX_EXPANDED_FILE_BYTES = 64 * 1024;
const SHA256 = /^[a-f0-9]{64}$/;

type Receipt = Readonly<{
  id: string;
  path: string;
  sha256: string;
  snapshot: string;
  framing: TextFraming;
  epoch: number;
}>;

type EditOperation = Readonly<{ kind: 'edit'; receiptId: string; ranges: readonly Readonly<{ start: number; end: number; replacement: string }>[] }>;
type CreateOperation = Readonly<{ kind: 'create'; path: string; content: string }>;
export type GeorgeEditPacket = Readonly<{ operations: readonly (EditOperation | CreateOperation)[]; bytes: number }>;
export type PreparedGeorgeEditPacket = Readonly<{
  calls: readonly ToolCall[];
  packetBytes: number;
  expandedMutationBytes: number;
  editCount: number;
  fileCount: number;
}>;

function invalid(message: string, staleReceipt = false): never {
  throw new GeorgeError('validation', message, { cause: { kind: 'gep', staleReceipt } });
}

function validUtf8(value: string, name: string): void {
  if (value.includes('\0') || Buffer.from(value, 'utf8').toString('utf8') !== value) invalid(`${name} must be valid UTF-8 text without NUL.`);
}

class PacketCursor {
  private offset = 0;
  private readonly buffer: Buffer;
  constructor(buffer: Buffer) { this.buffer = buffer; }

  line(name: string): string {
    const end = this.buffer.indexOf(0x0a, this.offset);
    if (end < 0) invalid(`GEP/1 ${name} is not newline-terminated.`);
    const bytes = this.buffer.subarray(this.offset, end);
    this.offset = end + 1;
    if (bytes.includes(0x0d) || [...bytes].some((byte) => byte > 0x7f)) invalid(`GEP/1 ${name} must be ASCII.`);
    return bytes.toString('ascii');
  }

  text(bytes: number, name: string): string {
    if (!Number.isSafeInteger(bytes) || bytes < 0 || this.offset + bytes >= this.buffer.length) invalid(`GEP/1 ${name} has invalid byte framing.`);
    const payload = this.buffer.subarray(this.offset, this.offset + bytes);
    this.offset += bytes;
    if (this.buffer[this.offset++] !== 0x0a) invalid(`GEP/1 ${name} has invalid byte framing.`);
    let value: string;
    try { value = new TextDecoder('utf-8', { fatal: true }).decode(payload); }
    catch { invalid(`GEP/1 ${name} must be valid UTF-8.`); }
    validUtf8(value!, `GEP/1 ${name}`);
    return value!;
  }

  get done(): boolean { return this.offset === this.buffer.length; }
}

function integer(value: string, name: string, minimum: number, maximum: number): number {
  if (!/^(0|[1-9]\d*)$/.test(value)) invalid(`GEP/1 ${name} must be a canonical integer.`);
  const result = Number(value);
  if (!Number.isSafeInteger(result) || result < minimum || result > maximum) invalid(`GEP/1 ${name} is out of bounds.`);
  return result;
}

/** Parses one exact length-framed packet. Payloads may contain arbitrary newlines or protocol words. */
export function parseGeorgeEditPacket(text: string): GeorgeEditPacket {
  validUtf8(text, 'GEP packet');
  const buffer = Buffer.from(text, 'utf8');
  if (buffer.length > MAX_GEP_PACKET_BYTES) invalid(`GEP packet exceeds ${MAX_GEP_PACKET_BYTES} bytes.`);
  const cursor = new PacketCursor(buffer);
  const version = cursor.line('version');
  if (version !== 'GEP/1') invalid(version.startsWith('GEP/') ? 'Unknown George Edit Protocol version.' : 'Operation response is not a GEP/1 packet.');
  const operations: Array<EditOperation | CreateOperation> = [];
  let edits = 0;
  for (;;) {
    const header = cursor.line('record header');
    if (header === 'END') break;
    if (operations.length >= MAX_OPERATIONS) invalid('GEP/1 operation count exceeds its limit.');
    const fields = header.split(' ');
    if (fields[0] === 'E' && fields.length === 3 && /^R[1-9]\d{0,3}$/.test(fields[1]!)) {
      const count = integer(fields[2]!, 'edit count', 1, MAX_EDITS);
      edits += count;
      if (edits > MAX_EDITS) invalid('GEP/1 edit count exceeds its limit.');
      const ranges: Array<{ start: number; end: number; replacement: string }> = [];
      for (let index = 0; index < count; index += 1) {
        const range = cursor.line('range header').split(' ');
        if (range.length !== 4 || range[0] !== 'R') invalid('GEP/1 range header is malformed.');
        const start = integer(range[1]!, 'range start', 1, 1_000_000);
        const end = integer(range[2]!, 'range end', start, 1_000_000);
        const bytes = integer(range[3]!, 'replacement byte length', 0, MAX_GEP_PACKET_BYTES);
        const replacement = cursor.text(bytes, 'replacement');
        if (replacement.includes('\r') || replacement.endsWith('\n')) invalid('GEP/1 replacement uses LF-separated logical lines and must not end with a newline.');
        ranges.push({ start, end, replacement });
      }
      operations.push({ kind: 'edit', receiptId: fields[1]!, ranges });
      continue;
    }
    if (fields[0] === 'C' && fields.length === 3) {
      const pathBytes = integer(fields[1]!, 'create path byte length', 1, MAX_GEP_PACKET_BYTES);
      const contentBytes = integer(fields[2]!, 'create content byte length', 0, MAX_GEP_PACKET_BYTES);
      operations.push({ kind: 'create', path: cursor.text(pathBytes, 'create path'), content: cursor.text(contentBytes, 'create content') });
      continue;
    }
    invalid('GEP/1 record header is malformed.');
  }
  if (!cursor.done || operations.length === 0) invalid('GEP/1 packet is empty or has trailing data.');
  return Object.freeze({ operations: Object.freeze(operations), bytes: buffer.length });
}

function lineSpans(text: string, framing: TextFraming): readonly Readonly<{ start: number; end: number }>[] {
  if (!text) return [];
  const separator = framing.lineEnding === 'crlf' ? '\r\n' : framing.lineEnding === 'lf' ? '\n' : undefined;
  if (!separator) return [{ start: 0, end: text.length }];
  const spans: Array<{ start: number; end: number }> = [];
  let start = 0;
  for (;;) {
    const newline = text.indexOf(separator, start);
    if (newline < 0) { if (start < text.length) spans.push({ start, end: text.length }); break; }
    spans.push({ start, end: newline + separator.length });
    start = newline + separator.length;
    if (start === text.length) break;
  }
  return spans;
}

function applyRanges(receipt: Receipt, ranges: EditOperation['ranges']): string {
  const spans = lineSpans(receipt.snapshot, receipt.framing);
  const ordered = [...ranges].sort((left, right) => left.start - right.start || left.end - right.end);
  for (let index = 0; index < ordered.length; index += 1) {
    const range = ordered[index]!;
    if (range.end > spans.length) invalid(`GEP/1 range ${range.start}-${range.end} is outside receipt ${receipt.id}.`);
    if (index > 0 && range.start <= ordered[index - 1]!.end) invalid(`GEP/1 ranges overlap for receipt ${receipt.id}.`);
  }
  const separator = receipt.framing.lineEnding === 'crlf' ? '\r\n' : receipt.framing.lineEnding === 'lf' ? '\n' : '';
  let result = receipt.snapshot;
  for (const range of ordered.reverse()) {
    const start = spans[range.start - 1]!.start;
    const end = spans[range.end - 1]!.end;
    const oldText = receipt.snapshot.slice(start, end);
    let replacement = separator ? range.replacement.replaceAll('\n', separator) : range.replacement;
    if (!separator && replacement.includes('\n')) invalid(`GEP/1 receipt ${receipt.id} has no line-ending convention for a multiline replacement.`);
    if (replacement && separator && oldText.endsWith(separator)) replacement += separator;
    result = `${result.slice(0, start)}${replacement}${result.slice(end)}`;
  }
  if (Buffer.byteLength(result, 'utf8') > MAX_EXPANDED_FILE_BYTES) invalid('GEP/1 expanded file exceeds its byte limit.');
  return result;
}

function sha256(value: Buffer | string): string { return createHash('sha256').update(value).digest('hex'); }

function conflicts(targets: ReadonlySet<string>, path: string): boolean {
  for (const target of targets) {
    const forward = relative(target, path);
    const backward = relative(path, target);
    if (forward === '' || (forward && !forward.startsWith('..') && !isAbsolute(forward)) || (backward && !backward.startsWith('..') && !isAbsolute(backward))) return true;
  }
  return false;
}

export class GeorgeEditReceiptRegistry {
  private readonly receipts = new Map<string, Receipt>();
  private next = 1;

  get count(): number { return this.receipts.size; }

  /** Returns compact provider evidence while retaining the exact snapshot only in this run-local registry. */
  project(result: ToolResult, epoch: number): ToolResult {
    if (result.name !== 'read_file' || !result.result.ok || !result.result.value || typeof result.result.value !== 'object' || Array.isArray(result.result.value)) return result;
    const value = result.result.value as Record<string, unknown>;
    const framing = value.textFraming as TextFraming | undefined;
    if (typeof value.path !== 'string' || typeof value.text !== 'string' || typeof value.bytes !== 'number' || value.truncated !== false || typeof value.sha256 !== 'string' || !SHA256.test(value.sha256)
      || !framing || framing.lineEnding === 'mixed' || !['none', 'lf', 'crlf'].includes(framing.lineEnding) || !['none', 'lf', 'crlf'].includes(framing.finalNewline)) return result;
    const bytes = Buffer.from(value.text, 'utf8');
    if (!value.text || bytes.length !== value.bytes || bytes.length > MAX_RECEIPT_BYTES || bytes.toString('utf8') !== value.text || value.text.includes('\0')) return result;
    if (this.receipts.size === MAX_RECEIPTS) this.receipts.delete(this.receipts.keys().next().value!);
    const id = `R${this.next++}`;
    const receipt = Object.freeze({ id, path: value.path, sha256: value.sha256, snapshot: value.text, framing, epoch });
    this.receipts.set(id, receipt);
    const separator = framing.lineEnding === 'crlf' ? '\r\n' : framing.lineEnding === 'lf' ? '\n' : undefined;
    const lines = separator === undefined ? [value.text] : value.text.split(separator).slice(0, framing.finalNewline === 'none' ? undefined : -1);
    const projected: JsonValue = { name: 'read_file', path: value.path, receipt: id, lines: lines.map((line, index) => `${index + 1}|${line}`).join('\n'), bytes: value.bytes, textFraming: framing as unknown as JsonValue };
    return { ...result, result: { ok: true, value: projected } };
  }

  async prepare(text: string, workspace: Workspace, epoch: number, signal?: AbortSignal): Promise<PreparedGeorgeEditPacket> {
    const packet = parseGeorgeEditPacket(text);
    const targets = new Set<string>();
    const calls: ToolCall[] = [];
    let expandedMutationBytes = 0;
    let editCount = 0;
    for (const [index, operation] of packet.operations.entries()) {
      if (signal?.aborted) throw cancellationError(signal);
      if (operation.kind === 'edit') {
        const receipt = this.receipts.get(operation.receiptId);
        if (!receipt) invalid(`GEP/1 receipt ${operation.receiptId} is unknown.`);
        if (receipt.epoch !== epoch) invalid(`GEP/1 receipt ${operation.receiptId} is stale.`, true);
        const target = await resolveWorkspaceMutationPath(workspace, receipt.path);
        if (!target.exists) invalid(`GEP/1 receipt ${operation.receiptId} is stale.`, true);
        const current = await readFile(target.path);
        if (sha256(current) !== receipt.sha256) invalid(`GEP/1 receipt ${operation.receiptId} is stale.`, true);
        if (conflicts(targets, target.path)) invalid('GEP/1 has a duplicate or dependent ambiguous target.');
        targets.add(target.path);
        const next = applyRanges(receipt, operation.ranges);
        const arguments_ = JSON.stringify({ path: receipt.path, expectedSha256: receipt.sha256, edits: [{ oldText: receipt.snapshot, newText: next }] });
        calls.push({ callId: `gep-${index + 1}`, name: 'apply_patch', arguments: arguments_ });
        expandedMutationBytes += Buffer.byteLength(arguments_, 'utf8');
        editCount += operation.ranges.length;
      } else {
        validUtf8(operation.path, 'GEP/1 create path');
        validUtf8(operation.content, 'GEP/1 create content');
        const target = await resolveWorkspaceMutationPath(workspace, operation.path);
        if (target.exists) invalid('GEP/1 create target already exists.');
        if (conflicts(targets, target.path)) invalid('GEP/1 has a duplicate or dependent ambiguous target.');
        targets.add(target.path);
        const arguments_ = JSON.stringify({ path: target.relativePath, content: operation.content });
        calls.push({ callId: `gep-${index + 1}`, name: 'write_file', arguments: arguments_ });
        expandedMutationBytes += Buffer.byteLength(arguments_, 'utf8');
      }
    }
    return Object.freeze({ calls: Object.freeze(calls), packetBytes: packet.bytes, expandedMutationBytes, editCount, fileCount: calls.length });
  }
}

export function isStaleGeorgeEditError(error: unknown): boolean {
  return error instanceof GeorgeError && !!error.cause && typeof error.cause === 'object' && (error.cause as Record<string, unknown>).kind === 'gep' && (error.cause as Record<string, unknown>).staleReceipt === true;
}
