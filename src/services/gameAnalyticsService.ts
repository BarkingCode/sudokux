/**
 * Game Analytics Service
 *
 * Handles game data aggregation for heatmaps and charts.
 * Aggregates data from game_sessions, chapter_completions, and daily_completions.
 */

import { supabase } from '../lib/supabase';
import type { GameSession } from '../lib/database.types';

// Unified game record type for analytics (subset of GameSession fields we need)
interface GameRecord {
  id: string;
  user_id: string;
  difficulty: string;
  time_seconds: number;
  mistakes: number | null;
  hints_used: number | null;
  completed: boolean | null;
  completed_at: string;
  created_at: string;
  puzzle_id: string;
}

/**
 * Get games for the heatmap (last 4 months) from all sources
 */
export async function getHeatmapGames(userId: string): Promise<GameSession[]> {
  try {
    const fourMonthsAgo = new Date();
    fourMonthsAgo.setMonth(fourMonthsAgo.getMonth() - 4);
    fourMonthsAgo.setHours(0, 0, 0, 0);
    const cutoffDate = fourMonthsAgo.toISOString();

    // Fetch from all three sources in parallel
    const [gameSessionsResult, chapterResult, dailyResult] = await Promise.all([
      supabase
        .from('game_sessions')
        .select('*')
        .eq('user_id', userId)
        .gte('completed_at', cutoffDate)
        .order('completed_at', { ascending: true }),
      supabase
        .from('chapter_completions' as any)
        .select('id, user_id, difficulty, time_seconds, mistakes, hints_used, completed_at, created_at, puzzle_number')
        .eq('user_id', userId)
        .gte('completed_at', cutoffDate)
        .order('completed_at', { ascending: true }),
      supabase
        .from('daily_completions')
        .select('id, user_id, time_seconds, mistakes, hints_used, completed_at, challenge_id')
        .eq('user_id', userId)
        .gte('completed_at', cutoffDate)
        .order('completed_at', { ascending: true }),
    ]);

    const allGames: GameRecord[] = [];

    // Add game_sessions
    if (!gameSessionsResult.error && gameSessionsResult.data) {
      allGames.push(...gameSessionsResult.data);
    }

    // Add chapter_completions (convert to GameSession-like format)
    if (!chapterResult.error && chapterResult.data) {
      const chapters = chapterResult.data as unknown as Array<{
        id: string;
        user_id: string;
        difficulty: string;
        time_seconds: number;
        mistakes: number;
        hints_used: number;
        completed_at: string;
        created_at: string;
        puzzle_number: number;
      }>;
      for (const ch of chapters) {
        allGames.push({
          id: ch.id,
          user_id: ch.user_id,
          difficulty: ch.difficulty,
          time_seconds: ch.time_seconds,
          mistakes: ch.mistakes,
          hints_used: ch.hints_used,
          completed: true,
          completed_at: ch.completed_at,
          created_at: ch.created_at,
          puzzle_id: `chapter-${ch.puzzle_number}`,
        });
      }
    }

    // Add daily_completions (need to fetch difficulty from daily_challenges)
    if (!dailyResult.error && dailyResult.data && dailyResult.data.length > 0) {
      const challengeIds = dailyResult.data.map((d) => d.challenge_id);
      const { data: challenges } = await supabase
        .from('daily_challenges')
        .select('id, difficulty')
        .in('id', challengeIds);

      const difficultyMap = new Map<string, string>();
      if (challenges) {
        for (const ch of challenges) {
          difficultyMap.set(ch.id, ch.difficulty);
        }
      }

      for (const dc of dailyResult.data) {
        allGames.push({
          id: dc.id,
          user_id: dc.user_id,
          difficulty: difficultyMap.get(dc.challenge_id) || 'medium',
          time_seconds: dc.time_seconds,
          mistakes: dc.mistakes,
          hints_used: dc.hints_used,
          completed: true,
          completed_at: dc.completed_at,
          created_at: dc.completed_at,
          puzzle_id: `daily-${dc.challenge_id}`,
        });
      }
    }

    // Sort by completed_at
    allGames.sort((a, b) => new Date(a.completed_at).getTime() - new Date(b.completed_at).getTime());

    return allGames as GameSession[];
  } catch (error) {
    console.error('Error getting heatmap games:', error);
    return [];
  }
}

