export const TASK_PROMPT_LIMITS = Object.freeze({
  maxPromptBytes: 128 * 1024,
  maxPromptLines: 4 * 1024,
  maxSectionBytes: 32 * 1024,
  maxEntriesPerSection: 128,
  maxEntryBytes: 8 * 1024,
  maxCommandArguments: 64,
  maxCommandArgumentBytes: 8 * 1024,
});

export type TaskKind = 'implementation' | 'qualification' | 'correction' | 'closeout';
export type TaskId = `R${number}` | `I${number}` | `W${number}` | `V${number}` | `S${number}` | `D${number}`;
export type PermissionExpectation = Readonly<{
  workspace?: 'standard' | 'autonomous';
  outsideWorkspace?: 'reject' | 'ask';
  network?: 'reject' | 'ask';
  remoteMutation?: 'reject' | 'ask';
}>;

export type TaskTextSection = Readonly<{ lines: readonly string[] }>;
export type TaskReadFirstEntry = Readonly<{ required: boolean; source: string }>;
export type TaskRequirement = Readonly<{ id: `R${number}`; text: string }>;
export type TaskInvariant = Readonly<{ id: `I${number}`; text: string }>;
export type TaskStopCondition = Readonly<{ id: `S${number}`; text: string }>;
export type TaskDeliverable = Readonly<{ id: `D${number}`; text: string }>;
export type TaskWorkUnit = Readonly<{
  id: `W${number}`;
  title: string;
  covers: readonly `R${number}`[];
  dependsOn: readonly `W${number}`[];
  description: readonly string[];
  completeWhen: readonly string[];
}>;
export type LiteralValidationCommand = Readonly<{ kind: 'literal'; executable: string; arguments: readonly string[] }>;
export type DiscoverValidationCommand = Readonly<{ kind: 'discover'; scope: string }>;
export type TaskValidation = Readonly<{
  id: `V${number}`;
  title: string;
  covers: readonly `R${number}`[];
  command: LiteralValidationCommand | DiscoverValidationCommand;
}>;

export type TaskDefinition = Readonly<{
  format: 1;
  stack?: string;
  task: Readonly<{ title: string; ordinal: number }>;
  kind: TaskKind;
  goal: TaskTextSection;
  readFirst: readonly TaskReadFirstEntry[];
  inspect: readonly string[];
  requirements: readonly TaskRequirement[];
  invariants: readonly TaskInvariant[];
  workflow: readonly TaskWorkUnit[];
  validations: readonly TaskValidation[];
  stopConditions: readonly TaskStopCondition[];
  deliverables: readonly TaskDeliverable[];
  nonGoals: readonly string[];
  permissions: PermissionExpectation;
  versioning?: TaskTextSection;
  evidence?: TaskTextSection;
}>;

export type OrdinaryTaskPrompt = Readonly<{ kind: 'ordinary' }>;
export type StructuredTaskPrompt = Readonly<{ kind: 'structured'; task: TaskDefinition }>;
export type TaskPromptParseResult = OrdinaryTaskPrompt | StructuredTaskPrompt;
export type TaskPromptDiagnostic = Readonly<{ message: string; line?: number }>;

export class TaskPromptParseError extends Error {
  readonly diagnostics: readonly TaskPromptDiagnostic[];

  constructor(diagnostics: readonly TaskPromptDiagnostic[]) {
    super(diagnostics.map((diagnostic) => diagnostic.line === undefined ? diagnostic.message : `Line ${diagnostic.line}: ${diagnostic.message}`).join(' '));
    this.name = 'TaskPromptParseError';
    this.diagnostics = diagnostics;
  }
}
