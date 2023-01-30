import { isDeepStrictEqual } from 'node:util';

export class Headers {
  public toString(): string {
    return '';
  }

  public equals(other: Headers): boolean {
    return isDeepStrictEqual(this, other);
  }
}
