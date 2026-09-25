import {
  TASK_PROMPT_LIMITS,
  TaskPromptParseError,
  type DiscoverValidationCommand,
  type LiteralValidationCommand,
  type PermissionExpectation,
  type TaskDefinition,
  type TaskDeliverable,
  type TaskId,
  type TaskInvariant,
  type TaskKind,
  type TaskPromptDiagnostic,
  type TaskPromptParseResult,
  type TaskReadFirstEntry,
  type TaskRequirement,
  type TaskStopCondition,
  type TaskTextSection,
  type TaskValidation,
  type TaskWorkUnit,
} from './types.ts';

const SECTION_NAMES = ['GEORGE TASK FORMAT', 'STACK', 'TASK', 'KIND', 'GOAL', 'VERSIONING', 'READ FIRST', 'INSPECT', 'REQUIREMENTS', 'INVARIANTS', 'WORKFLOW', 'VALIDATION', 'STOP CONDITIONS', 'DELIVERABLES', 'NON-GOALS', 'PERMISSIONS', 'EVIDENCE'] as const;
const REQUIRED_SECTIONS = ['GEORGE TASK FORMAT', 'TASK', 'KIND', 'GOAL', 'REQUIREMENTS', 'WORKFLOW', 'VALIDATION', 'STOP CONDITIONS'] as const;
type SectionName = typeof SECTION_NAMES[number];
type Section = Readonly<{ name: SectionName; line: number; value?: string; lines: readonly string[] }>;

function fail(message: string, line?: number): never {
  const diagnostic: TaskPromptDiagnostic = Object.freeze({ message: message.slice(0, 512), ...(line === undefined ? {} : { line }) });
  throw new TaskPromptParseError(Object.freeze([diagnostic]));
}

function byteLength(value: string): number { return Buffer.byteLength(value, 'utf8'); }
function frozen<T>(value: T): T { return Object.freeze(value); }
function frozenArray<T>(values: readonly T[]): readonly T[] { return frozen([...values]); }

function requiredText(section: Section): string {
  const text = section.lines.join('\n').trim();
  if (!text) fail(`${section.name} must not be empty.`, section.line);
  return text;
}

function bulletLines(section: Section): readonly string[] {
  const entries = section.lines.filter((line) => line.trim() !== '');
  if (!entries.length) fail(`${section.name} must contain at least one entry.`, section.line);
  if (entries.length > TASK_PROMPT_LIMITS.maxEntriesPerSection) fail(`${section.name} has too many entries.`, section.line);
  const result = entries.map((line, offset) => {
    const match = /^\s*-\s+(.+)$/.exec(line);
    if (!match) fail(`${section.name} entries must be bullet items.`, section.line + offset + 1);
    const value = match[1]!.trim();
    if (!value || byteLength(value) > TASK_PROMPT_LIMITS.maxEntryBytes) fail(`${section.name} entry is invalid or exceeds its limit.`, section.line + offset + 1);
    return value;
  });
  return frozenArray(result);
}

function idEntries<T extends TaskId>(section: Section, prefix: string): readonly Readonly<{ id: T; text: string }>[] {
  const entries = bulletLines(section).map((entry, index) => {
    const match = new RegExp(`^(${prefix}[1-9]\\d*):\\s*(.+)$`).exec(entry);
    if (!match) fail(`${section.name} entries must use ${prefix}<positive number>: text.`, section.line + index + 1);
    return frozen({ id: match[1]! as T, text: match[2]!.trim() });
  });
  unique(entries.map((entry) => entry.id), `${section.name} identifier`, section.line);
  return frozenArray(entries);
}

function unique(values: readonly string[], label: string, line: number): void {
  if (new Set(values).size !== values.length) fail(`Duplicate ${label}.`, line);
}

function references(value: string, prefix: 'R' | 'W', section: Section, line: number): readonly (`${typeof prefix}${number}`)[] {
  if (value === 'none') return frozenArray([]);
  const result = value.split(',').map((entry) => entry.trim());
  if (!result.length || result.some((entry) => !new RegExp(`^${prefix}[1-9]\\d*$`).test(entry))) fail(`${section.name} has an invalid ${prefix} reference.`, line);
  unique(result, `${prefix} reference`, line);
  return frozenArray(result as `${typeof prefix}${number}`[]);
}

