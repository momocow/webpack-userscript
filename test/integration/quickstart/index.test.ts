import { UserscriptPlugin } from 'webpack-userscript';

import { compile } from '../util';
import { Volume } from '../volume';
import { Fixtures } from './fixtures';

describe('quickstart', () => {
  let input: Volume;

  beforeEach(async () => {
    input = Volume.fromJSON({
      '/entry.js': Fixtures.entryJs,
      '/package.json': Fixtures.packageJson,
    });
  });

  it('should successfully compile with default options', async () => {
    const output = await compile(input, {
      context: '/',
      mode: 'production',
      entry: '/entry.js',
      output: {
        path: '/dist',
        filename: 'quickstart.js',
      },
      plugins: [new UserscriptPlugin()],
    });

    expect(output.toJSON()).toEqual({
      '/dist/quickstart.user.js': Fixtures.entryUserJs(Fixtures.headers),
      '/dist/quickstart.meta.js': Fixtures.headers,
    });
  });
});
