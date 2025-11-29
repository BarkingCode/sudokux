# Pull-to-Refresh on Achievements Screen

## Overview

Add pull-to-refresh functionality to the achievements screen to allow users to manually refresh their achievement data from the server.

## Requirements

### User Experience

- Standard iOS/Android pull-to-refresh gesture
- Smooth animation during refresh
- Clear visual feedback (spinner/loading indicator)
- Haptic feedback on pull trigger (iOS)

### Technical Implementation

```typescript
// Use React Native's RefreshControl
import { RefreshControl, ScrollView } from 'react-native';

const [refreshing, setRefreshing] = useState(false);

const onRefresh = useCallback(async () => {
  setRefreshing(true);
  await statsService.getAchievements(userId);
  setRefreshing(false);
}, [userId]);

<ScrollView
  refreshControl={
    <RefreshControl
      refreshing={refreshing}
      onRefresh={onRefresh}
      tintColor={colors.text} // Match brutalist theme
    />
  }
>
  {/* Achievement list */}
</ScrollView>
```

### Visual Style

- Brutalist-compatible spinner (black/white)
- No colored indicators unless in dark mode
- Match existing app typography

### Data Sync

- Fetch fresh achievements from Supabase
- Sync with Game Center achievements
- Update local cache
- Show toast if sync fails (with retry option)

## Acceptance Criteria

- [ ] Pull gesture triggers refresh
- [ ] Loading indicator visible during refresh
- [ ] Achievement list updates after refresh
- [ ] Haptic feedback on iOS
- [ ] Error handling for failed refresh
- [ ] Works in offline mode (shows cached data)
