import path from 'node:path';
import { promisify } from 'node:util';

import { Compilation, Compiler } from 'webpack';

import { findPackage, FsReadFile, FsStat, readJSON } from '../../fs';
import { HeadersProps, WaterfallContext } from '../../types';

export class ObjectLoader {
  public constructor(public headers: HeadersProps) {}

  public load(): HeadersProps {
    return this.headers;
  }
}

export type HeadersFile = string;

export class FileLoader {
  public headers?: HeadersProps;

  private headersFileTimestamp = 0;

  public constructor(private file: HeadersFile, private root?: string) {}

  public async load(compilation: Compilation): Promise<HeadersProps> {
    const getFileTimestampAsync = promisify(
      compilation.fileSystemInfo.getFileTimestamp.bind(
        compilation.fileSystemInfo,
      ),
    );

    const resolvedHeadersFile = path.resolve(
      this.root ?? compilation.compiler.context,
      this.file,
    );

    const ts = await getFileTimestampAsync(resolvedHeadersFile);

    if (
      this.headers &&
      ts &&
      typeof ts === 'object' &&
      typeof ts.timestamp === 'number' &&
      this.headersFileTimestamp >= ts.timestamp
    ) {
      // file no change
      return this.headers;
    }

    if (ts && typeof ts === 'object') {
      this.headersFileTimestamp = ts.timestamp ?? this.headersFileTimestamp;
    }

    compilation.fileDependencies.add(resolvedHeadersFile);

    return (this.headers = await readJSON<HeadersProps>(
      resolvedHeadersFile,
      compilation.inputFileSystem as FsReadFile,
    ));
  }
}

export type HeadersProvider = (
  headers: HeadersProps,
  ctx: WaterfallContext,
) => HeadersProps | Promise<HeadersProps>;

export class ProviderLoader {
  public constructor(private provider: HeadersProvider) {}

  public async load(
    headers: HeadersProps,
    ctx: WaterfallContext,
  ): Promise<HeadersProps> {
    return this.provider(headers, ctx);
  }
}

interface PackageInfo {
  name?: string;
  version?: string;
  description?: string;
  author?: string;
  homepage?: string;
  bugs?: string | { url?: string };
}

export class PackageLoader {
  public headers?: HeadersProps;

  public constructor(private root?: string) {}

  public async load(compiler: Compiler): Promise<HeadersProps> {
    if (!this.headers) {
      try {
        const cwd = await findPackage(
          this.root ?? compiler.context,
          compiler.inputFileSystem as FsStat,
        );
        const packageJson = await readJSON<PackageInfo>(
          path.join(cwd, 'package.json'),
          compiler.inputFileSystem as FsReadFile,
        );

        this.headers = {
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
        this.headers = {};
      }
    }

    return this.headers;
  }
}
