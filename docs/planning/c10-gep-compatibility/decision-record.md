# Correction 10 Decision Record — GEP Compatibility

Status: **APPROVED DIRECTION — ACTIVE PHASE 10 FOLLOW-UP CORRECTION**

Date: 2026-09-27

Correction: `c10-gep-compatibility`

Package boundary: `0.10.12` unchanged.

Parent correction:
- `c10-generation-bottleneck` implemented terminal TaskState integrity, generation-aware provider timeouts, and George Edit Protocol v1;
- its P4 deterministic gate was Not Green;
- its P5 closeout is `docs/tasks/c10-generation-bottleneck/closeout.md`;
- production GEP candidate is commit `384091366fcd1addabf0a2cff456a6ece77f7875`;
- package remains `0.10.12`.

## Trigger

The prior correction produced strong deterministic evidence for GEP/1 itself:
- representative GEP mutation packet: 69 bytes;
- equivalent canonical legacy mutation arguments: 356 bytes;
- Mutation Transmission Ratio: approximately 0.194;
- byte-identical resulting files;
- parser, stale-receipt, SHA, framing, permission, recovery, cancellation, and response-completion-before-mutation checks Green.

Qualification nevertheless stopped before live-model spending because three deterministic failures remained:

1. frozen Phase 8 structured replay could not obtain the legacy `read_file.sha256` / framing evidence needed to use `write_file` / `apply_patch` fallback;
2. frozen framing-recovery likewise could not obtain reread SHA;
3. Phase 5 long-workflow qualification ended `budget_exhausted` in Human mode.

The first two are directly caused by the P3 GEP read-projection contract. The third is not causally explained by GEP and must be isolated before any repair.

## Decision — preserve GEP, repair coexistence

Do not redesign or remove GEP/1.

The defect is that eligible Operation-mode `read_file` results are currently destructively projected from the inherited provider result:

```text
path + text + bytes + truncated + sha256 + textFraming
```

into a receipt-only result:

```text
path + receipt + numbered lines + bytes + textFraming
```

while legacy mutation tools remain advertised as fallback.

That contract is self-contradictory.

GEP compatibility must become **additive and bounded**.

## Decision — bounded dual projection

For a GEP-eligible Operation-mode text read that fits a provider-projection budget, provider-visible evidence should preserve the inherited legacy read contract and add compact GEP metadata.

Conceptually:

```text
name
path
text
bytes
truncated=false
sha256
textFraming

gep:
  receipt
  numberedLines
```

Exact field names may differ if a cleaner typed representation exists, but compatibility semantics are locked:

- `text`, `sha256`, `textFraming`, `bytes`, and `truncated` remain available to legacy mutation/recovery consumers;
- GEP receipt/line addressing is additive;
- the receipt registry still owns the exact ephemeral snapshot used for compact edit expansion;
- legacy mutation fallback remains genuinely usable.

## Decision — provider-projection bound

Do not duplicate arbitrarily large source files into both raw and numbered forms.

Introduce a centralized provider-visible GEP dual-projection limit.

Initial maximum serialized dual-projection size: **16 KiB**.

A read is GEP dual-projection eligible only when the complete projected result, including inherited legacy fields plus GEP metadata, fits that bound.

If it does not fit:
- return the inherited legacy `read_file` provider result unchanged;
- do not issue a GEP receipt for that provider-visible result;
- legacy mutation remains available;
- do not truncate or partially emit GEP line addressing.

The run-local receipt storage bound may remain larger than the provider-projection bound, but no hidden receipt may be presented as usable when its provider-facing GEP evidence was withheld.

## Decision — compatibility does not mean duplicated canonical state

The provider may receive both raw `text` and derived numbered-line representation for small eligible files.

George still stores one exact canonical read result plus one run-local GEP receipt mapping.

Do not create two canonical file snapshots.

GEP metadata remains derived provider context.

## Decision — whole-exchange efficiency

The previous correction proved mutation-output compression but did not account for the extra read projection.

