import {
  BadRequestException,
  CallHandler,
  ExecutionContext,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { jest } from '@jest/globals';
import { EventEmitter } from 'node:events';
import { firstValueFrom, of } from 'rxjs';
import { Effect, Schema } from 'effect';
import { EffectInterceptor } from './effect.interceptor';

// EventEmitter models the request lifecycle events used by the interceptor;
// the remaining ExecutionContext methods are irrelevant to these unit tests.
const makeContext = () => {
  const request = new EventEmitter();
  const response = new EventEmitter();
  const context = {
    getType: () => 'http',
    switchToHttp: () => ({
      getRequest: () => request,
      getResponse: () => response,
      getNext: () => undefined,
    }),
  } as unknown as ExecutionContext;

  return { context, request };
};

const makeHandler = (value: unknown): CallHandler<unknown> => ({
  handle: () => of(value),
});

describe('EffectInterceptor', () => {
  const interceptor = new EffectInterceptor();

  afterEach(() => jest.restoreAllMocks());

  it('runs Effects and passes through plain values', async () => {
    const { context } = makeContext();

    await expect(
      firstValueFrom(
        interceptor.intercept(context, makeHandler(Effect.succeed('effect'))),
      ),
    ).resolves.toBe('effect');
    await expect(
      firstValueFrom(interceptor.intercept(context, makeHandler('plain'))),
    ).resolves.toBe('plain');
  });

  it('preserves HttpExceptions from the error channel', async () => {
    const { context } = makeContext();
    const error = new NotFoundException('Missing');

    await expect(
      firstValueFrom(
        interceptor.intercept(context, makeHandler(Effect.fail(error))),
      ),
    ).rejects.toBe(error);
  });

  it('maps schema failures without exposing FiberFailure', async () => {
    const { context } = makeContext();
    const effect = Schema.decodeUnknownEffect(Schema.Finite)('not a number');

    await expect(
      firstValueFrom(interceptor.intercept(context, makeHandler(effect))),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('hides defects behind a generic server error', async () => {
    const { context } = makeContext();
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);

    await expect(
      firstValueFrom(
        interceptor.intercept(
          context,
          makeHandler(Effect.die(new Error('private detail'))),
        ),
      ),
    ).rejects.toMatchObject({
      response: {
        message: 'Internal Server Error',
      },
    });
  });

  it('interrupts the Effect when the request is aborted', async () => {
    const { context, request } = makeContext();
    let start: () => void = () => undefined;
    let interrupted: () => void = () => undefined;
    const started = new Promise<void>((resolve) => (start = resolve));
    const wasInterrupted = new Promise<void>(
      (resolve) => (interrupted = resolve),
    );
    // Effect.never keeps the fiber alive; onInterrupt proves cancellation
    // reached the Effect runtime instead of only closing the Observable.
    const effect = Effect.sync(start).pipe(
      Effect.andThen(Effect.never),
      Effect.onInterrupt(() => Effect.sync(interrupted)),
    );

    interceptor.intercept(context, makeHandler(effect)).subscribe();
    await started;
    request.emit('aborted');

    await expect(wasInterrupted).resolves.toBeUndefined();
  });

  it('interrupts the Effect when RxJS unsubscribes', async () => {
    const { context } = makeContext();
    let start: () => void = () => undefined;
    let interrupted: () => void = () => undefined;
    const started = new Promise<void>((resolve) => (start = resolve));
    const wasInterrupted = new Promise<void>(
      (resolve) => (interrupted = resolve),
    );
    const effect = Effect.sync(start).pipe(
      Effect.andThen(Effect.never),
      Effect.onInterrupt(() => Effect.sync(interrupted)),
    );

    const subscription = interceptor
      .intercept(context, makeHandler(effect))
      .subscribe();
    await started;
    subscription.unsubscribe();

    await expect(wasInterrupted).resolves.toBeUndefined();
  });
});
