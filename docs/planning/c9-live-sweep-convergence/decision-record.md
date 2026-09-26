# Correction 9 Decision Record — Live Sweep Convergence

Status: **APPROVED DIRECTION — ACTIVE PHASE 9 CORRECTION**

Date: 2026-09-26

Package boundary: `0.9.10` unchanged.

Starting repository HEAD:
`12b1b81c332324566ab2ec409b3326c286009ccf`.

Historical production candidate before this correction:
`25d51a93d229e9b8cc76f56eb4b7b9afae1a5723`.

Authority and preserved evidence:
- `docs/tasks/c9-turn-context-live-qualification/closeout.md`;
- `docs/tasks/c9-turn-context-live-qualification/P1-live-evidence.md`;
- `docs/tasks/c9-turn-context-live-qualification/evidence/**`;
- `docs/tasks/c9-turn-context-convergence/closeout.md`;
- current Phase 9 qualification/stability/workflow authority.

## Problem

The current Phase 9 qualification strategy is discovering one functional defect at a time.

The latest live follow-up established:
- loaded runtime provenance Green;
- ordinary greeting Green;
- synthetic three-file inspection Not Green;
- fresh Gate A Not Run;
- B2 Not Run;
- C2 Not Run.

The three-file workload successfully read all three required files, used one context assembly, remained inside ordinary without exhaustion, and had zero human intervention. It nevertheless ended after three provider attempts/rounds and nine requested tools with no final answer. The terminal sequence was `provider.error -> turn.failed`.

The artifact retained the fact that a provider error occurred but not its bounded diagnostic code/message. Therefore the first discovered failure is not fully actionable, while the current fail-fast gate prevented collecting evidence from the remaining workloads.

This creates two throughput problems:
1. a functional failure suppresses potentially useful evidence from independent isolated workloads;
2. failure artifacts can preserve state/result categories without retaining enough bounded diagnostic detail to repair the failure efficiently.

Phase 9 should discover the complete safe failure surface before starting the next repair wave.

## Decision — full diagnostic sweeps after common validity gates

Qualification now distinguishes **common validity/safety gates** from **functional workload outcomes**.

Common validity/safety failures still abort the sweep before live execution. Examples:
- supported runtime/model unavailable;
- required REST-visible runtime provenance missing or materially invalid;
- candidate/source state cannot be identified;
- qualification fixture/instrument digest mismatch;
- typecheck or core deterministic safety/permission/recovery invariant failure that makes later evidence unreliable;
- evidence writer unable to persist bounded attempt/trace truth;
- target application is not runnable.

After those common gates are Green, isolated functional workloads are executed **all the way through the declared sweep exactly once each**, even when an earlier workload is Not Green.

For the current Phase 9 sweep the workload set is:
1. ordinary greeting;
2. synthetic three-file inspection;
3. frozen Gate A;
4. `greenfield-express-v2` Gate B2;
5. `existing-express-feature-v2` Gate C2.

Each workload uses a fresh isolated workspace/session/fixture instance appropriate to that instrument so one failed workload cannot corrupt another.

No repair occurs between workloads in the same diagnostic sweep.

## Decision — observed result is distinct from qualifying status

Every workload records two separate dimensions:

### Observed result

The workload actually ran and is classified:
- Green;
- Not Green;
- Evidence Gap;
- Not Run only when a common validity/safety abort prevents execution.

### Qualification status

A workload may be:
- **qualifying** — all upstream qualification prerequisites required by the Phase 9 acceptance chain were Green;
- **diagnostic-only** — the workload ran after an upstream functional prerequisite failed.

Example:
- greeting Green;
- three-file Not Green;
- Gate A observed Green;
- B2 observed Not Green;
- C2 observed Green.

In that case Gate A/B2/C2 are useful diagnostic observations, but they do not satisfy Phase 9 qualification because the upstream three-file prerequisite was Not Green.

A post-repair sweep with the entire required chain Green is still required for Phase 9 owner closeout.

This preserves gate semantics without suppressing diagnostics.

## Decision — no repeated same-candidate fishing

A workload is attempted once per declared diagnostic sweep.

A failed workload is not rerun repeatedly against the same production state merely to obtain a pass.

A fresh sweep becomes legitimate after an approved repair wave changes the relevant production/test/qualification implementation.

Historical failures remain immutable.

## Decision — diagnostic evidence must preserve bounded failure causes

Before the next full sweep, repair the qualification evidence boundary so failed workloads remain diagnosable.

The durable sanitized evidence must preserve bounded/redacted diagnostics for:
- `provider.error`;
- `turn.failed`;
- `turn.cancelled`;
- `tool.failed`;
- validation failures;
- harness/observer failures separately from authoritative application failures.

At minimum, when present and safe, retain:
- finite failure category;
- bounded code;
- bounded message/reason;
- HTTP/provider status when already normalized by the provider boundary;
- associated turn/call identity.

