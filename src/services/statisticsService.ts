/**
 * Statistics Service
 *
 * Handles user statistics fetching and streak management.
 */

import { supabase } from '../lib/supabase';
import type { UserStats } from '../lib/database.types';

// Cached stats for performance
let cachedStats: UserStats | null = null;

/**
 * Get user stats from Supabase
 */
export async function getUserStats(
  userId: string,
  forceRefresh = false
): Promise<UserStats | null> {
  if (cachedStats && !forceRefresh) {
    return cachedStats;
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

    cachedStats = data;
    return data;
  } catch (error) {
    console.error('Error getting user stats:', error);
    return null;
  }
}

/**
 * Get count of completed games per difficulty
 * Includes game_sessions, chapter_completions, and daily_completions
 */
export async function getDifficultyWins(
  userId: string
): Promise<Record<string, number>> {
  const counts: Record<string, number> = {
    easy: 0,
    medium: 0,
    hard: 0,
    extreme: 0,
    insane: 0,
    inhuman: 0,
  };

  try {
    // Fetch from all three sources in parallel
    const [gameSessionsResult, chapterResult, dailyResult] = await Promise.all([
      supabase
        .from('game_sessions')
        .select('difficulty')
        .eq('user_id', userId)
        .eq('completed', true),
      supabase
        .from('chapter_completions' as any)
        .select('difficulty')
        .eq('user_id', userId),
      supabase
        .from('daily_completions')
        .select('challenge_id')
        .eq('user_id', userId),
    ]);

    // Count game_sessions
    if (!gameSessionsResult.error && gameSessionsResult.data) {
      for (const session of gameSessionsResult.data) {
        if (session.difficulty && counts[session.difficulty] !== undefined) {
          counts[session.difficulty]++;
        }
      }
    }

    // Count chapter_completions
    if (!chapterResult.error && chapterResult.data) {
      const chapters = chapterResult.data as unknown as { difficulty: string }[];
      for (const completion of chapters) {
        if (completion.difficulty && counts[completion.difficulty] !== undefined) {
          counts[completion.difficulty]++;
        }
      }
    }

    // Count daily_completions (need to fetch difficulty from daily_challenges)
    if (!dailyResult.error && dailyResult.data && dailyResult.data.length > 0) {
      const challengeIds = dailyResult.data.map((d) => d.challenge_id);
      const { data: challenges, error: challengeError } = await supabase
        .from('daily_challenges')
        .select('id, difficulty')
        .in('id', challengeIds);

      if (!challengeError && challenges) {
        for (const challenge of challenges) {
          if (challenge.difficulty && counts[challenge.difficulty] !== undefined) {
            counts[challenge.difficulty]++;
          }
        }
      }
    }

    return counts;
  } catch (error) {
    console.error('Error getting difficulty wins:', error);
    return counts;
  }
}

/**
 * Update streak (call daily)
 */
export async function updateStreak(
  userId: string,
  playedToday: boolean
): Promise<void> {
  if (!playedToday) {
    // Reset streak
    await supabase
      .from('user_stats')
      .update({ current_streak: 0 })
      .eq('user_id', userId);
  } else {
    // Increment streak
    const stats = await getUserStats(userId);
    if (stats) {
      const newStreak = (stats.current_streak || 0) + 1;
      const bestStreak = Math.max(stats.best_streak || 0, newStreak);
      await supabase
        .from('user_stats')
        .update({ current_streak: newStreak, best_streak: bestStreak })
        .eq('user_id', userId);
    }
  }
  cachedStats = null;
}

/**
 * Clear cached stats
 */
export function clearStatsCache(): void {
  cachedStats = null;
}
