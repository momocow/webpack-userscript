import { ValueType } from 'webpack-userscript';

import { File, GlobalFixtures } from '../fixtures';

interface TagSample {
  value: ValueType;
  expect: string;
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
      validValues: [{ value: 'document-body', expect: 'document-body' }],
      invalidValues: [{ value: 'a' }],
    },
  };
}
