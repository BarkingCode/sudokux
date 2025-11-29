/**
 * Game Center Service
 *
 * Handles iOS Game Center integration for:
 * - Player authentication
 * - Leaderboard submissions
 * - Achievement unlocking
 *
 * Only works on iOS. Falls back gracefully on other platforms.
 */

import { Platform } from 'react-native';

// Leaderboard IDs - Configure these in App Store Connect
export const LEADERBOARD_IDS = {
  easy: 'com.boraalap.sudokux.leaderboard.easy',
  medium: 'com.boraalap.sudokux.leaderboard.medium',
  hard: 'com.boraalap.sudokux.leaderboard.hard',
} as const;

// Achievement IDs - Configure these in App Store Connect
export const ACHIEVEMENT_IDS = {
  first_puzzle: 'com.boraalap.sudokux.achievement.first_puzzle',
  speed_demon: 'com.boraalap.sudokux.achievement.speed_demon',
  perfectionist: 'com.boraalap.sudokux.achievement.perfectionist',
  no_hints: 'com.boraalap.sudokux.achievement.no_hints',
  streak_7: 'com.boraalap.sudokux.achievement.streak_7',
  streak_30: 'com.boraalap.sudokux.achievement.streak_30',
  games_10: 'com.boraalap.sudokux.achievement.games_10',
  games_50: 'com.boraalap.sudokux.achievement.games_50',
  games_100: 'com.boraalap.sudokux.achievement.games_100',
  master_easy: 'com.boraalap.sudokux.achievement.master_easy',
  master_medium: 'com.boraalap.sudokux.achievement.master_medium',
  master_hard: 'com.boraalap.sudokux.achievement.master_hard',
  chapter_complete: 'com.boraalap.sudokux.achievement.chapter_complete',
} as const;

export type LeaderboardId = keyof typeof LEADERBOARD_IDS;
export type AchievementId = keyof typeof ACHIEVEMENT_IDS;

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
   * Submit a score to a leaderboard
   */
  async submitScore(difficulty: LeaderboardId, timeSeconds: number): Promise<boolean> {
    if (!this.isGameCenterAvailable() || !this.player?.isAuthenticated) {
      return false;
    }

    const gc = loadGameCenter();
    if (!gc) return false;

    const leaderboardId = LEADERBOARD_IDS[difficulty];

    try {
      await gc.submitScore({
        leaderboardIdentifier: leaderboardId,
        score: timeSeconds,
        context: 0,
      });
      console.log(`Score ${timeSeconds}s submitted to ${difficulty} leaderboard`);
      return true;
    } catch (error) {
      console.warn('Failed to submit score:', error);
      return false;
    }
  }

  /**
   * Show the Game Center leaderboard UI
   */
  async showLeaderboard(difficulty?: LeaderboardId): Promise<void> {
    if (!this.isGameCenterAvailable()) {
      return;
    }

    const gc = loadGameCenter();
    if (!gc) return;

    try {
      if (difficulty) {
        await gc.showLeaderboard({
          leaderboardIdentifier: LEADERBOARD_IDS[difficulty],
          timeScope: 'AllTime',
        });
      } else {
        await gc.showLeaderboards();
      }
    } catch (error) {
      console.warn('Failed to show leaderboard:', error);
    }
  }

  /**
   * Unlock an achievement
   */
  async unlockAchievement(achievementId: AchievementId, percentComplete: number = 100): Promise<boolean> {
    if (!this.isGameCenterAvailable() || !this.player?.isAuthenticated) {
      return false;
    }

    const gc = loadGameCenter();
    if (!gc) return false;

    const gcAchievementId = ACHIEVEMENT_IDS[achievementId];

    try {
      await gc.submitAchievement({
        achievementIdentifier: gcAchievementId,
        percentComplete,
        showCompletionBanner: true,
      });
      console.log(`Achievement unlocked: ${achievementId}`);
      return true;
    } catch (error) {
      console.warn('Failed to unlock achievement:', error);
      return false;
    }
  }

  /**
   * Show the Game Center achievements UI
   */
  async showAchievements(): Promise<void> {
    if (!this.isGameCenterAvailable()) {
      return;
    }

    const gc = loadGameCenter();
    if (!gc) return;

    try {
      await gc.showAchievements();
    } catch (error) {
      console.warn('Failed to show achievements:', error);
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
