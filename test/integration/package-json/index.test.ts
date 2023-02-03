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
        description: 'description of package-json-deep',
        author: 'author of package-json-deep',
        homepage: 'https://homepage.package-json-deep.com/',
      }),
    );
    input.writeFileSync(
      '/package.json',
      JSON.stringify({
        name: 'package-json',
        version: '0.0.0',
        description: 'description of package-json',
        author: 'author of package-json',
        homepage: 'https://homepage.package-json.com/',
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
      '/dist/package-json.user.js': Fixtures.entryUserJs(
        Fixtures.rootOptionHeaders,
      ),
      '/dist/package-json.meta.js': Fixtures.rootOptionHeaders,
    });
  });

  describe('various types of "bugs" in package.json', () => {
    const bugsValues = [
      'https://bugs.example.com/',
      { url: 'https://bugs.example.com/' },
    ];

    for (const bugs of bugsValues) {
      it('should parse "bugs" into "supportURL"', async () => {
        input.writeFileSync(
          '/package.json',
          JSON.stringify({ name: 'package-json-bugs', bugs }),
        );

        const output = await compile(input, {
          context: '/',
          mode: 'production',
          entry: '/entry.js',
          output: {
            path: '/dist',
            filename: 'package-json-bugs.js',
          },
          plugins: [new UserscriptPlugin({})],
        });

        expect(output.toJSON()).toEqual({
          '/dist/package-json-bugs.user.js': Fixtures.entryUserJs(
            Fixtures.bugsHeaders,
          ),
          '/dist/package-json-bugs.meta.js': Fixtures.bugsHeaders,
        });
      });
    }
  });
});
