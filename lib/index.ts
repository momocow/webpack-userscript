import 'reflect-metadata';

import { UserscriptPlugin } from './plugin';

export default UserscriptPlugin;

export {
  Feature,
  HeaderClass,
  HeadersProvider,
  LoadHeadersOptions,
  ProxyScriptFeatureOptions,
  ProxyScriptOptions,
  RenderHeadersOptions,
  ResolveBaseURLsOptions,
  SSRIAlgorithm,
  SSRIFeatureOptions,
  SSRIOptions,
  SSRITag,
  URLFilter,
  ValidateHeadersOptions,
} from './features';
export * from './plugin';
export * from './types';
