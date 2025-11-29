/**
 * Chapter Service
 *
 * Handles chapter game completions with Supabase:
 * - Saving completed chapter puzzles with puzzle data
 * - Loading completed puzzles for replay
 * - Getting chapter statistics
 */

import { supabase } from '../lib/supabase';
import type { ChapterCompletion, ChapterCompletionInsert } from '../lib/database.types';

// Type for raw data from Supabase (before types are regenerated)
type ChapterCompletionRow = ChapterCompletion;

export interface ChapterPuzzleData {
  puzzleNumber: number;
  difficulty: string;
  puzzleGrid: number[][];
  solutionGrid: number[][];
  timeSeconds: number;
  mistakes: number;
  hintsUsed: number;
}

/**
 * Interface for saving mid-game chapter progress.
 * Used when user leaves a chapter puzzle before completing it.
 */
export interface ChapterInProgress {
  puzzleNumber: number;
  difficulty: string;
  gridType: string;
  initialGrid: number[][];
  currentGrid: number[][];
  solution: number[][];
  timer: number;
  mistakes: number;
  hintsUsed: number;
  notes: Record<string, number[]>;
  savedAt: string;
}

class ChapterService {
  private cache: Map<number, ChapterCompletion> = new Map();

  /**
   * Check if user exists in Supabase users table
   */
  private async getUserId(internalId: string): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id')
        .eq('internal_id', internalId)
        .maybeSingle();

      if (error || !data) {
        return null;
      }

      return data.id;
    } catch {
      return null;
    }
  }

  /**
   * Save a completed chapter puzzle
   */
  async saveCompletion(
    internalUserId: string,
    puzzleData: ChapterPuzzleData
  ): Promise<ChapterCompletion | null> {
    try {
      // Get the Supabase user ID
      const userId = await this.getUserId(internalUserId);
      if (!userId) {
        console.log('[ChapterService] User not found in Supabase, skipping save');
        return null;
      }

      const completion: ChapterCompletionInsert = {
        user_id: userId,
        puzzle_number: puzzleData.puzzleNumber,
        difficulty: puzzleData.difficulty,
        puzzle_grid: JSON.stringify(puzzleData.puzzleGrid),
        solution_grid: JSON.stringify(puzzleData.solutionGrid),
        time_seconds: puzzleData.timeSeconds,
        mistakes: puzzleData.mistakes,
        hints_used: puzzleData.hintsUsed,
      };

      // Upsert - update if exists, insert if not
      // Note: Using 'as any' because the table isn't in generated types yet
      const { data, error } = await (supabase
        .from('chapter_completions' as any)
        .upsert(completion as any, {
          onConflict: 'user_id,puzzle_number',
        })
        .select()
        .single());

      if (error) {
        console.error('[ChapterService] Failed to save completion:', error);
        return null;
      }

      const typedData = data as unknown as ChapterCompletion;

      // Update cache
      if (typedData) {
        this.cache.set(puzzleData.puzzleNumber, typedData);
      }

      return typedData;
    } catch (error) {
      console.error('[ChapterService] Error saving completion:', error);
      return null;
    }
  }

  /**
   * Get a specific completed chapter puzzle
   */
  async getCompletion(
    internalUserId: string,
    puzzleNumber: number
  ): Promise<ChapterCompletion | null> {
    try {
      // Check cache first
      if (this.cache.has(puzzleNumber)) {
        return this.cache.get(puzzleNumber) || null;
      }

      // Get the Supabase user ID
      const userId = await this.getUserId(internalUserId);
      if (!userId) {
        return null;
      }

      const { data, error } = await (supabase
        .from('chapter_completions' as any)
        .select('*')
        .eq('user_id', userId)
        .eq('puzzle_number', puzzleNumber)
        .maybeSingle());

      if (error || !data) {
        return null;
      }

      const typedData = data as unknown as ChapterCompletion;

      // Update cache
      this.cache.set(puzzleNumber, typedData);

      return typedData;
    } catch (error) {
      console.error('[ChapterService] Error getting completion:', error);
      return null;
    }
  }

  /**
   * Get all completed chapter puzzles for a user
   */
  async getAllCompletions(internalUserId: string): Promise<ChapterCompletion[]> {
    try {
      const userId = await this.getUserId(internalUserId);
      if (!userId) {
        return [];
      }

      const { data, error } = await (supabase
        .from('chapter_completions' as any)
        .select('*')
        .eq('user_id', userId)
        .order('puzzle_number', { ascending: true }));

      if (error || !data) {
        return [];
      }

      const typedData = data as unknown as ChapterCompletion[];

      // Update cache
      typedData.forEach((completion) => {
        this.cache.set(completion.puzzle_number, completion);
      });

      return typedData;
    } catch (error) {
      console.error('[ChapterService] Error getting all completions:', error);
      return [];
    }
  }

  /**
   * Get chapter statistics for a user
   */
  async getChapterStats(internalUserId: string): Promise<{
    totalCompleted: number;
    totalTime: number;
    totalMistakes: number;
    averageTime: number;
    completionsByDifficulty: Record<string, number>;
  }> {
    const completions = await this.getAllCompletions(internalUserId);

    const stats = {
      totalCompleted: completions.length,
      totalTime: 0,
      totalMistakes: 0,
      averageTime: 0,
      completionsByDifficulty: {} as Record<string, number>,
    };

    completions.forEach((c) => {
      stats.totalTime += c.time_seconds;
      stats.totalMistakes += c.mistakes;
      stats.completionsByDifficulty[c.difficulty] =
        (stats.completionsByDifficulty[c.difficulty] || 0) + 1;
    });

    if (completions.length > 0) {
      stats.averageTime = Math.round(stats.totalTime / completions.length);
    }

    return stats;
  }

  /**
   * Parse puzzle grid from stored JSON string
   */
  parsePuzzleGrid(gridJson: string): number[][] {
    try {
      return JSON.parse(gridJson);
    } catch {
      console.error('[ChapterService] Failed to parse puzzle grid');
      return [];
    }
  }

  /**
   * Clear the cache
   */
  clearCache(): void {
    this.cache.clear();
  }
}

export const chapterService = new ChapterService();
