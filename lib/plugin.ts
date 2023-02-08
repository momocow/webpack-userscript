import path from 'node:path';

import { AsyncSeriesWaterfallHook } from 'tapable';
import { Compilation, Compiler, sources } from 'webpack';

import { findPackage, FsReadFile, FsStat, readJSON, writeJSON } from './fs';
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
  SSRILock,
  UserscriptOptions,
} from './types';

const { ConcatSource, RawSource } = sources;

export class UserscriptPlugin {
  public readonly hooks = {
    processHeaders: new AsyncSeriesWaterfallHook<HeadersWaterfall>(['headers']),
  };

  public constructor(
    public readonly options: Readonly<UserscriptOptions> = {},
  ) {}

  public apply(compiler: Compiler): void {
    const PLUGIN = this.constructor.name;
    let compilerData: CompilerData | undefined;

    compiler.hooks.beforeCompile.tapPromise(PLUGIN, async () => {
      compilerData = await this.prepare(compiler);
    });

    compiler.hooks.compilation.tap(PLUGIN, (compilation) => {
      compilation.hooks.processAssets.tapPromise(
        {
          name: PLUGIN,
          stage: Compilation.PROCESS_ASSETS_STAGE_SUMMARIZE,
        },
        async () => {
          if (!compilerData) return;
          await this.emit(compilation, compilerData);
        },
      );
    });

    compiler.hooks.shutdown.tapPromise(PLUGIN, async () => {
      if (!compilerData) return;
      await this.shutdown(compiler, compilerData);
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
    const { whitelist, strict } = this.options;
    return HeadersImpl.fromJSON(props, { whitelist: whitelist ?? strict });
  }

  protected async loadDefault({
    context,
    inputFileSystem,
  }: Compiler): Promise<HeadersProps> {
    const { root } = this.options;
    try {
      const projectDir = await findPackage(
        root ?? context,
        inputFileSystem as FsStat,
      );
      const packageJson = await readJSON<PackageJson>(
        path.join(projectDir, 'package.json'),
        inputFileSystem as FsReadFile,
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

  protected async prepare(compiler: Compiler): Promise<CompilerData> {
    const { context, inputFileSystem } = compiler;
    const { root, headers, ssri } = this.options;

    const headersProps = await this.loadDefault(compiler);

    if (typeof headers === 'string') {
      Object.assign(
        headersProps,
        await readJSON<HeadersProps>(headers, inputFileSystem as FsReadFile),
      );
    } else if (typeof headers === 'object') {
      Object.assign(headersProps, headers);
    }

    let lockfile: string | undefined;
    let ssriLock: SSRILock | undefined;
    if (ssri) {
      if (typeof ssri === 'object' && typeof ssri.lock === 'string') {
        lockfile = ssri.lock;
      } else if (ssri === true || ssri.lock === true) {
        lockfile = path.join(root ?? context, 'ssri-lock.json');
      }

      if (lockfile !== undefined) {
        try {
          ssriLock = await readJSON<SSRILock>(
            lockfile,
            inputFileSystem as FsReadFile,
          );
        } catch {}
      }
    }

    return { headers: this.headersFactory(headersProps), ssriLock, lockfile };
  }

  protected async emit(
    compilation: Compilation,
    data: CompilerData,
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

  protected async shutdown(
    _: Compiler,
    { lockfile, ssriLock }: CompilerData,
  ): Promise<void> {
    if (lockfile !== undefined) {
      await writeJSON(lockfile, ssriLock);
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
    data: CompilerData,
    fileInfo: FileInfo,
  ): Promise<void> {
    const {
      headers: headersOption,
      prefix,
      pretty,
      suffix,
      whitelist,
      strict,
    } = this.options;

    let headers = data.headers;
    if (typeof headersOption === 'function') {
      headers = headers.update(await headersOption(fileInfo));
    }

    const { headers: processedHeaders, ssriLock } =
      await this.hooks.processHeaders.promise({
        headers,
        ssriLock: data.ssriLock,
        fileInfo,
        compilation,
        options: this.options,
      });
    headers = processedHeaders;
    data.ssriLock = ssriLock;

    if (strict) {
      headers.validate({ whitelist: whitelist ?? true });
    }

    const { originalFile, chunk, metajsFile, userjsFile } = fileInfo;
    const headersStr = headers.render({
      prefix,
      pretty,
      suffix,
    });
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

interface CompilerData {
  headers: Headers;
  ssriLock?: SSRILock;
  lockfile?: string;
}
