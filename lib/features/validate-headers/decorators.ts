import { Expose, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsSemVer,
  IsString,
  isString,
  IsUrl,
  ValidateNested,
} from 'class-validator';

import { applyDecorators, IsRecord } from '../../utils';

export const IsRequiredValue = (): PropertyDecorator =>
  applyDecorators(Expose(), IsString());

export const IsSingleValue = (): PropertyDecorator =>
  applyDecorators(Expose(), IsOptional(), IsString());

export const IsMultiValue = (): PropertyDecorator =>
  applyDecorators(Expose(), IsOptional(), IsString({ each: true }));

export const IsURLValue = (): PropertyDecorator =>
  applyDecorators(Expose(), IsOptional(), IsUrl());

export const IsVersionValue = (): PropertyDecorator =>
  applyDecorators(Expose(), IsOptional(), IsSemVer());

export const IsSwitchValue = (): PropertyDecorator =>
  applyDecorators(Expose(), IsOptional(), IsBoolean());

export const IsNamedValue = (): PropertyDecorator =>
  applyDecorators(
    Expose(),
    IsOptional(),
    IsRecord([isString], [isString], {
      message: ({ property }) => `"${property}" is not a valid named value`,
    }),
  );

export const IsEnumValue = (
  entity: Record<string, unknown>,
): PropertyDecorator => applyDecorators(Expose(), IsOptional(), IsEnum(entity));

export const IsNestedValue = (clazz: { new (): object }): PropertyDecorator =>
  applyDecorators(
    Expose(),
    Type(() => clazz),
    IsOptional(),
    ValidateNested(),
  );
