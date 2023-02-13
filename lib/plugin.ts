import path from 'node:path';

import { AsyncSeriesWaterfallHook } from 'tapable';
import { Compilation, Compiler, sources } from 'webpack';

import {
  findPackage,
  FsReadFile,
  FsStat,
  FsWriteFile,
  readJSON,
  writeJSON,
} from './fs';
import { Headers, HeadersProps } from './headers';
import { wrapHook } from './hook';
import {
  fixTagNames,
  interpolateValues,
  processSSRI,
  resolveDownloadBaseUrl,
  resolveUpdateBaseUrl,
  setDefaultMatch,
} from './reducers';
import { processProxyScript } from './reducers/proxy-script';
import {
  FileInfo,
  HeadersWaterfall,
  SSRILock,
  UserscriptOptions,
} from './types';
import { interpolate } from './util';

const { ConcatSource, RawSource } = sources;

export class UserscriptPlugin {
  public readonly hooks = {
    processHeaders: new AsyncSeriesWaterfallHook<HeadersWaterfall>(['headers']),
    processProxyHeaders: new AsyncSeriesWaterfallHook<HeadersWaterfall>([
      'headers',
    ]),
  };

  public constructor(
    public readonly options: Readonly<UserscriptOptions> = {},
  ) {}

  public apply(compiler: Compiler): void {
    const PLUGIN = this.constructor.name;
    let data: CompilerData | undefined;

    compiler.hooks.beforeCompile.tapPromise(PLUGIN, async () => {
      if (!data) {
        data = await this.init(compiler);
      }
    });

    compiler.hooks.compilation.tap(PLUGIN, (compilation) => {
      compilation.hooks.processAssets.tapPromise(
        { name: PLUGIN, stage: Compilation.PROCESS_ASSETS_STAGE_PRE_PROCESS },
        async () => {
          if (!data) return;
          await this.prepare(compilation, data);
        },
      );
      compilation.hooks.processAssets.tapPromise(
        {
          name: PLUGIN,
          // we should generate userscript files
          // only if optimization of source files are complete
          stage: Compilation.PROCESS_ASSETS_STAGE_SUMMARIZE,
        },
        async () => {
          if (!data) return;
          await this.emit(compilation, data);
        },
      );
    });

    compiler.hooks.shutdown.tapPromise(PLUGIN, async () => {
      if (!data) return;
      await this.shutdown(compiler, data);
    });

    this.applyHooks();
  }

  protected applyHooks(): void {
    const { downloadBaseUrl, updateBaseUrl, ssri, headers, proxyScript } =
      this.options;

    if (typeof headers === 'function') {
      this.hooks.processHeaders.tapPromise(
        headers.name,
        wrapHook(async (data) => headers(data)),
      );
    }

    this.hooks.processHeaders.tap(fixTagNames.name, wrapHook(fixTagNames));

    if (downloadBaseUrl !== undefined) {
      this.hooks.processHeaders.tap(
        resolveDownloadBaseUrl.name,
        wrapHook(resolveDownloadBaseUrl),
      );
    }

    if (updateBaseUrl !== undefined) {
      this.hooks.processHeaders.tap(
        resolveUpdateBaseUrl.name,
        wrapHook(resolveUpdateBaseUrl),
      );
    }

    if (ssri) {
      this.hooks.processHeaders.tapPromise(
        processSSRI.name,
        wrapHook(processSSRI),
      );
    }

    this.hooks.processHeaders.tap(
      setDefaultMatch.name,
      wrapHook(setDefaultMatch),
    );

    this.hooks.processHeaders.tap(
      interpolateValues.name,
      wrapHook(interpolateValues),
    );

    if (proxyScript) {
      this.hooks.processProxyHeaders.tap(
        processProxyScript.name,
        wrapHook(processProxyScript),
      );
    }
  }

