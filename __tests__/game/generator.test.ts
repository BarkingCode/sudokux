/**
 * Tests for src/game/generator.ts
 * Puzzle generation with uniqueness validation.
 */

import { generatePuzzle, generatePuzzleAsync } from '../../src/game/generator';
import { hasUniqueSolution } from '../../src/game/solver';
import { isSolved, isValidBoard } from '../../src/game/engine';
import { getDifficultyParams, getTotalCells } from '../../src/game/difficulty';
import { GRID_CONFIGS, Difficulty, GridType, GeneratedPuzzle } from '../../src/game/types';

describe('generator', () => {
  // Helper to count filled cells
  const countClues = (grid: number[][]): number => {
    return grid.flat().filter(cell => cell !== 0).length;
  };

  // Helper to check if solution matches puzzle when solved
  const solutionMatchesPuzzle = (puzzle: GeneratedPuzzle): boolean => {
    const { puzzle: puzzleGrid, solution } = puzzle;
    for (let r = 0; r < puzzleGrid.length; r++) {
      for (let c = 0; c < puzzleGrid[r].length; c++) {
        if (puzzleGrid[r][c] !== 0 && puzzleGrid[r][c] !== solution[r][c]) {
          return false;
        }
      }
    }
    return true;
  };

  // ============ generatePuzzle ============

  describe('generatePuzzle', () => {
    describe('9x9 puzzles', () => {
      const gridType: GridType = '9x9';
      const config = GRID_CONFIGS[gridType];

      it('should generate puzzle with unique solution for easy difficulty', () => {
        const puzzle = generatePuzzle(gridType, 'easy');

        expect(hasUniqueSolution(puzzle.puzzle, config)).toBe(true);
      });

      it('should generate puzzle with unique solution for medium difficulty', () => {
        const puzzle = generatePuzzle(gridType, 'medium');

        expect(hasUniqueSolution(puzzle.puzzle, config)).toBe(true);
      });

      it('should generate puzzle with unique solution for hard difficulty', () => {
        const puzzle = generatePuzzle(gridType, 'hard');

        expect(hasUniqueSolution(puzzle.puzzle, config)).toBe(true);
      });

      it('should generate puzzle with unique solution for extreme difficulty', () => {
        const puzzle = generatePuzzle(gridType, 'extreme');

        expect(hasUniqueSolution(puzzle.puzzle, config)).toBe(true);
      }, 10000); // Allow more time for harder puzzles

      it('should generate puzzle with unique solution for insane difficulty', () => {
        const puzzle = generatePuzzle(gridType, 'insane');

        expect(hasUniqueSolution(puzzle.puzzle, config)).toBe(true);
      }, 15000);

      it('should generate puzzle with unique solution for inhuman difficulty', () => {
        const puzzle = generatePuzzle(gridType, 'inhuman');

        expect(hasUniqueSolution(puzzle.puzzle, config)).toBe(true);
      }, 20000);

      it('should produce valid solution', () => {
        const puzzle = generatePuzzle(gridType, 'easy');

        expect(isSolved(puzzle.solution, config)).toBe(true);
      });

      it('should have puzzle that matches solution at filled cells', () => {
        const puzzle = generatePuzzle(gridType, 'medium');

        expect(solutionMatchesPuzzle(puzzle)).toBe(true);
      });

      it('should have clue count within expected range for easy', () => {
        const puzzle = generatePuzzle(gridType, 'easy');
        const params = getDifficultyParams(gridType, 'easy');

        expect(puzzle.clueCount).toBeGreaterThanOrEqual(params.minClues);
        expect(puzzle.clueCount).toBeLessThanOrEqual(params.maxClues);
      });

      it('should have clue count within expected range for medium', () => {
        const puzzle = generatePuzzle(gridType, 'medium');
        const params = getDifficultyParams(gridType, 'medium');

        expect(puzzle.clueCount).toBeGreaterThanOrEqual(params.minClues);
        expect(puzzle.clueCount).toBeLessThanOrEqual(params.maxClues);
      });

      it('should have clue count within expected range for hard', () => {
        const puzzle = generatePuzzle(gridType, 'hard');
        const params = getDifficultyParams(gridType, 'hard');

        expect(puzzle.clueCount).toBeGreaterThanOrEqual(params.minClues);
        expect(puzzle.clueCount).toBeLessThanOrEqual(params.maxClues);
      });

      it('should set correct gridType in result', () => {
        const puzzle = generatePuzzle(gridType, 'easy');

        expect(puzzle.gridType).toBe(gridType);
      });

      it('should set correct difficulty in result', () => {
        const difficulty: Difficulty = 'hard';
        const puzzle = generatePuzzle(gridType, difficulty);

        expect(puzzle.difficulty).toBe(difficulty);
      });

      it('should generate 9x9 sized grids', () => {
        const puzzle = generatePuzzle(gridType, 'easy');

        expect(puzzle.puzzle.length).toBe(9);
        expect(puzzle.puzzle[0].length).toBe(9);
        expect(puzzle.solution.length).toBe(9);
        expect(puzzle.solution[0].length).toBe(9);
      });

      it('should generate valid board (no conflicts in puzzle)', () => {
        const puzzle = generatePuzzle(gridType, 'medium');

        expect(isValidBoard(puzzle.puzzle, config)).toBe(true);
      });

      it('should report correct clue count', () => {
        const puzzle = generatePuzzle(gridType, 'medium');
        const actualClues = countClues(puzzle.puzzle);

        expect(puzzle.clueCount).toBe(actualClues);
      });
    });

    describe('6x6 puzzles', () => {
      const gridType: GridType = '6x6';
      const config = GRID_CONFIGS[gridType];

      it('should generate puzzle with unique solution for easy difficulty', () => {
        const puzzle = generatePuzzle(gridType, 'easy');

        expect(hasUniqueSolution(puzzle.puzzle, config)).toBe(true);
      });

      it('should generate puzzle with unique solution for medium difficulty', () => {
        const puzzle = generatePuzzle(gridType, 'medium');

        expect(hasUniqueSolution(puzzle.puzzle, config)).toBe(true);
      });

      it('should generate puzzle with unique solution for hard difficulty', () => {
        const puzzle = generatePuzzle(gridType, 'hard');

        expect(hasUniqueSolution(puzzle.puzzle, config)).toBe(true);
      });

      it('should produce valid solution', () => {
        const puzzle = generatePuzzle(gridType, 'medium');

        expect(isSolved(puzzle.solution, config)).toBe(true);
      });

      it('should have clue count within expected range for easy', () => {
        const puzzle = generatePuzzle(gridType, 'easy');
        const params = getDifficultyParams(gridType, 'easy');

        expect(puzzle.clueCount).toBeGreaterThanOrEqual(params.minClues);
        expect(puzzle.clueCount).toBeLessThanOrEqual(params.maxClues);
      });

      it('should generate 6x6 sized grids', () => {
        const puzzle = generatePuzzle(gridType, 'easy');

        expect(puzzle.puzzle.length).toBe(6);
        expect(puzzle.puzzle[0].length).toBe(6);
        expect(puzzle.solution.length).toBe(6);
        expect(puzzle.solution[0].length).toBe(6);
      });

      it('should set correct gridType in result', () => {
        const puzzle = generatePuzzle(gridType, 'medium');

        expect(puzzle.gridType).toBe(gridType);
      });

      it('should only contain numbers 1-6 in 6x6 puzzle', () => {
        const puzzle = generatePuzzle(gridType, 'easy');

        puzzle.solution.forEach(row => {
          row.forEach(cell => {
            expect(cell).toBeGreaterThanOrEqual(1);
            expect(cell).toBeLessThanOrEqual(6);
          });
        });
      });
    });

    describe('default parameters', () => {
      it('should default to 9x9 grid when gridType not specified', () => {
        const puzzle = generatePuzzle();

        expect(puzzle.gridType).toBe('9x9');
        expect(puzzle.puzzle.length).toBe(9);
      });

      it('should default to medium difficulty when not specified', () => {
        const puzzle = generatePuzzle('9x9');

        expect(puzzle.difficulty).toBe('medium');
      });
    });

    describe('performance', () => {
      it('should generate 9x9 easy puzzle in reasonable time', () => {
        const start = Date.now();
        generatePuzzle('9x9', 'easy');
        const duration = Date.now() - start;

        expect(duration).toBeLessThan(3000); // Less than 3 seconds
      });

      it('should generate 6x6 puzzle quickly', () => {
        const start = Date.now();
        generatePuzzle('6x6', 'hard');
        const duration = Date.now() - start;

        expect(duration).toBeLessThan(1000); // Less than 1 second
      });
    });
  });

  // ============ generatePuzzleAsync ============

  describe('generatePuzzleAsync', () => {
    it('should return a promise that resolves to a puzzle', async () => {
      const puzzle = await generatePuzzleAsync('9x9', 'easy');

      expect(puzzle).toBeDefined();
      expect(puzzle.puzzle).toBeDefined();
      expect(puzzle.solution).toBeDefined();
    });

    it('should generate valid unique puzzle asynchronously', async () => {
      const config = GRID_CONFIGS['9x9'];
      const puzzle = await generatePuzzleAsync('9x9', 'medium');

      expect(hasUniqueSolution(puzzle.puzzle, config)).toBe(true);
    });

    it('should work with 6x6 grid', async () => {
      const config = GRID_CONFIGS['6x6'];
      const puzzle = await generatePuzzleAsync('6x6', 'easy');

      expect(puzzle.gridType).toBe('6x6');
      expect(hasUniqueSolution(puzzle.puzzle, config)).toBe(true);
    });

    it('should use default parameters', async () => {
      const puzzle = await generatePuzzleAsync();

      expect(puzzle.gridType).toBe('9x9');
      expect(puzzle.difficulty).toBe('medium');
    });
  });
});
