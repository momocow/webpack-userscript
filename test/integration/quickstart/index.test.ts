import fs from 'node:fs/promises';
import path from 'node:path';

import { createFsFromVolume, IFs, Volume } from 'memfs';
import { Configuration } from 'webpack';

import { compile, GLOBAL_FIXTURES_DIR } from '../util';

describe('quickstart', () => {
  let webpackConfig: Configuration;
  let ifs: IFs;
  let entryUserJs: string;

  beforeEach(async () => {
    webpackConfig = {
      context: '/',
      entry: '/entry.js',
      output: {
        path: '/dist',
        filename: 'quickstart',
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

    ifs = createFsFromVolume(
      Volume.fromJSON({
        '/entry.js': entryJs,
        '/package.json': packageJson,
      }),
    );
  });

  it('should successfully compile with default options', async () => {
    const ofs = await compile(ifs, webpackConfig);

    const headersJs = await fs.readFile(
      path.resolve(__dirname, './fixtures/headers.js'),
      'utf-8',
    );

    expect(ofs.toJSON()).toEqual({
      '/dist/quickstart.user.js': headersJs + '\n\n' + entryUserJs,
      '/dist/quickstart.meta.js': headersJs,
    });
  });
});
