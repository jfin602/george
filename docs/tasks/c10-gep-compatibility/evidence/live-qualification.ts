import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { StructuredTaskApplicationService, createAgentLoopApplicationService } from '../../../../src/application/index.ts';
import {
  LocalSessionStore,
  createSession,
  resolveGeorgeConfig,
  type ApprovalPort,
  type ModelProvider,
  type ProviderRequest,
  type ProviderStreamOptions,
} from '../../../../src/core/index.ts';
import { LmStudioResponsesProvider } from '../../../../src/provider/index.ts';
import { preparePhase10CoreWorkspace, runExistingCoreEditV1, writeLiveWorkArtifacts } from '../../../../src/qualification/index.ts';
import { acceptExistingCoreEdit } from '../../../../test/acceptance/p10-live-work/existing-core-edit-v1.test.mjs';

const root = process.cwd();
const fixtureRoot = join(root, 'test/fixtures/p10-live-work/existing-core-edit-v1');
const acceptancePath = join(root, 'test/acceptance/p10-live-work/existing-core-edit-v1.test.mjs');
const artifactDirectory = join(root, 'docs/tasks/c10-gep-compatibility/evidence/live');
const temporaryRoot = await mkdtemp(join(tmpdir(), 'george-c10-gep-live-'));
const workspace = join(temporaryRoot, 'workspace');
const stateRoot = join(temporaryRoot, 'state');

const allowedMutationPaths = new Set(['README.md', 'src/labels.js', 'test/release-label.test.js']);
const approval: ApprovalPort = { request: async (request) => {
  if (request.target?.outsideWorkspace === true || request.mutation !== undefined) return 'deny';
  if ((request.toolName === 'write_file' || request.toolName === 'apply_patch')
    && request.execution.effect === 'workspace_mutation'
    && request.target !== undefined
    && allowedMutationPaths.has(request.target.path)) return 'allow_once';
  if (request.toolName === 'run_process' && request.process !== undefined) {
    const command = [request.process.executable, ...request.process.argv].join(' ');
    if (command === 'node --test test/release-label.test.js' || command === 'npm test') return 'allow_once';
  }
  return 'deny';
} };

class MeasuringProvider implements ModelProvider {
  readonly supportsRoundContext = true as const;
  readonly supportsOutputPolicy = true as const;
  readonly seenReceipts = new Set<string>();
  dualReadBytes = 0;
  legacyReadBytes = 0;
  private readonly delegate: ModelProvider;

  constructor(delegate: ModelProvider) { this.delegate = delegate; }

  stream(request: ProviderRequest, options?: ProviderStreamOptions) {
    for (const toolResult of request.continuation?.toolResults ?? []) {
      if (toolResult.name !== 'read_file' || !toolResult.result.ok || typeof toolResult.result.value !== 'object'
        || toolResult.result.value === null || Array.isArray(toolResult.result.value)) continue;
      const value = toolResult.result.value as Record<string, unknown>;
      const gep = value.gep;
      if (typeof gep !== 'object' || gep === null || Array.isArray(gep) || typeof (gep as Record<string, unknown>).receipt !== 'string') continue;
      const receipt = (gep as Record<string, unknown>).receipt as string;
      if (this.seenReceipts.has(receipt)) continue;
      this.seenReceipts.add(receipt);
      this.dualReadBytes += Buffer.byteLength(JSON.stringify(toolResult.result));
      const { gep: _gep, ...legacyValue } = value;
      this.legacyReadBytes += Buffer.byteLength(JSON.stringify({ ok: true, value: legacyValue }));
    }
    return this.delegate.stream(request, options);
  }
}

