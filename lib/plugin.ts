import path from 'node:path';

import { Chunk, Compilation, Compiler, sources } from 'webpack';

import { findPackage, FsReadFile, FsStat, readJSON } from './fs';
import { Headers, HeadersProps } from './headers';

const { ConcatSource, RawSource } = sources;

export type HeadersProvider = () => HeadersProps | Promise<HeadersProps>;
export type HeadersFile = string;

export interface UserscriptOptions {
  root?: string;
  headers?: HeadersProps | HeadersProvider | HeadersFile;
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

  protected headersFactory(props: HeadersProps): Headers {
    return Headers.fromJSON(props);
  }

  protected async loadDefault(
    context: string,
    fs: Compiler['inputFileSystem'],
  ): Promise<HeadersProps> {
    try {
      const projectDir = await findPackage(context, fs as FsStat);
      const packageJson = await readJSON<PackageJson>(
        path.join(projectDir, 'package.json'),
        fs as FsReadFile,
      );
      return {
        name: packageJson.name,
        version: packageJson.version,
        description: packageJson.description,
        author: packageJson.author,
        homepage: packageJson.homepage,
        supportURL:
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

  private async prepare(params: Compilation['params']): Promise<void> {
    const { context, inputFileSystem } = this.compiler;
    const { root, headers: headersOptions } = this.options;

    const defaultProps = await this.loadDefault(
      root ?? context,
      inputFileSystem,
    );
    const headersProps = await this.resolveHeadersOptions(headersOptions);
    const headers = this.headersFactory({
      ...defaultProps,
      ...headersProps,
    });

    this.compilationData.set(params, { headers });
  }

  private async resolveHeadersOptions(
    headersOptions: UserscriptOptions['headers'],
  ): Promise<HeadersProps> {
    const { inputFileSystem } = this.compiler;
    if (typeof headersOptions === 'string') {
      return await readJSON<HeadersProps>(
        headersOptions,
        inputFileSystem as FsReadFile,
      );
    } else if (typeof headersOptions === 'function') {
      return await headersOptions();
    } else {
      return headersOptions ?? {};
    }
  }

  private emit(compilation: Compilation): void {
    const data = this.compilationData.get(compilation.params);

    if (!data) return;

    for (const fileInfo of this.analyzeFileInfo(compilation)) {
      this.emitAssets(compilation, fileInfo, data);
    }
  }

  private analyzeFileInfo(compilation: Compilation): FileInfo[] {
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

  private emitAssets(
    compilation: Compilation,
    { sourceFile, chunk, metajsFile, userjsFile }: FileInfo,
    data: CompilationData,
  ): void {
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

export interface FileInfo {
  chunk: Chunk;
  sourceFile: string;
  userjsFile: string;
  metajsFile: string;
}

interface PackageJson {
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
