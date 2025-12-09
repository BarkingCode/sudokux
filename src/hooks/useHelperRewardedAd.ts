/**
 * Hook for managing helper-specific rewarded ad lifecycle.
 * Used for unlocking the Smart Possibility Helper feature.
 * Separate from the main rewarded ad to avoid granting free-run games.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { RewardedAd, AdEventType, RewardedAdEventType } from 'react-native-google-mobile-ads';
import { AD_UNIT_IDS } from '../config/ads';
import { getAdLoadTimeout, TIMING } from '../config/timing';
import { logAdImpression } from '../services/facebookAnalytics';
import { isWeb } from '../utils/platform';
import { createScopedLogger } from '../utils/logger';

const log = createScopedLogger('HelperRewardedAd');

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

  // Use refs instead of module-level state to prevent race conditions
  const rewardEarnedRef = useRef(false);
  const pendingResolverRef = useRef<((value: boolean) => void) | null>(null);
  const showTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const loadTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isShowingRef = useRef(false);

  // Debug log on mount
  useEffect(() => {
    log.debug('Hook mounted', { isAdFree });
  }, []);

  // Clear loading timeout
  const clearLoadTimeout = useCallback(() => {
    if (loadTimeoutRef.current) {
      clearTimeout(loadTimeoutRef.current);
      loadTimeoutRef.current = null;
    }
  }, []);

  // Clear show timeout
  const clearShowTimeout = useCallback(() => {
    if (showTimeoutRef.current) {
      clearTimeout(showTimeoutRef.current);
      showTimeoutRef.current = null;
    }
  }, []);

  // Safe resolve that prevents double resolution
  const safeResolve = useCallback((wasEarned: boolean) => {
    if (pendingResolverRef.current) {
      const resolver = pendingResolverRef.current;
      pendingResolverRef.current = null;
      isShowingRef.current = false;
      clearShowTimeout();

      log.debug('Safe resolve called', { wasEarned });
      resolver(wasEarned);
    }
  }, [clearShowTimeout]);

  // Load helper rewarded ad
  const loadAd = useCallback(() => {
    if (isAdFree || isWeb()) {
      log.debug('Skipping load - ad free or web');
      return;
    }

    log.debug('Loading helper rewarded ad...');
    setIsReady(false);
    setIsLoading(true);

    // Clear any existing timeout
    clearLoadTimeout();

    // Timeout to prevent infinite loading state
    const timeoutMs = getAdLoadTimeout();
    loadTimeoutRef.current = setTimeout(() => {
      log.debug('Load timeout - resetting loading state');
      setIsLoading(false);
    }, timeoutMs);

    helperRewardedAd.load();
  }, [isAdFree, clearLoadTimeout]);

  // Set up event listeners and initial load
  useEffect(() => {
    if (isWeb()) return;

    const loadedUnsub = helperRewardedAd.addAdEventListener(
      RewardedAdEventType.LOADED,
      () => {
        log.debug('Ad loaded successfully');
        clearLoadTimeout();
        setIsReady(true);
        setIsLoading(false);
      }
    );

    const openedUnsub = helperRewardedAd.addAdEventListener(
      AdEventType.OPENED,
      () => {
        log.debug('Ad opened - logging impression');
        logAdImpression('rewarded_helper');
      }
    );

    const earnedUnsub = helperRewardedAd.addAdEventListener(
      RewardedAdEventType.EARNED_REWARD,
      () => {
        log.debug('EARNED_REWARD event fired');
        rewardEarnedRef.current = true;
      }
    );

    const closedUnsub = helperRewardedAd.addAdEventListener(
      AdEventType.CLOSED,
      () => {
        const wasEarned = rewardEarnedRef.current;
        log.debug('CLOSED event fired', {
          wasEarned,
          hasResolver: !!pendingResolverRef.current
        });
        setIsReady(false);

        // Resolve the pending promise if there is one
        safeResolve(wasEarned);

        // Reset reward state for next show
        rewardEarnedRef.current = false;

        // Preload next ad
        loadAd();
      }
    );

    const errorUnsub = helperRewardedAd.addAdEventListener(
      AdEventType.ERROR,
      (error) => {
        log.error('Ad error', { error });
        clearLoadTimeout();
        setIsReady(false);
        setIsLoading(false);

        // If we were showing, resolve with false
        if (isShowingRef.current) {
          safeResolve(false);
        }
      }
    );

    // Initial load
    loadAd();

    return () => {
      clearLoadTimeout();
      clearShowTimeout();
      loadedUnsub();
      openedUnsub();
      earnedUnsub();
      closedUnsub();
      errorUnsub();
    };
  }, [loadAd, clearLoadTimeout, clearShowTimeout, safeResolve]);

  // Show helper rewarded ad and return whether reward was earned
  const show = useCallback((): Promise<boolean> => {
    return new Promise((resolve) => {
      log.debug('showHelperRewardedAd called', {
        isAdFree,
        isReady,
        isShowing: isShowingRef.current,
        timestamp: Date.now(),
      });

      // Prevent showing multiple ads simultaneously
      if (isShowingRef.current) {
        log.debug('Already showing an ad, rejecting');
        resolve(false);
        return;
      }

      // Ad-free users get instant reward (helper unlocked)
      if (isAdFree) {
        log.debug('Ad-free user, granting helper unlock');
        resolve(true);
        return;
      }

      // Web fallback - grant reward
      if (isWeb()) {
        log.debug('Web platform, granting helper unlock');
        resolve(true);
        return;
      }

      if (!isReady) {
        log.debug('Ad not ready, cannot show');
        resolve(false);
        return;
      }

      // Reset state for this show attempt
      rewardEarnedRef.current = false;
      isShowingRef.current = true;

      // Store the resolver
      pendingResolverRef.current = resolve;

      // Timeout to prevent infinite waiting
      showTimeoutRef.current = setTimeout(() => {
        log.debug('Show timeout - resolving false');
        safeResolve(false);
      }, TIMING.AD_TIMEOUTS.SHOW);

      try {
        log.debug('Showing ad...');
        helperRewardedAd.show();
      } catch (error) {
        log.error('Error showing ad', { error });
        safeResolve(false);
      }
    });
  }, [isReady, isAdFree, safeResolve]);

  return { isReady, isLoading, show };
};
