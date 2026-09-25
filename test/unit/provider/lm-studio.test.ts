import assert from 'node:assert/strict';
import { createServer, type Server } from 'node:http';
import test from 'node:test';

import { GeorgeError, resolveGeorgeConfig } from '../../../src/core/index.ts';
import { LmStudioResponsesProvider } from '../../../src/provider/index.ts';

type RequestHandler = (request: import('node:http').IncomingMessage, response: import('node:http').ServerResponse) => void;

async function fixture(handler: RequestHandler): Promise<{ server: Server; baseUrl: string }> {
  const server = createServer(handler);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Expected TCP listener.');
  return { server, baseUrl: `http://127.0.0.1:${address.port}` };
}

async function close(server: Server): Promise<void> {
  await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
}

async function eventsFrom(stream: AsyncIterable<unknown>): Promise<unknown[]> {
  const events: unknown[] = [];
  for await (const event of stream) events.push(event);
  return events;
}

test('LM Studio provider receives the resolved George timeout configuration', () => {
  const config = resolveGeorgeConfig({ model: 'local-model' }, '/workspace', {
    environment: { GEORGE_PROVIDER_TIMEOUT_MS: '120000' },
  });
  const provider = new LmStudioResponsesProvider(config.provider);
  assert.equal(provider.defaultTimeoutMs, 120_000);
});

function sse(response: import('node:http').ServerResponse, chunks: string[]): void {
  response.writeHead(200, { 'content-type': 'text/event-stream' });
  for (const chunk of chunks) response.write(chunk);
  response.end();
}

test('LM Studio provider sends the Responses request shape and parses split CRLF SSE text', async (t) => {
  let requestBody = '';
  const { server, baseUrl } = await fixture((request, response) => {
    assert.equal(request.method, 'POST');
    assert.equal(request.url, '/v1/responses');
    request.setEncoding('utf8');
    request.on('data', (chunk: string) => { requestBody += chunk; });
    request.on('end', () => sse(response, [
      'event: response.created\r\ndata: {"type":"response.created","response":{"id":"r-1"}}\r\n\r\n',
      'event: ignored\r\n\r\n',
      'event: response.output_text.delta\r\ndata: {"type":"response.output_text.delta","delta":"hel',
      'lo"}\r\n\r\n',
      'event: response.output_text.delta\r\ndata: {"type":"response.output_text.delta",\r\ndata: "delta":" world"}\r\n\r\n',
      'event: response.completed\r\ndata: {"type":"response.completed","response":{"usage":{"input_tokens":3,"output_tokens":2}}}\r\n\r\n',
    ]));
  });
  t.after(() => close(server));

  const provider = new LmStudioResponsesProvider({ baseUrl, model: 'local-model' });
  const events = await eventsFrom(provider.stream({ instructions: 'Be brief.', input: 'Hello' }));

  assert.deepEqual(JSON.parse(requestBody), {
    model: 'local-model',
    instructions: 'Be brief.',
    input: 'Hello',
    stream: true,
  });
  assert.deepEqual(events, [
    { type: 'provider.response.started', responseId: 'r-1' },
    { type: 'provider.text.delta', delta: 'hello' },
    { type: 'provider.text.delta', delta: ' world' },
    { type: 'provider.response.completed', usage: { inputTokens: 3, outputTokens: 2 } },
  ]);
});

