# App Icon Badge for Daily Challenge

## Overview

~~Display a badge on the app icon when the user has not completed today's daily challenge, encouraging daily engagement.~~

**Current Implementation:** App badge is always cleared on app open. We use push notifications instead of badge numbers to notify users of new daily challenges.

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

- [x] Badge clears immediately on app open
- [x] No number badge displayed on app icon
- [x] Push notifications work without setting badge
- [x] Works on iOS
- [x] Android support where available
- [x] Respects notification permissions
