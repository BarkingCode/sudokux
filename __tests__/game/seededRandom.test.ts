/**
 * Tests for src/game/seededRandom.ts
 * Seeded pseudo-random number generator for deterministic puzzle generation.
 */

import { SeededRandom, createChapterSeed } from '../../src/game/seededRandom';

describe('SeededRandom', () => {
  describe('deterministic output', () => {
    it('should produce the same sequence for the same seed', () => {
      const rng1 = new SeededRandom(12345);
      const rng2 = new SeededRandom(12345);

      const sequence1 = [rng1.next(), rng1.next(), rng1.next(), rng1.next(), rng1.next()];
      const sequence2 = [rng2.next(), rng2.next(), rng2.next(), rng2.next(), rng2.next()];

      expect(sequence1).toEqual(sequence2);
    });

    it('should produce different sequences for different seeds', () => {
      const rng1 = new SeededRandom(12345);
      const rng2 = new SeededRandom(54321);

      const val1 = rng1.next();
      const val2 = rng2.next();

      expect(val1).not.toEqual(val2);
    });

    it('should produce values between 0 and 1', () => {
      const rng = new SeededRandom(42);

      for (let i = 0; i < 1000; i++) {
        const val = rng.next();
        expect(val).toBeGreaterThanOrEqual(0);
        expect(val).toBeLessThan(1);
      }
    });
  });

  describe('nextInt', () => {
    it('should produce integers in the specified range (0 to max-1)', () => {
      const rng = new SeededRandom(42);

      for (let i = 0; i < 100; i++) {
        const val = rng.nextInt(10); // Returns 0-9
        expect(Number.isInteger(val)).toBe(true);
        expect(val).toBeGreaterThanOrEqual(0);
        expect(val).toBeLessThan(10);
      }
    });

    it('should be deterministic', () => {
      const rng1 = new SeededRandom(99999);
      const rng2 = new SeededRandom(99999);

      const sequence1 = [rng1.nextInt(100), rng1.nextInt(100), rng1.nextInt(100)];
      const sequence2 = [rng2.nextInt(100), rng2.nextInt(100), rng2.nextInt(100)];

      expect(sequence1).toEqual(sequence2);
    });
  });

  describe('shuffle', () => {
    it('should shuffle an array deterministically', () => {
      const rng1 = new SeededRandom(12345);
      const rng2 = new SeededRandom(12345);

      const arr1 = [1, 2, 3, 4, 5, 6, 7, 8, 9];
      const arr2 = [1, 2, 3, 4, 5, 6, 7, 8, 9];

      const shuffled1 = rng1.shuffle(arr1);
      const shuffled2 = rng2.shuffle(arr2);

      expect(shuffled1).toEqual(shuffled2);
    });

    it('should not modify the original array', () => {
      const rng = new SeededRandom(42);
      const original = [1, 2, 3, 4, 5];
      const copy = [...original];

      rng.shuffle(original);

      expect(original).toEqual(copy);
    });

    it('should produce a different order from different seeds', () => {
      const rng1 = new SeededRandom(11111);
      const rng2 = new SeededRandom(22222);

      const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9];
      const shuffled1 = rng1.shuffle(arr);
      const shuffled2 = rng2.shuffle(arr);

      // While it's theoretically possible for two different seeds to produce
      // the same shuffle, it's extremely unlikely
      expect(shuffled1).not.toEqual(shuffled2);
    });

    it('should contain all original elements', () => {
      const rng = new SeededRandom(42);
      const original = [1, 2, 3, 4, 5, 6, 7, 8, 9];
      const shuffled = rng.shuffle(original);

      expect(shuffled.sort((a, b) => a - b)).toEqual(original.sort((a, b) => a - b));
    });
  });
});

describe('createChapterSeed', () => {
  it('should produce deterministic seeds for the same puzzle and difficulty', () => {
    const seed1 = createChapterSeed(5, 'easy');
    const seed2 = createChapterSeed(5, 'easy');

    expect(seed1).toEqual(seed2);
  });

  it('should produce different seeds for different puzzle numbers', () => {
    const seed1 = createChapterSeed(1, 'easy');
    const seed2 = createChapterSeed(2, 'easy');
    const seed3 = createChapterSeed(100, 'easy');

    expect(seed1).not.toEqual(seed2);
    expect(seed2).not.toEqual(seed3);
    expect(seed1).not.toEqual(seed3);
  });

  it('should produce different seeds for different difficulties', () => {
    const seedEasy = createChapterSeed(1, 'easy');
    const seedMedium = createChapterSeed(1, 'medium');
    const seedHard = createChapterSeed(1, 'hard');

    expect(seedEasy).not.toEqual(seedMedium);
    expect(seedMedium).not.toEqual(seedHard);
  });

  it('should return an integer (can be positive or negative)', () => {
    const seed = createChapterSeed(42, 'extreme');

    expect(Number.isInteger(seed)).toBe(true);
    // Seed can be negative due to XOR operations, but should be finite
    expect(Number.isFinite(seed)).toBe(true);
  });
});
