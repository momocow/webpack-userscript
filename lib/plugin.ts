import path from 'node:path';

import {
  AsyncParallelHook,
  AsyncSeriesBailHook,
  AsyncSeriesWaterfallHook,
} from 'tapable';
import { Compilation, Compiler, sources, WebpackPluginInstance } from 'webpack';

import { DEFAULT_LOCALE_KEY } from './const';
import {
  Feature,
  FixTags,
  Interpolater,
  LoadHeaders,
  LoadHeadersOptions,
  ProcessProxyScript,
  ProcessSSRI,
  ProxyScriptOptions,
  RenderHeaders,
  RenderHeadersOptions,
  ResolveBaseURLs,
  ResolveBaseURLsOptions,
  SetDefaultTags,
  SSRIOptions,
  ValidateHeaders,
  ValidateHeadersOptions,
} from './features';
import {
  CompilationContext,
  FileInfo,
  HeadersProps,
  UserscriptPluginInstance,
  WaterfallContext,
} from './types';
import { date } from './utils';

const { ConcatSource, RawSource } = sources;

export interface UserscriptPluginOptions {
  metajs?: boolean;
  skip?: (fileInfo: FileInfo) => boolean;
  proxyScript?: unknown;
  i18n?: Record<string, unknown>;
}

export type UserscriptOptions = LoadHeadersOptions &
  ResolveBaseURLsOptions &
  SSRIOptions &
  ProxyScriptOptions &
  RenderHeadersOptions &
  ValidateHeadersOptions &
  UserscriptPluginOptions;

export class UserscriptPlugin
  implements WebpackPluginInstance, UserscriptPluginInstance
{
  public readonly name = 'UserscriptPlugin';

  public readonly features: Feature[];

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
    renderHeaders: new AsyncSeriesBailHook<Map<string, HeadersProps>, string>([
      'headersProps',
    ]),
    renderProxyHeaders: new AsyncSeriesBailHook<HeadersProps, string>([
      'headersProps',
    ]),
  };

  private readonly contexts = new WeakMap<Compilation, CompilationContext>();
  private options: UserscriptPluginOptions = {};

  public constructor(options: UserscriptOptions = {}) {
    const { metajs = true, strict = true } = options;
    Object.assign(options, { metajs, strict } as UserscriptOptions);

    this.features = [
      new LoadHeaders(options),
      new FixTags(options),
      new ResolveBaseURLs(options),
      new ProcessSSRI(options),
      new SetDefaultTags(options),
      new ProcessProxyScript(options),
      new Interpolater(options),
      new ValidateHeaders(options),
      new RenderHeaders(options),
    ];

    this.options = options;
  }

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
        buildTime: date(),
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

    /* istanbul ignore next */
    if (!context) {
      return;
    }

    context.fileInfo = this.collectFileInfo(compilation);

    await this.hooks.preprocess.promise(compilation, context);
  }

  private async process(compilation: Compilation): Promise<void> {
    const context = this.contexts.get(compilation);

    /* istanbul ignore next */
    if (!context) {
      return;
    }

    await Promise.all(
      context.fileInfo.map((fileInfo) =>
        this.emitUserscript(compilation, context, fileInfo),
      ),
    );

    for (const { originalFile, userjsFile } of context.fileInfo) {
      if (originalFile !== userjsFile) {
        compilation.deleteAsset(originalFile);
      }
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
        const filepath = originalFile.slice(0, q);
        const query = originalFile.slice(q);
        const dirname = path.dirname(filepath);
        const filename = path.basename(filepath);
        const basename = filepath.endsWith('.user.js')
          ? path.basename(filepath, '.user.js')
          : filepath.endsWith('.js')
          ? path.basename(filepath, '.js')
          : filepath;
        const extname = path.extname(filepath);

        const userjsFile = path.join(dirname, basename + '.user.js') + query;
        const metajsFile = path.join(dirname, basename + '.meta.js');

        const fileInfoEntry = {
          chunk,
          originalFile,
          userjsFile,
          metajsFile,
          filename,
          dirname,
          basename,
          query,
          extname,
        };

        if (this.options.skip?.(fileInfoEntry) ?? extname !== '.js') {
          continue;
        }

        fileInfo.push(fileInfoEntry);
      }
    }

    return fileInfo;
  }

  private async emitUserscript(
    compilation: Compilation,
    context: CompilationContext,
    fileInfo: FileInfo,
  ): Promise<void> {
    const { metajs, proxyScript, i18n } = this.options;
    const { originalFile, chunk, metajsFile, userjsFile } = fileInfo;
    const sourceAsset = compilation.getAsset(originalFile);
    const waterfall = {
      ...context,
      fileInfo,
      compilation,
    };

    if (!sourceAsset) {
      /* istanbul ignore next */
      return;
    }

    const localizedHeaders = new Map<string, HeadersProps>();

    const headers = await this.hooks.headers.promise(
      {},
      { ...waterfall, locale: DEFAULT_LOCALE_KEY },
    );
    localizedHeaders.set(DEFAULT_LOCALE_KEY, headers);

    if (i18n) {
      await Promise.all(
        Object.keys(i18n).map(async (locale) => {
          localizedHeaders.set(
            locale,
            await this.hooks.headers.promise({}, { ...waterfall, locale }),
          );
        }),
      );
    }

    const headersStr = await this.hooks.renderHeaders.promise(localizedHeaders);

    const proxyHeaders = proxyScript
      ? await this.hooks.proxyHeaders.promise(headers, {
          ...waterfall,
          locale: DEFAULT_LOCALE_KEY,
        })
      : undefined;
    const proxyScriptFile = proxyScript
      ? await this.hooks.proxyScriptFile.promise('', {
          ...waterfall,
          locale: DEFAULT_LOCALE_KEY,
        })
      : undefined;

    const proxyHeadersStr = proxyHeaders
      ? await this.hooks.renderProxyHeaders.promise(proxyHeaders)
      : undefined;

    if (userjsFile !== originalFile) {
      compilation.emitAsset(
        userjsFile,
        new ConcatSource(headersStr, '\n', sourceAsset.source),
        {
          minimized: true,
        },
      );
      chunk.files.add(userjsFile);
    } else {
      compilation.updateAsset(
        userjsFile,
        new ConcatSource(headersStr, '\n', sourceAsset.source),
        {
          minimized: true,
        },
      );
    }

    if (metajs !== false) {
      compilation.emitAsset(metajsFile, new RawSource(headersStr), {
        minimized: true,
      });
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
