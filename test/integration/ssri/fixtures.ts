import path from 'node:path';

import { File, GlobalFixtures } from '../fixtures';
import { template } from '../util';

export class Fixtures extends GlobalFixtures {
  @File(path.join(__dirname, 'ssri-lock.json.txt'))
  private static readonly _ssriLockJson: string;

  public static get ssriLockJson(): (data: any) => string {
    return template(this._ssriLockJson);
  }

  @File(path.join(__dirname, 'ssri-headers.txt'))
  private static readonly _ssriHeaders: string;

  public static get ssriHeaders(): (data: any) => string {
    return template(this._ssriHeaders);
  }
}