  protected headersFactory(props: HeadersProps): Readonly<Headers> {
    return Headers.fromJSON(props);
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

  protected async init(compiler: Compiler): Promise<CompilerData> {
    const { context, inputFileSystem } = compiler;
    const { root, headers, ssri } = this.options;

    const headersProps = await this.loadDefault(compiler);

    if (typeof headers === 'object') {
      Object.assign(headersProps, headers);
    }

    let lockfile: string | undefined;
    let ssriLock: SSRILock | undefined;
    if (ssri) {
      if (typeof ssri === 'object' && typeof ssri.lock === 'string') {
        lockfile = path.join(root ?? context, ssri.lock);
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

    return { headers: headersProps, ssriLock, lockfile, buildNo: 0 };
  }

  protected async prepare(
    compilation: Compilation,
    data: CompilerData,
  ): Promise<void> {
    const {
      inputFileSystem,
      compiler: { context },
    } = compilation;
    const { headers, root } = this.options;

    if (typeof headers === 'string') {
      const headersFile =
        data.headersFile ?? path.join(root ?? context, headers);

      Object.assign(
        data.headers,
        await readJSON<HeadersProps>(
          headersFile,
          inputFileSystem as FsReadFile,
        ),
      );

      compilation.fileDependencies.add(headersFile);
      data.headersFile = headersFile;
    }

    data.buildNo++;
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
    { intermediateFileSystem }: Compiler,
    { lockfile, ssriLock }: CompilerData,
  ): Promise<void> {
    if (lockfile !== undefined) {
      await writeJSON(
        lockfile,
        ssriLock,
        intermediateFileSystem as FsWriteFile,
      );
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
          filename,
          basename,
          query,
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
    const { prefix, pretty, suffix, whitelist, strict, proxyScript, metajs } =
      this.options;

    const { headers: headersProps, ssriLock } =
      await this.hooks.processHeaders.promise({
        headers: data.headers,
        ssriLock: data.ssriLock,
        fileInfo,
        compilation,
        buildNo: data.buildNo,
        options: this.options,
      });
    data.ssriLock = ssriLock;

    const headers = this.headersFactory(headersProps);
    if (strict) {
      headers.validate({ whitelist: whitelist ?? true });
    }

    let proxyScriptFile: string | undefined;
    let proxyHeaders: Readonly<Headers> | undefined;

    if (proxyScript) {
      const { headers: proxyHeadersProps } =
        await this.hooks.processProxyHeaders.promise({
          headers: headersProps,
          ssriLock,
          fileInfo,
          compilation,
          buildNo: data.buildNo,
          options: this.options,
        });

      proxyHeaders = this.headersFactory(proxyHeadersProps);

      if (strict) {
        proxyHeaders.validate({ whitelist: whitelist ?? true });
      }

      if (proxyScript === true || proxyScript.filename === undefined) {
        proxyScriptFile = '[basename].proxy.user.js';
      } else {
        proxyScriptFile = interpolate(proxyScript.filename, {
          chunkName: fileInfo.chunk.name,
          file: fileInfo.originalFile,
          filename: fileInfo.filename,
          basename: fileInfo.basename,
          query: fileInfo.query,
          buildNo: data.buildNo.toString(),
          buildTime: Date.now().toString(),
        });
      }
    }

    const { originalFile, chunk, metajsFile, userjsFile } = fileInfo;
    const headersStr = headers.render({
      prefix,
      pretty,
      suffix,
    });
    const proxyHeadersStr = proxyHeaders?.render({
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
        minimized: true,
      },
    );

    if (metajs !== false) {
      compilation.emitAsset(
        metajsFile,
        new RawSource(proxyHeadersStr ?? headersStr),
        {
          minimized: true,
        },
      );
    }

    if (proxyHeadersStr !== undefined && proxyScriptFile !== undefined) {
      compilation.emitAsset(proxyScriptFile, new RawSource(proxyHeadersStr), {
        minimized: true,
      });
    }

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
  buildNo: number;
  headers: HeadersProps;
  headersFile?: string;
  ssriLock?: SSRILock;
  lockfile?: string;
}
