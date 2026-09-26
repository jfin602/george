# c9 qualification preflight scope P1 evidence

Status: **GREEN POLICY GUARD AND BROAD REGRESSION DELTA; AGGREGATE BROAD NOT GREEN**

Date: 2026-09-25

Pre-task HEAD: `437145e294e5d34b375f5ccb4e6a5c1b7683c891`

Package: `0.9.10` (unchanged)

P1 added only a pure qualification classifier, its deterministic regression tests, and bounded qualification evidence. It did not change production agent-loop, tool, filesystem, TUI, provider, instrument, hidden-acceptance, or live-gate behavior. Gate A/B2/C2 were not run.

## Qualification policy guard

`classifyQualificationPreflight()` keeps four finite states separate:

- hard affected-system preflight;
- candidate aggregate broad state;
- controlled broad regression delta;
- live-gate eligibility.

It accepts normalized bounded evidence only. It does not execute tests, parse raw logs, inspect hidden acceptance, or reinterpret test outcomes. Input count/identity inconsistencies, unbounded observations, incomplete runs, and non-equivalent execution provenance produce an Evidence Gap. Ordering is normalized before output.

The focused policy suite passed `6/6`, including the permanent regression case:

`hard Green + retained five renderer failures + retained native-TTY skip = aggregate Not Green + delta Green + live eligible`.

It also covers hard Not Green/Evidence Gap, new identities despite equal counts, affected pass-to-fail/pass-to-skip transitions, materially changed retained categories/signatures, incomplete or non-equivalent evidence, bounded reasons/signatures, and order independence.

## Controlled broad comparison

| Dimension | Baseline | Candidate |
| --- | --- | --- |
| Commit | `d7e565ccb0e694166e6fe4346b56f4746f0697f1` | `04405570b92680e6297b48391a7d0bdf0aa8ed5e` |
| Runtime | Node `v26.10.0`; npm `11.19.1` | Node `v26.10.0`; npm `11.19.1` |
| Command | exact `npm test` | exact `npm test` |
| Environment | non-TTY isolated `git archive` tree | non-TTY isolated `git archive` tree |
| Dependencies | identical hard-linked installed tree; package identity `d01d095de8e27144ee1a0967e8f54b0aa3cc1ce5281b753138e1d9c708041c5c` | same |
| Result | **Not Green: 379 passed, 5 failed, 1 skipped, 385 total** | **Not Green: 383 passed, 5 failed, 1 skipped, 389 total** |
| Duration | `7,873.075006 ms` | `7,990.537343 ms` |

Both finalized snapshots used identical read-only copies of Git metadata so Git-aware and Bubblewrap tests had equivalent repository context without moving active HEAD. Each finalized snapshot received exactly one supported controlled run. Two earlier setup probes were non-qualifying: the default Node 24 binary rejected `--experimental-ffi` before test discovery, then archive-only trees exposed missing Git metadata and an out-of-snapshot dependency symlink. Neither probe is used in the comparison or tracked as test evidence.

### Matched retained failures

| Exact test identity | Bounded category/signature |
| --- | --- |
| `test renderer shows identity, configuration, streamed text, and read-only activity` | `opentui-renderer-assertion`: frame did not match `/streamed answer/` |
| `Transcript and Task pages switch without changing session state or the composer draft` | `opentui-renderer-assertion`: frame did not match `/No structured task is active/` |
| `committed final answers reveal progressively without delaying canonical durability, and cancellation stops the reveal` | `opentui-renderer-timeout`: frame predicate timed out after 20 passes |
| `streaming does not overwrite draft input and returns the composer to ready state` | `opentui-renderer-assertion`: frame did not match `/streamed answer/` |
| `test renderer presents normalized approvals and allow, deny, and Esc keep the TUI usable` | `opentui-renderer-timeout`: frame predicate timed out after 20 passes |

Both runs skipped exactly `native OpenTUI launches and restores a real Node 26 terminal` because the controlled environment was non-TTY. That native qualification remains a gap; it is not relabeled Green.

The tracked `broad-delta.json` is the exact output of `classifyQualificationPreflight()` for the two tracked summaries with P1 hard preflight Green:

- aggregate candidate broad: **Not Green**;
- broad regression delta: **Green**;
- new identities: none;
- materially worsened identities: none;
- live eligibility: **Green, subject to P2's fresh hard checks**.

The Green delta does not waive or relabel the five renderer failures or native-TTY skip.

## P1 validation

| Check | Result |
| --- | --- |
| Qualification-preflight classifier | **Green: 6/6 passed** |
| Qualification/live-work | **Green: 8/8 passed** |
| Mutation-precondition focused/inherited floor | **Green: 128/128 passed** |
| Phase 9 integration | **Green: 5/5 passed** |
| `npm run typecheck` | **Green** |
| `npm run test:runner` | **Green: 90/90 passed** |
| Current broad `npm test` characterization | **Not Green: 389 passed, 5 failed, 1 skipped, 395 total**; same retained identities/signatures |
| Package version | **Green: exactly `0.9.10`** |
| Root `package-lock.json` | **Green: absent** |
| Official live Gate A/B2/C2 | **Not Run in P1** |

## Tracked evidence hashes

- `evidence/broad-baseline.json`: SHA-256 `58f0e5de02612131dec345bded9b16e3e8b8ab31238f86e1ea599aab53a0b58c`
- `evidence/broad-candidate.json`: SHA-256 `59231ea54df532ed225ef654e26ab726cf6bd3c426d4005f53c4325e9b389562`
- `evidence/broad-delta.json`: SHA-256 `a674cc702e4ecb7dd3e456cf4aae3daeefdc0cd89c70e87e3f4ac97750dda3be`

No raw test logs, secrets, environment dumps, dependency trees, workspace snapshots, provider streams, or file bodies are tracked. Phase 9 remains open and Phase 10 remains unopened.
