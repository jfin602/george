export type GeorgeErrorCode =
  | 'cancelled'
  | 'configuration'
  | 'provider'
  | 'tool'
  | 'validation';

export type GeorgeErrorShape = Readonly<{
  code: GeorgeErrorCode;
  message: string;
  cause?: unknown;
}>;

export class GeorgeError extends Error implements GeorgeErrorShape {
  readonly code: GeorgeErrorCode;

  constructor(code: GeorgeErrorCode, message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'GeorgeError';
    this.code = code;
  }
}

export function asGeorgeError(
  error: unknown,
  code: GeorgeErrorCode = 'provider',
): GeorgeError {
  if (error instanceof GeorgeError) return error;
  return new GeorgeError(
    code,
    error instanceof Error ? error.message : String(error),
    { cause: error },
  );
}
