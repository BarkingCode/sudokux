import {
  getGridSize,
  getBoxDimensions,
  getTotalCells,
  getMaxNumber,
  calculateProgress,
} from '../../src/utils/gridUtils';

describe('gridUtils', () => {
  describe('getGridSize', () => {
    it('returns 6 for 6x6', () => {
      expect(getGridSize('6x6')).toBe(6);
    });

    it('returns 9 for 9x9', () => {
      expect(getGridSize('9x9')).toBe(9);
    });
  });

  describe('getBoxDimensions', () => {
    it('returns 2x3 for 6x6', () => {
      expect(getBoxDimensions('6x6')).toEqual({ boxRows: 2, boxCols: 3 });
    });

    it('returns 3x3 for 9x9', () => {
      expect(getBoxDimensions('9x9')).toEqual({ boxRows: 3, boxCols: 3 });
    });
  });

  describe('getTotalCells', () => {
    it('returns 36 for 6x6', () => {
      expect(getTotalCells('6x6')).toBe(36);
    });

    it('returns 81 for 9x9', () => {
      expect(getTotalCells('9x9')).toBe(81);
    });
  });

  describe('getMaxNumber', () => {
    it('returns 6 for 6x6', () => {
      expect(getMaxNumber('6x6')).toBe(6);
    });

    it('returns 9 for 9x9', () => {
      expect(getMaxNumber('9x9')).toBe(9);
    });
  });

  describe('calculateProgress', () => {
    it('returns 0 for empty 9x9 grid', () => {
      const grid = Array.from({ length: 9 }, () => Array(9).fill(0));
      expect(calculateProgress(grid, '9x9')).toBe(0);
    });

    it('returns 100 for full 9x9 grid', () => {
      const grid = Array.from({ length: 9 }, () => Array(9).fill(1));
      expect(calculateProgress(grid, '9x9')).toBe(100);
    });

    it('returns correct percentage for partially filled grid', () => {
      const grid = Array.from({ length: 9 }, () => Array(9).fill(0));
      // Fill first row (9 of 81 cells = ~11%)
      grid[0] = Array(9).fill(1);
      expect(calculateProgress(grid, '9x9')).toBe(11);
    });

    it('works for 6x6 grid', () => {
      const grid = Array.from({ length: 6 }, () => Array(6).fill(0));
      // Fill 18 of 36 cells = 50%
      for (let r = 0; r < 3; r++) {
        grid[r] = Array(6).fill(1);
      }
      expect(calculateProgress(grid, '6x6')).toBe(50);
    });

    it('returns 0 for empty 6x6 grid', () => {
      const grid = Array.from({ length: 6 }, () => Array(6).fill(0));
      expect(calculateProgress(grid, '6x6')).toBe(0);
    });
  });
});
