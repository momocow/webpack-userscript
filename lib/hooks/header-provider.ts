import { CompileContext } from '../types';
import { HeadersProps } from '../headers';
import { InternalPlugin, UserscriptHooks } from '../hook';

export interface HeadersProviderOptions {
  headers: (headers: HeadersProps, ctx: CompileContext);
}

export class HeadersProvider extends InternalPlugin<HeadersProviderOptions> {
  public enable(): boolean {
    return typeof this.options.headers === 'function';
  }

  public reducer(): Reducer<HeadersProps> | AsyncReducer<HeadersProps> {
    return (this.options as HeadersProviderOptions).headers;
  }

  public apply({ hooks }: UserscriptHooks): void {
    if (typeof this.options.headers === 'function') {
    }
    hooks.headers.tapPromise(this.constructor.name);
  }
}
