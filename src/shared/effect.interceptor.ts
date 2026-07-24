import {
  BadRequestException,
  CallHandler,
  ExecutionContext,
  HttpException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { mergeMap } from 'rxjs/operators';
import { Cause, Effect, Exit, Option, ParseResult } from 'effect';

type AbortEmitter = {
  readonly aborted?: boolean;
  readonly destroyed?: boolean;
  once(event: string, listener: () => void): void;
  removeListener(event: string, listener: () => void): void;
};

/**
 * Bridges Nest's Observable response pipeline with the Effect runtime.
 * Nest sees an Effect as a plain value, so this interceptor runs it and turns
 * its success or failure back into signals Nest already understands.
 */
@Injectable()
export class EffectInterceptor implements NestInterceptor {
  private readonly logger = new Logger(EffectInterceptor.name);

  intercept(
    context: ExecutionContext,
    next: CallHandler<unknown>,
  ): Observable<unknown> {
    return next.handle().pipe(
      // A handler may emit more than once; mergeMap does not discard an
      // earlier Effect when a later value arrives.
      mergeMap((data) =>
        Effect.isEffect(data) ? this.runEffect(data, context) : of(data),
      ),
    );
  }

  private runEffect(
    effect: Effect.Effect<unknown, unknown, unknown>,
    context: ExecutionContext,
  ): Observable<unknown> {
    return new Observable((subscriber) => {
      // Effect accepts AbortSignal, which lets framework cancellation
      // interrupt the running fiber and execute its finalizers.
      const controller = new AbortController();
      const removeAbortListeners = this.bindRequestAbort(context, () =>
        controller.abort(),
      );

      // Unlike runPromise, runPromiseExit keeps typed failures, defects, and
      // interruption distinct inside Exit and Cause.
      // The runtime guard cannot recover R, so controller Effects must have
      // their environment fully provided before reaching this boundary.
      void Effect.runPromiseExit(
        effect as Effect.Effect<unknown, unknown, never>,
        { signal: controller.signal },
      ).then((exit) => {
        removeAbortListeners();

        if (subscriber.closed) {
          return;
        }
        if (Exit.isSuccess(exit)) {
          subscriber.next(exit.value);
          subscriber.complete();
        } else if (Cause.isInterruptedOnly(exit.cause)) {
          // Cancellation is normal lifecycle behavior, not an HTTP 500.
          subscriber.complete();
        } else {
          subscriber.error(this.mapCause(exit.cause));
        }
      });

      // RxJS teardown is another cancellation source, independent of HTTP.
      return () => {
        removeAbortListeners();
        controller.abort();
      };
    });
  }

  private mapCause(cause: Cause.Cause<unknown>): HttpException {
    // Defects represent unexpected bugs. Log their Cause, but do not expose
    // implementation details in the HTTP response.
    if (Cause.defects(cause).length > 0) {
      this.logger.error(Cause.pretty(cause));
      return new InternalServerErrorException();
    }

    // failureOption extracts an expected Effect.fail value from the Cause.
    const failure = Option.getOrUndefined(Cause.failureOption(cause));

    if (failure instanceof HttpException) {
      return failure;
    }
    if (ParseResult.isParseError(failure)) {
      return new BadRequestException({
        message: 'Validation failed',
        // ArrayFormatter produces field paths suitable for an API response.
        errors: ParseResult.ArrayFormatter.formatErrorSync(failure),
      });
    }

    this.logger.error(Cause.pretty(cause));
    return new InternalServerErrorException();
  }

  private bindRequestAbort(
    context: ExecutionContext,
    abort: () => void,
  ): () => void {
    if (context.getType() !== 'http') {
      return () => undefined;
    }

    const http = context.switchToHttp();
    const request = http.getRequest<AbortEmitter>();
    const response = http.getResponse<AbortEmitter>();

    // Both events mean the client can no longer consume the Effect result.
    request.once('aborted', abort);
    response.once('close', abort);

    if (request.aborted || response.destroyed) {
      abort();
    }

    return () => {
      request.removeListener('aborted', abort);
      response.removeListener('close', abort);
    };
  }
}
