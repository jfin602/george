import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { CliRenderEvents, TextRenderable, createCliRenderer } from '@opentui/core';

import { createOneTurnApplicationService, StructuredTaskApplicationService } from '../../../src/application/index.ts';
import { PendingApprovalPort, type ModelProvider } from '../../../src/core/index.ts';
import { GeorgeTui } from '../../../src/tui/app.ts';

const [workspace, report] = process.argv.slice(2);
if (!workspace || !report) throw new Error('Usage: native-navigation <workspace> <report>');
writeFileSync(join(workspace, 'BOOT.md'), 'boot');
let calls = 0;
const provider: ModelProvider = { supportsRoundContext: true, async *stream() {
  calls += 1;
  yield { type: 'provider.response.started', responseId: `native-${calls}` };
  if (calls === 1) {
    yield { type: 'provider.tool.call', callId: 'native-read', name: 'read_file', arguments: '{"path":"BOOT.md"}' };
    yield { type: 'provider.response.completed' };
    return;
  }
  await new Promise((resolve) => setTimeout(resolve, 20_000));
  yield { type: 'provider.text.delta', delta: '{"version":1,"control":"handoff"}' };
  yield { type: 'provider.response.completed' };
} };
const approvals = new PendingApprovalPort();
const service = await createOneTurnApplicationService({ provider, workspace, approvalPort: approvals });
const renderer = await createCliRenderer({ exitOnCtrlC: false, exitSignals: [] });
const app = new GeorgeTui({ renderer, service: new StructuredTaskApplicationService(service), provider: 'fixture', model: 'fixture', approvals });
renderer.on(CliRenderEvents.FRAME, () => {
  const transcript = renderer.root.findDescendantById('transcript-text');
  const task = renderer.root.findDescendantById('task-text');
  writeFileSync(report, JSON.stringify({
    page: app.currentPage(), draft: app.input.plainText, session: JSON.stringify(app.session), calls,
    work: app.work.map((entry) => entry.item.summary),
    transcript: transcript instanceof TextRenderable ? transcript.plainText : '',
    task: task instanceof TextRenderable ? task.plainText : '',
  }));
});
renderer.requestRender();
await app.run();
