/**
 * Daily Leaderboard Service
 *
 * Handles leaderboard queries for daily challenges.
 */

import { supabase } from '../lib/supabase';
import { getTodayChallenge } from './dailyChallengeService';

export interface DailyLeaderboardEntry {
  rank: number;
  user_id: string;
  nickname: string;
  country: string | null;
  time_seconds: number;
  mistakes: number;
}

/**
 * Get daily challenge leaderboard for a specific challenge
 * If no challengeId provided, fetches today's challenge first
 */
export const getDailyLeaderboard = async (
  limit: number = 50,
  challengeId?: string
): Promise<DailyLeaderboardEntry[]> => {
  try {
    // Get challenge ID if not provided
    let targetChallengeId = challengeId;

    if (!targetChallengeId) {
      const challenge = await getTodayChallenge();
      if (!challenge) return [];
      targetChallengeId = challenge.id;
    }

    // Skip leaderboard for fallback-generated puzzles
    if (targetChallengeId.startsWith('fallback-')) {
      return [];
    }

    const { data, error } = await supabase
      .from('daily_completions')
      .select(`
        user_id,
        time_seconds,
        mistakes,
        users!inner (
          nickname,
          country
        )
      `)
      .eq('challenge_id', targetChallengeId)
      .order('time_seconds', { ascending: true })
      .order('mistakes', { ascending: true })
      .limit(limit);

    if (error) {
      console.error('Error fetching daily leaderboard:', error);
      return [];
    }

    return (data || []).map((entry: any, index: number) => ({
      rank: index + 1,
      user_id: entry.user_id,
      nickname: entry.users?.nickname || 'Anonymous',
      country: entry.users?.country || null,
      time_seconds: entry.time_seconds,
      mistakes: entry.mistakes,
    }));
  } catch (error) {
    console.error('Error in getDailyLeaderboard:', error);
    return [];
  }
};

/**
 * Get user's rank on a challenge leaderboard
 * If no challengeId provided, uses today's challenge
 */
export const getUserDailyRank = async (
  userId: string,
  challengeId?: string
): Promise<number | null> => {
  try {
    // Get challenge ID if not provided
    let targetChallengeId = challengeId;

    if (!targetChallengeId) {
      const challenge = await getTodayChallenge();
      if (!challenge) return null;
      targetChallengeId = challenge.id;
    }

    // No rank for fallback-generated puzzles
    if (targetChallengeId.startsWith('fallback-')) {
      return null;
    }

    // Get user's completion for this challenge
    const { data: userCompletion } = await supabase
      .from('daily_completions')
      .select('time_seconds')
      .eq('user_id', userId)
      .eq('challenge_id', targetChallengeId)
      .single();

    if (!userCompletion) return null;

    // Count how many have better times for this challenge
    const { count } = await supabase
      .from('daily_completions')
      .select('*', { count: 'exact', head: true })
      .eq('challenge_id', targetChallengeId)
      .lt('time_seconds', userCompletion.time_seconds);

    return (count || 0) + 1;
  } catch (error) {
    console.error('Error in getUserDailyRank:', error);
    return null;
  }
};

/**
 * Check if user placed in top N after completing a challenge
 */
export const checkLeaderboardPlacement = async (
  userId: string,
  challengeId: string,
  topN: number = 10
): Promise<{ placed: boolean; rank: number | null }> => {
  const rank = await getUserDailyRank(userId, challengeId);

  if (rank === null) {
    return { placed: false, rank: null };
  }

  return {
    placed: rank <= topN,
    rank,
  };
};
