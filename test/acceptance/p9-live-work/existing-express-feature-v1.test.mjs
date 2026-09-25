import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';

export async function acceptExistingFeature(workspace) {
  const { createApp } = await import(pathToFileURL(`${workspace}/src/app.js`).href);
  const server = createApp().listen(0);
  const base = `http://127.0.0.1:${server.address().port}`;
  const create = (body) => fetch(`${base}/notes`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
  try {
    assert.deepEqual(await (await create({ text: 'one', tags: [' Work ', 'work', 'home'] })).json(), { id: 1, text: 'one', tags: ['work', 'home'] });
    assert.deepEqual(await (await create({ text: 'two' })).json(), { id: 2, text: 'two', tags: [] });
    assert.equal((await create({ text: 'bad', tags: [''] })).status, 400);
    assert.deepEqual(await (await fetch(`${base}/notes?tag=WORK`)).json(), [{ id: 1, text: 'one', tags: ['work', 'home'] }]);
    assert.equal((await fetch(`${base}/notes?tag=%20`)).status, 400);
  } finally { server.close(); }
}
