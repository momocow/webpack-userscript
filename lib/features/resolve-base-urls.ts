import { URL } from 'node:url';

import { UserscriptPluginInstance } from '../types';
import { Feature } from './feature';

export interface ResolveBaseURLsOptions {
  downloadBaseURL?: string | URL;
  updateBaseURL?: string | URL;
  metajs?: boolean;
}

export class ResolveBaseURLs extends Feature<ResolveBaseURLsOptions> {
  public readonly name = 'ResolveBaseURLs';

  public apply({ hooks }: UserscriptPluginInstance): void {
    const { metajs, downloadBaseURL, updateBaseURL } = this.options;

    if (downloadBaseURL === undefined) {
      return;
    }

    hooks.headers.tap(
      this.name,
      (headers, { fileInfo: { userjsFile, metajsFile } }) => {
        if (headers.downloadURL === undefined) {
          headers = {
            ...headers,
            downloadURL: new URL(userjsFile, downloadBaseURL).toString(),
          };
        }

        if (headers.updateURL === undefined) {
          headers = {
            ...headers,
            updateURL: new URL(
              metajs ? metajsFile : userjsFile,
              updateBaseURL ?? downloadBaseURL,
            ).toString(),
          };
        }

        return headers;
      },
    );
  }
}
