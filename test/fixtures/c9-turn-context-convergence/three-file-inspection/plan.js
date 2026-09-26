/**
 * Frozen synthetic implementation for the turn-context convergence smoke.
 *
 * A release plan is a small directed acyclic graph. Each step has a stable id,
 * a human-readable command, and zero or more prerequisite step ids. The
 * compiler below validates the external shape, rejects missing or cyclic
 * dependencies, and returns deterministic execution waves. Steps within a
 * wave may run concurrently; a later wave starts only after every earlier
 * prerequisite has completed.
 *
 * This is intentionally ordinary application code rather than George source.
 * Its repeated validation and traversal details give an inspecting model
 * enough material to explain a real implementation without needing a large
 * repository or dependency installation.
 */

const ID = /^[a-z][a-z0-9-]{0,47}$/;

function requireRecord(value, label) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError(`${label} must be an object`);
  }
  return value;
}

function requireText(value, label) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new TypeError(`${label} must be a non-empty string`);
  }
  return value.trim();
}

function normalizeStep(value, index) {
  const input = requireRecord(value, `steps[${index}]`);
  const id = requireText(input.id, `steps[${index}].id`);
  if (!ID.test(id)) throw new TypeError(`invalid step id: ${id}`);
  const command = requireText(input.command, `step ${id} command`);
  const rawNeeds = input.needs ?? [];
  if (!Array.isArray(rawNeeds)) throw new TypeError(`step ${id} needs must be an array`);
  const needs = rawNeeds.map((item, needIndex) => {
    const dependency = requireText(item, `step ${id} needs[${needIndex}]`);
    if (!ID.test(dependency)) throw new TypeError(`invalid dependency id: ${dependency}`);
    return dependency;
  });
  if (new Set(needs).size !== needs.length) throw new Error(`step ${id} repeats a dependency`);
  if (needs.includes(id)) throw new Error(`step ${id} cannot depend on itself`);
  const timeoutMs = input.timeoutMs ?? 30_000;
  if (!Number.isSafeInteger(timeoutMs) || timeoutMs < 100 || timeoutMs > 300_000) {
    throw new RangeError(`step ${id} timeoutMs must be between 100 and 300000`);
  }
  return Object.freeze({ id, command, needs: Object.freeze(needs), timeoutMs });
}

function insertReady(ready, id, order) {
  const rank = order.get(id);
  let index = 0;
  while (index < ready.length && order.get(ready[index]) < rank) index += 1;
  ready.splice(index, 0, id);
}

/**
 * Validate and compile an external release plan.
 *
 * @param {unknown} value untrusted JSON-compatible input
 * @returns {{name: string, steps: readonly object[], waves: readonly (readonly string[])[]}}
 */
export function compileReleasePlan(value) {
  const input = requireRecord(value, 'plan');
  const name = requireText(input.name, 'plan.name');
  if (!Array.isArray(input.steps) || input.steps.length === 0) {
    throw new TypeError('plan.steps must be a non-empty array');
  }
  if (input.steps.length > 64) throw new RangeError('plan.steps exceeds the 64-step limit');

  const steps = input.steps.map(normalizeStep);
  const byId = new Map();
  const order = new Map();
  for (const [index, step] of steps.entries()) {
    if (byId.has(step.id)) throw new Error(`duplicate step id: ${step.id}`);
    byId.set(step.id, step);
    order.set(step.id, index);
  }
  for (const step of steps) {
    for (const dependency of step.needs) {
      if (!byId.has(dependency)) throw new Error(`step ${step.id} needs missing step ${dependency}`);
    }
  }

  const remaining = new Map(steps.map((step) => [step.id, step.needs.length]));
  const dependents = new Map(steps.map((step) => [step.id, []]));
  for (const step of steps) {
    for (const dependency of step.needs) dependents.get(dependency).push(step.id);
  }

  let ready = steps.filter((step) => step.needs.length === 0).map((step) => step.id);
  const waves = [];
  let visited = 0;
  while (ready.length > 0) {
    const wave = Object.freeze([...ready]);
    waves.push(wave);
    visited += wave.length;
    const next = [];
    for (const completed of wave) {
      for (const dependent of dependents.get(completed)) {
        const count = remaining.get(dependent) - 1;
        remaining.set(dependent, count);
        if (count === 0) insertReady(next, dependent, order);
      }
    }
    ready = next;
  }
  if (visited !== steps.length) {
    const blocked = steps.filter((step) => remaining.get(step.id) > 0).map((step) => step.id);
    throw new Error(`dependency cycle involving: ${blocked.join(', ')}`);
  }

  return Object.freeze({
    name,
    steps: Object.freeze(steps),
    waves: Object.freeze(waves),
  });
}

/**
 * Return the transitive prerequisite ids for one compiled step. Results retain
 * source order so logs and user interfaces remain stable between executions.
 */
export function prerequisitesFor(plan, stepId) {
  const compiled = requireRecord(plan, 'compiled plan');
  if (!Array.isArray(compiled.steps)) throw new TypeError('compiled plan steps are unavailable');
  const steps = new Map(compiled.steps.map((step) => [step.id, step]));
  if (!steps.has(stepId)) throw new Error(`unknown step: ${stepId}`);
  const found = new Set();
  const visit = (id) => {
    for (const dependency of steps.get(id).needs) {
      if (found.has(dependency)) continue;
      found.add(dependency);
      visit(dependency);
    }
  };
  visit(stepId);
  return Object.freeze(compiled.steps.filter((step) => found.has(step.id)).map((step) => step.id));
}
