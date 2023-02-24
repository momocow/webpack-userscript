import { UserscriptPluginInstance } from '../types';
import { Feature } from './feature';

export class SetDefaultTags extends Feature {
  public readonly name = 'SetDefaultTags';

  public apply({ hooks }: UserscriptPluginInstance): void {
    hooks.headers.tap(this.constructor.name, (headers) => {
      if (headers.include === undefined && headers.match === undefined) {
        return {
          ...headers,
          match: '*://*/*',
        };
      }

      return headers;
    });
  }
}
