# Monetization (AdMob)

## Ad Strategy by Game Mode

Each game mode has a distinct ad strategy to provide the best user experience:

### 1. Chapters Mode (Journey)

**Ad Type:** Interstitial (every 3 completed puzzles)

**Flow:**
1. User completes a chapter puzzle
2. Chapter completion modal shows (stats, continue button)
3. User presses "Continue" to play next puzzle
4. If 3 puzzles completed since last ad, show interstitial
5. After ad (or if no ad needed), start next puzzle

**Configuration:**
- Interstitial frequency: Every 3 games (`CHAPTERS_INTERSTITIAL_FREQUENCY = 3`)
- No session limits - users can play unlimited chapter puzzles
- Progress tracked via `chapterGamesCompleted` counter

### 2. Free Run Mode (Practice)

**Ad Type:** Rewarded (session limit of 5 games)

**Flow:**
1. User can play 5 games for free per session
2. After 5 games, show "Game Limit" modal
3. User watches rewarded ad to unlock 5 more games
4. No interstitial ads between games

**Configuration:**
- Games per session: 5 (`FREERUN_GAMES_PER_SESSION = 5`)
- Games unlocked per ad: 5 (`FREERUN_GAMES_PER_REWARD = 5`)
- Session resets daily at midnight (local time)

### 3. Daily Challenge Mode

**Ad Type:** None

**Details:**
- No ads in daily challenges
- Competition-based with leaderboard
- One puzzle per day, worldwide
- Users can view their completed daily with stats

## Rewarded Ads (User-triggered only)

Rewards:
- +5 games (Free Run session unlock)
- +1 hint
- XP boost
- Retry option
- Chapter finale bonus (optional)

Rewards must trigger only after full ad completion.

## Banner Ads

Shown on:
- Home screen
- Stats screen
- Settings screen
- Chapters selection screen
- Free Run selection screen

Banners forbidden on:
- Puzzle board (during gameplay)
- Onboarding
- Completion modal screens
- Daily Challenge screen

## Ad-Free Subscribers

Benefits:
- Unlimited games in all modes
- No interstitial ads
- No banner ads
- No session limits
