/**
 * Achievement definitions with metadata for display and progress tracking.
 * Each achievement has an id matching the Supabase achievement id,
 * display name, description, icon, category, and progress tracking fields.
 */

// Achievement IDs - used for Supabase tracking
export type AchievementId =
  // Milestone achievements
  | 'first_puzzle'
  | 'games_10'
  | 'games_50'
  | 'games_100'
  | 'games_250'
  | 'games_500'
  | 'games_1000'
  // Skill achievements
  | 'speed_demon'
  | 'speed_medium'
  | 'speed_hard'
  | 'perfectionist'
  | 'no_hints'
  // Streak achievements
  | 'streak_7'
  | 'streak_30'
  | 'streak_60'
  | 'streak_90'
  // Mastery achievements
  | 'master_easy'
  | 'master_medium'
  | 'master_hard'
  | 'master_extreme'
  | 'master_insane'
  | 'master_inhuman'
  | 'all_difficulties'
  | 'chapter_complete'
  // Grid type achievements
  | 'mini_first'
  | 'mini_master'
  | 'mini_speed'
  | 'grid_explorer'
  // Daily challenge achievements
  | 'daily_first'
  | 'daily_streak_7'
  | 'daily_streak_30';

export type ProgressType = 'count' | 'streak' | 'boolean' | 'daily_streak' | 'daily_count';

export interface AchievementDefinition {
  id: AchievementId;
  name: string;
  description: string;
  icon: string; // Emoji or icon name
  category: 'milestone' | 'skill' | 'streak' | 'mastery' | 'daily' | 'grid';
  secret?: boolean; // Hidden until unlocked
  target?: number; // Numeric target (e.g., 20 for master_easy)
  progressType?: ProgressType; // How progress is calculated
  progressKey?: string; // Key to look up in stats
}

