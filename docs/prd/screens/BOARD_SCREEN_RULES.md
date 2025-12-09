# Board Screen Rules

## Overview

Route: `app/(tabs)/board.tsx`

The Board screen displays user statistics, achievements, leaderboards, and play history. It's the central hub for tracking progress across all game modes.

---

## Layout Components

| Order | Component | Description |
|-------|-----------|-------------|
| 1 | Header | "YOUR PROGRESS" / "BOARD" |
| 2 | Achievements | Horizontal scroll with badges |
| 3 | Global Leaderboard | Top 5 preview + user rank |
| 4 | Statistics | Quick stats cards |
| 5 | Weekly Activity | Bar chart (Mon-Sun) |
| 6 | Play History | Heatmap calendar (GitHub-style) |
| 7 | Solve Time Trends | Improvement chart by difficulty |
| 8 | Recent Games | Last 10 completions |

---

## Ad Rules

### Banner Ads
| Location | Allowed |
|----------|---------|
| Board Screen | ✅ **YES** |
| Bottom of screen | ✅ **YES** |

### Interstitial Ads
- ❌ **NO** interstitial ads on Board screen

### Rewarded Ads
- ❌ **NO** rewarded ads on Board screen

### Ad-Free Subscribers
- No banner ads displayed
- Shows "Ad-Free Mode" tag (optional)

---

## Statistics Rules

### Data Sources
Stats aggregate from **three game sources**:
1. `game_sessions` - Free Run completions
2. `chapter_completions` - Chapter mode completions
3. `daily_completions` - Daily Challenge completions

### User Stats Fields
| Field | Description |
|-------|-------------|
| `total_games` | Total completed games (all modes) |
| `total_wins` | Total successful completions |
| `total_points` | Points with deductions applied |
| `total_mistakes` | Cumulative mistakes |
| `total_hints` | Cumulative hints used |
| `current_streak` | Current daily play streak |
| `best_streak` | Best daily play streak |
| `daily_streak` | Daily challenge specific streak |
| `best_daily_streak` | Best daily challenge streak |

---

## Points System

### Base Points by Difficulty

| Difficulty | 9x9 Points | 6x6 Points |
|------------|------------|------------|
| Easy | 10 | 5 |
| Medium | 25 | 12 |
| Hard | 50 | 25 |
| Extreme | 100 | 50 |
| Insane | 200 | 100 |
| Inhuman | 500 | 250 |

### Deductions per Mistake/Hint

| Difficulty | Deduction |
|------------|-----------|
| Easy | -1 |
| Medium | -2 |
| Hard | -3 |
| Extreme | -4 |
| Insane | -5 |
| Inhuman | -6 |

### Formula
```
points = MAX(0, base_points - (mistakes + hints) × deduction)
```

---

## Achievements Section

### Display
- Horizontal scroll
- Shows locked/unlocked states
- "View All" link to full achievements screen

### Visual States
| State | Display |
|-------|---------|
| Unlocked | Full color, badge icon |
| Locked | Greyed out, lock icon |

### Haptic Feedback
- Success haptic on unlock
- Heavy + Success for milestones

### Confetti Triggers
Milestone achievements trigger confetti:
- `games_10`, `games_50`, `games_100`
- `streak_7`, `streak_30`
- `chapter_complete`
- `master_easy`, `master_medium`, `master_hard`

---

## Leaderboard Section

### Display
- Top 5 preview (minimal)
- User's current rank highlighted
- "View All" link to full leaderboard

### Tabs (Full Screen)
- **Global** - Worldwide rankings
- **Country** - Country-specific rankings

### Ranking
- Sorted by `total_points` descending
- Shows username, points, rank
- Top 100 displayed

---

## Weekly Activity Chart

### Display
- Bar chart showing games per day
- Current week (Mon-Sun)
- Day labels on x-axis

### Data
- Aggregates from all three game sources
- Groups by day of week

---

## Heatmap Calendar

### Style (GitHub-like)
- 52 weeks of data
- Color intensity = games played

### Color Levels
| Games | Light Mode | Dark Mode |
|-------|------------|-----------|
| 0 | `#E0E0E0` | `#1A1A1A` |
| 1-2 | `#999999` | `#444444` |
| 3-4 | `#666666` | `#777777` |
| 5+ | `#000000` | `#FFFFFF` |

### Features
- Horizontal scroll for full year
- Tap cell for tooltip (date + count)
- Month labels visible
- Legend: Less ░ ▒ ▓ █ More

---

## Solve Time Trends

### Display
- Line chart showing improvement over time
- Grouped by difficulty
- Average time trends

### Purpose
- Show player improvement
- Track solve time by difficulty level

---

## Recent Games

### Display
- Last 10 completed games
- Shows: difficulty, grid type badge, time, mistakes
- Grid type displayed as badge (6x6 / 9x9)

### Data Source
- Unified from all three game sources
- Sorted by `completed_at` descending
- Puzzle ID prefixed: `chapter-{n}`, `daily-{id}`, or raw ID

---

## Pull-to-Refresh

### Behavior
- Refresh all statistics
- Sync with Supabase
- Show loading indicator

### What Refreshes
- User stats
- Achievements
- Leaderboard position
- Recent games
- All charts

---

## UI/UX Highlights

### "View All" Links
Each section has a "View All" link:
- Achievements → `/achievements`
- Leaderboard → `/leaderboards`

### Loading States
- Skeleton loaders for each section
- Graceful fallback for offline

### Offline Support
- Cache last known stats
- Show cached data when offline
- Sync when back online

---

## Technical Files

| File | Purpose |
|------|---------|
| `app/(tabs)/board.tsx` | Board screen UI |
| `src/services/statisticsService.ts` | User stats fetching |
| `src/services/gameSessionService.ts` | Game history |
| `src/services/gameAnalyticsService.ts` | Heatmap, weekly data |
| `src/services/pointService.ts` | Points calculation |
| `src/services/achievementService.ts` | Achievement tracking |
| `src/components/HeatmapCalendar.tsx` | GitHub-style heatmap |
| `src/components/WeeklyActivityChart.tsx` | Bar chart |

---

## Acceptance Criteria

- [ ] Stats aggregate from all game sources
- [ ] Points calculated with deductions
- [ ] Achievements show locked/unlocked states
- [ ] Leaderboard shows top 5 + user rank
- [ ] Heatmap shows 52 weeks of activity
- [ ] Weekly chart shows current week
- [ ] Recent games shows last 10
- [ ] Pull-to-refresh works
- [ ] Banner ads display (non-subscribers)
- [ ] Offline shows cached data
