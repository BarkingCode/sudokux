/**
 * Test fixtures for complete Sudoku puzzles with solutions.
 * Used for testing puzzle generation, solving, and validation.
 */

import { Grid, GeneratedPuzzle } from '../../src/game/types';

// ============ 9x9 PUZZLES ============

/** Easy 9x9 puzzle with solution */
export const EASY_PUZZLE_9x9: GeneratedPuzzle = {
  puzzle: [
    [5, 3, 0, 0, 7, 0, 0, 0, 0],
    [6, 0, 0, 1, 9, 5, 0, 0, 0],
    [0, 9, 8, 0, 0, 0, 0, 6, 0],
    [8, 0, 0, 0, 6, 0, 0, 0, 3],
    [4, 0, 0, 8, 0, 3, 0, 0, 1],
    [7, 0, 0, 0, 2, 0, 0, 0, 6],
    [0, 6, 0, 0, 0, 0, 2, 8, 0],
    [0, 0, 0, 4, 1, 9, 0, 0, 5],
    [0, 0, 0, 0, 8, 0, 0, 7, 9],
  ],
  solution: [
    [5, 3, 4, 6, 7, 8, 9, 1, 2],
    [6, 7, 2, 1, 9, 5, 3, 4, 8],
    [1, 9, 8, 3, 4, 2, 5, 6, 7],
    [8, 5, 9, 7, 6, 1, 4, 2, 3],
    [4, 2, 6, 8, 5, 3, 7, 9, 1],
    [7, 1, 3, 9, 2, 4, 8, 5, 6],
    [9, 6, 1, 5, 3, 7, 2, 8, 4],
    [2, 8, 7, 4, 1, 9, 6, 3, 5],
    [3, 4, 5, 2, 8, 6, 1, 7, 9],
  ],
  difficulty: 'easy',
  gridType: '9x9',
  clueCount: 30,
};

/** Hard 9x9 puzzle with solution */
export const HARD_PUZZLE_9x9: GeneratedPuzzle = {
  puzzle: [
    [0, 0, 0, 0, 0, 0, 0, 1, 2],
    [0, 0, 0, 0, 3, 5, 0, 0, 0],
    [0, 0, 0, 6, 0, 0, 0, 7, 0],
    [7, 0, 0, 0, 0, 0, 3, 0, 0],
    [0, 0, 0, 4, 0, 0, 8, 0, 0],
    [1, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 1, 2, 0, 0, 0, 0],
    [0, 8, 0, 0, 0, 0, 0, 4, 0],
    [0, 5, 0, 0, 0, 0, 6, 0, 0],
  ],
  solution: [
    [6, 7, 3, 8, 9, 4, 5, 1, 2],
    [9, 1, 2, 7, 3, 5, 4, 8, 6],
    [8, 4, 5, 6, 1, 2, 9, 7, 3],
    [7, 9, 8, 2, 6, 1, 3, 5, 4],
    [5, 2, 6, 4, 7, 3, 8, 9, 1],
    [1, 3, 4, 5, 8, 9, 2, 6, 7],
    [4, 6, 9, 1, 2, 8, 7, 3, 5],
    [2, 8, 1, 3, 5, 7, 6, 4, 9],
    [3, 5, 7, 9, 4, 6, 6, 2, 8],
  ],
  difficulty: 'hard',
  gridType: '9x9',
  clueCount: 17,
};

// ============ 6x6 PUZZLES ============

/** Easy 6x6 puzzle with solution */
export const EASY_PUZZLE_6x6: GeneratedPuzzle = {
  puzzle: [
    [1, 0, 3, 4, 0, 6],
    [4, 5, 0, 1, 2, 0],
    [0, 3, 1, 0, 6, 4],
    [5, 0, 4, 2, 0, 1],
    [3, 1, 0, 6, 4, 0],
    [0, 4, 5, 0, 1, 2],
  ],
  solution: [
    [1, 2, 3, 4, 5, 6],
    [4, 5, 6, 1, 2, 3],
    [2, 3, 1, 5, 6, 4],
    [5, 6, 4, 2, 3, 1],
    [3, 1, 2, 6, 4, 5],
    [6, 4, 5, 3, 1, 2],
  ],
  difficulty: 'easy',
  gridType: '6x6',
  clueCount: 24,
};

/** Hard 6x6 puzzle with solution */
export const HARD_PUZZLE_6x6: GeneratedPuzzle = {
  puzzle: [
    [0, 0, 3, 0, 0, 6],
    [4, 0, 0, 1, 0, 0],
    [0, 3, 0, 0, 6, 0],
    [5, 0, 0, 0, 0, 1],
    [0, 0, 2, 0, 0, 0],
    [0, 4, 0, 3, 0, 0],
  ],
  solution: [
    [1, 2, 3, 4, 5, 6],
    [4, 5, 6, 1, 2, 3],
    [2, 3, 1, 5, 6, 4],
    [5, 6, 4, 2, 3, 1],
    [3, 1, 2, 6, 4, 5],
    [6, 4, 5, 3, 1, 2],
  ],
  difficulty: 'hard',
  gridType: '6x6',
  clueCount: 12,
};

// ============ SPECIAL TEST CASES ============

/** Puzzle with multiple solutions (invalid - should fail uniqueness test) */
export const MULTIPLE_SOLUTIONS_PUZZLE: Grid = [
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
];

/** Unsolvable puzzle (no valid solution exists) */
export const UNSOLVABLE_PUZZLE: Grid = [
  [1, 1, 0, 0, 0, 0, 0, 0, 0], // Two 1s in first row - unsolvable
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
];

/** Puzzle specifically designed for naked single detection */
export const NAKED_SINGLE_TEST_PUZZLE: Grid = [
  [5, 3, 4, 6, 7, 8, 9, 1, 0], // Cell (0,8) must be 2 - only candidate
  [6, 7, 2, 1, 9, 5, 3, 4, 8],
  [1, 9, 8, 3, 4, 2, 5, 6, 7],
  [8, 5, 9, 7, 6, 1, 4, 2, 3],
  [4, 2, 6, 8, 5, 3, 7, 9, 1],
  [7, 1, 3, 9, 2, 4, 8, 5, 6],
  [9, 6, 1, 5, 3, 7, 2, 8, 4],
  [2, 8, 7, 4, 1, 9, 6, 3, 5],
  [3, 4, 5, 2, 8, 6, 1, 7, 9],
];

/** Puzzle for hidden single in row detection */
export const HIDDEN_SINGLE_ROW_TEST_PUZZLE: Grid = [
  [0, 0, 0, 0, 7, 8, 9, 1, 2], // 5 can only go in one position in this row
  [6, 7, 2, 1, 9, 5, 3, 4, 8],
  [1, 9, 8, 3, 4, 2, 5, 6, 7],
  [8, 5, 9, 7, 6, 1, 4, 2, 3],
  [4, 2, 6, 8, 5, 3, 7, 9, 1],
  [7, 1, 3, 9, 2, 4, 8, 5, 6],
  [9, 6, 1, 5, 3, 7, 2, 8, 4],
  [2, 8, 7, 4, 1, 9, 6, 3, 5],
  [3, 4, 5, 2, 8, 6, 1, 7, 9],
];

/**
 * Helper to count clues (non-zero cells) in a grid
 */
export const countClues = (grid: Grid): number => {
  let count = 0;
  for (const row of grid) {
    for (const cell of row) {
      if (cell !== 0) count++;
    }
  }
  return count;
};

/**
 * Helper to deep copy a grid for testing mutations
 */
export const copyGrid = (grid: Grid): Grid => {
  return grid.map(row => [...row]);
};
