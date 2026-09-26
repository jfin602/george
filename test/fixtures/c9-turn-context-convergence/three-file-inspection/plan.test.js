import assert from 'node:assert/strict';
import test from 'node:test';

import { compileReleasePlan, prerequisitesFor } from './plan.js';

const representativePlan = () => ({
  name: 'weekly release',
  steps: [
    { id: 'lint', command: 'npm run lint' },
    { id: 'unit', command: 'npm test' },
    { id: 'bundle', command: 'npm run build', needs: ['lint', 'unit'], timeoutMs: 90_000 },
    { id: 'docs', command: 'npm run docs', needs: ['lint'] },
    { id: 'package', command: 'npm pack', needs: ['bundle', 'docs'] },
    { id: 'publish', command: 'npm publish', needs: ['package'] },
  ],
});

test('compiles stable parallel waves and normalizes values', () => {
  const plan = representativePlan();
  plan.name = '  weekly release  ';
  plan.steps[0].command = '  npm run lint  ';
  const compiled = compileReleasePlan(plan);

  assert.equal(compiled.name, 'weekly release');
  assert.equal(compiled.steps[0].command, 'npm run lint');
  assert.equal(compiled.steps[0].timeoutMs, 30_000);
  assert.equal(compiled.steps[2].timeoutMs, 90_000);
  assert.deepEqual(compiled.waves, [
    ['lint', 'unit'],
    ['bundle', 'docs'],
    ['package'],
    ['publish'],
  ]);
  assert.equal(Object.isFrozen(compiled), true);
  assert.equal(Object.isFrozen(compiled.steps), true);
  assert.equal(Object.isFrozen(compiled.waves[0]), true);
});

test('preserves source order within every newly ready wave', () => {
  const compiled = compileReleasePlan({
    name: 'ordering',
    steps: [
      { id: 'root-b', command: 'b' },
      { id: 'root-a', command: 'a' },
      { id: 'late-b', command: 'late b', needs: ['root-b'] },
      { id: 'late-a', command: 'late a', needs: ['root-a'] },
    ],
  });
  assert.deepEqual(compiled.waves, [['root-b', 'root-a'], ['late-b', 'late-a']]);
});

test('reports direct and transitive prerequisites in source order', () => {
  const compiled = compileReleasePlan(representativePlan());
  assert.deepEqual(prerequisitesFor(compiled, 'lint'), []);
  assert.deepEqual(prerequisitesFor(compiled, 'bundle'), ['lint', 'unit']);
  assert.deepEqual(prerequisitesFor(compiled, 'publish'), ['lint', 'unit', 'bundle', 'docs', 'package']);
  assert.throws(() => prerequisitesFor(compiled, 'missing'), /unknown step: missing/);
});

test('rejects malformed top-level values', () => {
  assert.throws(() => compileReleasePlan(null), /plan must be an object/);
  assert.throws(() => compileReleasePlan([]), /plan must be an object/);
  assert.throws(() => compileReleasePlan({ name: 'x' }), /non-empty array/);
  assert.throws(() => compileReleasePlan({ name: 'x', steps: [] }), /non-empty array/);
  assert.throws(() => compileReleasePlan({ name: ' ', steps: [{}] }), /non-empty string/);
  assert.throws(() => compileReleasePlan({ name: 'x', steps: Array.from({ length: 65 }, (_, index) => ({ id: `s${index}`, command: 'x' })) }), /64-step limit/);
});

test('rejects malformed step fields', () => {
  const one = (step) => compileReleasePlan({ name: 'invalid', steps: [step] });
  assert.throws(() => one(null), /steps\[0\] must be an object/);
  assert.throws(() => one({ id: '', command: 'x' }), /non-empty string/);
  assert.throws(() => one({ id: 'UPPER', command: 'x' }), /invalid step id/);
  assert.throws(() => one({ id: 'ok', command: '' }), /non-empty string/);
  assert.throws(() => one({ id: 'ok', command: 'x', needs: 'root' }), /must be an array/);
  assert.throws(() => one({ id: 'ok', command: 'x', needs: ['UPPER'] }), /invalid dependency id/);
  assert.throws(() => one({ id: 'ok', command: 'x', needs: ['ok'] }), /cannot depend on itself/);
  assert.throws(() => one({ id: 'ok', command: 'x', timeoutMs: 99 }), /between 100 and 300000/);
  assert.throws(() => one({ id: 'ok', command: 'x', timeoutMs: 300_001 }), /between 100 and 300000/);
  assert.throws(() => one({ id: 'ok', command: 'x', timeoutMs: 100.5 }), /between 100 and 300000/);
});

test('rejects duplicate ids, repeated prerequisites, and missing dependencies', () => {
  assert.throws(() => compileReleasePlan({
    name: 'duplicate',
    steps: [{ id: 'same', command: 'one' }, { id: 'same', command: 'two' }],
  }), /duplicate step id: same/);
  assert.throws(() => compileReleasePlan({
    name: 'repeat',
    steps: [{ id: 'root', command: 'one' }, { id: 'next', command: 'two', needs: ['root', 'root'] }],
  }), /repeats a dependency/);
  assert.throws(() => compileReleasePlan({
    name: 'missing',
    steps: [{ id: 'next', command: 'two', needs: ['root'] }],
  }), /needs missing step root/);
});

test('detects cycles after retaining every acyclic wave', () => {
  assert.throws(() => compileReleasePlan({
    name: 'cycle',
    steps: [
      { id: 'independent', command: 'safe' },
      { id: 'alpha', command: 'a', needs: ['charlie'] },
      { id: 'bravo', command: 'b', needs: ['alpha'] },
      { id: 'charlie', command: 'c', needs: ['bravo'] },
    ],
  }), /dependency cycle involving: alpha, bravo, charlie/);
});

test('does not mutate caller-owned input while compiling', () => {
  const input = representativePlan();
  const before = structuredClone(input);
  compileReleasePlan(input);
  assert.deepEqual(input, before);
  assert.equal(Object.isFrozen(input), false);
  assert.equal(Object.isFrozen(input.steps), false);
});
