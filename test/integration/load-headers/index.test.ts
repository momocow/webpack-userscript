import { UserscriptPlugin } from 'webpack-userscript';

import { compile } from '../util';
import { Volume } from '../volume';
import { Fixtures } from './fixtures';

describe('load-headers', () => {
  let input: Volume;

  beforeEach(async () => {
    input = Volume.fromJSON({
      '/entry.js': Fixtures.entryJs,
      '/package.json': Fixtures.packageJson,
    });
  });

  it('can be loaded from headers object', async () => {
    const output = await compile(input, {
      context: '/',
      mode: 'production',
      entry: '/entry.js',
      output: {
        path: '/dist',
        filename: 'output.js',
      },
      plugins: [
        new UserscriptPlugin({
          headers: {
            name: 'load-headers',
          },
        }),
      ],
    });

    expect(output.toJSON()).toEqual({
      '/dist/output.user.js': Fixtures.entryUserJs(Fixtures.loadHeadersHeaders),
      '/dist/output.meta.js': Fixtures.loadHeadersHeaders,
    });
  });

  it('can be loaded from headers file', async () => {
    input.writeFileSync('/headers.json', Fixtures.headersJson);

    const output = await compile(input, {
      context: '/',
      mode: 'production',
      entry: '/entry.js',
      output: {
        path: '/dist',
        filename: 'output.js',
      },
      plugins: [
        new UserscriptPlugin({
          headers: '/headers.json',
        }),
      ],
    });

    expect(output.toJSON()).toEqual({
      '/dist/output.user.js': Fixtures.entryUserJs(Fixtures.loadHeadersHeaders),
      '/dist/output.meta.js': Fixtures.loadHeadersHeaders,
    });
  });

  it('should throw error if headers file is not in .json format', async () => {
    input.writeFileSync('/headers.json', '{"name": "invalid-json",');

    const promise = compile(input, {
      context: '/',
      mode: 'production',
      entry: '/entry.js',
      output: {
        path: '/dist',
        filename: 'output.js',
      },
      plugins: [
        new UserscriptPlugin({
          headers: '/headers.json',
        }),
      ],
    });

    await expect(promise).toReject();
  });

  describe('headers provider', () => {
    it('can be loaded from headers provider function', async () => {
      const output = await compile(input, {
        context: '/',
        mode: 'production',
        entry: '/entry.js',
        output: {
          path: '/dist',
          filename: 'output.js',
        },
        plugins: [
          new UserscriptPlugin({
            headers: (): Record<string, string> => ({
              name: 'load-headers',
            }),
          }),
        ],
      });

      expect(output.toJSON()).toEqual({
        '/dist/output.user.js': Fixtures.entryUserJs(
          Fixtures.loadHeadersHeaders,
        ),
        '/dist/output.meta.js': Fixtures.loadHeadersHeaders,
      });
    });

    it('can be loaded from async headers provider function', async () => {
      const output = await compile(input, {
        context: '/',
        mode: 'production',
        entry: '/entry.js',
        output: {
          path: '/dist',
          filename: 'output.js',
        },
        plugins: [
          new UserscriptPlugin({
            headers: async (): Promise<Record<string, string>> => ({
              name: 'load-headers',
            }),
          }),
        ],
      });

      expect(output.toJSON()).toEqual({
        '/dist/output.user.js': Fixtures.entryUserJs(
          Fixtures.loadHeadersHeaders,
        ),
        '/dist/output.meta.js': Fixtures.loadHeadersHeaders,
      });
    });
  });
});
