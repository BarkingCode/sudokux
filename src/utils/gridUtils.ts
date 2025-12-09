/**
 * Grid utility functions for Sudoku calculations.
 */

import type { GridType } from '../context/GameContext';

/**
 * Get the grid size (number of cells per row/column) for a grid type
 * @param gridType - The grid type ('6x6' or '9x9')
 * @returns The grid size (6 or 9)
 */
export const getGridSize = (gridType: GridType): number => {
  return gridType === '6x6' ? 6 : 9;
};

/**
 * Get the box dimensions for a grid type
 * @param gridType - The grid type ('6x6' or '9x9')
 * @returns Object with boxRows and boxCols
 */
export const getBoxDimensions = (gridType: GridType): { boxRows: number; boxCols: number } => {
  if (gridType === '6x6') {
    return { boxRows: 2, boxCols: 3 };
  }
  return { boxRows: 3, boxCols: 3 };
};

/**
 * Get the total number of cells in a grid
 * @param gridType - The grid type ('6x6' or '9x9')
 * @returns Total number of cells (36 or 81)
 */
export const getTotalCells = (gridType: GridType): number => {
  const size = getGridSize(gridType);
  return size * size;
};

/**
 * Get the maximum number allowed in a grid
 * @param gridType - The grid type ('6x6' or '9x9')
 * @returns Maximum number (6 or 9)
 */
export const getMaxNumber = (gridType: GridType): number => {
  return getGridSize(gridType);
};

/**
 * Calculate progress percentage for a grid
 * @param grid - The current grid state (2D array)
 * @param gridType - The grid type
 * @returns Progress percentage (0-100)
 */
export const calculateProgress = (grid: number[][], gridType: GridType): number => {
  const size = getGridSize(gridType);
  const totalCells = size * size;
  let filledCells = 0;

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (grid[r][c] !== 0) filledCells++;
    }
  }

  return Math.round((filledCells / totalCells) * 100);
};
