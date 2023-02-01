// import { UserscriptPlugin } from 'webpack-userscript';

// import { compile } from '../util';
// import { Volume } from '../volume';
// import { Fixtures } from './fixtures';

describe('rendering', () => {
  // let input: Volume;

  // beforeEach(async () => {
  //   input = Volume.fromJSON({
  //     '/entry.js': Fixtures.entryJs,
  //     '/package.json': Fixtures.packageJson,
  //   });
  // });

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