test('LM Studio provider maps provider-neutral tool choice without changing tools or continuation', async (t) => {
  const requests: Array<Record<string, unknown>> = [];
  const { server, baseUrl } = await fixture((request, response) => {
    let body = '';
    request.setEncoding('utf8');
    request.on('data', (chunk: string) => { body += chunk; });
    request.on('end', () => { requests.push(JSON.parse(body)); sse(response, ['data: {"type":"response.completed","response":{}}\n\n']); });
  });
  t.after(() => close(server));
  const provider = new LmStudioResponsesProvider({ baseUrl, model: 'local-model' });
  const tools = [{ name: 'read_file', description: 'Read.', inputSchema: { type: 'object', properties: { path: { type: 'string' } }, required: ['path'], additionalProperties: false } }] as const;

  for (const toolChoice of [undefined, 'auto', 'required', 'none'] as const) {
    await eventsFrom(provider.stream({ input: 'Inspect.', tools, ...(toolChoice === undefined ? {} : { toolChoice }) }));
  }
  await eventsFrom(provider.stream({
    input: 'ignored', tools, toolChoice: 'auto',
    continuation: { responseId: 'response-1', toolResults: [{ callId: 'call-1', name: 'read_file', result: { ok: true, value: { path: 'BOOT.md' } } }] },
  }));

  assert.deepEqual(requests.map((request) => request.tool_choice), [undefined, 'auto', 'required', 'none', 'auto']);
  assert.ok(requests.every((request) => JSON.stringify(request.tools) === JSON.stringify([{ type: 'function', name: 'read_file', description: 'Read.', parameters: tools[0].inputSchema }])));
  assert.deepEqual(requests[4], {
    model: 'local-model', previous_response_id: 'response-1',
    input: [{ type: 'function_call_output', call_id: 'call-1', output: '{"ok":true,"value":{"path":"BOOT.md"}}' }],
    tools: [{ type: 'function', name: 'read_file', description: 'Read.', parameters: tools[0].inputSchema }],
    tool_choice: 'auto', stream: true,
  });
  assert.equal('tool_choice' in requests[0]!, false);
});

test('LM Studio provider rejects required tool choice without exposed tools before POST', async () => {
  const provider = new LmStudioResponsesProvider({ baseUrl: 'http://127.0.0.1:1234', model: 'local-model' });
  const events: unknown[] = [];
  await assert.rejects(async () => {
    for await (const event of provider.stream({ input: 'Inspect.', toolChoice: 'required' })) events.push(event);
  }, (error: unknown) => error instanceof GeorgeError && error.code === 'configuration');
  assert.equal((events.at(-1) as { type: string }).type, 'provider.error');
});

test('LM Studio provider assembles a function call from output-item and argument stream events', async (t) => {
  const { server, baseUrl } = await fixture((_request, response) => sse(response, [
    'data: {"type":"response.output_item.added","output_index":0,"item":{"id":"item-1","type":"function_call","call_id":"call-1","name":"read_file","arguments":""}}\n\n',
    'data: {"type":"response.function_call_arguments.delta","item_id":"item-1","output_index":0,"delta":"{\\"path\\":"}\n\n',
    'data: {"type":"response.function_call_arguments.delta","item_id":"item-1","output_index":0,"delta":"\\"a.ts\\"}"}\n\n',
    'data: {"type":"response.function_call_arguments.done","item_id":"item-1","output_index":0,"name":"read_file","arguments":"{\\"path\\":\\"a.ts\\"}"}\n\n',
    'data: {"type":"response.output_item.done","output_index":0,"item":{"id":"item-1","type":"function_call","status":"completed"}}\n\n',
    'data: {"type":"response.completed","response":{}}\n\n',
  ]));
  t.after(() => close(server));

  const provider = new LmStudioResponsesProvider({ baseUrl, model: 'local-model' });
  assert.deepEqual(await eventsFrom(provider.stream({ input: 'Read a.ts' })), [
    { type: 'provider.tool.call', callId: 'call-1', name: 'read_file', arguments: '{"path":"a.ts"}' },
    { type: 'provider.response.completed' },
  ]);
});

