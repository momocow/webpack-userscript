import { isDeepStrictEqual } from 'node:util';

import { Expose, instanceToPlain, plainToInstance } from 'class-transformer';
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

export interface StrictHeadersProps {
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

export interface HeadersProps extends StrictHeadersProps {
  [tag: TagType]: ValueType;
}

export class Headers implements StrictHeadersProps {
  @Expose()
  @IsString()
  public name!: SingleValue;

  @Expose()
  @IsOptional()
  @IsSemVer()
  public version?: SingleValue;

  @Expose()
  @IsOptional()
  @IsString()
  public namespace?: SingleValue;

  @Expose()
  @IsOptional()
  @IsString()
  public author?: SingleValue;

  @Expose()
  @IsOptional()
  @IsString()
  public description?: SingleValue;

  @Expose()
  @IsOptional()
  @IsUrl()
  public homepage?: SingleValue;

  @Expose()
  @IsOptional()
  @IsUrl()
  public homepageURL?: SingleValue;

  @Expose()
  @IsOptional()
  @IsUrl()
  public website?: SingleValue;

  @Expose()
  @IsOptional()
  @IsUrl()
  public source?: SingleValue;

  @Expose()
  @IsOptional()
  @IsUrl()
  public icon?: SingleValue;

  @Expose()
  @IsOptional()
  @IsUrl()
  public iconURL?: SingleValue;

  @Expose()
  @IsOptional()
  @IsUrl()
  public defaulticon?: SingleValue;

  @Expose()
  @IsOptional()
  @IsUrl()
  public icon64?: SingleValue;

  @Expose()
  @IsOptional()
  @IsUrl()
  public icon64URL?: SingleValue;

  @Expose()
  @IsOptional()
  @IsUrl()
  public updateURL?: SingleValue;

  @Expose()
  @IsOptional()
  @IsUrl()
  public downloadURL?: SingleValue;

  @Expose()
  @IsOptional()
  @IsUrl()
  public installURL?: SingleValue;

  @Expose()
  @IsOptional()
  @IsUrl()
  public supportURL?: SingleValue;

  @Expose()
  @IsOptional()
  @IsString()
  public include?: MultiValue;

  @Expose()
  @IsOptional()
  @IsString()
  public match?: MultiValue;

  @Expose()
  @IsOptional()
  @IsString()
  public exclude?: MultiValue;

  @Expose()
  @IsOptional()
  @IsString()
  public require?: MultiValue;

  @Expose()
  @IsOptional()
  @IsObject()
  public resource?: NamedValue;

  @Expose()
  @IsOptional()
  @IsString()
  public connect?: MultiValue;

  @Expose()
  @IsOptional()
  @IsString()
  public grant?: MultiValue;

  @Expose()
  @IsOptional()
  @IsString()
  public webRequest?: MultiValue;

  @Expose()
  @IsOptional()
  @IsBoolean()
  public noframes?: SwitchValue;

  @Expose()
  @IsOptional()
  @IsBoolean()
  public unwrap?: SwitchValue;

  @Expose()
  @IsOptional()
  @IsObject()
  public antifeature?: NamedValue;

  @Expose()
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
    { strict = false }: Partial<HeadersFactoryOptions> = {},
  ): Headers {
    const headers = plainToInstance(Headers, props, {
      exposeDefaultValues: true,
      excludeExtraneousValues: strict,
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
