import path from 'node:path';

import { Chunk, Compilation, Compiler, sources } from 'webpack';

import { findPackage, FsReadFile, FsStat, readJSON } from './fs';
import { Headers, HeadersProps } from './headers';

const { ConcatSource, RawSource } = sources;

export type HeadersProvider = (
  ...args: any[]
) => HeadersProps | Promise<HeadersProps>;
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
      compilation.hooks.processAssets.tapPromise(
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

    const headersProps = await this.loadDefault(
      root ?? context,
      inputFileSystem,
    );

    let headersProviders: HeadersProvider | undefined;

    if (typeof headersOptions === 'string') {
      Object.assign(
        headersProps,
        await readJSON<HeadersProps>(
          headersOptions,
          inputFileSystem as FsReadFile,
        ),
      );
    } else if (typeof headersOptions === 'function') {
      headersProviders = headersOptions;
    } else {
      Object.assign(headersProps, headersOptions);
    }

    this.compilationData.set(params, { headersProps, headersProviders });
  }

  private async emit(compilation: Compilation): Promise<void> {
    const data = this.compilationData.get(compilation.params);

    if (!data) return;

    const fileInfoList = this.analyzeFileInfo(compilation);

    await Promise.all(
      fileInfoList.map((fileInfo) =>
        this.emitAssets(compilation, fileInfo, data),
      ),
    );

    for (const { file } of fileInfoList) {
      compilation.deleteAsset(file);
    }
  }

  private analyzeFileInfo(compilation: Compilation): FileInfo[] {
    const fileInfo: FileInfo[] = [];

    for (const entrypoint of compilation.entrypoints.values()) {
      const chunk = entrypoint.getEntrypointChunk();
      for (const file of chunk.files) {
        let q = file.indexOf('?');
        if (q < 0) {
          q = file.length;
        }
        const filename = file.slice(0, q);
        const query = file.slice(q);
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
          file,
          userjsFile,
          metajsFile,
          filename,
          basename,
          query,
          extname,
          dirname,
        });
      }
    }

    return fileInfo;
  }

  private async emitAssets(
    compilation: Compilation,
    fileInfo: FileInfo,
    data: CompilationData,
  ): Promise<void> {
    const { file, chunk, metajsFile, userjsFile } = fileInfo;

    const headers = this.headersFactory({
      ...data.headersProps,
      ...(await data.headersProviders?.(fileInfo)),
    });
    const headersStr = headers.render();

    const sourceAsset = compilation.getAsset(file);
    if (!sourceAsset) {
      return;
    }

    compilation.emitAsset(
      userjsFile,
      new ConcatSource(headersStr, '\n', sourceAsset.source),
      {
        related: { metajs: metajsFile },
        minimized: true,
      },
    );
    compilation.emitAsset(metajsFile, new RawSource(headersStr), {
      related: { userjs: userjsFile },
      minimized: true,
    });

    chunk.files.add(userjsFile);
    chunk.auxiliaryFiles.add(metajsFile);
  }
}

export interface FileInfo {
  chunk: Chunk;
  file: string;
  filename: string;
  basename: string;
  query: string;
  extname: string;
  dirname: string;
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
  headersProps: HeadersProps;
  headersProviders?: HeadersProvider;
}
