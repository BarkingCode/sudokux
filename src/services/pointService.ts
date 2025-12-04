/**
 * Point Service
 *
 * Handles points-based leaderboard operations:
 * - Points calculation per difficulty (exponential scaling)
 * - Global and country points leaderboards
 * - User rank and total players
 */

import { supabase } from '../lib/supabase';
import type { Difficulty } from '../lib/database.types';
import type { GridType } from '../game/types';

// Point values per difficulty for 9x9 grids (exponential scaling)
export const DIFFICULTY_POINTS: Record<Difficulty, number> = {
  easy: 10,
  medium: 25,
  hard: 50,
  extreme: 100,
  insane: 200,
  inhuman: 500,
};

// Point values per difficulty for 6x6 grids (half of 9x9)
export const DIFFICULTY_POINTS_6X6: Record<Difficulty, number> = {
  easy: 5,
  medium: 12,
  hard: 25,
  extreme: 50,
  insane: 100,
  inhuman: 250,
};

// Mistake penalties per difficulty for 9x9 grids (points deducted per mistake)
export const MISTAKE_PENALTIES: Record<Difficulty, number> = {
  easy: -1,
  medium: -2,
  hard: -3,
  extreme: -4,
  insane: -5,
  inhuman: -6,
};

// Mistake penalties for 6x6 grids (same as 9x9, mistakes are equally punished)
export const MISTAKE_PENALTIES_6X6: Record<Difficulty, number> = {
  easy: -1,
  medium: -2,
  hard: -3,
  extreme: -4,
  insane: -5,
  inhuman: -6,
};

// Helper penalties per difficulty (points deducted when using helper)
export const HELPER_PENALTIES: Record<Difficulty, number> = {
  easy: -1,
  medium: -5,
  hard: -10,
  extreme: -15,
  insane: -25,
  inhuman: -50,
};

// Helper penalties for 6x6 grids (half of 9x9)
export const HELPER_PENALTIES_6X6: Record<Difficulty, number> = {
  easy: -1,
  medium: -2,
  hard: -5,
  extreme: -8,
  insane: -12,
  inhuman: -25,
};

/**
 * Point information for a specific difficulty and grid type
 */
export interface PointInfo {
  gamePoints: number;
  mistakePenalty: number;
  helperPenalty: number;
}

/**
 * Get complete point information for a difficulty and grid type
 */
export const getPointInfoForDifficulty = (
  difficulty: Difficulty,
  gridType: GridType = '9x9'
): PointInfo => {
  const mistakePenalties = gridType === '6x6' ? MISTAKE_PENALTIES_6X6 : MISTAKE_PENALTIES;
  const helperPenalties = gridType === '6x6' ? HELPER_PENALTIES_6X6 : HELPER_PENALTIES;
  return {
    gamePoints: getPointsForDifficulty(difficulty, gridType),
    mistakePenalty: mistakePenalties[difficulty],
    helperPenalty: helperPenalties[difficulty],
  };
};

/**
 * Get points for a specific difficulty and grid type
 */
export const getPointsForDifficulty = (difficulty: Difficulty, gridType: GridType = '9x9'): number => {
  if (gridType === '6x6') {
    return DIFFICULTY_POINTS_6X6[difficulty] || 0;
  }
  return DIFFICULTY_POINTS[difficulty] || 0;
};

export interface PointsLeaderboardEntry {
  userId: string;
  nickname: string;
  country: string | null;
  points: number;
  rank: number;
}

export interface UserPointsRank {
  rank: number;
  totalPlayers: number;
  points: number;
}

