import { readFileSync } from 'node:fs';
import path from 'node:path';

import { Memoize } from 'typescript-memoize';

import { GlobalFixtures } from '../fixtures';

export class Fixtures extends GlobalFixtures {
  @Memoize()
  public static get headersJson(): string {
    return readFileSync(path.join(__dirname, 'headers.json.txt'), 'utf-8');
  }

  @Memoize()
  public static get headersObjectHeaders(): string {
    return readFileSync(
      path.join(__dirname, 'headers-object.headers.txt'),
      'utf-8',
    );
  }

  @Memoize()
  public static get headersProviderHeaders(): string {
    return readFileSync(
      path.join(__dirname, 'headers-provider.headers.txt'),
      'utf-8',
    );
  }

  @Memoize()
  public static get headersFileHeaders(): string {
    return readFileSync(
      path.join(__dirname, 'headers-file.headers.txt'),
      'utf-8',
    );
  }
}
