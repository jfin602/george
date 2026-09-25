# c8-agentic-context Implementation Plan

Status: CURRENT IMPLEMENTATION PLAN

Correction: `c8-agentic-context`  
Parent phase: 8 — Context Throughput Optimization  
Execution folder: `c8-agentic-context`  
Required unchanged package version: `0.8.8`

Read with `BOOT.md`, `AGENTS.md`, current contracts, `docs/planning/c8-agentic-context/{decision-record,qualification-plan}.md`, and `docs/tasks/c8-agentic-context/prompt-assessment.md`.

## Target correction shape

```text
existing George context sources
        |
        v
provider-independent assembly / diagnostics
        |
        +----------------------------+
        |                            |
synthetic context suite       agentic-context suite
prefill/retrieval             real instructions + tools +
characterization              repository workflows
        |                            |
        +-------------+--------------+
                      |
               empirical envelope
                      |
                      v
          evidence-backed context policy
                      |
        +-------------+--------------+
        |                            |
deterministic regression       live George qualification
        |                            |
        +-------------+--------------+
                      |
               correction closeout
```

The correction preserves the `0.8.8` adaptive-context architecture and changes measurement/policy only where empirical agentic evidence supports it.

## P1 — agentic benchmark instrument

Required unchanged version: `0.8.8`.

Extend the formal benchmark harness with a dedicated `agentic-context` suite.

Keep `quick`, `full`, and synthetic `context` behavior intact.

### CLI

Add a dedicated band option, preferably:

`--agentic-context-bands 2048,4096,6144,8192,10240,12288`

It is valid only with `--suite agentic-context`.

Do not overload `--context-bands`; the distinction between synthetic context characterization and agentic-context qualification must stay explicit.

### Agentic case families

For each requested band generate three stable cases.

#### Inspection

Realistic repository guidance plus a bounded repository file.

George must use the normal read path and return a deterministic fact/token.

#### Multi-round investigation

A repository trail requires sequential reads/searches. Each artifact reveals the next evidence source.

The model must not infer the final fact without the intermediate tool work.

#### Edit + validation

A tiny deterministic defect requires inspection, one bounded edit/patch, and one validation command.

Reuse the existing coding workflow, approval, and validation machinery.

### Context-band fixture shape

Band generation must use meaningful, distinct, deterministic project/task material and actual George context inputs.

Do not create one giant repeated filler instruction blob.

A practical fixture may distribute pressure across:
- compact project instructions;
- realistic repository guidance/routed material;
- bounded prior task/history evidence;
- task-specific repository content.

Use the real assembler/application path as the measurement authority. Requested bands are targets; records report actual estimated/provider input.

Do not create a second context estimator/assembler merely to hit an exact number.

### Tool surface

Agentic cases must expose the normal George coding tool schema surface needed to reproduce real request shape, including normal built-in coding tools and the ordinary Parallel tool schema where current normal startup exposes it.

Tests must not require network access and expected cases must never require external search.

Unexpected external/write/process proposals outside the fixture expectation are benchmark failures/evidence, not silently hidden.

Keep MCP/Chrome/user-plugin variability disabled for deterministic benchmark fixtures unless a later explicit benchmark contract adds them.

### Benchmark evidence

Extend records/reporting with bounded context-selection evidence, at least:
- mode;
- selected profile ID/value;
- attempted profile IDs;
- promotion reasons;
- estimated context;
- provider input budget/headroom;
- category token contributions or equivalent bounded category summary;
- omission/defer/compaction counts where practical.

Preserve:
- provider-reported input/output;
- response start;
- first useful output;
- total/provider/tool/approval time;
- attempts/rounds/retries;
- tool calls and unique tools;
- validation count;
- deterministic pass/fail.

If the record schema changes, bump the benchmark schema version and retain comparison/parser compatibility intentionally.

### P1 validation

Add deterministic tests for:
- CLI suite/band parsing;
- stable case generation/order;
- fixture bounds;
- normal tool-schema exposure;
- each agentic task family's deterministic scripted-provider behavior;
- new record fields;
- existing quick/full/context behavior unchanged.

Do not change production context profiles or selector behavior.

## P2 — empirical agentic envelope measurement

Required unchanged version: `0.8.8`.

P2 changes evidence/docs only, not production policy.

Use the P1 suite against the pinned live LM Studio/Qwen control.

### Runtime precheck

Every live measurement series starts with:

```bash
echo "MANUAL CHECK: LM Studio GPU Offload must show 26" && \
curl -fsS http://127.0.0.1:1234/api/v1/models | jq '
.models[]
| select(.key == "qwen3-coder-30b-a3b-instruct@q4_k_m")
| {
    key,
    loaded_instances: [
      .loaded_instances[]
      | {
          id,
          context_length: .config.context_length,
          eval_batch_size: .config.eval_batch_size,
          physical_batch_size: .config.physical_batch_size,
          parallel: .config.parallel,
          flash_attention: .config.flash_attention,
          offload_kv_cache_to_gpu: .config.offload_kv_cache_to_gpu,
          num_experts: .config.num_experts
        }
    ]
  }
'
```

Record GPU Offload 26 as confirmed/unconfirmed separately.

### Exploration

Run one band at a time so the sweep can stop instead of blindly executing every larger band.

Start:

```bash
npm run benchmark -- --suite agentic-context --agentic-context-bands 2048 --repetitions 1 --label c8-agentic-explore-2k
```

Then 4096, 6144, 8192, 10240, 12288 while previous evidence remains usable.

