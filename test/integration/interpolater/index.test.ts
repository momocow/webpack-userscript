import { UserscriptPlugin } from 'webpack-userscript';

import { compile, findTags } from '../util';
import { Volume } from '../volume';
import { Fixtures } from './fixtures';

describe('interpolater', () => {
  let input: Volume;
  const now = new Date(0);

  beforeEach(async () => {
    input = Volume.fromJSON({
      '/entry.js': Fixtures.entryJs,
      '/package.json': Fixtures.packageJson,
    });
  });

  for (const [name, expectedName] of [
    ['[name]', ''],
    ['[file]', ''],
    ['[filename]', ''],
    ['[basename]', ''],
    ['[query]', ''],
    ['[dirname]', ''],
    ['[buildNo]', ''],
    ['[buildTime]', ''],
  ]) {
    it(name, async () => {
      const output = await compile(input, {
        ...Fixtures.webpackConfig,
        plugins: [
          new UserscriptPlugin({
            headers: {
              name,
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

      expect(findTags('name', expectedName, userJs)).toHaveLength(1);
      expect(findTags('name', expectedName, metaJs)).toHaveLength(1);
    });
  }
});
