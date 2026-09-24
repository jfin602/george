# Phase 7 Initial Benchmark Baseline

Status: PENDING LOCAL LIVE RUN

Phase: 7 — Inference Runtime Optimization  
Baseline package: `0.7.0`  
Primary model: `qwen3-coder-30b-a3b-instruct@q4_k_m` unless deliberately overridden

## Purpose

Capture the untouched pre-optimization primary-model baseline before any Phase 7 runtime setting, model warm-up, or provider behavior is changed.

This run is the control for the Phase 7 optimization campaign.

## Required command

Run from the George repository with the current LM Studio/Qwen configuration unchanged:

```bash
npm run benchmark -- --suite full --repetitions 3 --label p7-initial-baseline
```

Do not change GPU offload, Flash Attention, KV-cache placement, eval batch size, model residency policy, context profile, startup warm-up, speculative decoding, or George orchestration before this baseline is captured.

## Expected artifacts

```text
artifacts/benchmarks/<run-id>/results.json
artifacts/benchmarks/<run-id>/report.md
```

The artifacts are intentionally Git-ignored. Record the resulting run ID/path and a concise summary here or in the Phase 7 decision/qualification record before the first optimization is accepted.

## Evidence rules

- individual failed cases remain visible; averages do not hide failures;
- `first-run-in-benchmark-process` is process-order evidence, not proof of a truly cold LM Studio model;
- response-start/first-output timing uses George-observed events and is not automatically token-level TTFT;
- correctness and speed remain separate dimensions;
- the first optimization must compare against this exact accepted baseline using `--compare <results.json>` where practical.
