import { AsyncHeadersReducer, HeadersReducer, HeadersWaterfall } from './types';

export function wrapHook(
  fn: HeadersReducer,
): (data: HeadersWaterfall) => HeadersWaterfall;
export function wrapHook(
  fn: AsyncHeadersReducer,
): (data: HeadersWaterfall) => Promise<HeadersWaterfall>;

export function wrapHook(
  fn: HeadersReducer | AsyncHeadersReducer,
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
