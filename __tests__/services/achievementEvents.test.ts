/**
 * Tests for src/services/achievementEvents.ts
 * Event emitter for achievement unlocks.
 */

import { achievementEvents } from '../../src/services/achievementEvents';

describe('achievementEvents', () => {
  beforeEach(() => {
    // Clear all listeners by subscribing and immediately unsubscribing
    // We rely on the singleton being fresh enough per test
  });

  describe('emit', () => {
    it('should call subscribed listeners with the achievement id', () => {
      const listener = jest.fn();
      const unsub = achievementEvents.subscribe(listener);

      achievementEvents.emit('first_puzzle' as any);

      expect(listener).toHaveBeenCalledWith('first_puzzle');
      expect(listener).toHaveBeenCalledTimes(1);
      unsub();
    });

    it('should call multiple listeners', () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();
      const unsub1 = achievementEvents.subscribe(listener1);
      const unsub2 = achievementEvents.subscribe(listener2);

      achievementEvents.emit('games_10' as any);

      expect(listener1).toHaveBeenCalledWith('games_10');
      expect(listener2).toHaveBeenCalledWith('games_10');
      unsub1();
      unsub2();
    });

    it('should not throw when no listeners', () => {
      expect(() => achievementEvents.emit('first_puzzle' as any)).not.toThrow();
    });
  });

  describe('subscribe', () => {
    it('should return an unsubscribe function', () => {
      const listener = jest.fn();
      const unsub = achievementEvents.subscribe(listener);

      expect(typeof unsub).toBe('function');
      unsub();
    });

    it('should stop receiving events after unsubscribe', () => {
      const listener = jest.fn();
      const unsub = achievementEvents.subscribe(listener);

      achievementEvents.emit('first_puzzle' as any);
      expect(listener).toHaveBeenCalledTimes(1);

      unsub();
      achievementEvents.emit('first_puzzle' as any);
      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('should only unsubscribe the specific listener', () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();
      const unsub1 = achievementEvents.subscribe(listener1);
      const unsub2 = achievementEvents.subscribe(listener2);

      unsub1();

      achievementEvents.emit('games_10' as any);
      expect(listener1).not.toHaveBeenCalled();
      expect(listener2).toHaveBeenCalledWith('games_10');
      unsub2();
    });
  });
});
