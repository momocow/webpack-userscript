import {
  HeadersProps,
  UserscriptPluginInstance,
  ValueType,
  WaterfallContext,
} from '../types';
import { Feature } from './feature';

export class Interpolater extends Feature {
  public readonly name = 'Interpolater';

  public apply({ hooks }: UserscriptPluginInstance): void {
    hooks.headers.tap(this.name, (headers, ctx) =>
      this.interpolate(headers, this.getVariables(ctx)),
    );

    hooks.proxyHeaders.tap(this.name, (headers, ctx) =>
      this.interpolate(headers, this.getVariables(ctx)),
    );

    hooks.proxyScriptFile.tap(this.name, (filepath, ctx) =>
      this.interpolate(filepath, this.getVariables(ctx)),
    );
  }

  private getVariables({
    fileInfo: { chunk, originalFile, filename, basename, query, dirname },
    buildNo,
  }: WaterfallContext): Record<string, string> {
    return {
      chunkName: chunk.name,
      file: originalFile,
      filename,
      basename,
      query,
      dirname,
      buildNo: buildNo.toString(),
      buildTime: Date.now().toString(),
    };
  }

  private interpolate(
    data: HeadersProps,
    info: Record<string, string>,
  ): HeadersProps;
  private interpolate<T extends ValueType>(
    data: T,
    info: Record<string, string>,
  ): T;
  private interpolate(
    data: HeadersProps | ValueType,
    info: Record<string, string>,
  ): HeadersProps | ValueType {
    if (typeof data === 'string') {
      return Object.entries(info).reduce((value, [dataKey, dataVal]) => {
        return value.replace(new RegExp(`\\[${dataKey}\\]`, 'g'), `${dataVal}`);
      }, data);
    }

    if (Array.isArray(data)) {
      return data.map((item) => this.interpolate(item, info));
    }

    if (typeof data === 'object' && data !== null) {
      return Object.fromEntries(
        Object.entries(data).map(([k, v]) => [
          this.interpolate(k, info),
          this.interpolate(v, info),
        ]),
      ) as HeadersProps;
    }

    return data;
  }
}
