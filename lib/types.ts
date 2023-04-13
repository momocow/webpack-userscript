import {
  AsyncParallelHook,
  AsyncSeriesBailHook,
  AsyncSeriesWaterfallHook,
} from 'tapable';
import { Chunk, Compilation, Compiler } from 'webpack';

export type SingleValue = string | undefined;
export type MultiValue = SingleValue | SingleValue[];
export type NamedValue = Record<string, SingleValue>;
export type SwitchValue = boolean;

export type TagType = string;
export type ValueType =
  | NamedValue
  | MultiValue
  | SingleValue
  | SwitchValue
  | undefined;

export type EnumValue<T extends string> = T | `${T}`;

export enum RunAt {
  DocumentStart = 'document-start',
  DocumentBody = 'document-body',
  DocumentEnd = 'document-end',
  DocumentIdle = 'document-idle',
  ContextMenu = 'context-menu',
}

export enum Sandbox {
  Raw = 'raw',
  JavaScript = 'JavaScript',
  DOM = 'DOM',
}

export enum InjectInto {
  Page = 'page',
  Content = 'content',
  Auto = 'auto',
}

export interface CompatibilityValue extends NamedValue {
  firefox?: string;
  chrome?: string;
  opera?: string;
  safari?: string;
  edge?: string;
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
  'exclude-match'?: MultiValue;
  exclude?: MultiValue;
  require?: MultiValue;
  resource?: NamedValue;
  connect?: MultiValue;
  grant?: MultiValue;
  webRequest?: MultiValue;
  noframes?: SwitchValue;
  unwrap?: SwitchValue;
  antifeature?: NamedValue;
  'run-at'?: EnumValue<RunAt>;
  copyright?: SingleValue;
  sandbox?: EnumValue<Sandbox>;
  'inject-into'?: EnumValue<InjectInto>;
  license?: SingleValue;
  contributionURL?: SingleValue;
  contributionAmount?: SingleValue;
  compatible?: CompatibilityValue;
  incompatible?: CompatibilityValue;
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
  extname: string;
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
  locale: string;
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
    renderHeaders: AsyncSeriesBailHook<Map<string, HeadersProps>, string>;
    renderProxyHeaders: AsyncSeriesBailHook<HeadersProps, string>;
  };
}
