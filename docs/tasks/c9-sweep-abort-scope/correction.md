# c9 sweep abort-scope correction

Date: 2026-09-26

Package: `0.9.10` (unchanged)

## Correction

P5 promoted one affected-floor OpenTUI progressive-final-answer-reveal timeout into common invalidity even though the same identity passed in the required broad run and the pinned runtime, application, typecheck, runner, evidence writer, and security boundaries were healthy. The failure remains truthful Not Green/intermittent evidence; it no longer suppresses unrelated isolated live workloads.

`src/qualification/sweep.ts` now classifies bounded preflight observations by executable semantic scope. Unsupported runtime, unloaded pinned model, invalid REST runtime controls, unrunnable application/typecheck, instrument identity corruption, evidence-writer failure, current permission/security/recovery or Workspace Autonomous containment failure, provider/tool contract corruption, and malformed qualification harness evidence abort closed. OpenTUI/functional/broad/live/model-task failures and historical intermittency are record-and-continue observations. Native real-TTY and GPU Offload 26 gaps remain explicit environment evidence without blocking the functional sweep.

The classifier exposes the existing `runQualificationSweep()` common input; the sweep engine itself is unchanged. Permanent tests cover every required abort/continue class, bounded/redacted evidence, and the exact P5 identity followed by all five live callbacks.

## Validation

Supported runtime: Node `v26.10.0`, npm `11.19.1`.

- Focused qualification/preflight/live-work: `28/28` Green.
- Affected qualification, permission/recovery/containment, Phase 4/5/9, and OpenTUI characterization: `114 passed, 0 failed, 1 skipped`; native real-TTY remained an Evidence Gap.
- `npm run typecheck`: Green.
- `npm run test:runner`: `90/90` Green.
- `npm test`: `417 passed, 0 failed, 1 skipped`; native real-TTY only.
- `git diff --check`: Green.
- Package remains `0.9.10`; no root `package-lock.json`; frozen live instruments/acceptance and historical `c9-live-sweep` artifacts are unchanged.

No official greeting, three-file, Gate A, B2, or C2 workload was run.
