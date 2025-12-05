/**
 * Hook for managing interstitial ad lifecycle.
 * Handles loading, showing, and event listeners for interstitial ads.
 */

import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { InterstitialAd, AdEventType } from 'react-native-google-mobile-ads';
import { AD_UNIT_IDS } from '../config/ads';
import { logAdImpression } from '../services/facebookAnalytics';

// Create ad instance at module level
const interstitialAd = InterstitialAd.createForAdRequest(AD_UNIT_IDS.INTERSTITIAL);

interface UseInterstitialAdOptions {
  isAdFree: boolean;
}

export interface UseInterstitialAdReturn {
  isReady: boolean;
  show: () => Promise<void>;
}

/**
 * Manages interstitial ad loading and display.
 * Automatically preloads next ad after showing.
 */
export const useInterstitialAd = ({ isAdFree }: UseInterstitialAdOptions): UseInterstitialAdReturn => {
  const [isReady, setIsReady] = useState(false);

  // Load interstitial ad
  const loadAd = useCallback(() => {
    if (isAdFree || Platform.OS === 'web') {
      console.log('[useInterstitialAd] Skipping load - ad free or web');
      return;
    }

    console.log('[useInterstitialAd] Loading interstitial ad...');
    setIsReady(false);
    interstitialAd.load();
  }, [isAdFree]);

  // Set up event listeners and initial load
  useEffect(() => {
    if (Platform.OS === 'web') return;

    const loadedUnsub = interstitialAd.addAdEventListener(
      AdEventType.LOADED,
      () => {
        console.log('[useInterstitialAd] Ad loaded successfully');
        setIsReady(true);
      }
    );

    const openedUnsub = interstitialAd.addAdEventListener(
      AdEventType.OPENED,
      () => {
        console.log('[useInterstitialAd] Ad opened - logging impression');
        logAdImpression('interstitial');
      }
    );

    const closedUnsub = interstitialAd.addAdEventListener(
      AdEventType.CLOSED,
      () => {
        setIsReady(false);
        // Preload next ad
        loadAd();
      }
    );

    const errorUnsub = interstitialAd.addAdEventListener(
      AdEventType.ERROR,
      (error) => {
        console.log('[useInterstitialAd] Ad error:', error);
        setIsReady(false);
      }
    );

    // Initial load
    loadAd();

    return () => {
      loadedUnsub();
      openedUnsub();
      closedUnsub();
      errorUnsub();
    };
  }, [loadAd]);

  // Show interstitial ad and wait for it to close
  const show = useCallback((): Promise<void> => {
    return new Promise((resolve) => {
      if (isAdFree || Platform.OS === 'web' || !isReady) {
        resolve();
        return;
      }

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

      // Timeout to ensure we always resolve
      const timeout = setTimeout(() => {
        console.log('[useInterstitialAd] Show timeout - resolving');
        safeResolve();
      }, 30000);

      closeListener = interstitialAd.addAdEventListener(
        AdEventType.CLOSED,
        () => {
          console.log('[useInterstitialAd] Ad closed');
          clearTimeout(timeout);
          safeResolve();
        }
      );

      errorListener = interstitialAd.addAdEventListener(
        AdEventType.ERROR,
        (error) => {
          console.log('[useInterstitialAd] Show error:', error);
          clearTimeout(timeout);
          safeResolve();
        }
      );

      try {
        interstitialAd.show();
      } catch (error) {
        console.log('[useInterstitialAd] Error showing ad:', error);
        clearTimeout(timeout);
        safeResolve();
      }
    });
  }, [isReady, isAdFree]);

  return { isReady, show };
};
