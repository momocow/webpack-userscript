import { URL } from 'url';

import { HeadersProps } from '../headers';
import { Reducer, ReducerFactory, UserscriptHooks } from '../hook';

export interface ProxyScriptReducerOptions {
  filename?: string;
  baseUrl?: string;
}

export interface ProxyScriptOptions {
  proxyScript: true | ProxyScriptReducerOptions;
}

export class ProcessProxyScript extends ReducerFactory<
  HeadersProps,
  ProxyScriptOptions
> {
  public enable(): boolean {
    return !!this.options.proxyScript;
  }

  public reducer(): Reducer<HeadersProps> {
    const { proxyScript } = this.options as ProxyScriptOptions;

    return (headers, { fileInfo: { userjsFile } }) => {
      if (proxyScript) {
        const devBaseUrl =
          proxyScript === true || proxyScript.baseUrl === undefined
            ? 'http://localhost:8080/'
            : proxyScript.baseUrl;

        const requireTags = Array.isArray(headers.require)
          ? headers.require
          : typeof headers.require === 'string'
          ? [headers.require]
          : [];

        headers = {
          ...headers,
          require: [...requireTags, new URL(userjsFile, devBaseUrl).toString()],
          downloadURL: undefined,
          updateURL: undefined,
          installURL: undefined,
        };
      }

      return headers;
    };
  }

  protected applyReducer({ hooks }: UserscriptHooks): void {
    this.tapReducer(hooks.proxyHeaders);

    new ProxyScriptFile(this.options).apply({ hooks });
  }
}

export class ProxyScriptFile extends ReducerFactory<
  string | undefined,
  ProxyScriptOptions
> {
  public reducer(): Reducer<string | undefined> {
    const { proxyScript } = this.options as ProxyScriptOptions;

    return () => {
      if (proxyScript === true || proxyScript.filename === undefined) {
        return '[basename].proxy.user.js';
      } else {
        return proxyScript.filename;
      }
    };
  }

  protected applyReducer({ hooks }: UserscriptHooks): void {
    this.tapReducer(hooks.proxyScriptFile);
  }
}
