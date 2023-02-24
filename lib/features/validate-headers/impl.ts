import { instanceToPlain, plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';

import { HeadersProps, UserscriptPluginInstance } from '../../types';
import { Feature } from '../feature';
import { Headers } from './headers';

export interface HeadersValidatorOptions {
  whitelist?: boolean;
}

export type HeaderClass = { new (): Headers };

export interface ValidateHeadersOptions extends HeadersValidatorOptions {
  strict?: boolean;
  proxyScript?: unknown;
  headersClass?: HeaderClass;
}

export class ValidateHeaders extends Feature<ValidateHeadersOptions> {
  public readonly name = 'ValidateHeaders';

  public apply({ hooks }: UserscriptPluginInstance): void {
    const HeadersClass = this.options.headersClass ?? Headers;

    if (this.options.strict) {
      hooks.headers.tap(this.name, (headersProps) =>
        this.validateHeaders(headersProps, HeadersClass, this.options),
      );

      if (this.options.proxyScript) {
        hooks.proxyHeaders.tap(this.name, (headersProps) =>
          this.validateHeaders(headersProps, HeadersClass, this.options),
        );
      }
    }
  }

  private validateHeaders(
    headersProps: HeadersProps,
    HeadersClass: HeaderClass,
    { whitelist }: HeadersValidatorOptions = {},
  ): HeadersProps {
    const headers = plainToInstance(HeadersClass, headersProps, {
      exposeDefaultValues: true,
      excludeExtraneousValues: this.options.whitelist,
    });

    const errors = validateSync(headers, {
      forbidNonWhitelisted: whitelist,
      whitelist,
      stopAtFirstError: false,
    });

    if (errors.length > 0) {
      throw new Error(errors.map((err) => err.toString()).join('\n'));
    }

    return instanceToPlain(headers, { exposeUnsetFields: false });
  }
}
