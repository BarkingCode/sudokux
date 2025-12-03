/**
 * AdMob configuration and ad unit IDs.
 * Using Google test ad unit IDs for development.
 * Replace with real IDs before production release.
 *
 * Ad Strategy by Game Mode:
 * - CHAPTERS: Interstitial every 2-4 completed games (randomized)
 * - FREE RUN: Rewarded ad every 5 completed games
 * - DAILY: No ads
 */

import { Platform } from 'react-native';
import { TestIds } from 'react-native-google-mobile-ads';

// ============================================
// CHAPTERS MODE - Interstitial Ads
// ============================================
// Show interstitial after random number of completed puzzles (inclusive range)
export const INTERSTITIAL_MIN_GAMES = 2;
export const INTERSTITIAL_MAX_GAMES = 4;

// ============================================
// FREE RUN MODE - Rewarded Ads
// ============================================
// Show "out of games" modal after N games, requiring rewarded ad to continue
export const FREERUN_GAMES_PER_SESSION = 3;

// ============================================
// DAILY MODE - No Ads
// ============================================
// Daily challenges have no ads, competition-based

// Production Ad Unit IDs from environment variables
const PRODUCTION_AD_UNIT_IDS = {
  BANNER: Platform.select({
    ios: process.env.EXPO_PUBLIC_ADMOB_BANNER_IOS,
    android: process.env.EXPO_PUBLIC_ADMOB_BANNER_ANDROID,
  }) as string,
  INTERSTITIAL: Platform.select({
    ios: process.env.EXPO_PUBLIC_ADMOB_INTERSTITIAL_IOS,
    android: process.env.EXPO_PUBLIC_ADMOB_INTERSTITIAL_ANDROID,
  }) as string,
  REWARDED: Platform.select({
    ios: process.env.EXPO_PUBLIC_ADMOB_REWARDED_IOS,
    android: process.env.EXPO_PUBLIC_ADMOB_REWARDED_ANDROID,
  }) as string,
};

// Use test IDs in development, production IDs in release builds
export const AD_UNIT_IDS = __DEV__
  ? {
      BANNER: TestIds.BANNER,
      INTERSTITIAL: TestIds.INTERSTITIAL,
      REWARDED: TestIds.REWARDED,
    }
  : PRODUCTION_AD_UNIT_IDS;
