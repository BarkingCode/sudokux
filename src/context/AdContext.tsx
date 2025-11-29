/**
 * Ad management context.
 * Handles game session limits, ad loading, and display.
 * Supports 5-game session limit with rewarded ads to unlock more games.
 */

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { Platform } from 'react-native';
import {
  InterstitialAd,
  RewardedAd,
  AdEventType,
  RewardedAdEventType,
} from 'react-native-google-mobile-ads';
import { loadData, saveData } from '../utils/storage';
import {
  AD_UNIT_IDS,
  GAMES_PER_SESSION,
  GAMES_PER_REWARD,
  CHAPTERS_INTERSTITIAL_FREQUENCY,
} from '../config/ads';

const STORAGE_KEY_SESSION = 'sudoku_ad_session';

interface AdSession {
  gamesPlayedToday: number;
  gamesRemaining: number;
  lastResetDate: string; // ISO date string (YYYY-MM-DD)
  puzzlesSinceLastAd: number;
}

interface AdContextType {
  // Session state
  gamesRemaining: number;
  isAtLimit: boolean;
  isAdFree: boolean;

  // Actions
  consumeGame: () => boolean; // Returns true if game can be played
  onPuzzleComplete: () => Promise<void>; // Called when puzzle is completed
  showRewardedAd: () => Promise<boolean>; // Returns true if reward earned
  showInterstitialAd: () => Promise<void>;

  // Ad loading state
  isRewardedAdReady: boolean;
  isInterstitialAdReady: boolean;
  isLoadingAd: boolean;
}

const AdContext = createContext<AdContextType | undefined>(undefined);

const getTodayDateString = (): string => {
  return new Date().toISOString().split('T')[0];
};

const createInitialSession = (): AdSession => ({
  gamesPlayedToday: 0,
  gamesRemaining: GAMES_PER_SESSION,
  lastResetDate: getTodayDateString(),
  puzzlesSinceLastAd: 0,
});

// Create ad instances
const interstitialAd = InterstitialAd.createForAdRequest(AD_UNIT_IDS.INTERSTITIAL);
const rewardedAd = RewardedAd.createForAdRequest(AD_UNIT_IDS.REWARDED);

