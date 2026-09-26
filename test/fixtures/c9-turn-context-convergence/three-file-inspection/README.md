# Release plan compiler inspection task

This frozen repository is a synthetic, non-George fixture for an ordinary-turn
inspection smoke. It models a small release-plan compiler with no third-party
dependencies. The fixture is deliberately large enough to require meaningful
file reads while remaining bounded and easy to audit.

The target implementation is `compileReleasePlan` in `plan.js`. It accepts an
untrusted JSON-compatible value describing named command steps and their
prerequisites. It returns an immutable normalized plan plus deterministic
execution waves. A wave contains steps whose prerequisites have all completed;
members of one wave may run concurrently. The companion `prerequisitesFor`
query returns transitive prerequisites in original source order.

Important behavior to explain:

- the input boundary rejects non-objects, blank names, empty step lists, and
  plans above the fixed 64-step safety limit;
- step ids use a small lowercase identifier grammar and must be unique;
- commands are trimmed, dependency arrays are copied, and timeouts are bounded;
- self-dependencies, repeated dependencies, and references to absent steps are
  rejected before graph traversal;
- the compiler uses dependency counts and reverse dependent edges to form
  deterministic topological waves;
- source order is retained for roots and for later steps becoming ready in the
  same wave;
- a traversal that cannot visit every step reports the remaining cyclic ids;
- returned plans, steps, dependency arrays, and waves are frozen, while the
  caller's input remains untouched;
- prerequisite queries walk the compiled graph and project results back into
  source order rather than traversal order.

The focused test file documents the contract with representative success,
ordering, transitive-query, malformed-input, graph-integrity, cycle, and input
immutability cases. It is intentionally a direct Node test rather than a test
framework fixture. The smoke is an inspection exercise only: it should explain
how the existing implementation meets this contract and should not edit files,
install packages, or run a benchmark.

## Example

Given roots `lint` and `unit`, a `bundle` step requiring both, a `docs` step
requiring `lint`, a `package` step requiring `bundle` and `docs`, and a final
`publish` step, the compiler emits these waves:

1. `lint`, `unit`
2. `bundle`, `docs`
3. `package`
4. `publish`

The ordering is intentional. It makes plan output, logs, and user-interface
rendering stable without sorting identifiers alphabetically. The compiler
therefore tracks original positions and inserts newly ready steps according to
those positions.

## Smoke prompt

The qualification harness should ask the model to inspect what it needs in this
repository and explain the target implementation, with attention to validation,
wave construction, cycle detection, stable ordering, and the tested contract.
The prompt must not state or imply a permanent product-level file-count limit.

## Non-goals

This fixture does not execute commands, schedule processes, persist state,
retry failed work, parse shell syntax, or model George permissions. It is not a
new version of either Phase 9 Express live-work instrument. It exists only to
exercise ordinary base-agent routing, bounded read-tool continuation, response
commit truth, and adaptive continuation-envelope evidence if promotion occurs.

The fixture contents are frozen by SHA-256 assertions in deterministic tests.
Changing prose, whitespace, implementation, or tests requires an explicit new
qualification decision and updated evidence; a P4 smoke must not silently
change the repository shape it is meant to qualify.

For grounding, a useful explanation should connect the public contract to the
specific validation helpers, the `remaining` dependency counts, the reverse
`dependents` map, the ready-wave loop, and the final visited-count cycle check.
It should also reconcile those mechanics with the focused assertions instead
of merely paraphrasing this README. No particular prose style is required.
The evidence should stay concise.
