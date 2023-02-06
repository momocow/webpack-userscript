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

export interface FsExists {
  existsSync(file: string): boolean;
}

export interface FsReadFile {
  readFile(
    path: string,
    callback: (err: Error | null, content: Buffer) => void,
  ): void;
}

export interface FsWriteFile {
  writeFile(
    path: string,
    data: string,
    callback: (err: Error | null) => void,
  ): void;
}

export async function isFile(
  file: string,
  fs: FsStat & FsExists = _fs,
): Promise<boolean> {
  if (!fs.existsSync(file)) {
    return false;
  }
  const statAsync = promisify(fs.stat);
  const stat = await statAsync(file);
  return stat.isFile();
}

export async function findPackage(
  cwd: string,
  fs: FsStat & FsExists = _fs,
): Promise<string> {
  let dir = cwd;
  while (true) {
    const parent = path.dirname(dir);
    if (await isFile(path.join(dir, 'package.json'), fs)) {
      return dir;
    }
    if (dir === parent) {
      throw new Error(`package.json is not found`);
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

export async function writeJSON(
  file: string,
  data: string,
  fs: FsWriteFile = _fs,
): Promise<void> {
  const writeFileAsync = promisify(fs.writeFile);
  await writeFileAsync(file, data);
}
