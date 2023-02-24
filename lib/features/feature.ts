import { UserscriptPluginInstance } from '../types';

export abstract class Feature<Options = unknown> {
  public constructor(public readonly options: Options) {}

  public abstract readonly name: string;
  public abstract apply(plugin: UserscriptPluginInstance): void;
}
