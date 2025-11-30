/**
 * Achievement Service
 *
 * Handles achievement tracking, unlocking, and syncing.
 */

import { supabase } from '../lib/supabase';
import type { Achievement, Difficulty } from '../lib/database.types';
import { gameCenterService, type AchievementId } from './gameCenter';
import { achievementEvents } from './achievementEvents';
import { offlineQueue } from './offlineQueue';
import { getUserStats, getDifficultyWins, clearStatsCache } from './statisticsService';

export interface GameResultForAchievements {
  difficulty: Difficulty;
  timeSeconds: number;
  mistakes: number;
  hintsUsed: number;
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
export async function syncOfflineQueue(userId: string): Promise<void> {
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
export async function checkAchievements(
  userId: string,
  result: GameResultForAchievements
): Promise<void> {
  const stats = await getUserStats(userId, true);
  if (!stats) return;

  const totalWins = stats.total_wins || 0;
  const currentStreak = stats.current_streak || 0;

  // Get difficulty-specific win counts
  const difficultyWins = await getDifficultyWins(userId);

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
