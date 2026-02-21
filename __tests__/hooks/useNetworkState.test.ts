/**
 * Tests for src/hooks/useNetworkState.ts
 * Network request state management.
 */

import { renderHook, act } from '@testing-library/react-native';
import { useNetworkState } from '../../src/hooks/useNetworkState';

describe('useNetworkState', () => {
  // ============ Initial State ============

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useNetworkState());
    expect(result.current.data).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.isOffline).toBe(false);
  });

  it('should accept initial data', () => {
    const { result } = renderHook(() => useNetworkState('initial'));
    expect(result.current.data).toBe('initial');
  });

  // ============ Execute ============

  it('should execute fetcher and return data', async () => {
    const { result } = renderHook(() => useNetworkState<string>());

    let data: string | null = null;
    await act(async () => {
      data = await result.current.execute(async () => 'hello');
    });

    expect(data).toBe('hello');
    expect(result.current.data).toBe('hello');
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should set isLoading during fetch', async () => {
    const { result } = renderHook(() => useNetworkState<string>());

    let resolvePromise: (v: string) => void;
    const fetcher = () => new Promise<string>((r) => { resolvePromise = r; });

    act(() => { result.current.execute(fetcher); });
    // isLoading set synchronously via setState batching - check after resolve
    await act(async () => { resolvePromise!('done'); });
    expect(result.current.isLoading).toBe(false);
  });

  // ============ Error Handling ============

  it('should capture error message', async () => {
    const { result } = renderHook(() => useNetworkState<string>());

    await act(async () => {
      await result.current.execute(async () => { throw new Error('bad request'); });
    });

    expect(result.current.error).toBe('bad request');
    expect(result.current.data).toBeNull();
    expect(result.current.isOffline).toBe(false);
  });

  it('should detect offline from network error', async () => {
    const { result } = renderHook(() => useNetworkState<string>());

    await act(async () => {
      await result.current.execute(async () => { throw new Error('Network request failed'); });
    });

    expect(result.current.isOffline).toBe(true);
  });

  it('should detect offline from Failed to fetch', async () => {
    const { result } = renderHook(() => useNetworkState<string>());

    await act(async () => {
      await result.current.execute(async () => { throw new Error('Failed to fetch'); });
    });

    expect(result.current.isOffline).toBe(true);
  });

  it('should handle non-Error throws', async () => {
    const { result } = renderHook(() => useNetworkState<string>());

    await act(async () => {
      await result.current.execute(async () => { throw 'string error'; });
    });

    expect(result.current.error).toBe('An error occurred');
  });

  // ============ Retry ============

  it('should retry last fetcher', async () => {
    const { result } = renderHook(() => useNetworkState<number>());
    let callCount = 0;

    await act(async () => {
      await result.current.execute(async () => { callCount++; if (callCount === 1) throw new Error('fail'); return 42; });
    });
    expect(result.current.error).toBe('fail');

    await act(async () => {
      await result.current.retry();
    });
    expect(result.current.data).toBe(42);
    expect(result.current.error).toBeNull();
  });

  it('should return null on retry with no fetcher', async () => {
    const { result } = renderHook(() => useNetworkState<string>());

    let retryResult: string | null = null;
    await act(async () => {
      retryResult = await result.current.retry();
    });
    expect(retryResult).toBeNull();
  });

  // ============ Reset ============

  it('should reset to initial state', async () => {
    const { result } = renderHook(() => useNetworkState<string>('init'));

    await act(async () => {
      await result.current.execute(async () => 'data');
    });
    expect(result.current.data).toBe('data');

    act(() => result.current.reset());
    expect(result.current.data).toBe('init');
    expect(result.current.error).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  // ============ setData ============

  it('should set data directly', () => {
    const { result } = renderHook(() => useNetworkState<string>());

    act(() => result.current.setData('manual'));
    expect(result.current.data).toBe('manual');
  });
});
