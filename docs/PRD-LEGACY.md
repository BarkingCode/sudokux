# Sudoku Game – Final Product Requirements Document (PRD)

**Platform:** iOS (primary), Android (optional)
**Tech Stack:** Expo (React Native), React Native Skia, Reanimated/Moti
**Monetization:** AdMob (rewarded + interstitial + banner)
**Offline-First:** Yes
**Design Style:** Brutalist, black & white, dark mode included
**Identity:** Anonymous (no signup/login)
**Modes:** Normal Play, Chapter Mode (adaptive difficulty), Daily Challenge
**Backend:** Supabase for analytics, leaderboards, and daily challenges

---

# 1. Product Vision

Build a **beautiful, brutalist, offline-first Sudoku game** with a modern, highly polished visual style using **React Native Skia** for graphics, **Expo** for rapid development, and **AdMob** for monetization.

The experience must:

* Work flawlessly **offline**
* Be visually **sharp and modern** using a minimal black-and-white brutalist style
* Use **custom controls**, no keyboard
* Support **iPad layouts**
* Feature **data-driven gameplay**, stats, streaks, and chapters
* Integrate **Game Center** for iOS leaderboards (optional)
* Include thoughtful rewarded ads that enhance gameplay, not disrupt it

This is a premium-feeling Sudoku experience — with unique personality (brutalism), strong animations, and progression.

---

# 2. Core Gameplay Features

* Sudoku puzzle gameplay
* **Grid Types:**
  * 9×9 Standard (classic Sudoku with 3×3 boxes)
  * 6×6 Mini Sudoku (with 2×3 boxes, numbers 1-6)
* **Difficulty levels:** Easy, Medium, Hard, Extreme, Insane, Inhuman
* Chapter-based difficulty progression
* Hint system (basic & smart)
* Timer
* Mistake counter
* Pencil/notes mode
* Undo & erase tools
* Manual difficulty mode (optional)
* **Daily Challenge puzzle** (synced across all users)
* Completion summary with XP + streaks
* Smooth brutalist animations (Skia + Reanimated)

---

# 3. Grid Types & Difficulty Levels

## 3.1 Grid Types

| Grid Type | Size | Box Size | Numbers | Description |
|-----------|------|----------|---------|-------------|
| Standard | 9×9 | 3×3 | 1-9 | Classic Sudoku |
| Mini | 6×6 | 2×3 | 1-6 | Quick games, beginner-friendly |

## 3.2 Difficulty Levels

Six difficulty levels with varying clue counts:

| Level | 9×9 Clues | 6×6 Clues | Solving Techniques Required |
|-------|-----------|-----------|----------------------------|
| Easy | ~51 | ~26 | Naked singles only |
| Medium | ~41 | ~22 | Hidden singles |
| Hard | ~31 | ~18 | Pointing pairs, box/line reduction |
| Extreme | ~26 | ~15 | Naked/hidden pairs/triples |
| Insane | ~23 | ~12 | X-Wing, Swordfish, advanced techniques |
| Inhuman | ~19 | ~10 | Near-minimum clues, trial and error |

**Note:** 9×9 minimum possible clues for unique solution is 17. 6×6 minimum is ~8-10.

---

# 4. Offline-First Requirements

## 4.1 Puzzle Source Logic

The app must be fully playable offline:

**Offline = JSON + Runtime Generation**

* Load puzzles from bundled JSON files (9×9 easy/medium/hard only)
* Generate puzzles at runtime for:
  * All 6×6 puzzles
  * 9×9 extreme/insane/inhuman difficulties
  * When bundled puzzles exhausted

**Runtime Generation Features:**
* Backtracking algorithm with randomization
* **Guaranteed unique solutions** via solution counting
* Generation time: <1s for 6×6, <3s for hardest 9×9

**Under no circumstance does offline rely on an internet call.**

## 4.2 Puzzle Rotation Rules

* No repeated puzzles until pool is exhausted
* Track used puzzle IDs locally
* Reset pool when fully used

---

# 5. Game Engine Requirements

### Must Support:

* Board validation for both 6×6 and 9×9
* Real-time validation toggle
* Pencil mode (multinumber notes)
* Undo stack
* Mistake tracking
* Highlighting:
  * Row, column, block (dynamic block size)
  * Same numbers
  * Illegal move overlay

### Puzzle Generation:

