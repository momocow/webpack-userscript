import { Memoize } from 'typescript-memoize';

import { File, GlobalFixtures } from '../fixtures';

export class Fixtures extends GlobalFixtures {
  @Memoize()
  public static get headersJson(): string {
    return JSON.stringify({
      name: 'headers-file',
    });
  }

  @File(__dirname, 'headers-object.headers.txt')
  public static readonly headersObjectHeaders: string;

  @File(__dirname, 'headers-provider.headers.txt')
  public static readonly headersProviderHeaders: string;

  @File(__dirname, 'headers-file.headers.txt')
  public static readonly headersFileHeaders: string;
}
