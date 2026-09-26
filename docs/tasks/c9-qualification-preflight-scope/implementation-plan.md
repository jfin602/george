# c9-qualification-preflight-scope Implementation Plan

Status: READY FOR PROMPT EXECUTION

Correction: `c9-qualification-preflight-scope`  
Roadmap phase: 9  
Required unchanged package version: `0.9.10`

## Authority

Read:
- `BOOT.md`;
- `AGENTS.md`;
- workflow/stability/Phase 9 qualification authority;
- `docs/planning/c9-qualification-preflight-scope/{decision-record,qualification-plan}.md`;
- `docs/tasks/c9-mutation-precondition-convergence/{P2-live-evidence,closeout}.md`;
- `docs/tasks/c9-greenfield-instrument-alignment/P2-live-evidence.md`;
- current qualification modules/tests;
- current phase-runner grammar/model mappings.

## P1 — scoped preflight policy and controlled baseline comparison

### A. Qualification-layer classifier

Add the smallest pure qualification-layer helper needed to prevent broad aggregate state from being conflated with regression delta.

Preferred placement:
- `src/qualification/preflight.ts`;
- export from `src/qualification/index.ts`.

Keep it presentation/provider/tool independent.

Suggested bounded shapes may include:
- hard gate state;
- broad run summary with commit/runtime/command/totals/failures/skips;
- failure identity + category + bounded signature;
- result with aggregate broad state, regression delta, eligibility, reasons.

Do not build a test-runner parser unless necessary. The classifier can operate on already-normalized bounded summaries.

### B. Classifier semantics

At minimum:
- candidate aggregate is Green only when candidate broad failures are empty and no required skips/gaps apply;
- candidate aggregate Not Green remains Not Green regardless of regression delta;
- unchanged baseline failure/skip identities with materially equivalent categories/signatures => delta Green;
- new candidate failure => delta Not Green;
- baseline pass/absent -> candidate skip/fail => delta Not Green;
- materially worsened retained failure => delta Not Green;
- missing/non-equivalent baseline evidence => delta Evidence Gap;
- hard preflight Not Green => ineligible;
- hard Green + delta Green => eligible even if aggregate broad remains Not Green;
- Evidence Gap/Not Green delta => ineligible.

Use explicit finite states; do not encode evidence truth in booleans only.

### C. Permanent tests

Create focused qualification tests proving all semantics above, including the key regression:

`hard Green + same five retained failures + one retained skip -> aggregate Not Green, delta Green, eligible`.

Also prove:
- counts alone are not enough when identities differ;
- bounded signatures do not store raw/unbounded logs;
- ordering of failure entries does not change classification.

### D. Controlled broad comparison

Compare:
- baseline `d7e565ccb0e694166e6fe4346b56f4746f0697f1`;
- production candidate `04405570b92680e6297b48391a7d0bdf0aa8ed5e`.

Do not move active HEAD and do not use `git checkout` or `git switch`.

Preferred approach:
1. verify both commits exist and package/dependency identity is compatible;
2. materialize each immutable tree into an isolated temp directory with read-only `git archive`;
3. use the same Node/npm binary and exact `npm test` command;
4. reuse the same installed dependency tree for both only after dependency identity is proven equal;
5. preserve the same non-TTY/environment conditions;
6. clean temporary snapshots afterward.

If equivalent dependency/runtime execution cannot be established, record Evidence Gap; do not fake a comparison.

### E. Bounded evidence

Create:
- `docs/tasks/c9-qualification-preflight-scope/evidence/broad-baseline.json`;
- `.../broad-candidate.json`;
- `.../broad-delta.json`;
- `docs/tasks/c9-qualification-preflight-scope/P1-preflight-evidence.md`.

JSON must be bounded/sanitized and contain no raw logs, secrets, environment dump, file bodies, or workspace copies.

Each broad summary records:
- commit;
- Node/npm;
- command;
- total/pass/fail/skip;
- exact failed/skipped test names;
- bounded failure category/signature.

Delta evidence records:
- classifier result;
- matched retained failures;
- new/worsened/missing evidence if any;
- live eligibility.

