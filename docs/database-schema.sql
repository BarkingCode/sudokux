-- SudokuX Database Schema
-- Run this SQL in your Supabase SQL Editor to set up the database

-- ============================================
-- USERS TABLE
-- ============================================
-- Stores user profiles linked to anonymous internal IDs and optional Game Center

CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  internal_id TEXT UNIQUE NOT NULL,
  game_center_id TEXT UNIQUE,
  nickname TEXT NOT NULL,
  country TEXT,
  region TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_users_internal_id ON public.users(internal_id);
CREATE INDEX IF NOT EXISTS idx_users_game_center_id ON public.users(game_center_id);
CREATE INDEX IF NOT EXISTS idx_users_country ON public.users(country);

-- ============================================
-- GAME SESSIONS TABLE
-- ============================================
-- Stores individual completed games for history and leaderboards

CREATE TABLE IF NOT EXISTS public.game_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  puzzle_id TEXT NOT NULL,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  time_seconds INTEGER NOT NULL CHECK (time_seconds >= 0),
  mistakes INTEGER DEFAULT 0 CHECK (mistakes >= 0),
  helper_used INTEGER DEFAULT 0 CHECK (helper_used >= 0),
  completed BOOLEAN DEFAULT TRUE,
  completed_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes for leaderboard queries
CREATE INDEX IF NOT EXISTS idx_game_sessions_user_id ON public.game_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_game_sessions_difficulty ON public.game_sessions(difficulty);
CREATE INDEX IF NOT EXISTS idx_game_sessions_completed ON public.game_sessions(completed);
CREATE INDEX IF NOT EXISTS idx_game_sessions_time ON public.game_sessions(time_seconds) WHERE completed = TRUE;

-- ============================================
-- USER STATS TABLE
-- ============================================
-- Aggregated stats per user for quick access

CREATE TABLE IF NOT EXISTS public.user_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  total_games INTEGER DEFAULT 0,
  total_wins INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  best_streak INTEGER DEFAULT 0,
  total_xp INTEGER DEFAULT 0,
  best_time_easy INTEGER, -- in seconds, NULL if never completed
  best_time_medium INTEGER,
  best_time_hard INTEGER,
  avg_time_easy FLOAT,
  avg_time_medium FLOAT,
  avg_time_hard FLOAT,
  total_mistakes INTEGER DEFAULT 0,
  total_hints INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_user_stats_user_id ON public.user_stats(user_id);

-- ============================================
-- ACHIEVEMENTS TABLE
-- ============================================
-- Tracks unlocked achievements per user

CREATE TABLE IF NOT EXISTS public.achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  achievement_id TEXT NOT NULL,
  unlocked_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, achievement_id)
);

CREATE INDEX IF NOT EXISTS idx_achievements_user_id ON public.achievements(user_id);

-- ============================================
-- LEADERBOARD VIEWS
-- ============================================
-- Views for easy querying of leaderboards by difficulty

CREATE OR REPLACE VIEW public.leaderboard_easy AS
SELECT
  u.id AS user_id,
  u.nickname,
  u.country,
  us.best_time_easy AS best_time,
  ROW_NUMBER() OVER (ORDER BY us.best_time_easy ASC NULLS LAST) AS rank
FROM public.users u
JOIN public.user_stats us ON u.id = us.user_id
WHERE us.best_time_easy IS NOT NULL
ORDER BY us.best_time_easy ASC;

CREATE OR REPLACE VIEW public.leaderboard_medium AS
SELECT
  u.id AS user_id,
  u.nickname,
  u.country,
  us.best_time_medium AS best_time,
  ROW_NUMBER() OVER (ORDER BY us.best_time_medium ASC NULLS LAST) AS rank
FROM public.users u
JOIN public.user_stats us ON u.id = us.user_id
WHERE us.best_time_medium IS NOT NULL
ORDER BY us.best_time_medium ASC;

CREATE OR REPLACE VIEW public.leaderboard_hard AS
SELECT
  u.id AS user_id,
  u.nickname,
  u.country,
  us.best_time_hard AS best_time,
  ROW_NUMBER() OVER (ORDER BY us.best_time_hard ASC NULLS LAST) AS rank
