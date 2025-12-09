# Free Run Screen Rules

## Overview

Route: `app/(tabs)/freerun.tsx`

Free Run is a practice mode allowing users to play Sudoku without affecting Chapter progress. Users can select any difficulty and grid size for casual practice sessions.

---

## Layout Components

| Component | Description |
|-----------|-------------|
| Header | "PRACTICE MODE" / "FREE RUN" |
| Continue Card | Shows if in-progress game exists |
| Grid Size Selector | 6x6 / 9x9 toggle |
| Difficulty Selector | 6 difficulty options |
| Start Button | Begin new game |
| Games Remaining | Counter display (non-subscribers) |

---

## Ad Rules

### Banner Ads
| Location | Allowed |
|----------|---------|
| Free Run Screen | ✅ **YES** |
| During Gameplay | ✅ **YES** |
| Completion Modal | ❌ **NO** |

### Interstitial Ads
- ❌ **NO** interstitial ads in Free Run mode

### Rewarded Ads
| Trigger | Reward |
|---------|--------|
| Out of games | +3 games |
| Helper unlock | Enable helper for current game |

### Ad-Free Subscribers
- No banner ads
- No game limit (unlimited)
- Helper unlocked automatically

---

## Game Limit System

### Daily Allowance
| Property | Value |
|----------|-------|
| Free games per day | **3** |
| Games per ad watch | **+3** |
| Reset time | Midnight local time |
| Config key | `FREERUN_GAMES_PER_SESSION = 3` |

### Display Text
```
{N} games available today.
Watch an ad when you run out to get more.
```

### When Limit Reached
1. User taps "Start Game"
2. `isAtFreeRunLimit` check returns true
3. `GameLimitModal` appears
4. Options:
   - **WATCH AD** → Rewarded ad → +3 games → Start game
   - **MAYBE LATER** → Close modal

---

## User Flows

### Starting New Game
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
  │   ├─ checkAndResetDaily() → Check midnight reset
  │   ├─ Check isAtFreeRunLimit
  │   │   ├─ NO: consumeFreeRunGame() → Start New Game
  │   │   └─ YES: Show GameLimitModal
  │   └─ startNewGame(same difficulty, same gridType)
  └─ "BACK TO FREE RUN" → Navigate to Free Run Screen
```

### Continue Saved Game
```
Free Run Screen (with saved game)
  ├─ "CONTINUE" → Load saved state → Resume Game
  └─ "START NEW GAME" → Clear saved state → Start Fresh
```

---

## Daily Reset Rules

### Reset Triggers
1. **App Mount** - `useAdSession` checks on init
2. **App Focus** - `AppState` listener detects foreground

### Reset Logic
```typescript
if (lastFreeRunResetDate !== today) {
  freeRunGamesRemaining = 3
  lastFreeRunResetDate = today
}
```

### Timezone Handling
- Uses device local timezone
- Format: YYYY-MM-DD via `getLocalDateString()`
- Resets at midnight in user's timezone

---

## Grid & Difficulty Options

### Grid Types
| Type | Description |
|------|-------------|
| 9x9 | Standard Sudoku (3x3 boxes) |
| 6x6 | Mini Sudoku (2x3 boxes) |

### Difficulty Levels
| Level | Description |
|-------|-------------|
| Easy | Beginner-friendly |
| Medium | Hidden singles |
| Hard | Pointing pairs |
| Extreme | Naked/hidden pairs |
| Insane | X-Wing, Swordfish |
| Inhuman | Near-minimum clues |

---

## Progress Saving

### Auto-Save (AsyncStorage)
| Data | Saved |
|------|-------|
| Current grid state | ✅ |
| Timer value | ✅ |
| Mistakes count | ✅ |
| Notes | ✅ |
| Difficulty | ✅ |
| Grid type | ✅ |

**Storage Key**: `STORAGE_KEYS.FREERUN_GAME_STATE`

### On Completion (Supabase)
- Recorded to `game_sessions` table
- Achievement progress checked
- Analytics event logged

---

## Helper (Smart Possibility)

### Default State
- Locked for every new puzzle
- Shows "AD" badge on button

### Unlock Flow
1. User taps HELPER button
2. Rewarded ad shown
3. Helper active for current game only
4. Resets on next puzzle

### Ad-Free Behavior
- Helper always available (no ad)

---

## Completion Modal

### FreeRunCompletionModal Content
| Element | Description |
|---------|-------------|
| Time | Total solve time |
| Mistakes | Mistake count |
| Hints/Helper | Number used |
| Points | Points earned |

### Actions
- **PLAY ANOTHER** → Respects game limit
- **BACK TO FREE RUN** → Return to selection

---

## UI/UX Highlights

### Games Remaining Display
- Positioned below "Start Game" button
- Dashed border box, brutalist styling
- Large number + explanatory text
- **Only shown for non-ad-free users**

### GameLimitModal
| Element | Value |
|---------|-------|
| Title | "OUT OF GAMES" |
| Message | Watch-to-unlock explanation |
| Primary Button | "WATCH AD" |
| Secondary Button | "MAYBE LATER" |
| Loading State | While ad loads |

### Continue Card
- Shown when in-progress game exists
- Shows difficulty, grid type, progress
- "CONTINUE" button prominent

---

## State Management

### AdSession (AsyncStorage)
```typescript
interface AdSession {
  freeRunGamesRemaining: number;      // Current games left
  lastFreeRunResetDate?: string;      // YYYY-MM-DD
  chapterGamesSinceLastAd: number;    // For Chapter mode
  nextInterstitialThreshold: number;  // For Chapter mode
}
```

**Storage Key**: `sudoku_ad_session`

---

## Platform-Specific Rules

### Mobile (iOS/Android)
- Game limit enforced
- Rewarded ads functional
- Banner ads displayed

### Web
- **Unlimited games** (no ads on web)
- No rewarded ad prompts
- No banner ads

---

## Technical Files

| File | Purpose |
|------|---------|
| `app/(tabs)/freerun.tsx` | Free Run screen UI |
| `src/screens/GameScreen.tsx` | Game play & completion |
| `src/hooks/useAdSession.ts` | Game counter state |
| `src/hooks/useRewardedAd.ts` | Rewarded ad lifecycle |
| `src/context/AdContext.tsx` | Ad state provider |
| `src/components/GameLimitModal.tsx` | Out of games modal |
| `src/components/FreeRunCompletionModal.tsx` | Completion modal |

---

## Acceptance Criteria

- [ ] User can select any difficulty/grid
- [ ] 3 free games per day
- [ ] Games remaining counter displays correctly
- [ ] Counter decrements when game starts
- [ ] "Out of Games" modal at limit
- [ ] Watching ad grants +3 games
- [ ] Counter resets at midnight local time
- [ ] Saved games can be continued
- [ ] Ad-free users have unlimited games
- [ ] Play Again flow respects game limit
- [ ] Web users have unlimited games
- [ ] Helper requires ad per game