Record SHA-256 of committed JSON in P1 evidence.

### F. P1 validation

Require:
- new preflight classifier tests;
- qualification/live-work tests;
- current mutation-precondition focused/inherited floor;
- Phase 9 integration;
- typecheck;
- runner;
- `git diff --check`;
- package `0.9.10`;
- no root lockfile.

Do not run Gate A/B2/C2 in P1.

## P2 — fresh live qualification

P2 changes no production behavior.

### A. Read P1 preflight evidence

If P1 broad regression delta is Not Green or Evidence Gap:
- rerun enough current hard checks to verify repository health;
- create P2 evidence stating live gates Not Run;
- do not spend Gate A/B2/C2.

### B. Current hard preflight

Require Green:
- qualification classifier tests;
- mutation-precondition focused floor;
- expanded inherited c9 affected floor;
- Phase 9 integration;
- frozen Gate A deterministic replay;
- v1/v2 immutability;
- typecheck;
- runner;
- diff/version/root-lockfile hygiene.

### C. Current broad characterization

Run current `npm test` under supported Node 26.

Keep its aggregate state truthful.

Re-evaluate it against the P1 controlled baseline/candidate evidence using the classifier. New/worsened failures block live work.

Do not require aggregate broad Green when delta is Green.

### D. Runtime provenance

Use pinned:
`qwen3-coder-30b-a3b-instruct@q4_k_m`

Supported Node 26.

Capture the existing REST-visible controls and print:
`MANUAL CHECK: LM Studio GPU Offload must show 26`

No retuning.

### E. Gate A

One fresh official attempt only.

Unchanged frozen fixture/helper/validation/acceptance.

Require exact 60-byte edit, V1 Green, completed/verified TaskState, hidden acceptance Green, zero intervention, no exhaustion, <=10 model-requested calls, <=10 logical rounds.

If Not Green: stop.

### F. Gate B2

Only after Gate A Green.

One fresh official `greenfield-express-v2` attempt.

Use unchanged instrument/digest/acceptance/prerequisite and production stack service.

Require P1/P2/P3 strict completion, declared validations Green, completed StackState, hidden acceptance Green, zero intervention, no exhaustion.

If Not Green: stop and leave C2 unspent.

### G. Gate C2

Only after B2 Green.

One official `existing-express-feature-v2` attempt.

Require focused/broad validation Green, baseline preservation, completed/verified TaskState, hidden acceptance Green, zero intervention, no exhaustion.

### H. Committed live evidence

Create:
- `docs/tasks/c9-qualification-preflight-scope/P2-live-evidence.md`;
- `evidence/runtime.json`;
- `evidence/gate-a/{attempt,trace}.json` if reached;
- `evidence/gate-b2/{attempt,trace}.json` if reached;
- `evidence/gate-c2/{attempt,trace}.json` if reached.

Use repository-defined sanitized live-work artifact schema.

Record SHA-256 for all committed evidence JSON.

Never commit raw provider streams, write/patch bodies, secrets/environment, dependency workspaces, node_modules, or unbounded output.

## P3 — closeout

Create:
`docs/tasks/c9-qualification-preflight-scope/closeout.md`.

Audit separately:
- Qualification Policy Guard Qualified;
- Controlled Broad Baseline Comparison Qualified;
- Hard Preflight Qualified;
- Aggregate Broad Suite State;
- Broad Regression Delta;
- Live Eligibility;
- Fresh Gate A;
- B2;
- C2;
- Evidence Auditability;
- Historical Evidence Preserved;
- Overall correction;
- Phase 9 Ready For Owner Closeout.

Phase 9 ready = Yes only if:
- classifier/policy guard Green;
- controlled comparison sufficient;
- hard preflight Green;
- broad regression delta Green;
- A Green;
- B2 Green;
- C2 Green;
- no new blocking regression.

Aggregate broad Not Green remains Not Green and does not become Green because delta is Green.

If ready, next action is separate `/closeout phase 9`.

## Model routing

- P1: `Sol Medium`;
- P2: `Sol Medium`;
- P3: `Sol Medium`.

Current runner supports these labels. Do not substitute Terra.
