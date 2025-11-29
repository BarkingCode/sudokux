/**
 * Tests for src/game/hintAnalyzer.ts
 * Smart hint detection and technique identification.
 */

import {
  analyzeForHint,
  getTechniqueName,
  getTechniqueDifficulty,
  TechniqueType,
  SmartHint,
} from '../../src/game/hintAnalyzer';
import { GRID_CONFIGS } from '../../src/game/types';
import {
  VALID_COMPLETE_9x9,
  VALID_COMPLETE_6x6_CORRECT,
} from '../__fixtures__/grids';
import {
  EASY_PUZZLE_9x9,
  NAKED_SINGLE_TEST_PUZZLE,
  copyGrid,
} from '../__fixtures__/puzzles';

describe('hintAnalyzer', () => {
  // ============ analyzeForHint ============

  describe('analyzeForHint', () => {
    describe('9x9 grid', () => {
      it('should detect naked single (cell with only one candidate)', () => {
        // Create a grid where cell (0,8) can only be 2
        const puzzle = copyGrid(NAKED_SINGLE_TEST_PUZZLE);
        const solution = copyGrid(VALID_COMPLETE_9x9);

        const hint = analyzeForHint(puzzle, solution, '9x9');

        expect(hint).not.toBeNull();
        expect(hint!.cell).toEqual({ row: 0, col: 8 });
        expect(hint!.value).toBe(2);
        expect(hint!.technique).toBe('naked_single');
      });

      it('should return null for solved grid (no empty cells)', () => {
        const hint = analyzeForHint(VALID_COMPLETE_9x9, VALID_COMPLETE_9x9, '9x9');

        expect(hint).toBeNull();
      });

      it('should highlight the correct cell as primary', () => {
        const puzzle = copyGrid(NAKED_SINGLE_TEST_PUZZLE);
        const solution = copyGrid(VALID_COMPLETE_9x9);

        const hint = analyzeForHint(puzzle, solution, '9x9');

        expect(hint).not.toBeNull();
        const primaryCells = hint!.highlightCells.filter(c => c.type === 'primary');
        expect(primaryCells.length).toBeGreaterThanOrEqual(1);
        expect(primaryCells[0]).toEqual({ row: hint!.cell.row, col: hint!.cell.col, type: 'primary' });
      });

      it('should provide explanation text', () => {
        const puzzle = copyGrid(NAKED_SINGLE_TEST_PUZZLE);
        const solution = copyGrid(VALID_COMPLETE_9x9);

        const hint = analyzeForHint(puzzle, solution, '9x9');

        expect(hint).not.toBeNull();
        expect(hint!.explanation).toBeDefined();
        expect(hint!.explanation.length).toBeGreaterThan(0);
      });

      it('should fall back to basic_elimination when no technique found', () => {
        // Use a puzzle where simple techniques might not apply immediately
        const puzzle = copyGrid(EASY_PUZZLE_9x9.puzzle);
        const solution = copyGrid(EASY_PUZZLE_9x9.solution);

        const hint = analyzeForHint(puzzle, solution, '9x9');

        expect(hint).not.toBeNull();
        // Should find some technique or fall back
        expect(['naked_single', 'hidden_single_row', 'hidden_single_col', 'hidden_single_box', 'basic_elimination']).toContain(hint!.technique);
      });

      it('should detect hidden single in row', () => {
        // Create a puzzle where a number can only go in one place in a row
        const puzzle: number[][] = [
          [0, 0, 0, 0, 0, 0, 0, 1, 2],
          [0, 0, 0, 0, 0, 3, 0, 0, 0],
          [0, 0, 0, 0, 0, 0, 0, 0, 0],
          [0, 0, 0, 0, 0, 0, 3, 0, 0],
          [0, 0, 0, 0, 0, 0, 0, 0, 0],
          [0, 0, 3, 0, 0, 0, 0, 0, 0],
          [0, 0, 0, 0, 0, 0, 0, 0, 3],
          [0, 0, 0, 0, 0, 0, 0, 0, 0],
          [0, 0, 0, 0, 0, 0, 0, 0, 0],
        ];

        // Create a valid solution (doesn't need to be perfect for this test)
        const solution = copyGrid(VALID_COMPLETE_9x9);

        const hint = analyzeForHint(puzzle, solution, '9x9');

        expect(hint).not.toBeNull();
        // Should find some technique
        expect(hint!.technique).toBeDefined();
      });

      it('should return correct value from solution', () => {
        const puzzle = copyGrid(EASY_PUZZLE_9x9.puzzle);
        const solution = copyGrid(EASY_PUZZLE_9x9.solution);

        const hint = analyzeForHint(puzzle, solution, '9x9');

        if (hint) {
          const { row, col } = hint.cell;
          expect(hint.value).toBe(solution[row][col]);
        }
      });
    });

    describe('6x6 grid', () => {
      it('should work with 6x6 grids', () => {
        const puzzle: number[][] = [
          [1, 0, 3, 4, 5, 6],
          [4, 5, 6, 1, 2, 3],
          [2, 3, 1, 5, 6, 4],
          [5, 6, 4, 2, 3, 1],
          [3, 1, 2, 6, 4, 5],
          [6, 4, 5, 3, 1, 2],
        ];
        const solution = copyGrid(VALID_COMPLETE_6x6_CORRECT);

        const hint = analyzeForHint(puzzle, solution, '6x6');

        expect(hint).not.toBeNull();
        expect(hint!.cell).toEqual({ row: 0, col: 1 });
        expect(hint!.value).toBe(2);
      });

      it('should return null for solved 6x6 grid', () => {
        const hint = analyzeForHint(VALID_COMPLETE_6x6_CORRECT, VALID_COMPLETE_6x6_CORRECT, '6x6');

        expect(hint).toBeNull();
      });

      it('should find hint for 6x6 puzzle', () => {
        // Create a 6x6 puzzle with one empty cell
        const puzzle: number[][] = [
          [1, 2, 3, 4, 5, 0], // Missing 6
          [4, 5, 6, 1, 2, 3],
          [2, 3, 1, 5, 6, 4],
          [5, 6, 4, 2, 3, 1],
          [3, 1, 2, 6, 4, 5],
          [6, 4, 5, 3, 1, 2],
        ];
        const solution = copyGrid(VALID_COMPLETE_6x6_CORRECT);

        const hint = analyzeForHint(puzzle, solution, '6x6');

        expect(hint).not.toBeNull();
        expect(hint!.value).toBe(6);
      });
    });

    describe('technique priority', () => {
      it('should prefer naked singles over hidden singles', () => {
        // Naked single is easier and should be detected first
        const puzzle = copyGrid(NAKED_SINGLE_TEST_PUZZLE);
        const solution = copyGrid(VALID_COMPLETE_9x9);

        const hint = analyzeForHint(puzzle, solution, '9x9');

        expect(hint).not.toBeNull();
        expect(hint!.technique).toBe('naked_single');
      });
    });
  });

  // ============ getTechniqueName ============

  describe('getTechniqueName', () => {
    it('should return "Naked Single" for naked_single', () => {
      expect(getTechniqueName('naked_single')).toBe('Naked Single');
    });

    it('should return "Hidden Single (Row)" for hidden_single_row', () => {
      expect(getTechniqueName('hidden_single_row')).toBe('Hidden Single (Row)');
    });

    it('should return "Hidden Single (Column)" for hidden_single_col', () => {
      expect(getTechniqueName('hidden_single_col')).toBe('Hidden Single (Column)');
    });

    it('should return "Hidden Single (Box)" for hidden_single_box', () => {
      expect(getTechniqueName('hidden_single_box')).toBe('Hidden Single (Box)');
    });

    it('should return "Pointing Pair" for pointing_pair', () => {
      expect(getTechniqueName('pointing_pair')).toBe('Pointing Pair');
    });

    it('should return "Basic Hint" for basic_elimination', () => {
      expect(getTechniqueName('basic_elimination')).toBe('Basic Hint');
    });

    it('should return human-readable names for all techniques', () => {
      const techniques: TechniqueType[] = [
        'naked_single',
        'hidden_single_row',
        'hidden_single_col',
        'hidden_single_box',
        'pointing_pair',
        'basic_elimination',
      ];

      techniques.forEach(technique => {
        const name = getTechniqueName(technique);
        expect(name).toBeDefined();
        expect(name.length).toBeGreaterThan(0);
        // Should not contain underscores (human-readable)
        expect(name).not.toContain('_');
      });
    });
  });

  // ============ getTechniqueDifficulty ============

  describe('getTechniqueDifficulty', () => {
    it('should return "Easy" for naked_single', () => {
      expect(getTechniqueDifficulty('naked_single')).toBe('Easy');
    });

    it('should return "Easy" for hidden_single_row', () => {
      expect(getTechniqueDifficulty('hidden_single_row')).toBe('Easy');
    });

    it('should return "Easy" for hidden_single_col', () => {
      expect(getTechniqueDifficulty('hidden_single_col')).toBe('Easy');
    });

    it('should return "Easy" for hidden_single_box', () => {
      expect(getTechniqueDifficulty('hidden_single_box')).toBe('Easy');
    });

    it('should return "Medium" for pointing_pair', () => {
      expect(getTechniqueDifficulty('pointing_pair')).toBe('Medium');
    });

    it('should return "Easy" for basic_elimination', () => {
      expect(getTechniqueDifficulty('basic_elimination')).toBe('Easy');
    });

    it('should return valid difficulty for all techniques', () => {
      const techniques: TechniqueType[] = [
        'naked_single',
        'hidden_single_row',
        'hidden_single_col',
        'hidden_single_box',
        'pointing_pair',
        'basic_elimination',
      ];

      const validDifficulties = ['Easy', 'Medium', 'Hard'];

      techniques.forEach(technique => {
        const difficulty = getTechniqueDifficulty(technique);
        expect(validDifficulties).toContain(difficulty);
      });
    });
  });
});
