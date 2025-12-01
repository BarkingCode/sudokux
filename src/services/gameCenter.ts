/**
 * Game Center Service
 *
 * Handles iOS Game Center integration for:
 * - Player authentication
 * - Leaderboard submissions
 *
 * Note: Achievements are handled via Supabase only (not synced to Game Center)
 *
 * Only works on iOS. Falls back gracefully on other platforms.
 */

import { Platform } from 'react-native';

// Leaderboard IDs - Configure these in App Store Connect
// Using single points-based leaderboard (Game Center handles country filtering automatically)
export const LEADERBOARD_IDS = {
  global: 'com.boraalap.sudokux.leaderboard.global',
} as const;

export type LeaderboardId = keyof typeof LEADERBOARD_IDS;

export interface GameCenterPlayer {
  playerId: string;
  alias: string;
  displayName: string;
  isAuthenticated: boolean;
}

// Lazy load the native module only on iOS
let GameCenter: any = null;

const loadGameCenter = () => {
  if (Platform.OS === 'ios' && !GameCenter) {
    try {
      GameCenter = require('react-native-game-center').default;
    } catch (error) {
      console.warn('Game Center module not available:', error);
    }
  }
  return GameCenter;
};

class GameCenterService {
  private player: GameCenterPlayer | null = null;
  private isAvailable: boolean = Platform.OS === 'ios';

  /**
   * Check if Game Center is available on this device
   */
  isGameCenterAvailable(): boolean {
    return this.isAvailable && loadGameCenter() !== null;
  }

  /**
   * Get the current authenticated player
   */
  getCurrentPlayer(): GameCenterPlayer | null {
    return this.player;
  }

  /**
   * Authenticate the local player with Game Center
   * Returns the player info if successful, null otherwise
   */
  async authenticate(): Promise<GameCenterPlayer | null> {
    if (!this.isGameCenterAvailable()) {
      console.log('Game Center not available on this platform');
      return null;
    }

    const gc = loadGameCenter();
    if (!gc) return null;

    try {
      const result = await gc.authenticate();

      if (result && result.isAuthenticated) {
        this.player = {
          playerId: result.playerID || result.playerId,
          alias: result.alias || '',
          displayName: result.displayName || result.alias || 'Player',
          isAuthenticated: true,
        };
        console.log('Game Center authenticated:', this.player.displayName);
        return this.player;
      }

      return null;
    } catch (error) {
      console.warn('Game Center authentication failed:', error);
      return null;
    }
  }

  /**
   * Submit points to the global leaderboard
   */
  async submitScore(points: number): Promise<boolean> {
    if (!this.isGameCenterAvailable() || !this.player?.isAuthenticated) {
      return false;
    }

    const gc = loadGameCenter();
    if (!gc) return false;

    try {
      await gc.submitScore({
        leaderboardIdentifier: LEADERBOARD_IDS.global,
        score: points,
        context: 0,
      });
      console.log(`Points ${points} submitted to global leaderboard`);
      return true;
    } catch (error) {
      console.warn('Failed to submit score:', error);
      return false;
    }
  }

  /**
   * Show the Game Center leaderboard UI
   */
  async showLeaderboard(): Promise<void> {
    if (!this.isGameCenterAvailable()) {
      return;
    }

    const gc = loadGameCenter();
    if (!gc) return;

    try {
      await gc.showLeaderboard({
        leaderboardIdentifier: LEADERBOARD_IDS.global,
        timeScope: 'AllTime',
      });
    } catch (error) {
      console.warn('Failed to show leaderboard:', error);
    }
  }

  /**
   * Reset the service state (for logout scenarios)
   */
  reset(): void {
    this.player = null;
  }
}

// Export singleton instance
export const gameCenterService = new GameCenterService();
