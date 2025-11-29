/**
 * AdMob configuration and ad unit IDs.
 * Using Google test ad unit IDs for development.
 * Replace with real IDs before production release.
 *
 * Ad Strategy by Game Mode:
 * - CHAPTERS: Interstitial every 3 completed games
 * - FREE RUN: Rewarded ad to unlock 5 games per session (no interstitials)
 * - DAILY: No ads
 */

import { Platform } from 'react-native';
import { TestIds } from 'react-native-google-mobile-ads';

// ============================================
// CHAPTERS MODE - Interstitial Ads
// ============================================
// Show interstitial after every N completed chapter puzzles
export const CHAPTERS_INTERSTITIAL_FREQUENCY = 3;

// ============================================
// FREE RUN MODE - Session Limits (Rewarded Ads)
// ============================================
// Games allowed per session before needing to watch rewarded ad
export const FREERUN_GAMES_PER_SESSION = 5;
// Games unlocked by watching a rewarded ad
export const FREERUN_GAMES_PER_REWARD = 5;

// ============================================
// DAILY MODE - No Ads
// ============================================
// Daily challenges have no ads, competition-based

// ============================================
// Legacy exports (for backward compatibility)
// ============================================
export const GAMES_PER_SESSION = FREERUN_GAMES_PER_SESSION;
export const GAMES_PER_REWARD = FREERUN_GAMES_PER_REWARD;

// Test Ad Unit IDs (replace with real IDs for production)
export const AD_UNIT_IDS = {
  // Banner ads - shown on screens
  BANNER: TestIds.BANNER,

  // Interstitial ads - shown in Chapters mode
  INTERSTITIAL: TestIds.INTERSTITIAL,

  // Rewarded ads - watch to unlock more games in Free Run
  REWARDED: TestIds.REWARDED,
};

// Production Ad Unit IDs (uncomment and use for release)
// export const AD_UNIT_IDS = {
//   BANNER: Platform.select({
//     ios: 'ca-app-pub-XXXXXXXXXXXXXXXX/YYYYYYYYYY',
//     android: 'ca-app-pub-XXXXXXXXXXXXXXXX/YYYYYYYYYY',
//   }) as string,
//   INTERSTITIAL: Platform.select({
//     ios: 'ca-app-pub-XXXXXXXXXXXXXXXX/YYYYYYYYYY',
//     android: 'ca-app-pub-XXXXXXXXXXXXXXXX/YYYYYYYYYY',
//   }) as string,
//   REWARDED: Platform.select({
//     ios: 'ca-app-pub-XXXXXXXXXXXXXXXX/YYYYYYYYYY',
//     android: 'ca-app-pub-XXXXXXXXXXXXXXXX/YYYYYYYYYY',
//   }) as string,
// };
