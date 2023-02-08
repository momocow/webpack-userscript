import { UserscriptPlugin } from 'webpack-userscript';

import { compile } from '../util';
import { Volume } from '../volume';
import { Fixtures } from './fixtures';

describe('multi-entry', () => {
  let input: Volume;

  beforeEach(async () => {
    input = Volume.fromJSON({
      '/entry1.js': Fixtures.entryJs,
      '/entry2.js': Fixtures.entryJs,
      '/entry3.js': Fixtures.entryJs,
      '/package.json': Fixtures.packageJson,
    });
  });

  it('should call headers provider against each entry', async () => {
    const headersProvider = jest.fn().mockImplementation(
      ({
        headers,
        fileInfo: {
          chunk: { name },
        },
      }) => headers.update({ name }),
    );

    const output = await compile(input, {
      context: '/',
      mode: 'production',
      entry: {
        entry1: '/entry1.js',
        entry2: '/entry2.js',
        entry3: '/entry3.js',
      },
      output: {
        path: '/dist',
        filename: '[name].js',
      },
      plugins: [
        new UserscriptPlugin({
          headers: headersProvider,
        }),
      ],
    });

    expect(headersProvider).toBeCalledTimes(3);

    expect(output.toJSON()).toEqual({
      '/dist/entry1.user.js': Fixtures.entryUserJs(Fixtures.entry1Headers),
      '/dist/entry1.meta.js': Fixtures.entry1Headers,
      '/dist/entry2.user.js': Fixtures.entryUserJs(Fixtures.entry2Headers),
      '/dist/entry2.meta.js': Fixtures.entry2Headers,
      '/dist/entry3.user.js': Fixtures.entryUserJs(Fixtures.entry3Headers),
      '/dist/entry3.meta.js': Fixtures.entry3Headers,
    });
  });
});