Stop ascending after the first material capability/latency cliff or invalid runtime state.

Do not continue burning 120-second timeouts just to complete the matrix.

### Confirmation

When a largest healthy candidate and next materially worse region are identified, run each with at most two repetitions.

If no controlled healthy envelope can be established, record Evidence Gap and do not invent numbers.

### Evidence record

Create `docs/tasks/c8-agentic-context/P2-agentic-envelope-evidence.md`.

Record every attempted run, including failed/invalid runs.

Explicitly state:
- largest empirically healthy working-set region, if established;
- next worse/risk region;
- whether evidence is sufficient for P3 production policy changes.

## P3 — evidence-backed context policy correction

Required unchanged version: `0.8.8`.

Read P2 evidence before editing runtime policy.

### If P2 evidence is sufficient

Implement the smallest context-policy change that keeps ordinary coding work inside the qualified high-signal envelope.

Preserve physical 32,768 context.

Do not conflate the measured agentic envelope with hard provider capacity.

Preferred implementation law:
- existing physical context remains runtime capacity;
- existing provider-input ceiling remains a safety ceiling unless evidence specifically supports changing it;
- adaptive mode gains or reuses an explicit qualified agentic operating limit so George does not routinely send context shapes above the measured healthy envelope merely because they fit the hard ceiling;
- fixed mode remains an explicit operator override and continues to use its concrete profile safely.

If the current profile fields can express this cleanly without semantic ambiguity, reuse them. If not, add the smallest explicit agentic-limit field/type and expose it in diagnostics.

### Source-pressure behavior

Within adaptive mode:
- George invariants/current user/tool/recovery state are protected;
- immediate task/repository evidence is preferred;
- lower-value optional defaults may omit/defer deterministically;
- explicitly selected routed/skill/project guidance may promote only within empirically qualified agentic envelopes;
- if correctness-critical selected material cannot fit the largest qualified adaptive envelope, fail/degrade explicitly before provider execution rather than silently dropping it or sending an unqualified giant prompt.

Do not add semantic model routing, helper summarization, or silent partial sources.

Large/fixed mode Phase-5 compaction/recovery and P7 continuation safety remain intact.

### If P2 evidence is insufficient

Do not guess profile values.

Create `docs/tasks/c8-agentic-context/P3-policy-decision.md` recording the Evidence Gap and preserve current runtime policy unchanged.

P4/P5 then qualify that no unsupported policy change was made.

## P4 — deterministic correction qualification

Required unchanged version: `0.8.8`.

Build permanent regression coverage around the exact accepted P3 state.

Prove:
- agentic suite grammar/cases/records remain deterministic;
- synthetic context suite remains distinct;
- any new agentic limit is validated/observable;
- adaptive selection respects the accepted envelope;
- fixed mode remains explicit;
- required/current/tool/recovery context is protected;
- lower-value optional omit/defer remains explicit;
- selected project/routed/skill pressure cannot silently disappear;
- oversize selected material fails/degrades explicitly if no qualified adaptive envelope can safely carry it;
- no extra provider call is added by context selection;
- Phase-3 precedence/source integrity survives;
- Phase-5 compaction/recovery survives;
- P7 frozen-turn continuation-pressure behavior survives;
- permissions/session/Git behavior is unchanged.

Create `docs/tasks/c8-agentic-context/P4-deterministic-qualification-evidence.md`.

## P5 — real George agentic qualification

Required unchanged version: `0.8.8`.

Qualify the exact P4 candidate through controlled live LM Studio/Qwen.

Use the P1 agentic suite at:
- the accepted healthy region;
- a representative smaller ordinary region;
- the next risk region only when runtime control is healthy and the evidence is useful.

Do not run a huge matrix.

Run at least:
- inspection;
- multi-round investigation;
- edit + validation.

Use the same LM Studio precheck/manual GPU Offload reminder as P2.

Also run a bounded native George/OpenTUI smoke on Node 26 when a usable TTY is available:
- start real George;
- submit a small repository task;
- observe context/work/activity/final output/Ready;
- exit cleanly;
- preserve worktree.

If TTY or runtime evidence is unavailable, classify it as Evidence Gap.

Re-exercise P7 continuation-pressure safety live only if the runtime remains healthy enough to produce meaningful evidence; do not manufacture a failure by overloading a broken runtime.

Create `docs/tasks/c8-agentic-context/P5-live-qualification-evidence.md`.

## P6 — correction closeout

Required unchanged version: `0.8.8`.

Evidence-only audit.

Read P2/P3/P4/P5 evidence and exact current source/tests.

Create `docs/tasks/c8-agentic-context/closeout.md` with:
- Implementation Complete state;
- Correction Qualified state;
- accepted agentic benchmark version;
- healthy envelope/risk region or explicit Evidence Gap;
- final production context policy;
- synthetic context ladder classification;
- preserved Phase-3/5/P7 contracts;
- real George live evidence;
- all Not Green/Evidence Gap truth.

Do not:
- repair implementation;
- rewrite `docs/phase-8-closeout.md`;
- owner-close Phase 8;
- advance Phase 9;
- change package version.

## Validation policy

Every implementation prompt:
- focused tests for changed boundary;
- `npm run typecheck`;
- `npm run test:runner`;
- affected broad tests;
- `git diff --check`;
- no `package-lock.json`;
- package version remains exactly `0.8.8`.

Known unrelated failures remain separate evidence and are never hidden to manufacture Green.

## Model policy

P1-P5: Terra High.  
P6: Terra Medium.

Every prompt: `Browser required: no.`
