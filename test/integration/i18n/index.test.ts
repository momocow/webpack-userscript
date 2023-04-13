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

  it('unlocalizable tags', () => {
    const promise = compile(input, {
      ...Fixtures.webpackConfig,
      plugins: [
        new UserscriptPlugin({
          headers: {
            name: 'i18n',
          },
          i18n: {
            en: {
              downloadURL: 'https://example.com',
            },
          },
        }),
      ],
    });

    return expect(promise).toReject();
  });
});
