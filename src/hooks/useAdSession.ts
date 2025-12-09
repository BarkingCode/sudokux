/**
 * Hook for managing ad session state.
 * Tracks separate counters for Chapters (interstitial) and Free Run (rewarded).
 */

import { useCallback, useEffect, useState, useRef } from 'react';
import { loadData, saveData } from '../utils/storage';
import { INTERSTITIAL_MIN_GAMES, INTERSTITIAL_MAX_GAMES, FREERUN_GAMES_PER_SESSION } from '../config/ads';
import { getLocalDateString } from '../utils/dateUtils';
import { createScopedLogger } from '../utils/logger';

const log = createScopedLogger('AdSession');

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
  // Ref for synchronous state access (prevents race conditions)
  const sessionRef = useRef<AdSession>(createInitialSession());

  // Load session on mount
  useEffect(() => {
    loadData<AdSession>(STORAGE_KEY_SESSION).then((saved) => {
      if (saved && typeof saved.nextInterstitialThreshold === 'number') {
        sessionRef.current = saved;
        setSession(saved);
      }
    });
  }, []);

  // Helper to update session state and ref atomically, with persistence
  const updateSession = useCallback((updater: (prev: AdSession) => AdSession) => {
    setSession(prev => {
      const next = updater(prev);
      sessionRef.current = next;
      saveData(STORAGE_KEY_SESSION, next);
      return next;
    });
  }, []);

  // ============================================
  // CHAPTERS - Interstitial Ads
  // ============================================

  const incrementChapterCount = useCallback((): number => {
    const newCount = sessionRef.current.chapterGamesSinceLastAd + 1;
    updateSession((prev) => ({
      ...prev,
      chapterGamesSinceLastAd: newCount,
    }));
    return newCount;
  }, [updateSession]);

  const resetChapterCount = useCallback(() => {
    updateSession((prev) => ({
      ...prev,
      chapterGamesSinceLastAd: 0,
      nextInterstitialThreshold: generateNextInterstitialThreshold(),
    }));
  }, [updateSession]);

  const shouldShowInterstitial = useCallback((): boolean => {
    return session.chapterGamesSinceLastAd + 1 >= session.nextInterstitialThreshold;
  }, [session.chapterGamesSinceLastAd, session.nextInterstitialThreshold]);

  // ============================================
  // FREE RUN - Game Limit with Rewarded Ads
  // ============================================

  const isAtFreeRunLimit = session.freeRunGamesRemaining <= 0;

  // Consume a Free Run game (returns true if allowed to play)
  // Uses ref for synchronous check to prevent race conditions
  const consumeFreeRunGame = useCallback((): boolean => {
    const currentRemaining = sessionRef.current.freeRunGamesRemaining;
    log.debug('consumeFreeRunGame called', { currentRemaining });

    if (currentRemaining <= 0) {
      log.debug('consumeFreeRunGame: at limit, returning false');
      return false;
    }

    const newRemaining = currentRemaining - 1;
    updateSession((prev) => ({
      ...prev,
      freeRunGamesRemaining: newRemaining,
    }));

    log.debug('consumeFreeRunGame: consumed', { remaining: newRemaining });
    return true;
  }, [updateSession]);

  // Add games after watching rewarded ad
  const addFreeRunGames = useCallback(() => {
    const currentRemaining = sessionRef.current.freeRunGamesRemaining;
    const newRemaining = currentRemaining + FREERUN_GAMES_PER_SESSION;
    log.debug('addFreeRunGames called', {
      before: currentRemaining,
      adding: FREERUN_GAMES_PER_SESSION,
      after: newRemaining,
    });

    updateSession((prev) => ({
      ...prev,
      freeRunGamesRemaining: newRemaining,
    }));
  }, [updateSession]);

  // Check if we need to reset Free Run games for a new day (midnight reset)
  const checkAndResetDaily = useCallback((): boolean => {
    const today = getLocalDateString();
    const lastReset = sessionRef.current.lastFreeRunResetDate;
    log.debug('checkAndResetDaily', { today, lastReset });

    if (lastReset !== today) {
      log.debug('Daily reset triggered', { resettingTo: FREERUN_GAMES_PER_SESSION });

      updateSession((prev) => ({
        ...prev,
        freeRunGamesRemaining: FREERUN_GAMES_PER_SESSION,
        lastFreeRunResetDate: today,
      }));
      return true; // Did reset
    }
    return false; // No reset needed
  }, [updateSession]);

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
