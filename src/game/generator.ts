/**
 * Sudoku puzzle generator with uniqueness validation.
 * Generates puzzles for 6x6 and 9x9 grids with guaranteed unique solutions.
 */

import { BLANK, copyGrid, createEmptyGrid } from './engine';
import { hasUniqueSolution, solveWithRandomization, solveWithRandomizationSeeded } from './solver';
import { getDifficultyParams } from './difficulty';
import { SeededRandom } from './seededRandom';
import {
  Grid,
  GridConfig,
  GridType,
  Difficulty,
  GeneratedPuzzle,
  GRID_CONFIGS,
  DEFAULT_CONFIG,
} from './types';

/**
 * Shuffles an array using Fisher-Yates algorithm.
 */
const shuffleArray = <T>(array: T[]): T[] => {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

/**
 * Checks if a number is safe within a specific box during generation.
 */
const isSafeInBox = (
  grid: Grid,
  rowStart: number,
  colStart: number,
  num: number,
  boxRows: number,
  boxCols: number
): boolean => {
  for (let i = 0; i < boxRows; i++) {
    for (let j = 0; j < boxCols; j++) {
      if (grid[rowStart + i][colStart + j] === num) return false;
    }
  }
  return true;
};

/**
 * Fills a single box with random valid numbers.
 */
const fillBox = (
  grid: Grid,
  rowStart: number,
  colStart: number,
  config: GridConfig
): void => {
  const { boxRows, boxCols, maxNumber } = config;
  const numbers = shuffleArray(
    Array.from({ length: maxNumber }, (_, i) => i + 1)
  );

  let numIndex = 0;
  for (let i = 0; i < boxRows; i++) {
    for (let j = 0; j < boxCols; j++) {
      // Find a number that's safe in this box
      while (
        !isSafeInBox(grid, rowStart, colStart, numbers[numIndex], boxRows, boxCols)
      ) {
        numIndex++;
        if (numIndex >= numbers.length) {
          // This shouldn't happen with proper shuffling, but handle gracefully
          numIndex = 0;
        }
      }
      grid[rowStart + i][colStart + j] = numbers[numIndex];
      numIndex++;
    }
  }
};

/**
 * Generates a complete valid Sudoku board.
 * Fills diagonal boxes first (they're independent), then solves the rest.
 */
const generateFullBoard = (config: GridConfig): Grid => {
  const grid = createEmptyGrid(config);
  const { gridSize, boxRows, boxCols } = config;

  // Calculate number of diagonal boxes
  // For 9x9: boxes at (0,0), (3,3), (6,6) = 3 boxes
  // For 6x6: boxes at (0,0), (2,3) = 2 boxes (with 2x3 boxes)
  const numDiagonalBoxes = Math.floor(gridSize / boxCols);

  // Fill diagonal boxes first (they don't affect each other)
  for (let i = 0; i < numDiagonalBoxes; i++) {
    const rowStart = i * boxRows;
    const colStart = i * boxCols;
    fillBox(grid, rowStart, colStart, config);
  }

  // Solve the rest using randomized backtracking
  solveWithRandomization(grid, config);

  return grid;
};

/**
 * Gets all cell positions as [row, col] pairs.
 */
const getAllPositions = (config: GridConfig): [number, number][] => {
  const positions: [number, number][] = [];
  for (let r = 0; r < config.gridSize; r++) {
    for (let c = 0; c < config.gridSize; c++) {
      positions.push([r, c]);
    }
  }
  return positions;
};

/**
 * Generates a Sudoku puzzle with guaranteed unique solution.
 *
 * Algorithm:
 * 1. Generate a complete valid board
 * 2. Shuffle all cell positions
 * 3. Try removing each cell, keeping removal only if puzzle remains unique
 * 4. Stop when target removals reached
 *
 * @param gridType - '6x6' or '9x9'
 * @param difficulty - 'easy', 'medium', or 'hard'
 * @returns Generated puzzle with solution
 */
export const generatePuzzle = (
  gridType: GridType = '9x9',
  difficulty: Difficulty = 'medium'
): GeneratedPuzzle => {
  const config = GRID_CONFIGS[gridType];
  const params = getDifficultyParams(gridType, difficulty);

  // Generate complete solution
  const solution = generateFullBoard(config);
  const puzzle = copyGrid(solution);

  // Get all positions and shuffle for random removal order
  const positions = shuffleArray(getAllPositions(config));

  const totalCells = config.gridSize * config.gridSize;
  const targetRemovals = params.removals;
  let removed = 0;

  // Try to remove cells while maintaining unique solution
  for (const [row, col] of positions) {
    if (removed >= targetRemovals) break;
    if (puzzle[row][col] === BLANK) continue;

    const backup = puzzle[row][col];
    puzzle[row][col] = BLANK;

    // Check if puzzle still has unique solution
    if (hasUniqueSolution(puzzle, config)) {
      removed++;
    } else {
      // Restore - removing this cell creates multiple solutions
      puzzle[row][col] = backup;
    }
  }

  const clueCount = totalCells - removed;

  return {
    puzzle,
    solution,
    difficulty,
    gridType,
    clueCount,
  };
};

/**
 * Generates a puzzle asynchronously to avoid blocking the UI.
 * Wraps generatePuzzle in a Promise for use with async/await.
 *
 * @param gridType - '6x6' or '9x9'
 * @param difficulty - 'easy', 'medium', or 'hard'
 * @returns Promise resolving to generated puzzle
 */
export const generatePuzzleAsync = (
  gridType: GridType = '9x9',
  difficulty: Difficulty = 'medium'
): Promise<GeneratedPuzzle> => {
  return new Promise((resolve) => {
    // Use setTimeout to yield to the event loop
    setTimeout(() => {
      const puzzle = generatePuzzle(gridType, difficulty);
      resolve(puzzle);
    }, 0);
  });
};

/**
 * Fills a single box with seeded random numbers.
 */
const fillBoxSeeded = (
  grid: Grid,
  rowStart: number,
  colStart: number,
  config: GridConfig,
  rng: SeededRandom
): void => {
  const { boxRows, boxCols, maxNumber } = config;
  const numbers = rng.shuffle(
    Array.from({ length: maxNumber }, (_, i) => i + 1)
  );

  let numIndex = 0;
  for (let i = 0; i < boxRows; i++) {
    for (let j = 0; j < boxCols; j++) {
      while (
        !isSafeInBox(grid, rowStart, colStart, numbers[numIndex], boxRows, boxCols)
      ) {
        numIndex++;
        if (numIndex >= numbers.length) {
          numIndex = 0;
        }
      }
      grid[rowStart + i][colStart + j] = numbers[numIndex];
      numIndex++;
    }
  }
};

/**
 * Generates a complete valid Sudoku board with seeded randomness.
 */
const generateFullBoardSeeded = (config: GridConfig, rng: SeededRandom): Grid => {
  const grid = createEmptyGrid(config);
  const { gridSize, boxRows, boxCols } = config;

  const numDiagonalBoxes = Math.floor(gridSize / boxCols);

  // Fill diagonal boxes first using seeded randomness
  for (let i = 0; i < numDiagonalBoxes; i++) {
    const rowStart = i * boxRows;
    const colStart = i * boxCols;
    fillBoxSeeded(grid, rowStart, colStart, config, rng);
  }

  // Solve the rest using seeded randomized backtracking
  solveWithRandomizationSeeded(grid, config, rng);

  return grid;
};

/**
 * Generates a Sudoku puzzle with deterministic seeded randomness.
 * Given the same seed, always produces the same puzzle.
 *
 * @param gridType - '6x6' or '9x9'
 * @param difficulty - 'easy', 'medium', 'hard', etc.
 * @param seed - Numeric seed for deterministic generation
 * @returns Generated puzzle with solution
 */
export const generateSeededPuzzle = (
  gridType: GridType = '9x9',
  difficulty: Difficulty = 'medium',
  seed: number
): GeneratedPuzzle => {
  const rng = new SeededRandom(seed);
  const config = GRID_CONFIGS[gridType];
  const params = getDifficultyParams(gridType, difficulty);

  // Generate complete solution with seeded randomness
  const solution = generateFullBoardSeeded(config, rng);
  const puzzle = copyGrid(solution);

  // Get all positions and shuffle with seeded randomness
  const positions = rng.shuffle(getAllPositions(config));

  const totalCells = config.gridSize * config.gridSize;
  const targetRemovals = params.removals;
  let removed = 0;

  // Try to remove cells while maintaining unique solution
  for (const [row, col] of positions) {
    if (removed >= targetRemovals) break;
    if (puzzle[row][col] === BLANK) continue;

    const backup = puzzle[row][col];
    puzzle[row][col] = BLANK;

    // Check if puzzle still has unique solution
    if (hasUniqueSolution(puzzle, config)) {
      removed++;
    } else {
      // Restore - removing this cell creates multiple solutions
      puzzle[row][col] = backup;
    }
  }

  const clueCount = totalCells - removed;

  return {
    puzzle,
    solution,
    difficulty,
    gridType,
    clueCount,
  };
};

/**
 * Generates a seeded puzzle asynchronously to avoid blocking the UI.
 *
 * @param gridType - '6x6' or '9x9'
 * @param difficulty - 'easy', 'medium', 'hard', etc.
 * @param seed - Numeric seed for deterministic generation
 * @returns Promise resolving to generated puzzle
 */
export const generateSeededPuzzleAsync = (
  gridType: GridType = '9x9',
  difficulty: Difficulty = 'medium',
  seed: number
): Promise<GeneratedPuzzle> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const puzzle = generateSeededPuzzle(gridType, difficulty, seed);
      resolve(puzzle);
    }, 0);
  });
};

// Legacy export for backward compatibility
export { GeneratedPuzzle } from './types';
