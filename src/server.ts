import { Cause, Effect } from 'effect';
import { nestLog } from './helper';

export const SHUTDOWN_MESSAGE = 'Nest application scope closed successfully.';

const toUnknownError = (cause: unknown): Cause.UnknownError =>
  new Cause.UnknownError(cause);

interface NestServer {
  close(): Promise<void>;
  listen(port: number | string): Promise<unknown>;
}

export interface ServerDependencies {
  readonly createApp: () => Promise<NestServer>;
  readonly port: number | string;
}

export const makeServerProgram = ({
  createApp,
  port,
}: ServerDependencies): Effect.Effect<never, Cause.UnknownError> =>
  Effect.acquireUseRelease(
    // Acquisition is uninterruptible, so a created app always reaches release.
    Effect.tryPromise({ try: createApp, catch: toUnknownError }),
    (app) =>
      Effect.tryPromise({
        try: () => app.listen(port),
        catch: toUnknownError,
      }).pipe(
        // NodeRuntime interrupts this fiber when the process receives a signal.
        Effect.andThen(Effect.never),
      ),
    // Release is also uninterruptible and runs on success, failure, or interruption.
    (app) =>
      Effect.tryPromise({ try: () => app.close(), catch: toUnknownError }).pipe(
        Effect.andThen(nestLog(SHUTDOWN_MESSAGE)),
      ),
  );
