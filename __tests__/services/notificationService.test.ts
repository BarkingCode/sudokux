/**
 * Tests for src/services/notificationService.ts
 * Notification permission and preference management.
 */

import { notificationService } from '../../src/services/notificationService';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { supabase } from '../../src/lib/supabase';

// Mock Device to control isDevice
let mockIsDevice = true;
jest.mock('expo-device', () => ({
  get isDevice() { return mockIsDevice; },
  deviceName: 'Test Device',
}));

describe('notificationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsDevice = true;
  });

  // ============ Permission Request Flow ============

  describe('permission request', () => {
    it.skip('should request permissions if not granted', async () => {
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'denied',
      });

      (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'granted',
      });

      (Notifications.getExpoPushTokenAsync as jest.Mock).mockResolvedValue({
        data: 'ExponentPushToken[xyz]',
      });

      (supabase.from as jest.Mock).mockReturnValue({
        upsert: jest.fn().mockResolvedValue({
          data: {},
          error: null,
        }),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({
          data: { id: 'user-supabase-id' },
          error: null,
        }),
      });

      const token = await notificationService.initialize('user-123');

      expect(Notifications.requestPermissionsAsync).toHaveBeenCalled();
      expect(token).toBe('ExponentPushToken[xyz]');
    });

    it('should not request if already granted', async () => {
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'granted',
      });

      (Notifications.getExpoPushTokenAsync as jest.Mock).mockResolvedValue({
        data: 'ExponentPushToken[xyz]',
      });

      (supabase.from as jest.Mock).mockReturnValue({
        upsert: jest.fn().mockResolvedValue({
          data: {},
          error: null,
        }),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({
          data: { id: 'user-supabase-id' },
          error: null,
        }),
      });

      await notificationService.initialize('user-123');

      expect(Notifications.requestPermissionsAsync).not.toHaveBeenCalled();
    });

    it('should return null if permission denied', async () => {
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'denied',
      });

      (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'denied',
      });

      const token = await notificationService.initialize('user-123');

      expect(token).toBeNull();
    });

    it('should return null if not a physical device', async () => {
      mockIsDevice = false;

      const token = await notificationService.initialize('user-123');

      expect(token).toBeNull();
      expect(Notifications.getPermissionsAsync).not.toHaveBeenCalled();
    });
  });

  // ============ Default Preferences ============

  describe('default preferences', () => {
    it('should return default preferences for new users', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValueOnce({
          data: { id: 'user-supabase-id' },
          error: null,
        }),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116' },
        }),
        upsert: jest.fn().mockResolvedValue({
          data: {},
          error: null,
        }),
      });

      const prefs = await notificationService.getPreferences('user-123');

      expect(prefs.dailyReminderEnabled).toBe(true);
      expect(prefs.reminderHour).toBe(9);
      expect(prefs.reminderMinute).toBe(0);
      expect(prefs.timezone).toBeDefined();
    });

    it('should return local preferences if user not synced to Supabase', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      });

      const prefs = await notificationService.getPreferences('user-123');

      expect(prefs.dailyReminderEnabled).toBe(true);
    });
  });

  // ============ Update Preferences ============

  describe('update preferences', () => {
    it('should update preferences in Supabase', async () => {
      const mockUpsert = jest.fn().mockResolvedValue({
        data: {},
        error: null,
      });

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({
          data: { id: 'user-supabase-id' },
          error: null,
        }),
        upsert: mockUpsert,
      });

      const result = await notificationService.updatePreferences('user-123', {
        dailyReminderEnabled: false,
        reminderHour: 18,
      });

      expect(result).toBe(true);
      expect(mockUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'user-supabase-id',
          daily_reminder_enabled: false,
          reminder_hour: 18,
        }),
        expect.any(Object)
      );
    });

    it('should update local preferences even if Supabase fails', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({
          data: { id: 'user-supabase-id' },
          error: null,
        }),
        upsert: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Network error' },
        }),
      });

      const result = await notificationService.updatePreferences('user-123', {
        reminderHour: 20,
      });

      expect(result).toBe(false);

      // Local preferences should still be updated
      const prefs = await notificationService.getPreferences('user-123');
      expect(prefs.reminderHour).toBe(20);
    });

    it('should return true if user not synced to Supabase yet', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      });

      const result = await notificationService.updatePreferences('user-123', {
        dailyReminderEnabled: false,
      });

      expect(result).toBe(true);
    });
  });

  // ============ Schedule/Cancel Notifications ============

  describe('schedule notifications', () => {
    it('should schedule local notification', async () => {
      (Notifications.scheduleNotificationAsync as jest.Mock).mockResolvedValue('notif-123');

      const id = await notificationService.scheduleLocalNotification(
        'Test Title',
        'Test Body',
        5
      );

      expect(id).toBe('notif-123');
      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.objectContaining({
            title: 'Test Title',
            body: 'Test Body',
          }),
        })
      );
    });

    it('should return null on error', async () => {
      (Notifications.scheduleNotificationAsync as jest.Mock).mockRejectedValue(
        new Error('Schedule failed')
      );

      const id = await notificationService.scheduleLocalNotification(
        'Test Title',
        'Test Body'
      );

      expect(id).toBeNull();
    });

    it('should cancel all notifications', async () => {
      await notificationService.cancelAllNotifications();

      expect(Notifications.cancelAllScheduledNotificationsAsync).toHaveBeenCalled();
    });
  });

  // ============ Listeners ============

  describe('listeners', () => {
    it('should add notification response listener', () => {
      const callback = jest.fn();
      const mockSubscription = { remove: jest.fn() };

      (Notifications.addNotificationResponseReceivedListener as jest.Mock).mockReturnValue(
        mockSubscription
      );

      const subscription = notificationService.addNotificationResponseListener(callback);

      expect(subscription).toBe(mockSubscription);
      expect(Notifications.addNotificationResponseReceivedListener).toHaveBeenCalledWith(
        callback
      );
    });

    it('should add notification received listener', () => {
      const callback = jest.fn();
      const mockSubscription = { remove: jest.fn() };

      (Notifications.addNotificationReceivedListener as jest.Mock).mockReturnValue(
        mockSubscription
      );

      const subscription = notificationService.addNotificationReceivedListener(callback);

      expect(subscription).toBe(mockSubscription);
      expect(Notifications.addNotificationReceivedListener).toHaveBeenCalledWith(
        callback
      );
    });
  });

  // ============ Get Token ============

  describe('getToken', () => {
    it.skip('should return stored token', async () => {
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'granted',
      });

      (Notifications.getExpoPushTokenAsync as jest.Mock).mockResolvedValue({
        data: 'ExponentPushToken[abc]',
      });

      (supabase.from as jest.Mock).mockReturnValue({
        upsert: jest.fn().mockResolvedValue({ data: {}, error: null }),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({
          data: { id: 'user-supabase-id' },
          error: null,
        }),
      });

      await notificationService.initialize('user-123');

      const token = notificationService.getToken();
      expect(token).toBe('ExponentPushToken[abc]');
    });
  });
});