test('LM Studio provider completes arguments-done calls from earlier output-item state', async (t) => {
  const { server, baseUrl } = await fixture((_request, response) => sse(response, [
    'data: {"type":"response.output_item.added","output_index":0,"item":{"id":"item-1","type":"function_call","call_id":"call-1","name":"read_file"}}\n\n',
    'data: {"type":"response.function_call_arguments.done","item_id":"item-1","output_index":0,"arguments":"{\\"path\\":\\"a.ts\\"}"}\n\n',
    'data: {"type":"response.completed","response":{}}\n\n',
  ]));
  t.after(() => close(server));

  const provider = new LmStudioResponsesProvider({ baseUrl, model: 'local-model' });
  assert.deepEqual(await eventsFrom(provider.stream({ input: 'Read a.ts' })), [
    { type: 'provider.tool.call', callId: 'call-1', name: 'read_file', arguments: '{"path":"a.ts"}' },
    { type: 'provider.response.completed' },
  ]);
});

test('LM Studio provider normalizes function calls without duplicate output-item events', async (t) => {
  const { server, baseUrl } = await fixture((_request, response) => sse(response, [
    'data: {"type":"response.function_call_arguments.done","call_id":"call-1","name":"read_file","arguments":"{\\"path\\":\\"a.ts\\"}"}\n\n',
    'data: {"type":"response.output_item.done","item":{"type":"function_call","call_id":"call-1","name":"read_file","arguments":"{\\"path\\":\\"a.ts\\"}"}}\n\n',
    'data: {"type":"response.completed","response":{}}\n\n',
  ]));
  t.after(() => close(server));

  const provider = new LmStudioResponsesProvider({ baseUrl, model: 'local-model' });
  assert.deepEqual(await eventsFrom(provider.stream({ input: 'Read a.ts' })), [
    { type: 'provider.tool.call', callId: 'call-1', name: 'read_file', arguments: '{"path":"a.ts"}' },
    { type: 'provider.response.completed' },
  ]);
});

test('LM Studio provider rejects function calls left incomplete at item or response completion', async (t) => {
  const cases: ReadonlyArray<Readonly<{ name: string; chunks: string[]; expected: RegExp }>> = [
    {
      name: 'output item completion',
      chunks: [
        'data: {"type":"response.output_item.added","output_index":0,"item":{"id":"item-1","type":"function_call","call_id":"call-1"}}\n\n',
        'data: {"type":"response.output_item.done","output_index":0,"item":{"id":"item-1","type":"function_call","status":"completed"}}\n\n',
      ],
      expected: /completed an incomplete function call/,
    },
    {
      name: 'response completion',
      chunks: [
        'data: {"type":"response.output_item.added","output_index":0,"item":{"id":"item-1","type":"function_call","call_id":"call-1","name":"read_file"}}\n\n',
        'data: {"type":"response.completed","response":{}}\n\n',
      ],
      expected: /completed a response with an incomplete function call/,
    },
  ];

  for (const item of cases) {
    await t.test(item.name, async (subtest) => {
      const { server, baseUrl } = await fixture((_request, response) => sse(response, item.chunks));
      subtest.after(() => close(server));
      const events: unknown[] = [];
      await assert.rejects(async () => {
        for await (const event of new LmStudioResponsesProvider({ baseUrl, model: 'local-model' }).stream({ input: 'Read.' })) events.push(event);
      }, (error: unknown) => error instanceof GeorgeError && error.code === 'provider' && item.expected.test(error.message));
      assert.equal((events.at(-1) as { type: string }).type, 'provider.error');
    });
  }
});

