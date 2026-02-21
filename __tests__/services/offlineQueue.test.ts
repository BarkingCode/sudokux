/**
 * Tests for src/services/offlineQueue.ts
 * Offline queue for achievements and game results.
 */

import { offlineQueue } from '../../src/services/offlineQueue';
import { loadData, saveData } from '../../src/utils/storage';

jest.mock('../../src/utils/storage');

const mockLoadData = loadData as jest.MockedFunction<typeof loadData>;
const mockSaveData = saveData as jest.MockedFunction<typeof saveData>;

describe('offlineQueue', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    mockLoadData.mockResolvedValue(null);
    mockSaveData.mockResolvedValue();
    
    // Reset queue state
    await offlineQueue.clear();
  });

  // ============ initialize ============

  describe('initialize', () => {
    it('should load queue from storage', async () => {
      const storedQueue = {
        achievements: [
          { userId: 'user-123', achievementId: 'first_puzzle' as any, timestamp: '2024-01-15' },
        ],
        gameResults: [],
      };

      mockLoadData.mockResolvedValue(storedQueue);

      await offlineQueue.initialize();

      const count = offlineQueue.getPendingCount();
      expect(count.achievements).toBe(1);
    });

    it('should start with empty queue if no stored data', async () => {
      mockLoadData.mockResolvedValue(null);

      await offlineQueue.initialize();

      const count = offlineQueue.getPendingCount();
      expect(count.achievements).toBe(0);
      expect(count.gameResults).toBe(0);
    });
  });

  // ============ queueAchievement ============

  describe('queueAchievement', () => {
    it('should queue achievement', async () => {
      await offlineQueue.initialize();
      await offlineQueue.queueAchievement('user-123', 'first_puzzle' as any);

      const count = offlineQueue.getPendingCount();
      expect(count.achievements).toBe(1);
      expect(mockSaveData).toHaveBeenCalled();
    });

    it('should avoid duplicate achievements', async () => {
      await offlineQueue.initialize();
      
      await offlineQueue.queueAchievement('user-123', 'first_puzzle' as any);
      await offlineQueue.queueAchievement('user-123', 'first_puzzle' as any);

      const count = offlineQueue.getPendingCount();
      expect(count.achievements).toBe(1); // Only one entry
    });

    it('should allow same achievement for different users', async () => {
      await offlineQueue.initialize();
      
      await offlineQueue.queueAchievement('user-123', 'first_puzzle' as any);
      await offlineQueue.queueAchievement('user-456', 'first_puzzle' as any);

      const count = offlineQueue.getPendingCount();
      expect(count.achievements).toBe(2);
    });

    it('should persist to storage', async () => {
      await offlineQueue.initialize();
      await offlineQueue.queueAchievement('user-123', 'games_10' as any);

      expect(mockSaveData).toHaveBeenCalled();
    });
  });

  // ============ queueGameResult ============

  describe('queueGameResult', () => {
    it('should queue game result', async () => {
      await offlineQueue.initialize();
      
      await offlineQueue.queueGameResult('user-123', {
        puzzleId: 'puzzle-1',
        difficulty: 'medium',
        timeSeconds: 300,
        mistakes: 2,
        helperUsed: 0,
        completed: true,
      });

      const count = offlineQueue.getPendingCount();
      expect(count.gameResults).toBe(1);
    });

    it('should persist to storage', async () => {
      await offlineQueue.initialize();
      
      await offlineQueue.queueGameResult('user-123', {
        puzzleId: 'puzzle-1',
        difficulty: 'easy',
        timeSeconds: 180,
        mistakes: 0,
        helperUsed: 0,
        completed: true,
      });

      expect(mockSaveData).toHaveBeenCalled();
    });
  });

  // ============ hasPendingItems ============

  describe('hasPendingItems', () => {
    it('should return false when queue is empty', async () => {
      await offlineQueue.initialize();

      expect(offlineQueue.hasPendingItems()).toBe(false);
    });

    it('should return true when achievements are queued', async () => {
      await offlineQueue.initialize();
      await offlineQueue.queueAchievement('user-123', 'first_puzzle' as any);

      expect(offlineQueue.hasPendingItems()).toBe(true);
    });

    it('should return true when game results are queued', async () => {
      await offlineQueue.initialize();
      
      await offlineQueue.queueGameResult('user-123', {
        puzzleId: 'puzzle-1',
        difficulty: 'easy',
        timeSeconds: 180,
        mistakes: 0,
        helperUsed: 0,
        completed: true,
      });

      expect(offlineQueue.hasPendingItems()).toBe(true);
    });
  });

  // ============ processQueue ============

  describe('processQueue', () => {
    it('should sync all achievements successfully', async () => {
      await offlineQueue.initialize();
      
      await offlineQueue.queueAchievement('user-123', 'first_puzzle' as any);
      await offlineQueue.queueAchievement('user-123', 'games_10' as any);

      const syncAchievement = jest.fn().mockResolvedValue(true);

      const result = await offlineQueue.processQueue(syncAchievement);

      expect(result.success).toBe(true);
      expect(result.synced).toBe(2);
      expect(result.failed).toBe(0);
      expect(syncAchievement).toHaveBeenCalledTimes(2);
    });

    it('should clear queue after successful sync', async () => {
      await offlineQueue.initialize();
      await offlineQueue.queueAchievement('user-123', 'first_puzzle' as any);

      const syncAchievement = jest.fn().mockResolvedValue(true);

      await offlineQueue.processQueue(syncAchievement);

      const count = offlineQueue.getPendingCount();
      expect(count.achievements).toBe(0);
    });

    it('should keep failed items in queue', async () => {
      await offlineQueue.initialize();
      
      await offlineQueue.queueAchievement('user-123', 'first_puzzle' as any);
      await offlineQueue.queueAchievement('user-123', 'games_10' as any);

      const syncAchievement = jest.fn()
        .mockResolvedValueOnce(true)  // First succeeds
        .mockResolvedValueOnce(false); // Second fails

      const result = await offlineQueue.processQueue(syncAchievement);

      expect(result.success).toBe(false);
      expect(result.synced).toBe(1);
      expect(result.failed).toBe(1);

      const count = offlineQueue.getPendingCount();
      expect(count.achievements).toBe(1); // Failed item still in queue
    });

    it('should not process if already processing', async () => {
      await offlineQueue.initialize();
      await offlineQueue.queueAchievement('user-123', 'first_puzzle' as any);

      const syncAchievement = jest.fn().mockImplementation(() => {
        return new Promise(resolve => setTimeout(() => resolve(true), 100));
      });

      // Start first process
      const promise1 = offlineQueue.processQueue(syncAchievement);
      
      // Try to start second process immediately
      const result2 = await offlineQueue.processQueue(syncAchievement);

      expect(result2.success).toBe(false);
      expect(result2.synced).toBe(0);

      await promise1;
    });

    it('should sync game results if sync function provided', async () => {
      await offlineQueue.initialize();
      
      await offlineQueue.queueGameResult('user-123', {
        puzzleId: 'puzzle-1',
        difficulty: 'easy',
        timeSeconds: 180,
        mistakes: 0,
        helperUsed: 0,
        completed: true,
      });

      const syncAchievement = jest.fn().mockResolvedValue(true);
      const syncGameResult = jest.fn().mockResolvedValue(true);

      const result = await offlineQueue.processQueue(syncAchievement, syncGameResult);

      expect(result.synced).toBe(1);
      expect(syncGameResult).toHaveBeenCalledWith('user-123', expect.objectContaining({
        puzzleId: 'puzzle-1',
        difficulty: 'easy',
      }));
    });

    it('should handle sync exceptions gracefully', async () => {
      await offlineQueue.initialize();
      await offlineQueue.queueAchievement('user-123', 'first_puzzle' as any);

      const syncAchievement = jest.fn().mockRejectedValue(new Error('Network error'));

      const result = await offlineQueue.processQueue(syncAchievement);

      expect(result.success).toBe(false);
      expect(result.failed).toBe(1);

      // Failed item should still be in queue
      const count = offlineQueue.getPendingCount();
      expect(count.achievements).toBe(1);
    });
  });

  // ============ clear ============

  describe('clear', () => {
    it('should clear all queued items', async () => {
      await offlineQueue.initialize();
      
      await offlineQueue.queueAchievement('user-123', 'first_puzzle' as any);
      await offlineQueue.queueGameResult('user-123', {
        puzzleId: 'puzzle-1',
        difficulty: 'easy',
        timeSeconds: 180,
        mistakes: 0,
        helperUsed: 0,
        completed: true,
      });

      await offlineQueue.clear();

      const count = offlineQueue.getPendingCount();
      expect(count.achievements).toBe(0);
      expect(count.gameResults).toBe(0);
    });

    it('should persist cleared state', async () => {
      await offlineQueue.initialize();
      await offlineQueue.queueAchievement('user-123', 'first_puzzle' as any);

      await offlineQueue.clear();

      expect(mockSaveData).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          achievements: [],
          gameResults: [],
        })
      );
    });
  });
});
