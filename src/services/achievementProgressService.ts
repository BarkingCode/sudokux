/**
 * Achievement Progress Service
 * Calculates current progress for each achievement based on user stats.
 */

import { supabase } from '../lib/supabase';
import { getUserStats, getDifficultyWins } from './statisticsService';
import type { AchievementDefinition } from '../data/achievements';
import type { UserStats } from '../lib/database.types';

export interface AchievementProgress {
  achievementId: string;
  current: number;
  target: number;
  percentage: number;
  showProgress: boolean; // False for boolean achievements
}

/**
 * Get grid type completion counts from game_sessions
 */
async function getGridTypeWins(userId: string): Promise<Record<string, number>> {
  const counts: Record<string, number> = { '6x6': 0, '9x9': 0 };

  try {
    const { data, error } = await supabase
      .from('game_sessions')
      .select('grid_type')
      .eq('user_id', userId)
      .eq('completed', true);

    if (!error && data) {
      for (const session of data) {
        const gridType = session.grid_type || '9x9';
        counts[gridType] = (counts[gridType] || 0) + 1;
      }
    }

    return counts;
  } catch (error) {
    console.error('Error getting grid type wins:', error);
    return counts;
  }
}

/**
 * Get count of unique difficulties completed
 */
function getDifficultiesCompleted(difficultyWins: Record<string, number>): number {
  return Object.values(difficultyWins).filter((count) => count > 0).length;
}

/**
 * Get daily challenge completion count
 */
async function getDailyCompletionCount(userId: string): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('daily_completions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (error) {
      console.error('Error getting daily completion count:', error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error('Error getting daily completion count:', error);
    return 0;
  }
}

/**
 * Calculate progress for a single achievement
 */
function calculateProgress(
  achievement: AchievementDefinition,
  stats: UserStats | null,
  difficultyWins: Record<string, number>,
  gridTypeWins: Record<string, number>,
  dailyCount: number
): AchievementProgress {
  const { id, target, progressType, progressKey } = achievement;

  // Boolean achievements don't show progress
  if (progressType === 'boolean' || !target) {
    return {
      achievementId: id,
      current: 0,
      target: 0,
      percentage: 0,
      showProgress: false,
    };
  }

  let current = 0;

  switch (progressType) {
    case 'count':
      if (progressKey === 'total_wins') {
        current = stats?.total_wins || 0;
      } else if (progressKey === '6x6' || progressKey === '9x9') {
        current = gridTypeWins[progressKey] || 0;
      } else if (progressKey === 'difficulties_completed') {
        current = getDifficultiesCompleted(difficultyWins);
      } else if (progressKey) {
        // Difficulty-specific wins (easy, medium, hard, extreme, insane, inhuman)
        current = difficultyWins[progressKey] || 0;
      }
      break;

    case 'streak':
      // Use best_streak for progress toward streak achievements
      current = stats?.best_streak || 0;
      break;

    case 'daily_streak':
      // Use best_daily_streak for progress toward daily streak achievements
      current = stats?.best_daily_streak || 0;
      break;

    case 'daily_count':
      current = dailyCount;
      break;
  }

  const percentage = Math.min(100, Math.round((current / target) * 100));

  return {
    achievementId: id,
    current,
    target,
    percentage,
    showProgress: true,
  };
}

/**
 * Get progress for all achievements
 */
export async function getAllAchievementProgress(
  userId: string,
  achievements: AchievementDefinition[]
): Promise<Map<string, AchievementProgress>> {
  const progressMap = new Map<string, AchievementProgress>();

  try {
    // Fetch all required data in parallel
    const [stats, difficultyWins, gridTypeWins, dailyCount] = await Promise.all([
      getUserStats(userId, true),
      getDifficultyWins(userId),
      getGridTypeWins(userId),
      getDailyCompletionCount(userId),
    ]);

    for (const achievement of achievements) {
      const progress = calculateProgress(
        achievement,
        stats,
        difficultyWins,
        gridTypeWins,
        dailyCount
      );
      progressMap.set(achievement.id, progress);
    }
  } catch (error) {
    console.error('Error getting achievement progress:', error);
    // Return empty progress map on error
    for (const achievement of achievements) {
      progressMap.set(achievement.id, {
        achievementId: achievement.id,
        current: 0,
        target: achievement.target || 0,
        percentage: 0,
        showProgress: achievement.progressType !== 'boolean' && !!achievement.target,
      });
    }
  }

  return progressMap;
}

/**
 * Export grid type wins function for use in achievement checking
 */
export { getGridTypeWins };
