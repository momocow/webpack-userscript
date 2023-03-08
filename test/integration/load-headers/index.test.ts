import { HeadersProps, UserscriptPlugin } from 'webpack-userscript';

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

      const loadFromHeadersFile = jest.spyOn(
        plugin.features[0],
        'loadFromHeadersFile' as any,
      );

      const entry = './entry.js';
      let step = 0;

      await watchCompile(
        input,
        {
          ...Fixtures.webpackConfig,
          context: '/',
          entry,
          plugins: [plugin],
        },
        async ({ output, writeFile }) => {
          switch (++step) {
            case 1:
              await writeFile(entry, Fixtures.entryJs);
              expect(output.toJSON()).toEqual({
                '/dist/output.user.js': Fixtures.entryUserJs(
                  Fixtures.loadHeadersHeaders,
                ),
                '/dist/output.meta.js': Fixtures.loadHeadersHeaders,
              });
              break;

            case 2:
              break;

            default:
              fail('invalid steps');
          }

          return step < 2;
        },
      );

      if (step !== 2) {
        fail('invalid steps');
      }

      expect(loadFromHeadersFile).toHaveBeenCalledOnce();
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
