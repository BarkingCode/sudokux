# App Icon Badge for Daily Challenge

## Overview

Display a badge on the app icon when the user has not completed today's daily challenge, encouraging daily engagement.

## Requirements

### Badge Logic

| Condition | Badge |
|-----------|-------|
| Daily challenge not completed | Show badge (number: 1) |
| Daily challenge completed | Remove badge |
| App opened | Check and update badge |

### Implementation

Use `expo-notifications` for badge management:

```typescript
import * as Notifications from 'expo-notifications';

// Set badge when daily not completed
await Notifications.setBadgeCountAsync(1);

// Clear badge after completion
await Notifications.setBadgeCountAsync(0);
```

### Trigger Points

1. **App launch** - Check if today's daily is complete
2. **Midnight rollover** - Set badge for new day (via background task or push)
3. **Daily challenge completion** - Clear badge immediately
4. **Push notification** - Include badge count in payload

### Background Updates

```typescript
// In daily challenge cron job / push notification
const pushPayload = {
  title: "Daily Challenge Ready!",
  body: "Your daily Sudoku challenge is waiting",
  data: { type: 'daily_challenge' },
  badge: 1, // iOS badge count
};
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

- [ ] Badge appears when daily challenge is pending
- [ ] Badge clears immediately on completion
- [ ] Badge resets at midnight (user's timezone)
- [ ] Works on iOS
- [ ] Android support where available
- [ ] Respects notification permissions
