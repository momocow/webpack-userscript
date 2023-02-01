import { readFileSync } from 'node:fs';
import path from 'node:path';

import { Memoize } from 'typescript-memoize';

import { FixtureBase } from './util';

export class GlobalFixtures extends FixtureBase {
  @Memoize()
  public static get entryJs(): string {
    return readFileSync(
      path.resolve(__dirname, this.globalFixturesDir, 'entry.js.txt'),
      'utf-8',
    );
  }

  @Memoize()
  public static get entryMinJs(): string {
    return readFileSync(
      path.resolve(__dirname, this.globalFixturesDir, 'entry.min.js.txt'),
      'utf-8',
    );
  }

  @Memoize()
  public static get headers(): string {
    return readFileSync(
      path.resolve(__dirname, this.globalFixturesDir, 'headers.txt'),
      'utf-8',
    );
  }

  @Memoize()
  public static get packageJson(): string {
    return JSON.stringify(this.packageInfo);
  }

  @Memoize()
  public static get packageInfo(): Record<string, unknown> {
    return {
      ...this.basePackageInfo,
      ...this.additionalPackageInfo,
    };
  }

  @Memoize()
  public static get basePackageInfo(): Record<string, unknown> {
    return JSON.parse(
      readFileSync(
        path.resolve(__dirname, this.globalFixturesDir, 'package.json.txt'),
        'utf-8',
      ),
    );
  }

  protected static get additionalPackageInfo(): Record<string, unknown> {
    return {};
  }
}
