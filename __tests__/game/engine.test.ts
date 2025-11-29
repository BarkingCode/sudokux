/**
 * Tests for src/game/engine.ts
 * Core Sudoku validation and solving logic.
 */

import {
  isValidMove,
  isValidBoard,
  isSolved,
  solveSudoku,
  createEmptyGrid,
  copyGrid,
  getGridConfig,
  BLANK,
} from '../../src/game/engine';
import { GRID_CONFIGS } from '../../src/game/types';
import {
  VALID_COMPLETE_9x9,
  EMPTY_9x9,
  INVALID_ROW_CONFLICT_9x9,
  INVALID_COLUMN_CONFLICT_9x9,
  INVALID_BOX_CONFLICT_9x9,
  INCOMPLETE_VALID_9x9,
  ALMOST_COMPLETE_9x9,
  VALID_COMPLETE_6x6_CORRECT,
  EMPTY_6x6,
  INVALID_ROW_CONFLICT_6x6,
  INVALID_BOX_CONFLICT_6x6,
} from '../__fixtures__/grids';

describe('engine', () => {
  // ============ isValidMove ============

  describe('isValidMove', () => {
    describe('9x9 grid', () => {
      const config = GRID_CONFIGS['9x9'];

      it('should return true for valid placement in empty cell', () => {
        const grid = copyGrid(INCOMPLETE_VALID_9x9);
        // Position (0,2) is empty, and 4 is valid there
        expect(isValidMove(grid, 0, 2, 4, config)).toBe(true);
      });

      it('should return false when number already exists in row', () => {
        const grid = copyGrid(INCOMPLETE_VALID_9x9);
        // 5 already exists in row 0 at position (0,0)
        expect(isValidMove(grid, 0, 2, 5, config)).toBe(false);
      });

      it('should return false when number already exists in column', () => {
        const grid = copyGrid(INCOMPLETE_VALID_9x9);
        // 8 already exists in column 2 at position (2,2)
        expect(isValidMove(grid, 0, 2, 8, config)).toBe(false);
      });

      it('should return false when number already exists in 3x3 box', () => {
        const grid = copyGrid(INCOMPLETE_VALID_9x9);
        // 9 already exists in the top-left 3x3 box at position (2,1)
        expect(isValidMove(grid, 0, 2, 9, config)).toBe(false);
      });

      it('should return true for same-cell validation (number at its own position)', () => {
        const grid = copyGrid(VALID_COMPLETE_9x9);
        // Check if 5 is valid at position (0,0) where 5 already exists
        expect(isValidMove(grid, 0, 0, 5, config)).toBe(true);
      });

      it('should return true for all valid numbers in empty grid', () => {
        const grid = copyGrid(EMPTY_9x9);
        for (let num = 1; num <= 9; num++) {
          expect(isValidMove(grid, 0, 0, num, config)).toBe(true);
        }
      });
    });

    describe('6x6 grid', () => {
      const config = GRID_CONFIGS['6x6'];

      it('should return true for valid placement in 6x6 grid', () => {
        const grid = copyGrid(EMPTY_6x6);
        expect(isValidMove(grid, 0, 0, 1, config)).toBe(true);
      });

      it('should respect 2x3 box boundaries in 6x6 grid', () => {
        // 6x6 has 2x3 boxes (2 rows, 3 cols per box)
        const grid = copyGrid(EMPTY_6x6);
        grid[0][0] = 1;

        // Same 2x3 box: positions (0,0), (0,1), (0,2), (1,0), (1,1), (1,2)
        expect(isValidMove(grid, 1, 2, 1, config)).toBe(false); // Same box
        expect(isValidMove(grid, 0, 3, 1, config)).toBe(false); // Same row, different box
        expect(isValidMove(grid, 2, 0, 1, config)).toBe(false); // Same column, different box
        expect(isValidMove(grid, 2, 3, 1, config)).toBe(true);  // Different row, col, and box
      });

      it('should only allow numbers 1-6 in 6x6 grid validation', () => {
        const grid = copyGrid(EMPTY_6x6);
        // Numbers 1-6 should be valid
        for (let num = 1; num <= 6; num++) {
          expect(isValidMove(grid, 0, 0, num, config)).toBe(true);
        }
      });
    });
  });

  // ============ isValidBoard ============

  describe('isValidBoard', () => {
    describe('9x9 grid', () => {
      const config = GRID_CONFIGS['9x9'];

      it('should return true for valid complete board', () => {
        expect(isValidBoard(VALID_COMPLETE_9x9, config)).toBe(true);
      });

      it('should return true for valid incomplete board', () => {
        expect(isValidBoard(INCOMPLETE_VALID_9x9, config)).toBe(true);
      });

      it('should return true for empty board', () => {
        expect(isValidBoard(EMPTY_9x9, config)).toBe(true);
      });

      it('should return false for board with row conflict', () => {
        expect(isValidBoard(INVALID_ROW_CONFLICT_9x9, config)).toBe(false);
      });

      it('should return false for board with column conflict', () => {
        expect(isValidBoard(INVALID_COLUMN_CONFLICT_9x9, config)).toBe(false);
      });

      it('should return false for board with box conflict', () => {
        expect(isValidBoard(INVALID_BOX_CONFLICT_9x9, config)).toBe(false);
      });
    });

    describe('6x6 grid', () => {
      const config = GRID_CONFIGS['6x6'];

      it('should return true for valid complete 6x6 board', () => {
        expect(isValidBoard(VALID_COMPLETE_6x6_CORRECT, config)).toBe(true);
      });

      it('should return false for 6x6 board with row conflict', () => {
        expect(isValidBoard(INVALID_ROW_CONFLICT_6x6, config)).toBe(false);
      });

      it('should return false for 6x6 board with box conflict', () => {
        expect(isValidBoard(INVALID_BOX_CONFLICT_6x6, config)).toBe(false);
      });
    });
  });

  // ============ isSolved ============

  describe('isSolved', () => {
    describe('9x9 grid', () => {
      const config = GRID_CONFIGS['9x9'];

      it('should return true for completely solved valid board', () => {
        expect(isSolved(VALID_COMPLETE_9x9, config)).toBe(true);
      });

      it('should return false for incomplete board', () => {
        expect(isSolved(INCOMPLETE_VALID_9x9, config)).toBe(false);
      });

      it('should return false for empty board', () => {
        expect(isSolved(EMPTY_9x9, config)).toBe(false);
      });

      it('should return false for complete but invalid board (with conflicts)', () => {
        expect(isSolved(INVALID_ROW_CONFLICT_9x9, config)).toBe(false);
      });

      it('should return false for almost complete board (one cell empty)', () => {
        expect(isSolved(ALMOST_COMPLETE_9x9, config)).toBe(false);
      });
    });

    describe('6x6 grid', () => {
      const config = GRID_CONFIGS['6x6'];

      it('should return true for completely solved valid 6x6 board', () => {
        expect(isSolved(VALID_COMPLETE_6x6_CORRECT, config)).toBe(true);
      });

      it('should return false for empty 6x6 board', () => {
        expect(isSolved(EMPTY_6x6, config)).toBe(false);
      });
    });
  });

  // ============ solveSudoku ============

  describe('solveSudoku', () => {
    const config = GRID_CONFIGS['9x9'];

    it('should solve a valid solvable puzzle', () => {
      const grid = copyGrid(INCOMPLETE_VALID_9x9);
      const result = solveSudoku(grid, config);

      expect(result).toBe(true);
      expect(isSolved(grid, config)).toBe(true);
    });

    it('should not modify an already complete board', () => {
      const grid = copyGrid(VALID_COMPLETE_9x9);
      const result = solveSudoku(grid, config);

      expect(result).toBe(true);
      expect(grid).toEqual(VALID_COMPLETE_9x9);
    });

    it('should return true for empty grid (all solutions valid)', () => {
      const grid = copyGrid(EMPTY_9x9);
      const result = solveSudoku(grid, config);

      expect(result).toBe(true);
      expect(isSolved(grid, config)).toBe(true);
    });

    it('should solve 6x6 grid correctly', () => {
      const config6x6 = GRID_CONFIGS['6x6'];
      const grid: number[][] = [
        [1, 0, 0, 0, 0, 6],
        [0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0],
        [6, 0, 0, 0, 0, 1],
      ];

      const result = solveSudoku(grid, config6x6);
      expect(result).toBe(true);
      expect(isSolved(grid, config6x6)).toBe(true);
    });
  });

  // ============ createEmptyGrid ============

  describe('createEmptyGrid', () => {
    it('should create 9x9 empty grid by default', () => {
      const grid = createEmptyGrid();

      expect(grid.length).toBe(9);
      expect(grid[0].length).toBe(9);
      grid.forEach(row => {
        row.forEach(cell => {
          expect(cell).toBe(BLANK);
        });
      });
    });

    it('should create 6x6 empty grid with correct config', () => {
      const config = GRID_CONFIGS['6x6'];
      const grid = createEmptyGrid(config);

      expect(grid.length).toBe(6);
      expect(grid[0].length).toBe(6);
      grid.forEach(row => {
        row.forEach(cell => {
          expect(cell).toBe(BLANK);
        });
      });
    });

    it('should create independent rows (no shared references)', () => {
      const grid = createEmptyGrid();
      grid[0][0] = 5;

      expect(grid[1][0]).toBe(BLANK);
    });
  });

  // ============ copyGrid ============

  describe('copyGrid', () => {
    it('should create a deep copy of the grid', () => {
      const original = copyGrid(VALID_COMPLETE_9x9);
      const copy = copyGrid(original);

      expect(copy).toEqual(original);
      expect(copy).not.toBe(original);
    });

    it('should not share row references with original', () => {
      const original = copyGrid(VALID_COMPLETE_9x9);
      const copy = copyGrid(original);

      copy[0][0] = 0;

      expect(original[0][0]).toBe(5); // Original unchanged
      expect(copy[0][0]).toBe(0);
    });

    it('should copy empty grid correctly', () => {
      const original = copyGrid(EMPTY_9x9);
      const copy = copyGrid(original);

      expect(copy).toEqual(original);
    });
  });

  // ============ getGridConfig ============

  describe('getGridConfig', () => {
    it('should return correct config for 9x9 grid', () => {
      const config = getGridConfig('9x9');

      expect(config.gridSize).toBe(9);
      expect(config.boxRows).toBe(3);
      expect(config.boxCols).toBe(3);
      expect(config.maxNumber).toBe(9);
    });

    it('should return correct config for 6x6 grid', () => {
      const config = getGridConfig('6x6');

      expect(config.gridSize).toBe(6);
      expect(config.boxRows).toBe(2);
      expect(config.boxCols).toBe(3);
      expect(config.maxNumber).toBe(6);
    });
  });
});
