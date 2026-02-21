/**
 * Tests for src/services/dailyLeaderboardService.ts
 * Daily leaderboard queries.
 */

import { getDailyLeaderboard, getUserDailyRank, checkLeaderboardPlacement } from '../../src/services/dailyLeaderboardService';
import { supabase } from '../../src/lib/supabase';

jest.mock('../../src/services/dailyChallengeService', () => ({
  getTodayChallenge: jest.fn(() => Promise.resolve({ id: 'challenge-today' })),
  hasCompletedToday: jest.fn(),
}));

const { getTodayChallenge } = require('../../src/services/dailyChallengeService');

describe('dailyLeaderboardService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getDailyLeaderboard', () => {
    it('should return leaderboard entries with ranks', async () => {
      const mockData = [
        { user_id: 'u1', time_seconds: 60, mistakes: 0, users: { nickname: 'Alice', country: 'US' } },
        { user_id: 'u2', time_seconds: 90, mistakes: 1, users: { nickname: 'Bob', country: 'NL' } },
      ];
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({ data: mockData, error: null }),
      });

      const result = await getDailyLeaderboard(50, 'challenge-123');

      expect(result).toHaveLength(2);
      expect(result[0].rank).toBe(1);
      expect(result[0].nickname).toBe('Alice');
      expect(result[1].rank).toBe(2);
    });

    it('should fetch today challenge if no challengeId provided', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({ data: [], error: null }),
      });

      await getDailyLeaderboard();

      expect(getTodayChallenge).toHaveBeenCalled();
    });

    it('should return empty array for fallback challenges', async () => {
      const result = await getDailyLeaderboard(50, 'fallback-123');

      expect(result).toEqual([]);
    });

    it('should return empty array when no challenge found', async () => {
      getTodayChallenge.mockResolvedValueOnce(null);

      const result = await getDailyLeaderboard();

      expect(result).toEqual([]);
    });

    it('should return empty array on error', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({ data: null, error: { message: 'fail' } }),
      });

      const result = await getDailyLeaderboard(50, 'challenge-123');

      expect(result).toEqual([]);
    });
  });

  describe('getUserDailyRank', () => {
    it('should return user rank', async () => {
      let callCount = 0;
      (supabase.from as jest.Mock).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // Get user completion
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: { time_seconds: 120 }, error: null }),
          };
        }
        // Count better times
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          lt: jest.fn().mockResolvedValue({ count: 4, error: null }),
        };
      });

      const rank = await getUserDailyRank('user-1', 'challenge-123');

      expect(rank).toBe(5);
    });

    it('should return null for fallback challenges', async () => {
      const rank = await getUserDailyRank('user-1', 'fallback-123');

      expect(rank).toBeNull();
    });

    it('should return null if user has no completion', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: null }),
      });

      const rank = await getUserDailyRank('user-1', 'challenge-123');

      expect(rank).toBeNull();
    });
  });

  describe('checkLeaderboardPlacement', () => {
    it('should return placed=true when rank is within topN', async () => {
      let callCount = 0;
      (supabase.from as jest.Mock).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: { time_seconds: 60 }, error: null }),
          };
        }
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          lt: jest.fn().mockResolvedValue({ count: 2, error: null }),
        };
      });

      const result = await checkLeaderboardPlacement('user-1', 'challenge-123', 10);

      expect(result.placed).toBe(true);
      expect(result.rank).toBe(3);
    });

    it('should return placed=false when rank is null', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: null }),
      });

      const result = await checkLeaderboardPlacement('user-1', 'challenge-123');

      expect(result.placed).toBe(false);
      expect(result.rank).toBeNull();
    });
  });
});
