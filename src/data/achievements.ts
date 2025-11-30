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
    icon: '\u{1F3AF}', // Target emoji
    category: 'milestone',
  },
  {
    id: 'games_10',
    name: 'Getting Started',
    description: 'Complete 10 puzzles',
    icon: '\u{1F51F}', // Keycap 10 emoji
    category: 'milestone',
  },
  {
    id: 'games_50',
    name: 'Dedicated Player',
    description: 'Complete 50 puzzles',
    icon: '\u{1F396}', // Military medal emoji
    category: 'milestone',
  },
  {
    id: 'games_100',
    name: 'Centurion',
    description: 'Complete 100 puzzles',
    icon: '\u{1F4AF}', // 100 emoji
    category: 'milestone',
  },

  // Skill Achievements
  {
    id: 'speed_demon',
    name: 'Speed Demon',
    description: 'Complete an Easy puzzle in under 3 minutes',
    icon: '\u{26A1}', // Lightning emoji
    category: 'skill',
  },
  {
    id: 'perfectionist',
    name: 'Perfectionist',
    description: 'Complete a puzzle with no mistakes',
    icon: '\u{2728}', // Sparkles emoji
    category: 'skill',
  },
  {
    id: 'no_hints',
    name: 'Self Reliant',
    description: 'Complete a puzzle without using any hints',
    icon: '\u{1F9E0}', // Brain emoji
    category: 'skill',
  },

  // Streak Achievements
  {
    id: 'streak_7',
    name: 'Week Warrior',
    description: 'Maintain a 7-day play streak',
    icon: '\u{1F525}', // Fire emoji
    category: 'streak',
  },
  {
    id: 'streak_30',
    name: 'Monthly Master',
    description: 'Maintain a 30-day play streak',
    icon: '\u{1F31F}', // Glowing star emoji
    category: 'streak',
  },

  // Mastery Achievements
  {
    id: 'master_easy',
    name: 'Easy Master',
    description: 'Complete 20 Easy puzzles',
    icon: '\u{1F949}', // Bronze medal emoji
    category: 'mastery',
  },
  {
    id: 'master_medium',
    name: 'Medium Master',
    description: 'Complete 20 Medium puzzles',
    icon: '\u{1F948}', // Silver medal emoji
    category: 'mastery',
  },
  {
    id: 'master_hard',
    name: 'Hard Master',
    description: 'Complete 20 Hard puzzles',
    icon: '\u{1F947}', // Gold medal emoji
    category: 'mastery',
  },
  {
    id: 'chapter_complete',
    name: 'Chapter Champion',
    description: 'Complete your first chapter',
    icon: '\u{1F3C6}', // Trophy emoji
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
