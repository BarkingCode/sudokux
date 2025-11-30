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

// Point values per difficulty (exponential scaling)
export const DIFFICULTY_POINTS: Record<Difficulty, number> = {
  easy: 10,
  medium: 25,
  hard: 50,
  extreme: 100,
  insane: 200,
  inhuman: 500,
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
   */
  calculateGamePoints(difficulty: Difficulty): number {
    return DIFFICULTY_POINTS[difficulty] || 0;
  }

  /**
   * Format points for display (e.g., 1000 -> "1,000")
   */
  formatPoints(points: number): string {
    return points.toLocaleString();
  }
}

export const pointService = new PointService();
