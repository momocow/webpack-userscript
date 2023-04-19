import * as transformer from 'class-transformer';
import { defaultMetadataStorage } from 'class-transformer/cjs/storage';
import * as validator from 'class-validator';

import { applyDecorators, IsRecord, MutuallyExclusive } from '../../utils';

export interface GroupsOptions {
  groups?: string[];
}

export type Validator = (options?: GroupsOptions) => PropertyDecorator;
export type ValidatorFactory<T extends any[] = []> = (...args: T) => Validator;

/**
 * `@Expose()` from class-transformer is not stackable,
 * wrap it in a new `@Expose()` implementation to stack for `groups` options.
 */
export const Expose: Validator =
  (options: transformer.ExposeOptions = {}) =>
  (target, prop) => {
    const metadata = defaultMetadataStorage.findExposeMetadata(
      target.constructor,
      prop as string,
    );

    if (!metadata) {
      transformer.Expose(options)(target, prop);

      return;
    }

    // merge expose options
    Object.assign(
      metadata.options,
      options,
      options.groups
        ? {
            groups: (metadata.options.groups ?? []).concat(options.groups),
          }
        : undefined,
    );
  };

export const partialGroups =
  (...groups: string[]) =>
  (...decorators: Validator[]): PropertyDecorator =>
    applyDecorators(...decorators.map((deco) => deco({ groups })));

export const IsOptional: ValidatorFactory = () => validator.IsOptional;

export const IsDefined: ValidatorFactory = () => validator.IsDefined;

export const IsUnique: ValidatorFactory<[string]> = (name) => (options) =>
  MutuallyExclusive(name, options);

export const IsSingleValue: ValidatorFactory = () => (options) =>
  applyDecorators(Expose(options), validator.IsString(options));

export const IsMultiValue: ValidatorFactory = () => (options) =>
  applyDecorators(
    Expose(options),
    validator.IsString({ ...options, each: true }),
  );

export const IsURLValue: ValidatorFactory = () => (options) =>
  applyDecorators(Expose(options), validator.IsUrl(undefined, options));

export const IsVersionValue: ValidatorFactory = () => (options) =>
  applyDecorators(Expose(options), validator.IsSemVer(options));

export const IsSwitchValue: ValidatorFactory = () => (options) =>
  applyDecorators(Expose(options), validator.IsBoolean(options));

export const IsNamedValue: ValidatorFactory = () => (options) =>
  applyDecorators(
    Expose(options),
    IsRecord([validator.isString], [validator.isString], {
      ...options,
      message: ({ property }) => ` "${property}" is not a valid named value`,
    }),
  );

export const IsEnumValue: ValidatorFactory<[Record<string, unknown>]> =
  (entity) => (options) =>
    applyDecorators(Expose(options), validator.IsEnum(entity, options));

export const IsNestedValue: ValidatorFactory<[{ new (): object }]> =
  (clazz) => (options) =>
    applyDecorators(
      Expose(options),
      transformer.Type(() => clazz),
      validator.ValidateNested(options),
    );
