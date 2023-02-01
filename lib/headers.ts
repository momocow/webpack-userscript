import { isDeepStrictEqual } from 'node:util';

import { instanceToPlain, plainToInstance } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsObject,
  IsOptional,
  IsSemVer,
  IsString,
  IsUrl,
  validateSync,
} from 'class-validator';

export interface HeadersFactoryOptions {
  strict: boolean;
}

export enum RunAtValue {
  DocumentStart = 'document-start',
  DocumentBody = 'document-body',
  DocumentEnd = 'document-end',
  DocumentIdle = 'document-idle',
  ContextMenu = 'context-menu',
}

export interface HeadersRenderOptions {
  prefix?: string;
  suffix?: string;
  pretty?: boolean;
}

export type TagType = string;
export type ValueType =
  | Record<string, string>
  | string[]
  | string
  | boolean
  | undefined;

export type SingleValue = string;
export type MultiValue = string | string[];
export type NamedValue = Record<string, string>;
export type SwitchValue = boolean;

export interface HeadersProps {
  name?: SingleValue;
  version?: SingleValue;
  namespace?: SingleValue;
  author?: SingleValue;
  description?: SingleValue;
  homepage?: SingleValue;
  homepageURL?: SingleValue;
  website?: SingleValue;
  source?: SingleValue;
  icon?: SingleValue;
  iconURL?: SingleValue;
  defaulticon?: SingleValue;
  icon64?: SingleValue;
  icon64URL?: SingleValue;
  updateURL?: SingleValue;
  downloadURL?: SingleValue;
  installURL?: SingleValue;
  supportURL?: SingleValue;
  include?: MultiValue;
  match?: MultiValue;
  exclude?: MultiValue;
  require?: MultiValue;
  resource?: NamedValue;
  connect?: MultiValue;
  grant?: MultiValue;
  webRequest?: MultiValue;
  noframes?: SwitchValue;
  unwrap?: SwitchValue;
  antifeature?: NamedValue;
  ['run-at']?: RunAtValue;
}

export class Headers implements HeadersProps {
  @IsString()
  public name!: SingleValue;

  @IsOptional()
  @IsSemVer()
  public version?: SingleValue;

  @IsOptional()
  @IsString()
  public namespace?: SingleValue;

  @IsOptional()
  @IsString()
  public author?: SingleValue;

  @IsOptional()
  @IsString()
  public description?: SingleValue;

  @IsOptional()
  @IsUrl()
  public homepage?: SingleValue;

  @IsOptional()
  @IsUrl()
  public homepageURL?: SingleValue;

  @IsOptional()
  @IsUrl()
  public website?: SingleValue;

  @IsOptional()
  @IsUrl()
  public source?: SingleValue;

  @IsOptional()
  @IsUrl()
  public icon?: SingleValue;

  @IsOptional()
  @IsUrl()
  public iconURL?: SingleValue;

  @IsOptional()
  @IsUrl()
  public defaulticon?: SingleValue;

  @IsOptional()
  @IsUrl()
  public icon64?: SingleValue;

  @IsOptional()
  @IsUrl()
  public icon64URL?: SingleValue;

  @IsOptional()
  @IsUrl()
  public updateURL?: SingleValue;

  @IsOptional()
  @IsUrl()
  public downloadURL?: SingleValue;

  @IsOptional()
  @IsUrl()
  public installURL?: SingleValue;

  @IsOptional()
  @IsUrl()
  public supportURL?: SingleValue;

  @IsOptional()
  @IsString()
  public include?: MultiValue;

  @IsOptional()
  @IsString()
  public match?: MultiValue;

  @IsOptional()
  @IsString()
  public exclude?: MultiValue;

  @IsOptional()
  @IsString()
  public require?: MultiValue;

  @IsOptional()
  @IsObject()
  public resource?: NamedValue;

  @IsOptional()
  @IsString()
  public connect?: MultiValue;

  @IsOptional()
  @IsString()
  public grant?: MultiValue;

  @IsOptional()
  @IsString()
  public webRequest?: MultiValue;

  @IsOptional()
  @IsBoolean()
  public noframes?: SwitchValue;

  @IsOptional()
  @IsBoolean()
  public unwrap?: SwitchValue;

  @IsOptional()
  @IsObject()
  public antifeature?: NamedValue;

  @IsOptional()
  @IsEnum(RunAtValue)
  public ['run-at']?: RunAtValue;

  protected postInit(): void {
    if (this.include === undefined && this.match === undefined) {
      this.match = '*://*/*';
    }
  }

  public render({
    prefix = '// ==UserScript==',
    suffix = '// ==/UserScript==',
  }: HeadersRenderOptions = {}): string {
    const obj = instanceToPlain(this, { exposeUnsetFields: false }) as Record<
      TagType,
      Exclude<ValueType, undefined>
    >;
    const body = Object.entries(obj)
      .map(([tag, value]) => this.renderTag(tag, value))
      .join('\n');
    return [prefix, body, suffix].join('\n');
  }

  private renderTag(
    tag: TagType,
    value: Exclude<ValueType, undefined>,
  ): string {
    if (Array.isArray(value)) {
      return value.map((v) => `// @${tag} ${v}`).join('\n');
    }

    if (typeof value === 'object') {
      return Object.entries(value)
        .map(([k, v]) => `// @${tag} ${k} ${v}`)
        .join('\n');
    }

    return `// @${tag} ${String(value)}`;
  }

  public equals(other: Headers): boolean {
    return isDeepStrictEqual(this, other);
  }

  public static fromJSON(
    props: HeadersProps,
    { strict }: Partial<HeadersFactoryOptions> = {},
  ): Headers {
    const headers = plainToInstance(Headers, props, {
      exposeDefaultValues: true,
    });
    headers.postInit();

    if (strict) {
      const errors = validateSync(headers, {
        forbidNonWhitelisted: true,
        stopAtFirstError: false,
      });
      if (errors.length > 0) {
        throw new Error(errors.map((err) => err.toString()).join('\n'));
      }
    }

    return headers;
  }
}
