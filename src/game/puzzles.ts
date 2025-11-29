/**
 * Puzzle loading and generation utilities.
 * Supports both bundled JSON puzzles (9x9 easy/medium/hard) and runtime generation.
 */

import { generatePuzzle, generatePuzzleAsync } from './generator';
import { GridType, Difficulty, GeneratedPuzzle } from './types';

export interface JsonPuzzle {
  puzzle_id: string;
  puzzle_grid: number[][];
  solution_grid: number[][];
  difficulty_score: number;
}

// Bundled puzzles only available for easy/medium/hard (9x9)
type BundledDifficulty = 'easy' | 'medium' | 'hard';

// Map difficulty to require statements for bundling (9x9 only)
const PUZZLE_FILES_9x9: Record<BundledDifficulty, JsonPuzzle[]> = {
  easy: require('../assets/puzzles/easy.json'),
  medium: require('../assets/puzzles/medium.json'),
  hard: require('../assets/puzzles/hard.json'),
};

// Difficulties that have bundled puzzles
const BUNDLED_DIFFICULTIES: BundledDifficulty[] = ['easy', 'medium', 'hard'];

/**
 * Check if a difficulty has bundled puzzles available.
 */
const hasBundledPuzzles = (difficulty: Difficulty): difficulty is BundledDifficulty => {
  return BUNDLED_DIFFICULTIES.includes(difficulty as BundledDifficulty);
};

/**
 * Loads bundled puzzles from JSON files.
 * Only available for 9x9 easy/medium/hard puzzles.
 */
export const loadPuzzlesFromJson = async (
  difficulty: BundledDifficulty
): Promise<JsonPuzzle[]> => {
  try {
    const puzzles = PUZZLE_FILES_9x9[difficulty];
    return puzzles as JsonPuzzle[];
  } catch (error) {
    console.error(`Error loading ${difficulty} puzzles:`, error);
    return [];
  }
};

/**
 * Gets a random puzzle from bundled JSON files.
 * Returns null if no bundled puzzles available for the difficulty.
 */
const getRandomBundledPuzzle = async (
  difficulty: Difficulty
): Promise<GeneratedPuzzle | null> => {
  // Only easy/medium/hard have bundled puzzles
  if (!hasBundledPuzzles(difficulty)) {
    return null;
  }

  const puzzles = await loadPuzzlesFromJson(difficulty);
  if (puzzles.length === 0) return null;

  const randomPuzzle = puzzles[Math.floor(Math.random() * puzzles.length)];

  return {
    puzzle: randomPuzzle.puzzle_grid,
    solution: randomPuzzle.solution_grid,
    difficulty: difficulty,
    gridType: '9x9',
    clueCount: randomPuzzle.puzzle_grid.flat().filter(v => v !== 0).length,
  };
};

/**
 * Gets a random puzzle for the specified grid type and difficulty.
 *
 * - For 6x6: Always uses runtime generation (no bundled puzzles)
 * - For 9x9 easy/medium/hard: Uses bundled JSON puzzles when available
 * - For 9x9 extreme/insane/inhuman: Always uses runtime generation
 *
 * @param difficulty - Difficulty level
 * @param gridType - '6x6' or '9x9' (defaults to '9x9')
 * @param preferGenerated - If true, always generate instead of using bundled
 * @returns Generated puzzle with solution
 */
export const getRandomPuzzle = async (
  difficulty: Difficulty,
  gridType: GridType = '9x9',
  preferGenerated: boolean = false
): Promise<GeneratedPuzzle | null> => {
  // For 6x6, always generate (no bundled puzzles)
  if (gridType === '6x6') {
    return generatePuzzleAsync(gridType, difficulty);
  }

  // For 9x9 with bundled difficulties, try bundled first
  if (!preferGenerated && hasBundledPuzzles(difficulty)) {
    const bundled = await getRandomBundledPuzzle(difficulty);
    if (bundled) return bundled;
  }

  // Generate for extreme/insane/inhuman or as fallback
  return generatePuzzleAsync(gridType, difficulty);
};

// Re-export types for convenience
export { GeneratedPuzzle } from './types';
