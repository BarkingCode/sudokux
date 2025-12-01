# Database Schema (Supabase)

## Core Tables

### Users

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  internal_id TEXT UNIQUE NOT NULL,
  game_center_id TEXT,
  nickname TEXT NOT NULL,
  country TEXT,
  region TEXT,
  notification_enabled BOOLEAN DEFAULT true,
  notification_time TIME DEFAULT '09:00',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### User Stats

Aggregated statistics from all game sources.

```sql
CREATE TABLE user_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  total_games INTEGER DEFAULT 0,
  total_wins INTEGER DEFAULT 0,
  total_points INTEGER DEFAULT 0,
  total_mistakes INTEGER DEFAULT 0,
  total_hints INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  best_streak INTEGER DEFAULT 0,
  daily_streak INTEGER DEFAULT 0,
  best_daily_streak INTEGER DEFAULT 0,
  last_daily_completed DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Game Sessions (Free Run)

```sql
CREATE TABLE game_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  puzzle_id TEXT,
  difficulty TEXT NOT NULL,
  time_seconds INTEGER,
  mistakes INTEGER DEFAULT 0,
  hints_used INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Chapter Completions

```sql
CREATE TABLE chapter_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  puzzle_number INTEGER NOT NULL,
  difficulty TEXT NOT NULL,
  puzzle_grid JSONB NOT NULL,
  solution_grid JSONB NOT NULL,
  time_seconds INTEGER NOT NULL,
  mistakes INTEGER DEFAULT 0,
  hints_used INTEGER DEFAULT 0,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, puzzle_number)
);
```

### Daily Challenges

```sql
CREATE TABLE daily_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_date DATE UNIQUE NOT NULL,
  grid_type TEXT NOT NULL DEFAULT '9x9',
  difficulty TEXT NOT NULL,
  puzzle_grid JSONB NOT NULL,
  solution_grid JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_daily_challenges_date ON daily_challenges(challenge_date);
```

### Daily Completions

```sql
CREATE TABLE daily_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  challenge_id UUID REFERENCES daily_challenges(id),
  challenge_date DATE NOT NULL,
  time_seconds INTEGER NOT NULL,
  mistakes INTEGER DEFAULT 0,
  hints_used INTEGER DEFAULT 0,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, challenge_date)
);

CREATE INDEX idx_daily_completions_challenge_id ON daily_completions(challenge_id);
CREATE INDEX idx_daily_completions_challenge_time ON daily_completions(challenge_id, time_seconds);
```

### Achievements

```sql
CREATE TABLE achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  achievement_id TEXT NOT NULL,
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);
```

## Views

### Points Leaderboard (Global)

```sql
CREATE VIEW points_leaderboard AS
SELECT
  u.id as user_id,
  u.nickname,
  u.country,
  us.total_points,
  ROW_NUMBER() OVER (ORDER BY us.total_points DESC) as rank
FROM users u
JOIN user_stats us ON us.user_id = u.id
WHERE us.total_points > 0
ORDER BY us.total_points DESC;
```

### Points Leaderboard (By Country)

```sql
CREATE VIEW points_leaderboard_by_country AS
SELECT
  u.id as user_id,
  u.nickname,
  u.country,
  us.total_points,
  ROW_NUMBER() OVER (PARTITION BY u.country ORDER BY us.total_points DESC) as rank
FROM users u
JOIN user_stats us ON us.user_id = u.id
WHERE us.total_points > 0
ORDER BY u.country, us.total_points DESC;
```

## Functions

### Calculate User Points

Calculates total points with deductions for mistakes and hints.

```sql
CREATE OR REPLACE FUNCTION calculate_user_points(p_user_id uuid)
RETURNS INTEGER
LANGUAGE sql
STABLE
AS $$
  -- Base points: easy=10, medium=25, hard=50, extreme=100, insane=200, inhuman=500
  -- Deductions: easy=-1, medium=-2, hard=-3, extreme=-4, insane=-5, inhuman=-6
  -- Per mistake and per hint used
  -- Minimum 0 points per game

  SELECT GREATEST(0, COALESCE(
    (points from game_sessions) +
    (points from chapter_completions) +
    (points from daily_completions),
    0
  ))::INTEGER;
$$;
```

### Recalculate User Stats

Aggregates stats from all three game sources.

