# Daily Challenge

## Overview

A **single daily puzzle** per date string (YYYY-MM-DD). Daily puzzles reset at **midnight in the user's LOCAL timezone**, providing a personalized experience while maintaining global leaderboards per puzzle.

## Timezone Behavior

* **Local Reset**: Daily puzzle resets at midnight in user's device timezone
* **Date-Based Matching**: Client queries puzzles by local date string (e.g., "2025-11-29")
* **Global Leaderboard**: Users playing the same puzzle (same challenge_id) compete together
* **Fallback Generation**: If no puzzle exists for a local date, client generates one offline

**Example:**
- User in Tokyo (UTC+9) at midnight local time sees December 1st puzzle
- User in NYC (UTC-5) at midnight local time sees December 1st puzzle
- Both compete on the December 1st leaderboard when playing that puzzle

## Database Storage

Daily puzzles stored in Supabase:

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
CREATE INDEX idx_daily_completions_challenge_id ON daily_completions(challenge_id);
```

## Puzzle Generation (Cron Job)

**Supabase Edge Function** or external cron service generates daily puzzles:

* Runs daily at **12:00 UTC** (noon) to generate **tomorrow's puzzle**
* This ensures puzzles are ready 12+ hours before earliest timezone (UTC+14) needs them
* Difficulty rotation by day of week:
  - Monday/Tuesday: Easy
  - Wednesday/Thursday: Medium
  - Friday/Saturday: Hard
  - Sunday: Extreme
* Grid type: Always 9×9 for daily challenges

**Cron Schedule:**
```
0 12 * * * - Daily at noon UTC (generates next day's puzzle)
```

**Edge Function Logic:**
1. Check if puzzle exists for tomorrow's date
2. If not, generate puzzle with uniqueness validation
3. Store in `daily_challenges` table
4. Log success/failure

**Fallback (Client-Side):**
If no server puzzle exists for the local date, the app generates one using:
- Deterministic difficulty based on day of week
- Local puzzle generator with uniqueness validation
- No leaderboard for fallback puzzles (id starts with "fallback-")

## Daily Challenge Features

* **Leaderboard:** Fastest completion times for today's puzzle
* **Streak tracking:** Consecutive days completed (based on user's local timezone)
* **One attempt:** Cannot replay same day's puzzle
* **Offline support:** Cache today's puzzle on app open

## Streak Calculation

Daily streak is calculated based on user's **local timezone**:

| Scenario | Result |
|----------|--------|
| Last completed = yesterday (local) | Increment streak |
| Last completed = today (local) | Keep current streak (no double-counting) |
| Last completed = 2+ days ago | Reset streak to 1 |
| First ever completion | Start streak at 1 |

**Implementation:**
- Uses `getLocalDateString()` for consistent local date comparison
- `getYesterdayLocalDateString()` for previous day check
- Handles edge cases like completing at 11:59pm vs 12:01am correctly
- Stored in `user_stats.daily_streak` and `user_stats.best_daily_streak`

## Push Notifications (Cron Job)

**Daily Reminder Notification:**

* Sent at user's preferred time (default: 9:00 AM local)
* "Your daily Sudoku challenge is waiting!"
* Only sent if user hasn't completed today's puzzle

**Implementation:**
* Store user notification preferences in Supabase
* Expo Push Notifications for delivery
* Cron job queries users who:
  * Have notifications enabled
  * Haven't completed today's puzzle
  * Are within their notification time window

**Notification Schedule:**
```
*/15 * * * * - Every 15 minutes, check for users to notify
```
