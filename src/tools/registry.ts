import {
  asGeorgeError,
  cancellationError,
  type GeorgeErrorShape,
  type JsonObject,
  type JsonValue,
  type ProviderToolDefinition,
  type ProviderToolResult,
} from '../core/index.ts';

export type ToolPermission = 'read' | 'write' | 'process';

export type ToolInputSchema =
  | Readonly<{
      type: 'object';
      properties: Readonly<Record<string, ToolInputSchema>>;
      required?: readonly string[];
      additionalProperties: false;
    }>
  | Readonly<{ type: 'array'; items: ToolInputSchema; minItems?: number; maxItems?: number }>
  | Readonly<{ type: 'string'; minLength?: number; maxLength?: number }>
  | Readonly<{ type: 'number'; minimum?: number; maximum?: number }>
  | Readonly<{ type: 'integer'; minimum?: number; maximum?: number }>
  | Readonly<{ type: 'boolean' }>
  | Readonly<{ type: 'null' }>;

export type ToolDefinition = Readonly<{
  name: string;
  description: string;
  inputSchema: ToolInputSchema;
  permission: ToolPermission;
  execute: (arguments_: JsonObject, options: ToolExecutionOptions) => Promise<JsonValue>;
}>;

/** `input` is internal process stdin, not part of any model-visible tool schema. */
export type ToolExecutionOptions = Readonly<{ signal?: AbortSignal; input?: string }>;
export type ToolCall = Readonly<{ callId: string; name: string; arguments: string }>;
export type ToolResult = ProviderToolResult;
export type ValidatedToolCall = Readonly<{ definition: ToolDefinition; arguments: JsonObject }>;

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
      tools.set(definition.name, definition);
    }
    this.registrations = definitions;
    this.byName = tools;
    this.definitions = definitions.map(({ name, description, inputSchema }) => ({ name, description, inputSchema: schemaJson(inputSchema) }));
  }

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
