import { File, GlobalFixtures } from '../fixtures';

export class Fixtures extends GlobalFixtures {
  @File(__dirname, 'headers.txt')
  public static readonly headers: string;
}
