/**
 * Hook for managing ad session state.
 * Handles game limits, daily reset, and session persistence.
 */

import { useCallback, useEffect, useState } from 'react';
import { loadData, saveData } from '../utils/storage';
import { GAMES_PER_SESSION, GAMES_PER_REWARD, CHAPTERS_INTERSTITIAL_FREQUENCY } from '../config/ads';

const STORAGE_KEY_SESSION = 'sudoku_ad_session';

export interface AdSession {
  gamesPlayedToday: number;
  gamesRemaining: number;
  lastResetDate: string; // ISO date string (YYYY-MM-DD)
  puzzlesSinceLastAd: number;
}

export interface UseAdSessionReturn {
  session: AdSession;
  isAtLimit: boolean;
  consumeGame: () => boolean;
  addGames: (count: number) => void;
  incrementPuzzleCount: () => number;
  resetPuzzleCount: () => void;
  shouldShowInterstitial: () => boolean;
}

const getTodayDateString = (): string => {
  return new Date().toISOString().split('T')[0];
};

const createInitialSession = (): AdSession => ({
  gamesPlayedToday: 0,
  gamesRemaining: GAMES_PER_SESSION,
  lastResetDate: getTodayDateString(),
  puzzlesSinceLastAd: 0,
});

/**
 * Manages ad session state with persistence.
 * Handles daily reset and game limits.
 */
export const useAdSession = (isAdFree: boolean): UseAdSessionReturn => {
  const [session, setSession] = useState<AdSession>(createInitialSession());

  // Load session on mount
  useEffect(() => {
    loadData<AdSession>(STORAGE_KEY_SESSION).then((saved) => {
      if (saved) {
        // Check if we need to reset for a new day
        const today = getTodayDateString();
        if (saved.lastResetDate !== today) {
          const newSession = createInitialSession();
          setSession(newSession);
          saveData(STORAGE_KEY_SESSION, newSession);
        } else {
          setSession(saved);
        }
      }
    });
  }, []);

  // Save session when it changes
  useEffect(() => {
    saveData(STORAGE_KEY_SESSION, session);
  }, [session]);

  // Consume a game (returns true if allowed to play)
  const consumeGame = useCallback((): boolean => {
    if (isAdFree) return true;

    // Check for daily reset
    const today = getTodayDateString();
    if (session.lastResetDate !== today) {
      const newSession = createInitialSession();
      newSession.gamesRemaining = GAMES_PER_SESSION - 1;
      setSession(newSession);
      return true;
    }

    if (session.gamesRemaining <= 0) {
      return false;
    }

    setSession((prev) => ({
      ...prev,
      gamesPlayedToday: prev.gamesPlayedToday + 1,
      gamesRemaining: prev.gamesRemaining - 1,
    }));

    return true;
  }, [session, isAdFree]);

  // Add games (after watching rewarded ad)
  const addGames = useCallback((count: number = GAMES_PER_REWARD) => {
    setSession((prev) => ({
      ...prev,
      gamesRemaining: prev.gamesRemaining + count,
    }));
  }, []);

  // Increment puzzle count and return new value
  const incrementPuzzleCount = useCallback((): number => {
    let newCount = 0;
    setSession((prev) => {
      newCount = prev.puzzlesSinceLastAd + 1;
      return {
        ...prev,
        puzzlesSinceLastAd: newCount,
      };
    });
    return session.puzzlesSinceLastAd + 1;
  }, [session.puzzlesSinceLastAd]);

  // Reset puzzle count (after showing ad)
  const resetPuzzleCount = useCallback(() => {
    setSession((prev) => ({
      ...prev,
      puzzlesSinceLastAd: 0,
    }));
  }, []);

  // Check if interstitial should be shown
  const shouldShowInterstitial = useCallback((): boolean => {
    return session.puzzlesSinceLastAd + 1 >= CHAPTERS_INTERSTITIAL_FREQUENCY;
  }, [session.puzzlesSinceLastAd]);

  return {
    session,
    isAtLimit: !isAdFree && session.gamesRemaining <= 0,
    consumeGame,
    addGames,
    incrementPuzzleCount,
    resetPuzzleCount,
    shouldShowInterstitial,
  };
};
