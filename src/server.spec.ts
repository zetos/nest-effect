import { jest } from '@jest/globals';
import { Effect } from 'effect';
import { makeServerProgram, SHUTDOWN_MESSAGE } from './server';

describe('server lifecycle', () => {
  afterEach(() => jest.restoreAllMocks());

  it('closes the application when the server fiber is interrupted', async () => {
    const events: string[] = [];
    let listening!: () => void;
    const started = new Promise<void>((resolve) => {
      listening = resolve;
    });
    const app = {
      listen: jest.fn(async () => {
        events.push('listen');
        listening();
      }),
      close: jest.fn(async () => {
        events.push('close');
      }),
    };
    jest.spyOn(console, 'log').mockImplementation((message) => {
      events.push(String(message));
    });
    const controller = new AbortController();
    const server = Effect.runPromise(
      makeServerProgram({ createApp: async () => app, port: 3000 }),
      { signal: controller.signal },
    );

    await started;
    controller.abort();
    await expect(server).rejects.toThrow();

    expect(app.listen).toHaveBeenCalledWith(3000);
    expect(app.close).toHaveBeenCalledTimes(1);
    expect(events).toEqual(['listen', 'close', SHUTDOWN_MESSAGE]);
  });

  it('does not report success when closing the application fails', async () => {
    const closeError = new Error('close failed');
    const app = {
      listen: jest.fn(async () => undefined),
      close: jest.fn(async () => Promise.reject(closeError)),
    };
    const consoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});
    const controller = new AbortController();
    const server = Effect.runPromise(
      makeServerProgram({ createApp: async () => app, port: 3000 }),
      { signal: controller.signal },
    );

    await Promise.resolve();
    controller.abort();
    await expect(server).rejects.toThrow();

    expect(app.close).toHaveBeenCalledTimes(1);
    expect(consoleLog).not.toHaveBeenCalledWith(SHUTDOWN_MESSAGE);
  });
});
