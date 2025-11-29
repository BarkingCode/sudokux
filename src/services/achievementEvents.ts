/**
 * Achievement event emitter for bridging statsService with React context.
 * Emits events when achievements are unlocked so the UI can show toast notifications.
 */

import type { AchievementId } from './gameCenter';

type AchievementListener = (achievementId: AchievementId) => void;

class AchievementEventEmitter {
  private listeners: AchievementListener[] = [];

  /**
   * Subscribe to achievement unlock events
   */
  subscribe(listener: AchievementListener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  /**
   * Emit an achievement unlock event
   */
  emit(achievementId: AchievementId): void {
    this.listeners.forEach((listener) => listener(achievementId));
  }
}

export const achievementEvents = new AchievementEventEmitter();
