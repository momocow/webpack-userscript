import fs from 'node:fs';
import path from 'node:path';

import { Memoize } from 'typescript-memoize';
import { Configuration } from 'webpack';

import { FixtureBase } from '../util';

export class Fixture extends FixtureBase {
  @Memoize()
  public static get entryJs(): string {
    return fs.readFileSync(
      path.resolve(__dirname, this.globalFixturesDir, 'entry.js.txt'),
      'utf-8',
    );
  }

  @Memoize()
  public static get entryUserJs(): string {
    return fs.readFileSync(
      path.resolve(__dirname, this.globalFixturesDir, 'entry.user.js.txt'),
      'utf-8',
    );
  }

  @Memoize()
  public static get headersJs(): string {
    return fs.readFileSync(
      path.resolve(__dirname, './headers.js.txt'),
      'utf-8',
    );
  }

  @Memoize()
  public static get packageJson(): string {
    return JSON.stringify({
      name: 'quickstart',
      version: '0.0.0',
    });
  }

  @Memoize()
  public static get webpackConfig(): Configuration {
    return {
      context: '/',
      mode: 'production',
      entry: '/entry.js',
      output: {
        path: '/dist',
        filename: 'quickstart.js',
      },
    };
  }
}
