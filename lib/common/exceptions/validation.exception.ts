import { Type, ValidationError } from '@nestjs/common';

export class ValidationException {
  public readonly name = 'Validation';
  public readonly message: string;

  public constructor(target: Type, ...errors: ValidationError[]) {
    this.message = [
      `Failed to validate class ${target.name}:`,
      '',
      ...this.collectMessagesFromValidation(errors).map((msg) =>
        msg.replace(/^/, '- '),
      ),
    ].join('\n');
  }

  private collectMessagesFromValidation(
    errors: ValidationError[],
    cache?: string[],
    targetPropertyName?: string,
  ): string[] {
    cache ??= [];

    for (const error of errors) {
      cache.push(
        ...Object.keys(error.constraints ?? {})
          .map((key) => (error.constraints as Record<string, string>)[key])
          .map((value) =>
            targetPropertyName ? targetPropertyName.concat('.', value) : value,
          ),
      );

      if (error.children?.length) {
        this.collectMessagesFromValidation(
          error.children,
          cache,
          targetPropertyName
            ? targetPropertyName.concat('.', error.property)
            : error.property,
        );
      }
    }

    return cache;
  }
}
