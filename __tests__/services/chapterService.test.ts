/**
 * Tests for src/services/chapterService.ts
 * Chapter completion CRUD and stats.
 */

import { chapterService } from '../../src/services/chapterService';
import { supabase } from '../../src/lib/supabase';

describe('chapterService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    chapterService.clearCache();
  });

  const mockPuzzleData = {
    puzzleNumber: 1,
    difficulty: 'easy',
    gridType: '9x9',
    puzzleGrid: [[0, 1], [2, 3]],
    solutionGrid: [[4, 1], [2, 3]],
    timeSeconds: 120,
    mistakes: 2,
    helperUsed: 1,
  };

  // Helper to mock getUserId
  const mockGetUserId = (userId: string | null) => {
    const chain = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({
        data: userId ? { id: userId } : null,
        error: userId ? null : { message: 'not found' },
      }),
    };
    return chain;
  };

  describe('saveCompletion', () => {
    it('should save a completion to supabase', async () => {
      const mockCompletion = { id: 'comp-1', puzzle_number: 1, difficulty: 'easy' };
      let callCount = 0;
      (supabase.from as jest.Mock).mockImplementation((table: string) => {
        callCount++;
        if (table === 'users') {
          return mockGetUserId('sb-user-123');
        }
        // chapter_completions
        return {
          upsert: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: mockCompletion, error: null }),
        };
      });

      const result = await chapterService.saveCompletion('internal-123', mockPuzzleData);

      expect(result).toEqual(mockCompletion);
    });

    it('should return null if user not found', async () => {
      (supabase.from as jest.Mock).mockImplementation(() => mockGetUserId(null));

      const result = await chapterService.saveCompletion('unknown', mockPuzzleData);

      expect(result).toBeNull();
    });

    it('should return null on supabase error', async () => {
      let callCount = 0;
      (supabase.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'users') return mockGetUserId('sb-user-123');
        return {
          upsert: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: null, error: { message: 'fail' } }),
        };
      });

      const result = await chapterService.saveCompletion('internal-123', mockPuzzleData);

      expect(result).toBeNull();
    });
  });

  describe('getCompletion', () => {
    it('should return completion from supabase', async () => {
      const mockCompletion = { id: 'comp-1', puzzle_number: 5, difficulty: 'hard' };
      (supabase.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'users') return mockGetUserId('sb-user-123');
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          maybeSingle: jest.fn().mockResolvedValue({ data: mockCompletion, error: null }),
        };
      });

      const result = await chapterService.getCompletion('internal-123', 5);

      expect(result).toEqual(mockCompletion);
    });

    it('should return cached completion', async () => {
      const mockCompletion = { id: 'comp-1', puzzle_number: 5, difficulty: 'hard' };
      (supabase.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'users') return mockGetUserId('sb-user-123');
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          maybeSingle: jest.fn().mockResolvedValue({ data: mockCompletion, error: null }),
        };
      });

      // First call populates cache
      await chapterService.getCompletion('internal-123', 5);
      // Second call should use cache
      const result = await chapterService.getCompletion('internal-123', 5);

      expect(result).toEqual(mockCompletion);
    });

    it('should return null if user not found', async () => {
      (supabase.from as jest.Mock).mockImplementation(() => mockGetUserId(null));

      const result = await chapterService.getCompletion('unknown', 1);

      expect(result).toBeNull();
    });
  });

  describe('getAllCompletions', () => {
    it('should return all completions for a user', async () => {
      const mockCompletions = [
        { id: '1', puzzle_number: 1, difficulty: 'easy', time_seconds: 60, mistakes: 0 },
        { id: '2', puzzle_number: 2, difficulty: 'medium', time_seconds: 120, mistakes: 1 },
      ];
      (supabase.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'users') return mockGetUserId('sb-user-123');
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          order: jest.fn().mockResolvedValue({ data: mockCompletions, error: null }),
        };
      });

      const result = await chapterService.getAllCompletions('internal-123');

      expect(result).toHaveLength(2);
    });

    it('should return empty array if user not found', async () => {
      (supabase.from as jest.Mock).mockImplementation(() => mockGetUserId(null));

      const result = await chapterService.getAllCompletions('unknown');

      expect(result).toEqual([]);
    });
  });

  describe('getChapterStats', () => {
    it('should calculate stats from completions', async () => {
      const mockCompletions = [
        { id: '1', puzzle_number: 1, difficulty: 'easy', time_seconds: 60, mistakes: 0 },
        { id: '2', puzzle_number: 2, difficulty: 'easy', time_seconds: 120, mistakes: 2 },
        { id: '3', puzzle_number: 3, difficulty: 'hard', time_seconds: 180, mistakes: 1 },
      ];
      (supabase.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'users') return mockGetUserId('sb-user-123');
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          order: jest.fn().mockResolvedValue({ data: mockCompletions, error: null }),
        };
      });

      const stats = await chapterService.getChapterStats('internal-123');

      expect(stats.totalCompleted).toBe(3);
      expect(stats.totalTime).toBe(360);
      expect(stats.totalMistakes).toBe(3);
      expect(stats.averageTime).toBe(120);
      expect(stats.completionsByDifficulty).toEqual({ easy: 2, hard: 1 });
    });

    it('should return zero stats when no completions', async () => {
      (supabase.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'users') return mockGetUserId('sb-user-123');
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          order: jest.fn().mockResolvedValue({ data: [], error: null }),
        };
      });

      const stats = await chapterService.getChapterStats('internal-123');

      expect(stats.totalCompleted).toBe(0);
      expect(stats.averageTime).toBe(0);
    });
  });

  describe('parsePuzzleGrid', () => {
    it('should parse valid JSON grid', () => {
      const grid = chapterService.parsePuzzleGrid('[[1,2],[3,4]]');
      expect(grid).toEqual([[1, 2], [3, 4]]);
    });

    it('should return empty array on invalid JSON', () => {
      const grid = chapterService.parsePuzzleGrid('invalid');
      expect(grid).toEqual([]);
    });
  });

  describe('clearCache', () => {
    it('should clear the cache without error', () => {
      expect(() => chapterService.clearCache()).not.toThrow();
    });
  });
});
