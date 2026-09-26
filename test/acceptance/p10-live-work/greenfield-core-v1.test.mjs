import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';

export async function acceptGreenfieldCore(workspace) {
  const { normalizeTitle } = await import(pathToFileURL(`${workspace}/src/title.js`).href);
  const { createTaskStore } = await import(pathToFileURL(`${workspace}/src/task-store.js`).href);
  assert.equal(normalizeTitle('  Ship   it  '), 'Ship it');
  assert.throws(() => normalizeTitle('   '));
  const store = createTaskStore();
  const first = store.add('  Ship   it  ');
  const second = store.add('Review');
  assert.deepEqual(first, { id: 1, title: 'Ship it', done: false });
  assert.deepEqual(second, { id: 2, title: 'Review', done: false });
  try { first.title = 'mutated outside'; } catch { /* Frozen return values are also valid isolation. */ }
  assert.deepEqual(store.complete(1), { id: 1, title: 'Ship it', done: true });
  assert.deepEqual(store.list(), [{ id: 1, title: 'Ship it', done: true }, { id: 2, title: 'Review', done: false }]);
  assert.throws(() => store.complete(999));
}
