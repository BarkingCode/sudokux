# Chapters Screen Rules

## Overview

Route: `app/(tabs)/index.tsx` (Home Tab)

The Chapters screen is the primary single-player progression mode. Players complete puzzles sequentially (1, 2, 3...) with difficulty increasing as they advance through the journey.

---

## Layout Components

| Component | Description |
|-----------|-------------|
| Header | "YOUR JOURNEY" / "CHAPTERS" |
| Grid Type Toggle | Switch between 9x9 and 6x6 |
| Journey Path | Winding path with puzzle nodes |
| Puzzle Nodes | Circles showing completed/current/locked states |
| Difficulty Indicators | Dots below nodes showing difficulty |

---

## Ad Rules

### Banner Ads
| Location | Allowed |
|----------|---------|
| Chapters Screen | ✅ **YES** |
| During Gameplay | ✅ **YES** |
| Completion Modal | ❌ **NO** |

### Interstitial Ads
- ✅ **YES** - Shown every **2-4 completed puzzles** (randomized)
- Triggered when user taps "Continue" OR "Back to Chapters"
- Counter: `chapterGamesSinceLastAd` (persisted)
- Config: `INTERSTITIAL_MIN_GAMES = 2`, `INTERSTITIAL_MAX_GAMES = 4`

### Rewarded Ads
- Helper unlock (per-game, watch ad to enable)
- Helper resets to locked on each new puzzle

### Ad-Free Subscribers
- No interstitial ads
- No banner ads
- Helper unlocked automatically (no ad required)
- Unlimited chapter puzzles (already unlimited for all users)

---

## Progression Rules

### Difficulty Tiers (30 puzzles each)

| Puzzle Range | Difficulty |
|--------------|------------|
| 1-30 | Easy |
| 31-60 | Medium |
| 61-90 | Hard |
| 91-120 | Extreme |
| 121-150 | Insane |
| 151+ | Inhuman |

### Sequential Unlocking
- Must complete puzzle N before accessing puzzle N+1
- Cannot skip puzzles
- Progress is linear

### Grid Type Selection
- Toggle at top: **9x9** (default) or **6x6**
- Each grid type has **separate progress**
- Completing 9x9 puzzles doesn't affect 6x6 progress
- Storage keys:
  - `CHAPTER_PROGRESS` (9x9)
  - `CHAPTER_PROGRESS_6X6` (6x6)
  - `CHAPTER_GRID_TYPE` (selected type)

---

## Puzzle Generation Rules

### Deterministic Generation
- Same puzzle for all users at same puzzle number
- Uses seeded PRNG (Mulberry32 algorithm)
- Seed = puzzle number + difficulty
- Ensures fairness across players

### Implementation
```typescript
// Same puzzle for everyone
const puzzle = getChapterPuzzle(puzzleNumber, gridType);
```

---

## Puzzle Node States

### Current Puzzle
| Property | Value |
|----------|-------|
| Visual | Pulsing ring animation |
| Tap Action | Start/resume game |
| Progress | Auto-saved when leaving |

### Completed Puzzles
| Property | Value |
|----------|-------|
| Visual | Checkmark icon |
| Tap Action | View-only mode |
| Display | Shows solved grid + completion stats |
| Editable | ❌ Cannot be re-played |

### Locked Puzzles
| Property | Value |
|----------|-------|
| Visual | Greyed out |
| Tap Action | None (not tappable) |
| Unlock | Complete previous puzzle |

---

## Progress Saving

### Mid-Game Progress (AsyncStorage)
- Current grid state
- Timer value
- Mistakes count
- Notes
- Storage key: `CHAPTER_IN_PROGRESS`
- Cleared on completion

### Completion Data (Supabase)
Saved to `chapter_completions` table:
- `puzzle_number`
- `grid_type` (9x9 or 6x6)
- `puzzle_grid` (JSON)
- `solution_grid` (JSON)
- `time_seconds`
- `mistakes`
- `helper_used`

---

## Completion Flow

1. Player completes puzzle
2. Chapter completion modal shows:
   - Time, mistakes, hints
   - Points earned
3. Options:
   - **Continue** → Start next puzzle
   - **Back to Chapters** → Return to journey map
4. Interstitial ad check (every 3 games)
5. Progress saved to Supabase
6. Next puzzle unlocked

---

## UI/UX Highlights

### Journey Path Design
- Winding trail flowing upward
- Zigzag pattern
- Brutalist nodes (circles) connected by dotted lines
- Difficulty indicator dots below nodes

### Visual States
| State | Light Mode | Dark Mode |
|-------|------------|-----------|
| Completed | Checkmark, solid fill | Checkmark, solid fill |
| Current | Pulsing ring | Pulsing ring |
| Locked | Gray, muted | Gray, muted |

### Animations
- Pulsing ring on current puzzle
- Smooth scroll to current puzzle on load
- Checkmark animation on completion

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

### Functionality When Active
- Number pad dims invalid numbers
- Valid numbers highlighted
- Works with both 6x6 and 9x9

---

## Technical Files

| File | Purpose |
|------|---------|
| `app/(tabs)/index.tsx` | Chapters screen UI |
| `src/game/chapterPuzzles.ts` | Deterministic puzzle generation |
| `src/game/seededRandom.ts` | Seeded PRNG |
| `src/services/chapterService.ts` | Supabase integration |
| `src/components/ChapterCompletionModal.tsx` | Completion modal |
| `src/context/GameContext.tsx` | Game state management |

---

## Acceptance Criteria

- [ ] Sequential puzzle unlocking works
- [ ] 9x9 and 6x6 have separate progress
- [ ] Same puzzle number = same puzzle for all users
- [ ] Interstitial ads every 3 completions
- [ ] Completed puzzles viewable but not editable
- [ ] Current puzzle shows pulsing animation
- [ ] Progress auto-saves when leaving mid-game
- [ ] Helper requires ad watch per puzzle
- [ ] Ad-free users skip all ads
