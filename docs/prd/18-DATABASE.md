# Database Schema (Supabase)

## Core Tables:

```sql
-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY,
  internal_id TEXT UNIQUE NOT NULL,
  game_center_id TEXT,
  nickname TEXT NOT NULL,
  country TEXT,
  region TEXT,
  notification_enabled BOOLEAN DEFAULT true,
  notification_time TIME DEFAULT '09:00',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Daily Challenges
CREATE TABLE daily_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_date DATE UNIQUE NOT NULL,
  grid_type TEXT NOT NULL DEFAULT '9x9',
  difficulty TEXT NOT NULL,
  puzzle_grid JSONB NOT NULL,
  solution_grid JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Daily Challenge Completions
-- Note: challenge_date uses user's LOCAL date for streak tracking
-- Leaderboards query by challenge_id for global competition
CREATE TABLE daily_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  challenge_id UUID REFERENCES daily_challenges(id),
  challenge_date DATE NOT NULL,  -- User's local date (for streak tracking)
  time_seconds INTEGER NOT NULL,
  mistakes INTEGER DEFAULT 0,
  hints_used INTEGER DEFAULT 0,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, challenge_date)
);

-- Index for leaderboard queries (group by puzzle)
CREATE INDEX idx_daily_completions_challenge_id ON daily_completions(challenge_id);
CREATE INDEX idx_daily_completions_challenge_time ON daily_completions(challenge_id, time_seconds);

-- Game Sessions
CREATE TABLE game_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  grid_type TEXT NOT NULL,
  difficulty TEXT NOT NULL,
  time_seconds INTEGER,
  mistakes INTEGER DEFAULT 0,
  hints_used INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```
