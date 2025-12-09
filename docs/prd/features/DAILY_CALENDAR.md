# Daily Challenge Calendar

## Overview

A month-based calendar view on the Daily screen showing completion history for daily challenges. Allows users to navigate between months and see which days they completed vs. missed.

## Requirements

### Visual Design

```
┌──────────────────────────────────────────────┐
│  [<]       DECEMBER 2024         [>]         │
│              3 completed                     │
├──────────────────────────────────────────────┤
│   S    M    T    W    T    F    S            │
│   1    2    3    4    5    6    7            │
│   8    9   ■10  ■11  12   13   14            │
│  15   16   17  ■18   19   20   21            │
│  22   23   24   25   26   27   28            │
│  29   30   31                                │
├──────────────────────────────────────────────┤
│  ■ Completed  □ Missed  ◼ Today              │
└──────────────────────────────────────────────┘
```

### Brutalist Calendar Style

| State | Light Mode | Dark Mode |
|-------|------------|-----------|
| Completed | `colors.success` (green) | `colors.success` |
| Missed (past) | `colors.highlight` (gray) | `colors.highlight` |
| Today | `colors.primary` (border) | `colors.primary` |
| Future | `colors.highlight` (faded) | `colors.highlight` |
| Empty cell | Transparent | Transparent |

### Implementation

```typescript
import { DailyCalendar } from '../../src/components/DailyCalendar';
import { getCompletionHistory } from '../../src/services/dailyChallengeService';

// Fetch completion history (3 months back)
const history = await getCompletionHistory(userId, 3);

// Render calendar
<DailyCalendar completions={history} />
```

### Data Structure

```typescript
interface CompletionData {
  date: string;      // YYYY-MM-DD
  timeSeconds: number;
  mistakes: number;
}

// Service function
export const getCompletionHistory = async (
  userId: string,
  monthsBack: number = 3
): Promise<CompletionData[]>
```

### Features

- **Month Navigation**: Previous/next month buttons
- **Completion Count**: Shows "X completed" for current month
- **Color Coding**: Green for completed, gray for missed
- **Today Highlight**: Thick border around current day
- **Tap Interaction**: Optional callback when tapping a day
- **Legend**: Shows color meanings at bottom

### Placement

- Daily screen, below StreakDisplay component
- Only shown for logged-in users (requires userId)
- Full width on mobile, centered on iPad

## Acceptance Criteria

- [x] Shows monthly calendar grid with day numbers
- [x] Navigation between months (< and > buttons)
- [x] Completed days highlighted in green
- [x] Missed past days shown in gray
- [x] Today's date has thick border
- [x] Future dates shown faded/disabled
- [x] Legend explains color meanings
- [x] Month completion count displayed
- [x] Follows brutalist design (no rounded corners)
- [x] Only visible to logged-in users
