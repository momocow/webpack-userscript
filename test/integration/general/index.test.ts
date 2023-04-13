import { UserscriptPlugin } from 'webpack-userscript';

import { compile } from '../util';
import { Volume } from '../volume';
import { Fixtures } from './fixtures';

describe('general', () => {
  let input: Volume;

  beforeEach(async () => {
    input = Volume.fromJSON({
      '/entry.js': Fixtures.entryJs,
      '/package.json': Fixtures.packageJson,
    });
  });

  it('should successfully compile with default options', async () => {
    const output = await compile(input, {
      ...Fixtures.webpackConfig,
      plugins: [new UserscriptPlugin()],
    });

    expect(output.toJSON()).toEqual({
      '/dist/output.user.js': Fixtures.entryUserJs(Fixtures.headers),
      '/dist/output.meta.js': Fixtures.headers,
    });
  });

  it('should skip files based on the skip option', async () => {
    const output = await compile(input, {
      ...Fixtures.webpackConfig,
      plugins: [
        new UserscriptPlugin({
          skip: (): boolean => true,
        }),
      ],
    });

    expect(output.toJSON()).toEqual({
      '/dist/output.js': Fixtures.entryMinJs,
    });
  });

  // eslint-disable-next-line max-len
  it('should successfully compile even the file extension is .user.js', async () => {
    input.renameSync('/entry.js', '/entry.user.js');

    const output = await compile(input, {
      ...Fixtures.webpackConfig,
      entry: '/entry.user.js',
      output: {
        path: '/dist',
        filename: 'output.user.js',
      },
      plugins: [new UserscriptPlugin()],
    });

    expect(output.toJSON()).toEqual({
      '/dist/output.user.js': Fixtures.entryUserJs(Fixtures.headers),
      '/dist/output.meta.js': Fixtures.headers,
    });
  });
});
