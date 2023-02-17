import fetch from 'node-fetch';
import pLimit from 'p-limit';
import {
  fromStream,
  IntegrityMap,
  parse as parseSSRI,
  stringify as stringifySSRI,
} from 'ssri';
import { Readable } from 'stream';
import { URL } from 'url';

import { HeadersProps } from '../headers';
import { AsyncReducer, ReducerFactory, UserscriptHooks } from '../hook';
import { CompilerData } from '../types';

export type SSRILock = Record<string, string>;

export type SSRIMap = Map<string, IntegrityMap>;

export type SSRIAlgorithm = 'sha256' | 'sha384' | 'sha512';

export type SSRITag = 'require' | 'resource';

export type URLFilter = (tag: SSRITag, value: URL) => boolean;

export interface SSRIReducerOptions {
  include?: URLFilter;
  exclude?: URLFilter;
  algorithms?: SSRIAlgorithm[];
  strict?: boolean;
  lock?: boolean | string;
  concurrency?: number;
}

export interface SSRIOptions {
  ssri: true | SSRIReducerOptions;
}

export interface SSRIContext extends CompilerData {
  ssriLock?: SSRILock;
}

export class ProcessSSRI extends ReducerFactory<
  HeadersProps,
  SSRIOptions,
  SSRIContext
