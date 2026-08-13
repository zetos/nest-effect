import { Console, Deferred, Effect, Fiber, Scope } from 'effect';

export const SHUTDOWN_MESSAGE =
  'Nest application scope closed successfully.';

interface NestServer {
  close(): Promise<void>;
  listen(port: number | string): Promise<unknown>;
}

interface SignalEmitter {
  on(event: 'SIGINT' | 'SIGTERM', listener: () => void): unknown;
  removeListener(event: 'SIGINT' | 'SIGTERM', listener: () => void): unknown;
}

export interface ServerDependencies {
  readonly createApp: () => Promise<NestServer>;
  readonly port: number | string;
  readonly shutdown: Effect.Effect<void, never, Scope.Scope>;
}

export const waitForShutdown = (
  emitter: SignalEmitter = process,
): Effect.Effect<void, never, Scope.Scope> =>
  Effect.gen(function* () {
    const shutdown = yield* Deferred.make<void>();
    const cleanup = () => {
      emitter.removeListener('SIGINT', onSignal);
      emitter.removeListener('SIGTERM', onSignal);
    };
    const onSignal = () => {
      Deferred.doneUnsafe(shutdown, Effect.void);
    };

    yield* Effect.acquireRelease(
      Effect.sync(() => {
        emitter.on('SIGINT', onSignal);
        emitter.on('SIGTERM', onSignal);
      }),
      () => Effect.sync(cleanup),
    );

    yield* Deferred.await(shutdown);
  });

export const makeServerProgram = ({
  createApp,
  port,
  shutdown,
}: ServerDependencies): Effect.Effect<void, unknown> =>
  Effect.scoped(
    Effect.gen(function* () {
      const shutdownFiber = yield* Effect.forkScoped(shutdown);
      yield* Effect.yieldNow;
      const app = yield* Effect.acquireRelease(
        Effect.tryPromise(createApp),
        (app) => Effect.promise(() => app.close()),
      );

      yield* Effect.tryPromise(() => app.listen(port));
      yield* Fiber.join(shutdownFiber);
    }),
  ).pipe(Effect.andThen(Console.log(SHUTDOWN_MESSAGE)));
