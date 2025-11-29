/**
 * Achievement definitions with metadata for display.
 * Each achievement has an id matching the Game Center/Supabase id,
 * display name, description, icon, and category.
 */

import type { AchievementId } from '../services/gameCenter';

export interface AchievementDefinition {
  id: AchievementId;
  name: string;
  description: string;
  icon: string; // Emoji or icon name
  category: 'milestone' | 'skill' | 'streak' | 'mastery';
  secret?: boolean; // Hidden until unlocked
}

export const ACHIEVEMENTS: AchievementDefinition[] = [
  // Milestone Achievements
  {
    id: 'first_puzzle',
    name: 'First Steps',
    description: 'Complete your first puzzle',
    icon: '1',
    category: 'milestone',
  },
  {
    id: 'games_10',
    name: 'Getting Started',
    description: 'Complete 10 puzzles',
    icon: '10',
    category: 'milestone',
  },
  {
    id: 'games_50',
    name: 'Dedicated Player',
    description: 'Complete 50 puzzles',
    icon: '50',
    category: 'milestone',
  },
  {
    id: 'games_100',
    name: 'Centurion',
    description: 'Complete 100 puzzles',
    icon: '100',
    category: 'milestone',
  },

  // Skill Achievements
  {
    id: 'speed_demon',
    name: 'Speed Demon',
    description: 'Complete an Easy puzzle in under 3 minutes',
    icon: 'S',
    category: 'skill',
  },
  {
    id: 'perfectionist',
    name: 'Perfectionist',
    description: 'Complete a puzzle with no mistakes',
    icon: 'P',
    category: 'skill',
  },
  {
    id: 'no_hints',
    name: 'Self Reliant',
    description: 'Complete a puzzle without using any hints',
    icon: 'H',
    category: 'skill',
  },

  // Streak Achievements
  {
    id: 'streak_7',
    name: 'Week Warrior',
    description: 'Maintain a 7-day play streak',
    icon: '7',
    category: 'streak',
  },
  {
    id: 'streak_30',
    name: 'Monthly Master',
    description: 'Maintain a 30-day play streak',
    icon: '30',
    category: 'streak',
  },

  // Mastery Achievements
  {
    id: 'master_easy',
    name: 'Easy Master',
    description: 'Complete 20 Easy puzzles',
    icon: 'E',
    category: 'mastery',
  },
  {
    id: 'master_medium',
    name: 'Medium Master',
    description: 'Complete 20 Medium puzzles',
    icon: 'M',
    category: 'mastery',
  },
  {
    id: 'master_hard',
    name: 'Hard Master',
    description: 'Complete 20 Hard puzzles',
    icon: 'H',
    category: 'mastery',
  },
  {
    id: 'chapter_complete',
    name: 'Chapter Champion',
    description: 'Complete your first chapter',
    icon: 'C',
    category: 'mastery',
  },
];

export const getAchievementById = (id: AchievementId): AchievementDefinition | undefined => {
  return ACHIEVEMENTS.find((a) => a.id === id);
};

export const getAchievementsByCategory = (category: AchievementDefinition['category']): AchievementDefinition[] => {
  return ACHIEVEMENTS.filter((a) => a.category === category);
};

export const CATEGORY_LABELS: Record<AchievementDefinition['category'], string> = {
  milestone: 'Milestones',
  skill: 'Skills',
  streak: 'Streaks',
  mastery: 'Mastery',
};
