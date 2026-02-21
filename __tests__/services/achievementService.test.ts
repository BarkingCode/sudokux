/**
 * Tests for src/services/achievementService.ts
 * Achievement unlocking and syncing.
 */

import {
  getAchievements,
  unlockAchievement,
} from '../../src/services/achievementService';
import { supabase } from '../../src/lib/supabase';
import { achievementEvents } from '../../src/services/achievementEvents';
import { offlineQueue } from '../../src/services/offlineQueue';

jest.mock('../../src/services/achievementEvents', () => ({
  achievementEvents: {
    emit: jest.fn(),
  },
}));

jest.mock('../../src/services/offlineQueue', () => ({
  offlineQueue: {
    queueAchievement: jest.fn(),
  },
}));

describe('achievementService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============ getAchievements ============

  describe('getAchievements', () => {
    it('should return achievements from Supabase', async () => {
      const mockAchievements = [
        { id: '1', user_id: 'user-123', achievement_id: 'first_puzzle', unlocked_at: '2024-01-15' },
        { id: '2', user_id: 'user-123', achievement_id: 'games_10', unlocked_at: '2024-01-16' },
      ];

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: mockAchievements,
          error: null,
        }),
      });

      const achievements = await getAchievements('user-123');

      expect(achievements).toHaveLength(2);
      expect(achievements[0].achievement_id).toBe('first_puzzle');
      expect(supabase.from).toHaveBeenCalledWith('achievements');
    });

    it('should return empty array on error', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Network error' },
        }),
      });

      const achievements = await getAchievements('user-123');

      expect(achievements).toEqual([]);
    });

    it('should return empty array if no data', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      });

      const achievements = await getAchievements('user-123');

      expect(achievements).toEqual([]);
    });
  });

  // ============ unlockAchievement ============

  describe('unlockAchievement', () => {
    it('should return true if achievement already unlocked', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: '1', achievement_id: 'first_puzzle' },
          error: null,
        }),
      });

      const result = await unlockAchievement('user-123', 'first_puzzle');

      expect(result).toBe(true);
      // Should not try to insert again
    });

    it('should unlock achievement and emit event', async () => {
      // First query: check if exists
      const mockFrom = jest.fn()
        .mockReturnValueOnce({
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: null,
            error: { code: 'PGRST116' }, // Not found
          }),
        })
        // Second call: insert
        .mockReturnValueOnce({
          insert: jest.fn().mockResolvedValue({
            data: { id: '1' },
            error: null,
          }),
        });

      (supabase.from as jest.Mock) = mockFrom;

      const result = await unlockAchievement('user-123', 'first_puzzle');

      expect(result).toBe(true);
      expect(achievementEvents.emit).toHaveBeenCalledWith('first_puzzle');
    });

    it('should queue achievement on network error', async () => {
      const mockFrom = jest.fn()
        .mockReturnValueOnce({
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: null,
            error: { code: 'PGRST116' },
          }),
        })
        .mockReturnValueOnce({
          insert: jest.fn().mockResolvedValue({
            data: null,
            error: { message: 'network error' },
          }),
        });

      (supabase.from as jest.Mock) = mockFrom;

      const result = await unlockAchievement('user-123', 'first_puzzle');

      expect(result).toBe(false);
      expect(offlineQueue.queueAchievement).toHaveBeenCalledWith('user-123', 'first_puzzle');
    });

    it('should queue achievement on fetch error', async () => {
      const mockFrom = jest.fn()
        .mockReturnValueOnce({
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: null,
            error: { code: 'PGRST116' },
          }),
        })
        .mockReturnValueOnce({
          insert: jest.fn().mockResolvedValue({
            data: null,
            error: { message: 'Failed to fetch' },
          }),
        });

      (supabase.from as jest.Mock) = mockFrom;

      const result = await unlockAchievement('user-123', 'games_10');

      expect(result).toBe(false);
      expect(offlineQueue.queueAchievement).toHaveBeenCalledWith('user-123', 'games_10');
    });

    it('should return false and queue on exception', async () => {
      (supabase.from as jest.Mock).mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      const result = await unlockAchievement('user-123', 'first_puzzle');

      expect(result).toBe(false);
      expect(offlineQueue.queueAchievement).toHaveBeenCalledWith('user-123', 'first_puzzle');
    });
  });
});
