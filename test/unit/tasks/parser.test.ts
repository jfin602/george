import assert from 'node:assert/strict';
import test from 'node:test';

import {
  TaskPromptParseError,
  parseLiteralValidationCommand,
  parseTaskPrompt,
} from '../../../src/tasks/index.ts';

const minimal = `GEORGE TASK FORMAT: 1

TASK: P1 — Parse prompts
KIND: implementation

GOAL

Parse task prompts without executing them.

REQUIREMENTS

- R1: Parse supported input.

WORKFLOW

W1 — Add parser
Covers: R1
Depends on: none

VALIDATION

V1 — Unit tests
Covers: R1
Run: npm test

STOP CONDITIONS

- S1: Stop when validation fails.
`;

function invalid(input: string): void {
  assert.throws(() => parseTaskPrompt(input), (error: unknown) => error instanceof TaskPromptParseError && error.diagnostics.length === 1 && error.message.length <= 520);
}

test('ordinary chat remains distinct while a complete task preserves authored order in an immutable domain model', () => {
  assert.deepEqual(parseTaskPrompt('Please explain this repository.'), { kind: 'ordinary' });
  const parsed = parseTaskPrompt(`${minimal}
STACK: p9

READ FIRST

- REQUIRED: BOOT.md
- OPTIONAL: docs/background.md

INSPECT

- current parser conventions

INVARIANTS

- I1: Parsing has no side effects.

DELIVERABLES

- D1: Parser module.

NON-GOALS

- Execute the task.

PERMISSIONS

- Workspace: autonomous
- Outside workspace: reject
- Network: ask
- Remote mutation: ask

VERSIONING

Package version 0.9.1.

EVIDENCE

Focused tests pass.
`);
  assert.equal(parsed.kind, 'structured');
  if (parsed.kind !== 'structured') return;
  assert.equal(parsed.task.stack, 'p9');
  assert.deepEqual(parsed.task.task, { ordinal: 1, title: 'Parse prompts' });
  assert.deepEqual(parsed.task.readFirst.map((entry) => entry.source), ['BOOT.md', 'docs/background.md']);
  assert.deepEqual(parsed.task.workflow[0]?.dependsOn, []);
  assert.deepEqual(parsed.task.validations[0]?.command, { kind: 'literal', executable: 'npm', arguments: ['test'] });
  assert.deepEqual(parsed.task.permissions, { workspace: 'autonomous', outsideWorkspace: 'reject', network: 'ask', remoteMutation: 'ask' });
  assert.ok(Object.isFrozen(parsed.task));
  assert.ok(Object.isFrozen(parsed.task.requirements));
});

test('parser rejects malformed structured prompts deterministically before any execution layer exists', () => {
  invalid(minimal.replace('GEORGE TASK FORMAT: 1', 'GEORGE TASK FORMAT: 2'));
  invalid(minimal.replace('KIND: implementation\n', ''));
  invalid(minimal.replace('STOP CONDITIONS', 'UNKNOWN SECTION'));
  invalid(minimal.replace('KIND: implementation', 'KIND: implementation\nKIND: correction'));
  invalid(minimal.replace('- R1: Parse supported input.', '- R1: Parse supported input.\n- R1: Duplicate.'));
  invalid(minimal.replace('Covers: R1', 'Covers: R9'));
  invalid(minimal.replace('Depends on: none', 'Depends on: W2').replace('V1 — Unit tests', 'W2 — Cycle\nCovers: R1\nDepends on: W1\n\nV1 — Unit tests'));
  invalid(minimal.replace('Run: npm test', 'Run: DISCOVER'));
  invalid(minimal.replace('STOP CONDITIONS', 'PERMISSIONS\n\n- Network: allow\n\nSTOP CONDITIONS'));
});

test('literal validation commands produce shell-free argv and reject shell syntax', () => {
  assert.deepEqual(parseLiteralValidationCommand(`node --test "test/unit/tasks/parser.test.ts"`), { kind: 'literal', executable: 'node', arguments: ['--test', 'test/unit/tasks/parser.test.ts'] });
  for (const command of ['npm test | tee out', 'echo $(whoami)', 'npm test; rm x', 'npm test > out', 'npm test && echo no', 'node -e "unterminated', 'FOO=bar npm test', 'npm test\0bad']) {
    assert.throws(() => parseLiteralValidationCommand(command), TaskPromptParseError);
  }
});

test('DISCOVER requires bounded Scope and validation/workflow ordering stays authored', () => {
  const prompt = minimal
    .replace('W1 — Add parser\nCovers: R1\nDepends on: none', 'W1 — Inspect\nCovers: R1\nDepends on: none\n\nW2 — Add parser\nCovers: R1\nDepends on: W1')
    .replace('V1 — Unit tests\nCovers: R1\nRun: npm test', 'V1 — Focused\nCovers: R1\nRun: DISCOVER\nScope: test/unit/tasks');
  const parsed = parseTaskPrompt(prompt);
  assert.equal(parsed.kind, 'structured');
  if (parsed.kind === 'structured') {
    assert.deepEqual(parsed.task.workflow.map((work) => work.id), ['W1', 'W2']);
    assert.deepEqual(parsed.task.validations[0]?.command, { kind: 'discover', scope: 'test/unit/tasks' });
  }
  invalid(prompt.replace('Scope: test/unit/tasks', 'Scope: '));
});
