import {
  ArgumentMetadata,
  Injectable,
  PipeTransform,
  BadRequestException,
} from '@nestjs/common';
import { Schema } from 'effect';
import { ParseResult } from 'effect';

@Injectable()
export class EffectValidationPipe implements PipeTransform {
  transform(value: unknown, metadata: ArgumentMetadata): unknown {
    // metadata.metatype is equal to the type given to the @Body() or @Param
    // param properties
    if (metadata.metatype && this.isEffectSchema(metadata.metatype)) {
      // Use Effect Schema decode to validate and transform the value
      try {
        return Schema.decodeUnknownSync(metadata.metatype)(value);
      } catch (error) {
        if (ParseResult.isParseError(error)) {
          throw new BadRequestException(
            `Validation failed: ${ParseResult.TreeFormatter.formatErrorSync(error)}`,
          );
        }
        throw error;
      }
    }

    return value;
  }

  private isEffectSchema(
    metatype: unknown,
  ): metatype is Schema.Schema<unknown, unknown> {
    return Schema.isSchema(metatype);
  }
}
