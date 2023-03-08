import { File, GlobalFixtures } from '../fixtures';

export class Fixtures extends GlobalFixtures {
  @File(__dirname, 'proxy-script.headers.txt')
  public static readonly proxyScriptHeaders: string;

  @File(__dirname, 'proxy-script.proxy-headers.txt')
  public static readonly proxyScriptProxyHeaders: string;

  @File(__dirname, 'base-url-proxy-script.proxy-headers.txt')
  public static readonly baseURLProxyScriptProxyHeaders: string;

  @File(__dirname, 'base-url-proxy-script.headers.txt')
  public static readonly baseURLProxyScriptHeaders: string;
}
