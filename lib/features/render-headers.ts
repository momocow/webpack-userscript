import { getBorderCharacters, table } from 'table';

import { DEFAULT_LOCALE_KEY } from '../const';
import {
  HeadersProps,
  TagType,
  UserscriptPluginInstance,
  ValueType,
} from '../types';
import { Feature } from './feature';

export interface RenderHeadersOptions {
  prefix?: string;
  suffix?: string;
  pretty?: boolean;
  tagOrder?: TagType[];
  proxyScript?: unknown;
}

export class RenderHeaders extends Feature<RenderHeadersOptions> {
  public readonly name = 'RenderHeaders';

  public apply({ hooks }: UserscriptPluginInstance): void {
    hooks.renderHeaders.tap(this.name, (headersMap) =>
      this.render(this.mergeHeadersMap(headersMap), this.options),
    );

    if (this.options.proxyScript) {
      hooks.renderProxyHeaders.tap(this.name, (headers) =>
        this.render(headers, this.options),
      );
    }
  }

  private mergeHeadersMap(headersMap: Map<string, HeadersProps>): HeadersProps {
    return Array.from(headersMap)
      .map(
        ([locale, headers]) =>
          Object.fromEntries(
            Object.entries(headers).map(([tag, value]) => [
              locale === DEFAULT_LOCALE_KEY ? tag : `${tag}:${locale}`,
              value,
            ]),
          ) as HeadersProps,
      )
      .reduce((h1, h2) => ({ ...h1, ...h2 }));
  }

  private render(
    headers: HeadersProps,
    {
      prefix = '// ==UserScript==\n',
      suffix = '// ==/UserScript==\n',
      pretty = false,
      tagOrder = [
        'name',
        'description',
        'version',
        'author',
        'homepage',
        'supportURL',
        'include',
        'exclude',
        'match',
      ],
    }: RenderHeadersOptions = {},
  ): string {
    const orderRevMap = new Map(tagOrder.map((tag, index) => [tag, index]));
    const rows = Object.entries(headers)
      .sort(
        ([tag1], [tag2]) =>
          (orderRevMap.get(this.getTagName(tag1)) ?? orderRevMap.size) -
            (orderRevMap.get(this.getTagName(tag2)) ?? orderRevMap.size) ||
          (tag1 > tag2 ? 1 : tag1 < tag2 ? -1 : 0),
      )
      .flatMap(([tag, value]) => this.renderTag(tag, value));
    const body = pretty
      ? table(rows, {
          border: getBorderCharacters('void'),
          columnDefault: {
            paddingLeft: 0,
            paddingRight: 1,
          },
          drawHorizontalLine: () => false,
        })
          .split('\n')
          .map((line) => line.trim())
          .join('\n')
      : rows.map((cols) => cols.join(' ')).join('\n') + '\n';

    return prefix + body + suffix;
  }

  protected renderTag(tag: TagType, value: ValueType): string[][] {
    if (Array.isArray(value)) {
      return value.map((v) => [`// @${tag}`, v ?? '']);
    }
    if (typeof value === 'object') {
      return Object.entries(value).map(([k, v]) => [
        `// @${tag}`,
        `${k} ${v ?? ''}`,
      ]);
    }
    if (typeof value === 'string') {
      return [[`// @${tag}`, value]];
    }
    if (value === true) {
      return [[`// @${tag}`, '']];
    }

    return [];
  }

  private getTagName(tag: string): string {
    return tag.replace(/:.+$/, '');
  }
}
