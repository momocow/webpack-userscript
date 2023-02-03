import { File, GlobalFixtures } from '../fixtures';

export class Fixtures extends GlobalFixtures {
  @File(__dirname, './root-option.headers.txt')
  public static readonly rootOptionHeaders: string;

  @File(__dirname, './bugs.headers.txt')
  public static readonly bugsHeaders: string;
}