> {
  public readonly allowedProtocols = new Set(['http:', 'https:']);

  private readonly limit = pLimit(
    (typeof this.options.ssri === 'object'
      ? this.options.ssri.concurrency
      : undefined) ?? 6,
  );

  public enable(): boolean {
    return !!this.options.ssri;
  }

  public reducer(): AsyncReducer<HeadersProps> {
    const { ssri } = this.options as SSRIOptions;
    const ssriOptions: SSRIReducerOptions =
      ssri === true || ssri === undefined ? {} : ssri;

    return async (headers, data) => {
      const { ssriLock } = this.context;
      const targetURLs = this.getTargetURLs(headers, ssriOptions);

      if (targetURLs.length === 0) {
        return headers;
      }

      // restore ssri-lock
      const ssriMapFromLock: SSRIMap = ssriLock
        ? this.parseSSRILock(ssriLock)
        : new Map();

      // merge integrities from ssri-lock
      // and those provided within headers option (in respective tags)
      const ssriMap = new Map(
        targetURLs.map((url) => {
          const integrity = parseSSRI(this.parseSSRILike(url), {
            strict: true,
          }) as IntegrityMap | null;
          const normalizedUrl = this.normalizeURL(url);
          const integrityFromLock = ssriMapFromLock.get(normalizedUrl);

          if (integrity && integrityFromLock) {
            integrity.merge(ssriMapFromLock.get(normalizedUrl), {
              strict: true,
            });
          }

          return [normalizedUrl, integrity ?? integrityFromLock] as const;
        }),
      );

      // compute and merge missing hashes based on specified algorithms option
      let dirty = false;
      const newSSRIEntries = await Promise.all(
        Array.from(ssriMap).map(([url, integrity]) =>
          this.limit(async () => {
            const expectedAlgorithms = ssriOptions.algorithms ?? ['sha512'];
            const missingAlgorithms = expectedAlgorithms.filter(
              (alg) => !integrity?.[alg],
            );

            dirty ||= missingAlgorithms.length > 0;

            const newIntegrity =
              missingAlgorithms.length > 0
                ? await this.computeSSRI(url, missingAlgorithms, {
                    strict: ssriOptions.strict,
                  })
                : null;

            if (integrity && newIntegrity) {
              integrity.merge(newIntegrity);
            }

            return [url, integrity ?? newIntegrity] as const;
          }),
        ),
      );

      const newSSRIMap = new Map(
        newSSRIEntries.filter(
          (entry): entry is [string, IntegrityMap] => !!entry[1],
        ),
      );

      // preserve ssri-lock
      if (dirty && newSSRIMap.size > 0) {
        data.ssriLock = this.toSSRILock(newSSRIMap);
      }

      return {
        ...headers,
        ...this.patchHeaders(headers, newSSRIMap),
      };
    };
  }

  protected applyReducer({ hooks }: UserscriptHooks): void {
    this.tapReducer(hooks.headers);
  }

  private getTargetURLs(
    headers: HeadersProps,
    options: Pick<SSRIReducerOptions, 'include' | 'exclude'>,
  ): string[] {
    const urls: string[] = [];

    if (headers.require !== undefined) {
      const requireURLs = Array.isArray(headers.require)
        ? headers.require
        : [headers.require];

      for (const urlStr of requireURLs) {
        const url = this.parseURL(urlStr);
        if (this.filterURL(url, 'require', options)) {
          urls.push(this.stringifyURL(url));
        }
      }
    }

    if (headers.resource !== undefined) {
      for (const urlStr of Object.values(headers.resource)) {
        const url = this.parseURL(urlStr);
        if (this.filterURL(url, 'resource', options)) {
          urls.push(this.stringifyURL(url));
        }
      }
    }

    return urls;
  }

  private normalizeURL(url: string): string {
    const u = new URL('', this.parseURL(url));
    u.hash = '';
    return u.toString();
  }

  private filterURL(
    url: URL,
    tag: SSRITag,
    { include, exclude }: Pick<SSRIReducerOptions, 'include' | 'exclude'> = {},
  ): boolean {
    if (!this.allowedProtocols.has(url.protocol)) {
      return false;
    }

    if (include && !include(tag, url)) {
      return false;
    }

    if (exclude && exclude(tag, url)) {
      return false;
    }

    return true;
  }

  private async computeSSRI(
    url: string,
    algorithms: SSRIAlgorithm[],
    { strict }: SSRIReducerOptions,
  ): Promise<IntegrityMap> {
    const response = await fetch(url);

    if (response.status !== 200 || response.body === null) {
      throw new Error(
        `Failed to fetch SSRI sources. ` +
          `[${response.status} ${response.statusText}] ${url}`,
      );
    }

    return await fromStream(response.body as Readable, {
      algorithms,
      strict,
    });
  }

  private parseSSRILike(url: string): string {
    return this.parseURL(url).hash.slice(1).replace(/[,;]/g, ' ');
  }

  private parseSSRILock(ssriLock: SSRILock): SSRIMap {
    return new Map(
      Object.entries(ssriLock).map(([url, integrityLike]) => [
        url,
        parseSSRI(integrityLike, { strict: true }),
      ]),
    );
  }

  private toSSRILock(ssriMap: SSRIMap): SSRILock {
    return Object.fromEntries(
      Array.from(ssriMap).map(
        ([url, integrity]) =>
          [url, stringifySSRI(integrity, { strict: true })] as const,
      ),
    );
  }

  private parseURL(url: string): URL {
    return new URL(url);
  }

  private stringifyURL(url: URL): string {
    return url.toString();
  }

  private updateURL(url: string, ssriMap: SSRIMap): string {
    const integrity = ssriMap.get(url);

    if (!integrity) return url;

    const urlObj = this.parseURL(url);
    urlObj.hash = '#' + stringifySSRI(integrity, { sep: ',', strict: true });

    return urlObj.toString();
  }

  private patchHeaders(headers: HeadersProps, ssriMap: SSRIMap): HeadersProps {
    const headersProps: HeadersProps = {};

    if (headers.require !== undefined) {
      if (Array.isArray(headers.require)) {
        headersProps.require = headers.require.map((url) =>
          this.updateURL(url, ssriMap),
        );
      } else {
        headersProps.require = this.updateURL(headers.require, ssriMap);
      }
    }

    if (headers.resource !== undefined) {
      headersProps.resource = Object.fromEntries(
        Object.entries(headers.resource).map(([name, url]) => [
          name,
          this.updateURL(url, ssriMap),
        ]),
      );
    }

    return headersProps;
  }
}