test('LM Studio provider assembles multiple streamed function calls in output order', async (t) => {
  const { server, baseUrl } = await fixture((_request, response) => sse(response, [
    'data: {"type":"response.output_item.added","output_index":0,"item":{"id":"item-1","type":"function_call","call_id":"call-1","name":"read_file","arguments":""}}\n\n',
    'data: {"type":"response.output_item.added","output_index":1,"item":{"id":"item-2","type":"function_call","call_id":"call-2","name":"git_status","arguments":""}}\n\n',
    'data: {"type":"response.function_call_arguments.delta","item_id":"item-1","output_index":0,"delta":"{\\"path\\":\\"a.ts\\"}"}\n\n',
    'data: {"type":"response.function_call_arguments.done","item_id":"item-1","output_index":0,"arguments":"{\\"path\\":\\"a.ts\\"}"}\n\n',
    'data: {"type":"response.function_call_arguments.delta","item_id":"item-2","output_index":1,"delta":"{}"}\n\n',
    'data: {"type":"response.function_call_arguments.done","item_id":"item-2","output_index":1,"arguments":"{}"}\n\n',
    'data: {"type":"response.completed","response":{}}\n\n',
  ]));
  t.after(() => close(server));

  const provider = new LmStudioResponsesProvider({ baseUrl, model: 'local-model' });
  assert.deepEqual(await eventsFrom(provider.stream({ input: 'Inspect.' })), [
    { type: 'provider.tool.call', callId: 'call-1', name: 'read_file', arguments: '{"path":"a.ts"}' },
    { type: 'provider.tool.call', callId: 'call-2', name: 'git_status', arguments: '{}' },
    { type: 'provider.response.completed' },
  ]);
});

test('LM Studio provider serializes multiple custom tools and structured tool-result continuation', async (t) => {
  const requests: unknown[] = [];
  const { server, baseUrl } = await fixture((request, response) => {
    let body = '';
    request.setEncoding('utf8');
    request.on('data', (chunk: string) => { body += chunk; });
    request.on('end', () => {
      requests.push(JSON.parse(body));
      sse(response, requests.length === 1
        ? [
            'data: {"type":"response.created","response":{"id":"response-1"}}\n\n',
            'data: {"type":"response.function_call_arguments.done","call_id":"call-1","name":"read_file","arguments":"{\\"path\\":\\"BOOT.md\\"}"}\n\n',
            'data: {"type":"response.completed","response":{}}\n\n',
          ]
        : ['data: {"type":"response.completed","response":{}}\n\n']);
    });
  });
  t.after(() => close(server));

  const tools = [
    {
      name: 'read_file', description: 'Read a file.',
      inputSchema: { type: 'object', properties: { path: { type: 'string' } }, required: ['path'], additionalProperties: false },
    },
    {
      name: 'git_status', description: 'Read status.',
      inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    },
  ] as const;
  const provider = new LmStudioResponsesProvider({ baseUrl, model: 'local-model' });
  assert.deepEqual(await eventsFrom(provider.stream({ input: 'Inspect.', tools })), [
    { type: 'provider.response.started', responseId: 'response-1' },
    { type: 'provider.tool.call', callId: 'call-1', name: 'read_file', arguments: '{"path":"BOOT.md"}' },
    { type: 'provider.response.completed' },
  ]);
  await eventsFrom(provider.stream({
    input: 'ignored by continuation',
    tools,
    continuation: {
      responseId: 'response-1',
      toolResults: [
        { callId: 'call-1', name: 'read_file', result: { ok: true, value: { path: 'BOOT.md', text: 'boot' } } },
        { callId: 'call-2', name: 'git_status', result: { ok: false, error: { code: 'tool', message: 'not a Git repository' } } },
      ],
    },
  }));

  assert.deepEqual(requests, [
    {
      model: 'local-model', input: 'Inspect.', stream: true,
      tools: [
        { type: 'function', name: 'read_file', description: 'Read a file.', parameters: tools[0].inputSchema },
        { type: 'function', name: 'git_status', description: 'Read status.', parameters: tools[1].inputSchema },
      ],
    },
    {
      model: 'local-model', previous_response_id: 'response-1', stream: true,
      input: [
        { type: 'function_call_output', call_id: 'call-1', output: '{"ok":true,"value":{"path":"BOOT.md","text":"boot"}}' },
        { type: 'function_call_output', call_id: 'call-2', output: '{"ok":false,"error":{"code":"tool","message":"not a Git repository"}}' },
      ],
      tools: [
        { type: 'function', name: 'read_file', description: 'Read a file.', parameters: tools[0].inputSchema },
        { type: 'function', name: 'git_status', description: 'Read status.', parameters: tools[1].inputSchema },
      ],
    },
  ]);
});

