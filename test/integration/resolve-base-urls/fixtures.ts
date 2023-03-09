import { GlobalFixtures } from '../fixtures';

export class Fixtures extends GlobalFixtures {
  public static readonly downloadURLWithUserjs =
    'http://download.example.com/output.user.js';

  public static readonly downloadURLWithMetajs =
    'http://download.example.com/output.meta.js';

  public static readonly updateURLWithMetajs =
    'http://update.example.com/output.meta.js';

  public static readonly updateURLWithUserjs =
    'http://update.example.com/output.user.js';
}