export const AdProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<AdSession>(createInitialSession());
  const [isAdFree, setIsAdFree] = useState(false); // Future: RevenueCat integration
  const [isRewardedAdReady, setIsRewardedAdReady] = useState(false);
  const [isInterstitialAdReady, setIsInterstitialAdReady] = useState(false);
  const [isLoadingAd, setIsLoadingAd] = useState(false);

  const rewardEarnedRef = useRef(false);

  // Load session on mount
  useEffect(() => {
    loadData<AdSession>(STORAGE_KEY_SESSION).then((saved) => {
      if (saved) {
        // Check if we need to reset for a new day
        const today = getTodayDateString();
        if (saved.lastResetDate !== today) {
          // New day - reset session
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

  // Load interstitial ad
  const loadInterstitialAd = useCallback(() => {
    if (isAdFree || Platform.OS === 'web') {
      console.log('[AdContext] Skipping interstitial load - ad free or web');
      return;
    }

    console.log('[AdContext] Loading interstitial ad...');
    setIsInterstitialAdReady(false);
    interstitialAd.load();
  }, [isAdFree]);

  // Load rewarded ad
  const loadRewardedAd = useCallback(() => {
    if (isAdFree || Platform.OS === 'web') {
      console.log('[AdContext] Skipping rewarded ad load - ad free or web');
      return;
    }

    console.log('[AdContext] Loading rewarded ad...');
    setIsRewardedAdReady(false);
    setIsLoadingAd(true);
    rewardedAd.load();
  }, [isAdFree]);

  // Set up ad event listeners
  useEffect(() => {
    if (Platform.OS === 'web') return;

    // Interstitial events
    const interstitialLoadedUnsub = interstitialAd.addAdEventListener(
      AdEventType.LOADED,
      () => {
        console.log('[AdContext] Interstitial ad loaded successfully');
        setIsInterstitialAdReady(true);
      }
    );

    const interstitialClosedUnsub = interstitialAd.addAdEventListener(
      AdEventType.CLOSED,
      () => {
        setIsInterstitialAdReady(false);
        // Preload next ad
        loadInterstitialAd();
      }
    );

    const interstitialErrorUnsub = interstitialAd.addAdEventListener(
      AdEventType.ERROR,
      (error) => {
        console.log('Interstitial ad error:', error);
        setIsInterstitialAdReady(false);
      }
    );

    // Rewarded events
    const rewardedLoadedUnsub = rewardedAd.addAdEventListener(
      RewardedAdEventType.LOADED,
      () => {
        console.log('[AdContext] Rewarded ad loaded successfully');
        setIsRewardedAdReady(true);
        setIsLoadingAd(false);
      }
    );

    const rewardedEarnedUnsub = rewardedAd.addAdEventListener(
      RewardedAdEventType.EARNED_REWARD,
      () => {
        console.log('[AdContext] Rewarded ad - reward earned!');
        rewardEarnedRef.current = true;
      }
    );

    const rewardedClosedUnsub = rewardedAd.addAdEventListener(
      AdEventType.CLOSED,
      () => {
        console.log('[AdContext] Rewarded ad closed');
        setIsRewardedAdReady(false);
        // Preload next ad
        loadRewardedAd();
      }
    );

    const rewardedErrorUnsub = rewardedAd.addAdEventListener(
      AdEventType.ERROR,
      (error) => {
        console.log('[AdContext] Rewarded ad error:', error);
        setIsRewardedAdReady(false);
        setIsLoadingAd(false);
      }
    );

    // Initial load
    loadInterstitialAd();
    loadRewardedAd();

    return () => {
      interstitialLoadedUnsub();
      interstitialClosedUnsub();
      interstitialErrorUnsub();
      rewardedLoadedUnsub();
      rewardedEarnedUnsub();
      rewardedClosedUnsub();
      rewardedErrorUnsub();
    };
  }, [loadInterstitialAd, loadRewardedAd]);

  // Consume a game (returns true if allowed to play)
  const consumeGame = useCallback((): boolean => {
    if (isAdFree) return true;

    // Check for daily reset
    const today = getTodayDateString();
    if (session.lastResetDate !== today) {
      const newSession = createInitialSession();
      newSession.gamesRemaining = GAMES_PER_SESSION - 1; // Consume one game
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

  // Called when puzzle is completed - may show interstitial
  const onPuzzleComplete = useCallback((): Promise<void> => {
    return new Promise((resolve) => {
      console.log('[AdContext] onPuzzleComplete called', {
        isAdFree,
        platform: Platform.OS,
        puzzlesSinceLastAd: session.puzzlesSinceLastAd,
        frequency: CHAPTERS_INTERSTITIAL_FREQUENCY,
        isInterstitialAdReady,
      });

      if (isAdFree || Platform.OS === 'web') {
        console.log('[AdContext] Skipping ad - ad free or web');
        resolve();
        return;
      }

      const newPuzzlesSinceAd = session.puzzlesSinceLastAd + 1;
      console.log('[AdContext] New puzzles since ad:', newPuzzlesSinceAd);

      if (newPuzzlesSinceAd >= CHAPTERS_INTERSTITIAL_FREQUENCY && isInterstitialAdReady) {
        console.log('[AdContext] Showing interstitial ad');
        setSession((prev) => ({
          ...prev,
          puzzlesSinceLastAd: 0,
        }));

        let resolved = false;
        let closeListener: (() => void) | null = null;
        let errorListener: (() => void) | null = null;

        const cleanup = () => {
          if (closeListener) closeListener();
          if (errorListener) errorListener();
        };

        const safeResolve = () => {
          if (!resolved) {
            resolved = true;
            cleanup();
            resolve();
          }
        };

        // Timeout to ensure we always resolve (in case ad events don't fire)
        const timeout = setTimeout(() => {
          console.log('[AdContext] Interstitial timeout - resolving');
          safeResolve();
        }, 30000); // 30 second max

        // Set up one-time listeners
        closeListener = interstitialAd.addAdEventListener(
          AdEventType.CLOSED,
          () => {
            console.log('[AdContext] Interstitial ad closed');
            clearTimeout(timeout);
            safeResolve();
          }
        );

        errorListener = interstitialAd.addAdEventListener(
          AdEventType.ERROR,
          (error) => {
            console.log('[AdContext] Interstitial ad error:', error);
            clearTimeout(timeout);
            safeResolve();
          }
        );

        try {
          interstitialAd.show();
        } catch (error) {
          console.log('Error showing interstitial ad:', error);
          clearTimeout(timeout);
          safeResolve();
        }
      } else {
        console.log('[AdContext] Not showing ad yet:', {
          needMore: CHAPTERS_INTERSTITIAL_FREQUENCY - newPuzzlesSinceAd,
          adReady: isInterstitialAdReady,
        });
        setSession((prev) => ({
          ...prev,
          puzzlesSinceLastAd: newPuzzlesSinceAd,
        }));
        resolve();
      }
    });
  }, [session.puzzlesSinceLastAd, isInterstitialAdReady, isAdFree]);

  // Show rewarded ad and grant games
  const showRewardedAd = useCallback((): Promise<boolean> => {
    return new Promise((resolve) => {
      console.log('[AdContext] showRewardedAd called', {
        isAdFree,
        platform: Platform.OS,
        isRewardedAdReady,
      });

      if (isAdFree) {
        // Ad-free users get free unlocks
        console.log('[AdContext] Ad-free user, granting free games');
        setSession((prev) => ({
          ...prev,
          gamesRemaining: prev.gamesRemaining + GAMES_PER_REWARD,
        }));
        resolve(true);
        return;
      }

      if (Platform.OS === 'web') {
        // Web fallback - just grant the games
        console.log('[AdContext] Web platform, granting free games');
        setSession((prev) => ({
          ...prev,
          gamesRemaining: prev.gamesRemaining + GAMES_PER_REWARD,
        }));
        resolve(true);
        return;
      }

      if (!isRewardedAdReady) {
        console.log('[AdContext] Rewarded ad not ready, returning false');
        resolve(false);
        return;
      }

      rewardEarnedRef.current = false;

      // Set up one-time listener for when ad closes
      const closeListener = rewardedAd.addAdEventListener(
        AdEventType.CLOSED,
        () => {
          closeListener();
          errorListener();
          console.log('[AdContext] Rewarded ad closed, reward earned:', rewardEarnedRef.current);

          // Check if reward was earned
          if (rewardEarnedRef.current) {
            setSession((prev) => ({
              ...prev,
              gamesRemaining: prev.gamesRemaining + GAMES_PER_REWARD,
            }));
            resolve(true);
          } else {
            resolve(false);
          }
        }
      );

      // Handle errors
      const errorListener = rewardedAd.addAdEventListener(
        AdEventType.ERROR,
        (error) => {
          closeListener();
          errorListener();
          console.log('[AdContext] Rewarded ad error:', error);
          resolve(false);
        }
      );

      try {
        console.log('[AdContext] Showing rewarded ad...');
        rewardedAd.show();
      } catch (error) {
        closeListener();
        errorListener();
        console.log('[AdContext] Error showing rewarded ad:', error);
        resolve(false);
      }
    });
  }, [isRewardedAdReady, isAdFree]);

  // Show interstitial ad and wait for it to close
  const showInterstitialAd = useCallback((): Promise<void> => {
    return new Promise((resolve) => {
      if (isAdFree || Platform.OS === 'web' || !isInterstitialAdReady) {
        resolve();
        return;
      }

      // Set up a one-time listener for when the ad closes
      const closeListener = interstitialAd.addAdEventListener(
        AdEventType.CLOSED,
        () => {
          closeListener(); // Remove the listener
          resolve();
        }
      );

      // Also handle errors
      const errorListener = interstitialAd.addAdEventListener(
        AdEventType.ERROR,
        () => {
          errorListener();
          closeListener();
          resolve();
        }
      );

      try {
        interstitialAd.show();
      } catch (error) {
        console.log('Error showing interstitial ad:', error);
        closeListener();
        errorListener();
        resolve();
      }
    });
  }, [isInterstitialAdReady, isAdFree]);

  return (
    <AdContext.Provider
      value={{
        gamesRemaining: session.gamesRemaining,
        isAtLimit: !isAdFree && session.gamesRemaining <= 0,
        isAdFree,
        consumeGame,
        onPuzzleComplete,
        showRewardedAd,
        showInterstitialAd,
        isRewardedAdReady,
        isInterstitialAdReady,
        isLoadingAd,
      }}
    >
      {children}
    </AdContext.Provider>
  );
};

export const useAds = () => {
  const context = useContext(AdContext);
  if (!context) {
    throw new Error('useAds must be used within an AdProvider');
  }
  return context;
};
