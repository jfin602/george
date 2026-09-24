import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { ChromeDevtoolsAdapter, ToolRegistry, loadChromeDevtoolsConfiguration } from '../../../src/tools/index.ts';

const SERVER = String.raw`
let buffered = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', data => {
  buffered += data;
  for (;;) {
    const end = buffered.indexOf('\n'); if (end < 0) return;
    const line = buffered.slice(0, end); buffered = buffered.slice(end + 1); if (!line) continue;
    const request = JSON.parse(line); if (request.id === undefined) continue;
    const reply = result => process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id: request.id, result }) + '\n');
    if (request.method === 'server/discover') reply({ supportedVersions: ['2026-07-28'], capabilities: { tools: {} } });
    else if (request.method === 'initialize') reply({ protocolVersion: '2025-06-18', capabilities: { tools: {} }, serverInfo: { name: 'chrome fixture', version: '1.0.0' } });
    else if (request.method === 'tools/list') reply({ resultType: 'complete', ttlMs: 0, cacheScope: 'private', tools: [
      { name: 'list_pages', inputSchema: { type: 'object', properties: {}, additionalProperties: false } },
      { name: 'take_snapshot', inputSchema: { type: 'object', properties: {}, additionalProperties: false } },
      { name: 'list_console_messages', inputSchema: { type: 'object', properties: {}, additionalProperties: false } },
      { name: 'list_network_requests', inputSchema: { type: 'object', properties: {}, additionalProperties: false } },
      { name: 'navigate_page', inputSchema: { type: 'object', properties: {}, additionalProperties: false } },
      { name: 'click', inputSchema: { type: 'object', properties: {}, additionalProperties: false } },
      { name: 'fill', inputSchema: { type: 'object', properties: {}, additionalProperties: false } },
      { name: 'evaluate_script', inputSchema: { type: 'object', properties: {}, additionalProperties: false } },
      { name: 'extension_control', inputSchema: { type: 'object', properties: {}, additionalProperties: false } },
      { name: 'experimental', inputSchema: { type: 'object', properties: {}, additionalProperties: false } }
    ] });
    else if (request.method === 'tools/call' && request.params.name === 'evaluate_script') { /* cancellation fixture */ }
    else if (request.method === 'tools/call') reply({ resultType: 'complete', ttlMs: 0, cacheScope: 'private', content: [{ type: 'text', text: JSON.stringify({ cookie: 'COOKIE_SECRET', authorization: 'Bearer AUTH_SECRET', localStorage: 'STORAGE_SECRET', body: 'Authorization: TEXT_SECRET', snapshot: 'x'.repeat(8000) }) }] });
  }
});
`;

function configuration(profile: 'dedicated' | 'authenticated' = 'dedicated', allowTools?: readonly string[]) {
  return {
    profile,
    server: { id: 'chrome-fixture', transport: 'stdio' as const, command: process.execPath, args: ['--input-type=module', '--eval', SERVER], ...(allowTools === undefined ? {} : { allowTools }) },
  };
}

test('Chrome DevTools profile curates effects, protects browser secrets, and bounds output', async () => {
  const catalog = await new ChromeDevtoolsAdapter({ configuration: configuration('authenticated') }).discover();
  assert.deepEqual(catalog.definitions.map((tool) => tool.name).sort(), ['chrome:click', 'chrome:evaluate_script', 'chrome:fill', 'chrome:list_console_messages', 'chrome:list_network_requests', 'chrome:list_pages', 'chrome:navigate_page', 'chrome:take_snapshot'], JSON.stringify(catalog.issues));
  assert.equal(catalog.definitions.find((tool) => tool.name === 'chrome:take_snapshot')?.execution.effect, 'browser_observation');
  assert.equal(catalog.definitions.find((tool) => tool.name === 'chrome:click')?.execution.effect, 'browser_interaction');
  assert.match(catalog.definitions.find((tool) => tool.name === 'chrome:click')?.execution.descriptor?.warning ?? '', /logged-in browser session/);
  assert.equal(catalog.issues.some((issue) => issue.tool === 'extension_control' && issue.reason === 'not allowlisted'), true);
  assert.equal(catalog.issues.some((issue) => issue.tool === 'experimental' && issue.reason === 'not allowlisted'), true);
  const result = await new ToolRegistry(catalog.definitions).dispatch({ callId: 'snapshot', name: 'chrome:take_snapshot', arguments: '{}' });
  assert.equal(result.result.ok, true, JSON.stringify(result));
  const output = JSON.stringify(result);
  assert.doesNotMatch(output, /COOKIE_SECRET|AUTH_SECRET|STORAGE_SECRET|TEXT_SECRET/);
  assert.ok(Buffer.byteLength(output, 'utf8') <= 17 * 1024);
});

test('Chrome DevTools excludes unknown tools by default, permits explicit opt-in conservatively, and cancels calls', async () => {
  const catalog = await new ChromeDevtoolsAdapter({ configuration: configuration('dedicated', ['experimental']) }).discover();
  assert.equal(catalog.definitions.find((tool) => tool.name === 'chrome:experimental')?.execution.effect, 'unknown_external');
  const controller = new AbortController();
  const pending = new ToolRegistry(catalog.definitions).dispatch({ callId: 'cancel', name: 'chrome:evaluate_script', arguments: '{}' }, { signal: controller.signal });
  setTimeout(() => controller.abort(), 20);
  await assert.rejects(pending, /cancel/i);
});

test('Chrome DevTools configuration is user-global, defaults to a dedicated profile, and can disable the adapter', async (t) => {
  const root = await mkdtemp(join(tmpdir(), 'george-chrome-'));
  t.after(async () => rm(root, { recursive: true, force: true }));
  await writeFile(join(root, 'chrome-devtools.json'), JSON.stringify({ version: 1, server: configuration().server }));
  const loaded = await loadChromeDevtoolsConfiguration(root);
  assert.equal(loaded?.profile, undefined);
  assert.equal((await new ChromeDevtoolsAdapter({ configuration: { ...configuration(), enabled: false } }).discover()).issues[0]?.reason, 'disabled');
});
