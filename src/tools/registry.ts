import {
  asGeorgeError,
  cancellationError,
  type GeorgeErrorShape,
  type JsonObject,
  type JsonValue,
  type ProviderToolDefinition,
  type ProviderToolResult,
  type ToolEffect,
  type ToolExecutionMetadata,
  type ToolReplaySafety,
  type ToolSource,
  type ToolExecutionDescriptor,
} from '../core/index.ts';

export type { ToolEffect, ToolExecutionMetadata, ToolExecutionDescriptor, ToolReplaySafety, ToolSource } from '../core/index.ts';

export type ToolInputSchema =
  | Readonly<{
      type: 'object';
      properties: Readonly<Record<string, ToolInputSchema>>;
      required?: readonly string[];
      additionalProperties: false;
    }>
  | Readonly<{ type: 'array'; items: ToolInputSchema; minItems?: number; maxItems?: number }>
  | Readonly<{ type: 'string'; minLength?: number; maxLength?: number; description?: string }>
  | Readonly<{ type: 'number'; minimum?: number; maximum?: number }>
  | Readonly<{ type: 'integer'; minimum?: number; maximum?: number }>
  | Readonly<{ type: 'boolean' }>
  | Readonly<{ type: 'null' }>;

export type ToolDefinition = Readonly<{
  name: string;
  description: string;
  inputSchema: ToolInputSchema;
  execution: ToolExecutionMetadata;
  execute: (arguments_: JsonObject, options: ToolExecutionOptions) => Promise<JsonValue>;
}>;

/** `input` is internal process stdin, not part of any model-visible tool schema. */
export type ToolExecutionOptions = Readonly<{ signal?: AbortSignal; input?: string }>;
export type ToolCall = Readonly<{ callId: string; name: string; arguments: string }>;
export type ToolResult = ProviderToolResult;
export type ValidatedToolCall = Readonly<{ definition: ToolDefinition; arguments: JsonObject }>;

const EFFECTS: readonly ToolEffect[] = ['local_read', 'workspace_mutation', 'sandboxed_workspace_process', 'host_process', 'external_read', 'remote_mutation', 'browser_observation', 'browser_interaction', 'unknown_external'];

function boundedText(value: unknown, name: string, maximum = 256): string {
  if (typeof value !== 'string' || !value.trim() || Buffer.byteLength(value, 'utf8') > maximum || /[\u0000-\u001f\u007f]/.test(value)) throw new Error(`Invalid tool execution ${name}.`);
  return value;
}

/** Normalize once at registration so all event/approval consumers see safe George-owned metadata. */
function executionMetadata(value: ToolExecutionMetadata): ToolExecutionMetadata {
  if (!EFFECTS.includes(value.effect)) throw new Error('Invalid tool execution effect.');
  if (value.replaySafety !== 'replay_safe' && value.replaySafety !== 'not_replay_safe') throw new Error('Invalid tool replay safety.');
  const source = value.source;
  if (source.kind === 'builtin') {
    if (Object.keys(source).length !== 1) throw new Error('Invalid builtin tool source.');
  } else if (source.kind === 'plugin') {
    boundedText(source.id, 'plugin source', 128);
  } else if (source.kind === 'adapter') {
    boundedText(source.id, 'adapter source', 128);
    if (source.server !== undefined) boundedText(source.server, 'adapter server', 128);
  } else throw new Error('Invalid tool source.');
  if (value.descriptor?.credentialConfigured !== undefined && typeof value.descriptor.credentialConfigured !== 'boolean') throw new Error('Invalid tool credential state.');
  const descriptor = value.descriptor === undefined ? undefined : {
    ...(value.descriptor.service === undefined ? {} : { service: boundedText(value.descriptor.service, 'service') }),
    ...(value.descriptor.origin === undefined ? {} : { origin: boundedText(value.descriptor.origin, 'origin', 512) }),
    ...(value.descriptor.resource === undefined ? {} : { resource: boundedText(value.descriptor.resource, 'resource', 512) }),
    ...(value.descriptor.operation === undefined ? {} : { operation: boundedText(value.descriptor.operation, 'operation') }),
    ...(value.descriptor.warning === undefined ? {} : { warning: boundedText(value.descriptor.warning, 'warning', 512) }),
    ...(value.descriptor.credentialConfigured === undefined ? {} : { credentialConfigured: value.descriptor.credentialConfigured }),
  };
  return { effect: value.effect, replaySafety: value.replaySafety, source, ...(descriptor === undefined ? {} : { descriptor }) };
}

