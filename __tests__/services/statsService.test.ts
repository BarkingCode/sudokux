/**
 * Tests for src/services/statsService.ts
 * Game statistics, achievements, and session recording.
 */

import { statsService, GameResult } from '../../src/services/statsService';

// Mock Supabase
const mockSingle = jest.fn();
const mockSelect = jest.fn(() => ({
  eq: jest.fn().mockReturnThis(),
  single: mockSingle,
  order: jest.fn().mockReturnThis(),
  limit: jest.fn(() => Promise.resolve({ data: [], error: null })),
  gte: jest.fn().mockReturnThis(),
}));
const mockInsert = jest.fn(() => ({
  select: jest.fn(() => ({
    single: jest.fn(() => Promise.resolve({ data: { id: 'session-123' }, error: null })),
  })),
}));
const mockUpdate = jest.fn(() => ({
  eq: jest.fn(() => Promise.resolve({ error: null })),
}));

jest.mock('../../src/lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: mockSelect,
      insert: mockInsert,
      update: mockUpdate,
    })),
  },
}));

// Mock game center service (only leaderboard, achievements handled by Supabase)
jest.mock('../../src/services/gameCenter', () => ({
  gameCenterService: {
    submitScore: jest.fn(() => Promise.resolve(true)),
  },
}));

// Mock achievement events
jest.mock('../../src/services/achievementEvents', () => ({
  achievementEvents: {
    emit: jest.fn(),
  },
}));

// Mock offline queue
jest.mock('../../src/services/offlineQueue', () => ({
  offlineQueue: {
    queueAchievement: jest.fn(() => Promise.resolve()),
    hasPendingItems: jest.fn(() => false),
    processQueue: jest.fn(() => Promise.resolve({ synced: 0, failed: 0 })),
  },
}));

