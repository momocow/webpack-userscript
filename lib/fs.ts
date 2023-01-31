/**
 * FS-implementation aware functions.
 * @module
 */
import _fs from 'fs';
import path from 'path';
import { promisify } from 'util';

export type FS = typeof _fs;

export async function findPackage(
  cwd: string,
  fs: Pick<FS, 'stat'> = _fs,
): Promise<string> {
  const statAsync = promisify(fs.stat);

  let dir = cwd;
  while (true) {
    const parent = path.dirname(dir);
    try {
      const pkg = await statAsync(path.join(dir, 'package.json'));
      if (pkg.isFile()) {
        return dir;
      }
    } catch (e) {
      // root directory
      if (dir === parent) {
        throw new Error(`package.json is not found`);
      }
    }
    dir = parent;
  }
}

export async function readJSON<T>(
  file: string,
  fs: Pick<FS, 'readFile'> = _fs,
): Promise<T> {
  const readfileAsync = promisify(fs.readFile);
  const buf = await readfileAsync(file, 'utf-8');
  return JSON.parse(buf);
}
