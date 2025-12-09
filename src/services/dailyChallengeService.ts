/**
 * Daily Challenge Service
 * Handles fetching daily puzzles and submitting completions.
 * The same puzzle is shared by all users worldwide each day.
 *
 * For leaderboard operations, see dailyLeaderboardService.ts
 */

import { supabase } from '../lib/supabase';
import { Difficulty, GridType } from '../game/types';
import { getLocalDateString, getYesterdayLocalDateString } from '../utils/dateUtils';

export interface DailyChallenge {
  id: string;
  challenge_date: string;
  grid_type: GridType;
  difficulty: Difficulty;
  puzzle_grid: number[][];
  solution_grid: number[][];
}

export interface DailyCompletion {
  id: string;
  user_id: string;
  challenge_id: string;
  challenge_date: string;
  time_seconds: number;
  mistakes: number;
  helper_used: number;
  completed_at: string;
}

/**
 * Get today's date in YYYY-MM-DD format (user's local timezone)
 * Daily puzzles reset at midnight in the user's local timezone.
 */
export const getTodayDateUTC = (): string => {
  return getLocalDateString();
};

/**
 * Fetch today's daily challenge from Supabase.
 * Returns null if no challenge exists or on error - caller should show retry UI.
 * No client-side fallback since daily challenges are global competitions.
 */
export const getTodayChallenge = async (): Promise<DailyChallenge | null> => {
  const today = getTodayDateUTC();

  try {
    const { data, error } = await supabase
      .from('daily_challenges')
      .select('*')
      .eq('challenge_date', today)
      .single();

    if (error) {
      if (error.code !== 'PGRST116') {
        // PGRST116 = no rows returned, which is expected if no challenge exists yet
        console.error('Error fetching daily challenge:', error);
      }
      return null;
    }

    if (!data) {
      return null;
    }

    return {
      id: data.id,
      challenge_date: data.challenge_date,
      grid_type: data.grid_type as GridType,
      difficulty: data.difficulty as Difficulty,
      puzzle_grid: data.puzzle_grid as number[][],
      solution_grid: data.solution_grid as number[][],
    };
  } catch (error) {
    console.error('Error in getTodayChallenge:', error);
    return null;
  }
};

/**
 * Check if user has already completed today's challenge
 */
export const hasCompletedToday = async (userId: string): Promise<boolean> => {
  const today = getTodayDateUTC();

  try {
    const { data, error } = await supabase
      .from('daily_completions')
      .select('id')
      .eq('user_id', userId)
      .eq('challenge_date', today)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error checking daily completion:', error);
    }

    return !!data;
  } catch (error) {
    console.error('Error in hasCompletedToday:', error);
    return false;
  }
};

/**
 * Get user's completion for today (if exists)
 */
export const getTodayCompletion = async (userId: string): Promise<DailyCompletion | null> => {
  const today = getTodayDateUTC();

  try {
    const { data, error } = await supabase
      .from('daily_completions')
      .select('*')
      .eq('user_id', userId)
      .eq('challenge_date', today)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching today completion:', error);
    }

    return data as DailyCompletion | null;
  } catch (error) {
    console.error('Error in getTodayCompletion:', error);
    return null;
  }
};

/**
 * Submit daily challenge completion
 */
export const submitDailyCompletion = async (
  userId: string,
  challenge: DailyChallenge,
  timeSeconds: number,
  mistakes: number,
  helperUsed: number
): Promise<{ success: boolean; error?: string }> => {
  const today = getTodayDateUTC();

  try {
    // Check if already completed
    const alreadyCompleted = await hasCompletedToday(userId);
    if (alreadyCompleted) {
      return { success: false, error: 'Already completed today\'s challenge' };
    }

    // Insert completion
    const { error } = await supabase
      .from('daily_completions')
      .insert({
        user_id: userId,
        challenge_id: challenge.id,
        challenge_date: today,
        time_seconds: timeSeconds,
        mistakes,
        helper_used: helperUsed,
      });

    if (error) {
      console.error('Error submitting daily completion:', error);
      return { success: false, error: error.message };
    }

    // Update daily streak
    await updateDailyStreak(userId);

    // Note: Caller should call badgeService.onDailyCompleted() to clear app badge
    return { success: true };
  } catch (error) {
    console.error('Error in submitDailyCompletion:', error);
    return { success: false, error: 'Failed to submit completion' };
  }
};

