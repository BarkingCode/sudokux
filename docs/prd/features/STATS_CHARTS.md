# Weekly/Monthly Progress Charts in Stats

## Overview

Add visual charts to the stats screen showing weekly and monthly progress trends for games played, completion times, and accuracy.

## Requirements

### Chart Types

1. **Games Played Bar Chart**
   - Weekly view: 7 bars (Mon-Sun)
   - Monthly view: 4-5 bars (Week 1-4)
   - Stacked by difficulty (easy/medium/hard)

2. **Average Completion Time Line Chart**
   - Track improvement over time
   - Show trend line
   - Per difficulty level

3. **Accuracy Rate Chart**
   - Percentage of mistake-free games
   - Weekly rolling average

### Visual Style (Brutalist)

```
Games This Week
█████████████████████████████████ 12
█████████████████████ 8
████████████████ 6
████████████████████████████ 10
██████████████████████ 9
███████████████████████████████ 11
█████████████████████████████████████ 14

[M]  [T]  [W]  [T]  [F]  [S]  [S]
```

- Black bars on white (or inverted in dark mode)
- Thick lines, no gradients
- Sharp edges
- Bold axis labels
- Minimal grid lines (or none)

### Implementation

Use `react-native-skia` for custom brutalist charts:

```typescript
import { Canvas, Rect, Text, Line } from '@shopify/react-native-skia';

interface BarChartProps {
  data: { label: string; value: number }[];
  maxValue: number;
  height: number;
}

const BrutalistBarChart: React.FC<BarChartProps> = ({ data, maxValue, height }) => {
  const barWidth = (width - padding * 2) / data.length - gap;

  return (
    <Canvas style={{ height }}>
      {data.map((item, index) => (
        <Rect
          key={index}
          x={padding + index * (barWidth + gap)}
          y={height - (item.value / maxValue) * chartHeight}
          width={barWidth}
          height={(item.value / maxValue) * chartHeight}
          color={colors.text}
        />
      ))}
    </Canvas>
  );
};
```

### Data Requirements

Track in `game_sessions` or local storage:

```typescript
interface DailyStats {
  date: string; // YYYY-MM-DD
  gamesPlayed: number;
  gamesWon: number;
  averageTime: number; // seconds
  mistakeFreeGames: number;
  byDifficulty: Record<Difficulty, number>;
}
```

### Time Periods

| View | Data Range | Grouping |
|------|------------|----------|
| Week | Last 7 days | Daily |
| Month | Last 30 days | Weekly |
| All Time | Since install | Monthly |

### User Interaction

- Toggle between Week/Month/All Time
- Tap bar for detailed breakdown
- Swipe to navigate between periods

## Acceptance Criteria

- [ ] Weekly bar chart shows games per day
- [ ] Monthly view shows weekly totals
- [ ] Charts match brutalist design
- [ ] Data loads from local storage/Supabase
- [ ] Smooth animations on data change
- [ ] Empty state for no data
