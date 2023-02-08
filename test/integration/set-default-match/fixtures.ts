import { GlobalFixtures } from '../fixtures';

export class Fixtures extends GlobalFixtures {
  public static readonly defaultMatchValue = '*://*/*';

  public static readonly httpsMatchValue = 'https://*/*';

  public static readonly httpsIncludeValue = 'https://*';

  public static readonly customValue = '__custom__';
}
