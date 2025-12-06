/**
 * Hook for managing ad session state.
 * Tracks separate counters for Chapters (interstitial) and Free Run (rewarded).
 */

import { useCallback, useEffect, useState } from 'react';
import { loadData, saveData } from '../utils/storage';
import { INTERSTITIAL_MIN_GAMES, INTERSTITIAL_MAX_GAMES, FREERUN_GAMES_PER_SESSION } from '../config/ads';
import { getLocalDateString } from '../utils/dateUtils';

const STORAGE_KEY_SESSION = 'sudoku_ad_session';

/**
 * Generate random number of games until next interstitial ad (inclusive range)
 */
const generateNextInterstitialThreshold = (): number => {
  return Math.floor(Math.random() * (INTERSTITIAL_MAX_GAMES - INTERSTITIAL_MIN_GAMES + 1)) + INTERSTITIAL_MIN_GAMES;
};

export interface AdSession {
  // Chapters mode - interstitial ads
  chapterGamesSinceLastAd: number;
  nextInterstitialThreshold: number; // Random threshold (2-4)
  // Free Run mode - game limit with rewarded ads
  freeRunGamesRemaining: number;
  // Daily reset tracking (YYYY-MM-DD format)
  lastFreeRunResetDate?: string;
}

export interface UseAdSessionReturn {
  session: AdSession;
  // Chapter functions
  incrementChapterCount: () => number;
  resetChapterCount: () => void;
  shouldShowInterstitial: () => boolean;
  // Free Run functions
  freeRunGamesRemaining: number;
  isAtFreeRunLimit: boolean;
  consumeFreeRunGame: () => boolean;
  addFreeRunGames: () => void;
  checkAndResetDaily: () => boolean;
}

const createInitialSession = (): AdSession => ({
  chapterGamesSinceLastAd: 0,
  nextInterstitialThreshold: generateNextInterstitialThreshold(),
  freeRunGamesRemaining: FREERUN_GAMES_PER_SESSION,
  lastFreeRunResetDate: getLocalDateString(),
});

/**
 * Manages ad session state with persistence.
 * Tracks puzzles completed for both Chapters and Free Run modes.
 */
export const useAdSession = (isAdFree: boolean): UseAdSessionReturn => {
  const [session, setSession] = useState<AdSession>(createInitialSession());

  // Load session on mount
  useEffect(() => {
    loadData<AdSession>(STORAGE_KEY_SESSION).then((saved) => {
      if (saved && typeof saved.nextInterstitialThreshold === 'number') {
        setSession(saved);
      }
    });
  }, []);

  // Save session when it changes
  useEffect(() => {
    saveData(STORAGE_KEY_SESSION, session);
  }, [session]);

  // ============================================
  // CHAPTERS - Interstitial Ads
  // ============================================

  const incrementChapterCount = useCallback((): number => {
    let newCount = 0;
    setSession((prev) => {
      newCount = prev.chapterGamesSinceLastAd + 1;
      return {
        ...prev,
        chapterGamesSinceLastAd: newCount,
      };
    });
    return session.chapterGamesSinceLastAd + 1;
  }, [session.chapterGamesSinceLastAd]);

  const resetChapterCount = useCallback(() => {
    setSession((prev) => ({
      ...prev,
      chapterGamesSinceLastAd: 0,
      nextInterstitialThreshold: generateNextInterstitialThreshold(),
    }));
  }, []);

  const shouldShowInterstitial = useCallback((): boolean => {
    return session.chapterGamesSinceLastAd + 1 >= session.nextInterstitialThreshold;
  }, [session.chapterGamesSinceLastAd, session.nextInterstitialThreshold]);

  // ============================================
  // FREE RUN - Game Limit with Rewarded Ads
  // ============================================

  const isAtFreeRunLimit = session.freeRunGamesRemaining <= 0;

  // Consume a Free Run game (returns true if allowed to play)
  const consumeFreeRunGame = useCallback((): boolean => {
    if (session.freeRunGamesRemaining <= 0) {
      return false;
    }

    setSession((prev) => ({
      ...prev,
      freeRunGamesRemaining: prev.freeRunGamesRemaining - 1,
    }));

    return true;
  }, [session.freeRunGamesRemaining]);

  // Add games after watching rewarded ad
  const addFreeRunGames = useCallback(() => {
    setSession((prev) => ({
      ...prev,
      freeRunGamesRemaining: prev.freeRunGamesRemaining + FREERUN_GAMES_PER_SESSION,
    }));
  }, []);

  // Check if we need to reset Free Run games for a new day (midnight reset)
  const checkAndResetDaily = useCallback((): boolean => {
    const today = getLocalDateString();
    if (session.lastFreeRunResetDate !== today) {
      setSession((prev) => ({
        ...prev,
        freeRunGamesRemaining: FREERUN_GAMES_PER_SESSION,
        lastFreeRunResetDate: today,
      }));
      return true; // Did reset
    }
    return false; // No reset needed
  }, [session.lastFreeRunResetDate]);

  // Check for daily reset on mount
  useEffect(() => {
    checkAndResetDaily();
  }, [checkAndResetDaily]);

  return {
    session,
    incrementChapterCount,
    resetChapterCount,
    shouldShowInterstitial,
    freeRunGamesRemaining: session.freeRunGamesRemaining,
    isAtFreeRunLimit,
    consumeFreeRunGame,
    addFreeRunGames,
    checkAndResetDaily,
  };
};
