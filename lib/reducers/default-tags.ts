import { HeadersReducer } from '../types';

export const setDefaultMatch: HeadersReducer = ({ headers }) => {
  if (headers.include === undefined && headers.match === undefined) {
    return {
      ...headers,
      match: '*://*/*',
    };
  }
  return headers;
};
