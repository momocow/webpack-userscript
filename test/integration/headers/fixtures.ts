import { ValueType } from 'webpack-userscript';

import { File, GlobalFixtures } from '../fixtures';

interface TagSample {
  value: ValueType;
  expect: string | string[];
}

interface TagCase {
  validValues: TagSample[];
  invalidValues: Omit<TagSample, 'expect'>[];
}

export class Fixtures extends GlobalFixtures {
  public static readonly customValue = '__custom__';

  @File(__dirname, 'pretty-headers.txt')
  public static readonly prettyHeaders: string;

  @File(__dirname, 'tag-order-headers.txt')
  public static readonly tagOrderHeaders: string;

  public static readonly tagSamples: Record<string, TagCase> = {
    'run-at': {
      validValues: [
        { value: 'document-start', expect: 'document-start' },
        { value: 'document-body', expect: 'document-body' },
        { value: 'document-end', expect: 'document-end' },
        { value: 'document-idle', expect: 'document-idle' },
        { value: 'context-menu', expect: 'context-menu' },
      ],
      invalidValues: [{ value: 'a' }],
    },
    sandbox: {
      validValues: [
        { value: 'raw', expect: 'raw' },
        { value: 'JavaScript', expect: 'JavaScript' },
        { value: 'DOM', expect: 'DOM' },
      ],
      invalidValues: [{ value: 'a' }],
    },
    'inject-into': {
      validValues: [
        { value: 'page', expect: 'page' },
        { value: 'content', expect: 'content' },
        { value: 'auto', expect: 'auto' },
      ],
      invalidValues: [{ value: 'a' }],
    },
    compatible: {
      validValues: [
        {
          value: {
            firefox: 'compatible string',
            chrome: 'compatible string',
            opera: 'compatible string',
            safari: 'compatible string',
            edge: 'compatible string',
          },
          expect: [
            'firefox compatible string',
            'chrome compatible string',
            'opera compatible string',
            'safari compatible string',
            'edge compatible string',
          ],
        },
      ],
      invalidValues: [{ value: { unknownBrowser: 'compatible string' } }],
    },
    incompatible: {
      validValues: [
        {
          value: {
            firefox: 'compatible string',
            chrome: 'compatible string',
            opera: 'compatible string',
            safari: 'compatible string',
            edge: 'compatible string',
          },
          expect: [
            'firefox compatible string',
            'chrome compatible string',
            'opera compatible string',
            'safari compatible string',
            'edge compatible string',
          ],
        },
      ],
      invalidValues: [{ value: { unknownBrowser: 'incompatible string' } }],
    },
  };
}
