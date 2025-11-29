/**
 * Smart Hint Analyzer
 *
 * Analyzes Sudoku puzzles to find the next logical move and
 * identifies which solving technique can be used.
 */

import { Grid, GridConfig, GRID_CONFIGS } from './types';

export type TechniqueType =
  | 'naked_single'
  | 'hidden_single_row'
  | 'hidden_single_col'
  | 'hidden_single_box'
  | 'pointing_pair'
  | 'basic_elimination';

export interface SmartHint {
  technique: TechniqueType;
  cell: { row: number; col: number };
  value: number;
  explanation: string;
  highlightCells: Array<{ row: number; col: number; type: 'primary' | 'secondary' | 'elimination' }>;
}

interface CandidatesGrid {
  [row: number]: {
    [col: number]: Set<number>;
  };
}

/**
 * Calculate all candidates for empty cells
 */
const calculateCandidates = (
  grid: Grid,
  config: GridConfig
): CandidatesGrid => {
  const candidates: CandidatesGrid = {};
  const { gridSize, boxRows, boxCols, maxNumber } = config;

  for (let row = 0; row < gridSize; row++) {
    candidates[row] = {};
    for (let col = 0; col < gridSize; col++) {
      if (grid[row][col] === 0) {
        const possible = new Set<number>();

        for (let num = 1; num <= maxNumber; num++) {
          let valid = true;

          // Check row
          for (let c = 0; c < gridSize && valid; c++) {
            if (grid[row][c] === num) valid = false;
          }

          // Check column
          for (let r = 0; r < gridSize && valid; r++) {
            if (grid[r][col] === num) valid = false;
          }

          // Check box
          const startRow = row - (row % boxRows);
          const startCol = col - (col % boxCols);
          for (let r = 0; r < boxRows && valid; r++) {
            for (let c = 0; c < boxCols && valid; c++) {
              if (grid[startRow + r][startCol + c] === num) valid = false;
            }
          }

          if (valid) possible.add(num);
        }

        candidates[row][col] = possible;
      } else {
        candidates[row][col] = new Set();
      }
    }
  }

  return candidates;
};

/**
 * Find a Naked Single - cell with only one candidate
 */
const findNakedSingle = (
  grid: Grid,
  candidates: CandidatesGrid,
  config: GridConfig
): SmartHint | null => {
  for (let row = 0; row < config.gridSize; row++) {
    for (let col = 0; col < config.gridSize; col++) {
      if (grid[row][col] === 0 && candidates[row][col].size === 1) {
        const value = Array.from(candidates[row][col])[0];

        // Find cells that eliminate other candidates
        const highlightCells: SmartHint['highlightCells'] = [
          { row, col, type: 'primary' },
        ];

        // Add filled cells in same row/col/box as elimination hints
        for (let c = 0; c < config.gridSize; c++) {
          if (c !== col && grid[row][c] !== 0) {
            highlightCells.push({ row, col: c, type: 'elimination' });
          }
        }
        for (let r = 0; r < config.gridSize; r++) {
          if (r !== row && grid[r][col] !== 0) {
            highlightCells.push({ row: r, col, type: 'elimination' });
          }
        }

        return {
          technique: 'naked_single',
          cell: { row, col },
          value,
          explanation: `This cell can only contain ${value}. All other numbers (1-${config.maxNumber}) are already present in the same row, column, or box.`,
          highlightCells,
        };
      }
    }
  }
  return null;
};

/**
 * Find a Hidden Single in a row - number that can only go in one cell
 */
const findHiddenSingleRow = (
  grid: Grid,
  candidates: CandidatesGrid,
  config: GridConfig
): SmartHint | null => {
  for (let row = 0; row < config.gridSize; row++) {
    for (let num = 1; num <= config.maxNumber; num++) {
      // Find all cells in this row where num is a candidate
      const possibleCols: number[] = [];

      for (let col = 0; col < config.gridSize; col++) {
        if (grid[row][col] === 0 && candidates[row][col].has(num)) {
          possibleCols.push(col);
        }
      }

      if (possibleCols.length === 1) {
        const col = possibleCols[0];

        const highlightCells: SmartHint['highlightCells'] = [
          { row, col, type: 'primary' },
        ];

        // Highlight the entire row
        for (let c = 0; c < config.gridSize; c++) {
          if (c !== col) {
            highlightCells.push({ row, col: c, type: 'secondary' });
          }
        }

        return {
          technique: 'hidden_single_row',
          cell: { row, col },
          value: num,
          explanation: `In Row ${row + 1}, the number ${num} can only go in this cell. Check the other cells in the row - they either already have numbers or ${num} would conflict with their row/column/box.`,
          highlightCells,
        };
      }
    }
  }
  return null;
};

/**
 * Find a Hidden Single in a column
 */
