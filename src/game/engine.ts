/**
 * Core Sudoku game engine with parameterized grid support.
 * Supports 6x6 (mini) and 9x9 (standard) grids.
 */

import { Grid, GridConfig, DEFAULT_CONFIG, GRID_CONFIGS } from './types';

export const BLANK = 0;

// Re-export for backward compatibility
export const GRID_SIZE = 9;
export const BOX_SIZE = 3;

// Re-export types
export type { Grid } from './types';

/**
 * Checks if a number is safe to place at grid[row][col].
 *
 * @param grid - The current grid state
 * @param row - Row index
 * @param col - Column index
 * @param num - Number to place (1-maxNumber)
 * @param config - Grid configuration (defaults to 9x9)
 * @returns true if placement is valid
 */
export const isValidMove = (
  grid: Grid,
  row: number,
  col: number,
  num: number,
  config: GridConfig = DEFAULT_CONFIG
): boolean => {
  const { gridSize, boxRows, boxCols } = config;

  // Check row
  for (let x = 0; x < gridSize; x++) {
    if (grid[row][x] === num && x !== col) return false;
  }

  // Check column
  for (let x = 0; x < gridSize; x++) {
    if (grid[x][col] === num && x !== row) return false;
  }

  // Check box
  const startRow = row - (row % boxRows);
  const startCol = col - (col % boxCols);
  for (let i = 0; i < boxRows; i++) {
    for (let j = 0; j < boxCols; j++) {
      if (
        grid[i + startRow][j + startCol] === num &&
        (i + startRow !== row || j + startCol !== col)
      ) {
        return false;
      }
    }
  }

  return true;
};

/**
 * Checks if the entire board is valid (no conflicts).
 *
 * @param grid - The grid to validate
 * @param config - Grid configuration (defaults to 9x9)
 * @returns true if the board has no conflicts
 */
export const isValidBoard = (
  grid: Grid,
  config: GridConfig = DEFAULT_CONFIG
): boolean => {
  for (let r = 0; r < config.gridSize; r++) {
    for (let c = 0; c < config.gridSize; c++) {
      if (grid[r][c] !== BLANK) {
        if (!isValidMove(grid, r, c, grid[r][c], config)) return false;
      }
    }
  }
  return true;
};

/**
 * Checks if the board is completely solved.
 *
 * @param grid - The grid to check
 * @param config - Grid configuration (defaults to 9x9)
 * @returns true if all cells are filled and valid
 */
export const isSolved = (
  grid: Grid,
  config: GridConfig = DEFAULT_CONFIG
): boolean => {
  for (let r = 0; r < config.gridSize; r++) {
    for (let c = 0; c < config.gridSize; c++) {
      if (grid[r][c] === BLANK || !isValidMove(grid, r, c, grid[r][c], config)) {
        return false;
      }
    }
  }
  return true;
};

/**
 * Solves the grid using backtracking. Returns true if solvable.
 * Modifies the grid in-place.
 *
 * @param grid - The grid to solve (modified in-place)
 * @param config - Grid configuration (defaults to 9x9)
 * @returns true if the grid was solved
 */
export const solveSudoku = (
  grid: Grid,
  config: GridConfig = DEFAULT_CONFIG
): boolean => {
  for (let row = 0; row < config.gridSize; row++) {
    for (let col = 0; col < config.gridSize; col++) {
      if (grid[row][col] === BLANK) {
        for (let num = 1; num <= config.maxNumber; num++) {
          if (isValidMove(grid, row, col, num, config)) {
            grid[row][col] = num;
            if (solveSudoku(grid, config)) return true;
            grid[row][col] = BLANK;
          }
        }
        return false;
      }
    }
  }
  return true;
};

/**
 * Generates a new empty grid.
 *
 * @param config - Grid configuration (defaults to 9x9)
 * @returns Empty grid filled with zeros
 */
export const createEmptyGrid = (
  config: GridConfig = DEFAULT_CONFIG
): Grid => {
  return Array.from({ length: config.gridSize }, () =>
    Array(config.gridSize).fill(BLANK)
  );
};

/**
 * Deep copies a grid.
 *
 * @param grid - Grid to copy
 * @returns New grid with same values
 */
export const copyGrid = (grid: Grid): Grid => {
  return grid.map(row => [...row]);
};

/**
 * Gets the GridConfig for a given grid type.
 *
 * @param gridType - '6x6' or '9x9'
 * @returns The corresponding GridConfig
 */
export const getGridConfig = (gridType: '6x6' | '9x9'): GridConfig => {
  return GRID_CONFIGS[gridType];
};
