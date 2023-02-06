import path from 'node:path';

import { AsyncSeriesWaterfallHook } from 'tapable';
import { Compilation, Compiler, sources } from 'webpack';

import {
  findPackage,
  FsExists,
  FsReadFile,
  FsStat,
  isFile,
  readJSON,
} from './fs';
import { Headers, HeadersImpl, HeadersProps } from './headers';
import {
  resolveDownloadBaseUrl,
  resolveUpdateBaseUrl,
  setDefaultMatch,
  wrapHook,
} from './hooks';
import { processSSRI } from './ssri';
import {
  FileInfo,
  HeadersWaterfall,
  SSRIMap,
  UserscriptOptions,
} from './types';

const { ConcatSource, RawSource } = sources;

export class UserscriptPlugin {
  public static readonly DEFAULT_OPTIONS: Readonly<UserscriptOptions> = {};
  public readonly hooks = {
    processHeaders: new AsyncSeriesWaterfallHook<HeadersWaterfall>(['headers']),
  };

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
        compiler.inputFileSystem as FsReadFile & FsStat & FsExists,
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

          await this.emit(compilation, data);
        },
      );
    });

    this.hooks.processHeaders.tap(PLUGIN, wrapHook(setDefaultMatch));
    if (this.options.downloadBaseUrl !== undefined) {
      this.hooks.processHeaders.tap(PLUGIN, wrapHook(resolveDownloadBaseUrl));
    }
    if (this.options.updateBaseUrl !== undefined) {
      this.hooks.processHeaders.tap(PLUGIN, wrapHook(resolveUpdateBaseUrl));
    }
    if (this.options.ssri) {
      this.hooks.processHeaders.tapPromise(PLUGIN, wrapHook(processSSRI));
    }
  }

  protected headersFactory(props: HeadersProps): Headers {
    return HeadersImpl.fromJSON(props);
  }

  protected async loadDefault(
    context: string,
    fs: FsStat & FsReadFile & FsExists,
  ): Promise<HeadersProps> {
    try {
      const projectDir = await findPackage(context, fs);
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

  protected async prepare(
    context: string,
    fs: FsStat & FsReadFile & FsExists,
  ): Promise<CompilationData> {
    const { root, headers, ssri } = this.options;

    const headersProps = await this.loadDefault(root ?? context, fs);

    if (typeof headers === 'string') {
      Object.assign(headersProps, await readJSON<HeadersProps>(headers, fs));
    } else if (typeof headers === 'object') {
      Object.assign(headersProps, headers);
    }

    let ssriMap: SSRIMap | undefined;
    if ((typeof ssri === 'object' && ssri.lock) || ssri) {
      const lockfile =
        ssri === true ||
        typeof ssri.lock == 'boolean' ||
        ssri.lock === undefined
          ? path.join(root ?? context, './ssri-lock.json')
          : ssri.lock;

      ssriMap = await this.readSSRILockFile(lockfile, fs);
    }

    return { headers: this.headersFactory(headersProps), ssriMap };
  }

  protected async readSSRILockFile(
    file: string,
    fs: FsReadFile & FsExists,
  ): Promise<SSRIMap> {
    await isFile(file, fs);
    const json = await readJSON<Record<string, Record<string, string>>>(
      file,
      fs,
    );
    return new Map(
      Object.entries(json).map(([url, ssriMap]) => [
        url,
        new Map(Object.entries(ssriMap)),
      ]),
    ) as SSRIMap;
  }

  protected async emit(
    compilation: Compilation,
    data: CompilationData,
  ): Promise<void> {
    const fileInfoList = this.analyzeFileInfo(compilation);

    await Promise.all(
      fileInfoList.map((fileInfo) =>
        this.emitAssets(compilation, data, fileInfo),
      ),
    );

    for (const { originalFile } of fileInfoList) {
      compilation.deleteAsset(originalFile);
    }
  }

  protected analyzeFileInfo(compilation: Compilation): FileInfo[] {
    const fileInfo: FileInfo[] = [];

    for (const entrypoint of compilation.entrypoints.values()) {
      const chunk = entrypoint.getEntrypointChunk();
      for (const originalFile of chunk.files) {
        let q = originalFile.indexOf('?');
        if (q < 0) {
          q = originalFile.length;
        }
        const filename = originalFile.slice(0, q);
        const query = originalFile.slice(q);
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
          originalFile,
          userjsFile,
          metajsFile,
        });
      }
    }

    return fileInfo;
  }

  protected async emitAssets(
    compilation: Compilation,
    data: CompilationData,
    fileInfo: FileInfo,
  ): Promise<void> {
    const { headers: headersOption } = this.options;
    if (typeof headersOption === 'function') {
      data.headers = data.headers.update(await headersOption(fileInfo));
    }

    const { headers } = await this.hooks.processHeaders.promise({
      headers: data.headers,
      fileInfo,
      compilation,
      options: this.options,
    });

    const { originalFile, chunk, metajsFile, userjsFile } = fileInfo;
    const headersStr = headers.render();
    const sourceAsset = compilation.getAsset(originalFile);
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
  ssriMap?: SSRIMap;
}
