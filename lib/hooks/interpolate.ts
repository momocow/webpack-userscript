import { Reducer, ReducerFactory, ReducerInfo, UserscriptHooks } from '../hook';

export class Interpolater extends ReducerFactory<unknown> {
  public reducer(): Reducer<unknown> {
    return (data, info) => this.interpolate(data, this.getContextData(info));
  }

  protected applyReducer({ hooks }: UserscriptHooks): void {
    this.tapReducer(hooks.headers);
    this.tapReducer(hooks.proxyHeaders);
    this.tapReducer(hooks.proxyScriptFile);
  }

  private getContextData({
    fileInfo: { chunk, originalFile, filename, basename, query },
    buildNo,
  }: ReducerInfo): Record<string, string> {
    return {
      chunkName: chunk.name,
      file: originalFile,
      filename,
      basename,
      query,
      buildNo: buildNo.toString(),
      buildTime: Date.now().toString(),
    };
  }

  private interpolate(data: unknown, info: Record<string, string>): unknown {
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
      );
    }

    return data;
  }
}
