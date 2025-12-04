/**
 * Achievement Service
 *
 * Handles achievement tracking, unlocking, and syncing.
 */

import { supabase } from '../lib/supabase';
import type { Achievement, Difficulty, GridType } from '../lib/database.types';
import type { AchievementId } from '../data/achievements';
import { achievementEvents } from './achievementEvents';
import { offlineQueue } from './offlineQueue';
import { getUserStats, getDifficultyWins, clearStatsCache } from './statisticsService';
import { getGridTypeWins } from './achievementProgressService';

export interface GameResultForAchievements {
  difficulty: Difficulty;
  timeSeconds: number;
  mistakes: number;
  helperUsed: number;
  gridType?: GridType;
}

/**
 * Get user's unlocked achievements
 */
export async function getAchievements(userId: string): Promise<Achievement[]> {
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
export async function unlockAchievement(
  userId: string,
  achievementId: AchievementId
): Promise<boolean> {
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
export async function syncOfflineQueue(userId: string): Promise<void> {
  if (!offlineQueue.hasPendingItems()) return;

  const result = await offlineQueue.processQueue(
    async (queuedUserId, achievementId) => {
      if (queuedUserId !== userId) return false;

      const { error } = await supabase
        .from('achievements')
        .insert({ user_id: userId, achievement_id: achievementId });

      if (!error) {
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
export async function checkAchievements(
  userId: string,
  result: GameResultForAchievements
): Promise<void> {
  const stats = await getUserStats(userId, true);
  if (!stats) return;

  const totalWins = stats.total_wins || 0;
  const bestStreak = stats.best_streak || 0;

  // Get difficulty-specific win counts and grid type wins in parallel
  const [difficultyWins, gridTypeWins] = await Promise.all([
    getDifficultyWins(userId),
    getGridTypeWins(userId),
  ]);

  // Count unique difficulties completed
  const difficultiesCompleted = Object.values(difficultyWins).filter((c) => c > 0).length;

  const gridType = result.gridType || '9x9';

  const achievementsToCheck: Array<{ id: AchievementId; condition: boolean }> = [
    // ==========================================
    // MILESTONE ACHIEVEMENTS
    // ==========================================
    { id: 'first_puzzle', condition: totalWins >= 1 },
    { id: 'games_10', condition: totalWins >= 10 },
    { id: 'games_50', condition: totalWins >= 50 },
    { id: 'games_100', condition: totalWins >= 100 },
    { id: 'games_250', condition: totalWins >= 250 },
    { id: 'games_500', condition: totalWins >= 500 },
    { id: 'games_1000', condition: totalWins >= 1000 },

    // ==========================================
    // SKILL ACHIEVEMENTS
    // ==========================================
    // Speed demon - Easy under 3 minutes (180 seconds)
    {
      id: 'speed_demon',
      condition: result.difficulty === 'easy' && result.timeSeconds < 180,
    },
    // Swift Solver - Medium under 5 minutes (300 seconds)
    {
      id: 'speed_medium',
      condition: result.difficulty === 'medium' && result.timeSeconds < 300,
    },
    // Rapid Expert - Hard under 10 minutes (600 seconds)
    {
      id: 'speed_hard',
      condition: result.difficulty === 'hard' && result.timeSeconds < 600,
    },
    // Perfectionist - No mistakes
    { id: 'perfectionist', condition: result.mistakes === 0 },
    // No hints
    { id: 'no_hints', condition: result.helperUsed === 0 },

    // ==========================================
    // STREAK ACHIEVEMENTS
    // ==========================================
    { id: 'streak_7', condition: bestStreak >= 7 },
    { id: 'streak_30', condition: bestStreak >= 30 },
    { id: 'streak_60', condition: bestStreak >= 60 },
    { id: 'streak_90', condition: bestStreak >= 90 },

    // ==========================================
    // MASTERY ACHIEVEMENTS
    // ==========================================
    { id: 'master_easy', condition: difficultyWins.easy >= 20 },
    { id: 'master_medium', condition: difficultyWins.medium >= 20 },
    { id: 'master_hard', condition: difficultyWins.hard >= 20 },
    { id: 'master_extreme', condition: difficultyWins.extreme >= 20 },
    { id: 'master_insane', condition: difficultyWins.insane >= 20 },
    { id: 'master_inhuman', condition: difficultyWins.inhuman >= 20 },
    { id: 'all_difficulties', condition: difficultiesCompleted >= 6 },

    // ==========================================
    // GRID TYPE ACHIEVEMENTS
    // ==========================================
    { id: 'mini_first', condition: gridTypeWins['6x6'] >= 1 },
    { id: 'mini_master', condition: gridTypeWins['6x6'] >= 20 },
    {
      id: 'mini_speed',
      condition: gridType === '6x6' && result.timeSeconds < 60,
    },
    {
      id: 'grid_explorer',
      condition: gridTypeWins['6x6'] >= 1 && gridTypeWins['9x9'] >= 1,
    },
  ];

  for (const { id, condition } of achievementsToCheck) {
    if (condition) {
      await unlockAchievement(userId, id);
    }
  }
}

/**
 * Called when a chapter is completed
 * Unlocks the chapter_complete achievement on first chapter completion
 */
export async function onChapterComplete(userId: string): Promise<void> {
  await unlockAchievement(userId, 'chapter_complete');
}

/**
 * Check and unlock daily challenge achievements
 * Called after completing a daily challenge
 */
export async function checkDailyAchievements(userId: string): Promise<void> {
  try {
    // Get user stats for daily streak info
    const stats = await getUserStats(userId, true);
    const bestDailyStreak = stats?.best_daily_streak || 0;

    // Count total daily completions
    const { count, error } = await supabase
      .from('daily_completions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (error) {
      console.error('Error counting daily completions:', error);
      return;
    }

    const dailyCount = count || 0;

    const achievementsToCheck: Array<{ id: AchievementId; condition: boolean }> = [
      { id: 'daily_first', condition: dailyCount >= 1 },
      { id: 'daily_streak_7', condition: bestDailyStreak >= 7 },
      { id: 'daily_streak_30', condition: bestDailyStreak >= 30 },
    ];

    for (const { id, condition } of achievementsToCheck) {
      if (condition) {
        await unlockAchievement(userId, id);
      }
    }
  } catch (error) {
    console.error('Error checking daily achievements:', error);
  }
}