Do not persist:
- raw provider wire/SSE payload;
- unrestricted provider body;
- model private reasoning;
- full file/write/patch bodies;
- secrets/environment dumps;
- unbounded logs.

The current live-work artifact format declares schema version 1. Structural changes to the artifact envelope/trace should use **artifact schema version 2** rather than silently changing historical v1 semantics. Historical v1 artifacts remain immutable and readable.

Artifact schema versioning is independent from live-work instrument versioning. This correction does **not** create `greenfield-express-v3` or `existing-express-feature-v3`.

## Decision — consolidated failure ledger

Each full sweep produces one bounded consolidated failure ledger.

The ledger contains one entry for every deterministic/broad/live observation that is Not Green or Evidence Gap, including retained known failures.

Each entry records, where applicable:
- stable workload/test identity;
- observed result;
- qualifying or diagnostic-only status;
- failure class/category;
- bounded diagnostic code/message;
- failed tool/validation identity;
- provider attempts/rounds;
- provider input/output usage;
- tool-call count;
- selected context profile and promotions;
- TaskState/StackState terminal status;
- hidden acceptance;
- intervention count;
- classification such as new, retained, intermittent, environment-only, or unresolved;
- paths/digests of bounded source evidence;
- candidate defect cluster for the repair wave.

The ledger must include:
- the five currently retained OpenTUI renderer failures when still observed;
- native real-TTY skip/Evidence Gap;
- the previously observed intermittent sandbox/process test failure if observed again or still relevant as historical characterization;
- every failed live workload in the sweep.

A summary may group failures into repair clusters, but individual evidence identities remain auditable.

## Decision — repair waves follow observation, not speculation

After the first full diagnostic sweep, repair the complete evidenced wave in bounded clusters.

Expected repair ordering:

1. **Agent/provider/context/tool/live-work cluster**
   - provider-stream/terminal failure handling;
   - three-file convergence;
   - structured Gate A/B2/C2 defects;
   - context/tool-loop failures;
   - qualification evidence defects.

2. **TUI/test-stability cluster**
   - retained OpenTUI renderer failures;
   - sandbox/process intermittency;
   - newly exposed presentation/integration failures.

Do not change frozen workload requirements merely to make results pass.

Do not "fix" timing flakes by arbitrary timeout inflation without establishing the underlying scheduling/lifecycle cause.

Every confirmed repaired defect class gets a permanent executable regression guard.

If a cluster contains no actionable failure, its repair step may be a no-op verification rather than invented change.

## Decision — post-repair full sweep

After the repair wave, run the complete common preflight and live workload matrix again.

The post-repair sweep also does **not** fail-fast on functional workload results.

It records all remaining failures before closeout.

Phase 9 readiness still requires the entire qualifying chain Green:
- hard deterministic preflight Green;
- no blocking regression;
- greeting Green;
- three-file Green;
- Gate A Green;
- B2 Green;
- C2 Green;
- no blocking evidence gap.

The aggregate broad suite should also be driven toward genuine Green during this polish wave rather than carrying known OpenTUI failures indefinitely, but historical failures remain historical truth.

## Preserved boundaries

This correction must not:
- rewrite prior attempts or closeouts;
- create v3 live-work task instruments solely because sweep orchestration changes;
- weaken permissions, recovery, SHA/framing, workspace containment, or context safety;
- retune LM Studio/Qwen merely to obtain a pass;
- treat diagnostic-only downstream success as satisfying upstream-gated Phase 9 acceptance;
- owner-close Phase 9 inside the correction;
- open Phase 10.

## Recommended implementation stack

### P1 — evidence diagnostics + sweep infrastructure
`Sol High`.

Repair bounded failure evidence, version artifact schema if needed, implement non-short-circuit full-sweep orchestration/classification, and add permanent deterministic coverage.

Do not repair the three-file production failure yet.

### P2 — complete diagnostic sweep
`Sol Medium`.

Run the complete deterministic/broad/live matrix once without functional fail-fast. Produce the consolidated failure ledger. No production repairs.

### P3 — agent/provider/context repair wave
`Sol High`.

Repair all clearly evidenced agent/provider/tool/context/structured-task/qualification defects from the P2 ledger with permanent regression guards.

### P4 — UI/test-stability repair wave
`Sol High` by default; may be reduced to Medium if P2 proves only narrow test-fixture work.

Repair evidenced OpenTUI/test-stability/sandbox intermittency defects as one bounded cluster. No invented work if the ledger contains no actionable issue.

### P5 — complete post-repair qualification sweep
`Sol Medium`.

Run all deterministic/broad/live workloads again without functional fail-fast and record every remaining failure.

### P6 — closeout
`Sol Medium`.

Evidence-only audit. Do not repair or rerun.

Package remains exactly `0.9.10` unless a separately approved versioning decision changes it.
