import path from 'node:path';
import { promisify } from 'node:util';

import { createFsFromVolume, IFs, Volume } from 'memfs';
import { Configuration, webpack } from 'webpack';
import { UserscriptOptions, UserscriptPlugin } from 'webpack-userscript';

export const GLOBAL_FIXTURES_DIR = path.join(__dirname, 'fixtures');

export async function compile(
  ifs: IFs,
  webpackConfig: Configuration,
  userscriptOptions?: UserscriptOptions,
): Promise<IFs> {
  const compiler = webpack({
    ...webpackConfig,
    plugins: [
      ...(webpackConfig.plugins ?? []),
      new UserscriptPlugin(userscriptOptions),
    ],
  });

  const ofs = createFsFromVolume(new Volume());
  compiler.inputFileSystem = ifs;
  compiler.outputFileSystem = ofs;

  const stats = await promisify(compiler.run)();

  if (stats?.hasErrors() || stats?.hasWarnings()) {
    const details = stats.toJson();
    if (details.errorsCount) {
      console.error(details.errors);
    }
    if (details.warningsCount) {
      console.error(details.warnings);
    }
    throw new Error('invalid fixtures');
  }
  return ofs;
}
