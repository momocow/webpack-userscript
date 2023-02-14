import { File, GlobalFixtures } from '../fixtures';

export class Fixtures extends GlobalFixtures {
  public static readonly customValue = '__custom__';

  @File(__dirname, 'pretty-headers.txt')
  public static readonly prettyHeaders: string;

  @File(__dirname, 'tag-order-headers.txt')
  public static readonly tagOrderHeaders: string;
}
