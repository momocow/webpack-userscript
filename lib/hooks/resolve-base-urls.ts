import { URL } from 'node:url';

import { HeadersProps } from '../headers';
import { Reducer, ReducerFactory, UserscriptHooks } from '../hook';

export interface ResolveBaseURLsOptions {
  downloadBaseURL: string | URL;
  updateBaseURL?: string | URL;
  metajs?: boolean;
}

export class ResolveBaseURLs extends ReducerFactory<
  HeadersProps,
  ResolveBaseURLsOptions
> {
  public enable(): boolean {
    return this.options.downloadBaseURL !== undefined;
  }

  public reducer(): Reducer<HeadersProps> {
    const { downloadBaseURL, updateBaseURL, metajs } = this
      .options as ResolveBaseURLsOptions;

    return (headers, { fileInfo: { userjsFile, metajsFile } }) => {
      if (headers.downloadURL === undefined) {
        return {
          ...headers,
          downloadURL: new URL(userjsFile, downloadBaseURL).toString(),
        };
      }

      if (headers.updateURL === undefined) {
        return {
          ...headers,
          updateURL: metajs
            ? new URL(metajsFile, updateBaseURL).toString()
            : updateBaseURL !== undefined
            ? new URL(userjsFile, updateBaseURL).toString()
            : headers.downloadURL,
        };
      }

      return headers;
    };
  }

  protected applyReducer({ hooks }: UserscriptHooks): void {
    this.tapReducer(hooks.headers);
  }
}
