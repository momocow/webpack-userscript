import { Expose, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsObject,
  IsOptional,
  IsSemVer,
  IsString,
  IsUrl,
  ValidateNested,
} from 'class-validator';

import {
  CompatibilityValue,
  InjectInto,
  MultiValue,
  NamedValue,
  RunAt,
  Sandbox,
  SingleValue,
  StrictHeadersProps,
  SwitchValue,
} from '../../types';

class Compatibility implements CompatibilityValue {
  [x: string]: SingleValue;

  @Expose()
  @IsOptional()
  @IsString()
  public readonly firefox?: string;

  @Expose()
  @IsOptional()
  @IsString()
  public readonly chrome?: string;

  @Expose()
  @IsOptional()
  @IsString()
  public readonly opera?: string;

  @Expose()
  @IsOptional()
  @IsString()
  public readonly safari?: string;

  @Expose()
  @IsOptional()
  @IsString()
  public readonly edge?: string;
}

export class Headers implements StrictHeadersProps {
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
  @IsString({ each: true })
  public readonly include?: MultiValue;

  @Expose()
  @IsOptional()
  @IsString({ each: true })
  public readonly match?: MultiValue;

  @Expose()
  @IsOptional()
  @IsString({ each: true })
  public readonly 'exclude-match'?: MultiValue;

  @Expose()
  @IsOptional()
  @IsString({ each: true })
  public readonly exclude?: MultiValue;

  @Expose()
  @IsOptional()
  @IsString({ each: true })
  public readonly require?: MultiValue;

  @Expose()
  @IsOptional()
  @IsObject()
  public readonly resource?: NamedValue;

  @Expose()
  @IsOptional()
  @IsString({ each: true })
  public readonly connect?: MultiValue;

  @Expose()
  @IsOptional()
  @IsString({ each: true })
  public readonly grant?: MultiValue;

  @Expose()
  @IsOptional()
  @IsString({ each: true })
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
  @IsEnum(RunAt)
  public readonly 'run-at'?: RunAt;

  @Expose()
  @IsOptional()
  @IsString()
  public readonly copyright?: SingleValue;

  @Expose()
  @IsOptional()
  @IsEnum(Sandbox)
  public readonly sandbox?: Sandbox;

  @Expose()
  @IsOptional()
  @IsEnum(InjectInto)
  public readonly 'inject-into'?: InjectInto;

  @Expose()
  @IsOptional()
  @IsString()
  public readonly license?: SingleValue;

  @Expose()
  @IsOptional()
  @IsUrl()
  public readonly contributionURL?: SingleValue;

  @Expose()
  @IsOptional()
  @IsString()
  public readonly contributionAmount?: SingleValue;

  @Expose()
  @Type(() => Compatibility)
  @IsOptional()
  @ValidateNested()
  public readonly compatible?: Compatibility;

  @Expose()
  @Type(() => Compatibility)
  @IsOptional()
  @ValidateNested()
  public readonly incompatible?: Compatibility;
}
