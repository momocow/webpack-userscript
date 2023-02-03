import { readFileSync } from 'node:fs';
import path from 'node:path';

export const FIXTURES_DIR = path.join(__dirname, 'fixtures');

export const File =
  (...paths: string[]): PropertyDecorator =>
  (target, prop) => {
    Object.defineProperty(target, prop, {
      value: readFileSync(path.join(...paths), 'utf-8'),
      enumerable: true,
      configurable: false,
      writable: false,
    });
  };

export class GlobalFixtures {
  @File(FIXTURES_DIR, 'entry.js.txt')
  public static readonly entryJs: string;

  @File(FIXTURES_DIR, 'entry.min.js.txt')
  public static readonly entryMinJs: string;

  @File(FIXTURES_DIR, 'headers.txt')
  public static readonly headers: string;

  @File(FIXTURES_DIR, 'package.json.txt')
  public static readonly packageJson: string;

  public static entryUserJs(headers: string): string {
    return headers + '\n' + this.entryMinJs;
  }
}
