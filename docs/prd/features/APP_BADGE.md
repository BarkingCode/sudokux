# Badge Notifications for Daily Challenge

## Overview

Two types of badge notifications encourage daily engagement:

1. **App Icon Badge**: Always cleared on app open (push notifications used instead)
2. **Tab Bar Notification Dot**: Red dot on Daily tab when today's challenge is incomplete

## Tab Bar Notification Dot

A small red square dot appears on the Daily tab icon when:
- User has not completed today's daily challenge
- User is logged in (anonymous users don't see the dot)

The dot disappears immediately when:
- User completes today's challenge
- A new day begins and the user completes the new challenge

### Implementation

Uses `DailyStatusContext` for global state management:

```typescript
// DailyStatusContext provides:
const { hasCompletedTodayChallenge, isLoading, markAsCompleted } = useDailyStatus();

// Tab layout shows dot when incomplete:
const showDailyDot = !isLoading && !hasCompletedTodayChallenge;

// TabBadgeDot component (brutalist design - no border-radius):
<TabBadgeDot visible={showDailyDot} color={colors.mistake} />
```

### Trigger Points

1. **App launch** - Check completion status from Supabase
2. **App foreground** - Re-check status (handles midnight transition)
3. **Daily completion** - `markAsCompleted()` hides dot immediately

## App Icon Badge (Disabled)

## Requirements

### Badge Logic

| Condition | Badge |
|-----------|-------|
| App opened | Always clear badge (0) |
| Daily challenge completed | Badge already cleared |
| Push notification received | No number badge set |

### Implementation

Use `expo-notifications` for badge management:

```typescript
import * as Notifications from 'expo-notifications';

// Always clear badge on app open (in _layout.tsx)
useEffect(() => {
  Notifications.setBadgeCountAsync(0);
}, []);

// Badge service always clears (no number badge)
async updateDailyBadge(userId: string | null): Promise<void> {
  await this.clearBadge();
}
```

### Trigger Points

1. **App launch** - Clear badge immediately
2. **Daily challenge completion** - Badge already cleared
3. **Push notification** - Notification only, no badge number

### Push Notifications (No Badge)

```typescript
// Push notifications do NOT set badge numbers
const pushPayload = {
  title: "Daily Challenge Ready!",
  body: "Your daily Sudoku challenge is waiting",
  data: { type: 'daily_challenge' },
  // No badge field - we don't use number badges
};

// Notification handler configured to not set badge
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false, // Never set badge from notifications
  }),
});
```

### Platform Considerations

**iOS:**
- Requires notification permission for badge
- Badge persists until cleared
- Works with silent push notifications

**Android:**
- Badge support varies by launcher
- Use `expo-notifications` with `NotificationChannelInput`
- Some launchers ignore badges

### Edge Cases

- Timezone handling for "today"
- Offline users - update badge on next app open
- Multiple devices - badge state per device

## Acceptance Criteria

### Tab Bar Notification Dot
- [x] Red dot appears on Daily tab when challenge incomplete
- [x] Dot disappears when challenge is completed
- [x] Dot resets at midnight for new challenge
- [x] Anonymous users don't see the dot (no userId)
- [x] Works on both iOS and Android

### App Icon Badge
- [x] Badge clears immediately on app open
- [x] No number badge displayed on app icon
- [x] Push notifications work without setting badge
- [x] Works on iOS
- [x] Android support where available
- [x] Respects notification permissions
