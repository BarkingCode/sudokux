/**
 * Hook for managing rewarded ad lifecycle.
 * Handles loading, showing, and reward tracking for rewarded ads.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { RewardedAd, AdEventType, RewardedAdEventType } from 'react-native-google-mobile-ads';
import { AD_UNIT_IDS } from '../config/ads';

// Create ad instance at module level
const rewardedAd = RewardedAd.createForAdRequest(AD_UNIT_IDS.REWARDED);

interface UseRewardedAdOptions {
  isAdFree: boolean;
  onRewardEarned: () => void;
}

export interface UseRewardedAdReturn {
  isReady: boolean;
  isLoading: boolean;
  show: () => Promise<boolean>;
}

/**
 * Manages rewarded ad loading and display.
 * Tracks reward earned state and automatically preloads next ad.
 */
export const useRewardedAd = ({ isAdFree, onRewardEarned }: UseRewardedAdOptions): UseRewardedAdReturn => {
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const rewardEarnedRef = useRef(false);

  // Load rewarded ad
  const loadAd = useCallback(() => {
    if (isAdFree || Platform.OS === 'web') {
      console.log('[useRewardedAd] Skipping load - ad free or web');
      return;
    }

    console.log('[useRewardedAd] Loading rewarded ad...');
    setIsReady(false);
    setIsLoading(true);
    rewardedAd.load();
  }, [isAdFree]);

  // Set up event listeners and initial load
  useEffect(() => {
    if (Platform.OS === 'web') return;

    const loadedUnsub = rewardedAd.addAdEventListener(
      RewardedAdEventType.LOADED,
      () => {
        console.log('[useRewardedAd] Ad loaded successfully');
        setIsReady(true);
        setIsLoading(false);
      }
    );

    const earnedUnsub = rewardedAd.addAdEventListener(
      RewardedAdEventType.EARNED_REWARD,
      () => {
        console.log('[useRewardedAd] Reward earned!');
        rewardEarnedRef.current = true;
      }
    );

    const closedUnsub = rewardedAd.addAdEventListener(
      AdEventType.CLOSED,
      () => {
        console.log('[useRewardedAd] Ad closed');
        setIsReady(false);
        // Preload next ad
        loadAd();
      }
    );

    const errorUnsub = rewardedAd.addAdEventListener(
      AdEventType.ERROR,
      (error) => {
        console.log('[useRewardedAd] Ad error:', error);
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

  // Show rewarded ad and return whether reward was earned
  const show = useCallback((): Promise<boolean> => {
    return new Promise((resolve) => {
      console.log('[useRewardedAd] show called', {
        isAdFree,
        platform: Platform.OS,
        isReady,
      });

      // Ad-free users get instant reward
      if (isAdFree) {
        console.log('[useRewardedAd] Ad-free user, granting reward');
        onRewardEarned();
        resolve(true);
        return;
      }

      // Web fallback - grant reward
      if (Platform.OS === 'web') {
        console.log('[useRewardedAd] Web platform, granting reward');
        onRewardEarned();
        resolve(true);
        return;
      }

      if (!isReady) {
        console.log('[useRewardedAd] Ad not ready');
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

      closeListener = rewardedAd.addAdEventListener(
        AdEventType.CLOSED,
        () => {
          cleanup();
          console.log('[useRewardedAd] Ad closed, reward earned:', rewardEarnedRef.current);

          if (rewardEarnedRef.current) {
            onRewardEarned();
            resolve(true);
          } else {
            resolve(false);
          }
        }
      );

      errorListener = rewardedAd.addAdEventListener(
        AdEventType.ERROR,
        (error) => {
          cleanup();
          console.log('[useRewardedAd] Show error:', error);
          resolve(false);
        }
      );

      try {
        console.log('[useRewardedAd] Showing ad...');
        rewardedAd.show();
      } catch (error) {
        cleanup();
        console.log('[useRewardedAd] Error showing ad:', error);
        resolve(false);
      }
    });
  }, [isReady, isAdFree, onRewardEarned]);

  return { isReady, isLoading, show };
};
