# Screens & UX Flow

## Tab Navigation

Bottom tab bar with 4 main screens:

1. **Chapters** (Home) - `app/(tabs)/index.tsx`
2. **Daily** - `app/(tabs)/daily.tsx`
3. **Free Run** - `app/(tabs)/freerun.tsx`
4. **Board** - `app/(tabs)/board.tsx`

## Screen Details

### 1. Chapters Screen (Home)

Journey-style progression through sequential puzzles.

**Layout:**
- Header: "YOUR JOURNEY" / "CHAPTERS"
- Winding path visualization
- Puzzle nodes with states (completed/current/locked)
- Current puzzle highlighted with pulsing animation

**Interactions:**
- Tap completed puzzle → View-only mode
- Tap current puzzle → Start/continue game
- Locked puzzles → Not tappable

### 2. Daily Screen

Global daily challenge - same puzzle for all users.

**Layout:**
- Header: Date + "DAILY"
- Challenge card (difficulty, grid type, play button)
- Streak display with milestones
- Completion calendar (monthly view)
- Today's leaderboard (top 10)

**Features:**
- One attempt per day
- Global competition
- Streak tracking
- Tab notification dot when incomplete

### 3. Free Run Screen

Practice mode with full difficulty/grid selection.

**Layout:**
- Header: "PRACTICE MODE" / "FREE RUN"
- Continue card (if in-progress game exists)
- Grid size selector (6x6 / 9x9)
- Difficulty selector (6 options)
- Start button

**Features:**
- Session-based game limits (ads unlock more)
- Save/restore in-progress games
- No progression tracking

### 4. Board Screen

User's stats, achievements, and leaderboards.

**Layout:**
1. **Header**: "YOUR PROGRESS" / "BOARD"
2. **Achievements**: Horizontal scroll with badges
3. **Global Leaderboard**: Top 5 preview + user rank
4. **Statistics**: Quick stats cards
5. **Weekly Activity**: Bar chart
6. **Play History**: Heatmap calendar
7. **Solve Time Trends**: Improvement chart
8. **Recent Games**: Last 10 completions

**Features:**
- Pull-to-refresh
- "View All" links to full screens
- Unlocked/locked achievement states

### 4. Game Screen

Active puzzle gameplay.

**Route:** `app/game.tsx`

**Layout:**
- Back button + Timer
- Difficulty label
- Sudoku board (Skia-rendered)
- Number pad (1-9 or 1-6)
- Action buttons (Erase, Notes, Hint)

**Modes:**
- Chapter game (`isChapter=true`)
- Daily challenge (`isDaily=true`)
- Free Run (default)
- View-only (`viewOnly=true`)

### 5. Daily Challenge Screen

**Route:** `app/daily.tsx`

**Layout:**
- Today's date display
- Challenge status (available/completed)
- Start/View button
- Streak info
- Yesterday's results (if available)

**Post-completion:**
- DailyCompletionModal with leaderboard
- User's rank and time
- Top 10 fastest times

### 6. Leaderboards Screen

**Route:** `app/leaderboards.tsx`

**Layout:**
- Tab bar: Global / Country
- User stats card (rank, points, games)
- Leaderboard list (top 100)
- Highlighted current user row

### 7. Achievements Screen

**Route:** `app/achievements.tsx`

**Layout:**
- Categories: Milestone, Skill, Streak, Mastery
- Achievement cards with icon, name, description
- Locked/unlocked visual states

### 8. Settings Screen

**Route:** `app/settings.tsx`

**Features:**
- Theme toggle (Light/Dark/System)
- Notification preferences
- Sound/Haptics toggles
- Subscription management
- Account info

## Modal Screens

### Completion Modals

1. **ChapterCompletionModal** - Stats + Next/Back options
2. **FreeRunCompletionModal** - Stats + Play Again/Back
3. **DailyCompletionModal** - Stats + Leaderboard

### Other Modals

- **SmartHintModal** - Hint explanation + Apply button
- **GameLimitModal** - Watch ad to unlock more games
- **SubscriptionModal** - Premium upgrade flow

## Navigation Flow

```
App Launch
    ↓
Chapters (Home Tab)
    ↓
[Tap puzzle] → Game Screen
                    ↓
              [Complete]
                    ↓
         Completion Modal
                    ↓
    [Next] or [Back to Chapters]
```

## Design Principles

- **Fast** - Minimal loading, instant transitions
- **Brutalist** - High contrast, thick borders, sharp edges
- **Minimalist** - Essential elements only
- **Accessible** - Clear touch targets, readable text
