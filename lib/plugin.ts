import path from 'node:path';

import { Chunk, Compilation, Compiler, sources } from 'webpack';

import { findPackage, FsReadFile, FsStat, readJSON } from './fs';
import { Headers, HeadersProps } from './headers';

const { ConcatSource, RawSource } = sources;

export class UserscriptPlugin {
  public static readonly DEFAULT_OPTIONS: Readonly<UserscriptOptions> = {};

  // protected readonly headersCache = new WeakMap<Source, CacheEntry>();

  public constructor(
    public options: UserscriptOptions = {
      ...UserscriptPlugin.DEFAULT_OPTIONS,
    },
  ) {}

  public apply(compiler: Compiler): void {
    const PLUGIN = this.constructor.name;
    const compilationData = new WeakMap<
      Compilation['params'],
      CompilationData
    >();

    compiler.hooks.beforeCompile.tapPromise(PLUGIN, async (params) => {
      const data = await this.prepare(
        compiler.context,
        compiler.inputFileSystem as FsReadFile & FsStat,
      );
      compilationData.set(params, data);
    });

    compiler.hooks.compilation.tap(PLUGIN, (compilation, params) => {
      compilation.hooks.processAssets.tapPromise(
        {
          name: PLUGIN,
          stage: Compilation.PROCESS_ASSETS_STAGE_SUMMARIZE,
        },
        async () => {
          const data = compilationData.get(params);
          if (!data) return;

          await this.emit(
            compilation,
            data,
            compilation.inputFileSystem as FsReadFile,
          );
        },
      );
    });
  }

  protected headersFactory(props: HeadersProps): Headers {
    return Headers.fromJSON(props);
  }

  protected async loadDefault(
    context: string,
    fs: FsStat & FsReadFile,
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

  protected async resolveHeadersOption(
    headersOption: HeadersOption,
    fileInfo: FileInfo,
    fs: FsReadFile,
  ): Promise<HeadersProps> {
    if (typeof headersOption === 'string') {
      return await readJSON<HeadersProps>(headersOption, fs);
    }

    if (typeof headersOption === 'function') {
      return await headersOption(fileInfo);
    }

    return headersOption ?? {};
  }

  protected async prepare(
    context: string,
    fs: FsStat & FsReadFile,
  ): Promise<CompilationData> {
    const headersProps = await this.loadDefault(
      this.options.root ?? context,
      fs,
    );

    return { headersProps };
  }

  protected async emit(
    compilation: Compilation,
    data: CompilationData,
    fs: FsReadFile,
  ): Promise<void> {
    const fileInfoList = this.analyzeFileInfo(compilation);

    await Promise.all(
      fileInfoList.map((fileInfo) =>
        this.emitAssets(compilation, data, fileInfo, fs),
      ),
    );

    for (const { file } of fileInfoList) {
      compilation.deleteAsset(file);
    }
  }

  protected analyzeFileInfo(compilation: Compilation): FileInfo[] {
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

  protected async emitAssets(
    compilation: Compilation,
    data: CompilationData,
    fileInfo: FileInfo,
    fs: FsReadFile,
  ): Promise<void> {
    const { headers: headersOption } = this.options;
    const { file, chunk, metajsFile, userjsFile } = fileInfo;

    const headersProps = await this.resolveHeadersOption(
      headersOption,
      fileInfo,
      fs,
    );

    const headers = this.headersFactory({
      ...data.headersProps,
      ...headersProps,
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

export interface UserscriptOptions {
  root?: string;
  headers?: HeadersOption;
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
}
