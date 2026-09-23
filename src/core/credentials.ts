/** Executor-only credential boundary. Callers may expose configured state, never returned values. */
export type CredentialResolver = Readonly<{
  resolve: (reference: string) => Promise<string | undefined>;
}>;

function reference(value: string): string {
  if (!/^[A-Z][A-Z0-9_]{0,127}$/.test(value)) throw new Error('Invalid credential reference.');
  return value;
}

export class EnvironmentCredentialResolver implements CredentialResolver {
  private readonly environment: Readonly<Record<string, string | undefined>>;

  constructor(environment: Readonly<Record<string, string | undefined>> = process.env) {
    this.environment = environment;
  }

  async resolve(name: string): Promise<string | undefined> {
    const value = this.environment[reference(name)];
    return value && !value.includes('\0') ? value : undefined;
  }
}
