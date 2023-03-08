import { instanceToPlain, plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';

import { HeadersProps, UserscriptPluginInstance } from '../../types';
import { Feature } from '../feature';
import { Headers } from './headers';

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

    hooks.headers.tap(this.name, (headersProps) =>
      this.validateHeaders(headersProps, HeadersClass, this.options),
    );

    if (this.options.proxyScript) {
      hooks.proxyHeaders.tap(this.name, (headersProps) =>
        this.validateHeaders(headersProps, HeadersClass, this.options),
      );
    }
  }

  private validateHeaders(
    headersProps: HeadersProps,
    HeadersClass: HeaderClass,
    { whitelist, strict }: HeadersValidatorOptions = {},
  ): HeadersProps {
    const headers = plainToInstance(HeadersClass, headersProps, {
      exposeDefaultValues: true,
      excludeExtraneousValues: whitelist,
    });

    if (strict) {
      const errors = validateSync(headers, {
        forbidNonWhitelisted: true,
        whitelist: true,
        stopAtFirstError: false,
      });

      if (errors.length > 0) {
        throw new Error(errors.map((err) => err.toString()).join('\n'));
      }
    }

    return instanceToPlain(headers, { exposeUnsetFields: false });
  }
}
