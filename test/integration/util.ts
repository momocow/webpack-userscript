import path from 'node:path';
import { promisify } from 'node:util';

import { createFsFromVolume } from 'memfs';
import { Configuration, webpack } from 'webpack';

import { Volume } from './types';

export const GLOBAL_FIXTURES_DIR = path.join(__dirname, 'fixtures');

export async function compile(
  input: Volume,
  webpackConfig: Configuration,
): Promise<Volume> {
  const compiler = webpack(webpackConfig);

  const output = new Volume();
  compiler.inputFileSystem = createFsFromVolume(input);
  compiler.outputFileSystem = createFsFromVolume(output);

  const stats = await promisify(compiler.run.bind(compiler))();

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

  return output;
}
