/**
 * Tests for src/hooks/useRewardedAd.ts
 * Rewarded ad lifecycle with EARNED_REWARD handling.
 */

// Must use var (not const/let) for jest.mock hoisting to work
var mockEventListeners = new Map<string, Function>();
var mockAd = {
  load: jest.fn(),
  show: jest.fn(),
  addAdEventListener: jest.fn((eventType: string, callback: Function) => {
    mockEventListeners.set(eventType, callback);
    return jest.fn();
  }),
};

jest.mock('react-native-google-mobile-ads', () => ({
  RewardedAd: {
    createForAdRequest: jest.fn(() => mockAd),
  },
  AdEventType: {
    LOADED: 'loaded',
    ERROR: 'error',
    CLOSED: 'closed',
    OPENED: 'opened',
  },
  RewardedAdEventType: {
    LOADED: 'loaded',
    EARNED_REWARD: 'earned_reward',
  },
  TestIds: { REWARDED: 'test-rewarded' },
}));

jest.mock('../../src/utils/platform', () => ({
  isWeb: jest.fn(() => false),
}));

jest.mock('../../src/services/facebookAnalytics', () => ({
  logAdImpression: jest.fn(),
}));

jest.mock('../../src/config/timing', () => ({
  getAdLoadTimeout: jest.fn(() => 10000),
}));

jest.mock('../../src/utils/logger', () => ({
  createScopedLogger: jest.fn(() => ({
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  })),
}));

import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useRewardedAd } from '../../src/hooks/useRewardedAd';
import { AdEventType, RewardedAdEventType } from 'react-native-google-mobile-ads';
import { isWeb } from '../../src/utils/platform';

const mockIsWeb = isWeb as jest.MockedFunction<typeof isWeb>;

