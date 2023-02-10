import { UserscriptPlugin } from 'webpack-userscript';

import { compile, findTags } from '../util';
import { Volume } from '../volume';
import { Fixtures } from './fixtures';

describe('default match tag', () => {
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

  const defaultMatchTags = findTags.bind(
    undefined,
    'match',
    Fixtures.defaultMatchValue,
  );

  beforeEach(async () => {
    input = Volume.fromJSON({
      '/entry.js': Fixtures.entryJs,
      '/package.json': Fixtures.packageJson,
    });
  });

  // eslint-disable-next-line max-len
  it('should use default match if no include or match specified', async () => {
    const output = await compile(input, {
      ...Fixtures.webpackConfig,
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
      ...Fixtures.webpackConfig,
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
      ...Fixtures.webpackConfig,
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
