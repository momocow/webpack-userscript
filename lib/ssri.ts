import path from 'node:path';

import fetch from 'node-fetch';
import pLimit from 'p-limit';
import { fromStream, Hash } from 'ssri';
import { Readable } from 'stream';
import { URL } from 'url';

import { FsReadFile, FsWriteFile, readJSON, writeJSON } from './fs';
import { Headers } from './headers';
import {
  ProcessHeadersAsyncHook,
  SSRIAlgorithm,
  SSRIOptions,
  SSRITag,
} from './types';

export const SSRI_MAP: Map<string, Map<SSRIAlgorithm, string>> = new Map();

const concurrency = parseInt(process.env.WPUS_SSRI_CONCURRENCY ?? '');
const limit = pLimit(Number.isNaN(concurrency) ? 6 : concurrency);

export const processSSRI: ProcessHeadersAsyncHook = async ({
  headers,
  compilation: {
    compiler: { inputFileSystem, outputFileSystem },
  },
  options: { ssri },
}) => {
  const ssriOptions: SSRIOptions =
    ssri === true || ssri === undefined ? {} : ssri;

  // const lockfile =
  //   ssriOptions.lock === true || ssriOptions.lock === undefined
  //     ? path.join(root ?? context, './ssri-lock.json')
  //     : ssriOptions.lock;

  const urlMap = getTargetURLs(headers, ssriOptions);
  Array.from(urlMap.values()).map((url) => [
    url.toString(),
    new Map(buildSSRIEntries(url)),
  ]);

  // restore ssri-lock.json
  let urlSSRIMap =
    lockfile !== false
      ? await readSSRILockFile(lockfile, inputFileSystem as FsReadFile)
      : new Map<string, Map<SSRIAlgorithm, string>>();

  // restore url-ssri-map
  urlSSRIMap = new Map(
    Array.from(urlSSRIMap).map(([url, ssriMap]) => [
      url,
      new Map([...ssriMap, ...buildSSRIEntries(new URL(url))]),
    ]),
  );

  // .filter((map) => ssriOptions.algorithms?.filter((alg) => !map.has(alg)));

  const computations = Array.from(urlMap.values()).map((url) =>
    limit(async () => {
      const ssriMap = buildSSRIMap(url);
      const missingAlgorithms = ssriOptions.algorithms?.filter(
        (alg) => !ssriMap.has(alg),
      );
      const newSSRIMap = await computeSSRI(url, {
        strict: ssriOptions.strict,
        algorithms: missingAlgorithms,
      });

      return [url.toString(), new Map([...ssriMap, ...newSSRIMap])] as const;
    }),
  );

  // const urlSSRIMap = new Map(await Promise.all(computations));

  if (ssriOptions.lock) {
    const file =
      typeof ssriOptions.lock === 'string'
        ? ssriOptions.lock
        : './ssri-lock.json';
    await writeSSRILockFile(file, urlSSRIMap, outputFileSystem as FsWriteFile);
  }

  // const ssri = await Promise.all(
  //   Array.from(urlSet).map((url) => appendSSRI(url, ssriOptions)),
  // );
};

export function normalizeURL(url: URL): string {
  const u = new URL('', url);
  u.hash = '';
  return u.toString();
}

export function getTargetURLs(
  headers: Headers,
  options: Pick<SSRIOptions, 'include' | 'exclude'>,
): Map<string, URL> {
  const urlMap = new Map<string, URL>();

  if (headers.require !== undefined) {
    const requireURLs = Array.isArray(headers.require)
      ? headers.require
      : [headers.require];

    for (const urlStr of requireURLs) {
      const url = new URL(urlStr);
      if (filterURL(url, 'require', options)) {
        urlMap.set(urlStr, url);
      }
    }
  }

  if (headers.resource !== undefined) {
    for (const urlStr of Object.values(headers.resource)) {
      const url = new URL(urlStr);
      if (filterURL(url, 'resource', options)) {
        urlMap.set(urlStr, url);
      }
    }
  }

  return urlMap;
}

export const ALLOWED_PROTOCOLS = new Set(['http:', 'https:']);

export function filterURL(
  url: URL,
  tag: SSRITag,
  { include, exclude }: Pick<SSRIOptions, 'include' | 'exclude'> = {},
): boolean {
  if (!ALLOWED_PROTOCOLS.has(url.protocol)) {
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

export const SPEC_ALGORITHMS = new Set(['sha256', 'sha384', 'sha512']);

export function buildSSRIEntries(url: URL): [SSRIAlgorithm, string][] {
  return url.hash
    .replace(/^#/, '')
    .split(/[,;]/)
    .map((sri) => sri.split(/=(.*)/) as [string, string])
    .filter((entries): entries is [SSRIAlgorithm, string] =>
      SPEC_ALGORITHMS.has(entries[0]),
    );
}

export async function computeSSRI(
  url: URL,
  { algorithms, strict }: SSRIOptions,
): Promise<Map<SSRIAlgorithm, string>> {
  if (!algorithms || algorithms.length === 0) return new Map();

  const response = await fetch(url.toString());

  if (response.body === null)
    throw new Error(
      `Null response body received when computing SSRI. ` +
        `${response.status} ${response.statusText} ${url}`,
    );

  const integrity = await fromStream(response.body as Readable, {
    algorithms,
    strict,
  });

  return new Map(
    algorithms.map((alg) => [
      alg,
      integrity[alg]
        .map((hash) => Hash.prototype.toString.call(hash, { strict }))
        .join(','),
    ]),
  );
}

export async function writeSSRILockFile(
  file: string,
  urlSSRIMap: Map<string, Map<SSRIAlgorithm, string>>,
  fs: FsWriteFile,
): Promise<void> {
  const json = Object.fromEntries(
    Array.from(urlSSRIMap).map(([url, ssriMap]) => [
      url,
      Object.fromEntries(ssriMap),
    ]),
  );
  await writeJSON(file, JSON.stringify(json), fs);
}
