# Correction 10 P3 evidence commands

Candidate and common validity:

```text
git status --short
git rev-parse HEAD
git rev-parse HEAD^{tree}
git log -8 --oneline --decorate
node --version
npm --version
uname -a
node -p "require('./package.json').version"
test ! -e package-lock.json
node --input-type=module -e "import { resolveGeorgeConfig } from './src/core/config.ts'; const c=resolveGeorgeConfig(); console.log(JSON.stringify({context:c.context,executionPolicy:c.executionPolicy,provider:{origin:c.provider.baseUrl.origin,model:c.provider.model,timeoutMs:c.provider.timeoutMs}},null,2))"
curl --silent --show-error --max-time 5 --write-out '\nhttp_status=%{http_code}\n' http://127.0.0.1:1234/v1/models
curl --silent --show-error --max-time 5 --write-out '\nhttp_status=%{http_code}\n' http://127.0.0.1:1234/api/v0/models
```

Focused floor:

```text
node --experimental-ffi --test test/unit/tasks/state.test.ts test/unit/tasks/stack-state.test.ts test/unit/tasks/parser.test.ts test/unit/core/session-store.test.ts test/unit/core/foundation.test.ts test/unit/core/run-budget.test.ts test/unit/context/index.test.ts test/unit/context/profile-selector.test.ts test/unit/provider/lm-studio.test.ts test/unit/application/george-edit.test.ts test/unit/application/george-edit-loop.test.ts test/unit/application/provider-stall.test.ts test/unit/application/one-turn.test.ts test/unit/application/recovery.test.ts test/unit/application/structured-task.test.ts test/unit/application/structured-task-stack.test.ts test/unit/application/phase8-structured-replay.test.ts test/unit/application/coding-workflow.test.ts test/unit/application/tool-batching.test.ts test/unit/application/progress.test.ts test/unit/tools/mutation.test.ts test/unit/tools/read-only.test.ts test/unit/qualification/live-work.test.ts test/integration/agent-loop.test.ts test/integration/phase5-qualification.test.ts test/integration/phase9-qualification.test.ts
```

Required gates; each npm gate ran exactly once:

```text
npm run typecheck
npm run test:runner
npm test
git diff --check
```

The single official live workload:

```text
node --check docs/tasks/c10-gep-compatibility/evidence/live-qualification.ts
node docs/tasks/c10-gep-compatibility/evidence/live-qualification.ts
```

The live command ran once and exited 1 after its final correction-specific assertion observed no GEP packet. It was not rerun.
