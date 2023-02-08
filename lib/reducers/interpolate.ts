import { HeadersReducer } from '../types';
import { interpolate } from '../util';

export const interpolateValues: HeadersReducer = ({
  fileInfo: { chunk, originalFile, filename, basename, query },
  buildNo,
  headers,
}) => {
  const data: Record<string, string> = {
    chunkName: chunk.name,
    file: originalFile,
    filename,
    basename,
    query,
    buildNo: buildNo.toString(),
    buildTime: Date.now().toString(),
  };

  for (const [tag, value] of Object.entries(headers)) {
    if (typeof value === 'string') {
      headers = {
        ...headers,
        [tag]: interpolate(value, data),
      };

      continue;
    }

    if (Array.isArray(value)) {
      headers = {
        ...headers,
        [tag]: value.map((str) => interpolate(str, data)),
      };

      continue;
    }

    if (typeof value === 'object') {
      headers = {
        ...headers,
        [tag]: Object.fromEntries(
          Object.entries(value).map(([name, str]) => [
            interpolate(name, data),
            interpolate(str, data),
          ]),
        ),
      };

      continue;
    }
  }

  return headers;
};
