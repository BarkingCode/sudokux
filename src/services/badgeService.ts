/**
 * Badge Service
 *
 * Manages the app icon badge count:
 * - Sets badge to 1 when daily challenge is pending
 * - Clears badge when daily challenge is completed
 * - Handles badge updates at midnight for new challenges
 */

import * as Notifications from 'expo-notifications';
import { hasCompletedToday } from './dailyChallengeService';

class BadgeService {
  private currentBadgeCount: number = 0;

  /**
   * Set the app badge count
   */
  async setBadge(count: number): Promise<void> {
    try {
      await Notifications.setBadgeCountAsync(count);
      this.currentBadgeCount = count;
    } catch (error) {
      console.error('Error setting badge count:', error);
    }
  }

  /**
   * Clear the app badge (set to 0)
   */
  async clearBadge(): Promise<void> {
    await this.setBadge(0);
  }

  /**
   * Set badge to show pending daily challenge
   */
  async setDailyPending(): Promise<void> {
    await this.setBadge(1);
  }

  /**
   * Get current badge count
   */
  getCurrentBadge(): number {
    return this.currentBadgeCount;
  }

  /**
   * Update badge based on daily challenge status
   * Call this on app launch and when daily status changes
   */
  async updateDailyBadge(userId: string | null): Promise<void> {
    if (!userId) {
      await this.clearBadge();
      return;
    }

    try {
      const completed = await hasCompletedToday(userId);
      if (completed) {
        await this.clearBadge();
      } else {
        await this.setDailyPending();
      }
    } catch (error) {
      console.error('Error updating daily badge:', error);
      // Don't show badge if we can't determine status
      await this.clearBadge();
    }
  }

  /**
   * Called when user completes daily challenge
   */
  async onDailyCompleted(): Promise<void> {
    await this.clearBadge();
  }
}

export const badgeService = new BadgeService();