export const ACHIEVEMENTS: AchievementDefinition[] = [
  // ==========================================
  // MILESTONE ACHIEVEMENTS
  // ==========================================
  {
    id: 'first_puzzle',
    name: 'First Steps',
    description: 'Complete your first puzzle',
    icon: '\u{1F3AF}', // Target emoji
    category: 'milestone',
    target: 1,
    progressType: 'count',
    progressKey: 'total_wins',
  },
  {
    id: 'games_10',
    name: 'Getting Started',
    description: 'Complete 10 puzzles',
    icon: '\u{1F51F}', // Keycap 10 emoji
    category: 'milestone',
    target: 10,
    progressType: 'count',
    progressKey: 'total_wins',
  },
  {
    id: 'games_50',
    name: 'Dedicated Player',
    description: 'Complete 50 puzzles',
    icon: '\u{1F396}', // Military medal emoji
    category: 'milestone',
    target: 50,
    progressType: 'count',
    progressKey: 'total_wins',
  },
  {
    id: 'games_100',
    name: 'Centurion',
    description: 'Complete 100 puzzles',
    icon: '\u{1F4AF}', // 100 emoji
    category: 'milestone',
    target: 100,
    progressType: 'count',
    progressKey: 'total_wins',
  },
  {
    id: 'games_250',
    name: 'Dedicated Solver',
    description: 'Complete 250 puzzles',
    icon: '\u{1F3C5}', // Sports medal emoji
    category: 'milestone',
    target: 250,
    progressType: 'count',
    progressKey: 'total_wins',
  },
  {
    id: 'games_500',
    name: 'Sudoku Veteran',
    description: 'Complete 500 puzzles',
    icon: '\u{1F451}', // Crown emoji
    category: 'milestone',
    target: 500,
    progressType: 'count',
    progressKey: 'total_wins',
  },
  {
    id: 'games_1000',
    name: 'Legendary Solver',
    description: 'Complete 1000 puzzles',
    icon: '\u{1F48E}', // Gem emoji
    category: 'milestone',
    target: 1000,
    progressType: 'count',
    progressKey: 'total_wins',
  },

  // ==========================================
  // SKILL ACHIEVEMENTS
  // ==========================================
  {
    id: 'speed_demon',
    name: 'Speed Demon',
    description: 'Complete an Easy puzzle in under 3 minutes',
    icon: '\u{26A1}', // Lightning emoji
    category: 'skill',
    progressType: 'boolean',
  },
  {
    id: 'speed_medium',
    name: 'Swift Solver',
    description: 'Complete a Medium puzzle in under 5 minutes',
    icon: '\u{1F3C3}', // Runner emoji
    category: 'skill',
    progressType: 'boolean',
  },
  {
    id: 'speed_hard',
    name: 'Rapid Expert',
    description: 'Complete a Hard puzzle in under 10 minutes',
    icon: '\u{1F680}', // Rocket emoji
    category: 'skill',
    progressType: 'boolean',
  },
  {
    id: 'perfectionist',
    name: 'Perfectionist',
    description: 'Complete a puzzle with no mistakes',
    icon: '\u{2728}', // Sparkles emoji
    category: 'skill',
    progressType: 'boolean',
  },
  {
    id: 'no_hints',
    name: 'Self Reliant',
    description: 'Complete a puzzle without using any hints',
    icon: '\u{1F9E0}', // Brain emoji
    category: 'skill',
    progressType: 'boolean',
  },

  // ==========================================
  // STREAK ACHIEVEMENTS
  // ==========================================
  {
    id: 'streak_7',
    name: 'Week Warrior',
    description: 'Maintain a 7-day play streak',
    icon: '\u{1F525}', // Fire emoji
    category: 'streak',
    target: 7,
    progressType: 'streak',
    progressKey: 'best_streak',
  },
  {
    id: 'streak_30',
    name: 'Monthly Master',
    description: 'Maintain a 30-day play streak',
    icon: '\u{1F31F}', // Glowing star emoji
    category: 'streak',
    target: 30,
    progressType: 'streak',
    progressKey: 'best_streak',
  },
  {
    id: 'streak_60',
    name: 'Two Month Streak',
    description: 'Maintain a 60-day play streak',
    icon: '\u{1F4AA}', // Flexed biceps emoji
    category: 'streak',
    target: 60,
    progressType: 'streak',
    progressKey: 'best_streak',
  },
  {
    id: 'streak_90',
    name: 'Quarterly Champion',
    description: 'Maintain a 90-day play streak',
    icon: '\u{1F3C6}', // Trophy emoji
    category: 'streak',
    target: 90,
    progressType: 'streak',
    progressKey: 'best_streak',
  },

  // ==========================================
  // MASTERY ACHIEVEMENTS
  // ==========================================
  {
    id: 'master_easy',
    name: 'Easy Master',
    description: 'Complete 20 Easy puzzles',
    icon: '\u{1F949}', // Bronze medal emoji
    category: 'mastery',
    target: 20,
    progressType: 'count',
    progressKey: 'easy',
  },
  {
    id: 'master_medium',
    name: 'Medium Master',
    description: 'Complete 20 Medium puzzles',
    icon: '\u{1F948}', // Silver medal emoji
    category: 'mastery',
    target: 20,
    progressType: 'count',
    progressKey: 'medium',
  },
  {
    id: 'master_hard',
    name: 'Hard Master',
    description: 'Complete 20 Hard puzzles',
    icon: '\u{1F947}', // Gold medal emoji
    category: 'mastery',
    target: 20,
    progressType: 'count',
    progressKey: 'hard',
  },
  {
    id: 'master_extreme',
    name: 'Extreme Master',
    description: 'Complete 20 Extreme puzzles',
    icon: '\u{1F4A5}', // Collision emoji
    category: 'mastery',
    target: 20,
    progressType: 'count',
    progressKey: 'extreme',
  },
  {
    id: 'master_insane',
    name: 'Insane Master',
    description: 'Complete 20 Insane puzzles',
    icon: '\u{1F47F}', // Angry face with horns emoji
    category: 'mastery',
    target: 20,
    progressType: 'count',
    progressKey: 'insane',
  },
  {
    id: 'master_inhuman',
    name: 'Inhuman Master',
    description: 'Complete 20 Inhuman puzzles',
    icon: '\u{1F916}', // Robot emoji
    category: 'mastery',
    target: 20,
    progressType: 'count',
    progressKey: 'inhuman',
  },
  {
    id: 'all_difficulties',
    name: 'Well Rounded',
    description: 'Complete at least one puzzle of every difficulty',
    icon: '\u{1F3AF}', // Direct hit emoji
    category: 'mastery',
    target: 6,
    progressType: 'count',
    progressKey: 'difficulties_completed',
  },
  {
    id: 'chapter_complete',
    name: 'Chapter Champion',
    description: 'Complete your first chapter',
    icon: '\u{1F4D6}', // Open book emoji
    category: 'mastery',
    progressType: 'boolean',
  },

  // ==========================================
  // GRID TYPE ACHIEVEMENTS
  // ==========================================
  {
    id: 'mini_first',
    name: 'Mini Starter',
    description: 'Complete your first 6x6 puzzle',
    icon: '\u{1F476}', // Baby emoji
    category: 'grid',
    target: 1,
    progressType: 'count',
    progressKey: '6x6',
  },
  {
    id: 'mini_master',
    name: 'Mini Master',
    description: 'Complete 20 6x6 puzzles',
    icon: '\u{2B50}', // Star emoji
    category: 'grid',
    target: 20,
    progressType: 'count',
    progressKey: '6x6',
  },
  {
    id: 'mini_speed',
    name: 'Mini Lightning',
    description: 'Complete a 6x6 puzzle in under 1 minute',
    icon: '\u{26A1}', // Lightning emoji
    category: 'grid',
    progressType: 'boolean',
  },
  {
    id: 'grid_explorer',
    name: 'Grid Explorer',
    description: 'Complete puzzles in both 6x6 and 9x9 modes',
    icon: '\u{1F5FA}', // World map emoji
    category: 'grid',
    progressType: 'boolean',
  },

  // ==========================================
  // DAILY CHALLENGE ACHIEVEMENTS
  // ==========================================
  {
    id: 'daily_first',
    name: 'Daily Debut',
    description: 'Complete your first daily challenge',
    icon: '\u{1F4C5}', // Calendar emoji
    category: 'daily',
    target: 1,
    progressType: 'daily_count',
    progressKey: 'daily_completions',
  },
  {
    id: 'daily_streak_7',
    name: 'Daily Devotee',
    description: 'Complete daily challenges 7 days in a row',
    icon: '\u{1F4C6}', // Tear-off calendar emoji
    category: 'daily',
    target: 7,
    progressType: 'daily_streak',
    progressKey: 'best_daily_streak',
  },
  {
    id: 'daily_streak_30',
    name: 'Daily Dedication',
    description: 'Complete daily challenges 30 days in a row',
    icon: '\u{1F4C8}', // Chart with upwards trend emoji
    category: 'daily',
    target: 30,
    progressType: 'daily_streak',
    progressKey: 'best_daily_streak',
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
  daily: 'Daily',
  grid: 'Grid Types',
};
