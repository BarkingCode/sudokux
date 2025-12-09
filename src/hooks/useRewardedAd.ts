/**
 * Hook for managing rewarded ad lifecycle.
 * Handles loading, showing, and reward tracking for rewarded ads.
 *
 * Production note: Multi-part ads (e.g., "ad 2 of 2") may have delayed CLOSED events.
 * We handle this by:
 * 1. Using a longer show timeout (60s) to accommodate multi-part ads
 * 2. Granting reward immediately when EARNED_REWARD fires (not waiting for CLOSED)
 * 3. Using CLOSED only to trigger ad reload and cleanup
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { RewardedAd, AdEventType, RewardedAdEventType } from 'react-native-google-mobile-ads';
import { AD_UNIT_IDS } from '../config/ads';
import { getAdLoadTimeout } from '../config/timing';
import { logAdImpression } from '../services/facebookAnalytics';
import { isWeb } from '../utils/platform';
import { createScopedLogger } from '../utils/logger';

const log = createScopedLogger('RewardedAd');

// Longer timeout for production ads (multi-part ads can take 45-60 seconds)
const AD_SHOW_TIMEOUT = __DEV__ ? 30000 : 90000;

// Create ad instance at module level (this is fine - it's the ad SDK instance)
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
 *
 * Key behavior: Reward is granted immediately when EARNED_REWARD fires,
 * not when CLOSED fires. This ensures users get their reward even if
 * the ad close sequence is slow or interrupted.
 */
export const useRewardedAd = ({ isAdFree, onRewardEarned }: UseRewardedAdOptions): UseRewardedAdReturn => {
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Use refs instead of module-level state to prevent race conditions
  const rewardEarnedRef = useRef(false);
  const rewardGrantedRef = useRef(false); // Track if we've already granted reward
  const pendingResolverRef = useRef<((value: boolean) => void) | null>(null);
  const showTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loadTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isShowingRef = useRef(false);

  // Debug log on mount
  useEffect(() => {
    log.debug('Hook mounted', { isAdFree });
  }, [isAdFree]);

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

  // Grant reward immediately - called when EARNED_REWARD fires
  // This ensures user gets reward even if CLOSED is delayed
  const grantRewardIfNotAlready = useCallback(() => {
    if (!rewardGrantedRef.current && rewardEarnedRef.current) {
      rewardGrantedRef.current = true;
      log.debug('Granting reward immediately on EARNED_REWARD');
      onRewardEarned();
    }
  }, [onRewardEarned]);

  // Safe resolve that prevents double resolution
  // Called when ad closes - resolves the promise but reward may already be granted
  const safeResolve = useCallback((wasEarned: boolean) => {
    if (pendingResolverRef.current) {
      const resolver = pendingResolverRef.current;
      pendingResolverRef.current = null;
      isShowingRef.current = false;
      clearShowTimeout();

      log.debug('Safe resolve called', { wasEarned, alreadyGranted: rewardGrantedRef.current });

      // If reward was earned but not yet granted (shouldn't happen, but safety net)
      if (wasEarned && !rewardGrantedRef.current) {
        rewardGrantedRef.current = true;
        log.debug('Calling onRewardEarned callback (fallback in safeResolve)');
        onRewardEarned();
      }

      resolver(wasEarned);
    }
  }, [onRewardEarned, clearShowTimeout]);

  // Load rewarded ad
  const loadAd = useCallback(() => {
    if (isAdFree || isWeb()) {
      log.debug('Skipping load - ad free or web');
      return;
    }

    log.debug('Loading rewarded ad...');
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

    rewardedAd.load();
  }, [isAdFree, clearLoadTimeout]);

  // Set up event listeners and initial load
  useEffect(() => {
    if (isWeb()) return;

    const loadedUnsub = rewardedAd.addAdEventListener(
      RewardedAdEventType.LOADED,
      () => {
        log.debug('Ad loaded successfully');
        clearLoadTimeout();
        setIsReady(true);
        setIsLoading(false);
      }
    );

    const openedUnsub = rewardedAd.addAdEventListener(
      AdEventType.OPENED,
      () => {
        log.debug('Ad opened - logging impression');
        logAdImpression('rewarded');
      }
    );

    // CRITICAL: Grant reward immediately when EARNED_REWARD fires
    // Don't wait for CLOSED - production ads may have delayed close events
    const earnedUnsub = rewardedAd.addAdEventListener(
      RewardedAdEventType.EARNED_REWARD,
      (reward) => {
        log.debug('EARNED_REWARD event fired', {
          type: reward?.type,
          amount: reward?.amount,
          hasResolver: !!pendingResolverRef.current,
        });
        rewardEarnedRef.current = true;

        // Grant reward immediately - don't wait for CLOSED
        grantRewardIfNotAlready();
      }
    );

    const closedUnsub = rewardedAd.addAdEventListener(
      AdEventType.CLOSED,
      () => {
        const wasEarned = rewardEarnedRef.current;
        log.debug('CLOSED event fired', {
          wasEarned,
          hasResolver: !!pendingResolverRef.current,
          rewardAlreadyGranted: rewardGrantedRef.current,
        });
        setIsReady(false);

        // Resolve the pending promise if there is one
        // (Reward should already be granted from EARNED_REWARD)
        safeResolve(wasEarned);

        // Reset state for next show
        rewardEarnedRef.current = false;
        rewardGrantedRef.current = false;

        // Preload next ad
        loadAd();
      }
    );

    const errorUnsub = rewardedAd.addAdEventListener(
      AdEventType.ERROR,
      (error: Error & { code?: string; domain?: string }) => {
        log.error('Ad error', {
          message: error?.message,
          code: error?.code,
          domain: error?.domain,
        });
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
  }, [loadAd, clearLoadTimeout, clearShowTimeout, safeResolve, grantRewardIfNotAlready]);

  // Show rewarded ad and return whether reward was earned
  const show = useCallback((): Promise<boolean> => {
    return new Promise((resolve) => {
      log.debug('showRewardedAd called', {
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

      // Ad-free users get instant reward
      if (isAdFree) {
        log.debug('Ad-free user, granting reward');
        onRewardEarned();
        resolve(true);
        return;
      }

      // Web fallback - grant reward
      if (isWeb()) {
        log.debug('Web platform, granting reward');
        onRewardEarned();
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
      rewardGrantedRef.current = false;
      isShowingRef.current = true;

      // Store the resolver
      pendingResolverRef.current = resolve;

      // Longer timeout for production multi-part ads
      showTimeoutRef.current = setTimeout(() => {
        log.debug('Show timeout reached', {
          timeoutMs: AD_SHOW_TIMEOUT,
          wasEarned: rewardEarnedRef.current,
          wasGranted: rewardGrantedRef.current,
        });
        // If reward was earned, resolve true even on timeout
        // (ad just took too long to close)
        safeResolve(rewardEarnedRef.current);
      }, AD_SHOW_TIMEOUT);

      try {
        log.debug('Showing ad...');
        rewardedAd.show();
      } catch (error) {
        log.error('Error showing ad', { error });
        safeResolve(false);
      }
    });
  }, [isReady, isAdFree, onRewardEarned, safeResolve]);

  return { isReady, isLoading, show };
};
