/**
 * Tests for src/game/chapterPuzzles.ts
 * Deterministic chapter puzzle generation.
 */

import {
  getChapterDifficulty,
  getChapterPuzzle,
  getChapterPuzzleAsync,
} from '../../src/game/chapterPuzzles';
import { isSolved, isValidBoard } from '../../src/game/engine';
import { GRID_CONFIGS } from '../../src/game/types';

describe('chapterPuzzles', () => {
  describe('getChapterDifficulty', () => {
    it('should return easy for puzzles 1-30', () => {
      expect(getChapterDifficulty(1)).toBe('easy');
      expect(getChapterDifficulty(15)).toBe('easy');
      expect(getChapterDifficulty(30)).toBe('easy');
    });

    it('should return medium for puzzles 31-60', () => {
      expect(getChapterDifficulty(31)).toBe('medium');
      expect(getChapterDifficulty(45)).toBe('medium');
      expect(getChapterDifficulty(60)).toBe('medium');
    });

    it('should return hard for puzzles 61-90', () => {
      expect(getChapterDifficulty(61)).toBe('hard');
      expect(getChapterDifficulty(75)).toBe('hard');
      expect(getChapterDifficulty(90)).toBe('hard');
    });

    it('should return extreme for puzzles 91-120', () => {
      expect(getChapterDifficulty(91)).toBe('extreme');
      expect(getChapterDifficulty(105)).toBe('extreme');
      expect(getChapterDifficulty(120)).toBe('extreme');
    });

    it('should return insane for puzzles 121-150', () => {
      expect(getChapterDifficulty(121)).toBe('insane');
      expect(getChapterDifficulty(135)).toBe('insane');
      expect(getChapterDifficulty(150)).toBe('insane');
    });

    it('should return inhuman for puzzles beyond 150', () => {
      expect(getChapterDifficulty(151)).toBe('inhuman');
      expect(getChapterDifficulty(200)).toBe('inhuman');
      expect(getChapterDifficulty(999)).toBe('inhuman');
    });
  });

  describe('getChapterPuzzle', () => {
    it('should generate a deterministic puzzle for the same puzzle number', () => {
      const puzzle1 = getChapterPuzzle(5, '9x9');
      const puzzle2 = getChapterPuzzle(5, '9x9');

      // Same puzzle number should always produce the same puzzle
      expect(puzzle1.puzzle).toEqual(puzzle2.puzzle);
      expect(puzzle1.solution).toEqual(puzzle2.solution);
    });

    it('should generate different puzzles for different puzzle numbers', () => {
      const puzzle1 = getChapterPuzzle(1, '9x9');
      const puzzle2 = getChapterPuzzle(2, '9x9');

      // Different puzzle numbers should produce different puzzles
      expect(puzzle1.puzzle).not.toEqual(puzzle2.puzzle);
    });

    it('should generate a valid 9x9 puzzle', () => {
      const puzzle = getChapterPuzzle(10, '9x9');
      const config = GRID_CONFIGS['9x9'];

      // Puzzle should be a 9x9 grid
      expect(puzzle.puzzle.length).toBe(9);
      expect(puzzle.puzzle[0].length).toBe(9);

      // Solution should be a valid complete grid
      expect(isValidBoard(puzzle.solution, config)).toBe(true);
      expect(isSolved(puzzle.solution, config)).toBe(true);
    });

    it('should generate a valid 6x6 puzzle', () => {
      const puzzle = getChapterPuzzle(10, '6x6');
      const config = GRID_CONFIGS['6x6'];

      // Puzzle should be a 6x6 grid
      expect(puzzle.puzzle.length).toBe(6);
      expect(puzzle.puzzle[0].length).toBe(6);

      // Solution should be a valid complete grid
      expect(isValidBoard(puzzle.solution, config)).toBe(true);
      expect(isSolved(puzzle.solution, config)).toBe(true);
    });

    it('should set the correct difficulty based on puzzle number', () => {
      const puzzleEasy = getChapterPuzzle(5, '9x9');
      const puzzleMedium = getChapterPuzzle(45, '9x9');
      const puzzleHard = getChapterPuzzle(75, '9x9');

      expect(puzzleEasy.difficulty).toBe('easy');
      expect(puzzleMedium.difficulty).toBe('medium');
      expect(puzzleHard.difficulty).toBe('hard');
    });

    it('should generate puzzle where solution solves the puzzle', () => {
      const puzzle = getChapterPuzzle(15, '9x9');

      // For each clue in the puzzle, it should match the solution
      for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
          if (puzzle.puzzle[row][col] !== 0) {
            expect(puzzle.puzzle[row][col]).toBe(puzzle.solution[row][col]);
          }
        }
      }
    });

    it('should be consistent across multiple calls for various puzzle numbers', () => {
      // Test multiple puzzle numbers to ensure determinism
      const puzzleNumbers = [1, 25, 50, 75, 100, 150];

      for (const num of puzzleNumbers) {
        const puzzle1 = getChapterPuzzle(num, '9x9');
        const puzzle2 = getChapterPuzzle(num, '9x9');

        expect(puzzle1.puzzle).toEqual(puzzle2.puzzle);
        expect(puzzle1.solution).toEqual(puzzle2.solution);
        expect(puzzle1.difficulty).toEqual(puzzle2.difficulty);
      }
    });
  });

  describe('getChapterPuzzleAsync', () => {
    it('should generate the same puzzle as the sync version', async () => {
      const syncPuzzle = getChapterPuzzle(10, '9x9');
      const asyncPuzzle = await getChapterPuzzleAsync(10, '9x9');

      expect(asyncPuzzle.puzzle).toEqual(syncPuzzle.puzzle);
      expect(asyncPuzzle.solution).toEqual(syncPuzzle.solution);
      expect(asyncPuzzle.difficulty).toEqual(syncPuzzle.difficulty);
    });

    it('should return a valid puzzle', async () => {
      const puzzle = await getChapterPuzzleAsync(5, '9x9');
      const config = GRID_CONFIGS['9x9'];

      expect(isValidBoard(puzzle.solution, config)).toBe(true);
      expect(isSolved(puzzle.solution, config)).toBe(true);
    });
  });

  describe('puzzle uniqueness across difficulty boundaries', () => {
    it('should generate different puzzles at difficulty boundaries', () => {
      // Test puzzles at difficulty boundaries (30 per level)
      const puzzle30 = getChapterPuzzle(30, '9x9'); // Last easy
      const puzzle31 = getChapterPuzzle(31, '9x9'); // First medium
      const puzzle60 = getChapterPuzzle(60, '9x9'); // Last medium
      const puzzle61 = getChapterPuzzle(61, '9x9'); // First hard

      // Each should be different
      expect(puzzle30.puzzle).not.toEqual(puzzle31.puzzle);
      expect(puzzle60.puzzle).not.toEqual(puzzle61.puzzle);
    });
  });
});