```sql
CREATE OR REPLACE FUNCTION recalculate_user_stats(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_total_games INTEGER;
  v_total_wins INTEGER;
  v_total_mistakes INTEGER;
  v_total_hints INTEGER;
  v_total_points INTEGER;
BEGIN
  -- Count from game_sessions
  SELECT COUNT(*), COUNT(*) FILTER (WHERE completed),
         COALESCE(SUM(mistakes), 0), COALESCE(SUM(hints_used), 0)
  INTO v_total_games, v_total_wins, v_total_mistakes, v_total_hints
  FROM game_sessions WHERE user_id = p_user_id;

  -- Add chapter_completions
  SELECT v_total_games + COUNT(*), v_total_wins + COUNT(*),
         v_total_mistakes + COALESCE(SUM(mistakes), 0),
         v_total_hints + COALESCE(SUM(hints_used), 0)
  INTO v_total_games, v_total_wins, v_total_mistakes, v_total_hints
  FROM chapter_completions WHERE user_id = p_user_id;

  -- Add daily_completions
  SELECT v_total_games + COUNT(*), v_total_wins + COUNT(*),
         v_total_mistakes + COALESCE(SUM(mistakes), 0),
         v_total_hints + COALESCE(SUM(hints_used), 0)
  INTO v_total_games, v_total_wins, v_total_mistakes, v_total_hints
  FROM daily_completions WHERE user_id = p_user_id;

  -- Calculate points
  v_total_points := calculate_user_points(p_user_id);

  -- Update user_stats
  INSERT INTO user_stats (user_id, total_games, total_wins, total_mistakes, total_hints, total_points)
  VALUES (p_user_id, v_total_games, v_total_wins, v_total_mistakes, v_total_hints, v_total_points)
  ON CONFLICT (user_id) DO UPDATE SET
    total_games = EXCLUDED.total_games,
    total_wins = EXCLUDED.total_wins,
    total_mistakes = EXCLUDED.total_mistakes,
    total_hints = EXCLUDED.total_hints,
    total_points = EXCLUDED.total_points,
    updated_at = NOW();
END;
$$;
```

## Triggers

### Auto-update Stats on Completion

A single trigger function handles stats recalculation for all game completion tables. This ensures `user_stats` always reflects accurate counts from `game_sessions`, `chapter_completions`, and `daily_completions`.

**Important:** Only ONE trigger per table should update stats to avoid double-counting issues.

```sql
-- Trigger function (calls recalculate_user_stats which aggregates from all sources)
CREATE OR REPLACE FUNCTION update_user_points_on_completion()
RETURNS TRIGGER AS $$
BEGIN
  -- Recalculate all user stats (includes points)
  PERFORM public.recalculate_user_stats(NEW.user_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- game_sessions trigger
CREATE TRIGGER trigger_update_points
AFTER INSERT ON game_sessions
FOR EACH ROW EXECUTE FUNCTION update_user_points_on_completion();

-- chapter_completions trigger
CREATE TRIGGER trigger_update_points_chapter
AFTER INSERT ON chapter_completions
FOR EACH ROW EXECUTE FUNCTION update_user_points_on_completion();

-- daily_completions trigger
CREATE TRIGGER trigger_update_points_daily
AFTER INSERT ON daily_completions
FOR EACH ROW EXECUTE FUNCTION update_user_points_on_completion();
```

### Stats Calculation Strategy

The `recalculate_user_stats()` function counts records from all three tables:
- `game_sessions` - Free run games
- `chapter_completions` - Chapter mode games
- `daily_completions` - Daily challenge games

This approach ensures data integrity by always deriving `total_games` from actual records rather than incremental updates.

## Row Level Security (RLS)

```sql
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chapter_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;

-- Users can read/write their own data
CREATE POLICY "Users can manage own data" ON users
  FOR ALL USING (true);  -- Simplified for anonymous access

-- Similar policies for other tables...
```

## Indexes

```sql
-- User lookups
CREATE INDEX idx_users_internal_id ON users(internal_id);
CREATE INDEX idx_users_game_center_id ON users(game_center_id);

-- Stats queries
CREATE INDEX idx_user_stats_points ON user_stats(total_points DESC);

-- Game history queries
CREATE INDEX idx_game_sessions_user_completed ON game_sessions(user_id, completed_at DESC);
CREATE INDEX idx_chapter_completions_user ON chapter_completions(user_id, completed_at DESC);
CREATE INDEX idx_daily_completions_user ON daily_completions(user_id, completed_at DESC);

-- Achievement queries
CREATE INDEX idx_achievements_user ON achievements(user_id);
```
