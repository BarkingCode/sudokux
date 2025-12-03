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

import React, { createContext, useContext, useCallback, useState } from 'react';
import { Platform } from 'react-native';
import { useAdSession } from '../hooks/useAdSession';
import { useInterstitialAd } from '../hooks/useInterstitialAd';
import { useRewardedAd } from '../hooks/useRewardedAd';

interface AdContextType {
  isAdFree: boolean;

  // Chapter actions
  onChapterComplete: () => Promise<void>;

  // Free Run game limit
  freeRunGamesRemaining: number;
  isAtFreeRunLimit: boolean;
  consumeFreeRunGame: () => boolean;
  showRewardedAd: () => Promise<boolean>;

  // Ad loading state
  isInterstitialAdReady: boolean;
  isRewardedAdReady: boolean;
  isLoadingAd: boolean;
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
  } = useAdSession(isAdFree);

  // Interstitial ad (for Chapters)
  const interstitialAd = useInterstitialAd({ isAdFree });

  // Rewarded ad (for Free Run) - grant games when reward earned
  const handleRewardEarned = useCallback(() => {
    addFreeRunGames();
  }, [addFreeRunGames]);

  const rewardedAd = useRewardedAd({ isAdFree, onRewardEarned: handleRewardEarned });

  // Called when Chapter puzzle is completed - may show interstitial
  const onChapterComplete = useCallback(async (): Promise<void> => {
    console.log('[AdContext] onChapterComplete called', {
      isAdFree,
      platform: Platform.OS,
      chapterGamesSinceLastAd: session.chapterGamesSinceLastAd,
      nextInterstitialThreshold: session.nextInterstitialThreshold,
      isInterstitialAdReady: interstitialAd.isReady,
    });

    if (isAdFree || Platform.OS === 'web') {
      console.log('[AdContext] Skipping ad - ad free or web');
      return;
    }

    const willShowAd = shouldShowInterstitial() && interstitialAd.isReady;
    incrementChapterCount();

    if (willShowAd) {
      console.log('[AdContext] Showing interstitial ad');
      resetChapterCount();
      await interstitialAd.show();
    } else {
      console.log('[AdContext] Not showing ad yet, threshold:', session.nextInterstitialThreshold);
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
        isInterstitialAdReady: interstitialAd.isReady,
        isRewardedAdReady: rewardedAd.isReady,
        isLoadingAd: rewardedAd.isLoading,
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