const findHiddenSingleCol = (
  grid: Grid,
  candidates: CandidatesGrid,
  config: GridConfig
): SmartHint | null => {
  for (let col = 0; col < config.gridSize; col++) {
    for (let num = 1; num <= config.maxNumber; num++) {
      const possibleRows: number[] = [];

      for (let row = 0; row < config.gridSize; row++) {
        if (grid[row][col] === 0 && candidates[row][col].has(num)) {
          possibleRows.push(row);
        }
      }

      if (possibleRows.length === 1) {
        const row = possibleRows[0];

        const highlightCells: SmartHint['highlightCells'] = [
          { row, col, type: 'primary' },
        ];

        for (let r = 0; r < config.gridSize; r++) {
          if (r !== row) {
            highlightCells.push({ row: r, col, type: 'secondary' });
          }
        }

        return {
          technique: 'hidden_single_col',
          cell: { row, col },
          value: num,
          explanation: `In Column ${col + 1}, the number ${num} can only go in this cell. All other cells in the column either have numbers or would create a conflict with ${num}.`,
          highlightCells,
        };
      }
    }
  }
  return null;
};

/**
 * Find a Hidden Single in a box
 */
const findHiddenSingleBox = (
  grid: Grid,
  candidates: CandidatesGrid,
  config: GridConfig
): SmartHint | null => {
  const { gridSize, boxRows, boxCols, maxNumber } = config;

  for (let boxRow = 0; boxRow < gridSize / boxRows; boxRow++) {
    for (let boxCol = 0; boxCol < gridSize / boxCols; boxCol++) {
      const startRow = boxRow * boxRows;
      const startCol = boxCol * boxCols;

      for (let num = 1; num <= maxNumber; num++) {
        const possibleCells: Array<{ row: number; col: number }> = [];

        for (let r = 0; r < boxRows; r++) {
          for (let c = 0; c < boxCols; c++) {
            const row = startRow + r;
            const col = startCol + c;
            if (grid[row][col] === 0 && candidates[row][col].has(num)) {
              possibleCells.push({ row, col });
            }
          }
        }

        if (possibleCells.length === 1) {
          const { row, col } = possibleCells[0];

          const highlightCells: SmartHint['highlightCells'] = [
            { row, col, type: 'primary' },
          ];

          // Highlight entire box
          for (let r = 0; r < boxRows; r++) {
            for (let c = 0; c < boxCols; c++) {
              const cellRow = startRow + r;
              const cellCol = startCol + c;
              if (cellRow !== row || cellCol !== col) {
                highlightCells.push({ row: cellRow, col: cellCol, type: 'secondary' });
              }
            }
          }

          return {
            technique: 'hidden_single_box',
            cell: { row, col },
            value: num,
            explanation: `In this box, the number ${num} can only go in this cell. Every other empty cell in the box would cause a conflict with ${num} in its row or column.`,
            highlightCells,
          };
        }
      }
    }
  }
  return null;
};

/**
 * Analyze the board and find the best smart hint
 */
export const analyzeForHint = (
  grid: Grid,
  solution: Grid,
  gridType: '6x6' | '9x9' = '9x9'
): SmartHint | null => {
  const config = GRID_CONFIGS[gridType];
  const candidates = calculateCandidates(grid, config);

  // Try techniques in order of difficulty (easier first)

  // 1. Naked Singles - easiest technique
  const nakedSingle = findNakedSingle(grid, candidates, config);
  if (nakedSingle) return nakedSingle;

  // 2. Hidden Singles in rows
  const hiddenRow = findHiddenSingleRow(grid, candidates, config);
  if (hiddenRow) return hiddenRow;

  // 3. Hidden Singles in columns
  const hiddenCol = findHiddenSingleCol(grid, candidates, config);
  if (hiddenCol) return hiddenCol;

  // 4. Hidden Singles in boxes
  const hiddenBox = findHiddenSingleBox(grid, candidates, config);
  if (hiddenBox) return hiddenBox;

  // If no technique found, fall back to revealing a cell from solution
  for (let row = 0; row < config.gridSize; row++) {
    for (let col = 0; col < config.gridSize; col++) {
      if (grid[row][col] === 0) {
        return {
          technique: 'basic_elimination',
          cell: { row, col },
          value: solution[row][col],
          explanation: `The correct value for this cell is ${solution[row][col]}. Try using pencil marks to track candidates and practice finding patterns.`,
          highlightCells: [{ row, col, type: 'primary' }],
        };
      }
    }
  }

  return null;
};

/**
 * Get a human-readable name for a technique
 */
export const getTechniqueName = (technique: TechniqueType): string => {
  switch (technique) {
    case 'naked_single':
      return 'Naked Single';
    case 'hidden_single_row':
      return 'Hidden Single (Row)';
    case 'hidden_single_col':
      return 'Hidden Single (Column)';
    case 'hidden_single_box':
      return 'Hidden Single (Box)';
    case 'pointing_pair':
      return 'Pointing Pair';
    case 'basic_elimination':
      return 'Basic Hint';
    default:
      return 'Hint';
  }
};

/**
 * Get difficulty level for a technique (for display)
 */
export const getTechniqueDifficulty = (technique: TechniqueType): 'Easy' | 'Medium' | 'Hard' => {
  switch (technique) {
    case 'naked_single':
      return 'Easy';
    case 'hidden_single_row':
    case 'hidden_single_col':
    case 'hidden_single_box':
      return 'Easy';
    case 'pointing_pair':
      return 'Medium';
    case 'basic_elimination':
      return 'Easy';
    default:
      return 'Medium';
  }
};
