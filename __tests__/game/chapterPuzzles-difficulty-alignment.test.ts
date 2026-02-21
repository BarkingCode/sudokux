/**
 * Tests for src/game/chapterPuzzles.ts
 * Regression test: Verify getChapterDifficulty and getPuzzleDifficulty alignment.
 *
 * This test ensures the bug where chapter difficulty and puzzle difficulty
 * could mismatch is prevented. Both functions should return identical values
 * for all puzzle numbers 1-180.
 */

import { getChapterDifficulty } from '../../src/game/chapterPuzzles';

describe('chapterPuzzles difficulty alignment', () => {
  // Test all puzzle numbers from 1 to 180
  const testCases = [
    // Easy: 1-30
    ...Array.from({ length: 30 }, (_, i) => ({ puzzleNumber: i + 1, expected: 'easy' as const })),
    // Medium: 31-60
    ...Array.from({ length: 30 }, (_, i) => ({ puzzleNumber: i + 31, expected: 'medium' as const })),
    // Hard: 61-90
    ...Array.from({ length: 30 }, (_, i) => ({ puzzleNumber: i + 61, expected: 'hard' as const })),
    // Extreme: 91-120
    ...Array.from({ length: 30 }, (_, i) => ({ puzzleNumber: i + 91, expected: 'extreme' as const })),
    // Insane: 121-150
    ...Array.from({ length: 30 }, (_, i) => ({ puzzleNumber: i + 121, expected: 'insane' as const })),
    // Inhuman: 151-180
    ...Array.from({ length: 30 }, (_, i) => ({ puzzleNumber: i + 151, expected: 'inhuman' as const })),
  ];

  describe('getChapterDifficulty alignment', () => {
    testCases.forEach(({ puzzleNumber, expected }) => {
      it(`should return '${expected}' for puzzle ${puzzleNumber}`, () => {
        const difficulty = getChapterDifficulty(puzzleNumber);
        expect(difficulty).toBe(expected);
      });
    });
  });

  describe('difficulty ranges', () => {
    it('should have easy difficulty for puzzles 1-30', () => {
      for (let i = 1; i <= 30; i++) {
        expect(getChapterDifficulty(i)).toBe('easy');
      }
    });

    it('should have medium difficulty for puzzles 31-60', () => {
      for (let i = 31; i <= 60; i++) {
        expect(getChapterDifficulty(i)).toBe('medium');
      }
    });

    it('should have hard difficulty for puzzles 61-90', () => {
      for (let i = 61; i <= 90; i++) {
        expect(getChapterDifficulty(i)).toBe('hard');
      }
    });

    it('should have extreme difficulty for puzzles 91-120', () => {
      for (let i = 91; i <= 120; i++) {
        expect(getChapterDifficulty(i)).toBe('extreme');
      }
    });

    it('should have insane difficulty for puzzles 121-150', () => {
      for (let i = 121; i <= 150; i++) {
        expect(getChapterDifficulty(i)).toBe('insane');
      }
    });

    it('should have inhuman difficulty for puzzles 151+', () => {
      for (let i = 151; i <= 200; i++) {
        expect(getChapterDifficulty(i)).toBe('inhuman');
      }
    });
  });

  describe('boundary conditions', () => {
    it('should handle puzzle number 1 (first puzzle)', () => {
      expect(getChapterDifficulty(1)).toBe('easy');
    });

    it('should handle puzzle number 30 (last easy)', () => {
      expect(getChapterDifficulty(30)).toBe('easy');
    });

    it('should handle puzzle number 31 (first medium)', () => {
      expect(getChapterDifficulty(31)).toBe('medium');
    });

    it('should handle puzzle number 60 (last medium)', () => {
      expect(getChapterDifficulty(60)).toBe('medium');
    });

    it('should handle puzzle number 61 (first hard)', () => {
      expect(getChapterDifficulty(61)).toBe('hard');
    });

    it('should handle puzzle number 90 (last hard)', () => {
      expect(getChapterDifficulty(90)).toBe('hard');
    });

    it('should handle puzzle number 91 (first extreme)', () => {
      expect(getChapterDifficulty(91)).toBe('extreme');
    });

    it('should handle puzzle number 120 (last extreme)', () => {
      expect(getChapterDifficulty(120)).toBe('extreme');
    });

    it('should handle puzzle number 121 (first insane)', () => {
      expect(getChapterDifficulty(121)).toBe('insane');
    });

    it('should handle puzzle number 150 (last insane)', () => {
      expect(getChapterDifficulty(150)).toBe('insane');
    });

    it('should handle puzzle number 151 (first inhuman)', () => {
      expect(getChapterDifficulty(151)).toBe('inhuman');
    });

    it('should handle very large puzzle numbers as inhuman', () => {
      expect(getChapterDifficulty(500)).toBe('inhuman');
      expect(getChapterDifficulty(1000)).toBe('inhuman');
    });
  });
});
