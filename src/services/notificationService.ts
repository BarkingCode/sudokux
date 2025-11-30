/**
 * Notification Service
 *
 * Handles push notification setup and management:
 * - Requesting permissions
 * - Getting and storing Expo push tokens
 * - Managing notification preferences
 * - Handling incoming notifications
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { supabase } from '../lib/supabase';

// Configure how notifications are handled when app is foregrounded
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface NotificationPreferences {
  dailyReminderEnabled: boolean;
  reminderHour: number;
  reminderMinute: number;
  timezone: string;
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
  dailyReminderEnabled: true,
  reminderHour: 9,
  reminderMinute: 0,
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
};

class NotificationService {
  private expoPushToken: string | null = null;
  private localPreferences: NotificationPreferences = { ...DEFAULT_PREFERENCES };

  /**
   * Get Supabase user ID from internal_id
   * Returns the Supabase UUID if user exists, null otherwise
   */
  private async getSupabaseUserId(internalId: string): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id')
        .eq('internal_id', internalId)
        .maybeSingle();

      if (error || !data) {
        return null;
      }
      return data.id;
    } catch {
      return null;
    }
  }

  /**
   * Initialize notifications - request permissions and get token
   */
  async initialize(userId: string): Promise<string | null> {
    if (!Device.isDevice) {
      console.log('Push notifications require a physical device');
      return null;
    }

    // Check/request permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Push notification permission not granted');
      return null;
    }

    // Configure Android channel
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('daily-reminder', {
        name: 'Daily Reminder',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#000000',
      });
    }

    try {
      // Get Expo push token
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
      });
      this.expoPushToken = tokenData.data;

      // Store token in database
      await this.storeToken(userId, this.expoPushToken);

      return this.expoPushToken;
    } catch (error) {
      console.error('Failed to get push token:', error);
      return null;
    }
  }

  /**
   * Store push token in Supabase
   */
  private async storeToken(internalId: string, token: string): Promise<void> {
    try {
      // Get Supabase user ID from internal_id
      const supabaseUserId = await this.getSupabaseUserId(internalId);

      if (!supabaseUserId) {
        // User not synced to Supabase yet, skip storing token
        return;
      }

      const { error } = await supabase
        .from('push_tokens')
        .upsert(
          {
            user_id: supabaseUserId,
            expo_push_token: token,
            platform: Platform.OS,
            device_name: Device.deviceName || 'Unknown Device',
            is_active: true,
          },
          {
            onConflict: 'user_id,expo_push_token',
          }
        );

      if (error) {
        console.error('Failed to store push token:', error);
      }
    } catch (error) {
      console.error('Error storing push token:', error);
    }
  }

  /**
   * Remove push token (on logout or disable)
   */
  async removeToken(internalId: string): Promise<void> {
    if (!this.expoPushToken) return;

    try {
      const supabaseUserId = await this.getSupabaseUserId(internalId);
      if (!supabaseUserId) return;

      await supabase
        .from('push_tokens')
        .update({ is_active: false })
        .eq('user_id', supabaseUserId)
        .eq('expo_push_token', this.expoPushToken);
    } catch (error) {
      console.error('Error removing push token:', error);
    }
  }

  /**
   * Get notification preferences for a user
   */
  async getPreferences(internalId: string): Promise<NotificationPreferences> {
    try {
      // Get Supabase user ID from internal_id
      const supabaseUserId = await this.getSupabaseUserId(internalId);

      if (!supabaseUserId) {
        // User not synced to Supabase yet, return local preferences
        return this.localPreferences;
      }

      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', supabaseUserId)
        .single();

      if (error || !data) {
        // Return defaults and create preference record
        await this.updatePreferencesWithSupabaseId(supabaseUserId, DEFAULT_PREFERENCES);
        return DEFAULT_PREFERENCES;
      }

      const prefs = {
        dailyReminderEnabled: data.daily_reminder_enabled ?? true,
        reminderHour: data.reminder_hour ?? 9,
        reminderMinute: data.reminder_minute ?? 0,
        timezone: data.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone,
      };

      // Update local cache
      this.localPreferences = prefs;
      return prefs;
    } catch (error) {
      console.error('Error getting notification preferences:', error);
      return this.localPreferences;
    }
  }

  /**
   * Update notification preferences (internal method using Supabase ID)
   */
  private async updatePreferencesWithSupabaseId(
    supabaseUserId: string,
    preferences: Partial<NotificationPreferences>
  ): Promise<boolean> {
    const updateData: Record<string, unknown> = {};

    if (preferences.dailyReminderEnabled !== undefined) {
      updateData.daily_reminder_enabled = preferences.dailyReminderEnabled;
    }
    if (preferences.reminderHour !== undefined) {
      updateData.reminder_hour = preferences.reminderHour;
    }
    if (preferences.reminderMinute !== undefined) {
      updateData.reminder_minute = preferences.reminderMinute;
    }
    if (preferences.timezone !== undefined) {
      updateData.timezone = preferences.timezone;
    }

    const { error } = await supabase
      .from('notification_preferences')
      .upsert(
        {
          user_id: supabaseUserId,
          ...updateData,
        },
        {
          onConflict: 'user_id',
        }
      );

    if (error) {
      console.error('Failed to update preferences:', error);
      return false;
    }

    return true;
  }

  /**
   * Update notification preferences
   */
  async updatePreferences(
    internalId: string,
    preferences: Partial<NotificationPreferences>
  ): Promise<boolean> {
    try {
      // Always update local preferences first
      if (preferences.dailyReminderEnabled !== undefined) {
        this.localPreferences.dailyReminderEnabled = preferences.dailyReminderEnabled;
      }
      if (preferences.reminderHour !== undefined) {
        this.localPreferences.reminderHour = preferences.reminderHour;
      }
      if (preferences.reminderMinute !== undefined) {
        this.localPreferences.reminderMinute = preferences.reminderMinute;
      }
      if (preferences.timezone !== undefined) {
        this.localPreferences.timezone = preferences.timezone;
      }

      // Get Supabase user ID from internal_id
      const supabaseUserId = await this.getSupabaseUserId(internalId);

      if (!supabaseUserId) {
        // User not synced to Supabase yet, local update is sufficient
        return true;
      }

      return await this.updatePreferencesWithSupabaseId(supabaseUserId, preferences);
    } catch (error) {
      console.error('Error updating preferences:', error);
      return false;
    }
  }

  /**
   * Schedule a local notification (for testing)
   */
  async scheduleLocalNotification(
    title: string,
    body: string,
    seconds: number = 5
  ): Promise<string | null> {
    try {
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds,
        },
      });
      return id;
    } catch (error) {
      console.error('Error scheduling notification:', error);
      return null;
    }
  }

  /**
   * Cancel all scheduled notifications
   */
  async cancelAllNotifications(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  /**
   * Get the current push token
   */
  getToken(): string | null {
    return this.expoPushToken;
  }

  /**
   * Add notification response listener
   */
  addNotificationResponseListener(
    callback: (response: Notifications.NotificationResponse) => void
  ): Notifications.Subscription {
    return Notifications.addNotificationResponseReceivedListener(callback);
  }

  /**
   * Add notification received listener
   */
  addNotificationReceivedListener(
    callback: (notification: Notifications.Notification) => void
  ): Notifications.Subscription {
    return Notifications.addNotificationReceivedListener(callback);
  }
}

export const notificationService = new NotificationService();
