# Haptic Feedback on Achievement Unlock

## Overview

Add haptic feedback when an achievement is unlocked to provide satisfying tactile confirmation of the accomplishment.

## Requirements

### Trigger Points

1. **Achievement unlock toast appears** - Primary haptic
2. **Achievement modal opens** (if applicable)
3. **First-time achievement view** in achievements list

### Haptic Types

Use `expo-haptics` for cross-platform haptic feedback:

```typescript
import * as Haptics from 'expo-haptics';

// Achievement unlock - Strong success feedback
await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

// Alternative for milestone achievements
await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
```

### Haptic Pattern by Achievement Type

| Achievement Type | Haptic Style |
|-----------------|--------------|
| Regular unlock | `NotificationFeedbackType.Success` |
| Milestone (10, 50, 100 games) | `ImpactFeedbackStyle.Heavy` |
| Streak achievements | `ImpactFeedbackStyle.Medium` + Success |
| First puzzle | `ImpactFeedbackStyle.Heavy` |
| Mastery achievements | Double haptic burst |

### Implementation

```typescript
// In achievementEvents.ts or AchievementContext
const MILESTONE_ACHIEVEMENTS = ['games_10', 'games_50', 'games_100', 'streak_30'];

const triggerAchievementHaptic = async (achievementId: string) => {
  if (MILESTONE_ACHIEVEMENTS.includes(achievementId)) {
    // Double burst for milestones
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    await new Promise(resolve => setTimeout(resolve, 100));
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } else {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }
};
```

### User Settings

- Add toggle in Settings: "Haptic Feedback" (default: ON)
- Respect system-level haptic settings
- Store preference in AsyncStorage

## Acceptance Criteria

- [ ] Haptic fires when achievement toast shows
- [ ] Different haptic patterns for milestone achievements
- [ ] Respects user haptic settings toggle
- [ ] Works on iOS and Android
- [ ] No haptic in silent/vibrate-off mode
