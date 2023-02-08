import { URL } from 'url';

import { StrictHeadersProps } from './headers';
import { HeadersReducer } from './types';

export const setDefaultMatch: HeadersReducer = ({ headers }) => {
  if (headers.include === undefined && headers.match === undefined) {
    return {
      ...headers,
      match: '*://*/*',
    };
  }
  return headers;
};

export const resolveDownloadBaseUrl: HeadersReducer = ({
  headers,
  fileInfo,
  options,
}) => {
  if (headers.downloadURL === undefined) {
    return {
      ...headers,
      downloadURL: new URL(
        fileInfo.userjsFile,
        options.downloadBaseUrl,
      ).toString(),
    };
  }
  return headers;
};

export const resolveUpdateBaseUrl: HeadersReducer = ({
  headers,
  fileInfo,
  options,
}) => {
  if (headers.updateURL === undefined) {
    return {
      ...headers,
      updateURL: !options.metajs
        ? headers.downloadURL
        : new URL(fileInfo.metajsFile, options.updateBaseUrl).toString(),
    };
  }
  return headers;
};

export const FIXABLE_TAG_NAMES = new Map<string, keyof StrictHeadersProps>([
  ['updateUrl', 'updateURL'],
  ['iconUrl', 'iconURL'],
  ['icon64Url', 'icon64URL'],
  ['installUrl', 'installURL'],
  ['supportUrl', 'supportURL'],
  ['downloadUrl', 'downloadURL'],
  ['homepageUrl', 'homepageURL'],
]);

export const fixTagNames: HeadersReducer = ({ headers }) => {
  for (const [source, target] of FIXABLE_TAG_NAMES) {
    if (headers[source] !== undefined) {
      if (headers[target] !== undefined) {
        throw new Error(`ambiguous tags: ("${source}", "${target}")`);
      }

      headers = {
        ...headers,
        [source]: undefined,
        [target]: headers[source],
      };
    }
  }

  return headers;
};
