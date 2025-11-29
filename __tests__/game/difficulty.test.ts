/**
 * Tests for src/game/difficulty.ts
 * Difficulty configuration and parameters.
 */

import {
  getDifficultyParams,
  getTotalCells,
  getDifficultyDisplayName,
  DIFFICULTY_LEVELS,
  DifficultyParams,
} from '../../src/game/difficulty';
import { Difficulty, GridType } from '../../src/game/types';

describe('difficulty', () => {
  // ============ getDifficultyParams ============

  describe('getDifficultyParams', () => {
    describe('9x9 grid', () => {
      const gridType: GridType = '9x9';

      it('should return correct params for easy difficulty', () => {
        const params = getDifficultyParams(gridType, 'easy');

        expect(params.removals).toBe(30);
        expect(params.minClues).toBe(46);
        expect(params.maxClues).toBe(55);
      });

      it('should return correct params for medium difficulty', () => {
        const params = getDifficultyParams(gridType, 'medium');

        expect(params.removals).toBe(40);
        expect(params.minClues).toBe(38);
        expect(params.maxClues).toBe(45);
      });

      it('should return correct params for hard difficulty', () => {
        const params = getDifficultyParams(gridType, 'hard');

        expect(params.removals).toBe(50);
        expect(params.minClues).toBe(28);
        expect(params.maxClues).toBe(35);
      });

      it('should return correct params for extreme difficulty', () => {
        const params = getDifficultyParams(gridType, 'extreme');

        expect(params.removals).toBe(55);
        expect(params.minClues).toBe(23);
        expect(params.maxClues).toBe(29);
      });

      it('should return correct params for insane difficulty', () => {
        const params = getDifficultyParams(gridType, 'insane');

        expect(params.removals).toBe(58);
        expect(params.minClues).toBe(20);
        expect(params.maxClues).toBe(26);
      });

      it('should return correct params for inhuman difficulty', () => {
        const params = getDifficultyParams(gridType, 'inhuman');

        expect(params.removals).toBe(62);
        expect(params.minClues).toBe(17);
        expect(params.maxClues).toBe(22);
      });

      it('should have increasing removals as difficulty increases', () => {
        const difficulties: Difficulty[] = ['easy', 'medium', 'hard', 'extreme', 'insane', 'inhuman'];
        let prevRemovals = 0;

        difficulties.forEach(difficulty => {
          const params = getDifficultyParams(gridType, difficulty);
          expect(params.removals).toBeGreaterThan(prevRemovals);
          prevRemovals = params.removals;
        });
      });

      it('should have decreasing minClues as difficulty increases', () => {
        const difficulties: Difficulty[] = ['easy', 'medium', 'hard', 'extreme', 'insane', 'inhuman'];
        let prevMinClues = 100;

        difficulties.forEach(difficulty => {
          const params = getDifficultyParams(gridType, difficulty);
          expect(params.minClues).toBeLessThan(prevMinClues);
          prevMinClues = params.minClues;
        });
      });
    });

    describe('6x6 grid', () => {
      const gridType: GridType = '6x6';

      it('should return correct params for easy difficulty', () => {
        const params = getDifficultyParams(gridType, 'easy');

        expect(params.removals).toBe(10);
        expect(params.minClues).toBe(24);
        expect(params.maxClues).toBe(28);
      });

      it('should return correct params for medium difficulty', () => {
        const params = getDifficultyParams(gridType, 'medium');

        expect(params.removals).toBe(14);
        expect(params.minClues).toBe(20);
        expect(params.maxClues).toBe(24);
      });

      it('should return correct params for hard difficulty', () => {
        const params = getDifficultyParams(gridType, 'hard');

        expect(params.removals).toBe(18);
        expect(params.minClues).toBe(16);
        expect(params.maxClues).toBe(20);
      });

      it('should return correct params for extreme difficulty', () => {
        const params = getDifficultyParams(gridType, 'extreme');

        expect(params.removals).toBe(21);
        expect(params.minClues).toBe(13);
        expect(params.maxClues).toBe(17);
      });

      it('should return correct params for insane difficulty', () => {
        const params = getDifficultyParams(gridType, 'insane');

        expect(params.removals).toBe(24);
        expect(params.minClues).toBe(10);
        expect(params.maxClues).toBe(14);
      });

      it('should return correct params for inhuman difficulty', () => {
        const params = getDifficultyParams(gridType, 'inhuman');

        expect(params.removals).toBe(26);
        expect(params.minClues).toBe(8);
        expect(params.maxClues).toBe(12);
      });
    });

    describe('all combinations', () => {
      it('should have valid params for all 12 combinations', () => {
        const gridTypes: GridType[] = ['6x6', '9x9'];
        const difficulties: Difficulty[] = ['easy', 'medium', 'hard', 'extreme', 'insane', 'inhuman'];

        gridTypes.forEach(gridType => {
          difficulties.forEach(difficulty => {
            const params = getDifficultyParams(gridType, difficulty);

            expect(params.removals).toBeGreaterThan(0);
            expect(params.minClues).toBeGreaterThan(0);
            expect(params.maxClues).toBeGreaterThan(params.minClues);
          });
        });
      });
    });
  });

  // ============ getTotalCells ============

  describe('getTotalCells', () => {
    it('should return 81 for 9x9 grid', () => {
      expect(getTotalCells('9x9')).toBe(81);
    });

    it('should return 36 for 6x6 grid', () => {
      expect(getTotalCells('6x6')).toBe(36);
    });
  });

  // ============ getDifficultyDisplayName ============

  describe('getDifficultyDisplayName', () => {
    it('should return "Easy" for easy', () => {
      expect(getDifficultyDisplayName('easy')).toBe('Easy');
    });

    it('should return "Medium" for medium', () => {
      expect(getDifficultyDisplayName('medium')).toBe('Medium');
    });

    it('should return "Hard" for hard', () => {
      expect(getDifficultyDisplayName('hard')).toBe('Hard');
    });

    it('should return "Extreme" for extreme', () => {
      expect(getDifficultyDisplayName('extreme')).toBe('Extreme');
    });

    it('should return "Insane" for insane', () => {
      expect(getDifficultyDisplayName('insane')).toBe('Insane');
    });

    it('should return "Inhuman" for inhuman', () => {
      expect(getDifficultyDisplayName('inhuman')).toBe('Inhuman');
    });

    it('should return capitalized names for all difficulties', () => {
      DIFFICULTY_LEVELS.forEach(difficulty => {
        const displayName = getDifficultyDisplayName(difficulty);
        expect(displayName[0]).toBe(displayName[0].toUpperCase());
      });
    });
  });

  // ============ DIFFICULTY_LEVELS ============

  describe('DIFFICULTY_LEVELS', () => {
    it('should contain all 6 difficulty levels', () => {
      expect(DIFFICULTY_LEVELS).toHaveLength(6);
    });

    it('should contain levels in order from easiest to hardest', () => {
      expect(DIFFICULTY_LEVELS).toEqual([
        'easy',
        'medium',
        'hard',
        'extreme',
        'insane',
        'inhuman',
      ]);
    });

    it('should contain only valid Difficulty types', () => {
      const validDifficulties = ['easy', 'medium', 'hard', 'extreme', 'insane', 'inhuman'];
      DIFFICULTY_LEVELS.forEach(level => {
        expect(validDifficulties).toContain(level);
      });
    });
  });
});
