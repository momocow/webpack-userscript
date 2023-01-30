import { promisify } from 'node:util';

import { createFsFromVolume, Volume } from 'memfs';
import { Compiler, Configuration, webpack } from 'webpack';

type OFS = Compiler['outputFileSystem'];

export async function compileInMemory(options: Configuration): Promise<OFS> {
  const compiler = webpack(options);
  const ofs = createFsFromVolume(new Volume());
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
