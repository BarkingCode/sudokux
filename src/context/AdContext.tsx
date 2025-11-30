/**
 * Ad management context.
 * Handles game session limits, ad loading, and display.
 * Supports 5-game session limit with rewarded ads to unlock more games.
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
import { GAMES_PER_REWARD } from '../config/ads';

interface AdContextType {
  // Session state
  gamesRemaining: number;
  isAtLimit: boolean;
  isAdFree: boolean;

  // Actions
  consumeGame: () => boolean;
  onPuzzleComplete: () => Promise<void>;
  showRewardedAd: () => Promise<boolean>;
  showInterstitialAd: () => Promise<void>;

  // Ad loading state
  isRewardedAdReady: boolean;
  isInterstitialAdReady: boolean;
  isLoadingAd: boolean;
}

const AdContext = createContext<AdContextType | undefined>(undefined);

export const AdProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAdFree] = useState(false); // Future: RevenueCat integration

  // Session management
  const {
    session,
    isAtLimit,
    consumeGame,
    addGames,
    incrementPuzzleCount,
    resetPuzzleCount,
    shouldShowInterstitial,
  } = useAdSession(isAdFree);

  // Interstitial ad
  const interstitialAd = useInterstitialAd({ isAdFree });

  // Rewarded ad - grant games when reward earned
  const handleRewardEarned = useCallback(() => {
    addGames(GAMES_PER_REWARD);
  }, [addGames]);

  const rewardedAd = useRewardedAd({
    isAdFree,
    onRewardEarned: handleRewardEarned,
  });

  // Called when puzzle is completed - may show interstitial
  const onPuzzleComplete = useCallback(async (): Promise<void> => {
    console.log('[AdContext] onPuzzleComplete called', {
      isAdFree,
      platform: Platform.OS,
      puzzlesSinceLastAd: session.puzzlesSinceLastAd,
      isInterstitialAdReady: interstitialAd.isReady,
    });

    if (isAdFree || Platform.OS === 'web') {
      console.log('[AdContext] Skipping ad - ad free or web');
      return;
    }

    const willShowAd = shouldShowInterstitial() && interstitialAd.isReady;
    incrementPuzzleCount();

    if (willShowAd) {
      console.log('[AdContext] Showing interstitial ad');
      resetPuzzleCount();
      await interstitialAd.show();
    } else {
      console.log('[AdContext] Not showing ad yet');
    }
  }, [
    isAdFree,
    session.puzzlesSinceLastAd,
    interstitialAd,
    shouldShowInterstitial,
    incrementPuzzleCount,
    resetPuzzleCount,
  ]);

  return (
    <AdContext.Provider
      value={{
        gamesRemaining: session.gamesRemaining,
        isAtLimit,
        isAdFree,
        consumeGame,
        onPuzzleComplete,
        showRewardedAd: rewardedAd.show,
        showInterstitialAd: interstitialAd.show,
        isRewardedAdReady: rewardedAd.isReady,
        isInterstitialAdReady: interstitialAd.isReady,
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