test('LM Studio reports a rejected continuation without blind fallback or replay', async (t) => {
  const requests: unknown[] = [];
  const { server, baseUrl } = await fixture((request, response) => {
    let body = '';
    request.setEncoding('utf8');
    request.on('data', (chunk: string) => { body += chunk; });
    request.on('end', () => {
      requests.push(JSON.parse(body));
      response.writeHead(422); response.end();
    });
  });
  t.after(() => close(server));

  const request = {
    instructions: 'Use the registered tools.', input: 'Read.',
    tools: [{ name: 'read_file', description: 'Read a file.', inputSchema: { type: 'object', properties: {}, additionalProperties: false } }],
    continuation: { responseId: 'response-1', toolResults: [{ callId: 'call-1', name: 'read_file', result: { ok: true as const, value: 'ok' } }] },
  };
  const events: unknown[] = [];
  await assert.rejects(async () => { for await (const event of new LmStudioResponsesProvider({ baseUrl, model: 'local-model' }).stream(request)) events.push(event); }, (error: unknown) => error instanceof GeorgeError && error.code === 'provider');
  assert.equal((events.at(-1) as { type: string }).type, 'provider.error');
  assert.deepEqual(requests, [{ model: 'local-model', instructions: 'Use the registered tools.', previous_response_id: 'response-1', input: [{ type: 'function_call_output', call_id: 'call-1', output: '{"ok":true,"value":"ok"}' }], tools: [{ type: 'function', name: 'read_file', description: 'Read a file.', parameters: request.tools[0].inputSchema }], stream: true }]);
});

test('LM Studio continuation cancellation and provider errors do not fall back or replay', async (t) => {
  await t.test('cancellation', async (subtest) => {
    let requestBody = '';
    const { server, baseUrl } = await fixture((request, response) => {
      request.setEncoding('utf8');
      request.on('data', (chunk: string) => { requestBody += chunk; });
      request.on('end', () => { response.writeHead(200, { 'content-type': 'text/event-stream' }); response.write('data: {"type":"response.created","response":{"id":"r-1"}}\n\n'); });
    });
    subtest.after(() => close(server));
    const controller = new AbortController();
    const iterator = new LmStudioResponsesProvider({ baseUrl, model: 'local-model' }).stream({ instructions: 'Keep context.', input: 'ignored', tools: [{ name: 'read_file', description: 'Read.', inputSchema: { type: 'object', properties: {} } }], continuation: { responseId: 'r-0', toolResults: [] } }, { signal: controller.signal })[Symbol.asyncIterator]();
    assert.equal((await iterator.next()).value?.type, 'provider.response.started');
    controller.abort();
    const events: unknown[] = [];
    await assert.rejects(async () => { for (;;) { const next = await iterator.next(); if (next.done) return; events.push(next.value); } }, (error: unknown) => error instanceof GeorgeError && error.code === 'cancelled');
    assert.equal((events.at(-1) as { type: string }).type, 'provider.error');
    assert.deepEqual(JSON.parse(requestBody), { model: 'local-model', instructions: 'Keep context.', previous_response_id: 'r-0', input: [], tools: [{ type: 'function', name: 'read_file', description: 'Read.', parameters: { type: 'object', properties: {} } }], stream: true });
  });

  await t.test('provider error', async (subtest) => {
    const requests: unknown[] = [];
    const { server, baseUrl } = await fixture((request, response) => {
      let body = '';
      request.setEncoding('utf8');
      request.on('data', (chunk: string) => { body += chunk; });
      request.on('end', () => { requests.push(JSON.parse(body)); response.writeHead(500); response.end(); });
    });
    subtest.after(() => close(server));
    const events: unknown[] = [];
    await assert.rejects(async () => { for await (const event of new LmStudioResponsesProvider({ baseUrl, model: 'local-model' }).stream({ instructions: 'Keep context.', input: 'ignored', tools: [{ name: 'read_file', description: 'Read.', inputSchema: { type: 'object', properties: {} } }], continuation: { responseId: 'r-0', toolResults: [] } })) events.push(event); }, (error: unknown) => error instanceof GeorgeError && error.code === 'provider');
    assert.equal((events.at(-1) as { type: string }).type, 'provider.error');
    assert.deepEqual(requests, [{ model: 'local-model', instructions: 'Keep context.', previous_response_id: 'r-0', input: [], tools: [{ type: 'function', name: 'read_file', description: 'Read.', parameters: { type: 'object', properties: {} } }], stream: true }]);
  });
});

