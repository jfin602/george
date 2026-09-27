# Correction 10 P3 failure ledger

Candidate: `759b07de1594cb6ce4bff6896f72f1dcbf64e502` / tree `2e3d4a414e31b1ff2740de6435eb3cb4a49b7e9e` / package `0.10.12`.

| ID | Layer | State | Observation | Classification |
| --- | --- | --- | --- | --- |
| L1 | Single live workload | Not Green | The task and both validations completed, but the model used legacy `apply_patch`/`write_file`; `gepPacketBytes=0`. | Required live existing-file GEP edit absent. No rerun or retuning. |
| E1 | Live whole-exchange measurement | Evidence Gap | Live Mutation Transmission Ratio and Net Edit Transport Ratio are unavailable because no GEP packet was emitted. | `null`, not zero; deterministic ratios remain independently Green. |
| E2 | Live read-byte observation | Evidence Gap | The observer retained 3,441 dual-projection bytes and 1,980 legacy-equivalent bytes, but deduplicated receipt IDs across structured turns even though IDs are run-local. | Values are lower bounds, not complete live whole-exchange totals. No post-attempt instrument rewrite or rerun. |
| H1 | Phase 10 P7 history | Historical/intermittent Not Green | The earlier lifecycle-order failure remains immutable; its current assertion passed in focused and broad runs. | Current passes establish no new failure but do not erase history. |
| T1 | Native TTY | Evidence Gap / not applicable to this browser-free qualification | Broad suite skipped `native OpenTUI launches and restores a real Node 26 terminal`. | Expected non-TTY skip; no affected deterministic failure. |

No current deterministic test failed. No correction-local run produced invalid terminal TaskState. The one live workload ran exactly once.
