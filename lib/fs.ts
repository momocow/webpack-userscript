/**
 * FS-implementation aware functions.
 * @module
 */
import _fs from 'fs';
import path from 'path';
import { promisify } from 'util';

export interface FsStat {
  stat(
    path: string,
    callback: (err: Error | null, stats: { isFile: () => boolean }) => void,
  ): void;
}

export interface FsReadFile {
  readFile(
    path: string,
    callback: (err: Error | null, content: Buffer) => void,
  ): void;
}

export async function findPackage(
  cwd: string,
  fs: FsStat = _fs,
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
  fs: FsReadFile = _fs,
): Promise<T> {
  const readfileAsync = promisify(fs.readFile);
  const buf = await readfileAsync(file);
  return JSON.parse(buf.toString('utf-8'));
}
