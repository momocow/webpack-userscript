import { StrictHeadersProps, UserscriptPluginInstance } from '../types';
import { Feature } from './feature';

export class FixTags extends Feature {
  public readonly name = 'FixTags';

  public readonly fixableTagNames = new Map<string, keyof StrictHeadersProps>([
    ['updateUrl', 'updateURL'],
    ['iconUrl', 'iconURL'],
    ['icon64Url', 'icon64URL'],
    ['installUrl', 'installURL'],
    ['supportUrl', 'supportURL'],
    ['downloadUrl', 'downloadURL'],
    ['homepageUrl', 'homepageURL'],
  ]);

  public apply({ hooks }: UserscriptPluginInstance): void {
    hooks.headers.tap(this.name, (headers) => {
      for (const [source, target] of this.fixableTagNames) {
        if (headers[source] !== undefined) {
          if (headers[target] !== undefined) {
            throw new Error(`ambiguous tags: ("${source}", "${target}")`);
          }

          headers = {
            ...headers,
            [source]: undefined,
            [target]: headers[source],
          };
        }
      }

      return headers;
    });
  }
}
