import { isDeepStrictEqual } from 'node:util';

import {
  instanceToPlain,
  plainToInstance,
  Transform,
  Type,
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

export interface HeadersFactoryOptions {
  strict: boolean;
}

const TransformArray = (): PropertyDecorator =>
  Transform(({ value }) => (Array.isArray(value) ? value : [value]));

const TranformObject = (): PropertyDecorator =>
  Transform(({ value }) =>
    Array.isArray(value) ? Object.fromEntries(value) : value,
  );

export enum RunAt {
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

export class Headers {
  @IsString()
  public readonly name!: string;

  @IsOptional()
  @IsSemVer()
  public readonly version?: string;

  @IsOptional()
  @IsString()
  public readonly namespace?: string;

  @IsOptional()
  @IsString()
  public readonly author?: string;

  @IsOptional()
  @IsString()
  public readonly description?: string;

  @IsOptional()
  @IsUrl()
  public readonly homepage?: string;

  @IsOptional()
  @IsUrl()
  public readonly homepageURL?: string;

  @IsOptional()
  @IsUrl()
  public readonly website?: string;

  @IsOptional()
  @IsUrl()
  public readonly source?: string;

  @IsOptional()
  @IsUrl()
  public readonly icon?: string;

  @IsOptional()
  @IsUrl()
  public readonly iconURL?: string;

  @IsOptional()
  @IsUrl()
  public readonly defaulticon?: string;

  @IsOptional()
  @IsUrl()
  public readonly icon64?: string;

  @IsOptional()
  @IsUrl()
  public readonly icon64URL?: string;

  @IsOptional()
  @IsUrl()
  public readonly updateURL?: string;

  @IsOptional()
  @IsUrl()
  public readonly downloadURL?: string;

  @IsOptional()
  @IsUrl()
  public readonly installURL?: string;

  @IsOptional()
  @IsUrl()
  public readonly supportURL?: string;

  @TransformArray()
  @IsOptional()
  @IsString({ each: true })
  public readonly include?: Readonly<string[]>;

  @TransformArray()
  @IsOptional()
  @IsString({ each: true })
  public readonly match?: Readonly<string[]>;

  @TransformArray()
  @IsOptional()
  @IsString({ each: true })
  public readonly exclude?: Readonly<string[]>;

  @TransformArray()
  @IsOptional()
  @IsString({ each: true })
  public readonly require?: Readonly<string[]>;

  @TranformObject()
  @IsOptional()
  @IsObject()
  public readonly resource?: Readonly<Record<string, string>>;

  @TransformArray()
  @IsOptional()
  @IsString({ each: true })
  public readonly connect?: Readonly<string[]>;

  @TransformArray()
  @IsOptional()
  @IsString({ each: true })
  public readonly grant?: Readonly<string[]>;

  @TransformArray()
  @IsOptional()
  @IsString({ each: true })
  public readonly webRequest?: Readonly<string[]>;

  @Type(() => Boolean)
  @IsOptional()
  @IsBoolean()
  public readonly noframes?: boolean;

  @Type(() => Boolean)
  @IsOptional()
  @IsBoolean()
  public readonly unwrap?: boolean;

  @TranformObject()
  @IsOptional()
  @IsObject()
  public readonly antifeature?: Readonly<Record<string, string>>;

  @IsOptional()
  @IsEnum(RunAt)
  public readonly ['run-at']?:
    | 'document-start'
    | 'document-body'
    | 'document-end'
    | 'document-idle'
    | 'context-menu';

  public render({
    prefix = '// ==UserScript==',
    suffix = '// ==/UserScript==',
  }: HeadersRenderOptions = {}): string {
    const body = Object.entries(
      instanceToPlain(this) as Record<
        string,
        Record<string, string> | string[] | string | boolean
      >,
    )
      .filter(([, value]) => value !== null && value !== undefined)
      .map(([tag, value]) => this.renderTag(tag, value))
      .join('\n');
    return [prefix, body, suffix].join('\n');
  }

  private renderTag(
    tag: string,
    value: Record<string, string> | string[] | string | boolean,
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
    obj: unknown,
    { strict }: Partial<HeadersFactoryOptions> = {},
  ): Headers {
    const headers = plainToInstance(Headers, obj);
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
