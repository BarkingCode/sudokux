/**
 * Tests for src/services/gameCenter.ts
 * Game Center authentication and score submission.
 */

import { Platform } from 'react-native';

// Mock Platform to iOS
jest.mock('react-native', () => ({
  Platform: { OS: 'ios' },
}));

// Mock the native module
const mockGC = {
  authenticate: jest.fn(),
  submitScore: jest.fn(),
  showLeaderboard: jest.fn(),
};

jest.mock('react-native-game-center', () => ({
  default: mockGC,
}));

import { gameCenterService, LEADERBOARD_IDS } from '../../src/services/gameCenter';

describe('gameCenterService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    gameCenterService.reset();
  });

  describe('isGameCenterAvailable', () => {
    it('should return true on iOS with module available', () => {
      expect(gameCenterService.isGameCenterAvailable()).toBe(true);
    });
  });

  describe('authenticate', () => {
    it('should authenticate and return player info', async () => {
      mockGC.authenticate.mockResolvedValue({
        isAuthenticated: true,
        playerID: 'player-123',
        alias: 'TestPlayer',
        displayName: 'Test Player',
      });

      const player = await gameCenterService.authenticate();

      expect(player).not.toBeNull();
      expect(player!.playerId).toBe('player-123');
      expect(player!.displayName).toBe('Test Player');
      expect(player!.isAuthenticated).toBe(true);
    });

    it('should return null on failed authentication', async () => {
      mockGC.authenticate.mockResolvedValue({ isAuthenticated: false });

      const player = await gameCenterService.authenticate();

      expect(player).toBeNull();
    });

    it('should return null on error', async () => {
      mockGC.authenticate.mockRejectedValue(new Error('GC unavailable'));

      const player = await gameCenterService.authenticate();

      expect(player).toBeNull();
    });
  });

  describe('submitScore', () => {
    it('should submit score when authenticated', async () => {
      // Authenticate first
      mockGC.authenticate.mockResolvedValue({
        isAuthenticated: true,
        playerID: 'p1',
        alias: 'Test',
        displayName: 'Test',
      });
      await gameCenterService.authenticate();

      mockGC.submitScore.mockResolvedValue(undefined);

      const result = await gameCenterService.submitScore(1000);

      expect(result).toBe(true);
      expect(mockGC.submitScore).toHaveBeenCalledWith({
        leaderboardIdentifier: LEADERBOARD_IDS.global,
        score: 1000,
        context: 0,
      });
    });

    it('should return false when not authenticated', async () => {
      const result = await gameCenterService.submitScore(1000);

      expect(result).toBe(false);
    });

    it('should return false on error', async () => {
      mockGC.authenticate.mockResolvedValue({
        isAuthenticated: true,
        playerID: 'p1',
        alias: 'Test',
        displayName: 'Test',
      });
      await gameCenterService.authenticate();

      mockGC.submitScore.mockRejectedValue(new Error('fail'));

      const result = await gameCenterService.submitScore(1000);

      expect(result).toBe(false);
    });
  });

  describe('showLeaderboard', () => {
    it('should call show leaderboard', async () => {
      mockGC.showLeaderboard.mockResolvedValue(undefined);

      await gameCenterService.showLeaderboard();

      expect(mockGC.showLeaderboard).toHaveBeenCalled();
    });
  });

  describe('getCurrentPlayer', () => {
    it('should return null before authentication', () => {
      expect(gameCenterService.getCurrentPlayer()).toBeNull();
    });

    it('should return player after authentication', async () => {
      mockGC.authenticate.mockResolvedValue({
        isAuthenticated: true,
        playerID: 'p1',
        alias: 'Test',
        displayName: 'Test',
      });
      await gameCenterService.authenticate();

      expect(gameCenterService.getCurrentPlayer()).not.toBeNull();
    });
  });

  describe('reset', () => {
    it('should clear player state', async () => {
      mockGC.authenticate.mockResolvedValue({
        isAuthenticated: true,
        playerID: 'p1',
        alias: 'Test',
        displayName: 'Test',
      });
      await gameCenterService.authenticate();

      gameCenterService.reset();

      expect(gameCenterService.getCurrentPlayer()).toBeNull();
    });
  });
});
