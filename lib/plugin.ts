import path from 'node:path';

import { Compilation, Compiler, sources } from 'webpack';

import { Headers } from './headers';

const { ConcatSource } = sources;
type Source = sources.Source;

export interface UserscriptOptions {}

interface CacheEntry {
  headers: Headers;
  source: Source;
}

export class UserscriptPlugin {
  public static readonly DEFAULT_OPTIONS: Readonly<UserscriptOptions> = {};

  private readonly cache = new WeakMap<Source, CacheEntry>();

  public constructor(
    public options: Partial<UserscriptOptions> = {
      ...UserscriptPlugin.DEFAULT_OPTIONS,
    },
  ) {}

  public apply(compiler: Compiler): void {
    compiler.hooks.compilation.tap('UserscriptPlugin', (compilation) => {
      compilation.hooks.processAssets.tapPromise(
        {
          name: 'UserscriptPlugin',
          stage: Compilation.PROCESS_ASSETS_STAGE_ADDITIONS,
        },
        async () => {
          for (const entrypoint of compilation.entrypoints.values()) {
            const chunk = entrypoint.getEntrypointChunk();

            for (const file of chunk.files) {
              const filename = file.replace(/\?.*$/, '');
              const extname = path.extname(filename);

              if (extname !== '.js') {
                continue;
              }

              const basename = filename.endsWith('.user.js')
                ? path.basename(filename, '.user.js')
                : filename.endsWith('.js')
                ? path.basename(filename, '.js')
                : filename;

              const userjsFilename = path.join(
                path.dirname(filename),
                basename + '.user.js',
              );

              const headers = new Headers();

              compilation.renameAsset(file, userjsFilename);

              compilation.updateAsset(file, (old) => {
                const cached = this.cache.get(old);
                if (!cached || !headers.equals(cached.headers)) {
                  const source = new ConcatSource(
                    headers.toString(),
                    '\n',
                    old,
                  );
                  this.cache.set(old, { source, headers });
                  return source;
                }
                return cached.source;
              });
            }
          }
        },
      );
    });
  }
}