* Parameterized generator supporting multiple grid sizes
* Uniqueness validation (stops after finding 2 solutions)
* Difficulty-based clue removal

### Completion Rules:

* Timer stops when solved
* Mistakes and hints affect XP
* Show completion summary

---

# 6. User Identity (No Login)

## 6.1 Anonymous User ID

On first launch:

* Generate `internal_user_id` (UUID)
* Store in SecureStore/AsyncStorage
* Auto-generate nickname (e.g., "Player-4832")
* Ask for:
  * Country (dropdown)
  * Region/City (free text, optional)

## 6.2 Optional Game Center Integration (iOS)

If user is signed into Game Center:

* Capture Game Center player ID
* Use for:
  * Game Center leaderboards
  * Achievements

Internal ID remains the canonical identity.

---

# 7. Dynamic Difficulty & Chapter Mode

## 7.1 Chapter Flow (Default Mode)

Each chapter is 5 puzzles:

1. Easy
2. Easy
3. Medium
4. Medium
5. Hard (Chapter Finale)

Completing the Hard puzzle triggers:

* XP bonus
* Chapter completion animation
* Unlock next chapter

Visualized as brutalist nodes connected by thick lines (Skia).

## 7.2 Adaptive Difficulty (Optional)

Adjust difficulty based on:

* Mistake patterns
* Completion times
* Hint usage

## 7.3 Manual Difficulty Mode

Allows user to override chapter system and choose any difficulty:

* Easy, Medium, Hard, Extreme, Insane, Inhuman

Disables chapter progression.

---

# 8. Monetization (AdMob)

## 8.1 Game Session Limits & Rewarded Ads

**5-Game Session Model:**

* Users can play **5 games for free** per session
* After completing 5 games, show a **rewarded ad** to unlock 5 more games
* Counter resets daily at midnight (local time)
* Track games played today in local storage

**Flow:**
1. User completes game #5
2. Show modal: "You've completed 5 games! Watch a short video to unlock 5 more."
3. User watches rewarded ad
4. Grant 5 additional games
5. Repeat as needed

**Ad-Free subscribers:** Unlimited games, no ads shown

## 8.2 Rewarded Ads (User-triggered only)

Rewards:

* +5 games (primary use case)
* +1 hint
* XP boost
* Retry option
* Chapter finale bonus (optional)

Rewards must trigger only after full ad completion.

## 8.3 Interstitial Ads

Shown:

* After completing a puzzle (if not at 5-game limit)
* Not more than once every 2–3 puzzles
* Never during gameplay

## 8.4 Banner Ads

Shown on:

* Home
* Stats
* Settings

Banners forbidden on:

* Puzzle board
* Onboarding
* Completion animation screen

---

# 9. Daily Challenge

## 9.1 Overview

A **single daily puzzle** that is the **same for all users worldwide**. Creates shared experience and competition.

## 9.2 Database Storage

Daily puzzles stored in Supabase:

```sql
CREATE TABLE daily_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_date DATE UNIQUE NOT NULL,
  grid_type TEXT NOT NULL DEFAULT '9x9',
  difficulty TEXT NOT NULL,
  puzzle_grid JSONB NOT NULL,
  solution_grid JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_daily_challenges_date ON daily_challenges(challenge_date);
```

## 9.3 Puzzle Generation (Cron Job)

**Supabase Edge Function** or external cron service generates daily puzzles:

* Runs daily at **00:00 UTC**
* Generates puzzle for the next day (or current day if missing)
* Difficulty rotation: Easy → Medium → Hard → Extreme → repeat
* Grid type: Primarily 9×9, occasional 6×6 on weekends

**Cron Schedule:**
```
0 0 * * * - Daily at midnight UTC
```

**Edge Function Logic:**
1. Check if puzzle exists for tomorrow
2. If not, generate puzzle with uniqueness validation
3. Store in `daily_challenges` table
4. Log success/failure

## 9.4 Daily Challenge Features

* **Leaderboard:** Fastest completion times for today's puzzle
* **Streak tracking:** Consecutive days completed
* **One attempt:** Cannot replay same day's puzzle
* **Offline support:** Cache today's puzzle on app open

## 9.5 Push Notifications (Cron Job)

**Daily Reminder Notification:**

* Sent at user's preferred time (default: 9:00 AM local)
* "Your daily Sudoku challenge is waiting!"
* Only sent if user hasn't completed today's puzzle

