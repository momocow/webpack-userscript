import { UserscriptPlugin } from 'webpack-userscript';

import { compile } from '../util';
import { Volume } from '../volume';
import { Fixtures } from './fixtures';

describe('load-headers', () => {
  let input: Volume;

  beforeEach(async () => {
    input = Volume.fromJSON({
      '/entry.js': Fixtures.entryJs,
      '/headers.json': Fixtures.headersJson,
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
        filename: 'load-headers.js',
      },
      plugins: [
        new UserscriptPlugin({
          headers: {
            name: 'headers-object',
          },
        }),
      ],
    });

    expect(output.toJSON()).toEqual({
      '/dist/load-headers.user.js':
        Fixtures.headersObjectHeaders + '\n' + Fixtures.entryMinJs,
      '/dist/load-headers.meta.js': Fixtures.headersObjectHeaders,
    });
  });

  it('can be loaded from headers provider function', async () => {
    const output = await compile(input, {
      context: '/',
      mode: 'production',
      entry: '/entry.js',
      output: {
        path: '/dist',
        filename: 'load-headers.js',
      },
      plugins: [
        new UserscriptPlugin({
          headers: (): Record<string, string> => ({
            name: 'headers-provider',
          }),
        }),
      ],
    });

    expect(output.toJSON()).toEqual({
      '/dist/load-headers.user.js':
        Fixtures.headersProviderHeaders + '\n' + Fixtures.entryMinJs,
      '/dist/load-headers.meta.js': Fixtures.headersProviderHeaders,
    });
  });

  it('can be loaded from headers file', async () => {
    const output = await compile(input, {
      context: '/',
      mode: 'production',
      entry: '/entry.js',
      output: {
        path: '/dist',
        filename: 'load-headers.js',
      },
      plugins: [
        new UserscriptPlugin({
          headers: '/headers.json',
        }),
      ],
    });

    expect(output.toJSON()).toEqual({
      '/dist/load-headers.user.js':
        Fixtures.headersFileHeaders + '\n' + Fixtures.entryMinJs,
      '/dist/load-headers.meta.js': Fixtures.headersFileHeaders,
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
        filename: 'load-headers.js',
      },
      plugins: [
        new UserscriptPlugin({
          headers: '/headers.json',
        }),
      ],
    });

    await expect(promise).toReject();
  });
});
