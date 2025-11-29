/**
 * Offline queue service for storing and syncing data when back online.
 * Handles achievement unlocks, game results, and other operations that
 * fail due to network issues.
 */

import { saveData, loadData, STORAGE_KEYS } from '../utils/storage';
import type { AchievementId } from './gameCenter';

interface QueuedAchievement {
  achievementId: AchievementId;
  userId: string;
  timestamp: string;
}

interface QueuedGameResult {
  userId: string;
  puzzleId: string;
  difficulty: string;
  timeSeconds: number;
  mistakes: number;
  hintsUsed: number;
  completed: boolean;
  timestamp: string;
}

interface OfflineQueue {
  achievements: QueuedAchievement[];
  gameResults: QueuedGameResult[];
}

const QUEUE_KEY = 'offline_queue';

class OfflineQueueService {
  private queue: OfflineQueue = { achievements: [], gameResults: [] };
  private isProcessing = false;

  /**
   * Initialize the queue from storage
   */
  async initialize(): Promise<void> {
    const stored = await loadData<OfflineQueue>(QUEUE_KEY as any);
    if (stored) {
      this.queue = stored;
    }
  }

  /**
   * Save queue to storage
   */
  private async persist(): Promise<void> {
    await saveData(QUEUE_KEY as any, this.queue);
  }

  /**
   * Queue an achievement unlock for later sync
   */
  async queueAchievement(userId: string, achievementId: AchievementId): Promise<void> {
    // Avoid duplicates
    const exists = this.queue.achievements.some(
      (a) => a.userId === userId && a.achievementId === achievementId
    );

    if (!exists) {
      this.queue.achievements.push({
        userId,
        achievementId,
        timestamp: new Date().toISOString(),
      });
      await this.persist();
    }
  }

  /**
   * Queue a game result for later sync
   */
  async queueGameResult(
    userId: string,
    result: Omit<QueuedGameResult, 'userId' | 'timestamp'>
  ): Promise<void> {
    this.queue.gameResults.push({
      ...result,
      userId,
      timestamp: new Date().toISOString(),
    });
    await this.persist();
  }

  /**
   * Get pending items count
   */
  getPendingCount(): { achievements: number; gameResults: number } {
    return {
      achievements: this.queue.achievements.length,
      gameResults: this.queue.gameResults.length,
    };
  }

  /**
   * Check if there are pending items
   */
  hasPendingItems(): boolean {
    return this.queue.achievements.length > 0 || this.queue.gameResults.length > 0;
  }

  /**
   * Process the queue - sync all pending items
   * Returns true if all items were synced successfully
   */
  async processQueue(
    syncAchievement: (userId: string, achievementId: AchievementId) => Promise<boolean>,
    syncGameResult?: (userId: string, result: Omit<QueuedGameResult, 'userId' | 'timestamp'>) => Promise<boolean>
  ): Promise<{ success: boolean; synced: number; failed: number }> {
    if (this.isProcessing) {
      return { success: false, synced: 0, failed: 0 };
    }

    this.isProcessing = true;
    let synced = 0;
    let failed = 0;

    try {
      // Process achievements
      const achievementsToRemove: number[] = [];
      for (let i = 0; i < this.queue.achievements.length; i++) {
        const item = this.queue.achievements[i];
        try {
          const success = await syncAchievement(item.userId, item.achievementId);
          if (success) {
            achievementsToRemove.push(i);
            synced++;
          } else {
            failed++;
          }
        } catch {
          failed++;
        }
      }

      // Remove synced achievements (in reverse order to maintain indices)
      for (let i = achievementsToRemove.length - 1; i >= 0; i--) {
        this.queue.achievements.splice(achievementsToRemove[i], 1);
      }

      // Process game results if sync function provided
      if (syncGameResult) {
        const resultsToRemove: number[] = [];
        for (let i = 0; i < this.queue.gameResults.length; i++) {
          const item = this.queue.gameResults[i];
          try {
            const { userId, timestamp, ...result } = item;
            const success = await syncGameResult(userId, result);
            if (success) {
              resultsToRemove.push(i);
              synced++;
            } else {
              failed++;
            }
          } catch {
            failed++;
          }
        }

        // Remove synced results
        for (let i = resultsToRemove.length - 1; i >= 0; i--) {
          this.queue.gameResults.splice(resultsToRemove[i], 1);
        }
      }

      await this.persist();

      return {
        success: failed === 0,
        synced,
        failed,
      };
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Clear the queue
   */
  async clear(): Promise<void> {
    this.queue = { achievements: [], gameResults: [] };
    await this.persist();
  }
}

export const offlineQueue = new OfflineQueueService();
