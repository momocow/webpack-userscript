import { UserscriptOptions, UserscriptPlugin } from 'webpack-userscript';

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

  describe('validate-headers', () => {
    const testCustomTags =
      (
        count: number,
        {
          strict,
          whitelist,
        }: Pick<UserscriptOptions, 'strict' | 'whitelist'> = {},
      ) =>
      async (): Promise<void> => {
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
              strict,
              whitelist,
            }),
          ],
        });

        const userJs = output
          .readFileSync('/dist/output.user.js')
          .toString('utf-8');
        const metaJs = output
          .readFileSync('/dist/output.meta.js')
          .toString('utf-8');

        expect(customTags(userJs)).toHaveLength(count);
        expect(customTags(metaJs)).toHaveLength(count);
      };

    it('should throw for custom tags in strict but non-whitelist mode', () =>
      expect(
        testCustomTags(0, {
          strict: true,
          whitelist: false,
        })(),
      ).toReject());

    it(
      'should render custom tags in non-strict and non-whitelist mode',
      testCustomTags(1, {
        strict: false,
        whitelist: false,
      }),
    );

    it(
      'should not render custom tags in non-strict but whitelist mode',
      testCustomTags(0, {
        strict: false,
        whitelist: true,
      }),
    );

    it(
      'should not render custom tags in strict and whitelist mode',
      testCustomTags(0, {
        strict: true,
        whitelist: true,
      }),
    );
  });

  describe('render-headers', () => {
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

      expect(output.toJSON()).toEqual({
        '/dist/output.user.js': Fixtures.entryUserJs(Fixtures.prettyHeaders),
        '/dist/output.meta.js': Fixtures.prettyHeaders,
      });
    });

    it('should respect the specified tag order', async () => {
      const output = await compile(input, {
        ...Fixtures.webpackConfig,
        plugins: [
          new UserscriptPlugin({
            // though "@include" tag does not present in the headers,
            // it is fine to be in the tagOrder list
            tagOrder: ['include', 'match', 'version', 'description', 'name'],
          }),
        ],
      });

      expect(output.toJSON()).toEqual({
        '/dist/output.user.js': Fixtures.entryUserJs(Fixtures.tagOrderHeaders),
        '/dist/output.meta.js': Fixtures.tagOrderHeaders,
      });
    });
  });
});
