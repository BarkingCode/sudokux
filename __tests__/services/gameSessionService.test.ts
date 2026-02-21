/**
 * Tests for src/services/gameSessionService.ts
 * Game session recording and history retrieval.
 */

import { recordGameSession, getGameHistory } from '../../src/services/gameSessionService';
import { supabase } from '../../src/lib/supabase';

describe('gameSessionService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============ recordGameSession ============

  describe('recordGameSession', () => {
    it('should insert game session correctly', async () => {
      const mockSession = {
        id: 'session-1',
        user_id: 'user-123',
        puzzle_id: 'puzzle-1',
        difficulty: 'medium',
        time_seconds: 300,
        mistakes: 2,
        helper_used: 1,
        completed: true,
        grid_type: '9x9',
        completed_at: '2024-01-15T10:00:00Z',
        created_at: '2024-01-15T10:00:00Z',
      };

      (supabase.from as jest.Mock).mockReturnValue({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockSession,
          error: null,
        }),
      });

      const result = await recordGameSession('user-123', {
        puzzleId: 'puzzle-1',
        difficulty: 'medium',
        timeSeconds: 300,
        mistakes: 2,
        helperUsed: 1,
        completed: true,
        gridType: '9x9',
      });

      expect(result).toEqual(mockSession);
      expect(supabase.from).toHaveBeenCalledWith('game_sessions');
    });

    it('should default to 9x9 grid type if not provided', async () => {
      let insertedData: any;

      (supabase.from as jest.Mock).mockReturnValue({
        insert: jest.fn((data) => {
          insertedData = data;
          return {
            select: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { ...data, id: 'session-1' },
              error: null,
            }),
          };
        }),
      });

      await recordGameSession('user-123', {
        puzzleId: 'puzzle-1',
        difficulty: 'easy',
        timeSeconds: 180,
        mistakes: 0,
        helperUsed: 0,
        completed: true,
      });

      expect(insertedData.grid_type).toBe('9x9');
    });

    it('should use provided grid type', async () => {
      let insertedData: any;

      (supabase.from as jest.Mock).mockReturnValue({
        insert: jest.fn((data) => {
          insertedData = data;
          return {
            select: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { ...data, id: 'session-1' },
              error: null,
            }),
          };
        }),
      });

      await recordGameSession('user-123', {
        puzzleId: 'puzzle-1',
        difficulty: 'easy',
        timeSeconds: 120,
        mistakes: 1,
        helperUsed: 0,
        completed: true,
        gridType: '6x6',
      });

      expect(insertedData.grid_type).toBe('6x6');
    });

    it('should return null on error', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error' },
        }),
      });

      const result = await recordGameSession('user-123', {
        puzzleId: 'puzzle-1',
        difficulty: 'medium',
        timeSeconds: 300,
        mistakes: 2,
        helperUsed: 0,
        completed: true,
      });

      expect(result).toBeNull();
    });

    it('should handle exceptions gracefully', async () => {
      (supabase.from as jest.Mock).mockImplementation(() => {
        throw new Error('Connection failed');
      });

      const result = await recordGameSession('user-123', {
        puzzleId: 'puzzle-1',
        difficulty: 'medium',
        timeSeconds: 300,
        mistakes: 2,
        helperUsed: 0,
        completed: true,
      });

      expect(result).toBeNull();
    });
  });

  // ============ getGameHistory ============

  describe('getGameHistory', () => {
    it('should fetch from multiple tables', async () => {
      const mockGameSessions = [
        {
          id: 'gs-1',
          user_id: 'user-123',
          puzzle_id: 'puzzle-1',
          difficulty: 'medium',
          time_seconds: 300,
          mistakes: 2,
          helper_used: 0,
          completed: true,
          grid_type: '9x9',
          completed_at: '2024-01-15T12:00:00Z',
          created_at: '2024-01-15T12:00:00Z',
        },
      ];

      const mockChapters = [
        {
          id: 'ch-1',
          user_id: 'user-123',
          difficulty: 'easy',
          time_seconds: 180,
          mistakes: 0,
          helper_used: 0,
          completed_at: '2024-01-15T11:00:00Z',
          created_at: '2024-01-15T11:00:00Z',
          puzzle_number: 5,
        },
      ];

      const mockDaily = [
        {
          id: 'dc-1',
          user_id: 'user-123',
          challenge_id: 'challenge-1',
          time_seconds: 250,
          mistakes: 1,
          helper_used: 0,
          completed_at: '2024-01-15T10:00:00Z',
        },
      ];

      const mockDailyChallenge = [
        {
          id: 'challenge-1',
          difficulty: 'hard',
        },
      ];

      let callCount = 0;
      (supabase.from as jest.Mock).mockImplementation((table) => {
        callCount++;
        
        if (table === 'game_sessions') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            order: jest.fn().mockReturnThis(),
            limit: jest.fn().mockResolvedValue({
              data: mockGameSessions,
              error: null,
            }),
          };
        }
        
        if (table === 'chapter_completions') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            order: jest.fn().mockReturnThis(),
            limit: jest.fn().mockResolvedValue({
              data: mockChapters,
              error: null,
            }),
          };
        }
        
        if (table === 'daily_completions') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            order: jest.fn().mockReturnThis(),
            limit: jest.fn().mockResolvedValue({
              data: mockDaily,
              error: null,
            }),
          };
        }
        
        if (table === 'daily_challenges') {
          return {
            select: jest.fn().mockReturnThis(),
            in: jest.fn().mockResolvedValue({
              data: mockDailyChallenge,
              error: null,
            }),
          };
        }
        
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnThis(),
          limit: jest.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        };
      });

      const history = await getGameHistory('user-123', 10);

      expect(history.length).toBeGreaterThan(0);
      expect(history.length).toBeLessThanOrEqual(10);
    });

    it('should sort results by completed_at descending', async () => {
      const mockGameSessions = [
        {
          id: 'gs-1',
          user_id: 'user-123',
          puzzle_id: 'puzzle-1',
          difficulty: 'medium',
          time_seconds: 300,
          mistakes: 2,
          helper_used: 0,
          completed: true,
          grid_type: '9x9',
          completed_at: '2024-01-15T10:00:00Z',
          created_at: '2024-01-15T10:00:00Z',
        },
        {
          id: 'gs-2',
          user_id: 'user-123',
          puzzle_id: 'puzzle-2',
          difficulty: 'hard',
          time_seconds: 400,
          mistakes: 3,
          helper_used: 1,
          completed: true,
          grid_type: '9x9',
          completed_at: '2024-01-15T12:00:00Z',
          created_at: '2024-01-15T12:00:00Z',
        },
      ];

      (supabase.from as jest.Mock).mockImplementation((table) => {
        if (table === 'game_sessions') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            order: jest.fn().mockReturnThis(),
            limit: jest.fn().mockResolvedValue({
              data: mockGameSessions,
              error: null,
            }),
          };
        }
        
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnThis(),
          limit: jest.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        };
      });

      const history = await getGameHistory('user-123');

      // Most recent should be first
      expect(history[0].completed_at).toBe('2024-01-15T12:00:00Z');
      expect(history[1].completed_at).toBe('2024-01-15T10:00:00Z');
    });

    it('should return empty array on error', async () => {
      (supabase.from as jest.Mock).mockImplementation(() => {
        throw new Error('Database error');
      });

      const history = await getGameHistory('user-123');

      expect(history).toEqual([]);
    });

    it('should handle missing daily challenge difficulty', async () => {
      const mockDaily = [
        {
          id: 'dc-1',
          user_id: 'user-123',
          challenge_id: 'missing-challenge',
          time_seconds: 250,
          mistakes: 1,
          helper_used: 0,
          completed_at: '2024-01-15T10:00:00Z',
        },
      ];

      (supabase.from as jest.Mock).mockImplementation((table) => {
        if (table === 'daily_completions') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            order: jest.fn().mockReturnThis(),
            limit: jest.fn().mockResolvedValue({
              data: mockDaily,
              error: null,
            }),
          };
        }
        
        if (table === 'daily_challenges') {
          return {
            select: jest.fn().mockReturnThis(),
            in: jest.fn().mockResolvedValue({
              data: [], // No matching challenge
              error: null,
            }),
          };
        }
        
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnThis(),
          limit: jest.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        };
      });

      const history = await getGameHistory('user-123');

      // Should default to 'medium' difficulty
      const dailyEntry = history.find((g) => g.id === 'dc-1');
      expect(dailyEntry?.difficulty).toBe('medium');
    });
  });
});
