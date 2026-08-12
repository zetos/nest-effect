import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';
import { Result, Schema, SchemaIssue } from 'effect';

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

    // Request input is unknown. Result keeps an expected validation failure as
    // data, while errors: 'all' reports every invalid field in one response.
    const result = Schema.decodeUnknownResult(metadata.metatype, {
      errors: 'all',
    })(value);

    if (Result.isSuccess(result)) {
      return result.success;
    }

    throw this.createValidationError(result.failure, metadata);
  }

  private isEffectSchema(
    metatype: unknown,
  ): metatype is Schema.ConstraintDecoder<unknown> {
    return Schema.isSchema(metatype);
  }

  private createValidationError(
    error: Schema.SchemaError,
    metadata: ArgumentMetadata,
  ): BadRequestException {
    const fieldName = this.getFieldName(metadata);

    return new BadRequestException({
      message: 'Validation failed',
      field: fieldName,
      type: metadata.type,
      errors: SchemaIssue.makeFormatterStandardSchemaV1()(error.issue).issues,
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
