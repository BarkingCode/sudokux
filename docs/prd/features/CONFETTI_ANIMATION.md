# Confetti Animation on Milestone Achievements

## Overview

Display a celebratory confetti animation when users unlock milestone achievements, creating memorable moments of accomplishment.

## Requirements

### Milestone Achievements (Trigger Confetti)

| Achievement | Description |
|-------------|-------------|
| `games_10` | Complete 10 puzzles |
| `games_50` | Complete 50 puzzles |
| `games_100` | Complete 100 puzzles |
| `streak_7` | 7-day streak |
| `streak_30` | 30-day streak |
| `chapter_complete` | Complete a chapter |
| `master_easy` | Master easy difficulty |
| `master_medium` | Master medium difficulty |
| `master_hard` | Master hard difficulty |

### Animation Style

**Brutalist Confetti:**
- Black and white rectangles (primary)
- Sharp-edged shapes (no circles)
- Occasional accent color pieces (red for mistakes theme)
- Heavy, chunky pieces
- Fast initial burst, slow fall

### Implementation with Skia

```typescript
import { Canvas, Rect, Group } from '@shopify/react-native-skia';
import { useSharedValue, withTiming, withSequence } from 'react-native-reanimated';

interface ConfettiPiece {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  velocity: { x: number; y: number };
  color: string;
}

const generateConfetti = (count: number): ConfettiPiece[] => {
  const colors = ['#000000', '#FFFFFF', '#333333', '#666666', '#FF0000'];
  return Array.from({ length: count }, () => ({
    x: Math.random() * screenWidth,
    y: -50,
    width: 8 + Math.random() * 16,
    height: 4 + Math.random() * 8,
    rotation: Math.random() * 360,
    velocity: {
      x: (Math.random() - 0.5) * 8,
      y: 4 + Math.random() * 6,
    },
    color: colors[Math.floor(Math.random() * colors.length)],
  }));
};
```

### Animation Parameters

- **Piece count:** 50-100 pieces
- **Duration:** 2-3 seconds
- **Burst pattern:** Center-out explosion
- **Gravity:** Slow fall with slight drift
- **Rotation:** Continuous spin during fall

### Integration

```typescript
// In AchievementContext or dedicated ConfettiContext
const [showConfetti, setShowConfetti] = useState(false);

const onAchievementUnlock = (achievementId: string) => {
  if (MILESTONE_ACHIEVEMENTS.includes(achievementId)) {
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 3000);
  }
};
```

### Performance

- Use Skia for 60fps rendering
- Limit piece count on older devices
- Clean up animation after completion
- Don't block user interaction

## Acceptance Criteria

- [ ] Confetti triggers on milestone achievements only
- [ ] Brutalist visual style (rectangles, B&W)
- [ ] Smooth 60fps animation
- [ ] 2-3 second duration
- [ ] Works in light and dark mode
- [ ] No performance issues on older devices
