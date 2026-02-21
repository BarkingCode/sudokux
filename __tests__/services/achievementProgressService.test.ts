/**
 * Tests for src/services/achievementProgressService.ts
 * Achievement progress calculation.
 */

import { getAllAchievementProgress, getGridTypeWins } from '../../src/services/achievementProgressService';
import { supabase } from '../../src/lib/supabase';
import type { AchievementDefinition } from '../../src/data/achievements';

jest.mock('../../src/services/statisticsService', () => ({
  getUserStats: jest.fn(() => Promise.resolve({
    total_wins: 25,
    best_streak: 7,
    best_daily_streak: 3,
    current_streak: 2,
  })),
  getDifficultyWins: jest.fn(() => Promise.resolve({
    easy: 10,
    medium: 8,
    hard: 5,
    extreme: 2,
    insane: 0,
    inhuman: 0,
  })),
}));

const { getUserStats, getDifficultyWins } = require('../../src/services/statisticsService');

describe('achievementProgressService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getGridTypeWins', () => {
    it('should count grid type wins from game_sessions', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockImplementation(function(this: any) { return this; }),
        then: undefined,
      });
      // Need proper chaining: from -> select -> eq(user_id) -> eq(completed)
      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
      };
      // Last eq resolves
      let eqCallCount = 0;
      mockChain.eq.mockImplementation(() => {
        eqCallCount++;
        if (eqCallCount >= 2) {
          return Promise.resolve({
            data: [
              { grid_type: '9x9' },
              { grid_type: '9x9' },
              { grid_type: '6x6' },
            ],
            error: null,
          });
        }
        return mockChain;
      });
      (supabase.from as jest.Mock).mockReturnValue(mockChain);

      const result = await getGridTypeWins('user-123');

      expect(result['9x9']).toBe(2);
      expect(result['6x6']).toBe(1);
    });

    it('should return default counts on error', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
      });
      // Make the last eq return an error
      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ data: null, error: { message: 'fail' } }),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockChain);

      const result = await getGridTypeWins('user-123');

      expect(result).toEqual({ '6x6': 0, '9x9': 0 });
    });
  });

  describe('getAllAchievementProgress', () => {
    const mockAchievements: AchievementDefinition[] = [
      { id: 'wins_10', name: 'Win 10', description: '', icon: '', target: 10, progressType: 'count', progressKey: 'total_wins', category: 'games', tier: 'bronze' },
      { id: 'streak_5', name: 'Streak 5', description: '', icon: '', target: 5, progressType: 'streak', progressKey: 'best_streak', category: 'streaks', tier: 'bronze' },
      { id: 'first_win', name: 'First Win', description: '', icon: '', target: undefined as any, progressType: 'boolean', progressKey: undefined as any, category: 'games', tier: 'bronze' },
      { id: 'daily_3', name: 'Daily 3', description: '', icon: '', target: 3, progressType: 'daily_streak', progressKey: 'best_daily_streak', category: 'daily', tier: 'bronze' },
      { id: 'easy_5', name: 'Easy 5', description: '', icon: '', target: 5, progressType: 'count', progressKey: 'easy', category: 'difficulty', tier: 'bronze' },
    ] as any;

    beforeEach(() => {
      // Mock getGridTypeWins via supabase
      const gridChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ data: [{ grid_type: '9x9' }], error: null }),
      };
      // Mock getDailyCompletionCount via supabase
      const dailyChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ count: 5, error: null }),
      };

      let callCount = 0;
      (supabase.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'game_sessions') return gridChain;
        if (table === 'daily_completions') return dailyChain;
        return gridChain;
      });
    });

    it('should calculate progress for count-based achievements', async () => {
      const progressMap = await getAllAchievementProgress('user-123', mockAchievements);

      const winsProgress = progressMap.get('wins_10');
      expect(winsProgress).toBeDefined();
      expect(winsProgress!.current).toBe(25);
      expect(winsProgress!.target).toBe(10);
      expect(winsProgress!.percentage).toBe(100);
      expect(winsProgress!.showProgress).toBe(true);
    });

    it('should calculate progress for streak achievements', async () => {
      const progressMap = await getAllAchievementProgress('user-123', mockAchievements);

      const streakProgress = progressMap.get('streak_5');
      expect(streakProgress!.current).toBe(7);
      expect(streakProgress!.target).toBe(5);
      expect(streakProgress!.percentage).toBe(100);
    });

    it('should return showProgress=false for boolean achievements', async () => {
      const progressMap = await getAllAchievementProgress('user-123', mockAchievements);

      const boolProgress = progressMap.get('first_win');
      expect(boolProgress!.showProgress).toBe(false);
    });

    it('should calculate daily streak progress', async () => {
      const progressMap = await getAllAchievementProgress('user-123', mockAchievements);

      const dailyProgress = progressMap.get('daily_3');
      expect(dailyProgress!.current).toBe(3);
      expect(dailyProgress!.percentage).toBe(100);
    });

    it('should calculate difficulty-specific progress', async () => {
      const progressMap = await getAllAchievementProgress('user-123', mockAchievements);

      const easyProgress = progressMap.get('easy_5');
      expect(easyProgress!.current).toBe(10);
      expect(easyProgress!.percentage).toBe(100);
    });

    it('should return empty progress on error', async () => {
      getUserStats.mockRejectedValue(new Error('Network error'));

      const progressMap = await getAllAchievementProgress('user-123', mockAchievements);

      expect(progressMap.size).toBe(mockAchievements.length);
      const winsProgress = progressMap.get('wins_10');
      expect(winsProgress!.current).toBe(0);
    });
  });
});
