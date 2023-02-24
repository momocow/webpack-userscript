import {
  AsyncParallelHook,
  AsyncSeriesBailHook,
  AsyncSeriesWaterfallHook,
} from 'tapable';
import { Chunk, Compilation, Compiler } from 'webpack';

import {
  LoadHeadersOptions,
  ProxyScriptOptions,
  RenderHeadersOptions,
  ResolveBaseURLsOptions,
  SSRIOptions,
  ValidateHeadersOptions,
} from './features';

export type TagType = string;
export type ValueType =
  | Record<string, string>
  | string[]
  | string
  | boolean
  | undefined;

export type SingleValue = string;
export type MultiValue = string | string[];
export type NamedValue = Record<string, string>;
export type SwitchValue = boolean;

export enum RunAtValue {
  DocumentStart = 'document-start',
  DocumentBody = 'document-body',
  DocumentEnd = 'document-end',
  DocumentIdle = 'document-idle',
  ContextMenu = 'context-menu',
}

export interface StrictHeadersProps {
  name?: SingleValue;
  version?: SingleValue;
  namespace?: SingleValue;
  author?: SingleValue;
  description?: SingleValue;
  homepage?: SingleValue;
  homepageURL?: SingleValue;
  website?: SingleValue;
  source?: SingleValue;
  icon?: SingleValue;
  iconURL?: SingleValue;
  defaulticon?: SingleValue;
  icon64?: SingleValue;
  icon64URL?: SingleValue;
  updateURL?: SingleValue;
  downloadURL?: SingleValue;
  installURL?: SingleValue;
  supportURL?: SingleValue;
  include?: MultiValue;
  match?: MultiValue;
  exclude?: MultiValue;
  require?: MultiValue;
  resource?: NamedValue;
  connect?: MultiValue;
  grant?: MultiValue;
  webRequest?: MultiValue;
  noframes?: SwitchValue;
  unwrap?: SwitchValue;
  antifeature?: NamedValue;
  ['run-at']?: RunAtValue;
}

export interface HeadersProps extends StrictHeadersProps {
  [tag: TagType]: ValueType;
}

export interface FileInfo {
  chunk: Chunk;
  originalFile: string;
  userjsFile: string;
  metajsFile: string;
  filename: string;
  basename: string;
  query: string;
  dirname: string;
}

export interface CompilationContext {
  buildNo: number;
  buildTime: Date;
  fileInfo: FileInfo[];
}

export interface WaterfallContext {
  buildNo: number;
  buildTime: Date;
  fileInfo: FileInfo;
  compilation: Compilation;
}

export interface UserscriptPluginInstance {
  hooks: {
    init: AsyncParallelHook<[Compiler]>;
    close: AsyncParallelHook<[Compiler]>;
    preprocess: AsyncParallelHook<[Compilation, CompilationContext]>;
    process: AsyncParallelHook<[Compilation, CompilationContext]>;
    headers: AsyncSeriesWaterfallHook<[HeadersProps, WaterfallContext]>;
    proxyHeaders: AsyncSeriesWaterfallHook<[HeadersProps, WaterfallContext]>;
    proxyScriptFile: AsyncSeriesWaterfallHook<[string, WaterfallContext]>;
    renderHeaders: AsyncSeriesBailHook<HeadersProps, string>;
    renderProxyHeaders: AsyncSeriesBailHook<HeadersProps, string>;
  };
}

export interface UserscriptPluginOptions {
  metajs?: boolean;
}

export type UserscriptOptions = LoadHeadersOptions &
  ResolveBaseURLsOptions &
  SSRIOptions &
  ProxyScriptOptions &
  RenderHeadersOptions &
  ValidateHeadersOptions &
  UserscriptPluginOptions;
