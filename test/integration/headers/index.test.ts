import { UserscriptPlugin } from 'webpack-userscript';

import { compile, findTags } from '../util';
import { Volume } from '../volume';
import { Fixtures } from './fixtures';

describe('headers', () => {
  let input: Volume;

  beforeEach(async () => {
    input = Volume.fromJSON({
      '/entry.js': Fixtures.entryJs,
      '/package.json': Fixtures.packageJson,
    });
  });

  describe('non strict mode', () => {
    it('should allow custom tags', async () => {
      const customTags = findTags.bind(
        undefined,
        'custom',
        Fixtures.customValue,
      );

      const output = await compile(input, {
        ...Fixtures.webpackConfig,
        plugins: [
          new UserscriptPlugin({
            headers: {
              custom: Fixtures.customValue,
            },
          }),
        ],
      });

      const userJs = output
        .readFileSync('/dist/output.user.js')
        .toString('utf-8');
      const metaJs = output
        .readFileSync('/dist/output.meta.js')
        .toString('utf-8');

      expect(customTags(userJs)).toHaveLength(1);
      expect(customTags(metaJs)).toHaveLength(1);
    });
  });

  it('should be rendered prettily', async () => {
    const output = await compile(input, {
      ...Fixtures.webpackConfig,
      plugins: [
        new UserscriptPlugin({
          headers: {
            resource: {
              test: 'http://example.com/demo.jpg',
            },
          },
          pretty: true,
        }),
      ],
    });

    console.log(
      output
        .readFileSync('/dist/output.user.js', 'utf-8')
        .toString()
        .split('\n'),
    );

    expect(output.toJSON()).toEqual({
      '/dist/output.user.js': Fixtures.entryUserJs(Fixtures.prettyHeaders),
      '/dist/output.meta.js': Fixtures.prettyHeaders,
    });
  });

  it.todo('should respect the specified tag order');
});
