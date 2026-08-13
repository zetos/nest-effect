import { Logger } from '@nestjs/common';
import { promisify } from 'util';
import { Effect } from 'effect';

const FIB_CHUNK_SIZE = 1_000;

type FibState = Readonly<{
  previous: number;
  current: number;
  index: number;
}>;

const initialFibState: FibState = {
  previous: 1,
  current: 1,
  index: 3,
};

const advanceFib = (n: number, state: FibState): FibState =>
  Array.from({
    length: Math.min(FIB_CHUNK_SIZE, n - state.index + 1),
  }).reduce<FibState>(
    ({ previous, current, index }) => ({
      previous: current,
      current: previous + current,
      index: index + 1,
    }),
    state,
  );

const fib = (n: number): number => (n <= 2 ? 1 : fib(n - 1) + fib(n - 2));

const yieldToEventLoop = Effect.callback<void>((resume) => {
  setImmediate(() => resume(Effect.void));
});

const runFibP = (n: number, state: FibState): Promise<number> => {
  const nextState = advanceFib(n, state);

  return nextState.index > n
    ? Promise.resolve(nextState.current)
    : Effect.runPromise(yieldToEventLoop).then(() => runFibP(n, nextState));
};

const fibP = (n: number): Promise<number> =>
  n <= 2
    ? Promise.resolve(1)
    : Effect.runPromise(yieldToEventLoop).then(() =>
        runFibP(n, initialFibState),
      );

const runFibE = (n: number, state: FibState): Effect.Effect<number> =>
  Effect.suspend(() => {
    const nextState = advanceFib(n, state);

    return nextState.index > n
      ? Effect.succeed(nextState.current)
      : Effect.yieldNow.pipe(Effect.flatMap(() => runFibE(n, nextState)));
  });

const fibE = (n: number): Effect.Effect<number> =>
  n <= 2
    ? Effect.succeed(1)
    : Effect.yieldNow.pipe(Effect.flatMap(() => runFibE(n, initialFibState)));

const sleep: (ms: number) => Promise<void> = promisify(setTimeout);

const nestLog = (message: unknown): Effect.Effect<void> =>
  Effect.sync(() => Logger.log(message));

export { fib, fibE, fibP, nestLog, sleep };
