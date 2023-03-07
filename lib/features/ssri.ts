import path from 'node:path';

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

import {
  FsMkdir,
  FsReadFile,
  FsWriteFile,
  mkdirp,
  readJSON,
  writeJSON,
} from '../fs';
import { HeadersProps, UserscriptPluginInstance } from '../types';
import { Feature } from './feature';

export type RawSSRILock = Record<string, string>;
export type SSRILock = Record<string, IntegrityMap>;

export type SSRIAlgorithm = 'sha256' | 'sha384' | 'sha512';

export type SSRITag = 'require' | 'resource';

export type URLFilter = (tag: SSRITag, value: URL) => boolean;

export interface SSRIFeatureOptions {
  include?: URLFilter;
  exclude?: URLFilter;
  algorithms?: SSRIAlgorithm[];
  strict?: boolean;
  lock?: boolean | string;
  concurrency?: number;
}

export interface SSRIOptions {
  root?: string;
  ssri?: SSRIFeatureOptions;
}

export class ProcessSSRI extends Feature<SSRIOptions> {
  public readonly name = 'ProcessSSRI';

  public readonly allowedProtocols = new Set(['http:', 'https:']);

  private ssriLockDirty = false;
  private ssriLock: SSRILock = {};

  private readonly limit = pLimit(
    (typeof this.options.ssri === 'object'
      ? this.options.ssri.concurrency
      : undefined) ?? 6,
  );

  public apply({ hooks }: UserscriptPluginInstance): void {
    const { ssri, root } = this.options;

    if (!ssri) {
      return;
    }

    // read lock
    hooks.init.tapPromise(this.name, async (compiler) => {
      const lockfile = this.getSSRILockFile(ssri);

      if (!lockfile) {
        return;
      }

      try {
        this.ssriLock = this.parseSSRILock(
          await readJSON<RawSSRILock>(
            path.resolve(root ?? compiler.context, lockfile),
            compiler.inputFileSystem as FsReadFile,
          ),
        );
      } catch {}
      this.ssriLockDirty = false;
    });

    // write lock
    hooks.close.tapPromise(this.name, async (compiler) => {
      const lock = this.getSSRILockFile(ssri);

      if (!lock) {
        return;
      }

      const lockfile = path.resolve(root ?? compiler.context, lock);

      if (this.ssriLockDirty) {
        const { intermediateFileSystem } = compiler;

        const dir = path.dirname(lockfile);
        const isNotRoot = path.dirname(dir) !== dir;

        if (isNotRoot) {
          await mkdirp(dir, intermediateFileSystem as FsMkdir);
        }

        await writeJSON(
          lockfile,
          this.toRawSSRILock(this.ssriLock),
          intermediateFileSystem as FsWriteFile,
        );

        this.ssriLockDirty = false;
      }
    });

    hooks.headers.tapPromise(this.name, async (headers) => {
      const targetURLs = this.getTargetURLs(headers, ssri).reduce(
        (map, url) => map.set(url, this.normalizeURL(url)),
        new Map<string, string>(),
      );

      if (targetURLs.size === 0) {
        return headers;
      }

      // merge integrities from ssri-lock
      // and those provided within headers option (in respective tags)
      for (const [url, normalizedURL] of targetURLs) {
        const integrity = parseSSRI(this.parseSSRILike(url), {
          strict: true,
        }) as IntegrityMap | null;

        if (integrity) {
          if (this.ssriLock[normalizedURL]) {
            integrity.merge(this.ssriLock[normalizedURL], {
              strict: true,
            });
          }

          this.ssriLockDirty = true;
          this.ssriLock[normalizedURL] = integrity;
        }
      }

      // compute and merge missing hashes based on specified algorithms option
      await Promise.all(
        Array.from(targetURLs.values()).map(async (normalizedURL) => {
          const expectedAlgorithms = ssri.algorithms ?? ['sha512'];
          const missingAlgorithms = expectedAlgorithms.filter(
            (alg) => !this.ssriLock[normalizedURL]?.[alg],
          );

          const newIntegrity =
            missingAlgorithms.length > 0
              ? await this.limit(() =>
                  this.computeSSRI(normalizedURL, missingAlgorithms, {
                    strict: ssri.strict,
                  }),
                )
              : null;

          if (newIntegrity) {
            if (this.ssriLock[normalizedURL]) {
              newIntegrity.merge(this.ssriLock[normalizedURL]);
            }

            this.ssriLock[normalizedURL] = newIntegrity;
            this.ssriLockDirty = true;
          }
        }),
      );

      return {
        ...headers,
        ...this.patchHeaders(headers, this.ssriLock),
      };
    });
  }

  private getSSRILockFile({ lock = true }: SSRIFeatureOptions = {}):
    | string
    | undefined {
    return typeof lock === 'string'
      ? lock
      : lock
      ? 'ssri-lock.json'
      : undefined;
  }

  private getTargetURLs(
    headers: HeadersProps,
    options: Pick<SSRIFeatureOptions, 'include' | 'exclude'>,
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
    { include, exclude }: Pick<SSRIFeatureOptions, 'include' | 'exclude'> = {},
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
    { strict }: SSRIFeatureOptions,
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

  private parseSSRILock(rawSSRILock: RawSSRILock): SSRILock {
    return Object.fromEntries(
      Object.entries(rawSSRILock).map(([url, integrityLike]) => [
        url,
        parseSSRI(integrityLike, { strict: true }),
      ]),
    );
  }

  private toRawSSRILock(ssriLock: SSRILock): RawSSRILock {
    return Object.fromEntries(
      Object.entries(ssriLock).map(
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

  private updateURL(url: string, ssriLock: SSRILock): string {
    const integrity = ssriLock[url];

    if (!integrity) return url;

    const urlObj = this.parseURL(url);
    urlObj.hash = '#' + stringifySSRI(integrity, { sep: ',', strict: true });

    return urlObj.toString();
  }

  private patchHeaders(
    headers: HeadersProps,
    ssriLock: SSRILock,
  ): HeadersProps {
    const headersProps: HeadersProps = {};

    if (headers.require !== undefined) {
      if (Array.isArray(headers.require)) {
        headersProps.require = headers.require.map((url) =>
          this.updateURL(url, ssriLock),
        );
      } else {
        headersProps.require = this.updateURL(headers.require, ssriLock);
      }
    }

    if (headers.resource !== undefined) {
      headersProps.resource = Object.fromEntries(
        Object.entries(headers.resource).map(([name, url]) => [
          name,
          this.updateURL(url, ssriLock),
        ]),
      );
    }

    return headersProps;
  }
}
