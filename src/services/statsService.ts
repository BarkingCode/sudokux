/**
 * Stats Service
 *
 * Unified interface for game statistics. This module re-exports functionality
 * from focused services for backwards compatibility.
 *
 * For new code, prefer importing directly from the specific services:
 * - gameSessionService: Recording and retrieving game sessions
 * - statisticsService: User stats and streaks
 * - achievementService: Achievement tracking
 * - gameAnalyticsService: Heatmap and weekly data
 */

// Re-export types
export type { GameResult } from './gameSessionService';
export type { GameResultForAchievements } from './achievementService';

// Import from split services
import { recordGameSession, getGameHistory, type GameResult } from './gameSessionService';
import { getUserStats, getDifficultyWins, updateStreak, clearStatsCache } from './statisticsService';
import {
  getAchievements,
  unlockAchievement,
  syncOfflineQueue,
  checkAchievements,
  onChapterComplete,
} from './achievementService';
import { getHeatmapGames, getWeeklyGames } from './gameAnalyticsService';

// Types
import type { GameSession, UserStats, Achievement } from '../lib/database.types';
import type { AchievementId } from './gameCenter';

/**
 * Unified StatsService class for backwards compatibility.
 * Wraps the split service functions.
 */
class StatsService {
  /**
   * Record a completed game session
   */
  async recordGame(userId: string, result: GameResult): Promise<GameSession | null> {
    const session = await recordGameSession(userId, result);

    // Clear cached stats to force refresh
    clearStatsCache();

    // Check for achievements after recording
    if (result.completed && session) {
      await checkAchievements(userId, result);
    }

    return session;
  }

  /**
   * Get user stats from Supabase
   */
  async getUserStats(userId: string, forceRefresh = false): Promise<UserStats | null> {
    return getUserStats(userId, forceRefresh);
  }

  /**
   * Get recent game history
   */
  async getGameHistory(userId: string, limit = 10): Promise<GameSession[]> {
    return getGameHistory(userId, limit);
  }

  /**
   * Get count of completed games per difficulty
   */
  async getDifficultyWins(userId: string): Promise<Record<string, number>> {
    return getDifficultyWins(userId);
  }

  /**
   * Get user's unlocked achievements
   */
  async getAchievements(userId: string): Promise<Achievement[]> {
    return getAchievements(userId);
  }

  /**
   * Unlock an achievement
   */
  async unlockAchievement(userId: string, achievementId: AchievementId): Promise<boolean> {
    return unlockAchievement(userId, achievementId);
  }

  /**
   * Sync any queued offline achievements
   */
  async syncOfflineQueue(userId: string): Promise<void> {
    return syncOfflineQueue(userId);
  }

  /**
   * Called when a chapter is completed
   */
  async onChapterComplete(userId: string): Promise<void> {
    return onChapterComplete(userId);
  }

  /**
   * Update streak (call daily)
   */
  async updateStreak(userId: string, playedToday: boolean): Promise<void> {
    return updateStreak(userId, playedToday);
  }

  /**
   * Clear cached stats
   */
  clearCache(): void {
    clearStatsCache();
  }

  /**
   * Get games for the heatmap (last 4 months)
   */
  async getHeatmapGames(userId: string): Promise<GameSession[]> {
    return getHeatmapGames(userId);
  }

  /**
   * Get games for the current week (for weekly chart)
   */
  async getWeeklyGames(userId: string): Promise<GameSession[]> {
    return getWeeklyGames(userId);
  }
}

export const statsService = new StatsService();
