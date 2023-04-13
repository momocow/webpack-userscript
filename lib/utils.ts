import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';

export function date(): Date {
  return new Date();
}

/**
 * Shipped from NestJs#applyDecorators()
 * @see {@link https://github.com/nestjs/nest/blob/bee462e031f9562210c65b9eb8e8a20cab1f301f/packages/common/decorators/core/apply-decorators.ts github:nestjs/nest}
 */
export function applyDecorators(
  ...decorators: Array<ClassDecorator | MethodDecorator | PropertyDecorator>
) {
  return <TFunction extends (...args: any[]) => any, Y>(
    target: TFunction | object,
    propertyKey?: string | symbol,
    descriptor?: TypedPropertyDescriptor<Y>,
  ): void => {
    for (const decorator of decorators) {
      if (target instanceof Function && !descriptor) {
        (decorator as ClassDecorator)(target);

        continue;
      }
      (decorator as MethodDecorator | PropertyDecorator)(
        target,
        propertyKey as string | symbol,
        descriptor as TypedPropertyDescriptor<Y>,
      );
    }
  };
}
/**
 * @see {@link https://github.com/typestack/class-validator/issues/759#issuecomment-712361384 github:typestack/class-validator#759}
 */
export function MutuallyExclusive(
  group: string,
  validationOptions?: ValidationOptions,
): PropertyDecorator {
  const key = MutuallyExclusive.getMetaKey(group);

  return function (object: any, propertyName: string | symbol): void {
    const existing = Reflect.getMetadata(key, object) ?? [];

    Reflect.defineMetadata(key, [...existing, propertyName], object);

    registerDecorator({
      name: 'MutuallyExclusive',
      target: object.constructor,
      propertyName: propertyName as string,
      constraints: [group],
      options: validationOptions,
      validator: {
        validate(_: any, args: ValidationArguments) {
          const mutuallyExclusiveProps: Array<string> = Reflect.getMetadata(
            key,
            args.object,
          );

          return (
            mutuallyExclusiveProps.reduce(
              (p, c) => ((args.object as any)[c] !== undefined ? ++p : p),
              0,
            ) === 1
          );
        },
        defaultMessage(validationArguments?: ValidationArguments) {
          if (!validationArguments) {
            return `Mutually exclusive group "${group}" is violated`;
          }

          const mutuallyExclusiveProps = (
            Reflect.getMetadata(key, validationArguments.object) as string[]
          ).filter(
            (prop) => (validationArguments.object as any)[prop] !== undefined,
          );

          const propsString = mutuallyExclusiveProps
            .map((p) => `"${p}"`)
            .join(', ');

          return (
            `Mutually exclusive group "${group}" is violated, ` +
            `${propsString}.`
          );
        },
      },
    });
  };
}

MutuallyExclusive.getMetaKey = (tag: string): symbol =>
  Symbol.for(`custom:__@rst/validator_mutually_exclusive_${tag}__`);

export function IsRecord(
  keyValidators: ((k: string | symbol) => boolean)[] = [],
  valueValidators: ((v: any) => boolean)[] = [],
  validationOptions?: ValidationOptions,
): PropertyDecorator {
  return function (object: any, propertyName: string | symbol): void {
    registerDecorator({
      name: 'IsRecord',
      target: object.constructor,
      propertyName: propertyName as string,
      constraints: [],
      options: validationOptions,
      validator: {
        validate(value: any) {
          return (
            typeof value === 'object' &&
            Object.entries(value).every(
              ([k, v]) =>
                keyValidators.every((validator) => validator(k)) &&
                valueValidators.every((validator) => validator(v)),
            )
          );
        },

        defaultMessage() {
          return 'record validation failed';
        },
      },
    });
  };
}
