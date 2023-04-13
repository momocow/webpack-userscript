import { DEFAULT_LOCALE_KEY } from '../../const';
import {
  HeadersProps,
  UserscriptPluginInstance,
  WaterfallContext,
} from '../../types';
import { Feature } from '../feature';
import {
  FileLoader,
  HeadersFile,
  HeadersProvider,
  ObjectLoader,
  PackageLoader,
  ProviderLoader,
} from './loaders';

export type HeadersOption = HeadersProps | HeadersFile | HeadersProvider;

export interface LoadHeadersOptions {
  root?: string;
  headers?: HeadersOption;
  i18n?: Record<string, HeadersOption>;
}

export class LoadHeaders extends Feature<LoadHeadersOptions> {
  public readonly name = 'LoadHeaders';

  private packageLoader!: PackageLoader;
  private objectLoaders: Map<string, ObjectLoader> = new Map();
  private fileLoaders: Map<string, FileLoader> = new Map();
  private providerLoaders: Map<string, ProviderLoader> = new Map();

  public apply({ hooks }: UserscriptPluginInstance): void {
    const { headers: headersOption, i18n = {}, root } = this.options;

    this.packageLoader = new PackageLoader(root);

    if (headersOption) {
      this.addLoader(DEFAULT_LOCALE_KEY, headersOption);
    }

    for (const [locale, i18nHeadersOption] of Object.entries(i18n)) {
      this.addLoader(locale, i18nHeadersOption);
    }

    hooks.init.tapPromise(this.name, async (compiler) => {
      await this.packageLoader.load(compiler);
    });

    if (this.fileLoaders.size > 0) {
      hooks.preprocess.tapPromise(this.name, async (compilation) => {
        await Promise.all(
          Array.from(this.fileLoaders.values()).map((fileLoader) =>
            fileLoader.load(compilation),
          ),
        );
      });
    }

    hooks.headers.tapPromise(this.name, async (_, ctx) =>
      this.provideHeaders(ctx),
    );
  }

  private addLoader(locale: string, headersOption: HeadersOption): void {
    if (typeof headersOption === 'object') {
      this.objectLoaders.set(locale, new ObjectLoader(headersOption));

      return;
    }

    if (typeof headersOption === 'string') {
      this.fileLoaders.set(
        locale,
        new FileLoader(headersOption, this.options.root),
      );

      return;
    }

    this.providerLoaders.set(locale, new ProviderLoader(headersOption));
  }

  private async provideHeaders(ctx: WaterfallContext): Promise<HeadersProps> {
    const { locale } = ctx;
    const headersBase = {};

    if (locale === DEFAULT_LOCALE_KEY) {
      Object.assign(headersBase, this.packageLoader.headers);
    }
    Object.assign(headersBase, this.objectLoaders.get(locale)?.headers);
    Object.assign(headersBase, this.fileLoaders.get(locale)?.headers);

    return (
      this.providerLoaders.get(locale)?.load(headersBase, ctx) ?? headersBase
    );
  }
}
