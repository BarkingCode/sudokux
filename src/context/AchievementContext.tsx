/**
 * Achievement context for managing achievement toast notifications.
 * Listens to achievement unlock events from statsService and displays
 * toast notifications when achievements are unlocked.
 */

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { AchievementToast } from '../components/AchievementToast';
import { Confetti } from '../components/Confetti';
import { getAchievementById, type AchievementDefinition } from '../data/achievements';
import { achievementEvents } from '../services/achievementEvents';
import type { AchievementId } from '../services/gameCenter';

// Milestone achievements trigger confetti animation
const MILESTONE_ACHIEVEMENTS: AchievementId[] = [
  'games_10',
  'games_50',
  'games_100',
  'streak_7',
  'streak_30',
  'chapter_complete',
  'master_easy',
  'master_medium',
  'master_hard',
];

interface AchievementContextType {
  showAchievement: (achievementId: AchievementId) => void;
}

const AchievementContext = createContext<AchievementContextType | undefined>(undefined);

interface AchievementProviderProps {
  children: ReactNode;
}

export const AchievementProvider: React.FC<AchievementProviderProps> = ({ children }) => {
  const [currentAchievement, setCurrentAchievement] = useState<AchievementDefinition | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [queue, setQueue] = useState<AchievementDefinition[]>([]);

  // Subscribe to achievement events from statsService
  useEffect(() => {
    const unsubscribe = achievementEvents.subscribe((achievementId) => {
      const achievement = getAchievementById(achievementId);
      if (!achievement) return;

      if (isVisible) {
        // Add to queue if currently showing one
        setQueue((prev) => [...prev, achievement]);
      } else {
        // Show immediately
        setCurrentAchievement(achievement);
        setIsVisible(true);

        // Show confetti for milestone achievements
        if (MILESTONE_ACHIEVEMENTS.includes(achievementId)) {
          setShowConfetti(true);
        }
      }
    });

    return unsubscribe;
  }, [isVisible]);

  const showNext = useCallback(() => {
    setQueue((prev) => {
      if (prev.length > 0) {
        const [next, ...rest] = prev;
        setCurrentAchievement(next);
        setIsVisible(true);
        return rest;
      }
      return prev;
    });
  }, []);

  const handleHide = useCallback(() => {
    setIsVisible(false);
    setCurrentAchievement(null);

    // Show next in queue after a small delay
    setTimeout(() => {
      showNext();
    }, 300);
  }, [showNext]);

  const handleConfettiComplete = useCallback(() => {
    setShowConfetti(false);
  }, []);

  const showAchievement = useCallback(
    (achievementId: AchievementId) => {
      const achievement = getAchievementById(achievementId);
      if (!achievement) return;

      if (isVisible) {
        // Add to queue if currently showing one
        setQueue((prev) => [...prev, achievement]);
      } else {
        // Show immediately
        setCurrentAchievement(achievement);
        setIsVisible(true);

        // Show confetti for milestone achievements
        if (MILESTONE_ACHIEVEMENTS.includes(achievementId)) {
          setShowConfetti(true);
        }
      }
    },
    [isVisible]
  );

  return (
    <AchievementContext.Provider value={{ showAchievement }}>
      {children}
      <Confetti
        visible={showConfetti}
        onComplete={handleConfettiComplete}
      />
      <AchievementToast
        achievement={currentAchievement}
        visible={isVisible}
        onHide={handleHide}
      />
    </AchievementContext.Provider>
  );
};

export const useAchievements = (): AchievementContextType => {
  const context = useContext(AchievementContext);
  if (!context) {
    throw new Error('useAchievements must be used within an AchievementProvider');
  }
  return context;
};
