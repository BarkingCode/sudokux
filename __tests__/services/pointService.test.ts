/**
 * Tests for src/services/pointService.ts
 * Point calculation and leaderboard operations.
 */

import {
  pointService,
  DIFFICULTY_POINTS,
  DIFFICULTY_POINTS_6X6,
  MISTAKE_PENALTIES,
  MISTAKE_PENALTIES_6X6,
  HELPER_PENALTIES,
  HELPER_PENALTIES_6X6,
  getPointsForDifficulty,
  getPointInfoForDifficulty,
} from '../../src/services/pointService';
import { supabase } from '../../src/lib/supabase';

describe('pointService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============ Point Constants ============

  describe('point constants', () => {
    it('should have correct 9x9 difficulty points (exponential scaling)', () => {
      expect(DIFFICULTY_POINTS.easy).toBe(10);
      expect(DIFFICULTY_POINTS.medium).toBe(25);
      expect(DIFFICULTY_POINTS.hard).toBe(50);
      expect(DIFFICULTY_POINTS.extreme).toBe(100);
      expect(DIFFICULTY_POINTS.insane).toBe(200);
      expect(DIFFICULTY_POINTS.inhuman).toBe(500);
    });

    it('should have correct 6x6 difficulty points (half of 9x9)', () => {
      expect(DIFFICULTY_POINTS_6X6.easy).toBe(5);
      expect(DIFFICULTY_POINTS_6X6.medium).toBe(12);
      expect(DIFFICULTY_POINTS_6X6.hard).toBe(25);
      expect(DIFFICULTY_POINTS_6X6.extreme).toBe(50);
      expect(DIFFICULTY_POINTS_6X6.insane).toBe(100);
      expect(DIFFICULTY_POINTS_6X6.inhuman).toBe(250);
    });

    it('should have mistake penalties for 9x9', () => {
      expect(MISTAKE_PENALTIES.easy).toBe(-1);
      expect(MISTAKE_PENALTIES.medium).toBe(-2);
      expect(MISTAKE_PENALTIES.hard).toBe(-3);
      expect(MISTAKE_PENALTIES.extreme).toBe(-4);
      expect(MISTAKE_PENALTIES.insane).toBe(-5);
      expect(MISTAKE_PENALTIES.inhuman).toBe(-6);
    });

    it('should have same mistake penalties for 6x6 (mistakes equally punished)', () => {
      expect(MISTAKE_PENALTIES_6X6.easy).toBe(-1);
      expect(MISTAKE_PENALTIES_6X6.medium).toBe(-2);
      expect(MISTAKE_PENALTIES_6X6.hard).toBe(-3);
      expect(MISTAKE_PENALTIES_6X6.extreme).toBe(-4);
      expect(MISTAKE_PENALTIES_6X6.insane).toBe(-5);
      expect(MISTAKE_PENALTIES_6X6.inhuman).toBe(-6);
    });

    it('should have helper penalties for 9x9', () => {
      expect(HELPER_PENALTIES.easy).toBe(-1);
      expect(HELPER_PENALTIES.medium).toBe(-5);
      expect(HELPER_PENALTIES.hard).toBe(-10);
      expect(HELPER_PENALTIES.extreme).toBe(-15);
      expect(HELPER_PENALTIES.insane).toBe(-25);
      expect(HELPER_PENALTIES.inhuman).toBe(-50);
    });

    it('should have helper penalties for 6x6 (half of 9x9)', () => {
      expect(HELPER_PENALTIES_6X6.easy).toBe(-1);
      expect(HELPER_PENALTIES_6X6.medium).toBe(-2);
      expect(HELPER_PENALTIES_6X6.hard).toBe(-5);
      expect(HELPER_PENALTIES_6X6.extreme).toBe(-8);
      expect(HELPER_PENALTIES_6X6.insane).toBe(-12);
      expect(HELPER_PENALTIES_6X6.inhuman).toBe(-25);
    });
  });

  // ============ getPointsForDifficulty ============

  describe('getPointsForDifficulty', () => {
    it('should return 9x9 points by default', () => {
      expect(getPointsForDifficulty('easy')).toBe(10);
      expect(getPointsForDifficulty('medium')).toBe(25);
      expect(getPointsForDifficulty('hard')).toBe(50);
    });

    it('should return 9x9 points when explicitly specified', () => {
      expect(getPointsForDifficulty('easy', '9x9')).toBe(10);
      expect(getPointsForDifficulty('medium', '9x9')).toBe(25);
    });

    it('should return 6x6 points when specified', () => {
      expect(getPointsForDifficulty('easy', '6x6')).toBe(5);
      expect(getPointsForDifficulty('medium', '6x6')).toBe(12);
      expect(getPointsForDifficulty('hard', '6x6')).toBe(25);
    });

    it('should return 0 for unknown difficulty', () => {
      expect(getPointsForDifficulty('unknown' as any)).toBe(0);
    });
  });

  // ============ getPointInfoForDifficulty ============

  describe('getPointInfoForDifficulty', () => {
    it('should return complete point info for 9x9', () => {
      const info = getPointInfoForDifficulty('medium');

      expect(info.gamePoints).toBe(25);
      expect(info.mistakePenalty).toBe(-2);
      expect(info.helperPenalty).toBe(-5);
    });

    it('should return complete point info for 6x6', () => {
      const info = getPointInfoForDifficulty('medium', '6x6');

      expect(info.gamePoints).toBe(12);
      expect(info.mistakePenalty).toBe(-2); // Same as 9x9
      expect(info.helperPenalty).toBe(-2); // Half of 9x9
    });
  });

  // ============ calculateGamePoints ============

  describe('calculateGamePoints', () => {
    it('should return points for 9x9 grids by default', () => {
      expect(pointService.calculateGamePoints('easy')).toBe(10);
      expect(pointService.calculateGamePoints('extreme')).toBe(100);
    });

    it('should return points for 6x6 grids when specified', () => {
      expect(pointService.calculateGamePoints('easy', '6x6')).toBe(5);
      expect(pointService.calculateGamePoints('extreme', '6x6')).toBe(50);
    });
  });

  // ============ getUserPoints ============

  describe('getUserPoints', () => {
    it('should return user total points from user_stats', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({
          data: { total_points: 500 },
          error: null,
        }),
      });

      const points = await pointService.getUserPoints('user-123');

      expect(points).toBe(500);
      expect(supabase.from).toHaveBeenCalledWith('user_stats');
    });

    it('should return 0 for new users without stats', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      });

      const points = await pointService.getUserPoints('user-123');

      expect(points).toBe(0);
    });

    it('should return 0 on error', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Network error' },
        }),
      });

      const points = await pointService.getUserPoints('user-123');

      expect(points).toBe(0);
    });
  });

  // ============ getGlobalLeaderboard ============

  describe('getGlobalLeaderboard', () => {
    it('should fetch global leaderboard entries', async () => {
      const mockData = [
        { user_id: 'user-1', nickname: 'Player1', country: 'US', points: 1000, rank: 1 },
        { user_id: 'user-2', nickname: 'Player2', country: 'CA', points: 800, rank: 2 },
      ];

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({
          data: mockData,
          error: null,
        }),
      });

      const entries = await pointService.getGlobalLeaderboard(50, 0);

      expect(entries).toHaveLength(2);
      expect(entries[0].userId).toBe('user-1');
      expect(entries[0].nickname).toBe('Player1');
      expect(entries[0].points).toBe(1000);
      expect(entries[0].rank).toBe(1);
    });

    it('should filter out entries without user_id or nickname', async () => {
      const mockData = [
        { user_id: 'user-1', nickname: 'Player1', country: 'US', points: 1000, rank: 1 },
        { user_id: null, nickname: 'Player2', country: 'CA', points: 800, rank: 2 },
        { user_id: 'user-3', nickname: null, country: 'UK', points: 600, rank: 3 },
      ];

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({
          data: mockData,
          error: null,
        }),
      });

      const entries = await pointService.getGlobalLeaderboard();

      expect(entries).toHaveLength(1);
      expect(entries[0].userId).toBe('user-1');
    });

    it('should return empty array on error', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error' },
        }),
      });

      const entries = await pointService.getGlobalLeaderboard();

      expect(entries).toEqual([]);
    });
  });

  // ============ getCountryLeaderboard ============

  describe('getCountryLeaderboard', () => {
    it('should fetch country-specific leaderboard', async () => {
      const mockData = [
        { user_id: 'user-1', nickname: 'Player1', country: 'US', points: 1000, rank: 1 },
        { user_id: 'user-2', nickname: 'Player2', country: 'US', points: 800, rank: 2 },
      ];

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({
          data: mockData,
          error: null,
        }),
      });

      const entries = await pointService.getCountryLeaderboard('US');

      expect(entries).toHaveLength(2);
      expect(supabase.from).toHaveBeenCalledWith('points_leaderboard_by_country');
    });
  });

  // ============ getUserPointsRank ============

  describe('getUserPointsRank', () => {
    it('should return user rank and total players', async () => {
      (supabase.rpc as jest.Mock).mockResolvedValue({
        data: [{ rank: 42, total_players: 1000 }],
        error: null,
      });

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({
          data: { total_points: 500 },
          error: null,
        }),
      });

      const rank = await pointService.getUserPointsRank('user-123');

      expect(rank.rank).toBe(42);
      expect(rank.totalPlayers).toBe(1000);
      expect(rank.points).toBe(500);
    });

    it('should support country-specific ranking', async () => {
      (supabase.rpc as jest.Mock).mockResolvedValue({
        data: [{ rank: 10, total_players: 200 }],
        error: null,
      });

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({
          data: { total_points: 500 },
          error: null,
        }),
      });

      const rank = await pointService.getUserPointsRank('user-123', 'US');

      expect(supabase.rpc).toHaveBeenCalledWith('get_user_points_rank', {
        p_user_id: 'user-123',
        p_country: 'US',
      });
    });
  });

  // ============ formatPoints ============

  describe('formatPoints', () => {
    it('should format points with thousand separators', () => {
      expect(pointService.formatPoints(1000)).toBe('1,000');
      expect(pointService.formatPoints(1234567)).toBe('1,234,567');
    });

    it('should handle small numbers', () => {
      expect(pointService.formatPoints(10)).toBe('10');
      expect(pointService.formatPoints(999)).toBe('999');
    });
  });
});