**Implementation:**
* Store user notification preferences in Supabase
* Expo Push Notifications for delivery
* Cron job queries users who:
  * Have notifications enabled
  * Haven't completed today's puzzle
  * Are within their notification time window

**Notification Schedule:**
```
*/15 * * * * - Every 15 minutes, check for users to notify
```

---

# 10. Input & Controls (Keyboard-Free)

## 10.1 Custom Number Pad

* Brutalist rectangular tiles
* Bold numbers
* High contrast black-white
* Animations: punch-in effect
* Number pad replaces OS keyboard entirely
* **Dynamic grid arrangement:**
  * 1–9 for Standard Sudoku (single row)
  * 1–6 for Mini Sudoku (two rows of 3)

## 10.2 Notes Toggle

* Brutalist ON/OFF toggle
* Pencil icon
* Notes drawn in Skia inside cells
* Notes are small, sharp numbers (crisp at any size)

## 10.3 Erase Tool

* Removes notes or numbers from selected cell

## 10.4 Undo Tool

* Stack-based
* Disabled state visible

---

# 11. Board & Graphics (Skia-Based)

## 11.1 Board Rendering

All board visuals must be rendered via **React Native Skia**:

* Grid lines (thick brutalist lines)
* **Dynamic block separators** (2×3 for 6×6, 3×3 for 9×9)
* Numbers (Skia text renderer)
* Notes (small Skia text)
* Highlights (rectangular overlays)
* Mistake shake (Skia transform)
* Hint overlays
* Press/selection effects

## 11.2 Completion Effects

* Brutalist confetti
* Rectangle bursts
* Bold "STAMP" success animation
* All Skia-powered

## 11.3 Performance Requirements

* 60fps consistently
* No stuttering on Skia redraws
* Cache board layers to optimize
* Smooth on iPhone SE 2nd Gen and above
* iPad rendering must remain crisp

---

# 12. iPad Layout Requirements

## 12.1 Adaptive Layout

The game must feel native on iPad:

* Board centered or left-aligned
* Number pad & tools scale proportionally
* Minimum tile size:
  * 48dp mobile
  * 64–72dp tablet

## 12.2 Landscape Support

Landscape mode required on iPad:

* Board on left
* Tools & stats on right panel
* Smart spacing

## 12.3 Crisp Scaling

Skia must re-render:

* Grid
* Numbers
* Notes
* Highlights

No blurry scaling allowed.

---

# 13. Dark Mode Requirements

### Dark Mode Palette:

* Background: #000000
* Text: #FFFFFF
* Grid lines: #FFFFFF
* Notes: #CCCCCC
* Mistake highlights: #B00020
* Puzzle tiles: #111–#222

### Behavior:

* Respects system theme
* Manual override in settings
* Entire Skia canvas re-renders on mode switch

---

# 14. Visual Style: Brutalist

### Core Principles:

* Black & white first
* Thick borders
* Sharp edges
* Heavy typography
* High contrast
* Minimal color (one accent color optional)
* Rigid spacing
* Deliberate asymmetry acceptable

### Components must follow this style:

* Number pad
* Board
* Hint overlays
* Settings cards
* Stats displays
* Chapter map

---

# 15. Stats & Analytics

### Local Stats (Always)

Track:

* Games completed (per grid type)
* Best times per difficulty
* Average times
* Mistakes per game
* Hints per game
* XP
* Streak
* Last 10 results
* Daily challenge streak

### Cloud Stats (Optional)

* Sync user stats (via internal ID)
* Store game_sessions table
* Link with Game Center ID if available
* Daily challenge completions

---

# 16. Leaderboards & Achievements

## 16.1 Game Center Leaderboards (Optional)

Leaderboards per difficulty and grid type:

* Best time (lower = better)
* Validation on submission to prevent impossible scores

## 16.2 Game Center Achievements

* First puzzle
* No hints
* No mistakes
* Finish 10 puzzles
* 7–30 day streaks
* Chapter completions
* Complete all difficulty levels
* Complete 6×6 Mini Sudoku

## 16.3 Custom Leaderboards (Backend)

* Global
* Country
* Region
* **Daily Challenge leaderboard**
* Rank by best time
* Tiebreak: mistakes

---

# 17. Screens & UX Flow

### Screens:

