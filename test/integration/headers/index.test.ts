import { UserscriptPlugin } from 'webpack-userscript';

import { compile, escapeRegex } from '../util';
import { Volume } from '../volume';
import { Fixtures } from './fixtures';

function findTags(tag: string, value: string, content: string): string[] {
  return (
    content.match(
      new RegExp(`// @${escapeRegex(tag)} ${escapeRegex(value)}\n`, 'g'),
    ) ?? []
  );
}

describe('headers', () => {
  let input: Volume;

  const httpsMatchTags = findTags.bind(
    undefined,
    'match',
    Fixtures.httpsMatchValue,
  );
  const httpsIncludeTags = findTags.bind(
    undefined,
    'include',
    Fixtures.httpsIncludeValue,
  );

  beforeEach(async () => {
    input = Volume.fromJSON({
      '/entry.js': Fixtures.entryJs,
      '/package.json': Fixtures.packageJson,
    });
  });

  describe('default match tag', () => {
    const defaultMatchTags = findTags.bind(
      undefined,
      'match',
      Fixtures.defaultMatchValue,
    );

    // eslint-disable-next-line max-len
    it('should use default match if no include or match specified', async () => {
      const output = await compile(input, {
        context: '/',
        mode: 'production',
        entry: '/entry.js',
        output: {
          path: '/dist',
          filename: 'output.js',
        },
        plugins: [new UserscriptPlugin()],
      });

      const userJs = output
        .readFileSync('/dist/output.user.js')
        .toString('utf-8');
      const metaJs = output
        .readFileSync('/dist/output.meta.js')
        .toString('utf-8');

      expect(defaultMatchTags(userJs)).toHaveLength(1);
      expect(defaultMatchTags(metaJs)).toHaveLength(1);
    });

    it('should not use default match if include is provided', async () => {
      const output = await compile(input, {
        context: '/',
        mode: 'production',
        entry: '/entry.js',
        output: {
          path: '/dist',
          filename: 'output.js',
        },
        plugins: [
          new UserscriptPlugin({
            headers: {
              include: Fixtures.httpsIncludeValue,
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

      expect(defaultMatchTags(userJs)).toHaveLength(0);
      expect(httpsIncludeTags(userJs)).toHaveLength(1);

      expect(defaultMatchTags(metaJs)).toHaveLength(0);
      expect(httpsIncludeTags(metaJs)).toHaveLength(1);
    });

    it('should not use default match if match is provided', async () => {
      const output = await compile(input, {
        context: '/',
        mode: 'production',
        entry: '/entry.js',
        output: {
          path: '/dist',
          filename: 'output.js',
        },
        plugins: [
          new UserscriptPlugin({
            headers: {
              match: Fixtures.httpsMatchValue,
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

      expect(defaultMatchTags(userJs)).toHaveLength(0);
      expect(httpsMatchTags(userJs)).toHaveLength(1);

      expect(defaultMatchTags(metaJs)).toHaveLength(0);
      expect(httpsMatchTags(metaJs)).toHaveLength(1);
    });
  });

  describe('non strict mode', () => {
    it('should allow custom tags', async () => {
      const customTagValue = '__custom__';
      const customTags = findTags.bind(undefined, 'custom', customTagValue);

      const output = await compile(input, {
        context: '/',
        mode: 'production',
        entry: '/entry.js',
        output: {
          path: '/dist',
          filename: 'output.js',
        },
        plugins: [
          new UserscriptPlugin({
            headers: {
              custom: customTagValue,
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

  // it('should be rendered prettily', async () => {
  //   const output = await compile(input, {
  //     context: '/',
  //     mode: 'production',
  //     entry: '/entry.js',
  //     output: {
  //       path: '/dist',
  //       filename: 'pretty.js',
  //     },
  //     plugins: [
  //       new UserscriptPlugin({
  //         // pretty: true,
  //       }),
  //     ],
  //   });

  //   expect(output.toJSON()).toEqual({
  //     '/dist/pretty.user.js': '',
  //     '/dist/pretty.meta.js': '',
  //   });
  // });

  it.todo('should respect the specified tag order');
});
