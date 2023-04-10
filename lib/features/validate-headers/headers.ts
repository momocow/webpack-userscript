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
import { MutuallyExclusive } from '../../utils';
import {
  IsEnumValue,
  IsMultiValue,
  IsNamedValue,
  IsNestedValue,
  IsRequiredValue,
  IsSingleValue,
  IsSwitchValue,
  IsURLValue,
  IsVersionValue,
} from './decorators';

class Compatibility implements CompatibilityValue {
  [x: string]: SingleValue;

  @IsSingleValue()
  public readonly firefox?: SingleValue;

  @IsSingleValue()
  public readonly chrome?: SingleValue;

  @IsSingleValue()
  public readonly opera?: SingleValue;

  @IsSingleValue()
  public readonly safari?: SingleValue;

  @IsSingleValue()
  public readonly edge?: SingleValue;
}

export class Headers implements StrictHeadersProps {
  @IsRequiredValue()
  public readonly name!: SingleValue;

  @IsVersionValue()
  public readonly version?: SingleValue;

  @IsSingleValue()
  public readonly namespace?: SingleValue;

  @IsSingleValue()
  public readonly author?: SingleValue;

  @IsSingleValue()
  public readonly description?: SingleValue;

  @IsURLValue()
  @MutuallyExclusive('homepage')
  public readonly homepage?: SingleValue;

  @IsURLValue()
  @MutuallyExclusive('homepage')
  public readonly homepageURL?: SingleValue;

  @IsURLValue()
  @MutuallyExclusive('homepage')
  public readonly website?: SingleValue;

  @IsURLValue()
  @MutuallyExclusive('homepage')
  public readonly source?: SingleValue;

  @IsURLValue()
  @MutuallyExclusive('icon')
  public readonly icon?: SingleValue;

  @IsURLValue()
  @MutuallyExclusive('icon')
  public readonly iconURL?: SingleValue;

  @IsURLValue()
  @MutuallyExclusive('icon')
  public readonly defaulticon?: SingleValue;

  @IsURLValue()
  @MutuallyExclusive('icon64')
  public readonly icon64?: SingleValue;

  @IsURLValue()
  @MutuallyExclusive('icon64')
  public readonly icon64URL?: SingleValue;

  @IsURLValue()
  public readonly updateURL?: SingleValue;

  @IsURLValue()
  @MutuallyExclusive('downloadURL')
  public readonly downloadURL?: SingleValue;

  @IsURLValue()
  @MutuallyExclusive('downloadURL')
  public readonly installURL?: SingleValue;

  @IsURLValue()
  public readonly supportURL?: SingleValue;

  @IsMultiValue()
  public readonly include?: MultiValue;

  @IsMultiValue()
  public readonly match?: MultiValue;

  @IsMultiValue()
  public readonly 'exclude-match'?: MultiValue;

  @IsMultiValue()
  public readonly exclude?: MultiValue;

  @IsMultiValue()
  public readonly require?: MultiValue;

  @IsNamedValue()
  public readonly resource?: NamedValue;

  @IsMultiValue()
  public readonly connect?: MultiValue;

  @IsMultiValue()
  public readonly grant?: MultiValue;

  @IsMultiValue()
  public readonly webRequest?: MultiValue;

  @IsSwitchValue()
  public readonly noframes?: SwitchValue;

  @IsSwitchValue()
  public readonly unwrap?: SwitchValue;

  @IsNamedValue()
  public readonly antifeature?: NamedValue;

  @IsEnumValue(RunAt)
  public readonly 'run-at'?: RunAt;

  @IsSingleValue()
  public readonly copyright?: SingleValue;

  @IsEnumValue(Sandbox)
  public readonly sandbox?: Sandbox;

  @IsEnumValue(InjectInto)
  public readonly 'inject-into'?: InjectInto;

  @IsSingleValue()
  public readonly license?: SingleValue;

  @IsURLValue()
  public readonly contributionURL?: SingleValue;

  @IsSingleValue()
  public readonly contributionAmount?: SingleValue;

  @IsNestedValue(Compatibility)
  public readonly compatible?: Compatibility;

  @IsNestedValue(Compatibility)
  public readonly incompatible?: Compatibility;
}