FROM public.users u
JOIN public.user_stats us ON u.id = us.user_id
WHERE us.best_time_hard IS NOT NULL
ORDER BY us.best_time_hard ASC;

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to get user's rank for a specific difficulty
CREATE OR REPLACE FUNCTION public.get_user_rank(p_user_id UUID, p_difficulty TEXT)
RETURNS INTEGER AS $$
DECLARE
  user_rank INTEGER;
BEGIN
  IF p_difficulty = 'easy' THEN
    SELECT rank INTO user_rank FROM public.leaderboard_easy WHERE user_id = p_user_id;
  ELSIF p_difficulty = 'medium' THEN
    SELECT rank INTO user_rank FROM public.leaderboard_medium WHERE user_id = p_user_id;
  ELSIF p_difficulty = 'hard' THEN
    SELECT rank INTO user_rank FROM public.leaderboard_hard WHERE user_id = p_user_id;
  END IF;
  RETURN COALESCE(user_rank, 0);
END;
$$ LANGUAGE plpgsql;

-- Function to update user stats after game completion
CREATE OR REPLACE FUNCTION public.update_user_stats_on_game()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert or update user stats
  INSERT INTO public.user_stats (user_id, total_games, total_wins, total_mistakes, total_hints)
  VALUES (NEW.user_id, 1, CASE WHEN NEW.completed THEN 1 ELSE 0 END, NEW.mistakes, NEW.helper_used)
  ON CONFLICT (user_id) DO UPDATE SET
    total_games = user_stats.total_games + 1,
    total_wins = user_stats.total_wins + CASE WHEN NEW.completed THEN 1 ELSE 0 END,
    total_mistakes = user_stats.total_mistakes + NEW.mistakes,
    total_hints = user_stats.total_hints + NEW.helper_used,
    -- Update best times
    best_time_easy = CASE
      WHEN NEW.difficulty = 'easy' AND NEW.completed AND (user_stats.best_time_easy IS NULL OR NEW.time_seconds < user_stats.best_time_easy)
      THEN NEW.time_seconds
      ELSE user_stats.best_time_easy
    END,
    best_time_medium = CASE
      WHEN NEW.difficulty = 'medium' AND NEW.completed AND (user_stats.best_time_medium IS NULL OR NEW.time_seconds < user_stats.best_time_medium)
      THEN NEW.time_seconds
      ELSE user_stats.best_time_medium
    END,
    best_time_hard = CASE
      WHEN NEW.difficulty = 'hard' AND NEW.completed AND (user_stats.best_time_hard IS NULL OR NEW.time_seconds < user_stats.best_time_hard)
      THEN NEW.time_seconds
      ELSE user_stats.best_time_hard
    END,
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update stats on new game session
DROP TRIGGER IF EXISTS trigger_update_stats ON public.game_sessions;
CREATE TRIGGER trigger_update_stats
  AFTER INSERT ON public.game_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_stats_on_game();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS trigger_users_updated_at ON public.users;
CREATE TRIGGER trigger_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;

-- Policies: Allow all operations with anon key (we use internal_id for auth)
-- In production, you may want to use Supabase Auth or custom JWTs

CREATE POLICY "Allow public read on users" ON public.users
  FOR SELECT USING (true);

CREATE POLICY "Allow insert on users" ON public.users
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow update own user" ON public.users
  FOR UPDATE USING (true);

CREATE POLICY "Allow read on game_sessions" ON public.game_sessions
  FOR SELECT USING (true);

CREATE POLICY "Allow insert on game_sessions" ON public.game_sessions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow read on user_stats" ON public.user_stats
  FOR SELECT USING (true);

CREATE POLICY "Allow insert/update on user_stats" ON public.user_stats
  FOR ALL USING (true);

CREATE POLICY "Allow read on achievements" ON public.achievements
  FOR SELECT USING (true);

CREATE POLICY "Allow insert on achievements" ON public.achievements
  FOR INSERT WITH CHECK (true);

