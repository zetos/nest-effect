import { jest } from '@jest/globals';
import { EventEmitter } from 'node:events';
import { Effect } from 'effect';
import {
  makeServerProgram,
  SHUTDOWN_MESSAGE,
  waitForShutdown,
} from './server';

describe('server lifecycle', () => {
  afterEach(() => jest.restoreAllMocks());

  it('closes the application before reporting a successful scope close', async () => {
    const events: string[] = [];
    const app = {
      listen: jest.fn(async () => {
        events.push('listen');
      }),
      close: jest.fn(async () => {
        events.push('close');
      }),
    };
    jest.spyOn(console, 'log').mockImplementation((message) => {
      events.push(String(message));
    });

    await Effect.runPromise(
      makeServerProgram({
        createApp: async () => app,
        port: 3000,
        shutdown: Effect.void,
      }),
    );

    expect(app.listen).toHaveBeenCalledWith(3000);
    expect(app.close).toHaveBeenCalledTimes(1);
    expect(events).toEqual(['listen', 'close', SHUTDOWN_MESSAGE]);
  });

  it('starts monitoring for shutdown before creating the application', async () => {
    const events: string[] = [];
    const app = {
      listen: jest.fn(async () => {
        events.push('listen');
      }),
      close: jest.fn(async () => {
        events.push('close');
      }),
    };
    jest.spyOn(console, 'log').mockImplementation(() => {});

    await Effect.runPromise(
      makeServerProgram({
        createApp: async () => {
          events.push('create');
          return app;
        },
        port: 3000,
        shutdown: Effect.sync(() => {
          events.push('shutdown-ready');
        }),
      }),
    );

    expect(events).toEqual(['shutdown-ready', 'create', 'listen', 'close']);
  });

  it('does not report success when closing the application fails', async () => {
    const closeError = new Error('close failed');
    const app = {
      listen: jest.fn(async () => undefined),
      close: jest.fn(async () => Promise.reject(closeError)),
    };
    const consoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});

    await expect(
      Effect.runPromise(
        makeServerProgram({
          createApp: async () => app,
          port: 3000,
          shutdown: Effect.void,
        }),
      ),
    ).rejects.toThrow();

    expect(consoleLog).not.toHaveBeenCalledWith(SHUTDOWN_MESSAGE);
  });

  it('keeps signal listeners until the shutdown scope closes', async () => {
    const emitter = new EventEmitter();
    let releaseScope: (() => void) | undefined;
    const keepScopeOpen = Effect.callback<void>((resume) => {
      releaseScope = () => resume(Effect.void);
    });
    const shutdown = Effect.runPromise(
      Effect.scoped(
        Effect.gen(function* () {
          yield* waitForShutdown(emitter);
          yield* keepScopeOpen;
        }),
      ),
    );

    expect(emitter.listenerCount('SIGINT')).toBe(1);
    expect(emitter.listenerCount('SIGTERM')).toBe(1);

    emitter.emit('SIGTERM');
    await Effect.runPromise(Effect.yieldNow);

    expect(emitter.listenerCount('SIGINT')).toBe(1);
    expect(emitter.listenerCount('SIGTERM')).toBe(1);

    releaseScope?.();
    await shutdown;

    expect(emitter.listenerCount('SIGINT')).toBe(0);
    expect(emitter.listenerCount('SIGTERM')).toBe(0);
  });

  it('removes signal listeners when shutdown waiting is interrupted', async () => {
    const emitter = new EventEmitter();
    const controller = new AbortController();
    const shutdown = Effect.runPromise(
      Effect.scoped(waitForShutdown(emitter)),
      {
        signal: controller.signal,
      },
    );

    controller.abort();
    await expect(shutdown).rejects.toThrow();

    expect(emitter.listenerCount('SIGINT')).toBe(0);
    expect(emitter.listenerCount('SIGTERM')).toBe(0);
  });
});
