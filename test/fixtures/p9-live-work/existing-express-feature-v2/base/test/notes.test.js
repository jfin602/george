import assert from 'node:assert/strict';
import test from 'node:test';

import { createApp } from '../src/app.js';

test('health and baseline note creation remain available', async () => {
  const server = createApp().listen(0);
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    assert.deepEqual(await (await fetch(`${base}/health`)).json(), { status: 'ok' });
    const created = await fetch(`${base}/notes`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ text: ' hello ' }) });
    assert.equal(created.status, 201);
    assert.deepEqual(await created.json(), { id: 1, text: 'hello' });
  } finally { server.close(); }
});
