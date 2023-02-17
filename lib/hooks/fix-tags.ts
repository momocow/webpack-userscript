import { StrictHeadersProps } from '../headers';
import { InternalPlugin, UserscriptHooks } from '../hook';

export class FixTags extends InternalPlugin {
  public readonly fixableTagNames = new Map<string, keyof StrictHeadersProps>([
    ['updateUrl', 'updateURL'],
    ['iconUrl', 'iconURL'],
    ['icon64Url', 'icon64URL'],
    ['installUrl', 'installURL'],
    ['supportUrl', 'supportURL'],
    ['downloadUrl', 'downloadURL'],
    ['homepageUrl', 'homepageURL'],
  ]);

  public apply({ hooks }: UserscriptHooks): void {
    hooks.headers.tap(this.constructor.name, (headers) => {
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
