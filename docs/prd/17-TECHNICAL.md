# Technical Architecture

## Stack Overview

- **Framework**: Expo SDK 54 (managed workflow)
- **Language**: TypeScript
- **Graphics**: React Native Skia for game board rendering
- **Animations**: Reanimated + Moti
- **Storage**: AsyncStorage (game data), SecureStore (identity)
- **Backend**: Supabase (auth, database, realtime)
- **Ads**: Google Mobile Ads (react-native-google-mobile-ads v14.x)
- **Analytics**: Sentry for error tracking

## Core Requirements

- Must function fully offline for core gameplay
- Must degrade gracefully without internet
- Rewarded ads disabled when offline
- All game state persisted locally

## Service Layer Architecture

### Services (`src/services/`)

| Service | Purpose |
|---------|---------|
| `statisticsService.ts` | User stats fetching, streak management, difficulty wins |
| `gameSessionService.ts` | Recording game sessions, fetching unified game history |
| `gameAnalyticsService.ts` | Heatmap and weekly chart data aggregation |
| `pointService.ts` | Points calculation, global/country leaderboards |
| `achievementService.ts` | Achievement checking, unlocking, offline queue sync |
| `dailyLeaderboardService.ts` | Daily challenge leaderboard queries |
| `dailyChallengeService.ts` | Daily challenge fetching and completion recording |
| `chapterService.ts` | Chapter progression and completion tracking |
| `userService.ts` | User management and Game Center linking |
| `gameCenter.ts` | iOS Game Center integration |
| `googleSignIn.ts` | Google Sign-In integration |
| `notificationService.ts` | Push notification management |
| `offlineQueue.ts` | Offline action queueing and sync |
| `badgeService.ts` | App badge management |

### Hooks (`src/hooks/`)

| Hook | Purpose |
|------|---------|
| `useUserId` | Get current user ID with loading state |
| `useGameCompletion` | Handle game completion logic and recording |
| `useGameTimer` | Timer logic with pause/resume |
| `useGameStorage` | Game state persistence |
| `useGameModals` | Modal state management |
| `useAdSession` | Ad session tracking and limits |
| `useInterstitialAd` | Interstitial ad loading and display |
| `useRewardedAd` | Rewarded ad loading and display |
| `useNetworkState` | Network connectivity monitoring |

## Context Providers

### GameContext (`src/context/GameContext.tsx`)

Central game state management:
- Current grid state and solution
- Notes mode toggle
- Mistake tracking
- Timer state
- Undo/redo history
- Grid type (6x6/9x9)

### ThemeContext (`src/context/ThemeContext.tsx`)

Theme management:
- Light/dark/system mode
- Brutalist color palette
- Typography settings

### AdContext (`src/context/AdContext.tsx`)

Ad state management:
- Session game counts
- Ad eligibility checking
- Consent status

### AchievementContext (`src/context/AchievementContext.tsx`)

Achievement notifications:
- Toast queue management
- Achievement unlock events

## Data Flow

### Game Completion Flow

```
User completes puzzle
        ↓
GameScreen.handleComplete()
        ↓
Record to appropriate table:
  - game_sessions (Free Run)
  - chapter_completions (Chapters)
  - daily_completions (Daily)
        ↓
Database trigger: recalculate_user_stats()
        ↓
Check achievements (achievementService.checkAchievements)
        ↓
Update Game Center leaderboards/achievements
        ↓
Show completion modal
```

### Stats Aggregation Flow

```
Profile/Board screen loads
        ↓
Parallel fetches from 3 sources:
  - game_sessions
  - chapter_completions
  - daily_completions
        ↓
Normalize to common format
        ↓
Sort by completed_at
        ↓
Render heatmap/charts/recent games
```

## Offline Support

### Offline-First Architecture

1. **Core gameplay**: No network required
2. **Puzzle generation**: Local algorithm
3. **Game state**: AsyncStorage persistence
4. **Daily challenges**: Cached locally, fallback generation if offline

### Sync Strategy

```typescript
// On app foreground
if (hasNetwork) {
  await syncOfflineQueue(userId);
  await refreshUserStats(userId);
}
```

### Offline Queue (`offlineQueue.ts`)

Queues failed operations for later sync:
- Achievement unlocks
- Game session records
- Stats updates

## File Structure

```
src/
├── components/          # UI components
│   ├── board/          # Skia game board
│   └── game/           # Game-specific components
├── context/            # React contexts
├── game/               # Game engine
│   ├── engine.ts       # Core logic
│   ├── generator.ts    # Puzzle generation
│   ├── solver.ts       # Solving algorithms
│   └── types.ts        # Type definitions
├── hooks/              # Custom hooks
├── lib/                # External integrations
│   ├── supabase.ts     # Supabase client
│   └── database.types.ts
├── screens/            # Screen components
├── services/           # Business logic
└── utils/              # Utilities
    ├── storage.ts      # AsyncStorage wrapper
    └── identity.ts     # User identity
```

## Performance Considerations

- **Skia rendering**: Hardware-accelerated graphics
- **Stats caching**: `statisticsService` caches user stats
- **Parallel fetches**: Analytics queries run in parallel
- **Lazy loading**: Heavy components loaded on demand
- **Memoization**: React.memo for expensive renders

## Third-Party Dependencies

### Required Native Modules

- `@shopify/react-native-skia` - Graphics
- `react-native-reanimated` - Animations
- `react-native-google-mobile-ads` - Ads (v14.x for Expo 54 compatibility)
- `react-native-game-center` - iOS Game Center
- `@react-native-google-signin/google-signin` - Google Sign-In
- `expo-notifications` - Push notifications
- `expo-secure-store` - Secure storage
- `@sentry/react-native` - Error tracking

### Expo Modules

- `expo-router` - File-based routing
- `expo-haptics` - Haptic feedback
- `expo-localization` - Localization
- `expo-device` - Device info
- `expo-asset` - Asset loading
