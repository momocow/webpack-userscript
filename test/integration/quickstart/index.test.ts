import { UserscriptPlugin } from 'webpack-userscript';

import { Volume } from '../types';
import { compile } from '../util';
import { Fixture } from './fixture';

describe('quickstart', () => {
  let input: Volume;

  beforeEach(async () => {
    input = Volume.fromJSON({
      '/entry.js': Fixture.entryJs,
      '/package.json': Fixture.packageJson,
    });
  });

  it('should successfully compile with default options', async () => {
    const output = await compile(input, {
      ...Fixture.webpackConfig,
      plugins: [new UserscriptPlugin()],
    });

    expect(output.toJSON()).toEqual({
      '/dist/quickstart.user.js':
        Fixture.headersJs + '\n' + Fixture.entryUserJs,
      '/dist/quickstart.meta.js': Fixture.headersJs,
    });
  });
});
