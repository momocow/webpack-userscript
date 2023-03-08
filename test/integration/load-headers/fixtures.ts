import { Memoize } from 'typescript-memoize';

import { File, GlobalFixtures } from '../fixtures';

export class Fixtures extends GlobalFixtures {
  @Memoize()
  public static get headersJson(): string {
    return JSON.stringify({
      name: 'load-headers',
    });
  }

  @File(__dirname, 'load-headers.headers.txt')
  public static readonly loadHeadersHeaders: string;
}
