import { URL } from 'node:url';

import { UserscriptPlugin } from 'webpack-userscript';

import { compile, findTags } from '../util';
import { Volume } from '../volume';
import { Fixtures } from './fixtures';

describe('resolve base urls', () => {
  let input: Volume;

  const findDownloadURL = findTags.bind(
    undefined,
    'downloadURL',
    Fixtures.downloadURL,
  );

  beforeEach(async () => {
    input = Volume.fromJSON({
      '/entry.js': Fixtures.entryJs,
      '/package.json': Fixtures.packageJson,
    });
  });

  it('should resolve downloadURL and updateURL', async () => {
    const findUpdateURLByMetajs = findTags.bind(
      undefined,
      'updateURL',
      Fixtures.updateURLByMetajs,
    );

    const output = await compile(input, {
      ...Fixtures.webpackConfig,
      plugins: [
        new UserscriptPlugin({
          downloadBaseURL: new URL('http://download.example.com'),
          updateBaseURL: 'http://update.example.com',
        }),
      ],
    });

    const userJs = output
      .readFileSync('/dist/output.user.js')
      .toString('utf-8');
    const metaJs = output
      .readFileSync('/dist/output.meta.js')
      .toString('utf-8');

    expect(findDownloadURL(userJs)).toHaveLength(1);
    expect(findDownloadURL(metaJs)).toHaveLength(1);

    expect(findUpdateURLByMetajs(userJs)).toHaveLength(1);
    expect(findUpdateURLByMetajs(metaJs)).toHaveLength(1);
  });

  it('should resolve updateURL by userjs', async () => {
    const findUpdateURLByUserjs = findTags.bind(
      undefined,
      'updateURL',
      Fixtures.updateURLByUserjs,
    );

    const output = await compile(input, {
      ...Fixtures.webpackConfig,
      plugins: [
        new UserscriptPlugin({
          downloadBaseURL: new URL('http://download.example.com'),
          updateBaseURL: 'http://update.example.com',
          metajs: false,
        }),
      ],
    });

    const userJs = output
      .readFileSync('/dist/output.user.js')
      .toString('utf-8');

    expect(findDownloadURL(userJs)).toHaveLength(1);
    expect(findUpdateURLByUserjs(userJs)).toHaveLength(1);
  });

  it('should resolve updateURL by downloadURL', async () => {
    const findUpdateURLByDownloadURL = findTags.bind(
      undefined,
      'updateURL',
      Fixtures.downloadURL,
    );

    const output = await compile(input, {
      ...Fixtures.webpackConfig,
      plugins: [
        new UserscriptPlugin({
          downloadBaseURL: new URL('http://download.example.com'),
          metajs: false,
        }),
      ],
    });

    const userJs = output
      .readFileSync('/dist/output.user.js')
      .toString('utf-8');

    expect(findDownloadURL(userJs)).toHaveLength(1);
    expect(findUpdateURLByDownloadURL(userJs)).toHaveLength(1);
  });
});
