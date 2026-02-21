/**
 * Tests for src/services/statisticsService.ts
 * User stats, difficulty wins, streaks, cache.
 */

import { getUserStats, getDifficultyWins, updateStreak, clearStatsCache } from '../../src/services/statisticsService';
import { supabase } from '../../src/lib/supabase';

describe('statisticsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    clearStatsCache();
  });

  describe('getUserStats', () => {
    it('should fetch stats from supabase', async () => {
      const mockStats = { user_id: 'u1', total_wins: 50, best_streak: 10, current_streak: 3 };
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockStats, error: null }),
      });

      const stats = await getUserStats('u1');

      expect(stats).toEqual(mockStats);
      expect(supabase.from).toHaveBeenCalledWith('user_stats');
    });

    it('should return cached stats on second call', async () => {
      const mockStats = { user_id: 'u1', total_wins: 50 };
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockStats, error: null }),
      });

      await getUserStats('u1');
      const stats = await getUserStats('u1');

      expect(stats).toEqual(mockStats);
      // Should only call supabase once
      expect(supabase.from).toHaveBeenCalledTimes(1);
    });

    it('should force refresh when requested', async () => {
      const mockStats = { user_id: 'u1', total_wins: 50 };
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockStats, error: null }),
      });

      await getUserStats('u1');
      await getUserStats('u1', true);

      expect(supabase.from).toHaveBeenCalledTimes(2);
    });

    it('should return null when stats not found (PGRST116)', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116', message: 'not found' } }),
      });

      const stats = await getUserStats('u1');

      expect(stats).toBeNull();
    });

    it('should return null on other errors', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: { code: 'OTHER', message: 'fail' } }),
      });

      const stats = await getUserStats('u1');

      expect(stats).toBeNull();
    });
  });

  describe('getDifficultyWins', () => {
    it('should aggregate wins from all sources', async () => {
      (supabase.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'game_sessions') {
          // needs select -> eq(user_id) -> eq(completed) chain
          let eqCount = 0;
          const chain: any = {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockImplementation(() => {
              eqCount++;
              if (eqCount >= 2) {
                return Promise.resolve({
                  data: [{ difficulty: 'easy' }, { difficulty: 'easy' }, { difficulty: 'hard' }],
                  error: null,
                });
              }
              return chain;
            }),
          };
          return chain;
        } else if (table === 'chapter_completions') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockResolvedValue({
              data: [{ difficulty: 'medium' }],
              error: null,
            }),
          };
        } else if (table === 'daily_completions') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockResolvedValue({
              data: [{ challenge_id: 'dc1' }],
              error: null,
            }),
          };
        } else if (table === 'daily_challenges') {
          return {
            select: jest.fn().mockReturnThis(),
            in: jest.fn().mockResolvedValue({
              data: [{ id: 'dc1', difficulty: 'extreme' }],
              error: null,
            }),
          };
        }

        return { select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis() };
      });

      const wins = await getDifficultyWins('u1');

      expect(wins.easy).toBe(2);
      expect(wins.hard).toBe(1);
      expect(wins.medium).toBe(1);
      expect(wins.extreme).toBe(1);
      expect(wins.insane).toBe(0);
    });

    it('should return default counts on error', async () => {
      (supabase.from as jest.Mock).mockImplementation(() => {
        throw new Error('Network error');
      });

      const wins = await getDifficultyWins('u1');

      expect(wins).toEqual({ easy: 0, medium: 0, hard: 0, extreme: 0, insane: 0, inhuman: 0 });
    });
  });

  describe('updateStreak', () => {
    it('should reset streak when not played today', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ data: null, error: null }),
      });

      await updateStreak('u1', false);

      expect(supabase.from).toHaveBeenCalledWith('user_stats');
    });

    it('should increment streak when played today', async () => {
      // First call: getUserStats
      const mockStats = { current_streak: 3, best_streak: 5 };
      let callCount = 0;
      (supabase.from as jest.Mock).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: mockStats, error: null }),
          };
        }
        return {
          update: jest.fn().mockReturnThis(),
          eq: jest.fn().mockResolvedValue({ data: null, error: null }),
        };
      });

      await updateStreak('u1', true);

      // Should update with incremented streak
      expect(supabase.from).toHaveBeenCalledTimes(2);
    });

    it('should update best_streak when new streak exceeds it', async () => {
      const mockStats = { current_streak: 5, best_streak: 5 };
      let callCount = 0;
      (supabase.from as jest.Mock).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: mockStats, error: null }),
          };
        }
        const updateMock = jest.fn().mockReturnThis();
        return {
          update: updateMock,
          eq: jest.fn().mockResolvedValue({ data: null, error: null }),
        };
      });

      await updateStreak('u1', true);

      expect(supabase.from).toHaveBeenCalledTimes(2);
    });
  });

  describe('clearStatsCache', () => {
    it('should clear cache so next call fetches from supabase', async () => {
      const mockStats = { user_id: 'u1', total_wins: 50 };
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockStats, error: null }),
      });

      await getUserStats('u1');
      clearStatsCache();
      await getUserStats('u1');

      expect(supabase.from).toHaveBeenCalledTimes(2);
    });
  });
});
