import { useCallback, useState } from 'react';

export interface AsyncState<T> {
  data?: T;
  error?: string;
  loading: boolean;
}

export function useAsync<T>() {
  const [state, setState] = useState<AsyncState<T>>({ loading: false });

  const run = useCallback(async (operation: () => Promise<T>) => {
    setState({ loading: true });
    try {
      const data = await operation();
      setState({ data, loading: false });
      return data;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Something went wrong';
      setState({ error: message, loading: false });
      throw error;
    }
  }, []);

  return { ...state, run, setState };
}
