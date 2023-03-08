import { File, GlobalFixtures } from '../fixtures';

export class Fixtures extends GlobalFixtures {
  @File(__dirname, 'entry1.headers.txt')
  public static readonly entry1Headers: string;

  @File(__dirname, 'entry2.headers.txt')
  public static readonly entry2Headers: string;

  @File(__dirname, 'entry3.headers.txt')
  public static readonly entry3Headers: string;
}
