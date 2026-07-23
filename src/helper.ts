import { promisify } from 'util';

const fib = (n: number): number => (n <= 2 ? 1 : fib(n - 1) + fib(n - 2));

const fibP = (n: number): Promise<number> => {
  return new Promise((resolve) => {
    const chunk = (current: number): void => {
      if (current <= 2) {
        resolve(1);
        return;
      }
      setImmediate(() => {
        void Promise.all([fibP(current - 1), fibP(current - 2)]).then(
          ([a, b]) => resolve(a + b),
        );
      });
    };
    chunk(n);
  });
};

const sleep: (ms: number) => Promise<void> = promisify(setTimeout);

export { fib, fibP, sleep };
