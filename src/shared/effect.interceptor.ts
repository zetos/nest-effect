import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  HttpException,
  InternalServerErrorException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { Observable, from, of } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';
import { Effect } from 'effect';
import { ParseResult } from 'effect';

@Injectable()
export class EffectInterceptor implements NestInterceptor {
  intercept(
    _context: ExecutionContext,
    next: CallHandler<unknown>,
  ): Observable<unknown> {
    return next.handle().pipe(
      switchMap((data: unknown) => {
        // Check if the returned data is an Effect
        if (Effect.isEffect(data)) {
          // Run the effect and handle errors properly
          return from(
            Effect.runPromise(data as Effect.Effect<unknown, unknown>),
          ).pipe(
            catchError((error: unknown) => {
              throw this.mapEffectErrorToHttpException(error);
            }),
          );
        }
        // If it's not an Effect, return it directly without Promise wrapping
        return of(data);
      }),
    );
  }

  private mapEffectErrorToHttpException(error: unknown): HttpException {
    // Handle ParseResult errors from Effect Schema
    if (ParseResult.isParseError(error)) {
      return new BadRequestException({
        message: 'Validation failed',
        errors: ParseResult.TreeFormatter.formatErrorSync(error),
      });
    }

    // Handle null/undefined errors from Effect.fromNullable
    if (error === null || error === undefined) {
      return new NotFoundException('Resource not found');
    }

    // Handle standard Error objects
    if (error instanceof Error) {
      // You can extend this to map specific error types
      if (error.name === 'ValidationError') {
        return new BadRequestException(error.message);
      }
      if (error.name === 'NotFoundError') {
        return new NotFoundException(error.message);
      }
      return new InternalServerErrorException(error.message);
    }

    // Handle string errors
    if (typeof error === 'string') {
      return new InternalServerErrorException(error);
    }

    // Fallback for unknown error types
    return new InternalServerErrorException('An unexpected error occurred');
  }
}
