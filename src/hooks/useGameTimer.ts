/**
 * Hook for managing game timer intervals.
 * Handles starting, stopping, and pausing the game timer.
 */

import { useEffect, useRef } from 'react';

interface UseGameTimerOptions {
  isRunning: boolean;
  onTick: () => void;
}

/**
 * Manages game timer interval.
 * Timer runs when isRunning is true and calls onTick every second.
 */
export const useGameTimer = ({ isRunning, onTick }: UseGameTimerOptions): void => {
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // Clear any existing timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // Start timer if running
    if (isRunning) {
      timerRef.current = setInterval(onTick, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isRunning, onTick]);
};
