-- Migration: Add penalty deductions to point calculation
-- Mistakes and helper usage now deduct points from the base game points
--
-- Run this in your Supabase SQL Editor

-- ============================================
-- UPDATE calculate_user_points FUNCTION
-- ============================================
-- Now deducts:
--   - Mistake penalties: easy=-1, medium=-2, hard=-3, extreme=-4, insane=-5, inhuman=-6
--   - Helper penalties (9x9): easy=-1, medium=-5, hard=-10, extreme=-15, insane=-25, inhuman=-50
--   - Helper penalties (6x6): easy=-1, medium=-2, hard=-5, extreme=-8, insane=-12, inhuman=-25
-- Per-game points are floored at 0 (can't go negative per game)

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
          - COALESCE(hints_used, 0) * CASE
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
          - COALESCE(hints_used, 0) * CASE
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
          - COALESCE(dcomp.hints_used, 0) * CASE
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
-- Recalculate points for all users with new penalty deductions

UPDATE user_stats us
SET total_points = calculate_user_points(us.user_id),
    updated_at = NOW();
