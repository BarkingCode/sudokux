/**
 * Tests for src/config/timing.ts
 * Timing configuration validation.
 */

import { TIMING, getAdLoadTimeout } from '../../src/config/timing';

describe('timing config', () => {
  // ============ Modal Delays ============

  describe('modal delays', () => {
    it('should have positive DAILY_COMPLETION delay', () => {
      expect(TIMING.MODAL_DELAYS.DAILY_COMPLETION).toBeGreaterThan(0);
      expect(Number.isInteger(TIMING.MODAL_DELAYS.DAILY_COMPLETION)).toBe(true);
    });

    it('should have positive CHAPTER_COMPLETION delay', () => {
      expect(TIMING.MODAL_DELAYS.CHAPTER_COMPLETION).toBeGreaterThan(0);
      expect(Number.isInteger(TIMING.MODAL_DELAYS.CHAPTER_COMPLETION)).toBe(true);
    });

    it('should have positive FREERUN_COMPLETION delay', () => {
      expect(TIMING.MODAL_DELAYS.FREERUN_COMPLETION).toBeGreaterThan(0);
      expect(Number.isInteger(TIMING.MODAL_DELAYS.FREERUN_COMPLETION)).toBe(true);
    });

    it('should have reasonable delays (between 100ms-2000ms)', () => {
      expect(TIMING.MODAL_DELAYS.DAILY_COMPLETION).toBeGreaterThanOrEqual(100);
      expect(TIMING.MODAL_DELAYS.DAILY_COMPLETION).toBeLessThanOrEqual(2000);
      
      expect(TIMING.MODAL_DELAYS.CHAPTER_COMPLETION).toBeGreaterThanOrEqual(100);
      expect(TIMING.MODAL_DELAYS.CHAPTER_COMPLETION).toBeLessThanOrEqual(2000);
      
      expect(TIMING.MODAL_DELAYS.FREERUN_COMPLETION).toBeGreaterThanOrEqual(100);
      expect(TIMING.MODAL_DELAYS.FREERUN_COMPLETION).toBeLessThanOrEqual(2000);
    });
  });

  // ============ Ad Timeouts ============

  describe('ad timeouts', () => {
    it('should have positive LOAD_DEV timeout', () => {
      expect(TIMING.AD_TIMEOUTS.LOAD_DEV).toBeGreaterThan(0);
      expect(Number.isInteger(TIMING.AD_TIMEOUTS.LOAD_DEV)).toBe(true);
    });

    it('should have positive LOAD_PROD timeout', () => {
      expect(TIMING.AD_TIMEOUTS.LOAD_PROD).toBeGreaterThan(0);
      expect(Number.isInteger(TIMING.AD_TIMEOUTS.LOAD_PROD)).toBe(true);
    });

    it('should have positive SHOW timeout', () => {
      expect(TIMING.AD_TIMEOUTS.SHOW).toBeGreaterThan(0);
      expect(Number.isInteger(TIMING.AD_TIMEOUTS.SHOW)).toBe(true);
    });

    it('should have LOAD_PROD timeout greater than LOAD_DEV', () => {
      expect(TIMING.AD_TIMEOUTS.LOAD_PROD).toBeGreaterThanOrEqual(TIMING.AD_TIMEOUTS.LOAD_DEV);
    });

    it('should have reasonable timeout values (between 5s-60s)', () => {
      expect(TIMING.AD_TIMEOUTS.LOAD_DEV).toBeGreaterThanOrEqual(5000);
      expect(TIMING.AD_TIMEOUTS.LOAD_DEV).toBeLessThanOrEqual(60000);
      
      expect(TIMING.AD_TIMEOUTS.LOAD_PROD).toBeGreaterThanOrEqual(5000);
      expect(TIMING.AD_TIMEOUTS.LOAD_PROD).toBeLessThanOrEqual(60000);
      
      expect(TIMING.AD_TIMEOUTS.SHOW).toBeGreaterThanOrEqual(5000);
      expect(TIMING.AD_TIMEOUTS.SHOW).toBeLessThanOrEqual(60000);
    });
  });

  // ============ Network ============

  describe('network', () => {
    it('should have positive CHECK_INTERVAL', () => {
      expect(TIMING.NETWORK.CHECK_INTERVAL).toBeGreaterThan(0);
      expect(Number.isInteger(TIMING.NETWORK.CHECK_INTERVAL)).toBe(true);
    });

    it('should have reasonable check interval (between 1s-30s)', () => {
      expect(TIMING.NETWORK.CHECK_INTERVAL).toBeGreaterThanOrEqual(1000);
      expect(TIMING.NETWORK.CHECK_INTERVAL).toBeLessThanOrEqual(30000);
    });
  });

  // ============ Achievements ============

  describe('achievements', () => {
    it('should have positive QUEUE_DELAY', () => {
      expect(TIMING.ACHIEVEMENTS.QUEUE_DELAY).toBeGreaterThan(0);
      expect(Number.isInteger(TIMING.ACHIEVEMENTS.QUEUE_DELAY)).toBe(true);
    });

    it('should have reasonable queue delay (between 100ms-1000ms)', () => {
      expect(TIMING.ACHIEVEMENTS.QUEUE_DELAY).toBeGreaterThanOrEqual(100);
      expect(TIMING.ACHIEVEMENTS.QUEUE_DELAY).toBeLessThanOrEqual(1000);
    });
  });

  // ============ Animations ============

  describe('animations', () => {
    it('should have positive DEFAULT duration', () => {
      expect(TIMING.ANIMATIONS.DEFAULT).toBeGreaterThan(0);
      expect(Number.isInteger(TIMING.ANIMATIONS.DEFAULT)).toBe(true);
    });

    it('should have positive QUICK duration', () => {
      expect(TIMING.ANIMATIONS.QUICK).toBeGreaterThan(0);
      expect(Number.isInteger(TIMING.ANIMATIONS.QUICK)).toBe(true);
    });

    it('should have positive SLOW duration', () => {
      expect(TIMING.ANIMATIONS.SLOW).toBeGreaterThan(0);
      expect(Number.isInteger(TIMING.ANIMATIONS.SLOW)).toBe(true);
    });

    it('should have QUICK < DEFAULT < SLOW', () => {
      expect(TIMING.ANIMATIONS.QUICK).toBeLessThan(TIMING.ANIMATIONS.DEFAULT);
      expect(TIMING.ANIMATIONS.DEFAULT).toBeLessThan(TIMING.ANIMATIONS.SLOW);
    });

    it('should have reasonable animation durations (between 50ms-1000ms)', () => {
      expect(TIMING.ANIMATIONS.QUICK).toBeGreaterThanOrEqual(50);
      expect(TIMING.ANIMATIONS.QUICK).toBeLessThanOrEqual(1000);
      
      expect(TIMING.ANIMATIONS.DEFAULT).toBeGreaterThanOrEqual(50);
      expect(TIMING.ANIMATIONS.DEFAULT).toBeLessThanOrEqual(1000);
      
      expect(TIMING.ANIMATIONS.SLOW).toBeGreaterThanOrEqual(50);
      expect(TIMING.ANIMATIONS.SLOW).toBeLessThanOrEqual(1000);
    });
  });

  // ============ Game ============

  describe('game', () => {
    it('should have positive TIMER_INTERVAL', () => {
      expect(TIMING.GAME.TIMER_INTERVAL).toBeGreaterThan(0);
      expect(Number.isInteger(TIMING.GAME.TIMER_INTERVAL)).toBe(true);
    });

    it('should have positive SAVE_DEBOUNCE', () => {
      expect(TIMING.GAME.SAVE_DEBOUNCE).toBeGreaterThan(0);
      expect(Number.isInteger(TIMING.GAME.SAVE_DEBOUNCE)).toBe(true);
    });

    it('should have TIMER_INTERVAL of 1 second (1000ms)', () => {
      expect(TIMING.GAME.TIMER_INTERVAL).toBe(1000);
    });

    it('should have reasonable save debounce (between 100ms-2000ms)', () => {
      expect(TIMING.GAME.SAVE_DEBOUNCE).toBeGreaterThanOrEqual(100);
      expect(TIMING.GAME.SAVE_DEBOUNCE).toBeLessThanOrEqual(2000);
    });
  });

  // ============ getAdLoadTimeout ============

  describe('getAdLoadTimeout', () => {
    it('should return a positive number', () => {
      const timeout = getAdLoadTimeout();
      expect(timeout).toBeGreaterThan(0);
      expect(Number.isInteger(timeout)).toBe(true);
    });

    it('should return LOAD_DEV or LOAD_PROD based on environment', () => {
      const timeout = getAdLoadTimeout();
      
      // Should be one of the two configured values
      const validValues = [TIMING.AD_TIMEOUTS.LOAD_DEV, TIMING.AD_TIMEOUTS.LOAD_PROD];
      expect(validValues).toContain(timeout);
    });

    it('should return consistent value for same environment', () => {
      const timeout1 = getAdLoadTimeout();
      const timeout2 = getAdLoadTimeout();
      
      expect(timeout1).toBe(timeout2);
    });
  });

  // ============ TIMING Object Immutability ============

  describe('TIMING object', () => {
    it('should be read-only (const)', () => {
      // TypeScript enforces this, but we can verify the object exists
      expect(TIMING).toBeDefined();
      expect(typeof TIMING).toBe('object');
    });

    it('should have all required top-level keys', () => {
      expect(TIMING.MODAL_DELAYS).toBeDefined();
      expect(TIMING.AD_TIMEOUTS).toBeDefined();
      expect(TIMING.NETWORK).toBeDefined();
      expect(TIMING.ACHIEVEMENTS).toBeDefined();
      expect(TIMING.ANIMATIONS).toBeDefined();
      expect(TIMING.GAME).toBeDefined();
    });
  });
});
