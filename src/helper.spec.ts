import { Effect } from 'effect';
import { fib, fibE, fibP, sleep } from './helper';

describe('helper', () => {
  describe('fib', () => {
    it('should return 1 for fib(1)', () => {
      expect(fib(1)).toBe(1);
    });

    it('should return 1 for fib(2)', () => {
      expect(fib(2)).toBe(1);
    });

    it('should return 2 for fib(3)', () => {
      expect(fib(3)).toBe(2);
    });

    it('should return 5 for fib(5)', () => {
      expect(fib(5)).toBe(5);
    });

    it('should return 55 for fib(10)', () => {
      expect(fib(10)).toBe(55);
    });
  });

  describe('fibP', () => {
    it('should return a Promise', () => {
      const result = fibP(1);
      expect(result).toBeInstanceOf(Promise);
    });

    it('should resolve to 1 for fibP(1)', async () => {
      await expect(fibP(1)).resolves.toBe(1);
    });

    it('should resolve to 1 for fibP(2)', async () => {
      await expect(fibP(2)).resolves.toBe(1);
    });

    it('should resolve to 5 for fibP(5)', async () => {
      await expect(fibP(5)).resolves.toBe(5);
    });

    it('should resolve to 55 for fibP(10)', async () => {
      await expect(fibP(10)).resolves.toBe(55);
    });

    it('should match synchronous fib results', async () => {
      const inputs = [1, 2, 3, 5, 10, 15];
      for (const n of inputs) {
        const syncResult = fib(n);
        const asyncResult = await fibP(n);
        expect(asyncResult).toBe(syncResult);
      }
    });

    it('should return fibP(44) without exhausting resources', async () => {
      await expect(fibP(44)).resolves.toBe(701408733);
    });

    it('should yield to the event loop during large calculations', async () => {
      let completed = false;
      const calculation = fibP(10_000).then((result) => {
        completed = true;
        return result;
      });

      await new Promise<void>((resolve) => setImmediate(resolve));

      expect(completed).toBe(false);
      await expect(calculation).resolves.toBe(Number.POSITIVE_INFINITY);
    });
  });

  describe('fibE', () => {
    it('should return an Effect', () => {
      expect(Effect.isEffect(fibE(1))).toBe(true);
    });

    it('should match synchronous fib results', async () => {
      const inputs = [1, 2, 3, 5, 10, 15];
      for (const n of inputs) {
        const syncResult = fib(n);
        const effectResult = await Effect.runPromise(fibE(n));
        expect(effectResult).toBe(syncResult);
      }
    });

    it('should return fibE(44) without blocking recursively', async () => {
      await expect(Effect.runPromise(fibE(44))).resolves.toBe(701408733);
    });

    it('should cooperatively yield during large calculations', async () => {
      let completed = false;
      let observedBeforeCompletion = false;

      await Effect.runPromise(
        Effect.all(
          [
            fibE(10_000).pipe(
              Effect.tap(() =>
                Effect.sync(() => {
                  completed = true;
                }),
              ),
            ),
            Effect.sync(() => {
              observedBeforeCompletion = !completed;
            }),
          ],
          { concurrency: 'unbounded' },
        ),
      );

      expect(observedBeforeCompletion).toBe(true);
    });
  });

  describe('sleep', () => {
    it('should resolve after specified delay', async () => {
      const start = Date.now();
      await sleep(50);
      const elapsed = Date.now() - start;
      expect(elapsed).toBeGreaterThanOrEqual(40);
      expect(elapsed).toBeLessThan(150);
    });

    it('should resolve to void', async () => {
      const result = await sleep(10);
      expect(result).toBeUndefined();
    });
  });
});
