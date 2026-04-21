import { useState, useCallback } from 'react';

type AsyncFn<T, A extends unknown[]> = (...args: A) => Promise<T>;

export function useApi<T, A extends unknown[]>(fn: AsyncFn<T, A>) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(
    async (...args: A): Promise<T | null> => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await fn(...args);
        setData(result);
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'An error occurred';
        setError(message);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [fn]
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return { data, isLoading, error, execute, reset };
}
