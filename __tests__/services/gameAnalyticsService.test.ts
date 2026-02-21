/**
 * Tests for src/services/gameAnalyticsService.ts
 * Game analytics data aggregation.
 */

import { getHeatmapGames, getWeeklyGames } from '../../src/services/gameAnalyticsService';
import { supabase } from '../../src/lib/supabase';

describe('gameAnalyticsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const setupMocks = (gameSessions: any[], chapters: any[], dailies: any[], challenges: any[] = []) => {
    let callCount = 0;
    (supabase.from as jest.Mock).mockImplementation((table: string) => {
      const chain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
      };

      if (table === 'game_sessions') {
        chain.order = jest.fn().mockResolvedValue({ data: gameSessions, error: null });
      } else if (table === 'chapter_completions') {
        chain.order = jest.fn().mockResolvedValue({ data: chapters, error: null });
      } else if (table === 'daily_completions') {
        chain.order = jest.fn().mockResolvedValue({ data: dailies, error: null });
      } else if (table === 'daily_challenges') {
        // For the in() query to get difficulties
        chain.in = jest.fn().mockResolvedValue({ data: challenges, error: null });
      }

      return chain;
    });
  };

  describe('getHeatmapGames', () => {
    it('should aggregate games from all sources', async () => {
      setupMocks(
        [{ id: 'gs1', user_id: 'u1', completed_at: '2024-01-15T10:00:00Z', difficulty: 'easy', time_seconds: 60 }],
        [{ id: 'ch1', user_id: 'u1', completed_at: '2024-01-16T10:00:00Z', difficulty: 'medium', time_seconds: 90, mistakes: 0, helper_used: 0, created_at: '2024-01-16', puzzle_number: 1 }],
        [{ id: 'dc1', user_id: 'u1', completed_at: '2024-01-17T10:00:00Z', time_seconds: 120, mistakes: 1, helper_used: 0, challenge_id: 'ch-1' }],
        [{ id: 'ch-1', difficulty: 'hard' }]
      );

      const result = await getHeatmapGames('u1');

      expect(result.length).toBeGreaterThanOrEqual(1);
    });

    it('should return empty array on error', async () => {
      (supabase.from as jest.Mock).mockImplementation(() => {
        throw new Error('Network error');
      });

      const result = await getHeatmapGames('u1');

      expect(result).toEqual([]);
    });

    it('should handle empty results from all sources', async () => {
      setupMocks([], [], []);

      const result = await getHeatmapGames('u1');

      expect(result).toEqual([]);
    });
  });

  describe('getWeeklyGames', () => {
    it('should aggregate weekly games from all sources', async () => {
      setupMocks(
        [{ id: 'gs1', user_id: 'u1', completed_at: new Date().toISOString(), difficulty: 'easy', time_seconds: 60 }],
        [],
        []
      );

      const result = await getWeeklyGames('u1');

      expect(result.length).toBeGreaterThanOrEqual(1);
    });

    it('should return empty array on error', async () => {
      (supabase.from as jest.Mock).mockImplementation(() => {
        throw new Error('fail');
      });

      const result = await getWeeklyGames('u1');

      expect(result).toEqual([]);
    });
  });
});
