/**
 * Seeded Random Number Generator
 *
 * Uses Mulberry32 algorithm for deterministic pseudo-random number generation.
 * Given the same seed, it produces the same sequence of "random" numbers.
 * This is essential for generating deterministic puzzles based on puzzle number.
 */

export class SeededRandom {
  private state: number;

  constructor(seed: number) {
    this.state = seed;
  }

  /**
   * Returns a pseudo-random number between 0 (inclusive) and 1 (exclusive).
   * Uses Mulberry32 algorithm.
   */
  next(): number {
    let t = (this.state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /**
   * Returns a pseudo-random integer between 0 (inclusive) and max (exclusive).
   */
  nextInt(max: number): number {
    return Math.floor(this.next() * max);
  }

  /**
   * Shuffles array in place using Fisher-Yates with seeded randomness.
   * Returns a new shuffled array (does not modify original).
   */
  shuffle<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = this.nextInt(i + 1);
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }
}

/**
 * Creates a deterministic seed from puzzle number and difficulty.
 * This ensures the same puzzle number always produces the same puzzle.
 */
export function createChapterSeed(puzzleNumber: number, difficulty: string): number {
  // Hash the difficulty string to a number
  const difficultyHash = difficulty.split('').reduce((acc, char) => {
    return acc * 31 + char.charCodeAt(0);
  }, 0);

  // Combine puzzle number and difficulty hash using a prime multiplier
  // This ensures different puzzles get different seeds
  return (puzzleNumber * 1000003) ^ difficultyHash;
}
