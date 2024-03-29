import path from 'node:path';

import fetch from 'node-fetch';
import { UserscriptPlugin } from 'webpack-userscript';

import { compile, readJSON, servceStatic, ServeStatic } from '../util';
import { createFsFromVolume, Volume } from '../volume';
import { Fixtures } from './fixtures';

jest.mock('node-fetch', () =>
  jest.fn(jest.requireActual('node-fetch') as typeof fetch),
);

describe('ssri', () => {
  let input: Volume;
  let server: ServeStatic;
  let tplData: { PORT: string };

  beforeAll(async () => {
    server = await servceStatic(path.join(__dirname, 'static'));
    tplData = {
      PORT: String(server.port),
    };
  });

  afterAll(async () => {
    await server.close();
  });

  beforeEach(async () => {
    input = Volume.fromJSON({
      '/entry.js': Fixtures.entryJs,
      '/package.json': Fixtures.packageJson,
    });
  });

  it('should generate SSRIs and ssri-lock.json under the context', async () => {
    const output = await compile(input, {
      ...Fixtures.webpackConfig,
      context: '/home',
      plugins: [
        new UserscriptPlugin({
          headers: {
            require: `http://localhost:${server.port}/jquery-3.4.1.min.js`,
            resource: {
              // eslint-disable-next-line max-len
              'legacy-badge': `http://localhost:${server.port}/travis-webpack-userscript.svg`,
            },
          },
          ssri: {},
        }),
      ],
    });

    expect(output.toJSON()).toEqual(
      expect.objectContaining({
        '/dist/output.user.js': Fixtures.entryUserJs(
          Fixtures.ssriHeaders(tplData),
        ),
        '/dist/output.meta.js': Fixtures.ssriHeaders(tplData),
      }),
    );

    expect(readJSON(output, '/home/ssri-lock.json')).toEqual(
      JSON.parse(Fixtures.ssriLockJson(tplData)),
    );
  });

  it('should generate SSRIs and ssri-lock.json under the root', async () => {
    const output = await compile(input, {
      ...Fixtures.webpackConfig,
      context: '/home',
      plugins: [
        new UserscriptPlugin({
          headers: {
            require: `http://localhost:${server.port}/jquery-3.4.1.min.js`,
            resource: {
              // eslint-disable-next-line max-len
              'legacy-badge': `http://localhost:${server.port}/travis-webpack-userscript.svg`,
            },
          },
          root: '/data',
          ssri: {},
        }),
      ],
    });

    expect(output.toJSON()).toEqual(
      expect.objectContaining({
        '/dist/output.user.js': Fixtures.entryUserJs(
          Fixtures.ssriHeaders(tplData),
        ),
        '/dist/output.meta.js': Fixtures.ssriHeaders(tplData),
      }),
    );

    expect(readJSON(output, '/data/ssri-lock.json')).toEqual(
      JSON.parse(Fixtures.ssriLockJson(tplData)),
    );
  });

  it('should generate ssri-lock in custom lockfile', async () => {
    const output = await compile(input, {
      ...Fixtures.webpackConfig,
      context: '/home',
      plugins: [
        new UserscriptPlugin({
          headers: {
            require: `http://localhost:${server.port}/jquery-3.4.1.min.js`,
            resource: {
              // eslint-disable-next-line max-len
              'legacy-badge': `http://localhost:${server.port}/travis-webpack-userscript.svg`,
            },
          },
          ssri: {
            lock: '/some/deep/dir/custom-lock.json',
          },
        }),
      ],
    });

    expect(output.toJSON()).toEqual(
      expect.objectContaining({
        '/dist/output.user.js': Fixtures.entryUserJs(
          Fixtures.ssriHeaders(tplData),
        ),
        '/dist/output.meta.js': Fixtures.ssriHeaders(tplData),
      }),
    );

    expect(readJSON(output, '/some/deep/dir/custom-lock.json')).toEqual(
      JSON.parse(Fixtures.ssriLockJson(tplData)),
    );
  });

  it('should apply url filters to determine SSRI target urls', async () => {
    const output = await compile(input, {
      ...Fixtures.webpackConfig,
      plugins: [
        new UserscriptPlugin({
          headers: {
            require: [
              `http://localhost:${server.port}/jquery-3.4.1.min.js`,
              `http://example.com/example.txt`,
            ],
            resource: {
              // eslint-disable-next-line max-len
              'legacy-badge': `http://localhost:${server.port}/travis-webpack-userscript.svg`,
            },
          },
          ssri: {
            include: (_, url): boolean => url.hostname.includes('localhost'),
            exclude: (tag, url): boolean =>
              tag === 'resource' || !url.pathname.endsWith('.js'),
          },
        }),
      ],
    });

    expect(output.toJSON()).toEqual(
      expect.objectContaining({
        '/dist/output.user.js': Fixtures.entryUserJs(
          Fixtures.filtersSSRIHeaders(tplData),
        ),
        '/dist/output.meta.js': Fixtures.filtersSSRIHeaders(tplData),
      }),
    );

    expect(readJSON(output, '/ssri-lock.json')).toEqual(
      JSON.parse(Fixtures.filtersSSRILockJson(tplData)),
    );
  });

  it('should not generate SSRIs for unsupported protocols', async () => {
    const output = await compile(input, {
      ...Fixtures.webpackConfig,
      context: '/home',
      plugins: [
        new UserscriptPlugin({
          headers: {
            require: `http://localhost:${server.port}/jquery-3.4.1.min.js`,
            resource: {
              // eslint-disable-next-line max-len
              'legacy-badge': `http://localhost:${server.port}/travis-webpack-userscript.svg`,
              'unsupported-url': 'ftp://example.com',
            },
          },
          root: '/data',
          ssri: {},
        }),
      ],
    });

    expect(output.toJSON()).toEqual(
      expect.objectContaining({
        '/dist/output.user.js': Fixtures.entryUserJs(
          Fixtures.unsupportedProtocolsHeaders(tplData),
        ),
        '/dist/output.meta.js': Fixtures.unsupportedProtocolsHeaders(tplData),
      }),
    );

    expect(readJSON(output, '/data/ssri-lock.json')).toEqual(
      JSON.parse(Fixtures.ssriLockJson(tplData)),
    );
  });

  it('should generate SSRIs based on provided algorithms', async () => {
    const output = await compile(input, {
      ...Fixtures.webpackConfig,
      plugins: [
        new UserscriptPlugin({
          headers: {
            require: `http://localhost:${server.port}/jquery-3.4.1.min.js`,
            resource: {
              // eslint-disable-next-line max-len
              'legacy-badge': `http://localhost:${server.port}/travis-webpack-userscript.svg`,
            },
          },
          ssri: {
            algorithms: ['sha256'],
          },
        }),
      ],
    });

    expect(output.toJSON()).toEqual(
      expect.objectContaining({
        '/dist/output.user.js': Fixtures.entryUserJs(
          Fixtures.algorithmsSSRIHeaders(tplData),
        ),
        '/dist/output.meta.js': Fixtures.algorithmsSSRIHeaders(tplData),
      }),
    );

    expect(readJSON(output, '/ssri-lock.json')).toEqual(
      JSON.parse(Fixtures.algorithmsSSRILockJson(tplData)),
    );
  });

  it('should generate SSRIs without ssri-lock.json', async () => {
    const output = await compile(input, {
      ...Fixtures.webpackConfig,
      plugins: [
        new UserscriptPlugin({
          headers: {
            require: `http://localhost:${server.port}/jquery-3.4.1.min.js`,
            resource: {
              // eslint-disable-next-line max-len
              'legacy-badge': `http://localhost:${server.port}/travis-webpack-userscript.svg`,
            },
          },
          ssri: {
            lock: false,
          },
        }),
      ],
    });

    expect(output.toJSON()).toEqual({
      '/dist/output.user.js': Fixtures.entryUserJs(
        Fixtures.ssriHeaders(tplData),
      ),
      '/dist/output.meta.js': Fixtures.ssriHeaders(tplData),
    });
  });

  it('should generate SSRIs with existing ssri-lock.json', async () => {
    input.mkdirpSync('/data');
    input.writeFileSync('/data/ssri-lock.json', Fixtures.ssriLockJson(tplData));

    const intermediateFileSystem = createFsFromVolume(new Volume());
    const writeFileSpy = jest.spyOn(intermediateFileSystem, 'writeFile');

    const output = await compile(
      input,
      {
        ...Fixtures.webpackConfig,
        context: '/data',
        plugins: [
          new UserscriptPlugin({
            headers: {
              require: `http://localhost:${server.port}/jquery-3.4.1.min.js`,
              resource: {
                // eslint-disable-next-line max-len
                'legacy-badge': `http://localhost:${server.port}/travis-webpack-userscript.svg`,
              },
            },
            ssri: {},
          }),
        ],
      },
      {
        intermediateFileSystem,
      },
    );

    expect(fetch).not.toBeCalled();
    expect(writeFileSpy).not.toBeCalled();

    expect(output.toJSON()).toEqual({
      '/dist/output.user.js': Fixtures.entryUserJs(
        Fixtures.ssriHeaders(tplData),
      ),
      '/dist/output.meta.js': Fixtures.ssriHeaders(tplData),
      // there is no ssri-lock.json in output FS
      // since ssri-lock remains unchanged (no write happened)
    });

    writeFileSpy.mockRestore();
  });

  it('should generate SSRIs with existing SSRIs in headers', async () => {
    const output = await compile(input, {
      ...Fixtures.webpackConfig,
      context: '/data',
      plugins: [
        new UserscriptPlugin({
          headers: {
            require:
              `http://localhost:${server.port}/jquery-3.4.1.min.js` +
              `#sha512-udvAjJhK48f9RIIuwumiLLjPfaVfo5ddu9w/GP1+ene` +
              `T6Nk2BIJldOPdak+YLXr0+Wwa9eENhHuDlKNKgsOYug==`,
            resource: {
              'legacy-badge':
                `http://localhost:${server.port}` +
                `/travis-webpack-userscript.svg` +
                `#sha512-/xTO4jHEEl9gsQ2JvSjA9iMdzyiqapzDMfgtbLV34` +
                `Qiic7xUbs+urnF8cdAi2ApfQlgYTb5ZQTkTQaZEHCApnQ==`,
            },
          },
          ssri: {},
        }),
      ],
    });

    expect(fetch).not.toBeCalled();

    expect(output.toJSON()).toEqual(
      expect.objectContaining({
        '/dist/output.user.js': Fixtures.entryUserJs(
          Fixtures.ssriHeaders(tplData),
        ),
        '/dist/output.meta.js': Fixtures.ssriHeaders(tplData),
      }),
    );

    expect(readJSON(output, '/data/ssri-lock.json')).toEqual(
      JSON.parse(Fixtures.ssriLockJson(tplData)),
    );
  });

  it(
    'should throw error if SSRIs mismatch between those from headers and ' +
      'those from ssri-lock.json',
    async () => {
      input.mkdirpSync('/data');
      // correct SSRIs are in ssri-lock.json
      input.writeFileSync(
        '/data/ssri-lock.json',
        Fixtures.ssriLockJson(tplData),
      );

      const promise = compile(input, {
        ...Fixtures.webpackConfig,
        context: '/data',
        plugins: [
          new UserscriptPlugin({
            // I switch SSRIs of jquery-3.4.1.min.js
            // and travis-webpack-userscript.svg
            // to simulate a mismatch
            headers: {
              require:
                `http://localhost:${server.port}/jquery-3.4.1.min.js` +
                `#sha512-/xTO4jHEEl9gsQ2JvSjA9iMdzyiqapzDMfgtbLV34` +
                `Qiic7xUbs+urnF8cdAi2ApfQlgYTb5ZQTkTQaZEHCApnQ==`,
              resource: {
                'legacy-badge':
                  `http://localhost:${server.port}` +
                  `/travis-webpack-userscript.svg` +
                  `#sha512-udvAjJhK48f9RIIuwumiLLjPfaVfo5ddu9w/GP1+ene` +
                  `T6Nk2BIJldOPdak+YLXr0+Wwa9eENhHuDlKNKgsOYug==`,
              },
            },
            ssri: {},
          }),
        ],
      });

      expect(fetch).not.toBeCalled();
      await expect(promise).toReject();
    },
  );

  it('should compile if no urls are found', async () => {
    const output = await compile(input, {
      ...Fixtures.webpackConfig,
      plugins: [
        new UserscriptPlugin({
          ssri: {},
        }),
      ],
    });

    expect(output.toJSON()).toEqual({
      '/dist/output.user.js': Fixtures.entryUserJs(Fixtures.headers),
      '/dist/output.meta.js': Fixtures.headers,
    });
  });

  it('should generate SSRIs against missing algorithms', async () => {
    const output = await compile(input, {
      ...Fixtures.webpackConfig,
      context: '/data',
      plugins: [
        new UserscriptPlugin({
          headers: {
            require:
              `http://localhost:${server.port}/jquery-3.4.1.min.js` +
              `#sha512-udvAjJhK48f9RIIuwumiLLjPfaVfo5ddu9w/GP1+ene` +
              `T6Nk2BIJldOPdak+YLXr0+Wwa9eENhHuDlKNKgsOYug==`,
            resource: {
              'legacy-badge':
                `http://localhost:${server.port}` +
                `/travis-webpack-userscript.svg` +
                `#sha512-/xTO4jHEEl9gsQ2JvSjA9iMdzyiqapzDMfgtbLV34` +
                `Qiic7xUbs+urnF8cdAi2ApfQlgYTb5ZQTkTQaZEHCApnQ==`,
            },
          },
          ssri: {
            algorithms: ['sha256'],
          },
        }),
      ],
    });

    expect(output.toJSON()).toEqual(
      expect.objectContaining({
        '/dist/output.user.js': Fixtures.entryUserJs(
          Fixtures.ssriHeaders(tplData),
        ),
        '/dist/output.meta.js': Fixtures.ssriHeaders(tplData),
      }),
    );

    expect(readJSON(output, '/data/ssri-lock.json')).toEqual(
      JSON.parse(Fixtures.multiAlgorithmsSSRILockJson(tplData)),
    );
  });

  it('should throw if fetching sources falied', () => {
    return expect(
      compile(input, {
        ...Fixtures.webpackConfig,
        plugins: [
          new UserscriptPlugin({
            headers: {
              require: `http://localhost:${server.port}/not-exist.js`,
            },
            ssri: {},
          }),
        ],
      }),
    ).rejects.toThrow(/404 Not Found/);
  });
});
