/**
 * Hook for managing network request state with error handling.
 * Provides loading, error, and data states with retry functionality.
 */

import { useState, useCallback } from 'react';

interface NetworkState<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
  isOffline: boolean;
}

interface UseNetworkStateReturn<T> extends NetworkState<T> {
  execute: (fetcher: () => Promise<T>) => Promise<T | null>;
  retry: () => Promise<T | null>;
  reset: () => void;
  setData: (data: T) => void;
}

export function useNetworkState<T>(initialData: T | null = null): UseNetworkStateReturn<T> {
  const [state, setState] = useState<NetworkState<T>>({
    data: initialData,
    isLoading: false,
    error: null,
    isOffline: false,
  });

  const [lastFetcher, setLastFetcher] = useState<(() => Promise<T>) | null>(null);

  const execute = useCallback(async (fetcher: () => Promise<T>): Promise<T | null> => {
    setLastFetcher(() => fetcher);
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const data = await fetcher();
      setState({ data, isLoading: false, error: null, isOffline: false });
      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      const isOffline = errorMessage.includes('network') ||
                       errorMessage.includes('Network') ||
                       errorMessage.includes('Failed to fetch') ||
                       errorMessage.includes('offline');

      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
        isOffline,
      }));
      return null;
    }
  }, []);

  const retry = useCallback(async (): Promise<T | null> => {
    if (lastFetcher) {
      return execute(lastFetcher);
    }
    return null;
  }, [lastFetcher, execute]);

  const reset = useCallback(() => {
    setState({
      data: initialData,
      isLoading: false,
      error: null,
      isOffline: false,
    });
    setLastFetcher(null);
  }, [initialData]);

  const setData = useCallback((data: T) => {
    setState((prev) => ({ ...prev, data }));
  }, []);

  return {
    ...state,
    execute,
    retry,
    reset,
    setData,
  };
}
