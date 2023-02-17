import { InternalPlugin, UserscriptHooks } from '../hook';

export class SetDefaultMatch extends InternalPlugin {
  public apply({ hooks }: UserscriptHooks): void {
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