test('LM Studio provider requires an explicit model and retains the loopback boundary', async () => {
  const provider = new LmStudioResponsesProvider({ baseUrl: 'http://127.0.0.1:1234' });
  const seen: unknown[] = [];
  await assert.rejects(async () => {
    for await (const event of provider.stream({ input: 'Hello' })) seen.push(event);
  }, (error: unknown) => error instanceof GeorgeError && error.code === 'configuration');
  assert.equal((seen.at(-1) as { type: string }).type, 'provider.error');
  assert.throws(
    () => new LmStudioResponsesProvider({ baseUrl: 'https://example.com', model: 'remote' }),
    GeorgeError,
  );
});

test('LM Studio provider reports caller aborts and bounded timeouts', async (t) => {
  const { server, baseUrl } = await fixture((_request, response) => {
    response.writeHead(200, { 'content-type': 'text/event-stream' });
    response.write('data: {"type":"response.created","response":{"id":"r-1"}}\n\n');
  });
  t.after(() => close(server));

  const provider = new LmStudioResponsesProvider({ baseUrl, model: 'local-model', timeoutMs: 40 });
  const cancellation = new AbortController();
  const iterator = provider.stream({ input: 'Wait' }, { signal: cancellation.signal })[Symbol.asyncIterator]();
  assert.equal((await iterator.next()).value?.type, 'provider.response.started');
  cancellation.abort();
  const abortEvents: unknown[] = [];
  await assert.rejects(async () => {
    while (true) {
      const result = await iterator.next();
      if (result.done) return;
      abortEvents.push(result.value);
    }
  }, (error: unknown) => error instanceof GeorgeError && error.code === 'cancelled');
  assert.equal((abortEvents.at(-1) as { type: string }).type, 'provider.error');

  const timeoutEvents: unknown[] = [];
  await assert.rejects(async () => {
    for await (const event of provider.stream({ input: 'Wait' }, { timeoutMs: 20 })) timeoutEvents.push(event);
  }, (error: unknown) => error instanceof GeorgeError && error.code === 'provider' && /timed out/.test(error.message));
  assert.equal((timeoutEvents.at(-1) as { type: string }).type, 'provider.error');
});

