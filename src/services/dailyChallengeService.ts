/**
 * Daily Challenge Service
 * Handles fetching daily puzzles and submitting completions.
 * The same puzzle is shared by all users worldwide each day.
 *
 * For leaderboard operations, see dailyLeaderboardService.ts
 */

import { supabase } from '../lib/supabase';
import { generatePuzzle } from '../game/generator';
import { Difficulty, GridType } from '../game/types';
import { getLocalDateString, getYesterdayLocalDateString } from '../utils/dateUtils';

// Re-export leaderboard functions for backwards compatibility
export {
  getDailyLeaderboard,
  getUserDailyRank,
  checkLeaderboardPlacement,
  type DailyLeaderboardEntry,
} from './dailyLeaderboardService';

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
  hints_used: number;
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
 * Get the difficulty for today based on day of week rotation
 * Mon/Tue: Easy, Wed/Thu: Medium, Fri/Sat: Hard, Sun: Extreme
 */
const getDifficultyForDate = (date: Date): Difficulty => {
  const dayOfWeek = date.getDay(); // Use local day of week (0 = Sunday)
  switch (dayOfWeek) {
    case 0: return 'extreme'; // Sunday - challenge day
    case 1:
    case 2: return 'easy';    // Mon, Tue
    case 3:
    case 4: return 'medium';  // Wed, Thu
    case 5:
    case 6: return 'hard';    // Fri, Sat
    default: return 'medium';
  }
};

/**
 * Fetch today's daily challenge from Supabase
 * If no challenge exists for today, generates one client-side as fallback
 */
export const getTodayChallenge = async (): Promise<DailyChallenge | null> => {
  const today = getTodayDateUTC();

  try {
    // Try to fetch from Supabase
    const { data, error } = await supabase
      .from('daily_challenges')
      .select('*')
      .eq('challenge_date', today)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows returned, which is expected if no challenge exists
      console.error('Error fetching daily challenge:', error);
    }

    if (data) {
      return {
        id: data.id,
        challenge_date: data.challenge_date,
        grid_type: data.grid_type as GridType,
        difficulty: data.difficulty as Difficulty,
        puzzle_grid: data.puzzle_grid as number[][],
        solution_grid: data.solution_grid as number[][],
      };
    }

    // Fallback: Generate puzzle client-side if none exists
    // This ensures offline-first capability
    console.log('No daily challenge found, generating fallback...');
    return generateFallbackChallenge(today);
  } catch (error) {
    console.error('Error in getTodayChallenge:', error);
    // Offline fallback
    return generateFallbackChallenge(today);
  }
};

/**
 * Generate a deterministic UUID from a string
 * Creates a valid UUID v4-like format that's consistent for the same input
 */
const generateDeterministicUUID = (input: string): string => {
  // Create multiple hashes to fill all UUID positions
  const hashes: number[] = [];
  for (let j = 0; j < 4; j++) {
    let hash = j * 12345; // Different seed for each segment
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char + j;
      hash = hash & hash;
    }
    hashes.push(Math.abs(hash));
  }

  // Convert to hex strings
  const hexParts = hashes.map((h) => h.toString(16).padStart(8, '0'));

  // Format as UUID: xxxxxxxx-xxxx-4xxx-axxx-xxxxxxxxxxxx
  // Version 4 UUID format with deterministic values
  return [
    hexParts[0].slice(0, 8),
    hexParts[1].slice(0, 4),
    '4' + hexParts[1].slice(5, 8), // Version 4
    'a' + hexParts[2].slice(1, 4), // Variant
    hexParts[2].slice(4, 8) + hexParts[3].slice(0, 8),
  ].join('-');
};

/**
 * Generate a fallback daily challenge client-side
 * Uses date as seed for consistent puzzle across users
 */
const generateFallbackChallenge = (dateStr: string): DailyChallenge => {
  const date = new Date(dateStr);
  const difficulty = getDifficultyForDate(date);
  const gridType: GridType = '9x9'; // Daily is always 9x9

  // Generate puzzle
  const puzzle = generatePuzzle(gridType, difficulty);

  // Generate a deterministic UUID for the fallback challenge
  // This ensures the ID is valid for database insertion
  const fallbackId = generateDeterministicUUID(`fallback-daily-${dateStr}`);

  return {
    id: fallbackId,
    challenge_date: dateStr,
    grid_type: gridType,
    difficulty,
    puzzle_grid: puzzle.puzzle,
    solution_grid: puzzle.solution,
  };
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
 * Ensure a daily challenge exists in the database (for fallback challenges)
 * This is needed because daily_completions has a foreign key to daily_challenges
 */
const ensureChallengeExists = async (challenge: DailyChallenge): Promise<boolean> => {
  try {
    // Check if challenge exists
    const { data: existing } = await supabase
      .from('daily_challenges')
      .select('id')
      .eq('challenge_date', challenge.challenge_date)
      .single();

    if (existing) {
      return true; // Already exists
    }

    // Insert the fallback challenge
    const { error } = await supabase
      .from('daily_challenges')
      .insert({
        id: challenge.id,
        challenge_date: challenge.challenge_date,
        grid_type: challenge.grid_type,
        difficulty: challenge.difficulty,
        puzzle_grid: challenge.puzzle_grid,
        solution_grid: challenge.solution_grid,
      });

    if (error) {
      // Ignore unique constraint errors (race condition)
      if (error.code !== '23505') {
        console.error('Error inserting fallback challenge:', error);
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error('Error ensuring challenge exists:', error);
    return false;
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
  hintsUsed: number
): Promise<{ success: boolean; error?: string }> => {
  const today = getTodayDateUTC();

  try {
    // Check if already completed
    const alreadyCompleted = await hasCompletedToday(userId);
    if (alreadyCompleted) {
      return { success: false, error: 'Already completed today\'s challenge' };
    }

    // Ensure the challenge exists in the database (for fallback challenges)
    const challengeReady = await ensureChallengeExists(challenge);
    if (!challengeReady) {
      return { success: false, error: 'Failed to create challenge record' };
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
        hints_used: hintsUsed,
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
