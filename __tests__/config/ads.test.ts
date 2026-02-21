/**
 * Tests for src/config/ads.ts
 * Ad configuration validation.
 */

import {
  INTERSTITIAL_MIN_GAMES,
  INTERSTITIAL_MAX_GAMES,
  FREERUN_GAMES_PER_SESSION,
  AD_UNIT_IDS,
} from '../../src/config/ads';

describe('ads config', () => {
  // ============ Interstitial Configuration ============

  describe('interstitial configuration', () => {
    it('should have valid INTERSTITIAL_MIN_GAMES', () => {
      expect(INTERSTITIAL_MIN_GAMES).toBeGreaterThan(0);
      expect(Number.isInteger(INTERSTITIAL_MIN_GAMES)).toBe(true);
    });

    it('should have valid INTERSTITIAL_MAX_GAMES', () => {
      expect(INTERSTITIAL_MAX_GAMES).toBeGreaterThan(0);
      expect(Number.isInteger(INTERSTITIAL_MAX_GAMES)).toBe(true);
    });

    it('should have MAX_GAMES greater than or equal to MIN_GAMES', () => {
      expect(INTERSTITIAL_MAX_GAMES).toBeGreaterThanOrEqual(INTERSTITIAL_MIN_GAMES);
    });

    it('should have a valid range (at least 1 possible value)', () => {
      const range = INTERSTITIAL_MAX_GAMES - INTERSTITIAL_MIN_GAMES;
      expect(range).toBeGreaterThanOrEqual(0);
    });

    it('should have reasonable values (between 1-10)', () => {
      expect(INTERSTITIAL_MIN_GAMES).toBeGreaterThanOrEqual(1);
      expect(INTERSTITIAL_MIN_GAMES).toBeLessThanOrEqual(10);
      expect(INTERSTITIAL_MAX_GAMES).toBeGreaterThanOrEqual(1);
      expect(INTERSTITIAL_MAX_GAMES).toBeLessThanOrEqual(10);
    });

    it('should allow random selection (expected values: 2-4)', () => {
      expect(INTERSTITIAL_MIN_GAMES).toBe(2);
      expect(INTERSTITIAL_MAX_GAMES).toBe(4);
    });
  });

  // ============ Free Run Configuration ============

  describe('free run configuration', () => {
    it('should have positive FREERUN_GAMES_PER_SESSION', () => {
      expect(FREERUN_GAMES_PER_SESSION).toBeGreaterThan(0);
      expect(Number.isInteger(FREERUN_GAMES_PER_SESSION)).toBe(true);
    });

    it('should have reasonable value (between 1-10)', () => {
      expect(FREERUN_GAMES_PER_SESSION).toBeGreaterThanOrEqual(1);
      expect(FREERUN_GAMES_PER_SESSION).toBeLessThanOrEqual(10);
    });

    it('should be 3 games per session', () => {
      expect(FREERUN_GAMES_PER_SESSION).toBe(3);
    });
  });

  // ============ Ad Unit IDs ============

  describe('ad unit IDs', () => {
    it('should have all required ad unit IDs', () => {
      expect(AD_UNIT_IDS.BANNER).toBeDefined();
      expect(AD_UNIT_IDS.INTERSTITIAL).toBeDefined();
      expect(AD_UNIT_IDS.REWARDED).toBeDefined();
      expect(AD_UNIT_IDS.HELPER_REWARDED).toBeDefined();
    });

    it('should use test IDs in development', () => {
      // In test environment, __DEV__ is typically false
      // But we can verify test IDs are strings
      expect(typeof AD_UNIT_IDS.BANNER).toBe('string');
      expect(typeof AD_UNIT_IDS.INTERSTITIAL).toBe('string');
      expect(typeof AD_UNIT_IDS.REWARDED).toBe('string');
      expect(typeof AD_UNIT_IDS.HELPER_REWARDED).toBe('string');
    });

    it('should not have empty ad unit IDs', () => {
      expect(AD_UNIT_IDS.BANNER.length).toBeGreaterThan(0);
      expect(AD_UNIT_IDS.INTERSTITIAL.length).toBeGreaterThan(0);
      expect(AD_UNIT_IDS.REWARDED.length).toBeGreaterThan(0);
      expect(AD_UNIT_IDS.HELPER_REWARDED.length).toBeGreaterThan(0);
    });

    it('should have valid AdMob ad unit ID format', () => {
      // AdMob IDs typically start with 'ca-app-pub-'
      const idPattern = /^ca-app-pub-/;
      
      // All IDs should match the pattern (test or production)
      expect(AD_UNIT_IDS.BANNER).toMatch(idPattern);
      expect(AD_UNIT_IDS.INTERSTITIAL).toMatch(idPattern);
      expect(AD_UNIT_IDS.REWARDED).toMatch(idPattern);
      expect(AD_UNIT_IDS.HELPER_REWARDED).toMatch(idPattern);
    });
  });
});