/** Parses one literal command line into an executable and argv; it never invokes a shell. */
export function parseLiteralValidationCommand(value: string): LiteralValidationCommand {
  if (!value || value.includes('\0') || /[\r\n]/.test(value) || byteLength(value) > TASK_PROMPT_LIMITS.maxSectionBytes) fail('Validation command is invalid.');
  const words: string[] = [];
  let index = 0;
  while (index < value.length) {
    while (/\s/.test(value[index] ?? '')) index += 1;
    if (index === value.length) break;
    const quote = value[index];
    let word = '';
    let quoted = false;
    if (quote === '"' || quote === "'") {
      quoted = true;
      index += 1;
      while (index < value.length && value[index] !== quote) {
        const character = value[index++]!;
        if (character === '\\' || character === '$' || character === '`' || character === '\0') fail('Validation command contains unsupported shell syntax.');
        word += character;
      }
      if (value[index] !== quote) fail('Validation command has malformed quoting.');
      index += 1;
      if (index < value.length && !/\s/.test(value[index]!)) fail('Validation command has ambiguous quoting.');
    } else {
      while (index < value.length && !/\s/.test(value[index]!)) {
        const character = value[index++]!;
        if (/[|&;<>()$`\\*?\[\]{}~]/.test(character) || character === '\0' || character === '"' || character === "'") fail('Validation command contains unsupported shell syntax.');
        word += character;
      }
    }
    if ((!word && !quoted) || byteLength(word) > TASK_PROMPT_LIMITS.maxCommandArgumentBytes) fail('Validation command argument is invalid or exceeds its limit.');
    words.push(word);
    if (words.length > TASK_PROMPT_LIMITS.maxCommandArguments + 1) fail('Validation command has too many arguments.');
  }
  if (!words.length || !words[0] || /^[A-Za-z_][A-Za-z0-9_]*=/.test(words[0]!)) fail('Validation command executable is invalid.');
  return frozen({ kind: 'literal', executable: words[0]!, arguments: frozenArray(words.slice(1)) });
}

function parseSections(input: string): readonly Section[] {
  if (input.includes('\0') || byteLength(input) > TASK_PROMPT_LIMITS.maxPromptBytes) fail('Task prompt exceeds its safety limit.');
  const lines = input.replace(/\r\n?/g, '\n').split('\n');
  if (lines.length > TASK_PROMPT_LIMITS.maxPromptLines) fail('Task prompt has too many lines.');
  const sections: Section[] = [];
  let current: { name: SectionName; line: number; value?: string; lines: string[] } | undefined;
  const finish = () => { if (current) { if (byteLength(current.lines.join('\n')) > TASK_PROMPT_LIMITS.maxSectionBytes) fail(`${current.name} exceeds its safety limit.`, current.line); sections.push(frozen({ ...current, lines: frozenArray(current.lines) })); } };
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index]!;
    const match = /^([A-Z][A-Z -]*)(?::\s*(.*))?$/.exec(line);
    if (match) {
      const name = match[1]!;
      if (!SECTION_NAMES.includes(name as SectionName)) fail(`Unknown top-level section: ${name}.`, index + 1);
      finish();
      current = { name: name as SectionName, line: index + 1, ...(match[2] === undefined ? {} : { value: match[2]! }), lines: [] };
      continue;
    }
    if (!current) { if (line.trim()) fail('Task prompt content must follow a section header.', index + 1); continue; }
    current.lines.push(line);
  }
  finish();
  if (sections.length > SECTION_NAMES.length) fail('Task prompt has too many sections.');
  unique(sections.map((section) => section.name), 'top-level section', 1);
  for (const name of REQUIRED_SECTIONS) if (!sections.some((section) => section.name === name)) fail(`Missing required section: ${name}.`);
  return frozenArray(sections);
}

function section(sections: readonly Section[], name: SectionName): Section | undefined { return sections.find((item) => item.name === name); }
function mustSection(sections: readonly Section[], name: SectionName): Section { const found = section(sections, name); if (!found) fail(`Missing required section: ${name}.`); return found; }
function headerValue(value: Section): string {
  const text = value.value?.trim();
  if (!text || byteLength(text) > TASK_PROMPT_LIMITS.maxEntryBytes || value.lines.some((line) => line.trim())) fail(`${value.name} must use one bounded header value.`, value.line);
  return text;
}

function parseWork(section_: Section, requirements: ReadonlySet<string>): readonly TaskWorkUnit[] {
  const entries: TaskWorkUnit[] = [];
  const header = /^(W[1-9]\d*)\s+—\s+(.+)$/;
  for (let index = 0; index < section_.lines.length;) {
    if (!section_.lines[index]!.trim()) { index += 1; continue; }
    const match = header.exec(section_.lines[index]!);
    if (!match) fail('WORKFLOW work units must start with W<number> — title.', section_.line + index + 1);
    const start = index++; const id = match[1]! as `W${number}`; const title = match[2]!.trim();
    if (byteLength(title) > TASK_PROMPT_LIMITS.maxEntryBytes) fail('WORKFLOW title exceeds its limit.', section_.line + start + 1);
    const fields = new Map<string, string>(); const description: string[] = []; const completeWhen: string[] = [];
    let inCompleteWhen = false;
    while (index < section_.lines.length && !header.test(section_.lines[index]!)) {
      const line = section_.lines[index++]!;
      if (!line.trim()) continue;
      const field = /^(Covers|Depends on|Complete when):\s*(.*)$/.exec(line);
      if (field) {
        const name = field[1]!;
        if (name === 'Complete when') { if (inCompleteWhen || field[2]!.trim()) fail('WORKFLOW Complete when must be followed by bullet criteria.', section_.line + index); inCompleteWhen = true; continue; }
        if (fields.has(name)) fail(`Duplicate WORKFLOW ${name}.`, section_.line + index);
        fields.set(name, field[2]!.trim()); continue;
      }
      if (inCompleteWhen) {
        const criterion = /^\s*-\s+(.+)$/.exec(line);
        if (!criterion) fail('WORKFLOW completion criteria must be bullet items.', section_.line + index);
        completeWhen.push(criterion[1]!.trim());
      } else description.push(line.trim());
    }
    if (!fields.has('Covers') || !fields.has('Depends on')) fail('WORKFLOW work units require Covers and Depends on.', section_.line + start + 1);
    const covers = references(fields.get('Covers')!, 'R', section_, section_.line + start + 1) as readonly `R${number}`[];
    if (covers.some((reference) => !requirements.has(reference))) fail('WORKFLOW references an unknown requirement.', section_.line + start + 1);
    if (completeWhen.length > TASK_PROMPT_LIMITS.maxEntriesPerSection || description.some((item) => byteLength(item) > TASK_PROMPT_LIMITS.maxEntryBytes) || completeWhen.some((item) => byteLength(item) > TASK_PROMPT_LIMITS.maxEntryBytes)) fail('WORKFLOW text exceeds its safety limit.', section_.line + start + 1);
    entries.push(frozen({ id, title, covers, dependsOn: references(fields.get('Depends on')!, 'W', section_, section_.line + start + 1) as readonly `W${number}`[], description: frozenArray(description), completeWhen: frozenArray(completeWhen) }));
  }
  if (!entries.length) fail('WORKFLOW must contain at least one work unit.', section_.line);
  if (entries.length > TASK_PROMPT_LIMITS.maxEntriesPerSection) fail('WORKFLOW has too many work units.', section_.line);
  unique(entries.map((entry) => entry.id), 'WORKFLOW identifier', section_.line);
  const ids = new Set(entries.map((entry) => entry.id));
  if (entries.some((entry) => entry.dependsOn.some((dependency) => !ids.has(dependency)))) fail('WORKFLOW references an unknown work unit.', section_.line);
  const order = entries.map((entry) => Number(entry.id.slice(1)));
  if (order.some((value, index) => index > 0 && value <= order[index - 1]!)) fail('WORKFLOW identifiers must be authored in increasing order.', section_.line);
  const visiting = new Set<string>(); const complete = new Set<string>();
  const visit = (id: string): void => { if (visiting.has(id)) fail('WORKFLOW dependencies contain a cycle.', section_.line); if (complete.has(id)) return; visiting.add(id); for (const dependency of entries.find((entry) => entry.id === id)!.dependsOn) visit(dependency); visiting.delete(id); complete.add(id); };
  for (const entry of entries) visit(entry.id);
  return frozenArray(entries);
}

function parseValidation(section_: Section, requirements: ReadonlySet<string>): readonly TaskValidation[] {
  const entries: TaskValidation[] = []; const header = /^(V[1-9]\d*)\s+—\s+(.+)$/;
  for (let index = 0; index < section_.lines.length;) {
    if (!section_.lines[index]!.trim()) { index += 1; continue; }
    const match = header.exec(section_.lines[index]!); if (!match) fail('VALIDATION entries must start with V<number> — title.', section_.line + index + 1);
    const start = index++; const fields = new Map<string, string>();
    if (byteLength(match[2]!.trim()) > TASK_PROMPT_LIMITS.maxEntryBytes) fail('VALIDATION title exceeds its limit.', section_.line + start + 1);
    while (index < section_.lines.length && !header.test(section_.lines[index]!)) {
      const line = section_.lines[index++]!; if (!line.trim()) continue;
      const field = /^(Covers|Run|Scope):\s*(.*)$/.exec(line); if (!field) fail('VALIDATION entries may only contain Covers, Run, and Scope.', section_.line + index);
      if (fields.has(field[1]!)) fail(`Duplicate VALIDATION ${field[1]}.`, section_.line + index); fields.set(field[1]!, field[2]!.trim());
    }
    if (!fields.has('Covers') || !fields.has('Run')) fail('VALIDATION entries require Covers and Run.', section_.line + start + 1);
    const covers = references(fields.get('Covers')!, 'R', section_, section_.line + start + 1) as readonly `R${number}`[];
    if (covers.some((reference) => !requirements.has(reference))) fail('VALIDATION references an unknown requirement.', section_.line + start + 1);
    const run = fields.get('Run')!;
    let command: LiteralValidationCommand | DiscoverValidationCommand;
    if (run === 'DISCOVER') { const scope = fields.get('Scope'); if (!scope || byteLength(scope) > TASK_PROMPT_LIMITS.maxEntryBytes) fail('DISCOVER validation requires a bounded Scope.', section_.line + start + 1); command = frozen({ kind: 'discover', scope }); }
    else { if (fields.has('Scope')) fail('Literal validation must not include Scope.', section_.line + start + 1); command = parseLiteralValidationCommand(run); }
    entries.push(frozen({ id: match[1]! as `V${number}`, title: match[2]!.trim(), covers, command }));
  }
  if (!entries.length) fail('VALIDATION must contain at least one entry.', section_.line);
  unique(entries.map((entry) => entry.id), 'VALIDATION identifier', section_.line);
  return frozenArray(entries);
}

function parsePermissions(section_: Section | undefined): PermissionExpectation {
  if (!section_) return frozen({});
  const allowed: Record<string, readonly string[]> = { Workspace: ['standard', 'autonomous'], 'Outside workspace': ['reject', 'ask'], Network: ['reject', 'ask'], 'Remote mutation': ['reject', 'ask'] };
  const values: Record<string, string> = {};
  for (const entry of bulletLines(section_)) { const match = /^([^:]+):\s*(.+)$/.exec(entry); if (!match || !(match[1]! in allowed) || !allowed[match[1]!]!.includes(match[2]!)) fail('PERMISSIONS value is invalid.', section_.line); if (match[1]! in values) fail('Duplicate PERMISSIONS field.', section_.line); values[match[1]!] = match[2]!; }
  return frozen({ ...(values.Workspace === undefined ? {} : { workspace: values.Workspace as PermissionExpectation['workspace'] }), ...(values['Outside workspace'] === undefined ? {} : { outsideWorkspace: values['Outside workspace'] as PermissionExpectation['outsideWorkspace'] }), ...(values.Network === undefined ? {} : { network: values.Network as PermissionExpectation['network'] }), ...(values['Remote mutation'] === undefined ? {} : { remoteMutation: values['Remote mutation'] as PermissionExpectation['remoteMutation'] }) });
}

function textSection(section_: Section | undefined): TaskTextSection | undefined { if (!section_) return undefined; return frozen({ lines: frozenArray(requiredText(section_).split('\n')) }); }

export function parseTaskPrompt(input: string): TaskPromptParseResult {
  const marker = /^GEORGE TASK FORMAT:\s*/m.exec(input);
  if (!marker) return frozen({ kind: 'ordinary' });
  const sections = parseSections(input);
  const format = headerValue(mustSection(sections, 'GEORGE TASK FORMAT'));
  if (format !== '1') fail('Unsupported GEORGE TASK FORMAT version.', mustSection(sections, 'GEORGE TASK FORMAT').line);
  const taskHeader = headerValue(mustSection(sections, 'TASK'));
  const taskMatch = /^P([1-9]\d*)\s+—\s+(.+)$/.exec(taskHeader);
  if (!taskMatch || byteLength(taskMatch[2]!.trim()) > TASK_PROMPT_LIMITS.maxEntryBytes) fail('TASK must use P<number> — title form.', mustSection(sections, 'TASK').line);
  const stack = section(sections, 'STACK'); const stackValue = stack === undefined ? undefined : headerValue(stack);
  if (stackValue !== undefined && !/^[a-z0-9][a-z0-9-]*$/.test(stackValue)) fail('STACK is invalid.', stack!.line);
  const kind = headerValue(mustSection(sections, 'KIND'));
  if (!(['implementation', 'qualification', 'correction', 'closeout'] as const).includes(kind as TaskKind)) fail('KIND is invalid.', mustSection(sections, 'KIND').line);
  const requirements = idEntries(mustSection(sections, 'REQUIREMENTS'), 'R') as readonly TaskRequirement[];
  const invariants = section(sections, 'INVARIANTS') === undefined ? frozenArray<TaskInvariant>([]) : idEntries(section(sections, 'INVARIANTS')!, 'I') as readonly TaskInvariant[];
  const stops = idEntries(mustSection(sections, 'STOP CONDITIONS'), 'S') as readonly TaskStopCondition[];
  const deliverables = section(sections, 'DELIVERABLES') === undefined ? frozenArray<TaskDeliverable>([]) : idEntries(section(sections, 'DELIVERABLES')!, 'D') as readonly TaskDeliverable[];
  const requirementIds = new Set(requirements.map((item) => item.id));
  const readFirst = section(sections, 'READ FIRST') === undefined ? frozenArray<TaskReadFirstEntry>([]) : frozenArray(bulletLines(section(sections, 'READ FIRST')!).map((entry) => { const found = /^(REQUIRED|OPTIONAL):\s*(.+)$/.exec(entry); if (!found) fail('READ FIRST entries must use REQUIRED or OPTIONAL.', section(sections, 'READ FIRST')!.line); return frozen({ required: found[1] === 'REQUIRED', source: found[2]!.trim() }); }));
  unique(readFirst.map((entry) => entry.source), 'READ FIRST source', section(sections, 'READ FIRST')?.line ?? 1);
  const inspect = section(sections, 'INSPECT') === undefined ? frozenArray<string>([]) : bulletLines(section(sections, 'INSPECT')!);
  const nonGoals = section(sections, 'NON-GOALS') === undefined ? frozenArray<string>([]) : bulletLines(section(sections, 'NON-GOALS')!);
  const versioning = textSection(section(sections, 'VERSIONING'));
  const evidence = textSection(section(sections, 'EVIDENCE'));
  const definition: TaskDefinition = frozen({ format: 1, ...(stackValue === undefined ? {} : { stack: stackValue }), task: frozen({ title: taskMatch[2]!.trim(), ordinal: Number(taskMatch[1]) }), kind: kind as TaskKind, goal: textSection(mustSection(sections, 'GOAL'))!, readFirst, inspect, requirements, invariants, workflow: parseWork(mustSection(sections, 'WORKFLOW'), requirementIds), validations: parseValidation(mustSection(sections, 'VALIDATION'), requirementIds), stopConditions: stops, deliverables, nonGoals, permissions: parsePermissions(section(sections, 'PERMISSIONS')), ...(versioning === undefined ? {} : { versioning }), ...(evidence === undefined ? {} : { evidence }) });
  return frozen({ kind: 'structured', task: definition });
}
