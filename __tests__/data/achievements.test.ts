import {
  ACHIEVEMENTS,
  getAchievementById,
  getAchievementsByCategory,
  CATEGORY_LABELS,
  type AchievementDefinition,
} from '../../src/data/achievements';

describe('achievements data', () => {
  describe('ACHIEVEMENTS array', () => {
    it('is non-empty', () => {
      expect(ACHIEVEMENTS.length).toBeGreaterThan(0);
    });

    it('every achievement has required fields', () => {
      for (const a of ACHIEVEMENTS) {
        expect(a.id).toBeTruthy();
        expect(typeof a.id).toBe('string');
        expect(a.name).toBeTruthy();
        expect(typeof a.name).toBe('string');
        expect(a.description).toBeTruthy();
        expect(typeof a.description).toBe('string');
        expect(a.icon).toBeTruthy();
        expect(a.category).toBeTruthy();
      }
    });

    it('has no duplicate IDs', () => {
      const ids = ACHIEVEMENTS.map((a) => a.id);
      const unique = new Set(ids);
      expect(unique.size).toBe(ids.length);
    });

    it('all categories are valid', () => {
      const validCategories = ['milestone', 'skill', 'streak', 'mastery', 'daily', 'grid'];
      for (const a of ACHIEVEMENTS) {
        expect(validCategories).toContain(a.category);
      }
    });

    it('achievements with count progressType have a target', () => {
      const countAchievements = ACHIEVEMENTS.filter((a) => a.progressType === 'count');
      for (const a of countAchievements) {
        expect(a.target).toBeDefined();
        expect(a.target).toBeGreaterThan(0);
      }
    });

    it('achievements with streak progressType have a target', () => {
      const streakAchievements = ACHIEVEMENTS.filter((a) => a.progressType === 'streak');
      for (const a of streakAchievements) {
        expect(a.target).toBeDefined();
        expect(a.target).toBeGreaterThan(0);
      }
    });
  });

  describe('getAchievementById', () => {
    it('returns achievement for valid id', () => {
      const result = getAchievementById('first_puzzle');
      expect(result).toBeDefined();
      expect(result!.name).toBe('First Steps');
    });

    it('returns undefined for invalid id', () => {
      expect(getAchievementById('nonexistent' as any)).toBeUndefined();
    });
  });

  describe('getAchievementsByCategory', () => {
    it('returns only milestone achievements', () => {
      const milestones = getAchievementsByCategory('milestone');
      expect(milestones.length).toBeGreaterThan(0);
      milestones.forEach((a) => expect(a.category).toBe('milestone'));
    });

    it('returns only skill achievements', () => {
      const skills = getAchievementsByCategory('skill');
      expect(skills.length).toBeGreaterThan(0);
      skills.forEach((a) => expect(a.category).toBe('skill'));
    });

    it('returns empty array for empty category', () => {
      expect(getAchievementsByCategory('nonexistent' as any)).toEqual([]);
    });
  });

  describe('CATEGORY_LABELS', () => {
    it('has labels for all valid categories', () => {
      expect(CATEGORY_LABELS.milestone).toBe('Milestones');
      expect(CATEGORY_LABELS.skill).toBe('Skills');
      expect(CATEGORY_LABELS.streak).toBe('Streaks');
      expect(CATEGORY_LABELS.mastery).toBe('Mastery');
      expect(CATEGORY_LABELS.daily).toBe('Daily');
      expect(CATEGORY_LABELS.grid).toBe('Grid Types');
    });
  });
});