/**
 * Update user's daily streak after completing a challenge
 *
 * Streak logic:
 * - If last_daily_completed is yesterday (local time): increment streak
 * - If last_daily_completed is today (already completed): keep current streak
 * - Otherwise (first completion or missed day): reset to 1
 */
const updateDailyStreak = async (userId: string): Promise<void> => {
  const today = getLocalDateString();
  const yesterdayStr = getYesterdayLocalDateString();

  try {
    // Get current stats (use maybeSingle to handle no row case)
    const { data: stats, error: selectError } = await supabase
      .from('user_stats')
      .select('daily_streak, best_daily_streak, last_daily_completed')
      .eq('user_id', userId)
      .maybeSingle();

    if (selectError) {
      console.error('Error fetching user stats for streak:', selectError);
    }

    const lastCompleted = stats?.last_daily_completed;
    const currentStreak = stats?.daily_streak || 0;
    let newStreak = 1;
    let bestStreak = stats?.best_daily_streak || 0;

    if (lastCompleted === today) {
      // Already completed today - keep existing streak (don't reset)
      newStreak = currentStreak;
    } else if (lastCompleted === yesterdayStr) {
      // Consecutive day - increment streak
      newStreak = currentStreak + 1;
    }
    // else: first completion or missed day - streak resets to 1

    if (newStreak > bestStreak) {
      bestStreak = newStreak;
    }

    // Update stats (upsert handles both insert and update)
    const { error: upsertError } = await supabase
      .from('user_stats')
      .upsert({
        user_id: userId,
        daily_streak: newStreak,
        best_daily_streak: bestStreak,
        last_daily_completed: today,
      }, {
        onConflict: 'user_id',
      });

    if (upsertError) {
      console.error('Error upserting daily streak:', upsertError);
    }
  } catch (error) {
    console.error('Error updating daily streak:', error);
  }
};

/**
 * Get user's daily streak info
 */
export const getDailyStreakInfo = async (userId: string): Promise<{
  currentStreak: number;
  bestStreak: number;
} | null> => {
  try {
    const { data, error } = await supabase
      .from('user_stats')
      .select('daily_streak, best_daily_streak')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching streak info:', error);
    }

    if (!data) return { currentStreak: 0, bestStreak: 0 };

    return {
      currentStreak: data.daily_streak || 0,
      bestStreak: data.best_daily_streak || 0,
    };
  } catch (error) {
    console.error('Error in getDailyStreakInfo:', error);
    return null;
  }
};

/**
 * Get user's daily completion history for calendar display.
 * Returns array of completed dates for the past N months.
 */
export const getCompletionHistory = async (
  userId: string,
  monthsBack: number = 3
): Promise<Array<{ date: string; timeSeconds: number; mistakes: number }>> => {
  try {
    // Calculate start date (N months ago, first of that month)
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - monthsBack);
    startDate.setDate(1);
    const startDateStr = startDate.toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('daily_completions')
      .select('challenge_date, time_seconds, mistakes')
      .eq('user_id', userId)
      .gte('challenge_date', startDateStr)
      .order('challenge_date', { ascending: true });

    if (error) {
      console.error('Error fetching completion history:', error);
      return [];
    }

    return (data || []).map((row) => ({
      date: row.challenge_date,
      timeSeconds: row.time_seconds,
      mistakes: row.mistakes || 0,
    }));
  } catch (error) {
    console.error('Error in getCompletionHistory:', error);
    return [];
  }
};
