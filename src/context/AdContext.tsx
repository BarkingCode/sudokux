/**
 * Ad management context.
 * Handles ads for different game modes:
 * - Chapters: Interstitial ads every 2-4 games (randomized)
 * - Free Run: Game limit (3 games) then rewarded ad to continue
 *
 * Uses extracted hooks for modularity:
 * - useAdSession: Session state and persistence
 * - useInterstitialAd: Interstitial ad lifecycle
 * - useRewardedAd: Rewarded ad lifecycle
 */

import React, { createContext, useContext, useCallback, useState, useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useAdSession } from '../hooks/useAdSession';
import { useInterstitialAd } from '../hooks/useInterstitialAd';
import { useRewardedAd } from '../hooks/useRewardedAd';
import { useHelperRewardedAd } from '../hooks/useHelperRewardedAd';
import { isWeb } from '../utils/platform';
import { createScopedLogger } from '../utils/logger';

const log = createScopedLogger('AdContext');

interface AdContextType {
  isAdFree: boolean;

  // Chapter actions
  onChapterComplete: () => Promise<void>;

  // Free Run game limit
  freeRunGamesRemaining: number;
  isAtFreeRunLimit: boolean;
  consumeFreeRunGame: () => boolean;
  showRewardedAd: () => Promise<boolean>;

  // Helper ad (separate from free-run rewards)
  showHelperRewardedAd: () => Promise<boolean>;
  isHelperRewardedAdReady: boolean;
  isLoadingHelperAd: boolean;

  // Ad loading state
  isInterstitialAdReady: boolean;
  isRewardedAdReady: boolean;
  isLoadingAd: boolean;

  // Daily reset
  checkAndResetDaily: () => boolean;
}

const AdContext = createContext<AdContextType | undefined>(undefined);

export const AdProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAdFree] = useState(false); // Future: RevenueCat integration

  // Session management
  const {
    session,
    incrementChapterCount,
    resetChapterCount,
    shouldShowInterstitial,
    freeRunGamesRemaining,
    isAtFreeRunLimit,
    consumeFreeRunGame,
    addFreeRunGames,
    checkAndResetDaily,
  } = useAdSession(isAdFree);

  // Interstitial ad (for Chapters)
  const interstitialAd = useInterstitialAd({ isAdFree });

  // Rewarded ad (for Free Run) - grant games when reward earned
  const handleRewardEarned = useCallback(() => {
    log.debug('handleRewardEarned callback triggered - calling addFreeRunGames');
    addFreeRunGames();
  }, [addFreeRunGames]);

  const rewardedAd = useRewardedAd({ isAdFree, onRewardEarned: handleRewardEarned });

  // Helper rewarded ad (for Smart Helper) - does NOT grant free games
  const helperRewardedAd = useHelperRewardedAd({ isAdFree });

  // Check for daily reset when app comes to foreground (e.g., after midnight)
  const appState = useRef(AppState.currentState);
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        // App has come to foreground - check for daily reset
        checkAndResetDaily();
      }
      appState.current = nextAppState;
    });

    return () => subscription.remove();
  }, [checkAndResetDaily]);

  // Called when Chapter puzzle is completed - may show interstitial
  const onChapterComplete = useCallback(async (): Promise<void> => {
    log.debug('onChapterComplete called', {
      isAdFree,
      chapterGamesSinceLastAd: session.chapterGamesSinceLastAd,
      nextInterstitialThreshold: session.nextInterstitialThreshold,
      isInterstitialAdReady: interstitialAd.isReady,
    });

    if (isAdFree || isWeb()) {
      log.debug('Skipping ad - ad free or web');
      return;
    }

    const willShowAd = shouldShowInterstitial() && interstitialAd.isReady;
    incrementChapterCount();

    if (willShowAd) {
      log.debug('Showing interstitial ad');
      resetChapterCount();
      await interstitialAd.show();
    } else {
      log.debug('Not showing ad yet', { threshold: session.nextInterstitialThreshold });
    }
  }, [
    isAdFree,
    session.chapterGamesSinceLastAd,
    session.nextInterstitialThreshold,
    interstitialAd,
    shouldShowInterstitial,
    incrementChapterCount,
    resetChapterCount,
  ]);

  return (
    <AdContext.Provider
      value={{
        isAdFree,
        onChapterComplete,
        freeRunGamesRemaining: isAdFree ? 999 : freeRunGamesRemaining,
        isAtFreeRunLimit: !isAdFree && isAtFreeRunLimit,
        consumeFreeRunGame,
        showRewardedAd: rewardedAd.show,
        // Helper ad (separate from free-run rewards)
        showHelperRewardedAd: helperRewardedAd.show,
        isHelperRewardedAdReady: helperRewardedAd.isReady,
        isLoadingHelperAd: helperRewardedAd.isLoading,
        // General ad state
        isInterstitialAdReady: interstitialAd.isReady,
        isRewardedAdReady: rewardedAd.isReady,
        isLoadingAd: rewardedAd.isLoading,
        // Daily reset
        checkAndResetDaily,
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