1. **Onboarding**
2. **Home** (with grid type selector)
3. **Chapter Map**
4. **Difficulty Select** (6 levels)
5. **Game Board** (adapts to grid type)
6. **Daily Challenge**
7. **Hints**
8. **Completion Summary**
9. **Stats**
10. **Leaderboards** (GC or custom)
11. **Settings**
12. **Themes**

### Navigation must be:

* Fast
* Brutalist
* Minimalist

---

# 18. Technical Requirements

* Expo-managed workflow
* React Native Skia for all graphics
* Expo SecureStore for identity
* AsyncStorage/MMKV for game data
* Supabase integration for:
  * Daily challenges
  * Leaderboards
  * Push notifications
  * Analytics
* Must function fully offline
* Must degrade gracefully without internet
* Rewarded ads disabled when offline

---

# 19. Database Schema (Supabase)

### Core Tables:

```sql
-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY,
  internal_id TEXT UNIQUE NOT NULL,
  game_center_id TEXT,
  nickname TEXT NOT NULL,
  country TEXT,
  region TEXT,
  notification_enabled BOOLEAN DEFAULT true,
  notification_time TIME DEFAULT '09:00',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Daily Challenges
CREATE TABLE daily_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_date DATE UNIQUE NOT NULL,
  grid_type TEXT NOT NULL DEFAULT '9x9',
  difficulty TEXT NOT NULL,
  puzzle_grid JSONB NOT NULL,
  solution_grid JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Daily Challenge Completions
CREATE TABLE daily_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  challenge_date DATE NOT NULL,
  time_seconds INTEGER NOT NULL,
  mistakes INTEGER DEFAULT 0,
  hints_used INTEGER DEFAULT 0,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, challenge_date)
);

-- Game Sessions
CREATE TABLE game_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  grid_type TEXT NOT NULL,
  difficulty TEXT NOT NULL,
  time_seconds INTEGER,
  mistakes INTEGER DEFAULT 0,
  hints_used INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

# 20. Testing Requirements

Test:

* Full offline mode
* Ad success/failure
* 5-game limit and unlock flow
* Timer correctness
* Undo functionality
* Puzzle validation (6×6 and 9×9)
* Puzzle uniqueness (no multiple solutions)
* Skia rendering performance
* Dark/light mode switching
* iPad landscape usage
* Long sessions + background resume
* Daily challenge sync
* Push notification delivery

---

# 21. Release Roadmap

### Phase 1 — Core MVP

* Offline puzzles (9×9)
* Skia board rendering
* Number pad
* Notes
* Timer
* Mistakes
* Completion summary
* Brutalist design
* Light/dark mode
* 6 difficulty levels

### Phase 2 — Grid Types & Monetization

* 6×6 Mini Sudoku support
* Runtime puzzle generation
* Uniqueness validation
* Rewarded ads
* 5-game session limits
* Banner/interstitial ads

### Phase 3 — Daily & Social

* Daily Challenge system
* Daily puzzle cron job
* Daily leaderboards
* Push notifications
* Streak tracking

### Phase 4 — Deep UX

* Chapter mode
* Chapter map
* Smart hints
* XP progression

### Phase 5 — Integrations

* Game Center
* Achievements
* Backend sync
* Custom leaderboards

### Phase 6 — Enhancements

* Themes
* Seasonal events
* Advanced animations

---

# 22. Subscription Model: Ad-Free Plan ($5/month) – RevenueCat Integration

## 22.1 Overview

The game will offer a single optional subscription:

**Ad-Free Mode — $4.99/month**

Removes:

* Rewarded ads (replaced with free boosts)
* Interstitial ads
* Banner ads
* **5-game limit** (unlimited games)

The subscription does NOT affect:

* Gameplay difficulty
* Puzzle access
* XP or progression
* Daily challenge

This ensures a clean, ethical monetization model.

## 22.2 RevenueCat Integration Requirements

### Products

RevenueCat entitlements and offerings:

* Offering ID: default
* Package ID: monthly
* Product ID (App Store): com.yourapp.adfree.monthly
* Entitlement ID: adfree

### Subscription Logic

When user purchases subscription:

* Activate entitlement adfree
* Hide all ads immediately
* Remove 5-game limit
* Convert all rewarded ad features to:
  * Free unlimited hints per day OR
  * Free game unlocks

User must never see ads again as long as entitlement is active.

### Offline Behavior

Subscription status cached by RevenueCat SDK

If offline:

* Use cached entitlements
* Continue honoring ad-free mode

When online:

* Sync with RevenueCat backend

## 22.3 Ad-Free Feature Behavior

### Remove All Ads

When entitlement active:

* Remove interstitial ads after puzzles
* Remove banners from Home/Stats/Settings
* Remove rewarded ads from hint/puzzle unlock flows
* Remove 5-game session limit

### Replace Rewarded Ads With Free Actions

When user taps:

* "Watch Ad to get +1 hint" → becomes "Get Hint"
* "Watch Ad to unlock +5 games" → becomes hidden (unlimited)

No ad shown.

### Visual Indicators

Add a small "Ad-Free Mode" tag:

* In settings
* On puzzle screen (optional)
* On bottom of Home screen (optional)

## 22.4 Subscription UX Flow

### Entry Points

User can purchase subscription from:

* Settings screen → "Remove Ads"
* After finishing puzzle (small upsell card)
* When hitting 5-game limit
* Chapter completion reward screen (small upsell)

### Paywall Design

A brutalist-style paywall:

* Black & white design
* Large header: Remove Ads
* Simple description: "Play distraction-free. No ads. Just pure Sudoku."
* Big price block: $4.99/month
* Benefits list:
  * No interstitial ads
  * No banner ads
  * Unlimited games
  * All rewarded boosts unlocked automatically
* "Start Free Trial" optional (if you want later)
* Restore Purchases button at bottom

## 22.5 Entitlement Handling

### States:

**Active Entitlement**

* Remove ads
* Unlimited games
* Unlock free boosts
* Show "Ad-Free Mode Active" in settings

**Expired Entitlement**

* Re-enable ads
* Restore 5-game limit
* Boosts return to rewarded ad requirements

**Uncertain State (offline/no cached entitlement)**

* Use last known cached value
* Do not penalize user if uncertain
* Always fail safe in user's favor

## 22.6 Settings Screen Updates

Add a Subscription section:

* Subscription Status: Active / Not Active / Expired
* Manage Subscription → Opens App Store subscription page
* Restore Purchases (mandatory per Apple)

## 22.7 Analytics & Tracking

Track:

* Subscription conversion
* Subscription cancellation
* Times user opens paywall
* Which screen initiated a subscription attempt
* Boost usage before/after subscription

(Handled through RevenueCat + your analytics)

## 22.8 Compliance

### Apple Requirements:

* "Restore Purchases" must be visible
* Paywall must be clear and honest
* No gated gameplay behind subscription
* Subscription must only remove ads / unlock convenience

### GDPR / Privacy:

* Subscription data tracked by RevenueCat, not stored by you

---

# 23. Future Ideas & Enhancements

The following features are planned for future releases:

## 23.1 Stats & Profile Screen

A dedicated screen displaying comprehensive user statistics:

### User Profile Section
* User avatar/icon
* Nickname
* Total XP and Level
* Member since date
* Country/Region

### Statistics Dashboard
* Total games played (by grid type and difficulty)
* Win rate percentage
* Best times per difficulty level
* Average completion times
* Total time played

### Streaks & Progress
* Current streak (daily play)
* Best streak achieved
* Daily challenge streak
* Chapters completed
* Achievements unlocked count

### Game History
* Last 10-20 game results
* Filterable by difficulty/grid type
* Time, mistakes, hints used per game
* Date played

### Visual Elements
* Brutalist stat cards with thick borders
* Progress bars for XP to next level
* Streak calendar view (last 30 days)
* Mini graphs for time trends

---

## 23.2 Social Sharing

* Share daily challenge results as image
* Challenge friends via link
* Compare stats with friends

## 23.3 Themes & Customization

* Additional color themes
* Custom fonts
* Board style variations

## 23.4 Advanced Game Modes

* Timed challenges
* Zen mode (no timer, no mistakes)
* Puzzle of the week

---

# Summary

| Feature | Details |
|---------|---------|
| Grid Types | 9×9 Standard, 6×6 Mini |
| Difficulties | Easy, Medium, Hard, Extreme, Insane, Inhuman |
| Daily Challenge | Same puzzle for all users, stored in DB |
| Game Limit | 5 games free, watch ad for 5 more |
| Subscription | $4.99/month removes all ads + unlimited games |
| Notifications | Daily reminder via cron job |
| Offline | Fully functional with bundled + generated puzzles |
