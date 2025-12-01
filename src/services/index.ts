/**
 * Services Index
 *
 * Export all backend services for easy importing
 */

export { gameCenterService, LEADERBOARD_IDS } from './gameCenter';
export type { GameCenterPlayer, LeaderboardId } from './gameCenter';

export { userService } from './userService';
export type { LocalUserIdentity } from './userService';

export { statsService } from './statsService';
export type { GameResult } from './statsService';

export { leaderboardService } from './leaderboardService';
export type { LeaderboardEntry, LeaderboardOptions } from './leaderboardService';

export { chapterService } from './chapterService';
export type { ChapterPuzzleData } from './chapterService';
