/**
 * Difficulty parameters for different grid sizes.
 * Defines how many cells to remove for each difficulty level.
 *
 * Difficulty levels:
 * - Easy: Beginner-friendly, mostly naked singles
 * - Medium: Requires hidden singles
 * - Hard: Requires pointing pairs, box/line reduction
 * - Extreme: Requires naked/hidden pairs/triples
 * - Insane: Requires X-Wing, Swordfish, advanced techniques
 * - Inhuman: Near-minimum clues, requires trial and error or very advanced techniques
 */

import { Difficulty, GridType } from './types';

/** Parameters for puzzle generation by difficulty */
export interface DifficultyParams {
  /** Target number of cells to remove */
  removals: number;
  /** Minimum acceptable clues (filled cells) */
  minClues: number;
  /** Maximum acceptable clues (filled cells) */
  maxClues: number;
}

/**
 * Difficulty parameters for 6x6 mini Sudoku.
 * Total cells: 36
 * Minimum possible clues for unique solution: ~8-10
 */
const DIFFICULTY_6x6: Record<Difficulty, DifficultyParams> = {
  easy: {
    removals: 10,    // Leaves 26 clues (~72% filled)
    minClues: 24,
    maxClues: 28,
  },
  medium: {
    removals: 14,    // Leaves 22 clues (~61% filled)
    minClues: 20,
    maxClues: 24,
  },
  hard: {
    removals: 18,    // Leaves 18 clues (50% filled)
    minClues: 16,
    maxClues: 20,
  },
  extreme: {
    removals: 21,    // Leaves 15 clues (~42% filled)
    minClues: 13,
    maxClues: 17,
  },
  insane: {
    removals: 24,    // Leaves 12 clues (~33% filled)
    minClues: 10,
    maxClues: 14,
  },
  inhuman: {
    removals: 26,    // Leaves 10 clues (~28% filled) - near minimum
    minClues: 8,
    maxClues: 12,
  },
};

/**
 * Difficulty parameters for 9x9 standard Sudoku.
 * Total cells: 81
 * Minimum possible clues for unique solution: 17
 */
const DIFFICULTY_9x9: Record<Difficulty, DifficultyParams> = {
  easy: {
    removals: 30,    // Leaves 51 clues (~63% filled)
    minClues: 46,
    maxClues: 55,
  },
  medium: {
    removals: 40,    // Leaves 41 clues (~51% filled)
    minClues: 38,
    maxClues: 45,
  },
  hard: {
    removals: 50,    // Leaves 31 clues (~38% filled)
    minClues: 28,
    maxClues: 35,
  },
  extreme: {
    removals: 55,    // Leaves 26 clues (~32% filled)
    minClues: 23,
    maxClues: 29,
  },
  insane: {
    removals: 58,    // Leaves 23 clues (~28% filled)
    minClues: 20,
    maxClues: 26,
  },
  inhuman: {
    removals: 62,    // Leaves 19 clues (~23% filled) - near minimum (17)
    minClues: 17,
    maxClues: 22,
  },
};

/**
 * Get difficulty parameters for a given grid type and difficulty level.
 *
 * @param gridType - The type of grid (6x6 or 9x9)
 * @param difficulty - The desired difficulty level
 * @returns Parameters for puzzle generation
 */
export const getDifficultyParams = (
  gridType: GridType,
  difficulty: Difficulty
): DifficultyParams => {
  return gridType === '6x6'
    ? DIFFICULTY_6x6[difficulty]
    : DIFFICULTY_9x9[difficulty];
};

/**
 * Get the total number of cells for a grid type.
 */
export const getTotalCells = (gridType: GridType): number => {
  return gridType === '6x6' ? 36 : 81;
};

/**
 * Get display name for a difficulty level.
 */
export const getDifficultyDisplayName = (difficulty: Difficulty): string => {
  const names: Record<Difficulty, string> = {
    easy: 'Easy',
    medium: 'Medium',
    hard: 'Hard',
    extreme: 'Extreme',
    insane: 'Insane',
    inhuman: 'Inhuman',
  };
  return names[difficulty];
};

/**
 * All difficulty levels in order.
 */
export const DIFFICULTY_LEVELS: Difficulty[] = [
  'easy',
  'medium',
  'hard',
  'extreme',
  'insane',
  'inhuman',
];
