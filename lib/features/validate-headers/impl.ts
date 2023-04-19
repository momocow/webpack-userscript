import { instanceToPlain, plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';

import { DEFAULT_LOCALE_KEY } from '../../const';
import { HeadersProps, UserscriptPluginInstance } from '../../types';
import { Feature } from '../feature';
import { Headers, ValidationGroup } from './headers';

export interface HeadersValidatorOptions {
  strict?: boolean;
  whitelist?: boolean;
}

export type HeaderClass = { new (): object };

export interface ValidateHeadersOptions extends HeadersValidatorOptions {
  proxyScript?: unknown;
  headersClass?: HeaderClass;
}

export class ValidateHeaders extends Feature<ValidateHeadersOptions> {
  public readonly name = 'ValidateHeaders';

  public apply({ hooks }: UserscriptPluginInstance): void {
    const HeadersClass = this.options.headersClass ?? Headers;

    hooks.headers.tap(this.name, (headersProps, { locale }) =>
      this.validateHeaders(locale, headersProps, HeadersClass, this.options),
    );

    if (this.options.proxyScript) {
      hooks.proxyHeaders.tap(this.name, (headersProps, { locale }) =>
        this.validateHeaders(locale, headersProps, HeadersClass, this.options),
      );
    }
  }

  private validateHeaders(
    locale: string,
    headersProps: HeadersProps,
    HeadersClass: HeaderClass,
    { whitelist, strict }: HeadersValidatorOptions = {},
  ): HeadersProps {
    const validatorGroups = [
      locale === DEFAULT_LOCALE_KEY
        ? ValidationGroup.Main
        : ValidationGroup.I18n,
    ];

    const transformerGroups = whitelist
      ? validatorGroups
      : [ValidationGroup.Main, ValidationGroup.I18n];

    const headers = plainToInstance(HeadersClass, headersProps, {
      exposeDefaultValues: true,
      excludeExtraneousValues: whitelist,
      exposeUnsetFields: false,
      groups: transformerGroups,
    });

    if (strict) {
      const errors = validateSync(headers, {
        forbidNonWhitelisted: true,
        whitelist: true,
        stopAtFirstError: false,
        groups: validatorGroups,
      });

      if (errors.length > 0) {
        throw new Error(
          `Validation groups: ${validatorGroups}\n` +
            errors
              .map((err) => err.toString(undefined, undefined, undefined, true))
              .join('\n'),
        );
      }
    }

    return instanceToPlain(headers, {
      exposeUnsetFields: false,
      groups: transformerGroups,
    });
  }
}
