import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';

export async function acceptGreenfield(workspace) {
  const { createApp } = await import(pathToFileURL(`${workspace}/src/app.js`).href);
  const server = createApp().listen(0);
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    assert.deepEqual(await (await fetch(`${base}/health`)).json(), { status: 'ok' });
    const invalid = await fetch(`${base}/tasks`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ title: ' ' }) });
    assert.equal(invalid.status, 400);
    const created = await fetch(`${base}/tasks`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ title: ' ship ' }) });
    assert.equal(created.status, 201);
    assert.deepEqual(await created.json(), { id: 1, title: 'ship', done: false });
    const updated = await fetch(`${base}/tasks/1`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ done: true }) });
    assert.deepEqual(await updated.json(), { id: 1, title: 'ship', done: true });
    assert.deepEqual(await (await fetch(`${base}/tasks`)).json(), [{ id: 1, title: 'ship', done: true }]);
  } finally { server.close(); }
}
