/**
 * Stats Service
 *
 * Handles game statistics sync with Supabase:
 * - Recording game sessions
 * - Fetching/syncing user stats
 * - Achievement tracking
 */

import { supabase } from '../lib/supabase';
import type {
  GameSession,
  GameSessionInsert,
  UserStats,
  Achievement,
  Difficulty,
} from '../lib/database.types';
import { gameCenterService, type AchievementId } from './gameCenter';
import { achievementEvents } from './achievementEvents';
import { offlineQueue } from './offlineQueue';

export interface GameResult {
  puzzleId: string;
  difficulty: Difficulty;
  timeSeconds: number;
  mistakes: number;
  hintsUsed: number;
  completed: boolean;
}

class StatsService {
  private cachedStats: UserStats | null = null;

  /**
   * Record a completed game session
   */
  async recordGame(userId: string, result: GameResult): Promise<GameSession | null> {
    try {
      const session: GameSessionInsert = {
        user_id: userId,
        puzzle_id: result.puzzleId,
        difficulty: result.difficulty,
        time_seconds: result.timeSeconds,
        mistakes: result.mistakes,
        hints_used: result.hintsUsed,
        completed: result.completed,
      };

      const { data, error } = await supabase
        .from('game_sessions')
        .insert(session)
        .select()
        .single();

      if (error) {
        console.error('Failed to record game:', error);
        return null;
      }

      // Trigger stats updates will happen via database trigger
      // Clear cached stats to force refresh
      this.cachedStats = null;

      // Check for achievements after recording
      if (result.completed) {
        await this.checkAchievements(userId, result);
      }

      return data;
    } catch (error) {
      console.error('Error recording game:', error);
      return null;
    }
  }

