import { UserscriptPlugin } from 'webpack-userscript';

import { compile } from '../util';
import { Volume } from '../volume';
import { Fixtures } from './fixtures';

describe('proxy script', () => {
  let input: Volume;

  beforeEach(async () => {
    input = Volume.fromJSON({
      '/entry.js': Fixtures.entryJs,
      '/package.json': Fixtures.packageJson,
    });
  });

  it('should generate proxy script at default location', async () => {
    const output = await compile(input, {
      ...Fixtures.webpackConfig,
      plugins: [
        new UserscriptPlugin({
          headers: {
            // these URLs should be ignored in proxy scripts
            updateURL: 'http://example.com',
            downloadURL: 'http://example.com',
            installURL: 'http://example.com',
            // require tag will be extended in the proxy script
            require: ['http://require.example.com'],
          },
          proxyScript: {},
        }),
      ],
    });

    expect(output.toJSON()).toEqual({
      '/dist/output.proxy.user.js': Fixtures.proxyScriptProxyHeaders,
      '/dist/output.user.js': Fixtures.entryUserJs(Fixtures.proxyScriptHeaders),
      '/dist/output.meta.js': Fixtures.proxyScriptHeaders,
    });
  });

  it('should generate proxy script at specified location', async () => {
    const output = await compile(input, {
      ...Fixtures.webpackConfig,
      plugins: [
        new UserscriptPlugin({
          headers: {
            // these URLs should be ignored in proxy scripts
            updateURL: 'http://example.com',
            downloadURL: 'http://example.com',
            installURL: 'http://example.com',
            // require tag will be extended in the proxy script
            require: 'http://require.example.com',
          },
          proxyScript: {
            filename: 'custom.proxy.user.js',
          },
        }),
      ],
    });

    expect(output.toJSON()).toEqual({
      '/dist/custom.proxy.user.js': Fixtures.proxyScriptProxyHeaders,
      '/dist/output.user.js': Fixtures.entryUserJs(Fixtures.proxyScriptHeaders),
      '/dist/output.meta.js': Fixtures.proxyScriptHeaders,
    });
  });

  it('should generate proxy script with custom baseURL of userjs', async () => {
    const output = await compile(input, {
      ...Fixtures.webpackConfig,
      plugins: [
        new UserscriptPlugin({
          headers: {
            // these URLs should be ignored in proxy scripts
            updateURL: 'http://example.com',
            downloadURL: 'http://example.com',
            installURL: 'http://example.com',
          },
          proxyScript: {
            baseURL: 'http://base.example.com',
          },
        }),
      ],
    });

    expect(output.toJSON()).toEqual({
      '/dist/output.proxy.user.js': Fixtures.baseURLProxyScriptProxyHeaders,
      '/dist/output.user.js': Fixtures.entryUserJs(
        Fixtures.baseURLProxyScriptHeaders,
      ),
      '/dist/output.meta.js': Fixtures.baseURLProxyScriptHeaders,
    });
  });
});
