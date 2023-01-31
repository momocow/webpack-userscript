import fs from 'node:fs/promises';
import path from 'node:path';

import { Configuration } from 'webpack';

import { Volume } from '../types';
import { compile, GLOBAL_FIXTURES_DIR } from '../util';

describe('quickstart', () => {
  let webpackConfig: Configuration;
  let input: Volume;
  let entryUserJs: string;

  beforeEach(async () => {
    webpackConfig = {
      context: '/',
      mode: 'production',
      entry: '/entry.js',
      output: {
        path: '/dist',
        filename: 'quickstart.js',
      },
    };

    const entryJs = await fs.readFile(
      path.resolve(__dirname, GLOBAL_FIXTURES_DIR, 'entry.js'),
      'utf-8',
    );

    entryUserJs = await fs.readFile(
      path.resolve(__dirname, GLOBAL_FIXTURES_DIR, 'entry.user.js'),
      'utf-8',
    );

    const packageJson = JSON.stringify({
      name: 'quickstart',
      version: '0.0.0',
    });

    input = Volume.fromJSON({
      '/entry.js': entryJs,
      '/package.json': packageJson,
    });
  });

  it('should successfully compile with default options', async () => {
    const output = await compile(input, webpackConfig);

    const headersJs = await fs.readFile(
      path.resolve(__dirname, './fixtures/headers.js'),
      'utf-8',
    );

    expect(output.toJSON()).toEqual({
      '/dist/quickstart.user.js': headersJs + '\n' + entryUserJs,
      '/dist/quickstart.meta.js': headersJs,
    });
  });
});
