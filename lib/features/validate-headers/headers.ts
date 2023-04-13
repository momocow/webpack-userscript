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
import {
  IsDefined,
  IsEnumValue,
  IsMultiValue,
  IsNamedValue,
  IsNestedValue,
  IsOptional,
  IsSingleValue,
  IsSwitchValue,
  IsUnique,
  IsURLValue,
  partialGroups,
} from './utils';

export enum ValidationGroup {
  Main = 'main',
  I18n = 'i18n',
}

export const Main = partialGroups(ValidationGroup.Main);
export const I18n = partialGroups(ValidationGroup.I18n);
export const Always = partialGroups(ValidationGroup.Main, ValidationGroup.I18n);

export class Compatibility implements CompatibilityValue {
  [x: string]: SingleValue;

  @Main(IsOptional(), IsSingleValue())
  public readonly firefox?: SingleValue;

  @Main(IsOptional(), IsSingleValue())
  public readonly chrome?: SingleValue;

  @Main(IsOptional(), IsSingleValue())
  public readonly opera?: SingleValue;

  @Main(IsOptional(), IsSingleValue())
  public readonly safari?: SingleValue;

  @Main(IsOptional(), IsSingleValue())
  public readonly edge?: SingleValue;
}

export class Headers implements StrictHeadersProps {
  @Main(IsDefined(), IsSingleValue())
  @I18n(IsOptional(), IsSingleValue())
  public readonly name?: SingleValue;

  @Main(IsOptional(), IsSingleValue())
  public readonly version?: SingleValue;

  @Main(IsOptional(), IsSingleValue())
  public readonly namespace?: SingleValue;

  @Main(IsOptional(), IsSingleValue())
  public readonly author?: SingleValue;

  @Always(IsOptional(), IsSingleValue())
  public readonly description?: SingleValue;

  @Main(IsOptional(), IsURLValue(), IsUnique('homepage'))
  public readonly homepage?: SingleValue;

  @Main(IsOptional(), IsURLValue(), IsUnique('homepage'))
  public readonly homepageURL?: SingleValue;

  @Main(IsOptional(), IsURLValue(), IsUnique('homepage'))
  public readonly website?: SingleValue;

  @Main(IsOptional(), IsURLValue(), IsUnique('homepage'))
  public readonly source?: SingleValue;

  @Main(IsOptional(), IsURLValue(), IsUnique('icon'))
  public readonly icon?: SingleValue;

  @Main(IsOptional(), IsURLValue(), IsUnique('icon'))
  public readonly iconURL?: SingleValue;

  @Main(IsOptional(), IsURLValue(), IsUnique('icon'))
  public readonly defaulticon?: SingleValue;

  @Main(IsOptional(), IsURLValue(), IsUnique('icon64'))
  public readonly icon64?: SingleValue;

  @Main(IsOptional(), IsURLValue(), IsUnique('icon64'))
  public readonly icon64URL?: SingleValue;

  @Main(IsOptional(), IsURLValue())
  public readonly updateURL?: SingleValue;

  @Main(IsOptional(), IsURLValue(), IsUnique('downloadURL'))
  public readonly downloadURL?: SingleValue;

  @Main(IsOptional(), IsURLValue(), IsUnique('downloadURL'))
  public readonly installURL?: SingleValue;

  @Main(IsOptional(), IsURLValue())
  public readonly supportURL?: SingleValue;

  @Main(IsOptional(), IsMultiValue())
  public readonly include?: MultiValue;

  @Main(IsOptional(), IsMultiValue())
  public readonly match?: MultiValue;

  @Main(IsOptional(), IsMultiValue())
  public readonly 'exclude-match'?: MultiValue;

  @Main(IsOptional(), IsMultiValue())
  public readonly exclude?: MultiValue;

  @Main(IsOptional(), IsMultiValue())
  public readonly require?: MultiValue;

  @Main(IsOptional(), IsNamedValue())
  public readonly resource?: NamedValue;

  @Main(IsOptional(), IsMultiValue())
  public readonly connect?: MultiValue;

  @Main(IsOptional(), IsMultiValue())
  public readonly grant?: MultiValue;

  @Main(IsOptional(), IsMultiValue())
  public readonly webRequest?: MultiValue;

  @Main(IsOptional(), IsSwitchValue())
  public readonly noframes?: SwitchValue;

  @Main(IsOptional(), IsSwitchValue())
  public readonly unwrap?: SwitchValue;

  @Always(IsOptional(), IsNamedValue())
  public readonly antifeature?: NamedValue;

  @Main(IsOptional(), IsEnumValue(RunAt))
  public readonly 'run-at'?: RunAt;

  @Main(IsOptional(), IsSingleValue())
  public readonly copyright?: SingleValue;

  @Main(IsOptional(), IsEnumValue(Sandbox))
  public readonly sandbox?: Sandbox;

  @Main(IsOptional(), IsEnumValue(InjectInto))
  public readonly 'inject-into'?: InjectInto;

  @Main(IsOptional(), IsSingleValue())
  public readonly license?: SingleValue;

  @Main(IsOptional(), IsURLValue())
  public readonly contributionURL?: SingleValue;

  @Main(IsOptional(), IsSingleValue())
  public readonly contributionAmount?: SingleValue;

  @Main(IsOptional(), IsNestedValue(Compatibility))
  public readonly compatible?: Compatibility;

  @Main(IsOptional(), IsNestedValue(Compatibility))
  public readonly incompatible?: Compatibility;
}