  /**
   * Get user stats from Supabase
   */
  async getUserStats(userId: string, forceRefresh = false): Promise<UserStats | null> {
    if (this.cachedStats && !forceRefresh) {
      return this.cachedStats;
    }

    try {
      const { data, error } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        // Stats might not exist yet
        if (error.code === 'PGRST116') {
          return null;
        }
        console.error('Failed to get user stats:', error);
        return null;
      }

      this.cachedStats = data;
      return data;
    } catch (error) {
      console.error('Error getting user stats:', error);
      return null;
    }
  }

  /**
   * Get recent game history
   */
  async getGameHistory(userId: string, limit = 10): Promise<GameSession[]> {
    try {
      const { data, error } = await supabase
        .from('game_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('completed_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Failed to get game history:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error getting game history:', error);
      return [];
    }
  }

  /**
   * Get count of completed games per difficulty
   */
  async getDifficultyWins(userId: string): Promise<Record<string, number>> {
    try {
      const { data, error } = await supabase
        .from('game_sessions')
        .select('difficulty')
        .eq('user_id', userId)
        .eq('completed', true);

      if (error) {
        console.error('Failed to get difficulty wins:', error);
        return { easy: 0, medium: 0, hard: 0 };
      }

      const counts: Record<string, number> = { easy: 0, medium: 0, hard: 0 };
      for (const session of data || []) {
        if (session.difficulty && counts[session.difficulty] !== undefined) {
          counts[session.difficulty]++;
        }
      }

      return counts;
    } catch (error) {
      console.error('Error getting difficulty wins:', error);
      return { easy: 0, medium: 0, hard: 0 };
    }
  }

  /**
   * Get user's unlocked achievements
   */
  async getAchievements(userId: string): Promise<Achievement[]> {
    try {
      const { data, error } = await supabase
        .from('achievements')
        .select('*')
        .eq('user_id', userId);

      if (error) {
        console.error('Failed to get achievements:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error getting achievements:', error);
      return [];
    }
  }

  /**
   * Unlock an achievement
   */
  async unlockAchievement(userId: string, achievementId: AchievementId): Promise<boolean> {
    try {
      // Check if already unlocked
      const { data: existing } = await supabase
        .from('achievements')
        .select('id')
        .eq('user_id', userId)
        .eq('achievement_id', achievementId)
        .single();

      if (existing) {
        return true; // Already unlocked
      }

      // Unlock in Supabase
      const { error } = await supabase
        .from('achievements')
        .insert({ user_id: userId, achievement_id: achievementId });

      if (error) {
        console.error('Failed to unlock achievement:', error);
        // Queue for later sync if network error
        if (error.message?.includes('network') || error.message?.includes('fetch')) {
          await offlineQueue.queueAchievement(userId, achievementId);
        }
        return false;
      }

      // Also unlock in Game Center
      await gameCenterService.unlockAchievement(achievementId);

      // Emit event for UI toast notification
      achievementEvents.emit(achievementId);

      return true;
    } catch (error) {
      console.error('Error unlocking achievement:', error);
      // Queue for later sync
      await offlineQueue.queueAchievement(userId, achievementId);
      return false;
    }
  }

  /**
   * Sync any queued offline achievements
   */
  async syncOfflineQueue(userId: string): Promise<void> {
    if (!offlineQueue.hasPendingItems()) return;

    const result = await offlineQueue.processQueue(
      async (queuedUserId, achievementId) => {
        if (queuedUserId !== userId) return false;

        const { error } = await supabase
          .from('achievements')
          .insert({ user_id: userId, achievement_id: achievementId });

        if (!error) {
          await gameCenterService.unlockAchievement(achievementId);
          achievementEvents.emit(achievementId);
          return true;
        }
        return false;
      }
    );

    if (result.synced > 0) {
      console.log(`Synced ${result.synced} queued achievements`);
    }
  }

  /**
   * Check and unlock achievements based on game result
   */
  private async checkAchievements(userId: string, result: GameResult): Promise<void> {
    const stats = await this.getUserStats(userId, true);
    if (!stats) return;

    const totalWins = stats.total_wins || 0;
    const currentStreak = stats.current_streak || 0;

    // Get difficulty-specific win counts
    const difficultyWins = await this.getDifficultyWins(userId);

    const achievementsToCheck: Array<{ id: AchievementId; condition: boolean }> = [
      // First puzzle
      { id: 'first_puzzle', condition: totalWins >= 1 },

      // Speed demon - Easy under 3 minutes (180 seconds)
      {
        id: 'speed_demon',
        condition: result.difficulty === 'easy' && result.timeSeconds < 180,
      },

      // Perfectionist - No mistakes
      { id: 'perfectionist', condition: result.mistakes === 0 },

      // No hints
      { id: 'no_hints', condition: result.hintsUsed === 0 },

      // Streaks
      { id: 'streak_7', condition: currentStreak >= 7 },
      { id: 'streak_30', condition: currentStreak >= 30 },

      // Game counts
      { id: 'games_10', condition: totalWins >= 10 },
      { id: 'games_50', condition: totalWins >= 50 },
      { id: 'games_100', condition: totalWins >= 100 },

      // Difficulty mastery - 20 puzzles each
      { id: 'master_easy', condition: difficultyWins.easy >= 20 },
      { id: 'master_medium', condition: difficultyWins.medium >= 20 },
      { id: 'master_hard', condition: difficultyWins.hard >= 20 },
    ];

    for (const { id, condition } of achievementsToCheck) {
      if (condition) {
        await this.unlockAchievement(userId, id);
      }
    }
  }

  /**
   * Called when a chapter is completed
   * Unlocks the chapter_complete achievement on first chapter completion
   */
  async onChapterComplete(userId: string): Promise<void> {
    await this.unlockAchievement(userId, 'chapter_complete');
  }

  /**
   * Update streak (call daily)
   */
  async updateStreak(userId: string, playedToday: boolean): Promise<void> {
    if (!playedToday) {
      // Reset streak
      await supabase
        .from('user_stats')
        .update({ current_streak: 0 })
        .eq('user_id', userId);
    } else {
      // Increment streak
      const stats = await this.getUserStats(userId);
      if (stats) {
        const newStreak = (stats.current_streak || 0) + 1;
        const bestStreak = Math.max(stats.best_streak || 0, newStreak);
        await supabase
          .from('user_stats')
          .update({ current_streak: newStreak, best_streak: bestStreak })
          .eq('user_id', userId);
      }
    }
    this.cachedStats = null;
  }

  /**
   * Clear cached stats
   */
  clearCache(): void {
    this.cachedStats = null;
  }

  /**
   * Get games for the heatmap (last 4 months)
   */
  async getHeatmapGames(userId: string): Promise<GameSession[]> {
    try {
      const fourMonthsAgo = new Date();
      fourMonthsAgo.setMonth(fourMonthsAgo.getMonth() - 4);
      fourMonthsAgo.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from('game_sessions')
        .select('*')
        .eq('user_id', userId)
        .gte('completed_at', fourMonthsAgo.toISOString())
        .order('completed_at', { ascending: true });

      if (error) {
        console.error('Failed to get heatmap games:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error getting heatmap games:', error);
      return [];
    }
  }

  /**
   * Get games for the current week (for weekly chart)
   */
  async getWeeklyGames(userId: string): Promise<GameSession[]> {
    try {
      // Calculate start of current week (Monday)
      const today = new Date();
      const dayOfWeek = today.getDay();
      const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      const monday = new Date(today);
      monday.setDate(today.getDate() + mondayOffset);
      monday.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from('game_sessions')
        .select('*')
        .eq('user_id', userId)
        .gte('completed_at', monday.toISOString())
        .order('completed_at', { ascending: true });

      if (error) {
        console.error('Failed to get weekly games:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error getting weekly games:', error);
      return [];
    }
  }
}

export const statsService = new StatsService();
