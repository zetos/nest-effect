import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';
import { Either, ParseResult, Schema } from 'effect';

/**
 * Uses Effect Schema classes as Nest DTOs. Nest exposes a parameter's runtime
 * class through metatype, which lets the pipe find and decode Schema.Class DTOs.
 */
@Injectable()
export class EffectValidationPipe implements PipeTransform {
  transform(value: unknown, metadata: ArgumentMetadata): unknown {
    if (!metadata.metatype || !this.isEffectSchema(metadata.metatype)) {
      return value;
    }

    // Request input is unknown. Either keeps an expected validation failure as
    // data, while errors: 'all' reports every invalid field in one response.
    const result = Schema.decodeUnknownEither(metadata.metatype, {
      errors: 'all',
    })(value);

    if (Either.isRight(result)) {
      return result.right;
    }

    throw this.createValidationError(result.left, metadata);
  }

  private isEffectSchema(
    metatype: unknown,
  ): metatype is Schema.Schema<unknown, unknown> {
    return Schema.isSchema(metatype);
  }

  private createValidationError(
    error: ParseResult.ParseError,
    metadata: ArgumentMetadata,
  ): BadRequestException {
    const fieldName = this.getFieldName(metadata);

    return new BadRequestException({
      message: 'Validation failed',
      field: fieldName,
      type: metadata.type,
      // ArrayFormatter flattens ParseIssue trees into path/message entries.
      errors: ParseResult.ArrayFormatter.formatErrorSync(error),
    });
  }

  private getFieldName(metadata: ArgumentMetadata): string {
    if (metadata.data) {
      return metadata.data;
    }

    switch (metadata.type) {
      case 'body':
        return 'request body';
      case 'param':
        return 'path parameter';
      case 'query':
        return 'query parameter';
      default:
        return 'input';
    }
  }
}
