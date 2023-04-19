import { HeadersProps, UserscriptPlugin } from 'webpack-userscript';

import { compile } from '../util';
import { Volume } from '../volume';
import { Fixtures } from './fixtures';

describe('i18n', () => {
  let input: Volume;

  beforeEach(async () => {
    input = Volume.fromJSON({
      '/entry.js': Fixtures.entryJs,
      '/package.json': Fixtures.packageJson,
    });
  });

  it('headers object', async () => {
    const output = await compile(input, {
      ...Fixtures.webpackConfig,
      plugins: [
        new UserscriptPlugin({
          headers: {
            name: 'i18n',
          },
          i18n: {
            en: {
              name: 'localized name',
              description: 'i18n description',
            },
          },
        }),
      ],
    });

    expect(output.toJSON()).toEqual({
      '/dist/output.user.js': Fixtures.entryUserJs(Fixtures.i18nHeaders),
      '/dist/output.meta.js': Fixtures.i18nHeaders,
    });
  });

  it('headers file', async () => {
    input.writeFileSync(
      '/headers.json',
      JSON.stringify({
        name: 'localized name',
        description: 'i18n description',
      }),
    );

    const output = await compile(input, {
      ...Fixtures.webpackConfig,
      plugins: [
        new UserscriptPlugin({
          headers: {
            name: 'i18n',
          },
          i18n: {
            en: '/headers.json',
          },
        }),
      ],
    });

    expect(output.toJSON()).toEqual({
      '/dist/output.user.js': Fixtures.entryUserJs(Fixtures.i18nHeaders),
      '/dist/output.meta.js': Fixtures.i18nHeaders,
    });
  });

  it('headers provider', async () => {
    const output = await compile(input, {
      ...Fixtures.webpackConfig,
      plugins: [
        new UserscriptPlugin({
          headers: {
            name: 'i18n',
          },
          i18n: {
            en: (headers): HeadersProps => ({
              ...headers,
              name: 'localized name',
              description: 'i18n description',
            }),
          },
        }),
      ],
    });

    expect(output.toJSON()).toEqual({
      '/dist/output.user.js': Fixtures.entryUserJs(Fixtures.i18nHeaders),
      '/dist/output.meta.js': Fixtures.i18nHeaders,
    });
  });

  describe('unlocalizable tags', () => {
    it('are rejected in strict mode', () => {
      const promise = compile(input, {
        ...Fixtures.webpackConfig,
        plugins: [
          new UserscriptPlugin({
            headers: {
              name: 'i18n',
            },
            i18n: {
              en: {
                name: 'localized name',
                downloadURL: 'https://example.com',
              },
            },
          }),
        ],
      });

      return expect(promise).toReject();
    });

    it('are allowed in non-strict mode', async () => {
      const output = await compile(input, {
        ...Fixtures.webpackConfig,
        plugins: [
          new UserscriptPlugin({
            headers: {
              name: 'non-strict i18n',
            },
            i18n: {
              en: (headers): HeadersProps => ({
                ...headers,
                downloadURL: 'https://example.com',
              }),
            },
            strict: false,
          }),
        ],
      });

      expect(output.toJSON()).toEqual({
        '/dist/output.user.js': Fixtures.entryUserJs(
          Fixtures.nonStrictI18nHeaders,
        ),
        '/dist/output.meta.js': Fixtures.nonStrictI18nHeaders,
      });
    });

    it('are stripped in whitelist mode', async () => {
      const output = await compile(input, {
        ...Fixtures.webpackConfig,
        plugins: [
          new UserscriptPlugin({
            headers: {
              name: 'i18n',
            },
            i18n: {
              en: {
                name: 'localized name',
                description: 'i18n description',
                // downloadURL will be stripped
                downloadURL: 'https://example.com',
              },
            },
            whitelist: true,
          }),
        ],
      });

      expect(output.toJSON()).toEqual({
        '/dist/output.user.js': Fixtures.entryUserJs(Fixtures.i18nHeaders),
        '/dist/output.meta.js': Fixtures.i18nHeaders,
      });
    });
  });
});
