/**
 * Hook for managing helper-specific rewarded ad lifecycle.
 * Used for unlocking the Smart Possibility Helper feature.
 * Separate from the main rewarded ad to avoid granting free-run games.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { RewardedAd, AdEventType, RewardedAdEventType } from 'react-native-google-mobile-ads';
import { AD_UNIT_IDS } from '../config/ads';

// Create ad instance at module level - separate from main rewarded ad
const helperRewardedAd = RewardedAd.createForAdRequest(AD_UNIT_IDS.HELPER_REWARDED);

interface UseHelperRewardedAdOptions {
  isAdFree: boolean;
}

export interface UseHelperRewardedAdReturn {
  isReady: boolean;
  isLoading: boolean;
  show: () => Promise<boolean>;
}

/**
 * Manages helper rewarded ad loading and display.
 * Does NOT grant free-run games - only used for unlocking helper feature.
 */
export const useHelperRewardedAd = ({ isAdFree }: UseHelperRewardedAdOptions): UseHelperRewardedAdReturn => {
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const rewardEarnedRef = useRef(false);

  // Load helper rewarded ad
  const loadAd = useCallback(() => {
    if (isAdFree || Platform.OS === 'web') {
      console.log('[useHelperRewardedAd] Skipping load - ad free or web');
      return;
    }

    console.log('[useHelperRewardedAd] Loading helper rewarded ad...');
    setIsReady(false);
    setIsLoading(true);
    helperRewardedAd.load();
  }, [isAdFree]);

  // Set up event listeners and initial load
  useEffect(() => {
    if (Platform.OS === 'web') return;

    const loadedUnsub = helperRewardedAd.addAdEventListener(
      RewardedAdEventType.LOADED,
      () => {
        console.log('[useHelperRewardedAd] Ad loaded successfully');
        setIsReady(true);
        setIsLoading(false);
      }
    );

    const earnedUnsub = helperRewardedAd.addAdEventListener(
      RewardedAdEventType.EARNED_REWARD,
      () => {
        console.log('[useHelperRewardedAd] Reward earned!');
        rewardEarnedRef.current = true;
      }
    );

    const closedUnsub = helperRewardedAd.addAdEventListener(
      AdEventType.CLOSED,
      () => {
        console.log('[useHelperRewardedAd] Ad closed');
        setIsReady(false);
        // Preload next ad
        loadAd();
      }
    );

    const errorUnsub = helperRewardedAd.addAdEventListener(
      AdEventType.ERROR,
      (error) => {
        console.log('[useHelperRewardedAd] Ad error:', error);
        setIsReady(false);
        setIsLoading(false);
      }
    );

    // Initial load
    loadAd();

    return () => {
      loadedUnsub();
      earnedUnsub();
      closedUnsub();
      errorUnsub();
    };
  }, [loadAd]);

  // Show helper rewarded ad and return whether reward was earned
  const show = useCallback((): Promise<boolean> => {
    return new Promise((resolve) => {
      console.log('[useHelperRewardedAd] show called', {
        isAdFree,
        platform: Platform.OS,
        isReady,
      });

      // Ad-free users get instant reward (helper unlocked)
      if (isAdFree) {
        console.log('[useHelperRewardedAd] Ad-free user, granting helper unlock');
        resolve(true);
        return;
      }

      // Web fallback - grant reward
      if (Platform.OS === 'web') {
        console.log('[useHelperRewardedAd] Web platform, granting helper unlock');
        resolve(true);
        return;
      }

      if (!isReady) {
        console.log('[useHelperRewardedAd] Ad not ready');
        resolve(false);
        return;
      }

      rewardEarnedRef.current = false;

      let closeListener: (() => void) | null = null;
      let errorListener: (() => void) | null = null;

      const cleanup = () => {
        if (closeListener) closeListener();
        if (errorListener) errorListener();
      };

      closeListener = helperRewardedAd.addAdEventListener(
        AdEventType.CLOSED,
        () => {
          cleanup();
          console.log('[useHelperRewardedAd] Ad closed, reward earned:', rewardEarnedRef.current);
          // Just return whether reward was earned - no side effects
          resolve(rewardEarnedRef.current);
        }
      );

      errorListener = helperRewardedAd.addAdEventListener(
        AdEventType.ERROR,
        (error) => {
          cleanup();
          console.log('[useHelperRewardedAd] Show error:', error);
          resolve(false);
        }
      );

      try {
        console.log('[useHelperRewardedAd] Showing ad...');
        helperRewardedAd.show();
      } catch (error) {
        cleanup();
        console.log('[useHelperRewardedAd] Error showing ad:', error);
        resolve(false);
      }
    });
  }, [isReady, isAdFree]);

  return { isReady, isLoading, show };
};
