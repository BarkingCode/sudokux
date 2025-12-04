-- Migration: Update point calculation to differentiate 6x6 and 9x9 grid types
-- 6x6 games now give half the points of 9x9 games
--
-- Run this in your Supabase SQL Editor

-- ============================================
-- ADD grid_type COLUMN TO chapter_completions
-- ============================================
-- Must run FIRST before the function uses the column

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'chapter_completions' AND column_name = 'grid_type'
  ) THEN
    -- Add the grid_type column
    ALTER TABLE chapter_completions
    ADD COLUMN grid_type TEXT DEFAULT '9x9' CHECK (grid_type IN ('6x6', '9x9'));

    -- Update the unique constraint to include grid_type
    -- This allows separate progress tracking for 6x6 and 9x9
    ALTER TABLE chapter_completions
    DROP CONSTRAINT IF EXISTS chapter_completions_user_id_puzzle_number_key;

    ALTER TABLE chapter_completions
    ADD CONSTRAINT chapter_completions_user_id_puzzle_number_grid_type_key
    UNIQUE (user_id, puzzle_number, grid_type);
  END IF;
END $$;

-- ============================================
-- UPDATE calculate_user_points FUNCTION
-- ============================================
-- Points for 9x9: easy=10, medium=25, hard=50, extreme=100, insane=200, inhuman=500
-- Points for 6x6: easy=5,  medium=12, hard=25, extreme=50,  insane=100, inhuman=250

CREATE OR REPLACE FUNCTION calculate_user_points(p_user_id uuid)
RETURNS INTEGER
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(
    (
      -- Points from game_sessions
      SELECT COALESCE(SUM(
        CASE
          WHEN grid_type = '6x6' THEN
            CASE difficulty
              WHEN 'easy' THEN 5
              WHEN 'medium' THEN 12
              WHEN 'hard' THEN 25
              WHEN 'extreme' THEN 50
              WHEN 'insane' THEN 100
              WHEN 'inhuman' THEN 250
              ELSE 0
            END
          ELSE -- 9x9 (default)
            CASE difficulty
              WHEN 'easy' THEN 10
              WHEN 'medium' THEN 25
              WHEN 'hard' THEN 50
              WHEN 'extreme' THEN 100
              WHEN 'insane' THEN 200
              WHEN 'inhuman' THEN 500
              ELSE 0
            END
        END
      ), 0)
      FROM game_sessions
      WHERE user_id = p_user_id AND completed = true
    )
    +
    (
      -- Points from chapter_completions
      SELECT COALESCE(SUM(
        CASE
          WHEN grid_type = '6x6' THEN
            CASE difficulty
              WHEN 'easy' THEN 5
              WHEN 'medium' THEN 12
              WHEN 'hard' THEN 25
              WHEN 'extreme' THEN 50
              WHEN 'insane' THEN 100
              WHEN 'inhuman' THEN 250
              ELSE 0
            END
          ELSE -- 9x9 (default)
            CASE difficulty
              WHEN 'easy' THEN 10
              WHEN 'medium' THEN 25
              WHEN 'hard' THEN 50
              WHEN 'extreme' THEN 100
              WHEN 'insane' THEN 200
              WHEN 'inhuman' THEN 500
              ELSE 0
            END
        END
      ), 0)
      FROM chapter_completions
      WHERE user_id = p_user_id
    )
    +
    (
      -- Points from daily_completions (join with daily_challenges to get difficulty)
      SELECT COALESCE(SUM(
        CASE
          WHEN dc.grid_type = '6x6' THEN
            CASE dc.difficulty
              WHEN 'easy' THEN 5
              WHEN 'medium' THEN 12
              WHEN 'hard' THEN 25
              WHEN 'extreme' THEN 50
              WHEN 'insane' THEN 100
              WHEN 'inhuman' THEN 250
              ELSE 0
            END
          ELSE -- 9x9 (default)
            CASE dc.difficulty
              WHEN 'easy' THEN 10
              WHEN 'medium' THEN 25
              WHEN 'hard' THEN 50
              WHEN 'extreme' THEN 100
              WHEN 'insane' THEN 200
              WHEN 'inhuman' THEN 500
              ELSE 0
            END
        END
      ), 0)
      FROM daily_completions dcomp
      JOIN daily_challenges dc ON dc.id = dcomp.challenge_id
      WHERE dcomp.user_id = p_user_id
    ),
    0
  )::INTEGER;
$$;

-- ============================================
-- REFRESH USER POINTS
-- ============================================
-- Recalculate points for all users after migration

UPDATE user_stats us
SET total_points = calculate_user_points(us.user_id),
    updated_at = NOW();
