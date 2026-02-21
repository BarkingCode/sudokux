/**
 * Tests for src/services/leaderboardService.ts
 * Leaderboard fetching, ranking, and Game Center integration.
 */

import { leaderboardService, LeaderboardOptions } from '../../src/services/leaderboardService';

import { supabase } from '../../src/lib/supabase';

// Use the global mock from jest.setup.js and set up chains in beforeEach
const mockSelect = jest.fn();
const mockOrder = jest.fn();
const mockRange = jest.fn();
const mockEq = jest.fn();
const mockNot = jest.fn();

// Mock Game Center service
jest.mock('../../src/services/gameCenter', () => ({
  gameCenterService: {
    submitScore: jest.fn(() => Promise.resolve(true)),
    showLeaderboard: jest.fn(() => Promise.resolve()),
  },
}));

import { gameCenterService } from '../../src/services/gameCenter';

// Helper: creates a thenable that also has .eq for optional country chaining
function makeRangeResult(resolveValue: any) {
  const promise = Promise.resolve(resolveValue);
  (promise as any).eq = mockEq;
  return promise;
}

describe('leaderboardService', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Wire up supabase.from to return our mock chain
    (supabase.from as jest.Mock).mockImplementation(() => ({
      select: mockSelect,
    }));
    (supabase as any).rpc = jest.fn().mockResolvedValue({ data: 0, error: null });

    // Set up default mock chain
    // The source does: supabase.from(v).select('*').order(...).range(...)
    // then optionally .eq('country', ...) on the range result
    // The final result is awaited, so it must be a thenable
    mockSelect.mockReturnValue({
      order: mockOrder,
      eq: mockEq,
      not: mockNot,
    });
    mockOrder.mockReturnValue({
      range: mockRange,
    });
    // Helper to create range result: thenable with .eq for country filter
    mockRange.mockImplementation(() => makeRangeResult({ data: [], error: null }));
    // mockEq after range returns a thenable (for country filter path)
    mockEq.mockImplementation(() => {
      return Promise.resolve({ data: [], error: null });
    });
    mockNot.mockReturnValue({
      order: mockOrder,
    });
  });

  // ============ getLeaderboard ============

  describe('getLeaderboard', () => {
    it('should return empty array when no entries', async () => {
      mockRange.mockImplementationOnce(() => makeRangeResult({ data: [], error: null }));

      const result = await leaderboardService.getLeaderboard({
        difficulty: 'easy',
      });

      expect(result).toEqual([]);
    });

    it('should return leaderboard entries with correct format', async () => {
      const mockData = [
        {
          user_id: 'user-1',
          nickname: 'Player1',
          country: 'US',
          best_time: 180,
          rank: 1,
        },
        {
          user_id: 'user-2',
          nickname: 'Player2',
          country: 'GB',
          best_time: 200,
          rank: 2,
        },
      ];
      mockRange.mockImplementationOnce(() => makeRangeResult({ data: mockData, error: null }));

      const result = await leaderboardService.getLeaderboard({
        difficulty: 'medium',
      });

      expect(result.length).toBe(2);
      expect(result[0].userId).toBe('user-1');
      expect(result[0].nickname).toBe('Player1');
      expect(result[0].bestTime).toBe(180);
      expect(result[0].rank).toBe(1);
    });

    it('should filter out entries with missing required fields', async () => {
      const mockData = [
        { user_id: 'user-1', nickname: 'Player1', best_time: 180, rank: 1 },
        { user_id: null, nickname: 'Player2', best_time: 200, rank: 2 }, // Missing user_id
        { user_id: 'user-3', nickname: null, best_time: 220, rank: 3 }, // Missing nickname
      ];
      mockRange.mockImplementationOnce(() => makeRangeResult({ data: mockData, error: null }));

      const result = await leaderboardService.getLeaderboard({
        difficulty: 'hard',
      });

      expect(result.length).toBe(1);
      expect(result[0].userId).toBe('user-1');
    });

    it('should apply country filter when provided', async () => {
      mockRange.mockImplementationOnce(() => makeRangeResult({ data: [], error: null }));

      await leaderboardService.getLeaderboard({
        difficulty: 'easy',
        country: 'US',
      });

      expect(mockEq).toHaveBeenCalledWith('country', 'US');
    });

    it('should apply limit and offset', async () => {
      mockRange.mockImplementationOnce(() => makeRangeResult({ data: [], error: null }));

      await leaderboardService.getLeaderboard({
        difficulty: 'easy',
        limit: 50,
        offset: 10,
      });

      expect(mockRange).toHaveBeenCalledWith(10, 59); // offset to offset + limit - 1
    });

    it('should use default limit of 100', async () => {
      mockRange.mockImplementationOnce(() => makeRangeResult({ data: [], error: null }));

      await leaderboardService.getLeaderboard({
        difficulty: 'easy',
      });

      expect(mockRange).toHaveBeenCalledWith(0, 99);
    });

    it('should return empty array on error', async () => {
      mockRange.mockImplementationOnce(() => makeRangeResult({ data: null, error: { message: 'Query failed' } }));

      const result = await leaderboardService.getLeaderboard({
        difficulty: 'easy',
      });

      expect(result).toEqual([]);
    });

    it('should return empty array on exception', async () => {
      mockRange.mockImplementationOnce(() => Promise.reject(new Error('Network error')));

      const result = await leaderboardService.getLeaderboard({
        difficulty: 'easy',
      });

      expect(result).toEqual([]);
    });
  });

  // ============ getUserRank ============

  describe('getUserRank', () => {
    it('should return user rank from RPC call', async () => {
      ((supabase as any).rpc as jest.Mock).mockResolvedValueOnce({ data: 42, error: null });

      const result = await leaderboardService.getUserRank('user-123', 'medium');

      expect(result).toBe(42);
      expect((supabase as any).rpc).toHaveBeenCalledWith('get_user_rank', {
        p_user_id: 'user-123',
        p_difficulty: 'medium',
      });
    });

    it('should return 0 when user has no rank', async () => {
      ((supabase as any).rpc as jest.Mock).mockResolvedValueOnce({ data: null, error: null });

      const result = await leaderboardService.getUserRank('user-123', 'easy');

      expect(result).toBe(0);
    });

    it('should return 0 on error', async () => {
      ((supabase as any).rpc as jest.Mock).mockResolvedValueOnce({ data: null, error: { message: 'RPC failed' } });

      const result = await leaderboardService.getUserRank('user-123', 'hard');

      expect(result).toBe(0);
    });

    it('should return 0 on exception', async () => {
      ((supabase as any).rpc as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const result = await leaderboardService.getUserRank('user-123', 'extreme');

      expect(result).toBe(0);
    });
  });

  // ============ getUserContext ============

  describe('getUserContext', () => {
    it('should return null userEntry and empty nearby when user has no rank', async () => {
      ((supabase as any).rpc as jest.Mock).mockResolvedValueOnce({ data: 0, error: null });

      const result = await leaderboardService.getUserContext('user-123', 'easy');

      expect(result.userEntry).toBeNull();
      expect(result.nearby).toEqual([]);
    });

    it('should return user entry and nearby entries', async () => {
      // getUserRank returns 10
      ((supabase as any).rpc as jest.Mock).mockResolvedValueOnce({ data: 10, error: null });

      // getLeaderboard returns nearby entries
      const nearbyEntries = [
        { user_id: 'user-5', nickname: 'Player5', best_time: 150, rank: 5 },
        { user_id: 'user-123', nickname: 'TestUser', best_time: 180, rank: 10 },
        { user_id: 'user-15', nickname: 'Player15', best_time: 200, rank: 15 },
      ];
      mockRange.mockImplementationOnce(() => makeRangeResult({ data: nearbyEntries, error: null }));

      const result = await leaderboardService.getUserContext('user-123', 'medium');

      expect(result.userEntry).not.toBeNull();
      expect(result.userEntry?.userId).toBe('user-123');
      expect(result.nearby.length).toBe(3);
    });

    it('should use default surrounding count of 5', async () => {
      ((supabase as any).rpc as jest.Mock).mockResolvedValueOnce({ data: 10, error: null });
      mockRange.mockImplementationOnce(() => makeRangeResult({ data: [], error: null }));

      await leaderboardService.getUserContext('user-123', 'easy');

      // Start rank = 10 - 5 = 5, so offset = 4
      // Limit = 5 * 2 + 1 = 11
      expect(mockRange).toHaveBeenCalledWith(4, 14);
    });

    it('should handle rank near the top (rank 1)', async () => {
      ((supabase as any).rpc as jest.Mock).mockResolvedValueOnce({ data: 1, error: null });
      mockRange.mockImplementationOnce(() => makeRangeResult({ data: [], error: null }));

      await leaderboardService.getUserContext('user-123', 'easy', 5);

      // Start rank = max(1, 1-5) = 1, so offset = 0
      expect(mockRange).toHaveBeenCalledWith(0, 10);
    });

    it('should return empty on error', async () => {
      ((supabase as any).rpc as jest.Mock).mockRejectedValueOnce(new Error('Error'));

      const result = await leaderboardService.getUserContext('user-123', 'easy');

      expect(result.userEntry).toBeNull();
      expect(result.nearby).toEqual([]);
    });
  });

  // ============ getCountryLeaders ============

  describe('getCountryLeaders', () => {
    it('should return empty object when no leaders', async () => {
      mockOrder.mockReturnValueOnce(Promise.resolve({ data: [], error: null }));

      const result = await leaderboardService.getCountryLeaders('easy');

      expect(result).toEqual({});
    });

    it('should return top player per country', async () => {
      const mockData = [
        { user_id: 'us-1', nickname: 'USPlayer', country: 'US', best_time: 100, rank: 1 },
        { user_id: 'us-2', nickname: 'USPlayer2', country: 'US', best_time: 120, rank: 2 },
        { user_id: 'gb-1', nickname: 'GBPlayer', country: 'GB', best_time: 110, rank: 3 },
      ];
      mockOrder.mockReturnValueOnce(Promise.resolve({ data: mockData, error: null }));

      const result = await leaderboardService.getCountryLeaders('medium');

      expect(Object.keys(result).length).toBe(2);
      expect(result['US'].nickname).toBe('USPlayer');
      expect(result['GB'].nickname).toBe('GBPlayer');
    });

    it('should respect limit parameter', async () => {
      const mockData = [
        { user_id: 'us-1', nickname: 'USPlayer', country: 'US', best_time: 100, rank: 1 },
        { user_id: 'gb-1', nickname: 'GBPlayer', country: 'GB', best_time: 110, rank: 2 },
        { user_id: 'de-1', nickname: 'DEPlayer', country: 'DE', best_time: 120, rank: 3 },
      ];
      mockOrder.mockReturnValueOnce(Promise.resolve({ data: mockData, error: null }));

      const result = await leaderboardService.getCountryLeaders('hard', 2);

      expect(Object.keys(result).length).toBe(2);
    });

    it('should return empty object on error', async () => {
      mockOrder.mockReturnValueOnce(Promise.resolve({ data: null, error: { message: 'Error' } }));

      const result = await leaderboardService.getCountryLeaders('extreme');

      expect(result).toEqual({});
    });

    it('should return empty object on exception', async () => {
      mockOrder.mockReturnValueOnce(Promise.reject(new Error('Network error')));

      const result = await leaderboardService.getCountryLeaders('insane');

      expect(result).toEqual({});
    });
  });

  // ============ submitToGameCenter ============

  describe('submitToGameCenter', () => {
    it('should submit points to Game Center', async () => {
      const result = await leaderboardService.submitToGameCenter(1500);

      expect(gameCenterService.submitScore).toHaveBeenCalledWith(1500);
      expect(result).toBe(true);
    });

    it('should return Game Center result', async () => {
      (gameCenterService.submitScore as jest.Mock).mockResolvedValueOnce(false);

      const result = await leaderboardService.submitToGameCenter(2000);

      expect(result).toBe(false);
    });
  });

  // ============ showGameCenterLeaderboard ============

  describe('showGameCenterLeaderboard', () => {
    it('should show Game Center leaderboard', async () => {
      await leaderboardService.showGameCenterLeaderboard();

      expect(gameCenterService.showLeaderboard).toHaveBeenCalled();
    });
  });
});
