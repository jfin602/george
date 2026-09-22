import assert from 'node:assert/strict';
import { createServer, type Server } from 'node:http';
import test from 'node:test';

import { GeorgeError } from '../../../src/core/index.ts';
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

test('LM Studio provider rejects malformed function calls', async (t) => {
  const { server, baseUrl } = await fixture((_request, response) => sse(response, [
    'data: {"type":"response.function_call_arguments.done","call_id":"call-1","arguments":"{}"}\n\n',
  ]));
  t.after(() => close(server));

  const events: unknown[] = [];
  await assert.rejects(async () => {
    for await (const event of new LmStudioResponsesProvider({ baseUrl, model: 'local-model' }).stream({ input: 'Read.' })) events.push(event);
  }, (error: unknown) => error instanceof GeorgeError && error.code === 'provider' && /incomplete function call/.test(error.message));
  assert.equal((events.at(-1) as { type: string }).type, 'provider.error');
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
