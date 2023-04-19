import { File, GlobalFixtures } from '../fixtures';

export class Fixtures extends GlobalFixtures {
  @File(__dirname, 'i18n.headers.txt')
  public static readonly i18nHeaders: string;

  @File(__dirname, 'non-strict-i18n.headers.txt')
  public static readonly nonStrictI18nHeaders: string;
}
