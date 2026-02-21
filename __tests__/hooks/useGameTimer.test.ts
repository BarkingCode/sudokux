/**
 * Tests for src/hooks/useGameTimer.ts
 * Game timer interval management.
 */

import { renderHook } from '@testing-library/react-native';
import { useGameTimer } from '../../src/hooks/useGameTimer';

describe('useGameTimer', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // ============ Start/Stop ============

  it('should call onTick every second when running', () => {
    const onTick = jest.fn();
    renderHook(() => useGameTimer({ isRunning: true, onTick }));

    jest.advanceTimersByTime(3000);
    expect(onTick).toHaveBeenCalledTimes(3);
  });

  it('should not call onTick when not running', () => {
    const onTick = jest.fn();
    renderHook(() => useGameTimer({ isRunning: false, onTick }));

    jest.advanceTimersByTime(3000);
    expect(onTick).not.toHaveBeenCalled();
  });

  // ============ Pause/Resume ============

  it('should stop ticking when isRunning changes to false', () => {
    const onTick = jest.fn();
    const { rerender } = renderHook(
      ({ isRunning }) => useGameTimer({ isRunning, onTick }),
      { initialProps: { isRunning: true } }
    );

    jest.advanceTimersByTime(2000);
    expect(onTick).toHaveBeenCalledTimes(2);

    rerender({ isRunning: false });
    jest.advanceTimersByTime(3000);
    expect(onTick).toHaveBeenCalledTimes(2); // no additional calls
  });

  it('should resume ticking when isRunning changes back to true', () => {
    const onTick = jest.fn();
    const { rerender } = renderHook(
      ({ isRunning }) => useGameTimer({ isRunning, onTick }),
      { initialProps: { isRunning: false } }
    );

    rerender({ isRunning: true });
    jest.advanceTimersByTime(2000);
    expect(onTick).toHaveBeenCalledTimes(2);
  });

  // ============ Cleanup ============

  it('should clear interval on unmount', () => {
    const onTick = jest.fn();
    const { unmount } = renderHook(() => useGameTimer({ isRunning: true, onTick }));

    jest.advanceTimersByTime(1000);
    expect(onTick).toHaveBeenCalledTimes(1);

    unmount();
    jest.advanceTimersByTime(3000);
    expect(onTick).toHaveBeenCalledTimes(1); // no more calls
  });
});
