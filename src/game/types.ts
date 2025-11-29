/**
 * Grid configuration types for supporting multiple Sudoku variants.
 * Supports 6x6 (mini) and 9x9 (standard) grids, extensible for future variants.
 */

/** Configuration defining the geometry and constraints for a Sudoku grid */
export interface GridConfig {
  /** Total grid size (e.g., 9 for 9x9, 6 for 6x6) */
  gridSize: number;
  /** Box height in cells (e.g., 3 for 9x9, 2 for 6x6) */
  boxRows: number;
  /** Box width in cells (e.g., 3 for both 9x9 and 6x6) */
  boxCols: number;
  /** Maximum number allowed (equals gridSize) */
  maxNumber: number;
}

/** Supported grid types */
export type GridType = '6x6' | '9x9';

/** Difficulty levels */
export type Difficulty = 'easy' | 'medium' | 'hard' | 'extreme' | 'insane' | 'inhuman';

/** 2D array representing the Sudoku grid */
export type Grid = number[][];

/** Predefined configurations for each grid type */
export const GRID_CONFIGS: Record<GridType, GridConfig> = {
  '6x6': {
    gridSize: 6,
    boxRows: 2,
    boxCols: 3,
    maxNumber: 6,
  },
  '9x9': {
    gridSize: 9,
    boxRows: 3,
    boxCols: 3,
    maxNumber: 9,
  },
};

/** Default configuration for backward compatibility */
export const DEFAULT_CONFIG: GridConfig = GRID_CONFIGS['9x9'];

/** Result of puzzle generation */
export interface GeneratedPuzzle {
  /** The puzzle grid with empty cells (0 = empty) */
  puzzle: Grid;
  /** The complete solution grid */
  solution: Grid;
  /** Difficulty level */
  difficulty: Difficulty;
  /** Grid type (6x6 or 9x9) */
  gridType: GridType;
  /** Number of filled cells (clues) in the puzzle */
  clueCount: number;
}
