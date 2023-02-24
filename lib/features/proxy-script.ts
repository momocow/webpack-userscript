import { URL } from 'node:url';

import { UserscriptPluginInstance } from '../types';
import { Feature } from './feature';

export interface ProxyScriptFeatureOptions {
  filename?: string;
  baseUrl?: string;
}

export interface ProxyScriptOptions {
  proxyScript?: ProxyScriptFeatureOptions;
}

export class ProcessProxyScript extends Feature<ProxyScriptOptions> {
  public readonly name = 'ProcessProxyScript';

  public apply({ hooks }: UserscriptPluginInstance): void {
    const { proxyScript } = this.options;

    if (proxyScript) {
      hooks.proxyHeaders.tap(
        this.name,
        (headers, { fileInfo: { userjsFile } }) => {
          const devBaseUrl = !proxyScript.baseUrl
            ? 'http://localhost:8080/'
            : proxyScript.baseUrl;

          const requireTags = Array.isArray(headers.require)
            ? headers.require
            : typeof headers.require === 'string'
            ? [headers.require]
            : [];

          headers = {
            ...headers,
            require: [
              ...requireTags,
              new URL(userjsFile, devBaseUrl).toString(),
            ],
            downloadURL: undefined,
            updateURL: undefined,
            installURL: undefined,
          };

          return headers;
        },
      );

      hooks.proxyScriptFile.tap(this.name, () => {
        if (!proxyScript.filename) {
          return '[basename].proxy.user.js';
        } else {
          return proxyScript.filename;
        }
      });
    }
  }
}