describe('useRewardedAd', () => {
  let onRewardEarned: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockIsWeb.mockReturnValue(false);
    mockEventListeners.clear();
    onRewardEarned = jest.fn();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // ============ Loading ============

  describe('loading', () => {
    it('should load ad on mount', async () => {
      renderHook(() => useRewardedAd({ isAdFree: false, onRewardEarned }));

      await waitFor(() => {
        expect(mockAd.load).toHaveBeenCalled();
      });
    });

    it('should skip loading for ad-free users', async () => {
      renderHook(() => useRewardedAd({ isAdFree: true, onRewardEarned }));

      await waitFor(() => {
        expect(mockAd.load).not.toHaveBeenCalled();
      });
    });

    it('should skip loading on web', async () => {
      mockIsWeb.mockReturnValue(true);

      renderHook(() => useRewardedAd({ isAdFree: false, onRewardEarned }));

      await waitFor(() => {
        expect(mockAd.load).not.toHaveBeenCalled();
      });
    });

    it('should set isLoading true when loading', async () => {
      const { result } = renderHook(() => useRewardedAd({ isAdFree: false, onRewardEarned }));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(true);
      });
    });

    it('should set isReady true and isLoading false when loaded', async () => {
      const { result } = renderHook(() => useRewardedAd({ isAdFree: false, onRewardEarned }));

      await waitFor(() => {
        expect(mockEventListeners.has(RewardedAdEventType.LOADED)).toBe(true);
      });

      act(() => {
        mockEventListeners.get(RewardedAdEventType.LOADED)!();
      });

      await waitFor(() => {
        expect(result.current.isReady).toBe(true);
        expect(result.current.isLoading).toBe(false);
      });
    });
  });

  // ============ EARNED_REWARD Event ============

  describe('EARNED_REWARD event', () => {
    it('should call onRewardEarned callback immediately when EARNED_REWARD fires', async () => {
      const { result } = renderHook(() => useRewardedAd({ isAdFree: false, onRewardEarned }));

      // Load ad
      act(() => {
        mockEventListeners.get(RewardedAdEventType.LOADED)!();
      });

      await waitFor(() => {
        expect(result.current.isReady).toBe(true);
      });

      // Start showing
      const showPromise = act(async () => {
        return result.current.show();
      });

      // Fire EARNED_REWARD before CLOSED
      act(() => {
        mockEventListeners.get(RewardedAdEventType.EARNED_REWARD)!({ type: 'coins', amount: 1 });
      });

      // Callback should fire immediately
      await waitFor(() => {
        expect(onRewardEarned).toHaveBeenCalledTimes(1);
      });

      // Close ad
      act(() => {
        mockEventListeners.get(AdEventType.CLOSED)!();
      });

      await showPromise;

      // Callback should still only have been called once
      expect(onRewardEarned).toHaveBeenCalledTimes(1);
    });

    it('should force resolve 5 seconds after EARNED_REWARD if CLOSED does not fire', async () => {
      const { result } = renderHook(() => useRewardedAd({ isAdFree: false, onRewardEarned }));

      // Load ad
      act(() => {
        mockEventListeners.get(RewardedAdEventType.LOADED)!();
      });

      await waitFor(() => {
        expect(result.current.isReady).toBe(true);
      });

      // Start showing
      const showPromise = act(async () => {
        return result.current.show();
      });

      // Fire EARNED_REWARD
      act(() => {
        mockEventListeners.get(RewardedAdEventType.EARNED_REWARD)!({ type: 'coins', amount: 1 });
      });

      // Don't fire CLOSED - simulate stuck ad
      // Fast-forward 5 seconds
      act(() => {
        jest.advanceTimersByTime(5000);
      });

      await act(async () => {
        await showPromise;
      });

      expect(onRewardEarned).toHaveBeenCalled();
    });
  });

  // ============ CLOSED Event ============

  describe('CLOSED event', () => {
    it('should resolve promise when CLOSED fires', async () => {
      const { result } = renderHook(() => useRewardedAd({ isAdFree: false, onRewardEarned }));

      // Load ad
      act(() => {
        mockEventListeners.get(RewardedAdEventType.LOADED)!();
      });

      await waitFor(() => {
        expect(result.current.isReady).toBe(true);
      });

      // Show ad
      const showPromise = act(async () => {
        return result.current.show();
      });

      // Earn reward and close
      act(() => {
        mockEventListeners.get(RewardedAdEventType.EARNED_REWARD)!({ type: 'coins', amount: 1 });
        mockEventListeners.get(AdEventType.CLOSED)!();
      });

      const earned = await showPromise;
      expect(earned).toBe(true);
    });

    it('should return false if closed without earning', async () => {
      const { result } = renderHook(() => useRewardedAd({ isAdFree: false, onRewardEarned }));

      // Load ad
      act(() => {
        mockEventListeners.get(RewardedAdEventType.LOADED)!();
      });

      await waitFor(() => {
        expect(result.current.isReady).toBe(true);
      });

      // Show and close without earning
      const showPromise = act(async () => {
        return result.current.show();
      });

      act(() => {
        mockEventListeners.get(AdEventType.CLOSED)!();
      });

      const earned = await showPromise;
      expect(earned).toBe(false);
      expect(onRewardEarned).not.toHaveBeenCalled();
    });

    it('should preload next ad after closing', async () => {
      const { result } = renderHook(() => useRewardedAd({ isAdFree: false, onRewardEarned }));

      await waitFor(() => {
        expect(mockAd.load).toHaveBeenCalledTimes(1);
      });

      // Load ad
      act(() => {
        mockEventListeners.get(RewardedAdEventType.LOADED)!();
      });

      await waitFor(() => {
        expect(result.current.isReady).toBe(true);
      });

      // Show and close
      await act(async () => {
        const showPromise = result.current.show();
        mockEventListeners.get(AdEventType.CLOSED)!();
        await showPromise;
      });

      await waitFor(() => {
        expect(mockAd.load).toHaveBeenCalledTimes(2);
      });
    });
  });

  // ============ Ad-Free Users ============

  describe('ad-free users', () => {
    it('should grant instant reward for ad-free users', async () => {
      const { result } = renderHook(() => useRewardedAd({ isAdFree: true, onRewardEarned }));

      await act(async () => {
        const earned = await result.current.show();
        expect(earned).toBe(true);
      });

      expect(onRewardEarned).toHaveBeenCalled();
      expect(mockAd.show).not.toHaveBeenCalled();
    });

    it('should grant instant reward on web', async () => {
      mockIsWeb.mockReturnValue(true);

      const { result } = renderHook(() => useRewardedAd({ isAdFree: false, onRewardEarned }));

      await act(async () => {
        const earned = await result.current.show();
        expect(earned).toBe(true);
      });

      expect(onRewardEarned).toHaveBeenCalled();
      expect(mockAd.show).not.toHaveBeenCalled();
    });
  });

  // ============ Multi-Show Prevention ============

  describe('multi-show prevention', () => {
    it('should prevent showing multiple ads simultaneously', async () => {
      const { result } = renderHook(() => useRewardedAd({ isAdFree: false, onRewardEarned }));

      // Load ad
      act(() => {
        mockEventListeners.get(RewardedAdEventType.LOADED)!();
      });

      await waitFor(() => {
        expect(result.current.isReady).toBe(true);
      });

      // Start first show
      const showPromise1 = act(async () => {
        return result.current.show();
      });

      // Try to show again immediately
      const earned2 = await act(async () => {
        return await result.current.show();
      });

      expect(earned2).toBe(false); // Second show rejected

      // Complete first show
      act(() => {
        mockEventListeners.get(RewardedAdEventType.EARNED_REWARD)!({ type: 'coins', amount: 1 });
        mockEventListeners.get(AdEventType.CLOSED)!();
      });

      await showPromise1;

      expect(mockAd.show).toHaveBeenCalledTimes(1); // Only first show executed
    });
  });

  // ============ Error Handling ============

  describe('error handling', () => {
    it('should resolve with false on error during show', async () => {
      const { result } = renderHook(() => useRewardedAd({ isAdFree: false, onRewardEarned }));

      // Load ad
      act(() => {
        mockEventListeners.get(RewardedAdEventType.LOADED)!();
      });

      await waitFor(() => {
        expect(result.current.isReady).toBe(true);
      });

      // Show and trigger error
      const showPromise = act(async () => {
        return result.current.show();
      });

      act(() => {
        mockEventListeners.get(AdEventType.ERROR)!(new Error('Ad show failed'));
      });

      const earned = await showPromise;
      expect(earned).toBe(false);
    });

    it('should set loading false on error', async () => {
      const { result } = renderHook(() => useRewardedAd({ isAdFree: false, onRewardEarned }));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(true);
      });

      act(() => {
        mockEventListeners.get(AdEventType.ERROR)!(new Error('Load failed'));
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
        expect(result.current.isReady).toBe(false);
      });
    });
  });

  // ============ Timeout ============

  describe('timeout', () => {
    it('should resolve on timeout if ad takes too long', async () => {
      const { result } = renderHook(() => useRewardedAd({ isAdFree: false, onRewardEarned }));

      // Load ad
      act(() => {
        mockEventListeners.get(RewardedAdEventType.LOADED)!();
      });

      await waitFor(() => {
        expect(result.current.isReady).toBe(true);
      });

      // Show without closing
      const showPromise = act(async () => {
        return result.current.show();
      });

      // Fast-forward past timeout
      act(() => {
        jest.advanceTimersByTime(100000); // Longer than 90s production timeout
      });

      await act(async () => {
        await showPromise;
      });

      // Should have resolved
    });

    it('should resolve true on timeout if reward was earned', async () => {
      const { result } = renderHook(() => useRewardedAd({ isAdFree: false, onRewardEarned }));

      // Load ad
      act(() => {
        mockEventListeners.get(RewardedAdEventType.LOADED)!();
      });

      await waitFor(() => {
        expect(result.current.isReady).toBe(true);
      });

      // Show and earn reward
      const showPromise = act(async () => {
        return result.current.show();
      });

      act(() => {
        mockEventListeners.get(RewardedAdEventType.EARNED_REWARD)!({ type: 'coins', amount: 1 });
      });

      // Don't close, let it timeout
      act(() => {
        jest.advanceTimersByTime(100000);
      });

      const earned = await showPromise;
      expect(earned).toBe(true);
    });
  });
});
