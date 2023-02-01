import path from 'node:path';

import { Chunk, Compilation, Compiler, sources } from 'webpack';

import { findPackage, FS, readJSON } from './fs';
import { Headers } from './headers';

const { ConcatSource, RawSource } = sources;

export interface UserscriptOptions {
  root?: string;
}

export class UserscriptPlugin {
  public static readonly DEFAULT_OPTIONS: Readonly<UserscriptOptions> = {};

  private compiler!: Compiler;

  private readonly compilationData = new WeakMap<
    Compilation['params'],
    CompilationData
  >();
  // private readonly headersCache = new WeakMap<Source, CacheEntry>();

  public constructor(
    public options: UserscriptOptions = {
      ...UserscriptPlugin.DEFAULT_OPTIONS,
    },
  ) {}

  public apply(compiler: Compiler): void {
    this.compiler = compiler;

    const PLUGIN = this.constructor.name;

    compiler.hooks.beforeCompile.tapPromise(PLUGIN, async (params) =>
      this.prepare(params),
    );

    compiler.hooks.compilation.tap(PLUGIN, (compilation) => {
      compilation.hooks.processAssets.tap(
        {
          name: PLUGIN,
          stage: Compilation.PROCESS_ASSETS_STAGE_SUMMARIZE,
        },
        () => this.emit(compilation),
      );
    });
  }

  protected getHeaders(packageJson: PackageJson): Headers {
    return Headers.fromJSON({ ...packageJson });
  }

  protected async loadPackageJson(
    context: string,
    fs: FS,
  ): Promise<PackageJson> {
    try {
      const projectDir = await findPackage(context, fs as FS);
      const packageJson = await readJSON<PackageJson>(
        path.join(projectDir, 'package.json'),
        fs,
      );
      return {
        name: packageJson.name,
        version: packageJson.version,
        description: packageJson.description,
        author: packageJson.author,
        homepage: packageJson.homepage,
        bugs:
          typeof packageJson.bugs === 'string'
            ? packageJson.bugs
            : typeof packageJson.bugs === 'object' &&
              typeof packageJson.bugs.url === 'string'
            ? packageJson.bugs.url
            : undefined,
      };
    } catch (e) {
      return {};
    }
  }

  protected analyzeFileInfo(compilation: Compilation): FileInfo[] {
    const fileInfo: FileInfo[] = [];

    for (const entrypoint of compilation.entrypoints.values()) {
      const chunk = entrypoint.getEntrypointChunk();
      for (const sourceFile of chunk.files) {
        let q = sourceFile.indexOf('?');
        if (q < 0) {
          q = sourceFile.length;
        }
        const filename = sourceFile.slice(0, q);
        const query = sourceFile.slice(q);
        const extname = path.extname(filename);

        if (extname !== '.js') {
          continue;
        }

        const dirname = path.dirname(filename);
        const basename = filename.endsWith('.user.js')
          ? path.basename(filename, '.user.js')
          : filename.endsWith('.js')
          ? path.basename(filename, '.js')
          : filename;

        const userjsFile = path.join(dirname, basename + '.user.js') + query;
        const metajsFile = path.join(dirname, basename + '.meta.js');

        fileInfo.push({
          chunk,
          sourceFile,
          userjsFile,
          metajsFile,
        });
      }
    }

    return fileInfo;
  }

  private async prepare(params: Compilation['params']): Promise<void> {
    const { context, inputFileSystem } = this.compiler;
    const { root } = this.options;

    const packageJson = await this.loadPackageJson(
      root ?? context,
      inputFileSystem as FS,
    );

    const headers = this.getHeaders(packageJson);

    this.compilationData.set(params, { headers });
  }

  private emit(compilation: Compilation): void {
    const data = this.compilationData.get(compilation.params);

    if (!data) return;

    const fileInfo = this.analyzeFileInfo(compilation);

    for (const { sourceFile, chunk, metajsFile, userjsFile } of fileInfo) {
      const headersStr = data.headers.render();

      compilation.updateAsset(
        sourceFile,
        (source) => {
          return new ConcatSource(headersStr, '\n', source);
        },
        {
          related: { metajs: metajsFile },
        },
      );
      compilation.renameAsset(sourceFile, userjsFile);
      compilation.emitAsset(metajsFile, new RawSource(headersStr), {
        // prevent metajs from optimization
        minimized: true,
      });
      chunk.auxiliaryFiles.add(metajsFile);
    }
  }
}

export interface FileInfo {
  chunk: Chunk;
  sourceFile: string;
  userjsFile: string;
  metajsFile: string;
}

export interface PackageJson {
  name?: string;
  version?: string;
  description?: string;
  author?: string;
  homepage?: string;
  bugs?: string | { url?: string };
}

interface CompilationData {
  headers: Headers;
}
