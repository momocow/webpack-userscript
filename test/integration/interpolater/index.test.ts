import { UserscriptPlugin } from 'webpack-userscript';

import { compile, findTags } from '../util';
import { Volume } from '../volume';
import { Fixtures } from './fixtures';

jest.mock('webpack-userscript/utils', () => ({
  ...jest.requireActual('webpack-userscript/utils'),
  date: (): Date => new Date(0),
}));

describe('interpolater', () => {
  let input: Volume;

  beforeEach(async () => {
    input = Volume.fromJSON({
      '/entry.js': Fixtures.entryJs,
      '/package.json': Fixtures.packageJson,
    });
  });

  for (const [name, expectedName] of [
    ['[name]', 'customEntry'],
    ['[file]', 'output.js'],
    ['[filename]', 'output.js'],
    ['[basename]', 'output'],
    ['[query]', ''],
    ['[dirname]', '.'],
    ['[buildNo]', '1'],
    ['[buildTime]', '1970-01-01T00:00:00.000Z'],
  ]) {
    it(name, async () => {
      const output = await compile(input, {
        ...Fixtures.webpackConfig,
        entry: {
          customEntry: '/entry.js',
        },
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
