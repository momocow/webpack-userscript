import path from 'node:path';

import {
  AsyncParallelHook,
  AsyncSeriesBailHook,
  AsyncSeriesWaterfallHook,
} from 'tapable';
import { Compilation, Compiler, sources, WebpackPluginInstance } from 'webpack';

import {
  Feature,
  FixTags,
  Interpolater,
  LoadHeaders,
  ProcessProxyScript,
  ProcessSSRI,
  RenderHeaders,
  ResolveBaseURLs,
  SetDefaultTags,
  ValidateHeaders,
} from './features';
import {
  CompilationContext,
  FileInfo,
  HeadersProps,
  UserscriptOptions,
  UserscriptPluginInstance,
  WaterfallContext,
} from './types';

const { ConcatSource, RawSource } = sources;

export class UserscriptPlugin
  implements WebpackPluginInstance, UserscriptPluginInstance
{
  public readonly name = 'UserscriptPlugin';

  public readonly features: Feature[] = [
    new LoadHeaders(this.options),
    new FixTags(this.options),
    new ResolveBaseURLs(this.options),
    new ProcessSSRI(this.options),
    new SetDefaultTags(this.options),
    new ProcessProxyScript(this.options),
    new Interpolater(this.options),
    new ValidateHeaders(this.options),
    new RenderHeaders(this.options),
  ];

  public readonly hooks = {
    init: new AsyncParallelHook<[Compiler]>(['compiler']),
    close: new AsyncParallelHook<[Compiler]>(['compiler']),
    preprocess: new AsyncParallelHook<[Compilation, CompilationContext]>([
      'compilation',
      'context',
    ]),
    process: new AsyncParallelHook<[Compilation, CompilationContext]>([
      'compilation',
      'context',
    ]),
    headers: new AsyncSeriesWaterfallHook<[HeadersProps, WaterfallContext]>([
      'headersProps',
      'context',
    ]),
    proxyHeaders: new AsyncSeriesWaterfallHook<
      [HeadersProps, WaterfallContext]
    >(['headersProps', 'context']),
    proxyScriptFile: new AsyncSeriesWaterfallHook<[string, WaterfallContext]>([
      'proxyScriptFile',
      'context',
    ]),
    renderHeaders: new AsyncSeriesBailHook<HeadersProps, string>([
      'headersProps',
    ]),
    renderProxyHeaders: new AsyncSeriesBailHook<HeadersProps, string>([
      'headersProps',
    ]),
  };

  private readonly contexts = new WeakMap<Compilation, CompilationContext>();

  public constructor(
    public options: UserscriptOptions = {
      metajs: true,
      strict: true,
    },
  ) {}

  public apply(compiler: Compiler): void {
    const name = this.name;
    let buildNo = 0;

    const initPromise = new Promise<void>((resolve) =>
      queueMicrotask(() => resolve(this.init(compiler))),
    );

    compiler.hooks.beforeCompile.tapPromise(name, () => initPromise);

    compiler.hooks.compilation.tap(name, (compilation) => {
      this.contexts.set(compilation, {
        buildNo: ++buildNo,
        buildTime: new Date(),
        fileInfo: [],
      });

      compilation.hooks.processAssets.tapPromise(
        {
          name,
          stage: Compilation.PROCESS_ASSETS_STAGE_PRE_PROCESS,
        },
        () => this.preprocess(compilation),
      );

      compilation.hooks.processAssets.tapPromise(
        {
          name,
          // we should generate userscript files
          // only if optimization of source files are complete
          stage: Compilation.PROCESS_ASSETS_STAGE_SUMMARIZE,
        },
        () => this.process(compilation),
      );
    });

    compiler.hooks.done.tapPromise(name, () => this.close(compiler));

    for (const feature of this.features) {
      feature.apply(this);
    }
  }

  private async init(compiler: Compiler): Promise<void> {
    await this.hooks.init.promise(compiler);
  }

  private async close(compiler: Compiler): Promise<void> {
    await this.hooks.close.promise(compiler);
  }

  private async preprocess(compilation: Compilation): Promise<void> {
    const context = this.contexts.get(compilation);

    if (!context) {
      return;
    }

    context.fileInfo = this.collectFileInfo(compilation);

    await this.hooks.preprocess.promise(compilation, context);
  }

  private async process(compilation: Compilation): Promise<void> {
    const context = this.contexts.get(compilation);

    if (!context) {
      return;
    }

    const fileInfoList = this.collectFileInfo(compilation);

    await Promise.all(
      fileInfoList.map((fileInfo) =>
        this.emitUserscript(compilation, context, fileInfo),
      ),
    );

    for (const { originalFile } of fileInfoList) {
      compilation.deleteAsset(originalFile);
    }

    await this.hooks.process.promise(compilation, context);
  }

  private collectFileInfo(compilation: Compilation): FileInfo[] {
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
          dirname,
          basename,
          query,
        });
      }
    }

    return fileInfo;
  }

  private async emitUserscript(
    compilation: Compilation,
    context: CompilationContext,
    fileInfo: FileInfo,
  ): Promise<void> {
    const { metajs, proxyScript } = this.options;
    const { originalFile, chunk, metajsFile, userjsFile } = fileInfo;
    const sourceAsset = compilation.getAsset(originalFile);
    const waterfall = {
      ...context,
      fileInfo,
      compilation,
    };

    if (!sourceAsset) {
      return;
    }

    const headers = await this.hooks.headers.promise({}, waterfall);
    const headersStr = await this.hooks.renderHeaders.promise(headers);

    const proxyHeaders = proxyScript
      ? await this.hooks.proxyHeaders.promise({}, waterfall)
      : undefined;
    const proxyScriptFile = proxyScript
      ? await this.hooks.proxyScriptFile.promise('', waterfall)
      : undefined;

    const proxyHeadersStr = proxyHeaders
      ? await this.hooks.renderProxyHeaders.promise(proxyHeaders)
      : undefined;

    compilation.emitAsset(
      userjsFile,
      new ConcatSource(headersStr, '\n', sourceAsset.source),
      {
        minimized: true,
      },
    );
    chunk.files.add(userjsFile);

    if (metajs !== false) {
      compilation.emitAsset(
        metajsFile,
        new RawSource(proxyHeadersStr ?? headersStr),
        {
          minimized: true,
        },
      );
      chunk.auxiliaryFiles.add(metajsFile);
    }

    if (proxyScriptFile !== undefined && proxyHeadersStr !== undefined) {
      compilation.emitAsset(proxyScriptFile, new RawSource(proxyHeadersStr), {
        minimized: true,
      });
      chunk.auxiliaryFiles.add(proxyScriptFile);
    }
  }
}
