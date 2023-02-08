import { URL } from 'url';

import { HeadersReducer } from '../types';
import { interpolate } from '../util';

export const processProxyScript: HeadersReducer = ({
  headers,
  fileInfo: { chunk, originalFile, filename, basename, query, userjsFile },
  buildNo,
  options: { proxyScript },
}) => {
  if (proxyScript) {
    const devBaseUrl =
      proxyScript === true || proxyScript.baseUrl === undefined
        ? 'http://localhost:8080/'
        : interpolate(proxyScript.baseUrl, {
            chunkName: chunk.name,
            file: originalFile,
            filename,
            basename,
            query,
            buildNo: buildNo.toString(),
            buildTime: Date.now().toString(),
          });

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
