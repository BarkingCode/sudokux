# GitHub-Style Play History Calendar

## Overview

Display a GitHub-style contribution heatmap showing the user's play history, with intensity indicating games played each day.

## Requirements

### Visual Design

```
Play Activity (Last 52 weeks)

     Jan  Feb  Mar  Apr  May  Jun  Jul  Aug  Sep  Oct  Nov  Dec
Mon  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
Wed  ░▒▒░░▓▓▓░░▒▒░░░░░▒▒▒░░░░░░▓▓▓░░░▒▒░░░░░░▓▓▓▒▒▒░░░░░
Fri  ░░▒▒▒░░░▓▓░░░▒▒▒░░░▓▓▓▓░░░░░░▒▒▒░░░░░░▓▓░░░░░▒▒▒▒░░
Sun  ▓▓░░░░░░░▒▒▒▒▒░░░░░░░▓▓▓▓░░░░░░▒▒▒░░░░░▓▓▓░░░░░░░░░

Less ░ ▒ ▓ █ More
```

### Brutalist Heatmap Style

| Games | Light Mode | Dark Mode |
|-------|------------|-----------|
| 0 | `#E0E0E0` | `#1A1A1A` |
| 1-2 | `#999999` | `#444444` |
| 3-4 | `#666666` | `#777777` |
| 5+ | `#000000` | `#FFFFFF` |

### Implementation

```typescript
import { Canvas, Rect } from '@shopify/react-native-skia';

interface DayData {
  date: string;
  count: number;
}

const CELL_SIZE = 10;
const CELL_GAP = 2;
const WEEKS_TO_SHOW = 52;

const HeatmapCalendar: React.FC<{ data: DayData[] }> = ({ data }) => {
  const getColor = (count: number): string => {
    if (count === 0) return colors.heatmap.level0;
    if (count <= 2) return colors.heatmap.level1;
    if (count <= 4) return colors.heatmap.level2;
    return colors.heatmap.level3;
  };

  // Organize data into weeks (columns) and days (rows)
  const weeks = organizeIntoWeeks(data, WEEKS_TO_SHOW);

  return (
    <Canvas style={{ width: WEEKS_TO_SHOW * (CELL_SIZE + CELL_GAP), height: 7 * (CELL_SIZE + CELL_GAP) }}>
      {weeks.map((week, weekIndex) =>
        week.map((day, dayIndex) => (
          <Rect
            key={`${weekIndex}-${dayIndex}`}
            x={weekIndex * (CELL_SIZE + CELL_GAP)}
            y={dayIndex * (CELL_SIZE + CELL_GAP)}
            width={CELL_SIZE}
            height={CELL_SIZE}
            color={getColor(day.count)}
          />
        ))
      )}
    </Canvas>
  );
};
```

### Data Structure

```typescript
interface PlayHistoryEntry {
  date: string; // YYYY-MM-DD
  gamesPlayed: number;
  gamesWon: number;
  dailyChallengeCompleted: boolean;
}

// Aggregate from game_sessions
const getPlayHistory = async (userId: string): Promise<PlayHistoryEntry[]> => {
  const { data } = await supabase
    .from('game_sessions')
    .select('created_at')
    .eq('user_id', userId)
    .gte('created_at', oneYearAgo);

  // Group by date and count
  return aggregateByDate(data);
};
```

### Features

- **Scrollable:** Horizontal scroll for full year
- **Tooltips:** Tap cell to see date and count
- **Month labels:** Show abbreviated month names
- **Day labels:** Mon, Wed, Fri, Sun markers
- **Legend:** Less/More gradient indicator

### Placement

- Stats screen, below overview cards
- Full width on mobile
- Centered on iPad

## Acceptance Criteria

- [ ] Shows last 52 weeks of data
- [ ] Color intensity reflects games played
- [ ] Month labels visible
- [ ] Tap cell shows date/count tooltip
- [ ] Matches brutalist design (B&W shades)
- [ ] Horizontal scroll on mobile
- [ ] Empty cells for future dates