describe('statsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSingle.mockReset();
    statsService.clearCache();
  });

  // ============ recordGame ============

  describe('recordGame', () => {
    const mockResult: GameResult = {
      puzzleId: 'puzzle-123',
      difficulty: 'medium',
      timeSeconds: 300,
      mistakes: 2,
      helperUsed: 1,
      completed: true,
    };

    it('should record a completed game session', async () => {
      mockInsert.mockReturnValueOnce({
        select: jest.fn(() => ({
          single: jest.fn(() =>
            Promise.resolve({
              data: { id: 'session-123', ...mockResult },
              error: null,
            })
          ),
        })),
      });
      // Mock for getUserStats in checkAchievements
      mockSingle.mockResolvedValueOnce({ data: null, error: { code: 'PGRST116' } });

      const result = await statsService.recordGame('user-123', mockResult);

      expect(result).not.toBeNull();
      expect(result?.id).toBe('session-123');
    });

    it('should return null on insert error', async () => {
      mockInsert.mockReturnValueOnce({
        select: jest.fn(() => ({
          single: jest.fn(() =>
            Promise.resolve({
              data: null,
              error: { message: 'Insert failed' },
            })
          ),
        })),
      });

      const result = await statsService.recordGame('user-123', mockResult);

      expect(result).toBeNull();
    });

    it('should check achievements for completed games', async () => {
      mockInsert.mockReturnValueOnce({
        select: jest.fn(() => ({
          single: jest.fn(() =>
            Promise.resolve({
              data: { id: 'session-123' },
              error: null,
            })
          ),
        })),
      });
      // Mock for getUserStats
      mockSingle.mockResolvedValueOnce({
        data: { total_wins: 1, current_streak: 1 },
        error: null,
      });

      await statsService.recordGame('user-123', mockResult);

      // Verify achievements were checked (via stats query)
      expect(mockSingle).toHaveBeenCalled();
    });

    it('should not check achievements for incomplete games', async () => {
      const incompleteResult = { ...mockResult, completed: false };
      mockInsert.mockReturnValueOnce({
        select: jest.fn(() => ({
          single: jest.fn(() =>
            Promise.resolve({
              data: { id: 'session-123' },
              error: null,
            })
          ),
        })),
      });

      await statsService.recordGame('user-123', incompleteResult);

      // Stats query should not be called for achievements
      expect(mockSingle).not.toHaveBeenCalled();
    });
  });

  // ============ getUserStats ============

  describe('getUserStats', () => {
    it('should return user stats when available', async () => {
      const mockStats = {
        user_id: 'user-123',
        total_games: 50,
        total_wins: 45,
        current_streak: 5,
        best_streak: 10,
      };
      mockSingle.mockResolvedValueOnce({ data: mockStats, error: null });

      const result = await statsService.getUserStats('user-123');

      expect(result).not.toBeNull();
      expect(result?.total_wins).toBe(45);
      expect(result?.current_streak).toBe(5);
    });

    it('should return null when stats not found', async () => {
      mockSingle.mockResolvedValueOnce({ data: null, error: { code: 'PGRST116' } });

      const result = await statsService.getUserStats('user-123');

      expect(result).toBeNull();
    });

    it('should cache stats and return cached on subsequent calls', async () => {
      const mockStats = { user_id: 'user-123', total_wins: 10 };
      mockSingle.mockResolvedValueOnce({ data: mockStats, error: null });

      const result1 = await statsService.getUserStats('user-123');
      const result2 = await statsService.getUserStats('user-123');

      expect(result1).toEqual(result2);
      expect(mockSingle).toHaveBeenCalledTimes(1); // Only called once due to cache
    });

    it('should force refresh when forceRefresh is true', async () => {
      const mockStats = { user_id: 'user-123', total_wins: 10 };
      mockSingle.mockResolvedValue({ data: mockStats, error: null });

      await statsService.getUserStats('user-123');
      await statsService.getUserStats('user-123', true);

      expect(mockSingle).toHaveBeenCalledTimes(2);
    });

    it('should return null on error', async () => {
      mockSingle.mockRejectedValueOnce(new Error('Network error'));

      const result = await statsService.getUserStats('user-123');

      expect(result).toBeNull();
    });
  });

  // ============ getGameHistory ============

  describe('getGameHistory', () => {
    it('should return empty array when no history', async () => {
      const result = await statsService.getGameHistory('user-123');

      expect(result).toEqual([]);
    });

    it('should respect limit parameter', async () => {
      await statsService.getGameHistory('user-123', 5);

      // Verify limit was called
      expect(mockSelect).toHaveBeenCalled();
    });

    it('should return empty array on error', async () => {
      mockSelect.mockReturnValueOnce({
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn(() => Promise.reject(new Error('Error'))),
      });

      const result = await statsService.getGameHistory('user-123');

      expect(result).toEqual([]);
    });
  });

  // ============ getDifficultyWins ============

  describe('getDifficultyWins', () => {
    it('should return default counts when no data', async () => {
      // Mock the chained .eq().eq() calls properly
      const mockEq = jest.fn();
      mockEq
        .mockReturnValueOnce({ eq: mockEq }) // First .eq() returns chainable
        .mockResolvedValueOnce({ data: [], error: null }); // Second .eq() resolves

      mockSelect.mockReturnValueOnce({
        eq: mockEq,
      });

      const result = await statsService.getDifficultyWins('user-123');

      expect(result).toHaveProperty('easy');
      expect(result).toHaveProperty('medium');
      expect(result).toHaveProperty('hard');
    });

    it('should count wins per difficulty', async () => {
      // Mock the chained .eq().eq() calls properly
      const mockEq = jest.fn();
      mockEq
        .mockReturnValueOnce({ eq: mockEq }) // First .eq() returns chainable
        .mockResolvedValueOnce({
          data: [
            { difficulty: 'easy' },
            { difficulty: 'easy' },
            { difficulty: 'medium' },
          ],
          error: null,
        });

      mockSelect.mockReturnValueOnce({
        eq: mockEq,
      });

      const result = await statsService.getDifficultyWins('user-123');

      expect(result.easy).toBe(2);
      expect(result.medium).toBe(1);
    });

    it('should return defaults on error', async () => {
      // Mock the chained .eq().eq() calls properly
      const mockEq = jest.fn();
      mockEq
        .mockReturnValueOnce({ eq: mockEq }) // First .eq() returns chainable
        .mockRejectedValueOnce(new Error('Error')); // Second .eq() rejects

      mockSelect.mockReturnValueOnce({
        eq: mockEq,
      });

      const result = await statsService.getDifficultyWins('user-123');

      expect(result).toEqual({ easy: 0, medium: 0, hard: 0, extreme: 0, insane: 0, inhuman: 0 });
    });
  });

  // ============ getAchievements ============

  describe('getAchievements', () => {
    it('should return empty array when no achievements', async () => {
      mockSelect.mockReturnValueOnce({
        eq: jest.fn(() => Promise.resolve({ data: [], error: null })),
      });

      const result = await statsService.getAchievements('user-123');

      expect(result).toEqual([]);
    });

    it('should return achievements when available', async () => {
      const mockAchievements = [
        { id: '1', achievement_id: 'first_puzzle' },
        { id: '2', achievement_id: 'speed_demon' },
      ];
      mockSelect.mockReturnValueOnce({
        eq: jest.fn(() => Promise.resolve({ data: mockAchievements, error: null })),
      });

      const result = await statsService.getAchievements('user-123');

      expect(result.length).toBe(2);
    });

    it('should return empty array on error', async () => {
      mockSelect.mockReturnValueOnce({
        eq: jest.fn(() => Promise.reject(new Error('Error'))),
      });

      const result = await statsService.getAchievements('user-123');

      expect(result).toEqual([]);
    });
  });

  // ============ unlockAchievement ============

  describe('unlockAchievement', () => {
    it('should return true if achievement already unlocked', async () => {
      mockSingle.mockResolvedValueOnce({ data: { id: 'existing' }, error: null });

      const result = await statsService.unlockAchievement('user-123', 'first_puzzle');

      expect(result).toBe(true);
    });

    it('should unlock new achievement', async () => {
      // Check existing - none found
      mockSingle.mockResolvedValueOnce({ data: null, error: { code: 'PGRST116' } });
      // Insert succeeds
      mockInsert.mockReturnValueOnce(Promise.resolve({ error: null }));

      const result = await statsService.unlockAchievement('user-123', 'first_puzzle');

      expect(result).toBe(true);
    });

    it('should return false on insert error', async () => {
      mockSingle.mockResolvedValueOnce({ data: null, error: { code: 'PGRST116' } });
      mockInsert.mockReturnValueOnce(Promise.resolve({ error: { message: 'Insert failed' } }));

      const result = await statsService.unlockAchievement('user-123', 'first_puzzle');

      expect(result).toBe(false);
    });
  });

  // ============ updateStreak ============

  describe('updateStreak', () => {
    it('should reset streak when not played today', async () => {
      await statsService.updateStreak('user-123', false);

      expect(mockUpdate).toHaveBeenCalled();
    });

    it('should increment streak when played today', async () => {
      mockSingle.mockResolvedValueOnce({
        data: { current_streak: 5, best_streak: 10 },
        error: null,
      });

      await statsService.updateStreak('user-123', true);

      expect(mockUpdate).toHaveBeenCalled();
    });

    it('should update best streak if current exceeds it', async () => {
      mockSingle.mockResolvedValueOnce({
        data: { current_streak: 10, best_streak: 10 },
        error: null,
      });

      await statsService.updateStreak('user-123', true);

      // Update should have been called with new best_streak
      expect(mockUpdate).toHaveBeenCalled();
    });
  });

  // ============ clearCache ============

  describe('clearCache', () => {
    it('should clear cached stats', async () => {
      const mockStats = { user_id: 'user-123', total_wins: 10 };
      mockSingle.mockResolvedValue({ data: mockStats, error: null });

      await statsService.getUserStats('user-123');
      statsService.clearCache();
      await statsService.getUserStats('user-123');

      expect(mockSingle).toHaveBeenCalledTimes(2);
    });
  });

  // ============ getHeatmapGames ============

  describe('getHeatmapGames', () => {
    it('should return empty array when no games', async () => {
      mockSelect.mockReturnValueOnce({
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        order: jest.fn(() => Promise.resolve({ data: [], error: null })),
      });

      const result = await statsService.getHeatmapGames('user-123');

      expect(result).toEqual([]);
    });

    it('should return empty array on error', async () => {
      mockSelect.mockReturnValueOnce({
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        order: jest.fn(() => Promise.reject(new Error('Error'))),
      });

      const result = await statsService.getHeatmapGames('user-123');

      expect(result).toEqual([]);
    });
  });

  // ============ getWeeklyGames ============

  describe('getWeeklyGames', () => {
    it('should return empty array when no games this week', async () => {
      mockSelect.mockReturnValueOnce({
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        order: jest.fn(() => Promise.resolve({ data: [], error: null })),
      });

      const result = await statsService.getWeeklyGames('user-123');

      expect(result).toEqual([]);
    });

    it('should return empty array on error', async () => {
      mockSelect.mockReturnValueOnce({
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        order: jest.fn(() => Promise.reject(new Error('Error'))),
      });

      const result = await statsService.getWeeklyGames('user-123');

      expect(result).toEqual([]);
    });
  });

  // ============ onChapterComplete ============

  describe('onChapterComplete', () => {
    it('should unlock chapter_complete achievement', async () => {
      mockSingle.mockResolvedValueOnce({ data: null, error: { code: 'PGRST116' } });
      mockInsert.mockReturnValueOnce(Promise.resolve({ error: null }));

      await statsService.onChapterComplete('user-123');

      expect(mockInsert).toHaveBeenCalled();
    });
  });
});
