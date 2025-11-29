/**
 * Sudoku solver with solution counting for uniqueness validation.
 * Uses backtracking with early termination for efficiency.
 */

import { Grid, GridConfig, DEFAULT_CONFIG } from './types';

const BLANK = 0;

/**
 * Checks if placing a number at the given position is valid.
 * Internal helper that doesn't modify the grid.
 */
const isValidPlacement = (
  grid: Grid,
  row: number,
  col: number,
  num: number,
  config: GridConfig
): boolean => {
  const { gridSize, boxRows, boxCols } = config;

  // Check row
  for (let x = 0; x < gridSize; x++) {
    if (grid[row][x] === num) return false;
  }

  // Check column
  for (let x = 0; x < gridSize; x++) {
    if (grid[x][col] === num) return false;
  }

  // Check box
  const startRow = row - (row % boxRows);
  const startCol = col - (col % boxCols);
  for (let i = 0; i < boxRows; i++) {
    for (let j = 0; j < boxCols; j++) {
      if (grid[startRow + i][startCol + j] === num) return false;
    }
  }

  return true;
};

/**
 * Counts solutions for a Sudoku grid using backtracking.
 * Stops early after finding `limit` solutions for efficiency.
 *
 * @param grid - The puzzle grid (0 = empty), will not be modified
 * @param config - Grid configuration
 * @param limit - Stop counting after this many solutions (default: 2)
 * @returns Number of solutions found (up to limit)
 */
export const countSolutions = (
  grid: Grid,
  config: GridConfig = DEFAULT_CONFIG,
  limit: number = 2
): number => {
  // Deep copy to avoid modifying original
  const workingGrid = grid.map(row => [...row]);
  let count = 0;

  const solve = (): boolean => {
    // Find next empty cell
    for (let row = 0; row < config.gridSize; row++) {
      for (let col = 0; col < config.gridSize; col++) {
        if (workingGrid[row][col] === BLANK) {
          // Try each number
          for (let num = 1; num <= config.maxNumber; num++) {
            if (isValidPlacement(workingGrid, row, col, num, config)) {
              workingGrid[row][col] = num;

              if (solve()) {
                workingGrid[row][col] = BLANK;
                // If we've hit the limit, propagate early termination
                if (count >= limit) return true;
              }

              workingGrid[row][col] = BLANK;
            }
          }
          return false; // No valid number found, backtrack
        }
      }
    }

    // All cells filled = solution found
    count++;
    return count >= limit; // Return true to stop if limit reached
  };

  solve();
  return count;
};

/**
 * Checks if a puzzle has exactly one solution.
 * More efficient than countSolutions for uniqueness check as it stops at 2.
 *
 * @param grid - The puzzle grid (0 = empty)
 * @param config - Grid configuration
 * @returns true if the puzzle has exactly one solution
 */
export const hasUniqueSolution = (
  grid: Grid,
  config: GridConfig = DEFAULT_CONFIG
): boolean => {
  return countSolutions(grid, config, 2) === 1;
};

/**
 * Solves a Sudoku grid using backtracking.
 * Returns the solved grid or null if unsolvable.
 *
 * @param grid - The puzzle grid (0 = empty), will not be modified
 * @param config - Grid configuration
 * @returns Solved grid or null if no solution exists
 */
export const solve = (
  grid: Grid,
  config: GridConfig = DEFAULT_CONFIG
): Grid | null => {
  const workingGrid = grid.map(row => [...row]);

  const backtrack = (): boolean => {
    for (let row = 0; row < config.gridSize; row++) {
      for (let col = 0; col < config.gridSize; col++) {
        if (workingGrid[row][col] === BLANK) {
          for (let num = 1; num <= config.maxNumber; num++) {
            if (isValidPlacement(workingGrid, row, col, num, config)) {
              workingGrid[row][col] = num;
              if (backtrack()) return true;
              workingGrid[row][col] = BLANK;
            }
          }
          return false;
        }
      }
    }
    return true;
  };

  return backtrack() ? workingGrid : null;
};

/**
 * Solves a grid with randomized number order for variety in generation.
 * Used during full board generation for randomness.
 *
 * @param grid - The grid to solve in-place
 * @param config - Grid configuration
 * @returns true if solved successfully
 */
export const solveWithRandomization = (
  grid: Grid,
  config: GridConfig = DEFAULT_CONFIG
): boolean => {
  const backtrack = (): boolean => {
    for (let row = 0; row < config.gridSize; row++) {
      for (let col = 0; col < config.gridSize; col++) {
        if (grid[row][col] === BLANK) {
          // Randomize order of numbers to try
          const numbers = shuffleArray(
            Array.from({ length: config.maxNumber }, (_, i) => i + 1)
          );

          for (const num of numbers) {
            if (isValidPlacement(grid, row, col, num, config)) {
              grid[row][col] = num;
              if (backtrack()) return true;
              grid[row][col] = BLANK;
            }
          }
          return false;
        }
      }
    }
    return true;
  };

  return backtrack();
};

/**
 * Fisher-Yates shuffle for randomizing arrays.
 */
const shuffleArray = <T>(array: T[]): T[] => {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

// Import SeededRandom for deterministic generation
import { SeededRandom } from './seededRandom';

/**
 * Solves a grid with seeded randomization for deterministic generation.
 * Used for generating the same puzzle given the same seed.
 *
 * @param grid - The grid to solve in-place
 * @param config - Grid configuration
 * @param rng - Seeded random number generator
 * @returns true if solved successfully
 */
export const solveWithRandomizationSeeded = (
  grid: Grid,
  config: GridConfig = DEFAULT_CONFIG,
  rng: SeededRandom
): boolean => {
  const backtrack = (): boolean => {
    for (let row = 0; row < config.gridSize; row++) {
      for (let col = 0; col < config.gridSize; col++) {
        if (grid[row][col] === BLANK) {
          // Use seeded shuffle for deterministic order
          const numbers = rng.shuffle(
            Array.from({ length: config.maxNumber }, (_, i) => i + 1)
          );

          for (const num of numbers) {
            if (isValidPlacement(grid, row, col, num, config)) {
              grid[row][col] = num;
              if (backtrack()) return true;
              grid[row][col] = BLANK;
            }
          }
          return false;
        }
      }
    }
    return true;
  };

  return backtrack();
};