function schemaJson(schema: ToolInputSchema): JsonObject {
  return schema as unknown as JsonObject;
}

function validationError(message: string): GeorgeErrorShape {
  return { code: 'validation', message };
}

function valid(schema: ToolInputSchema, value: unknown): boolean {
  switch (schema.type) {
    case 'null': return value === null;
    case 'boolean': return typeof value === 'boolean';
    case 'string': return typeof value === 'string'
      && (schema.minLength === undefined || value.length >= schema.minLength)
      && (schema.maxLength === undefined || value.length <= schema.maxLength);
    case 'number': return typeof value === 'number' && Number.isFinite(value)
      && (schema.minimum === undefined || value >= schema.minimum)
      && (schema.maximum === undefined || value <= schema.maximum);
    case 'integer': return typeof value === 'number' && Number.isInteger(value)
      && (schema.minimum === undefined || value >= schema.minimum)
      && (schema.maximum === undefined || value <= schema.maximum);
    case 'array': return Array.isArray(value)
      && (schema.minItems === undefined || value.length >= schema.minItems)
      && (schema.maxItems === undefined || value.length <= schema.maxItems)
      && value.every((item) => valid(schema.items, item));
    case 'object': {
      if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
      const object = value as Record<string, unknown>;
      if ((schema.required ?? []).some((key) => !(key in object))) return false;
      return Object.entries(object).every(([key, item]) => {
        if (!(key in schema.properties)) return false;
        return valid(schema.properties[key]!, item);
      });
    }
  }
}

export class ToolRegistry {
  readonly registrations: readonly ToolDefinition[];
  readonly definitions: readonly ProviderToolDefinition[];
  private readonly byName: ReadonlyMap<string, ToolDefinition>;

  constructor(definitions: readonly ToolDefinition[]) {
    const tools = new Map<string, ToolDefinition>();
    for (const definition of definitions) {
      if (!definition.name || tools.has(definition.name)) throw new Error(`Invalid duplicate tool name: ${definition.name}`);
      tools.set(definition.name, { ...definition, execution: executionMetadata(definition.execution) });
    }
    this.registrations = [...tools.values()];
    this.byName = tools;
    this.definitions = definitions.map(({ name, description, inputSchema }) => ({ name, description, inputSchema: schemaJson(inputSchema) }));
  }

  registration(name: string): ToolDefinition | undefined { return this.byName.get(name); }

  /** Returns a capability-reducing view of this registry using the original registrations. */
  select(names: readonly string[]): ToolRegistry {
    const selected = new Set(names);
    for (const name of selected) {
      if (!this.byName.has(name)) throw new Error(`Unknown registered tool: ${name}`);
    }
    return new ToolRegistry(this.registrations.filter((definition) => selected.has(definition.name)));
  }

  validate(call: ToolCall): ValidatedToolCall | ToolResult {
    const definition = this.byName.get(call.name);
    if (!definition) return { callId: call.callId, name: call.name, result: { ok: false, error: validationError(`Unknown tool: ${call.name}.`) } };

    let arguments_: unknown;
    try {
      arguments_ = JSON.parse(call.arguments);
    } catch {
      return { callId: call.callId, name: call.name, result: { ok: false, error: validationError(`Tool ${call.name} arguments must be valid JSON.`) } };
    }
    if (!valid(definition.inputSchema, arguments_)) {
      return { callId: call.callId, name: call.name, result: { ok: false, error: validationError(`Tool ${call.name} arguments do not match its input schema.`) } };
    }
    return { definition, arguments: arguments_ as JsonObject };
  }

  async dispatch(call: ToolCall, options: ToolExecutionOptions = {}): Promise<ToolResult> {
    const definition = this.validate(call);
    if ('callId' in definition) return definition;
    if (options.signal?.aborted) throw cancellationError(options.signal)!;
    try {
      const value = await definition.definition.execute(definition.arguments, options);
      if (options.signal?.aborted) throw cancellationError(options.signal)!;
      return { callId: call.callId, name: call.name, result: { ok: true, value } };
    } catch (error) {
      const normalized = asGeorgeError(error, 'tool');
      if (normalized.code === 'cancelled') throw normalized;
      return { callId: call.callId, name: call.name, result: { ok: false, error: { code: normalized.code, message: normalized.message } } };
    }
  }
}
