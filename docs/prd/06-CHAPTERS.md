# Chapters Mode (Journey Mode)

## Overview

Chapters is the primary single-player progression mode. Players complete puzzles sequentially (1, 2, 3, ...) with difficulty increasing as they progress. Each puzzle number is deterministic - puzzle #5 is always the same puzzle for every player.

## Puzzle Progression

Puzzles are organized by difficulty tiers:

| Puzzle Range | Difficulty |
|--------------|------------|
| 1-20         | Easy       |
| 21-40        | Medium     |
| 41-60        | Hard       |
| 61-80        | Extreme    |
| 81-100       | Insane     |
| 101+         | Inhuman    |

Players must complete puzzles sequentially - cannot skip to puzzle 6 without completing puzzle 5.

## Deterministic Puzzle Generation

Each puzzle number generates the same puzzle for all users:

- Uses seeded pseudo-random number generator (Mulberry32 algorithm)
- Seed is derived from puzzle number and difficulty
- Ensures fairness and consistency across all players
- Implementation: `src/game/chapterPuzzles.ts`

```typescript
// Same puzzle for everyone
const puzzle5 = getChapterPuzzle(5, '9x9');
```

## Visual Design

Journey path displayed as a winding trail:
- Brutalist nodes (circles) connected by dotted lines
- Zigzag pattern flowing upward
- Completed puzzles show checkmark
- Current puzzle has pulsing ring animation
- Locked puzzles are greyed out
- Difficulty indicator dot below each node

## Puzzle States

### Current Puzzle
- Highlighted with pulsing ring
- Tapping starts/resumes the game
- Progress auto-saved when leaving

### Completed Puzzles
- Show checkmark icon
- Tapping opens in **view-only mode**
- Displays solved grid (solution filled in)
- Shows completion stats (time, mistakes)
- Cannot be re-played or edited

### Locked Puzzles
- Greyed out appearance
- Cannot be tapped until previous puzzle is completed

## Progress Saving

### Completion Saving (Supabase)
When a puzzle is completed, saved to `chapter_completions` table:
- `puzzle_number` - which puzzle was completed
- `puzzle_grid` - the initial puzzle state (JSON)
- `solution_grid` - the solution (JSON)
- `time_seconds` - completion time
- `mistakes` - number of mistakes made
- `hints_used` - number of hints used

### Mid-Game Progress (AsyncStorage)
If player leaves a puzzle mid-game:
- Current grid state saved locally
- Timer value preserved
- Mistakes count preserved
- Notes preserved
- Progress restored when returning to same puzzle
- Cleared upon puzzle completion

Storage key: `CHAPTER_IN_PROGRESS`

## Completion Flow

1. Player completes puzzle
2. Chapter completion modal appears with stats
3. Options:
   - **Continue** - Start next puzzle immediately
   - **Back to Chapters** - Return to journey map
4. Progress saved to Supabase
5. Local in-progress data cleared
6. Next puzzle unlocked

## Interstitial Ads

- Shown after every 3 completed chapter games
- Triggered on both "Continue" and "Back to Chapters" paths
- Ad-free subscribers skip interstitials

## Technical Implementation

### Key Files
- `app/(tabs)/index.tsx` - ChaptersScreen (journey map UI)
- `src/screens/GameScreen.tsx` - Game play and completion handling
- `src/game/chapterPuzzles.ts` - Deterministic puzzle generation
- `src/game/seededRandom.ts` - Seeded PRNG for consistency
- `src/services/chapterService.ts` - Supabase integration
- `src/context/GameContext.tsx` - Game state and progress functions

### Key Functions
```typescript
// Get deterministic puzzle for a puzzle number
getChapterPuzzle(puzzleNumber: number, gridType: GridType)

// Get difficulty for puzzle number
getChapterDifficulty(puzzleNumber: number): Difficulty

// Save mid-game progress
saveChapterProgress(puzzleNumber: number)

// Load mid-game progress
loadChapterProgress(): ChapterInProgress | null

// Clear mid-game progress (on completion)
clearChapterProgress()
```

## Free Run Mode (Alternative)

Separate from Chapters, allows user to:
- Choose any difficulty manually
- Choose grid type (9x9 or 6x6)
- No sequential progression
- Session-based play limits (rewarded ads to continue)
