import { UserscriptPlugin } from 'webpack-userscript';

import { compile } from '../util';
import { Volume } from '../volume';
import { Fixtures } from './fixtures';

describe('package-json', () => {
  let input: Volume;

  beforeEach(async () => {
    input = Volume.fromJSON({
      '/entry.js': Fixtures.entryJs,
    });
  });

  it('should find package.json using root option', async () => {
    input.mkdirpSync('/some/deep/deep/dir');
    input.writeFileSync(
      '/some/deep/deep/dir/package.json',
      JSON.stringify({
        name: 'package-json-deep',
        version: '0.0.1',
      }),
    );
    input.writeFileSync(
      '/package.json',
      JSON.stringify({
        name: 'package-json',
        version: '0.0.0',
      }),
    );

    const output = await compile(input, {
      context: '/',
      mode: 'production',
      entry: '/entry.js',
      output: {
        path: '/dist',
        filename: 'package-json.js',
      },
      plugins: [
        new UserscriptPlugin({
          root: '/some/deep/deep/dir/',
        }),
      ],
    });

    expect(output.toJSON()).toEqual({
      '/dist/package-json.user.js':
        Fixtures.rootOptionHeaders + '\n' + Fixtures.entryMinJs,
      '/dist/package-json.meta.js': Fixtures.rootOptionHeaders,
    });
  });
});
