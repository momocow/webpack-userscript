import fetch from 'node-fetch';
import { fromStream } from 'ssri';
import { Readable } from 'stream';
import { URL } from 'url';

import {
  ProcessHeadersAsyncHook,
  SSRIOptions,
  SSRITag,
  URLFilter,
} from './types';

const DEFAULT_SSRI_OPTIONS: SSRIOptions = {};

export const processSSRI: ProcessHeadersAsyncHook = async ({
  headers,
  options: { ssri: _ssri },
}) => {
  const ssri: SSRIOptions = _ssri === true ? DEFAULT_SSRI_OPTIONS : _ssri;

  const filters = {
    include: ssri?.include ?? [],
    exclude: ssri?.exclude ?? [],
  };

  const ssriOptions = {};

  const urls = new Set(
    [
      ...(headers.require ?? []),
      ...Object.values(headers.resource ?? {}),
    ].filter((url) => filterURL(url)),
  );

  // headers = headers.update({
  //   require:,
  //   resource:,
  // })

  // const urlFilters = _pick(ssriOptions, ['include', 'exclude']);
  // const integrityOptions = _pick(ssriOptions, [
  //   'algorithms',
  //   'integrity',
  //   'size',
  // ]);

  // tplHeaderObj.require = !tplHeaderObj.require
  //   ? []
  //   : !Array.isArray(tplHeaderObj.require)
  //   ? [tplHeaderObj.require]
  //   : tplHeaderObj.require;
  // tplHeaderObj.resource = !tplHeaderObj.resource
  //   ? []
  //   : !Array.isArray(tplHeaderObj.resource)
  //   ? [tplHeaderObj.resource]
  //   : tplHeaderObj.resource;

  // const effectiveUrls = new Set();
  // tplHeaderObj.require = await Promise.all(
  //   tplHeaderObj.require.map((url) => {
  //     effectiveUrls.add(url);
  //     if (!(url in this.ssriCache)) {
  //       this.ssriCache[url] = computeSSRI(
  //         url,
  //         'require',
  //         urlFilters,
  //         integrityOptions,
  //       );
  //     }
  //     return this.ssriCache[url];
  //   }),
  // );

  // tplHeaderObj.resource = await Promise.all(
  //   tplHeaderObj.resource.map((url) => {
  //     let name;
  //     if (url.match(/^\w+\s+https?:\/\/.*/)) {
  //       [name, url] = url.split(/\s+/);
  //     }

  //     effectiveUrls.add(url);
  //     if (!(url in this.ssriCache)) {
  //       this.ssriCache[url] = computeSSRI(
  //         url,
  //         'resource',
  //         urlFilters,
  //         integrityOptions,
  //       ).then((urlSSRI) => [name, urlSSRI].join(' '));
  //     }
  //     return this.ssriCache[url];
  //   }),
  // );

  // for (const url in this.ssriCache) {
  //   if (!effectiveUrls.has(url)) {
  //     delete this.ssriCache[url];
  //   }
  // }
};

const ALLOWED_PROTOCOLS = new Set(['http:', 'https:']);

export function filterURL(
  tag: SSRITag,
  url: string,
  { include, exclude }: { include?: URLFilter; exclude?: URLFilter } = {},
): boolean {
  const urlObj = new URL(url);

  if (!ALLOWED_PROTOCOLS.has(urlObj.protocol)) {
    return false;
  }

  if (include && !include(tag, urlObj)) {
    return false;
  }

  if (exclude && exclude(tag, urlObj)) {
    return false;
  }

  return true;
}

export async function computeSSRI(
  url: string,
  { algorithms, strict }: SSRIOptions,
): Promise<string> {
  const response = await fetch(url);
  if (response.body === null)
    throw new Error(
      `Null response body received when computing SSRI. ` +
        `${response.status} ${response.statusText} ${url}`,
    );
  const integrity = await fromStream(response.body as Readable, {
    algorithms,
    strict,
  });
  return integrity.toString({ sep: ',' });
}