try {
  await preparePhase10CoreWorkspace({ workspace, fixtureBase: join(fixtureRoot, 'base') });
  const config = resolveGeorgeConfig({ workspace });
  const measuringProvider = new MeasuringProvider(new LmStudioResponsesProvider(config.provider));
  const store = new LocalSessionStore({ root: stateRoot });
  const session = createSession({ workspace });
  const agent = await createAgentLoopApplicationService({
    provider: measuringProvider,
    workspace,
    userConfigRoot: join(temporaryRoot, 'user-config'),
    approvalPort: approval,
    contextMode: config.context.mode,
    contextProfile: config.context.profile,
    executionPolicy: config.executionPolicy,
    runBudget: config.runBudget,
  });
  const service = new StructuredTaskApplicationService(agent, store);
  const result = await runExistingCoreEditV1({
    attemptId: 'c10-gep-compatibility-live-1',
    humanInterventions: 0,
    service,
    session,
    instrumentRoot: fixtureRoot,
    acceptancePath,
    runHiddenAcceptance: async () => {
      await acceptExistingCoreEdit(workspace);
      new TextDecoder('utf-8', { fatal: true }).decode(await readFile(join(workspace, 'test/release-label.test.js')));
      return true;
    },
  });

  const reopened = await store.open(session.id, workspace);
  const rebases = result.events.filter((event) => event.type === 'provider.rebase.started').length;
  const mutationRatio = result.metrics.mutationTransmissionRatio;
  const netRatio = result.metrics.gepExpandedMutationBytes === 0
    ? null
    : (measuringProvider.dualReadBytes + result.metrics.gepPacketBytes)
      / (measuringProvider.legacyReadBytes + result.metrics.gepExpandedMutationBytes);
  const requiredReads = ['README.md', 'package.json', 'src/labels.js', 'test/labels.test.js'];
  const observedReads = new Set(result.trace.observedReadPaths);
  const liveQualified = result.qualifying
    && requiredReads.every((path) => observedReads.has(path))
    && result.metrics.gepPacketBytes > 0
    && result.metrics.gepExpandedMutationBytes > 0
    && result.trace.mutations.some((mutation) => mutation.path === 'src/labels.js')
    && result.trace.mutations.some((mutation) => mutation.path === 'test/release-label.test.js')
    && result.trace.validations.length === 2
    && result.trace.validations.every((validation) => validation.status === 'passed')
    && session.taskState?.status === 'completed'
    && reopened.taskState?.status === 'completed'
    && reopened.id === session.id
    && reopened.workspace === session.workspace
    && mutationRatio !== null && mutationRatio <= 0.70
    && netRatio !== null && netRatio < 1;

  await writeLiveWorkArtifacts({ directory: artifactDirectory, workspace, result });
  console.log(JSON.stringify({
    attemptId: result.attemptId,
    qualifying: liveQualified,
    harnessQualifying: result.qualifying,
    terminalStatus: result.terminalStatus,
    hiddenAcceptance: result.hiddenAcceptance,
    providerAttempts: result.metrics.providerAttempts,
    providerRounds: result.metrics.providerRounds,
    retries: result.metrics.retries,
    rebases,
    providerInputTokens: result.metrics.providerInputTokens,
    cachedInputTokens: result.metrics.cachedInputTokens,
    providerOutputTokens: result.metrics.providerOutputTokens,
    responseAcceptanceMs: result.metrics.responseAcceptanceMs,
    firstUsefulOutputMs: result.metrics.firstUsefulOutputMs,
    providerActiveMs: result.metrics.providerActiveMs,
    totalMs: result.trace.timing.totalMs,
    dualGepReadBytes: measuringProvider.dualReadBytes,
    equivalentLegacyReadBytes: measuringProvider.legacyReadBytes,
    gepPacketBytes: result.metrics.gepPacketBytes,
    equivalentLegacyMutationBytes: result.metrics.gepExpandedMutationBytes,
    mutationTransmissionRatio: mutationRatio,
    netEditTransportRatio: netRatio,
    observedReadPaths: result.trace.observedReadPaths,
    mutations: result.trace.mutations,
    validations: result.trace.validations,
    finalTaskState: session.taskState?.status ?? null,
    durableReopenTaskState: reopened.taskState?.status ?? null,
    durableReopen: reopened.id === session.id && reopened.workspace === session.workspace,
    humanInterventions: result.trace.humanInterventions,
    failures: result.trace.failures,
  }, null, 2));
  assert.equal(liveQualified, true, 'Live qualification acceptance failed.');
} finally {
  await rm(temporaryRoot, { recursive: true, force: true });
}
