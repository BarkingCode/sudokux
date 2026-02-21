/**
 * Tests for src/hooks/useInterstitialAd.ts
 * Interstitial ad lifecycle and event handling.
 */

import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useInterstitialAd } from '../../src/hooks/useInterstitialAd';
import { InterstitialAd, AdEventType } from 'react-native-google-mobile-ads';

// Mock platform check
jest.mock('../../src/utils/platform', () => ({
  isWeb: jest.fn(() => false),
}));

jest.mock('../../src/services/facebookAnalytics', () => ({
  logAdImpression: jest.fn(),
}));

import { isWeb } from '../../src/utils/platform';
import { logAdImpression } from '../../src/services/facebookAnalytics';

const mockIsWeb = isWeb as jest.MockedFunction<typeof isWeb>;

describe('useInterstitialAd', () => {
  let mockAd: any;
  let eventListeners: Map<string, Function>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockIsWeb.mockReturnValue(false);
    eventListeners = new Map();

    // Mock ad instance
    mockAd = {
      load: jest.fn(),
      show: jest.fn(),
      addAdEventListener: jest.fn((eventType: string, callback: Function) => {
        eventListeners.set(eventType, callback);
        return jest.fn(); // Return unsubscribe function
      }),
    };

    (InterstitialAd.createForAdRequest as jest.Mock) = jest.fn(() => mockAd);
  });

  // ============ Loading ============

  describe('loading', () => {
    it('should load ad on mount', async () => {
      renderHook(() => useInterstitialAd({ isAdFree: false }));

      await waitFor(() => {
        expect(mockAd.load).toHaveBeenCalled();
      });
    });

    it('should skip loading for ad-free users', async () => {
      renderHook(() => useInterstitialAd({ isAdFree: true }));

      await waitFor(() => {
        expect(mockAd.load).not.toHaveBeenCalled();
      });
    });

    it('should skip loading on web', async () => {
      mockIsWeb.mockReturnValue(true);

      renderHook(() => useInterstitialAd({ isAdFree: false }));

      await waitFor(() => {
        expect(mockAd.load).not.toHaveBeenCalled();
      });
    });

    it('should set isReady to true when ad loads', async () => {
      const { result } = renderHook(() => useInterstitialAd({ isAdFree: false }));

      await waitFor(() => {
        expect(eventListeners.has(AdEventType.LOADED)).toBe(true);
      });

      act(() => {
        const loadedCallback = eventListeners.get(AdEventType.LOADED)!;
        loadedCallback();
      });

      await waitFor(() => {
        expect(result.current.isReady).toBe(true);
      });
    });

    it('should set isReady to false on error', async () => {
      const { result } = renderHook(() => useInterstitialAd({ isAdFree: false }));

      // First load the ad
      await waitFor(() => {
        expect(eventListeners.has(AdEventType.LOADED)).toBe(true);
      });

      act(() => {
        eventListeners.get(AdEventType.LOADED)!();
      });

      await waitFor(() => {
        expect(result.current.isReady).toBe(true);
      });

      // Then trigger error
      act(() => {
        const errorCallback = eventListeners.get(AdEventType.ERROR)!;
        errorCallback(new Error('Ad load failed'));
      });

      await waitFor(() => {
        expect(result.current.isReady).toBe(false);
      });
    });
  });

  // ============ Event Listeners ============

  describe('event listeners', () => {
    it('should register LOADED listener', async () => {
      renderHook(() => useInterstitialAd({ isAdFree: false }));

      await waitFor(() => {
        expect(mockAd.addAdEventListener).toHaveBeenCalledWith(
          AdEventType.LOADED,
          expect.any(Function)
        );
      });
    });

    it('should register OPENED listener', async () => {
      renderHook(() => useInterstitialAd({ isAdFree: false }));

      await waitFor(() => {
        expect(mockAd.addAdEventListener).toHaveBeenCalledWith(
          AdEventType.OPENED,
          expect.any(Function)
        );
      });
    });

    it('should register CLOSED listener', async () => {
      renderHook(() => useInterstitialAd({ isAdFree: false }));

      await waitFor(() => {
        expect(mockAd.addAdEventListener).toHaveBeenCalledWith(
          AdEventType.CLOSED,
          expect.any(Function)
        );
      });
    });

    it('should register ERROR listener', async () => {
      renderHook(() => useInterstitialAd({ isAdFree: false }));

      await waitFor(() => {
        expect(mockAd.addAdEventListener).toHaveBeenCalledWith(
          AdEventType.ERROR,
          expect.any(Function)
        );
      });
    });

    it('should log impression when ad opens', async () => {
      renderHook(() => useInterstitialAd({ isAdFree: false }));

      await waitFor(() => {
        expect(eventListeners.has(AdEventType.OPENED)).toBe(true);
      });

      act(() => {
        eventListeners.get(AdEventType.OPENED)!();
      });

      await waitFor(() => {
        expect(logAdImpression).toHaveBeenCalledWith('interstitial');
      });
    });

    it('should preload next ad after closing', async () => {
      renderHook(() => useInterstitialAd({ isAdFree: false }));

      await waitFor(() => {
        expect(mockAd.load).toHaveBeenCalledTimes(1);
      });

      act(() => {
        eventListeners.get(AdEventType.CLOSED)!();
      });

      await waitFor(() => {
        expect(mockAd.load).toHaveBeenCalledTimes(2);
      });
    });
  });

  // ============ Show ============

  describe('show', () => {
    it('should resolve immediately for ad-free users', async () => {
      const { result } = renderHook(() => useInterstitialAd({ isAdFree: true }));

      await act(async () => {
        const promise = result.current.show();
        await expect(promise).resolves.toBeUndefined();
      });

      expect(mockAd.show).not.toHaveBeenCalled();
    });

    it('should resolve immediately on web', async () => {
      mockIsWeb.mockReturnValue(true);

      const { result } = renderHook(() => useInterstitialAd({ isAdFree: false }));

      await act(async () => {
        const promise = result.current.show();
        await expect(promise).resolves.toBeUndefined();
      });

      expect(mockAd.show).not.toHaveBeenCalled();
    });

    it('should resolve immediately if ad not ready', async () => {
      const { result } = renderHook(() => useInterstitialAd({ isAdFree: false }));

      await waitFor(() => {
        expect(result.current.isReady).toBe(false);
      });

      await act(async () => {
        const promise = result.current.show();
        await expect(promise).resolves.toBeUndefined();
      });

      expect(mockAd.show).not.toHaveBeenCalled();
    });

    it('should show ad when ready', async () => {
      const { result } = renderHook(() => useInterstitialAd({ isAdFree: false }));

      // Load ad
      await waitFor(() => {
        expect(eventListeners.has(AdEventType.LOADED)).toBe(true);
      });

      act(() => {
        eventListeners.get(AdEventType.LOADED)!();
      });

      await waitFor(() => {
        expect(result.current.isReady).toBe(true);
      });

      // Show ad
      await act(async () => {
        const showPromise = result.current.show();
        
        // Simulate ad closing
        setTimeout(() => {
          eventListeners.get(AdEventType.CLOSED)!();
        }, 100);

        await showPromise;
      });

      expect(mockAd.show).toHaveBeenCalled();
    });

    it('should resolve on CLOSED event', async () => {
      const { result } = renderHook(() => useInterstitialAd({ isAdFree: false }));

      // Load ad
      act(() => {
        eventListeners.get(AdEventType.LOADED)!();
      });

      await waitFor(() => {
        expect(result.current.isReady).toBe(true);
      });

      // Show and close
      await act(async () => {
        const showPromise = result.current.show();
        
        // Simulate immediate close
        setTimeout(() => {
          eventListeners.get(AdEventType.CLOSED)!();
        }, 10);

        await showPromise;
      });

      expect(mockAd.show).toHaveBeenCalled();
    });

    it('should resolve on ERROR event', async () => {
      const { result } = renderHook(() => useInterstitialAd({ isAdFree: false }));

      // Load ad
      act(() => {
        eventListeners.get(AdEventType.LOADED)!();
      });

      await waitFor(() => {
        expect(result.current.isReady).toBe(true);
      });

      // Show and error
      await act(async () => {
        const showPromise = result.current.show();
        
        // Simulate error during show
        setTimeout(() => {
          eventListeners.get(AdEventType.ERROR)!(new Error('Show failed'));
        }, 10);

        await showPromise;
      });
    });

    it('should resolve on timeout', async () => {
      jest.useFakeTimers();

      const { result } = renderHook(() => useInterstitialAd({ isAdFree: false }));

      // Load ad
      act(() => {
        eventListeners.get(AdEventType.LOADED)!();
      });

      await waitFor(() => {
        expect(result.current.isReady).toBe(true);
      });

      // Show without closing (timeout scenario)
      const showPromise = act(async () => {
        return result.current.show();
      });

      // Fast-forward to trigger timeout
      act(() => {
        jest.advanceTimersByTime(31000);
      });

      await showPromise;

      jest.useRealTimers();
    });
  });

  // ============ Cleanup ============

  describe('cleanup', () => {
    it('should unsubscribe listeners on unmount', async () => {
      const unsubscribes = [jest.fn(), jest.fn(), jest.fn(), jest.fn()];
      let callCount = 0;

      mockAd.addAdEventListener = jest.fn(() => {
        return unsubscribes[callCount++];
      });

      const { unmount } = renderHook(() => useInterstitialAd({ isAdFree: false }));

      await waitFor(() => {
        expect(mockAd.addAdEventListener).toHaveBeenCalledTimes(4);
      });

      unmount();

      unsubscribes.forEach(unsub => {
        expect(unsub).toHaveBeenCalled();
      });
    });
  });
});
