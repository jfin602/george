import { GeorgeError } from '../core/index.ts';
import { PluginManager, type EnabledPlugin, type PluginRecord } from '../plugins/index.ts';

export type PluginCommand = Readonly<{ id: string; pluginId: string; skillId: string }>;
export type PluginCommandTarget = Readonly<{ skillTurn(id: string, input: string): Promise<Readonly<{ input: string; activatedSkills?: readonly string[] }>> }>;

/** Application-owned mapping: plugin commands select declarative skills and nothing executable. */
export class PluginCommandRegistry {
  private readonly commands = new Map<string, PluginCommand>();

  constructor(plugins: readonly EnabledPlugin[]) {
    for (const plugin of plugins) for (const command of plugin.manifest.commands) {
      const id = `plugin:${plugin.manifest.id}:${command.id}`;
      if (this.commands.has(id)) throw new GeorgeError('configuration', `Duplicate plugin command: ${id}.`);
      this.commands.set(id, { id, pluginId: plugin.manifest.id, skillId: `plugin:${plugin.manifest.id}:${command.skill}` });
    }
  }

  list(): readonly PluginCommand[] { return [...this.commands.values()].sort((left, right) => left.id.localeCompare(right.id)); }

  async activate(target: PluginCommandTarget, id: string, input: string): Promise<Readonly<{ input: string; activatedSkills?: readonly string[] }>> {
    const command = this.commands.get(id);
    if (!command) throw new GeorgeError('validation', `Unknown plugin command ${id}.`);
    return target.skillTurn(command.skillId, input);
  }
}

export class PluginApplicationService {
  readonly manager: PluginManager;
  readonly commands: PluginCommandRegistry;
  private readonly target: PluginCommandTarget;

  constructor(manager: PluginManager, commands: PluginCommandRegistry, target: PluginCommandTarget) {
    this.manager = manager;
    this.commands = commands;
    this.target = target;
  }

  list(): Promise<readonly PluginRecord[]> { return this.manager.list(); }
  install(path: string): Promise<PluginRecord> { return this.manager.install(path); }
  enable(id: string): Promise<PluginRecord> { return this.manager.enable(id); }
  disable(id: string): Promise<PluginRecord> { return this.manager.disable(id); }
  uninstall(id: string): Promise<void> { return this.manager.uninstall(id); }
  listCommands(): readonly PluginCommand[] { return this.commands.list(); }
  activate(id: string, input: string): Promise<Readonly<{ input: string; activatedSkills?: readonly string[] }>> { return this.commands.activate(this.target, id, input); }
}
