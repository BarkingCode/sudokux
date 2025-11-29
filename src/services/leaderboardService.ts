/**
 * Leaderboard Service
 *
 * Handles leaderboard operations with Supabase:
 * - Fetching global/country leaderboards
 * - Getting user rank
 * - Submitting scores to both Supabase and Game Center
 */

import { supabase } from '../lib/supabase';
import type { Difficulty } from '../lib/database.types';
import { gameCenterService, type LeaderboardId } from './gameCenter';

export interface LeaderboardEntry {
  userId: string;
  nickname: string;
  country: string | null;
  bestTime: number;
  rank: number;
}

export interface LeaderboardOptions {
  difficulty: Difficulty;
  country?: string; // Filter by country
  limit?: number;
  offset?: number;
}

class LeaderboardService {
  /**
   * Get leaderboard entries
   */
  async getLeaderboard(options: LeaderboardOptions): Promise<LeaderboardEntry[]> {
    const { difficulty, country, limit = 100, offset = 0 } = options;

    try {
      const viewName = `leaderboard_${difficulty}` as const;

      let query = supabase
        .from(viewName)
        .select('*')
        .order('rank', { ascending: true })
        .range(offset, offset + limit - 1);

      if (country) {
        query = query.eq('country', country);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Failed to get leaderboard:', error);
        return [];
      }

      return (data || [])
        .filter((entry) => entry.user_id && entry.nickname && entry.best_time !== null && entry.rank !== null)
        .map((entry) => ({
          userId: entry.user_id!,
          nickname: entry.nickname!,
          country: entry.country,
          bestTime: entry.best_time!,
          rank: entry.rank!,
        }));
    } catch (error) {
      console.error('Error getting leaderboard:', error);
      return [];
    }
  }

  /**
   * Get user's rank for a specific difficulty
   */
  async getUserRank(userId: string, difficulty: Difficulty): Promise<number> {
    try {
      const { data, error } = await supabase
        .rpc('get_user_rank', { p_user_id: userId, p_difficulty: difficulty });

      if (error) {
        console.error('Failed to get user rank:', error);
        return 0;
      }

      return data || 0;
    } catch (error) {
      console.error('Error getting user rank:', error);
      return 0;
    }
  }

  /**
   * Get user's position and nearby entries
   */
  async getUserContext(
    userId: string,
    difficulty: Difficulty,
    surroundingCount = 5
  ): Promise<{ userEntry: LeaderboardEntry | null; nearby: LeaderboardEntry[] }> {
    try {
      const rank = await this.getUserRank(userId, difficulty);

      if (rank === 0) {
        return { userEntry: null, nearby: [] };
      }

      // Get entries around the user
      const startRank = Math.max(1, rank - surroundingCount);
      const offset = startRank - 1;
      const limit = surroundingCount * 2 + 1;

      const nearby = await this.getLeaderboard({ difficulty, limit, offset });
      const userEntry = nearby.find((e) => e.userId === userId) || null;

      return { userEntry, nearby };
    } catch (error) {
      console.error('Error getting user context:', error);
      return { userEntry: null, nearby: [] };
    }
  }

  /**
   * Get top entries for each country
   */
  async getCountryLeaders(difficulty: Difficulty, limit = 10): Promise<Record<string, LeaderboardEntry>> {
    try {
      const viewName = `leaderboard_${difficulty}` as const;

      const { data, error } = await supabase
        .from(viewName)
        .select('*')
        .not('country', 'is', null)
        .order('rank', { ascending: true });

      if (error) {
        console.error('Failed to get country leaders:', error);
        return {};
      }

      // Group by country and take the top entry for each
      const countryLeaders: Record<string, LeaderboardEntry> = {};

      for (const entry of data || []) {
        if (entry.country && entry.user_id && entry.nickname && entry.best_time !== null && entry.rank !== null && !countryLeaders[entry.country]) {
          countryLeaders[entry.country] = {
            userId: entry.user_id,
            nickname: entry.nickname,
            country: entry.country,
            bestTime: entry.best_time,
            rank: entry.rank,
          };
        }

        if (Object.keys(countryLeaders).length >= limit) {
          break;
        }
      }

      return countryLeaders;
    } catch (error) {
      console.error('Error getting country leaders:', error);
      return {};
    }
  }

  /**
   * Submit score to both Supabase leaderboard and Game Center
   * Note: Supabase score is automatically updated via stats trigger
   * This method is for explicit Game Center submission
   */
  async submitToGameCenter(difficulty: LeaderboardId, timeSeconds: number): Promise<boolean> {
    return gameCenterService.submitScore(difficulty, timeSeconds);
  }

  /**
   * Show native Game Center leaderboard UI
   */
  async showGameCenterLeaderboard(difficulty?: LeaderboardId): Promise<void> {
    await gameCenterService.showLeaderboard(difficulty);
  }
}

export const leaderboardService = new LeaderboardService();
