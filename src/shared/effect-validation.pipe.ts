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
          throw this.createValidationError(error, metadata);
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

  private createValidationError(
    error: ParseResult.ParseError,
    metadata: ArgumentMetadata,
  ): BadRequestException {
    const fieldName = this.getFieldName(metadata);
    const formattedErrors = ParseResult.TreeFormatter.formatErrorSync(error);

    return new BadRequestException({
      message: 'Validation failed',
      field: fieldName,
      type: metadata.type,
      errors: formattedErrors,
      details: this.extractValidationDetails(error),
    });
  }

  private getFieldName(metadata: ArgumentMetadata): string {
    // Get the parameter name from metadata
    if (metadata.data) {
      return metadata.data;
    }

    // Fallback based on type
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

  private extractValidationDetails(error: ParseResult.ParseError): unknown[] {
    // Extract specific validation issues for better debugging
    const issues: unknown[] = [];

    // Walk through the error tree to extract specific issues
    const collectIssues = (issue: ParseResult.ParseIssue): void => {
      if ('path' in issue && 'message' in issue) {
        issues.push({
          path: issue.path,
          message: issue.message,
        });
      }

      if ('issue' in issue) {
        collectIssues(issue.issue);
      }

      if ('issues' in issue && Array.isArray(issue.issues)) {
        issue.issues.forEach(collectIssues);
      }
    };

    collectIssues(error.issue);
    return issues;
  }
}
