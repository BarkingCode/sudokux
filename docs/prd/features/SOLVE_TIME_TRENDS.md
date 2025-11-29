# Solve Time Improvement Tracking

## Overview

Track and display solve time trends to show users their improvement over time, providing motivation and insight into their progress.

## Requirements

### Metrics to Track

1. **Average solve time per difficulty**
   - Rolling 7-day average
   - Rolling 30-day average
   - All-time average

2. **Personal best times**
   - Per difficulty level
   - Per grid type (6×6 vs 9×9)
   - Date achieved

3. **Improvement percentage**
   - Compare recent average to first 10 games
   - Week-over-week improvement

### Display Components

#### Time Trend Chart

```
Solve Time Trend (Easy - 9×9)

8:00 ┤
7:00 ┤     ╭─╮
6:00 ┤  ╭──╯ ╰──╮
5:00 ┤──╯       ╰──────╮
4:00 ┤                  ╰────────
3:00 ┤
     └──────────────────────────────
     Week 1  Week 2  Week 3  Week 4

     Current Avg: 4:32  Best: 3:45
     Improvement: -28% from start
```

#### Personal Bests Card

```
┌─────────────────────────────────┐
│  PERSONAL BESTS                 │
├─────────────────────────────────┤
│  EASY      03:45    Nov 15      │
│  MEDIUM    06:22    Nov 12      │
│  HARD      12:18    Oct 28      │
│  EXTREME   18:45    Nov 01      │
└─────────────────────────────────┘
```

### Implementation

```typescript
interface SolveTimeStats {
  difficulty: Difficulty;
  gridType: GridType;
  bestTime: number; // seconds
  bestTimeDate: string;
  averageTime: number;
  recentAverage: number; // last 7 days
  improvementPercent: number;
  totalGames: number;
}

const calculateTrends = async (userId: string): Promise<SolveTimeStats[]> => {
  const { data } = await supabase
    .from('game_sessions')
    .select('difficulty, time_seconds, created_at, grid_type')
    .eq('user_id', userId)
    .eq('completed', true)
    .order('created_at', { ascending: true });

  // Calculate per-difficulty stats
  return difficulties.map(difficulty => {
    const games = data.filter(g => g.difficulty === difficulty);
    const recent = games.filter(g => isWithinDays(g.created_at, 7));
    const firstTen = games.slice(0, 10);

    return {
      difficulty,
      bestTime: Math.min(...games.map(g => g.time_seconds)),
      averageTime: average(games.map(g => g.time_seconds)),
      recentAverage: average(recent.map(g => g.time_seconds)),
      improvementPercent: calculateImprovement(firstTen, recent),
      // ...
    };
  });
};
```

### Visualization Options

1. **Line chart** - Time trend over weeks
2. **Spark line** - Mini inline chart in stats cards
3. **Delta indicator** - ↑12% or ↓8% badges

### Brutalist Chart Style

- Solid black/white lines (no gradients)
- Thick 2-3px stroke
- Sharp corners (not rounded)
- Bold axis labels
- Minimal or no grid

### Notifications

- "New personal best!" toast when record broken
- Weekly summary: "You improved 15% this week!"
- Milestone: "You've played 100 easy puzzles!"

## Acceptance Criteria

- [ ] Track solve times per difficulty
- [ ] Display personal best times with dates
- [ ] Show improvement percentage
- [ ] Line chart for time trends
- [ ] New personal best notification
- [ ] Data persists across sessions
- [ ] Works offline (local data)
