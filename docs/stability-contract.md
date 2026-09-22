# George Stability Contract

Status: INITIAL STABILITY CONTRACT

George can execute developer tools, so reliability includes both software correctness and containment of unintended effects.

## States

- **Implementation complete** — intended behavior exists and required focused/broad automated validation ran.
- **Stability qualified** — applicable integrated provider/tool/process/session evidence is Green.

Evidence outcomes are **Green**, **Not Green**, and **Evidence Gap**. Evidence Gap is not a pass.

## Evidence layers

### Focused automated correctness

Unit/integration tests cover parsers, schemas, permission decisions, context assembly, provider normalization, tool dispatch, filesystem boundaries, and failure paths.

### Provider contract

Use deterministic/mock provider fixtures for ordinary tests and bounded live LM Studio qualification when provider integration changes.

Verify Responses API request shape, SSE parsing, streamed text, tool-call events, cancellation, timeout/error normalization, and malformed/incomplete streams.

### Tool execution

Integrated tests prove read/write boundaries, command argument handling, timeout/cancellation, exit-code/stdout/stderr capture, child-process cleanup, Git dirty-state preservation, patch failure behavior, and permission denials.

### Agent-loop qualification

Use small fixture repositories and deterministic scripted model responses to exercise multi-turn tool loops without depending on model nondeterminism.

Live-model tests supplement this evidence but do not replace deterministic coverage.

### Session/recovery qualification

Verify interrupted runs remain inspectable, resumable only where semantics are safe, and do not duplicate writes/tool effects silently.

### Live local-model qualification

For release candidates that change the live agent path, exercise the exact supported LM Studio/Qwen configuration and record the model/provider/runtime used.

A model producing plausible text is not sufficient evidence that tool loops, permissions, cancellation, or recovery work.

## Regression permanence

Every confirmed regression must leave a permanent detector at the lowest reliable reproduction layer or justified combination of layers.

A correction that only removes the immediate symptom is not implementation-complete.

## Flaky-test rule

An unexpected test failure makes that validation run Not Green. A later passing rerun establishes intermittency; it does not erase the failure.

## Security/trust qualification

Changes touching tool execution, filesystem scope, network access, secrets, or permissions must include adversarial/negative cases.

At minimum, test that repository/model-provided text cannot silently:
- expand workspace scope;
- bypass permission policy;
- expose environment secrets;
- turn a read-only tool into a write;
- leave uncontrolled background processes.

## Performance

Measure where architecture can regress materially: prompt/context size, time-to-first-token, tool-loop latency, process cleanup, memory growth, and session-log growth.

Do not establish hard performance budgets until baseline measurements exist; once adopted, keep them versioned and explicit.

## Closeout truth

Never report a layer as Green unless it was actually exercised. Owner acceptance of a Not Green or Evidence Gap state is a recorded waiver, not retroactive proof.
