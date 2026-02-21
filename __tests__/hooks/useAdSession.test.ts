/**
 * Tests for src/hooks/useAdSession.ts
 * Ad session state management and persistence.
 */

import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useAdSession } from '../../src/hooks/useAdSession';
import { loadData, saveData } from '../../src/utils/storage';
import { INTERSTITIAL_MIN_GAMES, INTERSTITIAL_MAX_GAMES, FREERUN_GAMES_PER_SESSION } from '../../src/config/ads';

jest.mock('../../src/utils/storage');
jest.mock('../../src/utils/dateUtils', () => ({
  getLocalDateString: jest.fn(() => '2024-01-15'),
}));

const mockLoadData = loadData as jest.MockedFunction<typeof loadData>;
const mockSaveData = saveData as jest.MockedFunction<typeof saveData>;

describe('useAdSession', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLoadData.mockResolvedValue(null);
    mockSaveData.mockResolvedValue();
  });

  // ============ Initialization ============

  describe('initialization', () => {
    it('should initialize with default values', async () => {
      const { result } = renderHook(() => useAdSession(false));

      await waitFor(() => {
        expect(result.current.session.chapterGamesSinceLastAd).toBe(0);
        expect(result.current.session.freeRunGamesRemaining).toBe(FREERUN_GAMES_PER_SESSION);
        expect(result.current.isAtFreeRunLimit).toBe(false);
      });
    });

    it('should generate random interstitial threshold between min and max', async () => {
      const { result } = renderHook(() => useAdSession(false));

      await waitFor(() => {
        const threshold = result.current.session.nextInterstitialThreshold;
        expect(threshold).toBeGreaterThanOrEqual(INTERSTITIAL_MIN_GAMES);
        expect(threshold).toBeLessThanOrEqual(INTERSTITIAL_MAX_GAMES);
      });
    });

    it('should load session from storage if available', async () => {
      const savedSession = {
        chapterGamesSinceLastAd: 2,
        nextInterstitialThreshold: 3,
        freeRunGamesRemaining: 1,
        lastFreeRunResetDate: '2024-01-15',
      };
      mockLoadData.mockResolvedValue(savedSession);

      const { result } = renderHook(() => useAdSession(false));

      await waitFor(() => {
        expect(result.current.session.chapterGamesSinceLastAd).toBe(2);
        expect(result.current.session.nextInterstitialThreshold).toBe(3);
        expect(result.current.session.freeRunGamesRemaining).toBe(1);
      });
    });
  });

  // ============ Chapter Interstitial Counter ============

  describe('chapter interstitial', () => {
    it('should increment chapter count', async () => {
      const { result } = renderHook(() => useAdSession(false));

      await waitFor(() => {
        expect(result.current.session.chapterGamesSinceLastAd).toBe(0);
      });

      act(() => {
        result.current.incrementChapterCount();
      });

      await waitFor(() => {
        expect(result.current.session.chapterGamesSinceLastAd).toBe(1);
      });
    });

    it('should return new count when incrementing', async () => {
      const { result } = renderHook(() => useAdSession(false));

      await waitFor(() => {
        expect(result.current.session).toBeDefined();
      });

      let newCount = 0;
      act(() => {
        newCount = result.current.incrementChapterCount();
      });

      expect(newCount).toBe(1);
    });

    it('should reset chapter count and generate new threshold', async () => {
      mockLoadData.mockResolvedValue({
        chapterGamesSinceLastAd: 3,
        nextInterstitialThreshold: 3,
        freeRunGamesRemaining: 3,
        lastFreeRunResetDate: '2024-01-15',
      });

      const { result } = renderHook(() => useAdSession(false));

      await waitFor(() => {
        expect(result.current.session.chapterGamesSinceLastAd).toBe(3);
      });

      const oldThreshold = result.current.session.nextInterstitialThreshold;

      act(() => {
        result.current.resetChapterCount();
      });

      await waitFor(() => {
        expect(result.current.session.chapterGamesSinceLastAd).toBe(0);
        // New threshold should be generated
        expect(result.current.session.nextInterstitialThreshold).toBeGreaterThanOrEqual(INTERSTITIAL_MIN_GAMES);
        expect(result.current.session.nextInterstitialThreshold).toBeLessThanOrEqual(INTERSTITIAL_MAX_GAMES);
      });
    });

    it('should return true when threshold is reached', async () => {
      mockLoadData.mockResolvedValue({
        chapterGamesSinceLastAd: 2,
        nextInterstitialThreshold: 3,
        freeRunGamesRemaining: 3,
        lastFreeRunResetDate: '2024-01-15',
      });

      const { result } = renderHook(() => useAdSession(false));

      await waitFor(() => {
        expect(result.current.session.chapterGamesSinceLastAd).toBe(2);
      });

      const shouldShow = result.current.shouldShowInterstitial();
      expect(shouldShow).toBe(true); // 2 + 1 >= 3
    });

    it('should return false when threshold is not reached', async () => {
      mockLoadData.mockResolvedValue({
        chapterGamesSinceLastAd: 1,
        nextInterstitialThreshold: 4,
        freeRunGamesRemaining: 3,
        lastFreeRunResetDate: '2024-01-15',
      });

      const { result } = renderHook(() => useAdSession(false));

      await waitFor(() => {
        expect(result.current.session.chapterGamesSinceLastAd).toBe(1);
      });

      const shouldShow = result.current.shouldShowInterstitial();
      expect(shouldShow).toBe(false); // 1 + 1 < 4
    });

    it('should persist changes to storage', async () => {
      const { result } = renderHook(() => useAdSession(false));

      await waitFor(() => {
        expect(result.current.session).toBeDefined();
      });

      act(() => {
        result.current.incrementChapterCount();
      });

      await waitFor(() => {
        expect(mockSaveData).toHaveBeenCalled();
      });
    });
  });

  // ============ Free Run Game Limit ============

  describe('free run game limit', () => {
    it('should consume free run game and return true when games remain', async () => {
      const { result } = renderHook(() => useAdSession(false));

      await waitFor(() => {
        expect(result.current.freeRunGamesRemaining).toBe(FREERUN_GAMES_PER_SESSION);
      });

      let canPlay = false;
      act(() => {
        canPlay = result.current.consumeFreeRunGame();
      });

      expect(canPlay).toBe(true);

      await waitFor(() => {
        expect(result.current.freeRunGamesRemaining).toBe(FREERUN_GAMES_PER_SESSION - 1);
      });
    });

    it('should return false when at limit', async () => {
      mockLoadData.mockResolvedValue({
        chapterGamesSinceLastAd: 0,
        nextInterstitialThreshold: 3,
        freeRunGamesRemaining: 0,
        lastFreeRunResetDate: '2024-01-15',
      });

      const { result } = renderHook(() => useAdSession(false));

      await waitFor(() => {
        expect(result.current.freeRunGamesRemaining).toBe(0);
        expect(result.current.isAtFreeRunLimit).toBe(true);
      });

      let canPlay = false;
      act(() => {
        canPlay = result.current.consumeFreeRunGame();
      });

      expect(canPlay).toBe(false);
    });

    it('should add games after watching ad', async () => {
      mockLoadData.mockResolvedValue({
        chapterGamesSinceLastAd: 0,
        nextInterstitialThreshold: 3,
        freeRunGamesRemaining: 0,
        lastFreeRunResetDate: '2024-01-15',
      });

      const { result } = renderHook(() => useAdSession(false));

      await waitFor(() => {
        expect(result.current.freeRunGamesRemaining).toBe(0);
      });

      act(() => {
        result.current.addFreeRunGames();
      });

      await waitFor(() => {
        expect(result.current.freeRunGamesRemaining).toBe(FREERUN_GAMES_PER_SESSION);
      });
    });

    it('should accumulate games when adding multiple times', async () => {
      const { result } = renderHook(() => useAdSession(false));

      await waitFor(() => {
        expect(result.current.freeRunGamesRemaining).toBe(FREERUN_GAMES_PER_SESSION);
      });

      act(() => {
        result.current.addFreeRunGames();
      });

      await waitFor(() => {
        expect(result.current.freeRunGamesRemaining).toBe(FREERUN_GAMES_PER_SESSION * 2);
      });
    });
  });

  // ============ Daily Reset ============

  describe('daily reset', () => {
    it('should reset free run games at midnight', async () => {
      const { getLocalDateString } = require('../../src/utils/dateUtils');
      
      mockLoadData.mockResolvedValue({
        chapterGamesSinceLastAd: 2,
        nextInterstitialThreshold: 3,
        freeRunGamesRemaining: 0,
        lastFreeRunResetDate: '2024-01-14',
      });

      // Mock today as different day
      getLocalDateString.mockReturnValue('2024-01-15');

      const { result } = renderHook(() => useAdSession(false));

      let didReset = false;
      await waitFor(() => {
        // Check if reset happened automatically
        if (result.current.freeRunGamesRemaining === FREERUN_GAMES_PER_SESSION) {
          didReset = true;
        }
      });

      expect(didReset).toBe(true);
    });

    it('should not reset if same day', async () => {
      const { getLocalDateString } = require('../../src/utils/dateUtils');
      
      mockLoadData.mockResolvedValue({
        chapterGamesSinceLastAd: 2,
        nextInterstitialThreshold: 3,
        freeRunGamesRemaining: 1,
        lastFreeRunResetDate: '2024-01-15',
      });

      getLocalDateString.mockReturnValue('2024-01-15');

      const { result } = renderHook(() => useAdSession(false));

      await waitFor(() => {
        expect(result.current.freeRunGamesRemaining).toBe(1);
      });

      act(() => {
        const didReset = result.current.checkAndResetDaily();
        expect(didReset).toBe(false);
      });
    });

    it('should return true when reset occurs', async () => {
      const { getLocalDateString } = require('../../src/utils/dateUtils');
      
      mockLoadData.mockResolvedValue({
        chapterGamesSinceLastAd: 0,
        nextInterstitialThreshold: 3,
        freeRunGamesRemaining: 0,
        lastFreeRunResetDate: '2024-01-14',
      });

      getLocalDateString.mockReturnValue('2024-01-15');

      const { result } = renderHook(() => useAdSession(false));

      await waitFor(() => {
        expect(result.current.session).toBeDefined();
      });

      let didReset = false;
      act(() => {
        didReset = result.current.checkAndResetDaily();
      });

      expect(didReset).toBe(true);
    });
  });

  // ============ Ad-Free Users ============

  describe('ad-free users', () => {
    it('should still track session state for ad-free users', async () => {
      const { result } = renderHook(() => useAdSession(true));

      await waitFor(() => {
        expect(result.current.session).toBeDefined();
        expect(result.current.session.chapterGamesSinceLastAd).toBe(0);
      });

      // Session should still work, just ads won't show
      act(() => {
        result.current.incrementChapterCount();
      });

      await waitFor(() => {
        expect(result.current.session.chapterGamesSinceLastAd).toBe(1);
      });
    });
  });
});
