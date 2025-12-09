/**
 * Hook for managing interstitial ad lifecycle.
 * Handles loading, showing, and event listeners for interstitial ads.
 */

import { useCallback, useEffect, useState } from 'react';
import { InterstitialAd, AdEventType } from 'react-native-google-mobile-ads';
import { AD_UNIT_IDS } from '../config/ads';
import { TIMING } from '../config/timing';
import { logAdImpression } from '../services/facebookAnalytics';
import { isWeb } from '../utils/platform';
import { createScopedLogger } from '../utils/logger';

const log = createScopedLogger('InterstitialAd');

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
    if (isAdFree || isWeb()) {
      log.debug('Skipping load - ad free or web');
      return;
    }

    log.debug('Loading interstitial ad...');
    setIsReady(false);
    interstitialAd.load();
  }, [isAdFree]);

  // Set up event listeners and initial load
  useEffect(() => {
    if (isWeb()) return;

    const loadedUnsub = interstitialAd.addAdEventListener(
      AdEventType.LOADED,
      () => {
        log.debug('Ad loaded successfully');
        setIsReady(true);
      }
    );

    const openedUnsub = interstitialAd.addAdEventListener(
      AdEventType.OPENED,
      () => {
        log.debug('Ad opened - logging impression');
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
        log.error('Ad error', { error });
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
      if (isAdFree || isWeb() || !isReady) {
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
        log.debug('Show timeout - resolving');
        safeResolve();
      }, TIMING.AD_TIMEOUTS.SHOW);

      closeListener = interstitialAd.addAdEventListener(
        AdEventType.CLOSED,
        () => {
          log.debug('Ad closed');
          clearTimeout(timeout);
          safeResolve();
        }
      );

      errorListener = interstitialAd.addAdEventListener(
        AdEventType.ERROR,
        (error) => {
          log.error('Show error', { error });
          clearTimeout(timeout);
          safeResolve();
        }
      );

      try {
        interstitialAd.show();
      } catch (error) {
        log.error('Error showing ad', { error });
        clearTimeout(timeout);
        safeResolve();
      }
    });
  }, [isReady, isAdFree]);

  return { isReady, show };
};
