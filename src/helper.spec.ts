import { fib, fibP, sleep } from './helper';

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
