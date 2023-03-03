import { GlobalFixtures } from '../fixtures';

export class Fixtures extends GlobalFixtures {
  public static readonly downloadURL =
    'http://download.example.com/output.user.js';

  public static readonly updateURLByMetajs =
    'http://update.example.com/output.meta.js';

  public static readonly updateURLByUserjs =
    'http://update.example.com/output.user.js';
}
