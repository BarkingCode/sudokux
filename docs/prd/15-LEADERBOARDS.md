# Leaderboards & Achievements

## Points Leaderboard (Global)

The primary competitive ranking based on total points accumulated.

### Leaderboard Views

1. **Global Leaderboard** (`points_leaderboard` view)
   - All players ranked by total_points
   - Shows: rank, nickname, country, points

2. **Country Leaderboard** (`points_leaderboard_by_country` view)
   - Players filtered by country
   - Same ranking within country

### Profile Integration

The Board/Profile screen shows:
- Top 5 global leaderboard entries
- User's own rank and points
- "View All" links to full leaderboard screen

### Full Leaderboard Screen

- Tab switching: Global / Country
- Top 100 players displayed
- User's rank card at top if not in top 100
- Pull-to-refresh

## Daily Challenge Leaderboard

Separate leaderboard per day's puzzle:
- Ranked by completion time (fastest wins)
- Tiebreaker: fewer mistakes
- Shows top 20 completions
- User's rank among all completers

## Game Center Leaderboards (iOS)

Best time leaderboards per difficulty:
- Easy Best Time
- Medium Best Time
- Hard Best Time
- Extreme Best Time
- Insane Best Time
- Inhuman Best Time

Validation: Reject impossible times (< 30 seconds for 9x9).

## Achievements

### Achievement System

Achievements are checked after every game completion:
- Stored in Supabase `achievements` table
- Synced to Game Center on iOS
- Toast notification on unlock
- Offline queue for failed syncs

### Achievement List

| ID | Name | Description | Category |
|----|------|-------------|----------|
| `first_puzzle` | First Steps | Complete your first puzzle | Milestone |
| `games_10` | Getting Started | Complete 10 puzzles | Milestone |
| `games_50` | Dedicated Player | Complete 50 puzzles | Milestone |
| `games_100` | Centurion | Complete 100 puzzles | Milestone |
| `speed_demon` | Speed Demon | Complete an Easy puzzle in under 3 minutes | Skill |
| `perfectionist` | Perfectionist | Complete a puzzle with no mistakes | Skill |
| `no_hints` | Self Reliant | Complete a puzzle without using any hints | Skill |
| `streak_7` | Week Warrior | Maintain a 7-day play streak | Streak |
| `streak_30` | Monthly Master | Maintain a 30-day play streak | Streak |
| `master_easy` | Easy Master | Complete 20 Easy puzzles | Mastery |
| `master_medium` | Medium Master | Complete 20 Medium puzzles | Mastery |
| `master_hard` | Hard Master | Complete 20 Hard puzzles | Mastery |
| `chapter_complete` | Chapter Champion | Complete your first chapter | Mastery |

### Achievement Unlock Conditions

Checked after each game completion:

```typescript
// Milestone achievements
first_puzzle: total_wins >= 1
games_10: total_wins >= 10
games_50: total_wins >= 50
games_100: total_wins >= 100

// Skill achievements (per-game)
speed_demon: difficulty === 'easy' && timeSeconds < 180
perfectionist: mistakes === 0
no_hints: hintsUsed === 0

// Streak achievements
streak_7: current_streak >= 7
streak_30: current_streak >= 30

// Mastery achievements
master_easy: easy_wins >= 20
master_medium: medium_wins >= 20
master_hard: hard_wins >= 20
chapter_complete: any chapter puzzle completed
```

### Profile Display

Achievements shown on Board screen:
- Horizontal scrollable list
- Badge icons with lock state
- Unlocked achievements highlighted
- "View All" to full achievements screen

### Achievement Categories

- **Milestone** - Game count achievements
- **Skill** - Single-game performance
- **Streak** - Consistency achievements
- **Mastery** - Difficulty-specific mastery

## Technical Implementation

### Key Services

| Service | File | Purpose |
|---------|------|---------|
| Points Service | `src/services/pointService.ts` | Global/country points leaderboards, user rank queries |
| Achievement Service | `src/services/achievementService.ts` | Achievement checking, unlocking, offline sync |
| Daily Leaderboard | `src/services/dailyLeaderboardService.ts` | Daily challenge rankings by time |
| Game Center | `src/services/gameCenter.ts` | iOS Game Center integration |

### pointService.ts

```typescript
// Point values per difficulty for 9×9 (exponential scaling)
const DIFFICULTY_POINTS = {
  easy: 10, medium: 25, hard: 50,
  extreme: 100, insane: 200, inhuman: 500
};

// Point values per difficulty for 6×6 (half of 9×9)
const DIFFICULTY_POINTS_6X6 = {
  easy: 5, medium: 12, hard: 25,
  extreme: 50, insane: 100, inhuman: 250
};

// Get points for a difficulty and grid type
getPointsForDifficulty(difficulty: Difficulty, gridType: GridType = '9x9'): number

// Get global points leaderboard
getGlobalLeaderboard(limit?: number, offset?: number): Promise<PointsLeaderboardEntry[]>

// Get country-specific leaderboard
getCountryLeaderboard(country: string, limit?: number, offset?: number): Promise<PointsLeaderboardEntry[]>

// Get user's rank and total players
getUserPointsRank(userId: string, country?: string): Promise<UserPointsRank>

// Get user's leaderboard entry with rank
getUserLeaderboardEntry(userId: string, country?: string): Promise<PointsLeaderboardEntry | null>
```

### dailyLeaderboardService.ts

```typescript
// Get daily challenge leaderboard (ranked by time, then mistakes)
getDailyLeaderboard(limit?: number, challengeId?: string): Promise<DailyLeaderboardEntry[]>

// Get user's rank on a specific challenge
getUserDailyRank(userId: string, challengeId?: string): Promise<number | null>

// Check if user placed in top N
checkLeaderboardPlacement(userId: string, challengeId: string, topN?: number): Promise<{ placed: boolean; rank: number | null }>
```

### achievementService.ts

```typescript
// Get user's unlocked achievements
getAchievements(userId: string): Promise<Achievement[]>

// Unlock an achievement (Supabase + Game Center + Toast)
unlockAchievement(userId: string, achievementId: AchievementId): Promise<boolean>

// Check and unlock achievements based on game result
checkAchievements(userId: string, result: GameResultForAchievements): Promise<void>

// Called when a chapter is completed
onChapterComplete(userId: string): Promise<void>

// Sync any queued offline achievements
syncOfflineQueue(userId: string): Promise<void>
```

### Database Views

```sql
-- Global points leaderboard
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

-- Country-specific leaderboard
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
