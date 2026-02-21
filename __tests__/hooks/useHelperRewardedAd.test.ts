/**
 * Tests for src/hooks/useHelperRewardedAd.ts
 * Helper-specific rewarded ad - does NOT grant free-run games.
 */

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
import { useHelperRewardedAd } from '../../src/hooks/useHelperRewardedAd';
import { AdEventType, RewardedAdEventType } from 'react-native-google-mobile-ads';
import { isWeb } from '../../src/utils/platform';
import { logAdImpression } from '../../src/services/facebookAnalytics';

const mockIsWeb = isWeb as jest.MockedFunction<typeof isWeb>;

describe('useHelperRewardedAd', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockIsWeb.mockReturnValue(false);
    mockEventListeners.clear();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // ============ Initialization ============

  describe('initialization', () => {
    it('should load ad on mount', async () => {
      renderHook(() => useHelperRewardedAd({ isAdFree: false }));

      await waitFor(() => {
        expect(mockAd.load).toHaveBeenCalled();
      });
    });

    it('should skip loading for ad-free users', async () => {
      renderHook(() => useHelperRewardedAd({ isAdFree: true }));

      await waitFor(() => {
        expect(mockAd.load).not.toHaveBeenCalled();
      });
    });

    it('should skip loading on web', async () => {
      mockIsWeb.mockReturnValue(true);

      renderHook(() => useHelperRewardedAd({ isAdFree: false }));

      await waitFor(() => {
        expect(mockAd.load).not.toHaveBeenCalled();
      });
    });

    it('should log impression when ad opens', async () => {
      renderHook(() => useHelperRewardedAd({ isAdFree: false }));

      await waitFor(() => {
        expect(mockEventListeners.has(AdEventType.OPENED)).toBe(true);
      });

      act(() => {
        mockEventListeners.get(AdEventType.OPENED)!();
      });

      await waitFor(() => {
        expect(logAdImpression).toHaveBeenCalledWith('rewarded_helper');
      });
    });
  });

  // ============ Ad-Free Users ============

  describe('ad-free users', () => {
    it('should instantly resolve true for ad-free users', async () => {
      const { result } = renderHook(() => useHelperRewardedAd({ isAdFree: true }));

      await act(async () => {
        const unlocked = await result.current.show();
        expect(unlocked).toBe(true);
      });

      expect(mockAd.show).not.toHaveBeenCalled();
    });

    it('should instantly resolve true on web', async () => {
      mockIsWeb.mockReturnValue(true);

      const { result } = renderHook(() => useHelperRewardedAd({ isAdFree: false }));

      await act(async () => {
        const unlocked = await result.current.show();
        expect(unlocked).toBe(true);
      });

      expect(mockAd.show).not.toHaveBeenCalled();
    });
  });

  // ============ Show Behavior ============

  describe('show behavior', () => {
    it('should return true when reward is earned', async () => {
      const { result } = renderHook(() => useHelperRewardedAd({ isAdFree: false }));

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
        mockEventListeners.get(RewardedAdEventType.EARNED_REWARD)!({ type: 'unlock', amount: 1 });
        mockEventListeners.get(AdEventType.CLOSED)!();
      });

      const unlocked = await showPromise;
      expect(unlocked).toBe(true);
    });

    it('should return false when closed without earning', async () => {
      const { result } = renderHook(() => useHelperRewardedAd({ isAdFree: false }));

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

      const unlocked = await showPromise;
      expect(unlocked).toBe(false);
    });

    it('should resolve false if ad not ready', async () => {
      const { result } = renderHook(() => useHelperRewardedAd({ isAdFree: false }));

      await waitFor(() => {
        expect(result.current.isReady).toBe(false);
      });

      const unlocked = await act(async () => {
        return await result.current.show();
      });

      expect(unlocked).toBe(false);
      expect(mockAd.show).not.toHaveBeenCalled();
    });
  });

  // ============ EARNED_REWARD Behavior ============

  describe('EARNED_REWARD behavior', () => {
    it('should force resolve 5 seconds after EARNED_REWARD if CLOSED does not fire', async () => {
      const { result } = renderHook(() => useHelperRewardedAd({ isAdFree: false }));

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

      // Fire EARNED_REWARD but not CLOSED
      act(() => {
        mockEventListeners.get(RewardedAdEventType.EARNED_REWARD)!({ type: 'unlock', amount: 1 });
      });

      // Fast-forward 5 seconds
      act(() => {
        jest.advanceTimersByTime(5000);
      });

      const unlocked = await showPromise;
      expect(unlocked).toBe(true);
    });

    it('should not double-resolve if CLOSED fires after forced resolve', async () => {
      const { result } = renderHook(() => useHelperRewardedAd({ isAdFree: false }));

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
        mockEventListeners.get(RewardedAdEventType.EARNED_REWARD)!({ type: 'unlock', amount: 1 });
      });

      // Force resolve via timeout
      act(() => {
        jest.advanceTimersByTime(5000);
      });

      const unlocked = await showPromise;
      expect(unlocked).toBe(true);

      // Now fire CLOSED - should not cause issues
      act(() => {
        mockEventListeners.get(AdEventType.CLOSED)!();
      });

      // Should not throw or cause errors
    });
  });

  // ============ Multi-Show Prevention ============

  describe('multi-show prevention', () => {
    it('should prevent showing multiple ads simultaneously', async () => {
      const { result } = renderHook(() => useHelperRewardedAd({ isAdFree: false }));

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
      const unlocked2 = await act(async () => {
        return await result.current.show();
      });

      expect(unlocked2).toBe(false); // Second show rejected

      // Complete first show
      act(() => {
        mockEventListeners.get(RewardedAdEventType.EARNED_REWARD)!({ type: 'unlock', amount: 1 });
        mockEventListeners.get(AdEventType.CLOSED)!();
      });

      await showPromise1;

      expect(mockAd.show).toHaveBeenCalledTimes(1);
    });
  });

  // ============ Loading State ============

  describe('loading state', () => {
    it('should set isLoading true when loading', async () => {
      const { result } = renderHook(() => useHelperRewardedAd({ isAdFree: false }));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(true);
      });
    });

    it('should set isLoading false when loaded', async () => {
      const { result } = renderHook(() => useHelperRewardedAd({ isAdFree: false }));

      act(() => {
        mockEventListeners.get(RewardedAdEventType.LOADED)!();
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
        expect(result.current.isReady).toBe(true);
      });
    });

    it('should set isLoading false on error', async () => {
      const { result } = renderHook(() => useHelperRewardedAd({ isAdFree: false }));

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

  // ============ Error Handling ============

  describe('error handling', () => {
    it('should resolve false on error during show', async () => {
      const { result } = renderHook(() => useHelperRewardedAd({ isAdFree: false }));

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

      const unlocked = await showPromise;
      expect(unlocked).toBe(false);
    });
  });

  // ============ Preload After Close ============

  describe('preload after close', () => {
    it('should preload next ad after closing', async () => {
      const { result } = renderHook(() => useHelperRewardedAd({ isAdFree: false }));

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
});