test('LM Studio provider preserves bounded safe diagnostics from failure events', async (t) => {
  const cases = [
    {
      name: 'response.failed',
      data: { type: 'response.failed', response: { status: 422, error: { code: 'context_length_exceeded', message: 'input exceeds context window', raw: 'TOP_SECRET_PAYLOAD' } } },
      message: 'LM Studio response.failed: context_length_exceeded — input exceeds context window',
      cause: { kind: 'provider_event', providerEventType: 'response.failed', providerCode: 'context_length_exceeded', providerMessage: 'input exceeds context window', status: 422 },
    },
    {
      name: 'response.incomplete',
      data: { type: 'response.incomplete', response: { incomplete_details: { reason: 'max_output_tokens', raw: 'TOP_SECRET_PAYLOAD' } } },
      message: 'LM Studio response.incomplete: max_output_tokens',
      cause: { kind: 'provider_event', providerEventType: 'response.incomplete', providerReason: 'max_output_tokens' },
    },
    {
      name: 'error',
      data: { type: 'error', error: { code: 'server_error', message: 'generation failed', raw: 'TOP_SECRET_PAYLOAD' } },
      message: 'LM Studio provider error: server_error — generation failed',
      cause: { kind: 'provider_event', providerEventType: 'error', providerCode: 'server_error', providerMessage: 'generation failed' },
    },
    {
      name: 'unexpected payload',
      data: { type: 'response.failed', response: { error: { message: { raw: 'TOP_SECRET_PAYLOAD' } }, raw: 'TOP_SECRET_PAYLOAD' }, raw: 'TOP_SECRET_PAYLOAD' },
      message: 'LM Studio response.failed.',
      cause: { kind: 'provider_event', providerEventType: 'response.failed' },
    },
  ] as const;

  for (const item of cases) {
    await t.test(item.name, async (subtest) => {
      const { server, baseUrl } = await fixture((_request, response) => sse(response, [`data: ${JSON.stringify(item.data)}\n\n`]));
      subtest.after(() => close(server));
      const seen: unknown[] = [];
      let failure: unknown;
      try {
        for await (const event of new LmStudioResponsesProvider({ baseUrl, model: 'local-model' }).stream({ input: 'Hello' })) seen.push(event);
      } catch (error) {
        failure = error;
      }
      assert.ok(failure instanceof GeorgeError);
      assert.equal(failure.message, item.message);
      assert.deepEqual(failure.cause, item.cause);
      assert.equal((seen.at(-1) as { type: string }).type, 'provider.error');
      assert.doesNotMatch(JSON.stringify({ message: failure.message, cause: failure.cause }), /TOP_SECRET_PAYLOAD/);
    });
  }
});

test('LM Studio provider normalizes HTTP, provider-event, malformed, and incomplete failures', async (t) => {
  const cases: ReadonlyArray<{
    name: string;
    handler: RequestHandler;
    expected: RegExp;
  }> = [
    {
      name: 'non-2xx',
      handler: (_request, response) => { response.writeHead(503).end('unavailable'); },
      expected: /HTTP 503/,
    },
    {
      name: 'provider error event',
      handler: (_request, response) => sse(response, ['event: error\ndata: {"type":"error","error":{"message":"bad"}}\n\n']),
      expected: /provider error/,
    },
    {
      name: 'malformed SSE JSON',
      handler: (_request, response) => sse(response, ['data: {not json}\n\n']),
      expected: /malformed SSE JSON/,
    },
    {
      name: 'incomplete stream',
      handler: (_request, response) => sse(response, ['data: {"type":"response.output_text.delta","delta":"partial"}\n\n']),
      expected: /without a completion event/,
    },
  ];

  for (const item of cases) {
    await t.test(item.name, async (subtest) => {
      const { server, baseUrl } = await fixture(item.handler);
      subtest.after(() => close(server));
      const seen: unknown[] = [];
      const provider = new LmStudioResponsesProvider({ baseUrl, model: 'local-model' });
      await assert.rejects(async () => {
        for await (const event of provider.stream({ input: 'Hello' })) seen.push(event);
      }, (error: unknown) => error instanceof GeorgeError && error.code === 'provider' && item.expected.test(error.message));
      assert.equal((seen.at(-1) as { type: string }).type, 'provider.error');
    });
  }
});

test('LM Studio provider keeps the HTTP status in normalized failure metadata', async (t) => {
  const { server, baseUrl } = await fixture((_request, response) => { response.writeHead(503).end('unavailable'); });
  t.after(() => close(server));
  let failure: unknown;
  try {
    for await (const _event of new LmStudioResponsesProvider({ baseUrl, model: 'local-model' }).stream({ input: 'Hello' })) { /* consume */ }
  } catch (error) {
    failure = error;
  }
  assert.ok(failure instanceof GeorgeError);
  assert.deepEqual(failure.cause, { kind: 'http', status: 503 });
});
