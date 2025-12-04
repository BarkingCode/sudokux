/**
 * TypeScript types for Supabase database schema
 *
 * These types match the SQL schema in docs/database-schema.sql
 * Regenerate with: npx supabase gen types typescript --project-id YOUR_PROJECT_ID
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      achievements: {
        Row: {
          achievement_id: string;
          id: string;
          unlocked_at: string;
          user_id: string;
        };
        Insert: {
          achievement_id: string;
          id?: string;
          unlocked_at?: string;
          user_id: string;
        };
        Update: {
          achievement_id?: string;
          id?: string;
          unlocked_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      daily_challenges: {
        Row: {
          challenge_date: string;
          created_at: string;
          difficulty: string;
          grid_type: string;
          id: string;
          puzzle_grid: Json;
          solution_grid: Json;
        };
        Insert: {
          challenge_date: string;
          created_at?: string;
          difficulty: string;
          grid_type?: string;
          id?: string;
          puzzle_grid: Json;
          solution_grid: Json;
        };
        Update: {
          challenge_date?: string;
          created_at?: string;
          difficulty?: string;
          grid_type?: string;
          id?: string;
          puzzle_grid?: Json;
          solution_grid?: Json;
        };
        Relationships: [];
      };
      daily_completions: {
        Row: {
          challenge_date: string;
          challenge_id: string;
          completed_at: string;
          helper_used: number | null;
          id: string;
          mistakes: number | null;
          time_seconds: number;
          user_id: string;
        };
        Insert: {
          challenge_date: string;
          challenge_id: string;
          completed_at?: string;
          helper_used?: number | null;
          id?: string;
          mistakes?: number | null;
          time_seconds: number;
          user_id: string;
        };
        Update: {
          challenge_date?: string;
          challenge_id?: string;
          completed_at?: string;
          helper_used?: number | null;
          id?: string;
          mistakes?: number | null;
          time_seconds?: number;
          user_id?: string;
        };
        Relationships: [];
      };
      game_sessions: {
        Row: {
          completed: boolean | null;
          completed_at: string;
          created_at: string;
          difficulty: string;
          grid_type: string;
          helper_used: number | null;
          id: string;
          mistakes: number | null;
          puzzle_id: string;
          time_seconds: number;
          user_id: string;
        };
        Insert: {
          completed?: boolean | null;
          completed_at?: string;
          created_at?: string;
          difficulty: string;
          grid_type?: string;
          helper_used?: number | null;
          id?: string;
          mistakes?: number | null;
          puzzle_id: string;
          time_seconds: number;
          user_id: string;
        };
        Update: {
          completed?: boolean | null;
          completed_at?: string;
          created_at?: string;
          difficulty?: string;
          grid_type?: string;
          helper_used?: number | null;
          id?: string;
          mistakes?: number | null;
          puzzle_id?: string;
          time_seconds?: number;
          user_id?: string;
        };
        Relationships: [];
      };
      notification_logs: {
        Row: {
          challenge_date: string | null;
          error_message: string | null;
          id: string;
          notification_type: string;
          sent_at: string | null;
          status: string | null;
          user_id: string;
        };
        Insert: {
          challenge_date?: string | null;
          error_message?: string | null;
          id?: string;
          notification_type: string;
          sent_at?: string | null;
          status?: string | null;
          user_id: string;
        };
        Update: {
          challenge_date?: string | null;
          error_message?: string | null;
          id?: string;
          notification_type?: string;
          sent_at?: string | null;
          status?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      notification_preferences: {
        Row: {
          created_at: string | null;
          daily_reminder_enabled: boolean | null;
          id: string;
          reminder_hour: number | null;
          reminder_minute: number | null;
          timezone: string | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          daily_reminder_enabled?: boolean | null;
          id?: string;
          reminder_hour?: number | null;
          reminder_minute?: number | null;
          timezone?: string | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          daily_reminder_enabled?: boolean | null;
          id?: string;
          reminder_hour?: number | null;
          reminder_minute?: number | null;
          timezone?: string | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      push_tokens: {
        Row: {
          created_at: string | null;
          device_name: string | null;
          expo_push_token: string;
          id: string;
          is_active: boolean | null;
          platform: string | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          device_name?: string | null;
          expo_push_token: string;
          id?: string;
          is_active?: boolean | null;
          platform?: string | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          device_name?: string | null;
          expo_push_token?: string;
          id?: string;
          is_active?: boolean | null;
          platform?: string | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      user_stats: {
        Row: {
          avg_time_easy: number | null;
          avg_time_hard: number | null;
          avg_time_medium: number | null;
          best_daily_streak: number | null;
          best_streak: number | null;
          best_time_easy: number | null;
          best_time_hard: number | null;
          best_time_medium: number | null;
          current_streak: number | null;
          daily_streak: number | null;
          id: string;
          last_daily_completed: string | null;
          total_games: number | null;
          total_hints: number | null;
          total_mistakes: number | null;
          total_points: number | null;
          total_wins: number | null;
          total_xp: number | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          avg_time_easy?: number | null;
          avg_time_hard?: number | null;
          avg_time_medium?: number | null;
          best_daily_streak?: number | null;
          best_streak?: number | null;
          best_time_easy?: number | null;
          best_time_hard?: number | null;
          best_time_medium?: number | null;
          current_streak?: number | null;
          daily_streak?: number | null;
          id?: string;
          last_daily_completed?: string | null;
          total_games?: number | null;
          total_hints?: number | null;
          total_mistakes?: number | null;
          total_points?: number | null;
          total_wins?: number | null;
          total_xp?: number | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          avg_time_easy?: number | null;
          avg_time_hard?: number | null;
          avg_time_medium?: number | null;
          best_daily_streak?: number | null;
          best_streak?: number | null;
          best_time_easy?: number | null;
          best_time_hard?: number | null;
          best_time_medium?: number | null;
          current_streak?: number | null;
          daily_streak?: number | null;
          id?: string;
          last_daily_completed?: string | null;
          total_games?: number | null;
          total_hints?: number | null;
          total_mistakes?: number | null;
          total_points?: number | null;
          total_wins?: number | null;
          total_xp?: number | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      users: {
        Row: {
          country: string | null;
          created_at: string;
          game_center_id: string | null;
          google_id: string | null;
          id: string;
          internal_id: string;
          nickname: string;
          region: string | null;
          updated_at: string;
        };
        Insert: {
          country?: string | null;
          created_at?: string;
          game_center_id?: string | null;
          google_id?: string | null;
          id?: string;
          internal_id: string;
          nickname: string;
          region?: string | null;
          updated_at?: string;
        };
        Update: {
          country?: string | null;
          created_at?: string;
          game_center_id?: string | null;
          google_id?: string | null;
          id?: string;
          internal_id?: string;
          nickname?: string;
          region?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      leaderboard_easy: {
        Row: {
          best_time: number | null;
          country: string | null;
          nickname: string | null;
          rank: number | null;
          user_id: string | null;
        };
        Relationships: [];
      };
      leaderboard_hard: {
        Row: {
          best_time: number | null;
          country: string | null;
          nickname: string | null;
          rank: number | null;
          user_id: string | null;
        };
        Relationships: [];
      };
      leaderboard_medium: {
        Row: {
          best_time: number | null;
          country: string | null;
          nickname: string | null;
          rank: number | null;
          user_id: string | null;
        };
        Relationships: [];
      };
      points_leaderboard: {
        Row: {
          user_id: string | null;
          nickname: string | null;
          country: string | null;
          points: number | null;
          rank: number | null;
        };
        Relationships: [];
      };
      points_leaderboard_by_country: {
        Row: {
          user_id: string | null;
          nickname: string | null;
          country: string | null;
          points: number | null;
          rank: number | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      get_user_rank: {
        Args: {
          p_user_id: string;
          p_difficulty: string;
        };
        Returns: number;
      };
      get_users_for_daily_reminder: {
        Args: {
          p_current_utc_hour: number;
          p_today: string;
        };
        Returns: {
          expo_push_token: string;
          reminder_hour: number;
          timezone: string;
          user_id: string;
        }[];
      };
      get_user_points_rank: {
        Args: {
          p_user_id: string;
          p_country: string | null;
        };
        Returns: {
          rank: number;
          total_players: number;
        }[];
      };
      calculate_user_points: {
        Args: {
          p_user_id: string;
        };
        Returns: number;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

// Convenience type exports
export type User = Database['public']['Tables']['users']['Row'];
export type UserInsert = Database['public']['Tables']['users']['Insert'];
export type GameSession = Database['public']['Tables']['game_sessions']['Row'];
export type GameSessionInsert = Database['public']['Tables']['game_sessions']['Insert'];
export type UserStats = Database['public']['Tables']['user_stats']['Row'];
export type UserStatsUpdate = Database['public']['Tables']['user_stats']['Update'];
export type Achievement = Database['public']['Tables']['achievements']['Row'];
export type DailyChallenge = Database['public']['Tables']['daily_challenges']['Row'];
export type DailyChallengeInsert = Database['public']['Tables']['daily_challenges']['Insert'];
export type DailyCompletion = Database['public']['Tables']['daily_completions']['Row'];
export type DailyCompletionInsert = Database['public']['Tables']['daily_completions']['Insert'];
export type PushToken = Database['public']['Tables']['push_tokens']['Row'];
export type PushTokenInsert = Database['public']['Tables']['push_tokens']['Insert'];
export type NotificationPreferences = Database['public']['Tables']['notification_preferences']['Row'];
export type NotificationPreferencesInsert = Database['public']['Tables']['notification_preferences']['Insert'];
export type NotificationLog = Database['public']['Tables']['notification_logs']['Row'];
export type Difficulty = 'easy' | 'medium' | 'hard' | 'extreme' | 'insane' | 'inhuman';
export type GridType = '6x6' | '9x9';

// Chapter completions types (for replay feature)
export interface ChapterCompletion {
  id: string;
  user_id: string;
  puzzle_number: number;
  difficulty: string;
  grid_type: string;
  puzzle_grid: string; // JSON string of 2D array
  solution_grid: string; // JSON string of 2D array
  time_seconds: number;
  mistakes: number;
  helper_used: number;
  completed_at: string;
  created_at: string;
}

export interface ChapterCompletionInsert {
  user_id: string;
  puzzle_number: number;
  difficulty: string;
  grid_type: string;
  puzzle_grid: string;
  solution_grid: string;
  time_seconds: number;
  mistakes?: number;
  helper_used?: number;
}
