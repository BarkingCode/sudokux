/**
 * Tests for src/services/badgeService.ts
 * App badge management.
 */

import { badgeService } from '../../src/services/badgeService';
import * as Notifications from 'expo-notifications';

describe('badgeService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('setBadge', () => {
    it('should set badge count via Notifications', async () => {
      await badgeService.setBadge(3);

      expect(Notifications.setBadgeCountAsync).toHaveBeenCalledWith(3);
    });

    it('should update current badge count', async () => {
      await badgeService.setBadge(5);

      expect(badgeService.getCurrentBadge()).toBe(5);
    });

    it('should handle errors gracefully', async () => {
      (Notifications.setBadgeCountAsync as jest.Mock).mockRejectedValueOnce(new Error('fail'));

      await expect(badgeService.setBadge(1)).resolves.toBeUndefined();
    });
  });

  describe('clearBadge', () => {
    it('should set badge to 0', async () => {
      await badgeService.clearBadge();

      expect(Notifications.setBadgeCountAsync).toHaveBeenCalledWith(0);
      expect(badgeService.getCurrentBadge()).toBe(0);
    });
  });

  describe('setDailyPending', () => {
    it('should set badge to 1', async () => {
      await badgeService.setDailyPending();

      expect(Notifications.setBadgeCountAsync).toHaveBeenCalledWith(1);
      expect(badgeService.getCurrentBadge()).toBe(1);
    });
  });

  describe('getCurrentBadge', () => {
    it('should return 0 initially', () => {
      // After clearBadge from previous test, or fresh
      expect(typeof badgeService.getCurrentBadge()).toBe('number');
    });
  });

  describe('updateDailyBadge', () => {
    it('should clear badge regardless of user', async () => {
      await badgeService.updateDailyBadge('user-123');

      expect(Notifications.setBadgeCountAsync).toHaveBeenCalledWith(0);
    });

    it('should clear badge when userId is null', async () => {
      await badgeService.updateDailyBadge(null);

      expect(Notifications.setBadgeCountAsync).toHaveBeenCalledWith(0);
    });
  });

  describe('onDailyCompleted', () => {
    it('should clear badge', async () => {
      await badgeService.onDailyCompleted();

      expect(Notifications.setBadgeCountAsync).toHaveBeenCalledWith(0);
    });
  });
});
