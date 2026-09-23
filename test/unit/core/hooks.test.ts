import assert from 'node:assert/strict';
import test from 'node:test';

import { GeorgeError, HookRegistry } from '../../../src/core/index.ts';

test('hooks are ordered, bounded, explicit, and failure-isolated', async () => {
  const hooks = new HookRegistry();
  const order: string[] = [];
  hooks.register({ id: 'later', event: 'turn.started', priority: 2, kind: 'in-process', run: () => { order.push('later'); return { message: 'ok' }; } });
  hooks.register({ id: 'first', event: 'turn.started', priority: -1, kind: 'in-process', run: () => { order.push('first'); throw new Error('broken'); } });
  hooks.register({ id: 'middle', event: 'turn.started', kind: 'in-process', run: () => { order.push('middle'); } });
  assert.throws(() => hooks.register({ id: 'middle', event: 'turn.started', kind: 'in-process', run: () => {} }), GeorgeError);
  hooks.setEnabled('later', false);
  const results = await hooks.dispatch({ name: 'turn.started', sessionId: 's', turnId: 't' });
  assert.deepEqual(order, ['first', 'middle']);
  assert.deepEqual(results.map((item) => [item.id, item.status]), [['first', 'failed'], ['middle', 'succeeded']]);
  assert.throws(() => hooks.setEnabled('missing', true), GeorgeError);
});

test('process hook IO is bounded and malformed output is evidence, not authority', async () => {
  const hooks = new HookRegistry();
  hooks.register({ id: 'process', event: 'provider.responded', configuration: { mode: 'safe' }, kind: 'process', executable: 'node' });
  let input = '';
  const malformed = await hooks.dispatch({ name: 'provider.responded', sessionId: 's', provider: { completed: true, hadToolCalls: true } }, async (_hook, value) => {
    input = value;
    return { outcome: 'completed', stdout: '{not json' };
  });
  assert.match(input, /"hadToolCalls":true/);
  assert.doesNotMatch(input, /assistant|text|arguments/);
  assert.equal(malformed[0]?.status, 'failed');
  const timedOut = await hooks.dispatch({ name: 'provider.responded', sessionId: 's' }, async () => ({ outcome: 'timed_out', stdout: '' }));
  assert.equal(timedOut[0]?.status, 'timed_out');
});

test('cancelled process hooks are reported without invoking their executable', async () => {
  const hooks = new HookRegistry();
  hooks.register({ id: 'cancelled-process', event: 'turn.completed', kind: 'process', executable: 'node' });
  const controller = new AbortController();
  controller.abort('stop');
  let invoked = false;
  const results = await hooks.dispatch({ name: 'turn.completed', sessionId: 's' }, async () => {
    invoked = true;
    return { outcome: 'completed', stdout: '' };
  }, controller.signal);
  assert.equal(invoked, false);
  assert.equal(results[0]?.status, 'cancelled');
});
