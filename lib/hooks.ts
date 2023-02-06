import { URL } from 'url';

import {
  HeadersWaterfall,
  ProcessHeadersAsyncHook,
  ProcessHeadersHook,
} from './types';

export function wrapHook(
  fn: ProcessHeadersHook,
): (data: HeadersWaterfall) => HeadersWaterfall;
export function wrapHook(
  fn: ProcessHeadersAsyncHook,
): (data: HeadersWaterfall) => Promise<HeadersWaterfall>;

export function wrapHook(
  fn: ProcessHeadersHook | ProcessHeadersAsyncHook,
): (data: HeadersWaterfall) => HeadersWaterfall | Promise<HeadersWaterfall> {
  return (data) => {
    const originalHeaders = data.headers;
    const headers = fn(data);

    if (headers instanceof Promise) {
      return headers.then((headers) => ({
        ...data,
        headers: headers ?? originalHeaders,
      }));
    }

    return { ...data, headers: headers ?? originalHeaders };
  };
}

export const setDefaultMatch: ProcessHeadersHook = ({ headers }) => {
  if (headers.include === undefined && headers.match === undefined) {
    return headers.update({
      match: '*://*/*',
    });
  }
  return headers;
};

export const resolveDownloadBaseUrl: ProcessHeadersHook = ({
  headers,
  fileInfo,
  options,
}) => {
  if (headers.downloadURL === undefined) {
    return headers.update({
      downloadURL: new URL(
        fileInfo.userjsFile,
        options.downloadBaseUrl,
      ).toString(),
    });
  }
  return headers;
};

export const resolveUpdateBaseUrl: ProcessHeadersHook = ({
  headers,
  fileInfo,
  options,
}) => {
  if (headers.updateURL === undefined) {
    return headers.update({
      updateURL: !options.metajs
        ? headers.downloadURL
        : new URL(fileInfo.metajsFile, options.updateBaseUrl).toString(),
    });
  }
  return headers;
};
