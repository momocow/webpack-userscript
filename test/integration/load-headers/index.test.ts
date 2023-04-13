import path from 'node:path';

import { HeadersProps, UserscriptPlugin } from 'webpack-userscript';
import * as fs from 'webpack-userscript/fs';

import { compile, watchCompile } from '../util';
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
      ...Fixtures.webpackConfig,
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

  describe('headers file', () => {
    it('can be loaded from headers file', async () => {
      input.writeFileSync('/headers.json', Fixtures.headersJson);

      const output = await compile(input, {
        ...Fixtures.webpackConfig,
        plugins: [
          new UserscriptPlugin({
            headers: '/headers.json',
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

    // eslint-disable-next-line max-len
    it('should throw error if headers file is not in .json format', async () => {
      input.writeFileSync('/headers.json', '{"name": "invalid-json",');

      const promise = compile(input, {
        ...Fixtures.webpackConfig,
        plugins: [
          new UserscriptPlugin({
            headers: '/headers.json',
          }),
        ],
      });

      await expect(promise).toReject();
    });

    // eslint-disable-next-line max-len
    it('should reuse from headers file if the file is not changed', async () => {
      input.writeFileSync('/headers.json', Fixtures.headersJson);

      const plugin = new UserscriptPlugin({
        headers: './headers.json',
      });

      const readJSONSpy = jest.spyOn(fs, 'readJSON');

      const entry = './entry.js';
      let step = 0;
      let inputFullPath = '';

      await watchCompile(
        input,
        {
          ...Fixtures.webpackConfig,
          context: '/',
          entry,
          plugins: [plugin],
        },
        async ({ output, writeFile, cwd }) => {
          switch (++step) {
            case 1:
              expect(output.toJSON()).toEqual({
                '/dist/output.user.js': Fixtures.entryUserJs(
                  Fixtures.loadHeadersHeaders,
                ),
                '/dist/output.meta.js': Fixtures.loadHeadersHeaders,
              });
              await writeFile(entry, Fixtures.entryJs);
              break;

            case 2:
              break;

            default:
              fail('invalid steps');
          }

          inputFullPath = cwd;

          return step < 2;
        },
      );

      if (step !== 2) {
        fail('invalid steps');
      }

      const headersJsonPath = path.join(inputFullPath, 'headers.json');

      // headers.json has only been read once
      expect(
        readJSONSpy.mock.calls.reduce(
          (count, call) => (call[0] === headersJsonPath ? ++count : count),
          0,
        ),
      ).toEqual(1);

      readJSONSpy.mockRestore();
    });
  });

  it('should compile if package.json does not exist', async () => {
    input.rmSync('/package.json');

    const output = await compile(input, {
      ...Fixtures.webpackConfig,
      plugins: [
        new UserscriptPlugin({
          headers: {
            name: 'userscript',
            version: '0.0.0',
            description: 'this is a fantastic userscript',
          },
        }),
      ],
    });

    expect(output.toJSON()).toEqual({
      '/dist/output.user.js': Fixtures.entryUserJs(Fixtures.headers),
      '/dist/output.meta.js': Fixtures.headers,
    });
  });

  describe('headers provider', () => {
    it('can be loaded from headers provider function', async () => {
      const output = await compile(input, {
        ...Fixtures.webpackConfig,
        plugins: [
          new UserscriptPlugin({
            headers: (headers): HeadersProps => ({
              ...headers,
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
        ...Fixtures.webpackConfig,
        plugins: [
          new UserscriptPlugin({
            headers: async (headers): Promise<HeadersProps> => ({
              ...headers,
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
