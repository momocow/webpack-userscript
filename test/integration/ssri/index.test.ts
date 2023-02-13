import path from 'node:path';

import { UserscriptPlugin } from 'webpack-userscript';

import { compile, servceStatic, ServeStatic } from '../util';
import { Volume } from '../volume';
import { Fixtures } from './fixtures';

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

  it('should generate SSRIs and lock them with ssri-lock.json', async () => {
    const output = await compile(input, {
      ...Fixtures.webpackConfig,
      plugins: [
        new UserscriptPlugin({
          headers: {
            require: `http://localhost:${server.port}/jquery-3.4.1.min.js`,
          },
          ssri: true,
        }),
      ],
    });

    expect(output.toJSON()).toEqual({
      '/dist/output.user.js': Fixtures.entryUserJs(
        Fixtures.ssriHeaders(tplData),
      ),
      '/dist/output.meta.js': Fixtures.ssriHeaders(tplData),
      '/ssri-lock.json': Fixtures.ssriLockJson(tplData),
    });
  });
});