-- ============================================
-- ACHIEVEMENT DEFINITIONS (Reference)
-- ============================================
-- These are the achievement IDs used in the app:
--
-- first_puzzle      - Complete your first puzzle
-- speed_demon       - Complete easy in under 3 minutes
-- perfectionist     - Complete a puzzle with no mistakes
-- no_hints          - Complete a puzzle without hints
-- streak_7          - 7 day streak
-- streak_30         - 30 day streak
-- games_10          - Complete 10 puzzles
-- games_50          - Complete 50 puzzles
-- games_100         - Complete 100 puzzles
-- master_easy       - Complete 10 easy puzzles
-- master_medium     - Complete 10 medium puzzles
-- master_hard       - Complete 10 hard puzzles
-- chapter_complete  - Complete a chapter

-- ============================================
-- CHAPTER COMPLETIONS TABLE
-- ============================================
-- Stores completed chapter puzzles with full puzzle data for replay

CREATE TABLE IF NOT EXISTS public.chapter_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  puzzle_number INTEGER NOT NULL CHECK (puzzle_number >= 1),
  difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard', 'extreme', 'insane', 'inhuman')),
  puzzle_grid TEXT NOT NULL, -- JSON string of 2D array representing the initial puzzle
  solution_grid TEXT NOT NULL, -- JSON string of 2D array representing the solution
  time_seconds INTEGER NOT NULL CHECK (time_seconds >= 0),
  mistakes INTEGER DEFAULT 0 CHECK (mistakes >= 0),
  helper_used INTEGER DEFAULT 0 CHECK (helper_used >= 0),
  completed_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, puzzle_number) -- One completion per puzzle per user
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_chapter_completions_user_id ON public.chapter_completions(user_id);
CREATE INDEX IF NOT EXISTS idx_chapter_completions_puzzle_number ON public.chapter_completions(puzzle_number);
CREATE INDEX IF NOT EXISTS idx_chapter_completions_user_puzzle ON public.chapter_completions(user_id, puzzle_number);

-- Enable RLS
ALTER TABLE public.chapter_completions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Allow read on chapter_completions" ON public.chapter_completions
  FOR SELECT USING (true);

CREATE POLICY "Allow insert on chapter_completions" ON public.chapter_completions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow update on chapter_completions" ON public.chapter_completions
  FOR UPDATE USING (true);

-- ============================================
-- DAILY CHALLENGES TABLE
-- ============================================
-- Stores daily challenge puzzles (one per day, shared by all users)

CREATE TABLE IF NOT EXISTS public.daily_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_date DATE NOT NULL UNIQUE,
  grid_type TEXT NOT NULL DEFAULT '9x9' CHECK (grid_type IN ('6x6', '9x9')),
  difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard', 'extreme', 'insane', 'inhuman')),
  puzzle_grid JSONB NOT NULL,
  solution_grid JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index for fast date lookups
CREATE INDEX IF NOT EXISTS idx_daily_challenges_date ON public.daily_challenges(challenge_date);

-- Enable RLS
ALTER TABLE public.daily_challenges ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Allow public read on daily_challenges" ON public.daily_challenges
  FOR SELECT USING (true);

CREATE POLICY "Allow insert on daily_challenges" ON public.daily_challenges
  FOR INSERT WITH CHECK (true);

-- ============================================
-- DAILY COMPLETIONS TABLE
-- ============================================
-- Stores user completions of daily challenges

CREATE TABLE IF NOT EXISTS public.daily_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  challenge_id UUID REFERENCES public.daily_challenges(id) ON DELETE CASCADE NOT NULL,
  challenge_date DATE NOT NULL,
  time_seconds INTEGER NOT NULL CHECK (time_seconds >= 0),
  mistakes INTEGER DEFAULT 0 CHECK (mistakes >= 0),
  helper_used INTEGER DEFAULT 0 CHECK (helper_used >= 0),
  completed_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, challenge_date) -- One completion per day per user
);

-- Indexes for leaderboard and user queries
CREATE INDEX IF NOT EXISTS idx_daily_completions_user_id ON public.daily_completions(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_completions_challenge_date ON public.daily_completions(challenge_date);
CREATE INDEX IF NOT EXISTS idx_daily_completions_time ON public.daily_completions(time_seconds);

-- Enable RLS
ALTER TABLE public.daily_completions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Allow public read on daily_completions" ON public.daily_completions
  FOR SELECT USING (true);

CREATE POLICY "Allow insert on daily_completions" ON public.daily_completions
  FOR INSERT WITH CHECK (true);
