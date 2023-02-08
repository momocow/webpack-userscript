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

import { HeadersProps } from './headers';
import {
  AsyncHeadersReducer,
  SSRIAlgorithm,
  SSRILock,
  SSRIMap,
  SSRIOptions,
  SSRITag,
} from './types';

export const SSRI_MAP: Map<string, Map<SSRIAlgorithm, string>> = new Map();

const concurrency = parseInt(process.env.WPUS_SSRI_CONCURRENCY ?? '');
const limit = pLimit(Number.isNaN(concurrency) ? 6 : concurrency);

export const processSSRI: AsyncHeadersReducer = async (data) => {
  const {
    headers,
    ssriLock,
    options: { ssri },
  } = data;

  if (headers.resource == undefined && headers.require === undefined) {
    return headers;
  }

  const ssriOptions: SSRIOptions =
    ssri === true || ssri === undefined ? {} : ssri;

  const targetURLs = getTargetURLs(headers, ssriOptions);

  // restore ssri-lock
  const ssriMapFromLock: SSRIMap = ssriLock
    ? parseSSRILock(ssriLock)
    : new Map();

  // merge integrities from ssri-lock
  // and those provided within headers option (in respective tags)
  const ssriMap = new Map(
    targetURLs
      .map((url) => {
        const ssriMap = parseSSRI(parseSSRILike(url), {
          strict: true,
        });
        ssriMap.merge(ssriMapFromLock.get(url), { strict: true });

        return [normalizeURL(url), ssriMap] as const;
      })
      .filter(([, integrity]) => !!integrity),
  );

  // compute and merge missing hashes based on specified algorithms option
  await Promise.all(
    Array.from(ssriMap).map(([url, integrity]) =>
      limit(async () => {
        integrity.merge(
          await computeSSRI(
            url,
            ssriOptions.algorithms?.filter((alg) => !integrity[alg]) ?? [],
            {
              strict: true,
            },
          ),
        );
      }),
    ),
  );

  // preserve ssri-lock
  if (ssriLock) {
    data.ssriLock = toSSRILock(ssriMap);
  }

  return {
    ...headers,
    ...patchHeaders(headers, ssriMap),
  };
};

export function normalizeURL(url: string): string {
  const u = new URL('', parseURL(url));
  u.hash = '';
  return u.toString();
}

export function getTargetURLs(
  headers: HeadersProps,
  options: Pick<SSRIOptions, 'include' | 'exclude'>,
): string[] {
  const urls: string[] = [];

  if (headers.require !== undefined) {
    const requireURLs = Array.isArray(headers.require)
      ? headers.require
      : [headers.require];

    for (const urlStr of requireURLs) {
      const url = parseURL(urlStr);
      if (filterURL(url, 'require', options)) {
        urls.push(stringifyURL(url));
      }
    }
  }

  if (headers.resource !== undefined) {
    for (const urlStr of Object.values(headers.resource)) {
      const url = parseURL(urlStr);
      if (filterURL(url, 'resource', options)) {
        urls.push(stringifyURL(url));
      }
    }
  }

  return urls;
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

export async function computeSSRI(
  url: string,
  algorithms: SSRIAlgorithm[],
  { strict }: SSRIOptions,
): Promise<IntegrityMap | undefined> {
  if (algorithms.length === 0) return undefined;

  const response = await fetch(url);

  if (response.body === null)
    throw new Error(
      `Null response body received when computing SSRI. ` +
        `${response.status} ${response.statusText} ${url}`,
    );

  return await fromStream(response.body as Readable, {
    algorithms,
    strict,
  });
}

export function parseSSRILike(url: string): string {
  return parseURL(url).hash.slice(1).replace(/[,;]/g, ' ');
}

export function parseSSRILock(ssriLock: SSRILock): SSRIMap {
  return new Map(
    Object.entries(ssriLock).map(([url, integrityLike]) => [
      url,
      parseSSRI(integrityLike, { strict: true }),
    ]),
  );
}

export function toSSRILock(ssriMap: SSRIMap): SSRILock {
  return Object.fromEntries(
    Array.from(ssriMap).map(
      ([url, integrity]) =>
        [url, stringifySSRI(integrity, { strict: true })] as const,
    ),
  );
}

export function parseURL(url: string): URL {
  return new URL(url);
}

export function stringifyURL(url: URL): string {
  return url.toString();
}

export function updateURL(url: string, ssriMap: SSRIMap): string {
  const integrity = ssriMap.get(url);

  if (!integrity) return url;

  const urlObj = parseURL(url);
  urlObj.hash = '#' + stringifySSRI(integrity, { sep: ',', strict: true });

  return urlObj.toString();
}

export function patchHeaders(
  headers: HeadersProps,
  ssriMap: SSRIMap,
): HeadersProps {
  const headersProps: HeadersProps = {};

  if (headers.require !== undefined) {
    if (Array.isArray(headers.require)) {
      headersProps.require = headers.require.map((url) =>
        updateURL(url, ssriMap),
      );
    } else {
      headersProps.require = updateURL(headers.require, ssriMap);
    }
  }

  if (headers.resource !== undefined) {
    headersProps.resource = Object.fromEntries(
      Object.entries(headers.resource).map(([name, url]) => [
        name,
        updateURL(url, ssriMap),
      ]),
    );
  }

  return headersProps;
}
