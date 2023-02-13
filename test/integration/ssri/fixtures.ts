import path from 'node:path';

import { Memoize } from 'typescript-memoize';

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

  @Memoize()
  public static get ssriHeaders(): (data: any) => string {
    return template(this._ssriHeaders);
  }

  @File(path.join(__dirname, 'filters-ssri-headers.txt'))
  private static readonly _filtersSSRIHeaders: string;

  @Memoize()
  public static get filtersSSRIHeaders(): (data: any) => string {
    return template(this._filtersSSRIHeaders);
  }

  @File(path.join(__dirname, 'filters-ssri-lock.json.txt'))
  private static readonly _filtersSSRILockJson: string;

  @Memoize()
  public static get filtersSSRILockJson(): (data: any) => string {
    return template(this._filtersSSRILockJson);
  }

  @File(path.join(__dirname, 'algorithms-ssri-headers.txt'))
  private static readonly _algorithmsSSRIHeaders: string;

  @Memoize()
  public static get algorithmsSSRIHeaders(): (data: any) => string {
    return template(this._algorithmsSSRIHeaders);
  }

  @File(path.join(__dirname, 'algorithms-ssri-lock.json.txt'))
  private static readonly _algorithmsSSRILockJson: string;

  @Memoize()
  public static get algorithmsSSRILockJson(): (data: any) => string {
    return template(this._algorithmsSSRILockJson);
  }
}
