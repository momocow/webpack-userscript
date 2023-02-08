import { StrictHeadersProps } from '../headers';
import { HeadersReducer } from '../types';

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
