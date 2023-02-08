import { URL } from 'node:url';

import { HeadersReducer } from '../types';

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
