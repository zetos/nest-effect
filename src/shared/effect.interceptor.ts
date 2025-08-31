import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, from } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { Effect } from 'effect';

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
          // Run the effect and return the result as an Observable
          return from(Effect.runPromise(data as Effect.Effect<unknown, never>));
        }
        // If it's not an Effect, return it as is
        return from(Promise.resolve(data));
      }),
    );
  }
}
