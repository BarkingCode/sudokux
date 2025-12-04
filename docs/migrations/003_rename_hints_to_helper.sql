-- Migration: Rename hints_used to helper_used
-- The "helper" feature is a one-time unlock per game (binary: 0 or 1)
-- This renames the column to better reflect its purpose
--
-- Run this in your Supabase SQL Editor

-- ============================================
-- RENAME COLUMNS
-- ============================================

-- Rename in game_sessions
ALTER TABLE game_sessions RENAME COLUMN hints_used TO helper_used;

-- Rename in chapter_completions
ALTER TABLE chapter_completions RENAME COLUMN hints_used TO helper_used;

-- Rename in daily_completions
ALTER TABLE daily_completions RENAME COLUMN hints_used TO helper_used;

-- ============================================
-- UPDATE calculate_user_points FUNCTION
-- ============================================
-- Now uses helper_used instead of hints_used

CREATE OR REPLACE FUNCTION calculate_user_points(p_user_id uuid)
RETURNS INTEGER
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(
    (
      -- Points from game_sessions (Free Run)
      SELECT COALESCE(SUM(
        GREATEST(0,
          -- Base points
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
          -- Mistake penalty (same for both grid types)
          - COALESCE(mistakes, 0) * CASE difficulty
              WHEN 'easy' THEN 1
              WHEN 'medium' THEN 2
              WHEN 'hard' THEN 3
              WHEN 'extreme' THEN 4
              WHEN 'insane' THEN 5
              WHEN 'inhuman' THEN 6
              ELSE 0
            END
          -- Helper penalty (different for 6x6 vs 9x9)
          - COALESCE(helper_used, 0) * CASE
              WHEN grid_type = '6x6' THEN
                CASE difficulty
                  WHEN 'easy' THEN 1
                  WHEN 'medium' THEN 2
                  WHEN 'hard' THEN 5
                  WHEN 'extreme' THEN 8
                  WHEN 'insane' THEN 12
                  WHEN 'inhuman' THEN 25
                  ELSE 0
                END
              ELSE -- 9x9
                CASE difficulty
                  WHEN 'easy' THEN 1
                  WHEN 'medium' THEN 5
                  WHEN 'hard' THEN 10
                  WHEN 'extreme' THEN 15
                  WHEN 'insane' THEN 25
                  WHEN 'inhuman' THEN 50
                  ELSE 0
                END
            END
        )
      ), 0)
      FROM game_sessions
      WHERE user_id = p_user_id AND completed = true
    )
    +
    (
      -- Points from chapter_completions
      SELECT COALESCE(SUM(
        GREATEST(0,
          -- Base points
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
          -- Mistake penalty
          - COALESCE(mistakes, 0) * CASE difficulty
              WHEN 'easy' THEN 1
              WHEN 'medium' THEN 2
              WHEN 'hard' THEN 3
              WHEN 'extreme' THEN 4
              WHEN 'insane' THEN 5
              WHEN 'inhuman' THEN 6
              ELSE 0
            END
          -- Helper penalty
          - COALESCE(helper_used, 0) * CASE
              WHEN grid_type = '6x6' THEN
                CASE difficulty
                  WHEN 'easy' THEN 1
                  WHEN 'medium' THEN 2
                  WHEN 'hard' THEN 5
                  WHEN 'extreme' THEN 8
                  WHEN 'insane' THEN 12
                  WHEN 'inhuman' THEN 25
                  ELSE 0
                END
              ELSE -- 9x9
                CASE difficulty
                  WHEN 'easy' THEN 1
                  WHEN 'medium' THEN 5
                  WHEN 'hard' THEN 10
                  WHEN 'extreme' THEN 15
                  WHEN 'insane' THEN 25
                  WHEN 'inhuman' THEN 50
                  ELSE 0
                END
            END
        )
      ), 0)
      FROM chapter_completions
      WHERE user_id = p_user_id
    )
    +
    (
      -- Points from daily_completions (join with daily_challenges to get difficulty)
      SELECT COALESCE(SUM(
        GREATEST(0,
          -- Base points
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
          -- Mistake penalty
          - COALESCE(dcomp.mistakes, 0) * CASE dc.difficulty
              WHEN 'easy' THEN 1
              WHEN 'medium' THEN 2
              WHEN 'hard' THEN 3
              WHEN 'extreme' THEN 4
              WHEN 'insane' THEN 5
              WHEN 'inhuman' THEN 6
              ELSE 0
            END
          -- Helper penalty
          - COALESCE(dcomp.helper_used, 0) * CASE
              WHEN dc.grid_type = '6x6' THEN
                CASE dc.difficulty
                  WHEN 'easy' THEN 1
                  WHEN 'medium' THEN 2
                  WHEN 'hard' THEN 5
                  WHEN 'extreme' THEN 8
                  WHEN 'insane' THEN 12
                  WHEN 'inhuman' THEN 25
                  ELSE 0
                END
              ELSE -- 9x9
                CASE dc.difficulty
                  WHEN 'easy' THEN 1
                  WHEN 'medium' THEN 5
                  WHEN 'hard' THEN 10
                  WHEN 'extreme' THEN 15
                  WHEN 'insane' THEN 25
                  WHEN 'inhuman' THEN 50
                  ELSE 0
                END
            END
        )
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
-- Recalculate points for all users after column rename

UPDATE user_stats us
SET total_points = calculate_user_points(us.user_id),
    updated_at = NOW();
