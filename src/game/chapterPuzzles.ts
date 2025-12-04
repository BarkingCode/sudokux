/**
 * Chapter Puzzle Module
 *
 * Provides deterministic puzzle generation for chapter mode.
 * Each puzzle number always maps to the same unique puzzle.
 */

import { generateSeededPuzzle, generateSeededPuzzleAsync } from './generator';
import { createChapterSeed } from './seededRandom';
import { Difficulty, GridType, GeneratedPuzzle } from './types';

/**
 * Get difficulty for a specific puzzle number.
 * Difficulty increases as puzzles progress.
 *
 * Puzzle ranges:
 * - 1-30: easy
 * - 31-60: medium
 * - 61-90: hard
 * - 91-120: extreme
 * - 121-150: insane
 * - 151+: inhuman
 */
export const getChapterDifficulty = (puzzleNumber: number): Difficulty => {
  if (puzzleNumber <= 30) return 'easy';
  if (puzzleNumber <= 60) return 'medium';
  if (puzzleNumber <= 90) return 'hard';
  if (puzzleNumber <= 120) return 'extreme';
  if (puzzleNumber <= 150) return 'insane';
  return 'inhuman';
};

/**
 * Get a deterministic chapter puzzle.
 * The same puzzle number always returns the same puzzle.
 *
 * @param puzzleNumber - The chapter puzzle number (1, 2, 3, etc.)
 * @param gridType - Grid type (default: '9x9')
 * @returns Generated puzzle with solution
 */
export const getChapterPuzzle = (
  puzzleNumber: number,
  gridType: GridType = '9x9'
): GeneratedPuzzle => {
  const difficulty = getChapterDifficulty(puzzleNumber);
  const seed = createChapterSeed(puzzleNumber, difficulty);
  return generateSeededPuzzle(gridType, difficulty, seed);
};

/**
 * Get a deterministic chapter puzzle asynchronously.
 * Avoids blocking the UI during generation.
 *
 * @param puzzleNumber - The chapter puzzle number (1, 2, 3, etc.)
 * @param gridType - Grid type (default: '9x9')
 * @returns Promise resolving to generated puzzle
 */
export const getChapterPuzzleAsync = (
  puzzleNumber: number,
  gridType: GridType = '9x9'
): Promise<GeneratedPuzzle> => {
  const difficulty = getChapterDifficulty(puzzleNumber);
  const seed = createChapterSeed(puzzleNumber, difficulty);
  return generateSeededPuzzleAsync(gridType, difficulty, seed);
};
