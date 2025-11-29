/**
 * Tests for src/game/solver.ts
 * Solution counting and uniqueness validation.
 */

import {
  countSolutions,
  hasUniqueSolution,
  solve,
  solveWithRandomization,
} from '../../src/game/solver';
import { isSolved } from '../../src/game/engine';
import { GRID_CONFIGS } from '../../src/game/types';
import {
  VALID_COMPLETE_9x9,
  EMPTY_9x9,
  INCOMPLETE_VALID_9x9,
  EMPTY_6x6,
} from '../__fixtures__/grids';
import {
  EASY_PUZZLE_9x9,
  MULTIPLE_SOLUTIONS_PUZZLE,
  copyGrid,
} from '../__fixtures__/puzzles';

describe('solver', () => {
  // ============ countSolutions ============

  describe('countSolutions', () => {
    const config = GRID_CONFIGS['9x9'];

    it('should return 1 for puzzle with unique solution', () => {
      const count = countSolutions(EASY_PUZZLE_9x9.puzzle, config, 2);
      expect(count).toBe(1);
    });

    it('should return 2 (limit) for puzzle with multiple solutions', () => {
      // Empty grid has many solutions, should stop at limit
      const count = countSolutions(EMPTY_9x9, config, 2);
      expect(count).toBe(2);
    });

    it('should return 1 for complete valid grid (only one solution - itself)', () => {
      const count = countSolutions(VALID_COMPLETE_9x9, config, 2);
      expect(count).toBe(1);
    });

    it('should stop at specified limit for efficiency', () => {
      // Empty grid has many solutions, but should stop at 3
      const count = countSolutions(EMPTY_9x9, config, 3);
      expect(count).toBe(3);
    });

    it('should not modify the original grid', () => {
      const grid = copyGrid(INCOMPLETE_VALID_9x9);
      const originalCopy = copyGrid(grid);

      countSolutions(grid, config, 2);

      expect(grid).toEqual(originalCopy);
    });

    it('should work with 6x6 grid', () => {
      const config6x6 = GRID_CONFIGS['6x6'];
      const count = countSolutions(EMPTY_6x6, config6x6, 2);
      expect(count).toBe(2); // Empty grid has multiple solutions
    });

    it('should return 0 for unsolvable puzzle', () => {
      // Grid with two 1s in same row - unsolvable
      const unsolvable = copyGrid(EMPTY_9x9);
      unsolvable[0][0] = 1;
      unsolvable[0][1] = 1;

      const count = countSolutions(unsolvable, config, 2);
      expect(count).toBe(0);
    });
  });

  // ============ hasUniqueSolution ============

  describe('hasUniqueSolution', () => {
    const config = GRID_CONFIGS['9x9'];

    it('should return true for puzzle with exactly one solution', () => {
      expect(hasUniqueSolution(EASY_PUZZLE_9x9.puzzle, config)).toBe(true);
    });

    it('should return false for empty grid (multiple solutions)', () => {
      expect(hasUniqueSolution(EMPTY_9x9, config)).toBe(false);
    });

    it('should return true for complete valid grid', () => {
      expect(hasUniqueSolution(VALID_COMPLETE_9x9, config)).toBe(true);
    });

    it('should return false for puzzle with multiple solutions', () => {
      // Remove one more cell to create multiple solutions
      const grid = copyGrid(EASY_PUZZLE_9x9.puzzle);
      // Find a clue and remove it
      for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
          if (grid[r][c] !== 0) {
            grid[r][c] = 0;
            // If still unique, continue removing
            if (hasUniqueSolution(grid, config)) {
              continue;
            }
            // Found a case with multiple solutions
            expect(hasUniqueSolution(grid, config)).toBe(false);
            return;
          }
        }
      }
    });

    it('should return false for unsolvable puzzle', () => {
      const unsolvable = copyGrid(EMPTY_9x9);
      unsolvable[0][0] = 1;
      unsolvable[0][1] = 1; // Two 1s in same row

      expect(hasUniqueSolution(unsolvable, config)).toBe(false);
    });

    it('should work with 6x6 grid', () => {
      const config6x6 = GRID_CONFIGS['6x6'];
      expect(hasUniqueSolution(EMPTY_6x6, config6x6)).toBe(false);
    });
  });

  // ============ solve ============

  describe('solve', () => {
    const config = GRID_CONFIGS['9x9'];

    it('should return solved grid for valid puzzle', () => {
      const result = solve(INCOMPLETE_VALID_9x9, config);

      expect(result).not.toBeNull();
      expect(isSolved(result!, config)).toBe(true);
    });

    it('should not modify the original grid', () => {
      const grid = copyGrid(INCOMPLETE_VALID_9x9);
      const originalCopy = copyGrid(grid);

      solve(grid, config);

      expect(grid).toEqual(originalCopy);
    });

    it('should return the same grid for complete valid board', () => {
      const result = solve(VALID_COMPLETE_9x9, config);

      expect(result).toEqual(VALID_COMPLETE_9x9);
    });

    it('should return null for unsolvable puzzle', () => {
      const unsolvable = copyGrid(EMPTY_9x9);
      unsolvable[0][0] = 1;
      unsolvable[0][1] = 1; // Two 1s in same row

      const result = solve(unsolvable, config);
      expect(result).toBeNull();
    });

    it('should solve 6x6 grid correctly', () => {
      const config6x6 = GRID_CONFIGS['6x6'];
      const grid = [
        [1, 0, 0, 0, 0, 6],
        [0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0],
        [6, 0, 0, 0, 0, 1],
      ];

      const result = solve(grid, config6x6);
      expect(result).not.toBeNull();
      expect(isSolved(result!, config6x6)).toBe(true);
    });
  });

  // ============ solveWithRandomization ============

  describe('solveWithRandomization', () => {
    const config = GRID_CONFIGS['9x9'];

    it('should produce a valid solution', () => {
      const grid = copyGrid(EMPTY_9x9);
      const result = solveWithRandomization(grid, config);

      expect(result).toBe(true);
      expect(isSolved(grid, config)).toBe(true);
    });

    it('should modify the grid in-place', () => {
      const grid = copyGrid(EMPTY_9x9);
      solveWithRandomization(grid, config);

      // Grid should no longer be empty
      const hasNonZero = grid.some(row => row.some(cell => cell !== 0));
      expect(hasNonZero).toBe(true);
    });

    it('should work with 6x6 grid', () => {
      const config6x6 = GRID_CONFIGS['6x6'];
      const grid = copyGrid(EMPTY_6x6);
      const result = solveWithRandomization(grid, config6x6);

      expect(result).toBe(true);
      expect(isSolved(grid, config6x6)).toBe(true);
    });

    it('should produce valid but potentially different solutions on multiple runs', () => {
      // Due to randomization, different runs may produce different valid solutions
      const grid1 = copyGrid(EMPTY_9x9);
      const grid2 = copyGrid(EMPTY_9x9);

      solveWithRandomization(grid1, config);
      solveWithRandomization(grid2, config);

      // Both should be valid
      expect(isSolved(grid1, config)).toBe(true);
      expect(isSolved(grid2, config)).toBe(true);

      // They might be different (randomization), but both are valid
    });
  });
});
