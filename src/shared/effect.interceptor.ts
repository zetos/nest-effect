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
import { Cause, Effect, Exit, Option, Schema, SchemaIssue } from 'effect';

type AbortEmitter = {
  readonly aborted?: boolean;
  readonly destroyed?: boolean;
  once(event: string, listener: () => void): void;
  removeListener(event: string, listener: () => void): void;
};

const isRunnableEffect = (
  value: unknown,
): value is Effect.Effect<unknown, unknown> => Effect.isEffect(value);

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
        isRunnableEffect(data) ? this.runEffect(data, context) : of(data),
      ),
    );
  }

  private runEffect(
    effect: Effect.Effect<unknown, unknown>,
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
      void Effect.runPromiseExit(effect, { signal: controller.signal }).then(
        (exit) => {
          removeAbortListeners();

          if (subscriber.closed) {
            return;
          }
          if (Exit.isSuccess(exit)) {
            subscriber.next(exit.value);
            subscriber.complete();
          } else if (Cause.hasInterruptsOnly(exit.cause)) {
            // Cancellation is normal lifecycle behavior, not an HTTP 500.
            subscriber.complete();
          } else {
            subscriber.error(this.mapCause(exit.cause));
          }
        },
      );

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
    if (Cause.hasDies(cause)) {
      this.logger.error(Cause.pretty(cause));
      return new InternalServerErrorException();
    }

    const failure = Option.getOrUndefined(Cause.findErrorOption(cause));

    if (failure instanceof HttpException) {
      return failure;
    }
    if (Schema.isSchemaError(failure)) {
      return new BadRequestException({
        message: 'Validation failed',
        errors: SchemaIssue.makeFormatterStandardSchemaV1()(failure.issue)
          .issues,
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
