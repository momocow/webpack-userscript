import fs from 'node:fs';
import path from 'node:path';

import { Memoize } from 'typescript-memoize';

import { GlobalFixtures } from '../fixtures';

export class Fixtures extends GlobalFixtures {
  @Memoize()
  public static get rootOptionHeaders(): string {
    return fs.readFileSync(
      path.resolve(__dirname, './root-option.headers.txt'),
      'utf-8',
    );
  }
}
