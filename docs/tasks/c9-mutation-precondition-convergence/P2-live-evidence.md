# c9 mutation-precondition convergence P2 live evidence

Status: **DETERMINISTIC PRE-GATE NOT GREEN; LIVE GATES NOT RUN**

Date: 2026-09-25

Package: `0.9.10` (unchanged)

Pre-task HEAD and exact P1 production candidate: `04405570b92680e6297b48391a7d0bdf0aa8ed5e`

This is qualification evidence only. No production code, live-work fixture, task, metadata, acceptance, runtime/context/convergence/retry limit, or package version was changed.

## Deterministic pre-gate

The correction-specific affected floor ran under Node `v26.10.0` and npm `11.19.1`. It passed `72/72`, including:

- missing existing-file SHA failure, explicit `read_file.sha256`, and successful explicit-precondition retry;
- missing-parent pre-dispatch failure as terminal per-call evidence;
- `create_directory` path safety, chained creation, idempotence, collision, cancellation, permission, Workspace Autonomous, recovery, and nested-write behavior;
- same-response terminal tool evidence;
- structured implementation/correction tool exposure;
- existing SHA, text-framing, mutation-intent authority, frozen Gate A replay, StackState, task state, budget, Phase 5 recovery, Phase 9 integration, and v1/v2 instrument immutability floors.

Additional results:

| Check | Result |
| --- | --- |
| `npm run typecheck` | **Green** |
| `npm run test:runner` | **Green: 90/90 passed** |
| Package version | **Green: exactly `0.9.10`** |
| Root `package-lock.json` | **Green: absent** |
| Initial `git diff --check` | **Green** |
| `npm test` under supported Node 26 | **Not Green: 383 passed, 5 failed, 1 skipped, 389 total** |

The five broad-suite failures were all in `test/unit/tui/app.test.ts`:

1. `test renderer shows identity, configuration, streamed text, and read-only activity`;
2. `Transcript and Task pages switch without changing session state or the composer draft`;
3. `committed final answers reveal progressively without delaying canonical durability, and cancellation stops the reveal`;
4. `streaming does not overwrite draft input and returns the composer to ready state`;
5. `test renderer presents normalized approvals and allow, deny, and Esc keep the TUI usable`.

The skipped case was the native OpenTUI real-terminal qualification. The failing assertions and timeouts are retained as observed; they are not relabeled Green or repaired in this evidence-only phase.

The P2 contract requires the deterministic pre-gate, including broad `npm test` on supported Node 26, to be Green before live model work. Therefore qualification stopped before Gate A.

## Runtime provenance

The deterministic run used Node `v26.10.0` and npm `11.19.1`. The configured project model remains `qwen3-coder-30b-a3b-instruct@q4_k_m`.

No live attempt began, so no official attempt consumed the REST-visible runtime controls. The required manual reminder remains:

`MANUAL CHECK: LM Studio GPU Offload must show 26`

UI-only GPU Offload 26 remains an unconfirmed controlled-latency Evidence Gap, not a functional result.

## Historical evidence preserved

- The prior exact Gate A from `c9-mutation-intent-authority` remains historical **Green**.
- Historical v1 Not Green attempts remain unchanged.
- The first official `greenfield-express-v2` B2 attempt remains historical **Not Green**.
- No historical evidence document or live artifact was rewritten.

## Live gates

### Gate A — not run

Not run because the deterministic pre-gate was Not Green. No official attempt, model request, tool call, approval, mutation, validation, hidden acceptance, budget, timing, intervention, or safe live artifact was produced.

### Gate B2 — not run by gate

Not run because fresh Gate A was not reached. The exact `greenfield-express-v2` instrument and its dependency prerequisite remain unspent.

### Gate C2 — not run by gate

Not run because B2 was not reached. The exact `existing-express-feature-v2` instrument and its dependency/network prerequisite remain unspent.

## Committed safe evidence

No gate was reached, so no `evidence/gate-a/`, `evidence/gate-b2/`, or `evidence/gate-c2/` attempt/trace JSON exists or is claimed. There are consequently no live evidence JSON SHA-256 values to record.

## Evidence matrix

| Evidence | State | Basis |
| --- | --- | --- |
| Exact P1 correction-specific floor | **Green** | `72/72` passed under Node 26. |
| Typecheck | **Green** | `npm run typecheck` passed. |
| Phase runner | **Green** | `90/90` passed. |
| Package / root lockfile / initial diff hygiene | **Green** | Package stayed `0.9.10`, root lockfile absent, initial `git diff --check` passed. |
| Broad supported-Node test suite | **Not Green** | `383/389` passed, 5 OpenTUI test-renderer failures, 1 native-terminal skip. |
| REST-visible live runtime controls | **Not Run** | Live qualification did not begin. |
| GPU Offload 26 | **Evidence Gap** | UI-only control was not independently confirmed. |
| Fresh Gate A | **Not Run** | Required deterministic pre-gate was Not Green. |
| Gate B2 | **Not Run by gate** | Fresh Gate A was not reached. |
| Gate C2 | **Not Run by gate** | B2 was not reached. |
| Overall correction qualification | **Not Green** | Mandatory deterministic pre-gate and live sequence are not Green. |

Phase 9 remains open. This evidence does not owner-close Phase 9 or open Phase 10.
