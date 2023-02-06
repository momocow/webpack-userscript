import { URL } from 'url';
import { Chunk } from 'webpack';

import { Headers, HeadersProps } from './headers';

export interface UserscriptOptions {
  root?: string;
  metajs?: boolean;
  headers?: HeadersOption;
  downloadBaseUrl?: string;
  updateBaseUrl?: string;
  ssri?: true | SSRIOptions;
}

export type HeadersProvider = (
  fileInfo: FileInfo,
) => HeadersProps | Promise<HeadersProps>;
export type HeadersFile = string;

export type HeadersOption =
  | HeadersProps
  | HeadersProvider
  | HeadersFile
  | undefined;

export type SSRIAlgorithm = 'sha256' | 'sha384' | 'sha512';

export type SSRITag = 'require' | 'resource';
export type URLFilter = (tag: SSRITag, value: URL) => boolean;

export interface SSRIOptions {
  include?: URLFilter;
  exclude?: URLFilter;
  algorithms?: SSRIAlgorithm[];
  integrity?: string;
  strict?: boolean;
}

export interface FileInfo {
  chunk: Chunk;
  originalFile: string;
  userjsFile: string;
  metajsFile: string;
}

export interface HeadersWaterfall {
  headers: Headers;
  fileInfo: FileInfo;
  options: UserscriptOptions;
}

export type ProcessHeadersHook = (data: HeadersWaterfall) => Headers;

export type ProcessHeadersAsyncHook = (
  data: HeadersWaterfall,
) => Promise<Headers>;
