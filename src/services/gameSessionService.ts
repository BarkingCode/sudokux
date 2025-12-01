/**
 * Game Session Service
 *
 * Handles recording and retrieving game sessions from Supabase.
 */

import { supabase } from '../lib/supabase';
import type {
  GameSession,
  GameSessionInsert,
  Difficulty,
  GridType,
} from '../lib/database.types';

export interface GameResult {
  puzzleId: string;
  difficulty: Difficulty;
  timeSeconds: number;
  mistakes: number;
  hintsUsed: number;
  completed: boolean;
  gridType?: GridType;
}

/**
 * Record a completed game session
 */
export async function recordGameSession(
  userId: string,
  result: GameResult
): Promise<GameSession | null> {
  try {
    const session: GameSessionInsert = {
      user_id: userId,
      puzzle_id: result.puzzleId,
      difficulty: result.difficulty,
      time_seconds: result.timeSeconds,
      mistakes: result.mistakes,
      hints_used: result.hintsUsed,
      completed: result.completed,
      grid_type: result.gridType || '9x9',
    };

    const { data, error } = await supabase
      .from('game_sessions')
      .insert(session)
      .select()
      .single();

    if (error) {
      console.error('Failed to record game:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error recording game:', error);
    return null;
  }
}

/**
 * Get recent game history from all sources (game_sessions, chapter_completions, daily_completions)
 */
export async function getGameHistory(
  userId: string,
  limit = 10
): Promise<GameSession[]> {
  try {
    // Fetch from all three sources in parallel
    const [gameSessionsResult, chapterResult, dailyResult] = await Promise.all([
      supabase
        .from('game_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('completed_at', { ascending: false })
        .limit(limit),
      supabase
        .from('chapter_completions' as any)
        .select('id, user_id, difficulty, time_seconds, mistakes, hints_used, completed_at, created_at, puzzle_number')
        .eq('user_id', userId)
        .order('completed_at', { ascending: false })
        .limit(limit),
      supabase
        .from('daily_completions')
        .select('id, user_id, time_seconds, mistakes, hints_used, completed_at, challenge_id')
        .eq('user_id', userId)
        .order('completed_at', { ascending: false })
        .limit(limit),
    ]);

    const allGames: GameSession[] = [];

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
          grid_type: '9x9', // Chapters are always 9x9
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
          grid_type: '9x9', // Daily challenges are always 9x9
        });
      }
    }

    // Sort by completed_at descending and take the limit
    allGames.sort((a, b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime());

    return allGames.slice(0, limit);
  } catch (error) {
    console.error('Error getting game history:', error);
    return [];
  }
}
