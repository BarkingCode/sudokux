# Free Run Mode

## Overview

Free Run is a practice mode that allows users to play Sudoku puzzles without progression tracking. Users can select any difficulty and grid size for casual practice sessions.

### Purpose
- Practice without affecting Chapter progress or stats
- Experiment with harder difficulties
- Casual play sessions

## Game Limit System

### Daily Allowance
- Users receive **3 free games per day**
- Counter resets at **midnight local device time**
- Games remaining displayed on Free Run screen

### Monetization Flow
When games run out:
1. User sees "Out of Games" modal
2. Option to watch rewarded ad
3. Successful ad viewing grants **+3 games**
4. User can immediately start a new game

### Display Text
```
{N} games available today.
Watch an ad when you run out to get more.
```

## User Flows

### Starting a New Game
```
Free Run Screen
  ├─ Check isAtFreeRunLimit
  │   ├─ NO: consumeFreeRunGame() → Start Game
  │   └─ YES: Show GameLimitModal
  │            ├─ "WATCH AD" → showRewardedAd()
  │            │   └─ Success → addFreeRunGames(+3) → Start Game
  │            └─ "MAYBE LATER" → Close Modal
  └─ Navigate to Game Screen
```

### Play Again After Completion
```
Game Complete (FreeRunCompletionModal)
  ├─ "PLAY ANOTHER"
  │   ├─ saveFreeRunCompletion() → Record to Supabase
  │   ├─ checkAndResetDaily() → Check for midnight reset
  │   ├─ Check isAtFreeRunLimit
  │   │   ├─ NO: consumeFreeRunGame() → Start New Game
  │   │   └─ YES: Show GameLimitModal → Watch Ad Flow
  │   └─ startNewGame(same difficulty, same gridType)
  └─ "BACK TO FREE RUN" → Navigate to Free Run Screen
```

### Continue Saved Game
```
Free Run Screen (with saved game)
  ├─ "CONTINUE" → Load saved game state → Resume Game
  └─ "START NEW GAME" → Clear saved state → Start Fresh
```

## Daily Reset Mechanism

### Reset Triggers
1. **On App Mount**: `useAdSession` checks on initialization
2. **On App Focus**: `AppState` listener detects foreground transition

### Reset Logic
```typescript
if (lastFreeRunResetDate !== today) {
  freeRunGamesRemaining = 3
  lastFreeRunResetDate = today
}
```

### Timezone Handling
- Uses device local timezone via `getLocalDateString()`
- Format: YYYY-MM-DD
- Resets at midnight in user's timezone

## Technical Architecture

### Key Files

| File | Purpose |
|------|---------|
| `app/(tabs)/freerun.tsx` | Free Run screen UI and navigation |
| `src/screens/GameScreen.tsx` | Game play and completion handling |
| `src/hooks/useAdSession.ts` | Game counter state management |
| `src/hooks/useRewardedAd.ts` | Rewarded ad lifecycle |
| `src/context/AdContext.tsx` | Ad state provider |
| `src/components/GameLimitModal.tsx` | Out of games modal |
| `src/components/FreeRunCompletionModal.tsx` | Game complete modal |

### State Management

**AdSession (persisted to AsyncStorage)**
```typescript
interface AdSession {
  freeRunGamesRemaining: number;      // Current games left
  lastFreeRunResetDate?: string;      // YYYY-MM-DD for daily reset
  chapterGamesSinceLastAd: number;    // For Chapter mode
  nextInterstitialThreshold: number;  // For Chapter mode
}
```

**Storage Key**: `sudoku_ad_session`

### Configuration

**File**: `src/config/ads.ts`
```typescript
FREERUN_GAMES_PER_SESSION = 3  // Games granted per day/ad
```

## Rewarded Ad Integration

### Ad Unit
- Uses Google AdMob rewarded ads
- Unit ID configured per platform in environment variables
- Dev mode uses test ads

### Reward Flow
```
showRewardedAd() called
  ├─ Ad-free user → Grant reward immediately
  ├─ Web platform → Grant reward immediately
  └─ Mobile with ad ready:
      ├─ Show ad
      ├─ EARNED_REWARD event → Set flag
      ├─ CLOSED event → Check flag
      │   ├─ Flag true → onRewardEarned() → addFreeRunGames()
      │   └─ Flag false → No reward
      └─ Promise resolves with success/failure
```

### Error Handling
- 30-second timeout prevents infinite loading
- Error events trigger cleanup
- Failed ads resolve promise as `false`

## Game Progress

### Auto-Save
- In-progress games saved to AsyncStorage
- Key: `STORAGE_KEYS.FREERUN_GAME_STATE`
- Cleared when game completes or new game starts

### Completion Recording
- Completed games recorded to Supabase `game_sessions` table
- Achievement progress checked
- Facebook analytics event logged

## Visual Design

### Games Remaining Display
- Positioned below "Start Game" button
- Dashed border box with brutalist styling
- Large number + explanatory text
- Only shown for non-ad-free users

### GameLimitModal
- Title: "OUT OF GAMES"
- Message explaining watch-to-unlock flow
- "WATCH AD" primary button
- "MAYBE LATER" secondary button
- Loading state while ad loads

## Acceptance Criteria

- [ ] User can start Free Run games with any difficulty/grid
- [ ] Games remaining counter displays correctly
- [ ] Counter decrements by 1 when game starts
- [ ] "Out of Games" modal appears when counter = 0
- [ ] Watching ad grants exactly 3 additional games
- [ ] Counter resets to 3 at midnight local time
- [ ] Saved games can be continued
- [ ] Ad-free users have unlimited games
- [ ] Play Again flow respects game limit
- [ ] Web users have unlimited games (no ads)