/**
 * Get games for the current week (for weekly chart) from all sources
 */
export async function getWeeklyGames(userId: string): Promise<GameSession[]> {
  try {
    // Calculate start of current week (Monday)
    const today = new Date();
    const dayOfWeek = today.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(today);
    monday.setDate(today.getDate() + mondayOffset);
    monday.setHours(0, 0, 0, 0);
    const cutoffDate = monday.toISOString();

    // Fetch from all three sources in parallel
    const [gameSessionsResult, chapterResult, dailyResult] = await Promise.all([
      supabase
        .from('game_sessions')
        .select('*')
        .eq('user_id', userId)
        .gte('completed_at', cutoffDate)
        .order('completed_at', { ascending: true }),
      supabase
        .from('chapter_completions' as any)
        .select('id, user_id, difficulty, time_seconds, mistakes, hints_used, completed_at, created_at, puzzle_number')
        .eq('user_id', userId)
        .gte('completed_at', cutoffDate)
        .order('completed_at', { ascending: true }),
      supabase
        .from('daily_completions')
        .select('id, user_id, time_seconds, mistakes, hints_used, completed_at, challenge_id')
        .eq('user_id', userId)
        .gte('completed_at', cutoffDate)
        .order('completed_at', { ascending: true }),
    ]);

    const allGames: GameRecord[] = [];

    // Add game_sessions
    if (!gameSessionsResult.error && gameSessionsResult.data) {
      allGames.push(...gameSessionsResult.data);
    }

    // Add chapter_completions
    if (!chapterResult.error && chapterResult.data) {
      const chapters = chapterResult.data as unknown as Array<{
        id: string;
        user_id: string;
        difficulty: string;
        time_seconds: number;
        mistakes: number;
        hints_used: number;
        completed_at: string;
        created_at: string;
        puzzle_number: number;
      }>;
      for (const ch of chapters) {
        allGames.push({
          id: ch.id,
          user_id: ch.user_id,
          difficulty: ch.difficulty,
          time_seconds: ch.time_seconds,
          mistakes: ch.mistakes,
          hints_used: ch.hints_used,
          completed: true,
          completed_at: ch.completed_at,
          created_at: ch.created_at,
          puzzle_id: `chapter-${ch.puzzle_number}`,
        });
      }
    }

    // Add daily_completions
    if (!dailyResult.error && dailyResult.data && dailyResult.data.length > 0) {
      const challengeIds = dailyResult.data.map((d) => d.challenge_id);
      const { data: challenges } = await supabase
        .from('daily_challenges')
        .select('id, difficulty')
        .in('id', challengeIds);

      const difficultyMap = new Map<string, string>();
      if (challenges) {
        for (const ch of challenges) {
          difficultyMap.set(ch.id, ch.difficulty);
        }
      }

      for (const dc of dailyResult.data) {
        allGames.push({
          id: dc.id,
          user_id: dc.user_id,
          difficulty: difficultyMap.get(dc.challenge_id) || 'medium',
          time_seconds: dc.time_seconds,
          mistakes: dc.mistakes,
          hints_used: dc.hints_used,
          completed: true,
          completed_at: dc.completed_at,
          created_at: dc.completed_at,
          puzzle_id: `daily-${dc.challenge_id}`,
        });
      }
    }

    // Sort by completed_at
    allGames.sort((a, b) => new Date(a.completed_at).getTime() - new Date(b.completed_at).getTime());

    return allGames as GameSession[];
  } catch (error) {
    console.error('Error getting weekly games:', error);
    return [];
  }
}