class PointService {
  /**
   * Get user's total points from user_stats
   */
  async getUserPoints(userId: string): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('user_stats')
        .select('total_points')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('Failed to get user points:', error);
        return 0;
      }

      // New users won't have a user_stats row yet
      if (!data) {
        return 0;
      }

      return data?.total_points || 0;
    } catch (error) {
      console.error('Error getting user points:', error);
      return 0;
    }
  }

  /**
   * Get global points leaderboard
   */
  async getGlobalLeaderboard(limit = 50, offset = 0): Promise<PointsLeaderboardEntry[]> {
    try {
      const { data, error } = await supabase
        .from('points_leaderboard')
        .select('*')
        .order('rank', { ascending: true })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Failed to get global points leaderboard:', error);
        return [];
      }

      return (data || [])
        .filter((entry) => entry.user_id && entry.nickname)
        .map((entry) => ({
          userId: entry.user_id!,
          nickname: entry.nickname!,
          country: entry.country,
          points: entry.points || 0,
          rank: entry.rank || 0,
        }));
    } catch (error) {
      console.error('Error getting global leaderboard:', error);
      return [];
    }
  }

  /**
   * Get country-specific points leaderboard
   */
  async getCountryLeaderboard(country: string, limit = 50, offset = 0): Promise<PointsLeaderboardEntry[]> {
    try {
      const { data, error } = await supabase
        .from('points_leaderboard_by_country')
        .select('*')
        .eq('country', country)
        .order('rank', { ascending: true })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Failed to get country points leaderboard:', error);
        return [];
      }

      return (data || [])
        .filter((entry) => entry.user_id && entry.nickname)
        .map((entry) => ({
          userId: entry.user_id!,
          nickname: entry.nickname!,
          country: entry.country,
          points: entry.points || 0,
          rank: entry.rank || 0,
        }));
    } catch (error) {
      console.error('Error getting country leaderboard:', error);
      return [];
    }
  }

  /**
   * Get user's rank in the points leaderboard (global or country)
   */
  async getUserPointsRank(userId: string, country?: string): Promise<UserPointsRank> {
    try {
      const { data, error } = await supabase.rpc('get_user_points_rank', {
        p_user_id: userId,
        p_country: country ?? null,
      });

      if (error) {
        console.error('Failed to get user points rank:', error);
        return { rank: 0, totalPlayers: 0, points: 0 };
      }

      // Get user's points
      const points = await this.getUserPoints(userId);

      // Data is an array with one row containing rank and total_players
      const result = Array.isArray(data) ? data[0] : null;
      return {
        rank: Number(result?.rank) || 0,
        totalPlayers: Number(result?.total_players) || 0,
        points,
      };
    } catch (error) {
      console.error('Error getting user points rank:', error);
      return { rank: 0, totalPlayers: 0, points: 0 };
    }
  }

  /**
   * Get user's entry from the leaderboard with their rank
   */
  async getUserLeaderboardEntry(userId: string, country?: string): Promise<PointsLeaderboardEntry | null> {
    try {
      if (country) {
        const { data, error } = await supabase
          .from('points_leaderboard_by_country')
          .select('*')
          .eq('user_id', userId)
          .eq('country', country)
          .single();

        if (error || !data) {
          return null;
        }

        return {
          userId: data.user_id!,
          nickname: data.nickname!,
          country: data.country,
          points: data.points || 0,
          rank: data.rank || 0,
        };
      } else {
        const { data, error } = await supabase
          .from('points_leaderboard')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (error || !data) {
          return null;
        }

        return {
          userId: data.user_id!,
          nickname: data.nickname!,
          country: data.country,
          points: data.points || 0,
          rank: data.rank || 0,
        };
      }
    } catch (error) {
      console.error('Error getting user leaderboard entry:', error);
      return null;
    }
  }

  /**
   * Calculate points for a completed game
   * @param difficulty - Game difficulty level
   * @param gridType - Grid type ('6x6' or '9x9'). 6x6 gives half points.
   */
  calculateGamePoints(difficulty: Difficulty, gridType: GridType = '9x9'): number {
    return getPointsForDifficulty(difficulty, gridType);
  }

  /**
   * Format points for display (e.g., 1000 -> "1,000")
   */
  formatPoints(points: number): string {
    return points.toLocaleString();
  }
}

export const pointService = new PointService();
