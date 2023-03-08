import 'reflect-metadata';

import { UserscriptPlugin } from './plugin';

export default UserscriptPlugin;

export {
  LoadHeadersOptions,
  ProxyScriptOptions,
  RenderHeadersOptions,
  ResolveBaseURLsOptions,
  SSRIOptions,
  ValidateHeadersOptions,
} from './features';
export * from './plugin';
export * from './types';
