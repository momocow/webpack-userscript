import path from 'node:path';

import { File, GlobalFixtures } from '../fixtures';

export class Fixtures extends GlobalFixtures {
  @File(path.join(__dirname, 'ssri-lock.json.txt'))
  public static readonly ssriLockJson: string;

  @File(path.join(__dirname, 'headers.txt'))
  public static readonly headers: string;
}
