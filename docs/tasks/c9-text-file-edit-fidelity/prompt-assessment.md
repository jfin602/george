# c9-text-file-edit-fidelity Prompt Assessment

Status: READY FOR CORRECTION IMPLEMENTATION

Correction: `c9-text-file-edit-fidelity`  
Roadmap phase: 9  
Required unchanged package version: `0.9.10`

## Trigger

The Phase 9 structured execution chain now reaches the actual coding edit path successfully.

Qualified inherited boundaries:
- production StackState/task-stack validation, order, fail-stop, persistence, and resume;
- bounded structured evidence handoff, task-wide budget, direct validation, and convergence guards;
- full-file `read_file.sha256` -> existing-file mutation precondition;
- mandatory first-round structured INSPECT tool execution;
- application-owned INSPECT completion after the first successful tool round;
- exception-safe live trace/artifact retention;
- Bubblewrap containment.

Latest official frozen Gate A:
- one successful INSPECT round, then direct implementation;
- Qwen reused the inspected SHA as `write_file.expectedSha256`;
- Qwen requested a 59-byte full replacement containing the semantic `.toUpperCase()` repair;
- George wrote exactly the supplied 59 bytes;
- the frozen required file is 60 bytes because the original/final content ends in `\n`;
- George-owned V1 passed;
- TaskState ended completed with R1/R2 verified and no correction;
- hidden/exact acceptance failed only because the final newline was missing.

This is not a mutation-executor transformation defect. `write_file` is an exact full-replacement primitive and currently writes `call.content` verbatim.

## Problem

A local model performing a small edit can accidentally replace an existing text file while changing unrelated file framing:
- removing/adding the final newline;
- converting LF <-> CRLF;
- normalizing mixed/ambiguous line endings.

Semantic tests may still pass, so ordinary validation may not detect the accidental byte-level change.

George already has the original file bytes and current-content SHA. For existing text files, preserving framing that the task did not ask to change is deterministic safety/correctness work and should not rely only on model prose compliance.

## Decision

George must preserve existing text framing by default without silently rewriting model output.

### Read framing evidence

A successful `read_file` should expose bounded full-file framing metadata when the entire file is safely recognized as UTF-8 text.

Recommended shape:

`textFraming?: { lineEnding: 'none' | 'lf' | 'crlf' | 'mixed'; finalNewline: 'none' | 'lf' | 'crlf' }`

Exact names may follow current type conventions.

Requirements:
- computed from the full current file, not only the returned/truncated prefix;
- obtained during the same full-file scan that produces SHA-256;
- no extra unbounded whole-file buffering;
- invalid UTF-8 / NUL-containing or otherwise non-text input does not receive invented text-framing metadata;
- `mixed` remains visibly ambiguous rather than being normalized.

### Mutation preservation guard

For an existing recognized UTF-8 text target:
- `write_file` remains exact full replacement;
- `apply_patch` remains exact replacement of declared text with untouched bytes preserved;
- before publication, compare current and proposed/result framing;
- an unacknowledged framing change is rejected recoverably;
- George does not silently append/remove/convert newline bytes.

Both mutation tools should support an explicit bounded opt-in for a deliberate framing change, for example:

`allowTextFramingChange?: boolean`

The flag defaults false/absent.

For a full replacement of a file whose current framing is `mixed`, require explicit opt-in because convention fidelity cannot be established from a single normal form.

For exact patching, unchanged framing remains allowed; a patch that changes detected framing requires explicit opt-in.

New-file creation keeps existing behavior because there is no framing state to preserve.

### Provider guidance

Provider-visible tool descriptions/schema guidance must explain:
- prefer `apply_patch` for localized edits to existing files;
- preserve `read_file.textFraming` unless the task explicitly requires a framing change;
- `write_file` replaces the entire file exactly;
- setting the explicit framing-change flag is an acknowledgement, not an automatic formatter.

### Structured evidence

Because structured INSPECT now ends without a provider continuation, the implementation-stage inspection projection must carry allowlisted framing metadata alongside path/text/SHA.

## Recovery behavior

A framing-preservation rejection is a normal recoverable tool failure.

The bounded tool result should state current versus proposed framing without echoing unrestricted file content.

The implementation loop may then retry:
- preferably with `apply_patch`; or
- with a corrected full replacement that preserves framing;
- or with explicit opt-in only when the task genuinely calls for a framing change.

The failed mutation must not alter the file, so its observed SHA remains a valid precondition for the retry.

## Locked non-goals

Do not:
- silently append a final newline;
- globally enforce POSIX-newline style;
- automatically convert CRLF to LF or vice versa;
- change Task Prompt v1;
- modify INSPECT completion/tool choice;
- change task-stack semantics;
- retune context/runtime/stage limits;
- alter Bubblewrap/TUI;
- weaken SHA preconditions;
- add Phase 10 work;
- rewrite historical Gate A failures.

## Recommended stack

### P1 — text-file framing evidence and preservation guard

Implement read framing metadata, existing-file mutation framing guards, provider guidance, structured propagation, explicit opt-in, and permanent regressions including the exact missing-final-newline recovery path.

### P2 — gated live qualification

Run one new exact frozen Gate A. Only if Green run greenfield, then existing-app only after greenfield Green.

### P3 — closeout

Evidence-only. Determine whether text-file fidelity and Gate A Qwen convergence are qualified.

## Gate A criteria

Unchanged:
- exact required edit;
- George-owned V1 passes;
- completed/verified TaskState;
- zero human coding intervention;
- no task/stage/correction exhaustion;
- <=10 model-requested tool calls;
- <=10 logical provider rounds.

Additionally record:
- read framing metadata delivered to implementation;
- mutation tool choice;
- requested content/result byte counts;
- framing rejection/retry if any;
- pre/post SHA;
- final framing state.

## Prompt count

Three prompts including final closeout.

All prompts:
- `Browser required: no.`;
- package remains exactly `0.9.10`;
- Phase 9 remains open unless separately owner-closed;
- Phase 10 remains unopened.
