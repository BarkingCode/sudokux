# Stats & Analytics

## Overview

Stats are tracked from three game sources:
- **game_sessions** - Free Run mode completions
- **chapter_completions** - Chapters/Journey mode completions
- **daily_completions** - Daily Challenge completions

All sources contribute to unified user statistics and points.

## User Stats (Aggregated)

Tracked in `user_stats` table:
- `total_games` - Total completed games across all modes
- `total_wins` - Total successful completions
- `total_points` - Points calculated with deductions
- `total_mistakes` - Cumulative mistakes
- `total_hints` - Cumulative hints used
- `current_streak` - Current daily play streak
- `best_streak` - Best daily play streak
- `daily_streak` - Daily challenge specific streak
- `best_daily_streak` - Best daily challenge streak

## Points System

### Base Points by Difficulty

| Difficulty | Base Points |
|------------|-------------|
| Easy       | 10          |
| Medium     | 25          |
| Hard       | 50          |
| Extreme    | 100         |
| Insane     | 200         |
| Inhuman    | 500         |

### Deductions

Points are deducted for mistakes and hints used. The deduction multiplier increases with difficulty:

| Difficulty | Deduction per Mistake/Hint |
|------------|---------------------------|
| Easy       | -1                        |
| Medium     | -2                        |
| Hard       | -3                        |
| Extreme    | -4                        |
| Insane     | -5                        |
| Inhuman    | -6                        |

### Formula

```
points_per_game = MAX(0, base_points - (mistakes + hints_used) * deduction_multiplier)
total_points = SUM(points_per_game) across all completed games
```

### Examples

- Easy puzzle, 0 mistakes, 0 hints: 10 - 0 = **10 points**
- Easy puzzle, 5 mistakes, 2 hints: 10 - (7 * 1) = **3 points**
- Hard puzzle, 0 mistakes, 0 hints: 50 - 0 = **50 points**
- Hard puzzle, 10 mistakes, 5 hints: 50 - (15 * 3) = **0 points** (minimum)
- Inhuman puzzle, 0 mistakes, 0 hints: 500 - 0 = **500 points**
- Inhuman puzzle, 2 mistakes, 1 hint: 500 - (3 * 6) = **482 points**

## Analytics Data

### Heatmap Calendar
- Shows play activity over last 4 months
- Aggregates games by day from all sources
- Intensity based on games completed per day

### Weekly Activity Chart
- Shows games completed per day of current week
- Bar chart with day labels (Mon-Sun)

### Solve Time Trends
- Tracks improvement over time
- Groups games by difficulty
- Shows average time trends

### Recent Games
- Last 10 completed games
- Shows difficulty, time, mistakes
- Pulled from all three sources

## Local Stats (AsyncStorage)

For offline-first capability:
- Current game state (grid, timer, mistakes, notes)
- Chapter progress (current puzzle, completed list)
- Free Run in-progress game
- Settings and preferences

## Cloud Sync

Stats automatically sync to Supabase:
- On game completion (triggers update user_stats)
- On app foreground (sync offline queue)
- Achievements synced to both Supabase and Game Center

## Service Architecture

### Key Services

| Service | Purpose |
|---------|---------|
| `statisticsService.ts` | User stats fetching, streak management, difficulty win counts |
| `gameSessionService.ts` | Recording game sessions, fetching game history from all sources |
| `gameAnalyticsService.ts` | Heatmap data (4 months), weekly chart data aggregation |
| `pointService.ts` | Points calculation, leaderboard queries |
| `achievementService.ts` | Achievement checking, unlocking, offline queue sync |

### statisticsService.ts

```typescript
// Get user stats (with caching)
getUserStats(userId: string, forceRefresh?: boolean): Promise<UserStats | null>

// Get difficulty-specific win counts from all sources
getDifficultyWins(userId: string): Promise<Record<string, number>>

// Update streak
updateStreak(userId: string, playedToday: boolean): Promise<void>

// Clear cached stats
clearStatsCache(): void
```

### gameSessionService.ts

```typescript
// Record a completed Free Run game
recordGameSession(userId: string, result: GameResult): Promise<GameSession | null>

// Get recent game history (aggregates all 3 sources)
getGameHistory(userId: string, limit?: number): Promise<GameSession[]>
```

### gameAnalyticsService.ts

```typescript
// Get games for heatmap (last 4 months, all sources)
getHeatmapGames(userId: string): Promise<GameSession[]>

// Get games for weekly chart (current week, all sources)
getWeeklyGames(userId: string): Promise<GameSession[]>
```

## Data Aggregation

All analytics aggregate from three game sources:
1. `game_sessions` - Free Run completions
2. `chapter_completions` - Chapter/Journey completions
3. `daily_completions` - Daily Challenge completions

Games are unified into a common format with:
- `puzzle_id` prefixed: `chapter-{n}`, `daily-{id}`, or raw puzzle ID
- `difficulty` fetched from related tables for daily challenges
- Sorted by `completed_at` descending