Add a second metric.

### Mutation Transmission Ratio

Retain:

`GEP packet bytes / equivalent expanded canonical mutation bytes`

Required deterministic threshold remains **<= 0.70**.

### Net Edit Transport Ratio

Define for the same source/edit fixture:

`(dual GEP read provider bytes + GEP edit packet bytes) / (legacy read provider bytes + legacy mutation argument bytes)`

Required deterministic threshold: **< 1.0**.

This proves compact editing does not merely shift more bytes into provider input than it saves in generated output.

Live qualification must separately report actual provider input, cached-input, and output tokens because local generation cost is materially more expensive than cached/input processing on the target runtime.

## Decision — frozen compatibility paths remain authoritative

Do not rewrite the frozen Phase 8 replay/framing tests to use GEP.

They are compatibility tests.

They must continue to prove:
- observed SHA/framing can drive legacy `write_file`;
- a rejected framing-changing write returns bounded failure evidence;
- reread returns usable SHA;
- legacy `apply_patch` can recover;
- validation remains George-owned.

New GEP tests must also prove dual projection and bounded fallback.

## Decision — Phase 5 failure requires causal isolation

The Phase 5 long workflow failure occurs in Human mode and is not explained by GEP receipt projection.

Do not increase:
- `DEFAULT_RUN_BUDGET`;
- the test's fixed 2,200-token provider-input profile;
- context profiles;
- continuation ceilings;

merely to obtain Green.

Before changing production behavior, run the exact Phase 5 test under Node 26 in isolated/detached worktrees at least at:
- `a9c5175b6c45a218a7eb5997514b88ce679fc573` — pre-c10 generation correction;
- `73885cfc4c09889db876dc4c75af1645ee88e4a9` — c10 P1;
- `99e5267ca0bc3961003fc0c5877ffbec3f22fa3d` — c10 P2;
- `384091366fcd1addabf0a2cff456a6ece77f7875` — c10 P3/current production basis.

Continue backward into Phase 10 history only if needed to identify the first bad boundary.

Capture the exact `budget.exhausted.dimension` and surrounding:
- context assembly;
- compaction;
- provider usage;
- continuation estimate/promotion;
- provider attempts;
- tool/process budget;
- run-budget events.

Only after the first bad boundary and exhausted producer are known may P2 repair code or update a stale test assumption.

If the failure is a real current regression, repair the producer/consumer contract narrowly.

If the test expectation is superseded by newer authoritative behavior, update it only with explicit documentation/evidence proving why the old expectation is invalid.

Do not normalize an unexplained failure away.

## Decision — live qualification only after deterministic Green

The real LM Studio/Qwen workload blocked by the prior correction remains the required live gate.

Run it only after:
- GEP compatibility floor Green;
- Phase 5 current failure resolved or validly characterized such that the required affected-system floor is Green;
- broad deterministic gate Green.

Do not rerun B2/C2.

Do not use the owner's Express workspace.

## Preserved boundaries

Preserve:
- package `0.10.12`;
- terminal TaskState fix;
- 300s default / 600s maximum provider emergency timeout;
- first-useful-output / active-inactivity / cancellation / retry-rebase safety;
- GEP parser/receipt freshness/canonical expansion;
- response-completion-before-side-effect;
- SHA/framing/workspace/permission/recovery authority;
- legacy mutation tools;
- Human/Operation split;
- stable-prefix/late round context;
- Phase 10 P7 historical/intermittent evidence;
- all Phase 8/9/10 historical evidence.

Do not add:
- context retuning;
- helper inference;
- GPU/runtime tuning;
- new concurrency work;
- browser/visual feedback;
- speculative decoding;
- new mutation authority.

## Rerun consequence

If this correction closes Green, `c10-generation-bottleneck` plus `c10-gep-compatibility` form the corrected Phase 10 candidate needed to reassess formal Phase 10 readiness.

This correction does not owner-close Phase 10 or open Phase 11.
