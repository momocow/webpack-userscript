import {
  ClassConstructor,
  Expose,
  instanceToPlain,
  plainToInstance,
} from 'class-transformer';
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
import { getBorderCharacters, table } from 'table';

export interface HeadersFactoryOptions {
  whitelist?: boolean;
}

export interface HeadersRenderOptions {
  prefix?: string;
  suffix?: string;
  pretty?: boolean;
  tagOrder?: TagType[];
}

export interface HeadersValidateOptions {
  whitelist?: boolean;
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

export enum RunAtValue {
  DocumentStart = 'document-start',
  DocumentBody = 'document-body',
  DocumentEnd = 'document-end',
  DocumentIdle = 'document-idle',
  ContextMenu = 'context-menu',
}

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
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  protected constructor() {}

  @Expose()
  @IsString()
  public readonly name!: SingleValue;

  @Expose()
  @IsOptional()
  @IsSemVer()
  public readonly version?: SingleValue;

  @Expose()
  @IsOptional()
  @IsString()
  public readonly namespace?: SingleValue;

  @Expose()
  @IsOptional()
  @IsString()
  public readonly author?: SingleValue;

  @Expose()
  @IsOptional()
  @IsString()
  public readonly description?: SingleValue;

  @Expose()
  @IsOptional()
  @IsUrl()
  public readonly homepage?: SingleValue;

  @Expose()
  @IsOptional()
  @IsUrl()
  public readonly homepageURL?: SingleValue;

  @Expose()
  @IsOptional()
  @IsUrl()
  public readonly website?: SingleValue;

  @Expose()
  @IsOptional()
  @IsUrl()
  public readonly source?: SingleValue;

  @Expose()
  @IsOptional()
  @IsUrl()
  public readonly icon?: SingleValue;

  @Expose()
  @IsOptional()
  @IsUrl()
  public readonly iconURL?: SingleValue;

  @Expose()
  @IsOptional()
  @IsUrl()
  public readonly defaulticon?: SingleValue;

  @Expose()
  @IsOptional()
  @IsUrl()
  public readonly icon64?: SingleValue;

  @Expose()
  @IsOptional()
  @IsUrl()
  public readonly icon64URL?: SingleValue;

  @Expose()
  @IsOptional()
  @IsUrl()
  public readonly updateURL?: SingleValue;

  @Expose()
  @IsOptional()
  @IsUrl()
  public readonly downloadURL?: SingleValue;

  @Expose()
  @IsOptional()
  @IsUrl()
  public readonly installURL?: SingleValue;

  @Expose()
  @IsOptional()
  @IsUrl()
  public readonly supportURL?: SingleValue;

  @Expose()
  @IsOptional()
  @IsString()
  public readonly include?: MultiValue;

  @Expose()
  @IsOptional()
  @IsString()
  public readonly match?: MultiValue;

  @Expose()
  @IsOptional()
  @IsString()
  public readonly exclude?: MultiValue;

  @Expose()
  @IsOptional()
  @IsString()
  public readonly require?: MultiValue;

  @Expose()
  @IsOptional()
  @IsObject()
  public readonly resource?: NamedValue;

  @Expose()
  @IsOptional()
  @IsString()
  public readonly connect?: MultiValue;

  @Expose()
  @IsOptional()
  @IsString()
  public readonly grant?: MultiValue;

  @Expose()
  @IsOptional()
  @IsString()
  public readonly webRequest?: MultiValue;

  @Expose()
  @IsOptional()
  @IsBoolean()
  public readonly noframes?: SwitchValue;

  @Expose()
  @IsOptional()
  @IsBoolean()
  public readonly unwrap?: SwitchValue;

  @Expose()
  @IsOptional()
  @IsObject()
  public readonly antifeature?: NamedValue;

  @Expose()
  @IsOptional()
  @IsEnum(RunAtValue)
  public readonly ['run-at']?: RunAtValue;

  public toJSON(): HeadersProps {
    return instanceToPlain(this, { exposeUnsetFields: false });
  }

  public render({
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
  }: HeadersRenderOptions = {}): string {
    const orderRevMap = new Map(tagOrder.map((tag, index) => [tag, index]));
    const obj = this.toJSON();
    const rows = Object.entries(obj)
      .sort(
        ([tag1], [tag2]) =>
          (orderRevMap.get(tag1) ?? orderRevMap.size) -
          (orderRevMap.get(tag2) ?? orderRevMap.size),
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
      return value.map((v) => [`// @${tag}`, v]);
    }

    if (typeof value === 'object') {
      return Object.entries(value).map(([k, v]) => [`// @${tag}`, `${k} ${v}`]);
    }

    if (typeof value === 'string') {
      return [[`// @${tag}`, value]];
    }

    if (value === true) {
      return [[`// @${tag}`]];
    }

    return [];
  }

  public validate({ whitelist }: HeadersValidateOptions = {}): void {
    const errors = validateSync(this, {
      forbidNonWhitelisted: whitelist,
      whitelist,
      stopAtFirstError: false,
    });

    if (errors.length > 0) {
      throw new Error(errors.map((err) => err.toString()).join('\n'));
    }
  }

  public static fromJSON<T extends Headers>(
    props: HeadersProps,
    { whitelist = false }: HeadersFactoryOptions = {},
  ): Readonly<T> {
    const headers = plainToInstance(
      this as unknown as ClassConstructor<T>,
      props,
      {
        exposeDefaultValues: true,
        excludeExtraneousValues: whitelist,
      },
    );

    return headers;
  }
}
