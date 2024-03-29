/**
 * FS-implementation aware functions.
 * @module
 */
import path from 'path';
import { promisify } from 'util';

export interface Stats {
  isFile: () => boolean;
  isDirectory: () => boolean;
}

export interface FsStat {
  stat(path: string, callback: (err: Error | null, stats: Stats) => void): void;
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
    data: string | Buffer,
    callback: (err: Error | null) => void,
  ): void;
}

export interface FsMkdir {
  mkdir(
    path: string,
    options: { recursive?: boolean },
    callback: (err: Error | null, path?: string) => void,
  ): void;
}

export async function findPackage(cwd: string, fs: FsStat): Promise<string> {
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

export async function readJSON<T>(file: string, fs: FsReadFile): Promise<T> {
  const readFileAsync = promisify(fs.readFile);
  const buf = await readFileAsync(file);

  return JSON.parse(buf.toString('utf-8'));
}

export async function writeJSON(
  file: string,
  data: unknown,
  fs: FsWriteFile,
): Promise<void> {
  const writeFileAsync = promisify(fs.writeFile);
  await writeFileAsync(file, Buffer.from(JSON.stringify(data), 'utf-8'));
}

export async function mkdirp(
  dir: string,
  fs: FsMkdir,
): Promise<string | undefined> {
  const mkdirAsync = promisify(fs.mkdir);

  return await mkdirAsync(dir, { recursive: true });
}
