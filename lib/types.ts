import { IntegrityMap } from 'ssri';
import { URL } from 'url';
import { Chunk, Compilation } from 'webpack';

import { HeadersProps } from './headers';

export interface UserscriptOptions {
  root?: string;
  metajs?: boolean;
  headers?: HeadersOption;
  pretty?: boolean;
  prefix?: string;
  suffix?: string;
  strict?: boolean;
  whitelist?: boolean;
  downloadBaseUrl?: string;
  updateBaseUrl?: string;
  ssri?: true | SSRIOptions;
}

export type HeadersProvider = HeadersReducer | AsyncHeadersReducer;
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
  lock?: boolean | string;
}

export interface FileInfo {
  chunk: Chunk;
  originalFile: string;
  userjsFile: string;
  metajsFile: string;
  filename: string;
  basename: string;
  query: string;
}

export type SSRILock = Record<string, string>;
export type SSRIMap = Map<string, IntegrityMap>;

export interface HeadersWaterfall {
  headers: HeadersProps;
  fileInfo: FileInfo;
  compilation: Compilation;
  buildNo: number;
  options: UserscriptOptions;
  ssriLock?: SSRILock;
}

export type HeadersReducer = (data: HeadersWaterfall) => HeadersProps;

export type AsyncHeadersReducer = (
  data: HeadersWaterfall,
) => Promise<HeadersProps>;
