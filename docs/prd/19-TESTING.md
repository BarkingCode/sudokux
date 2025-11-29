# Testing Requirements

## Unit Tests

Located in `__tests__/` directory. Run with `npm test`.

### Game Engine Tests
- `__tests__/game/engine.test.ts` - Validation, solving, board utilities
- `__tests__/game/solver.test.ts` - Backtracking solver, uniqueness checking
- `__tests__/game/generator.test.ts` - Puzzle generation
- `__tests__/game/difficulty.test.ts` - Difficulty parameters
- `__tests__/game/hintAnalyzer.test.ts` - Smart hint logic
- `__tests__/game/seededRandom.test.ts` - Deterministic PRNG
- `__tests__/game/chapterPuzzles.test.ts` - Chapter puzzle generation

### Service Tests
- `__tests__/services/dailyChallengeService.test.ts` - Daily challenge sync
- `__tests__/services/leaderboardService.test.ts` - Leaderboard operations
- `__tests__/services/statsService.test.ts` - Stats recording
- `__tests__/services/userService.test.ts` - User management

## Manual Testing Checklist

### Offline Mode
- [ ] Full gameplay works without network
- [ ] Progress saves locally
- [ ] Syncs when back online

### Chapter Mode
- [ ] Puzzles are deterministic (same puzzle # = same puzzle)
- [ ] Sequential progression enforced
- [ ] Completed puzzles open in view-only mode
- [ ] View-only shows solved grid with stats
- [ ] Mid-game progress saves on exit
- [ ] Progress restores when resuming
- [ ] Progress clears on completion

### Puzzle Validation
- [ ] 6x6 grid validation
- [ ] 9x9 grid validation
- [ ] Unique solutions only
- [ ] Conflict highlighting works

### Ads
- [ ] Interstitial shows after 3 chapter games
- [ ] Ad failure doesn't block gameplay
- [ ] Ad-free users skip interstitials
- [ ] Rewarded ads work in Free Run

### Timer
- [ ] Pauses on background
- [ ] Pauses on screen unfocus
- [ ] Resumes correctly
- [ ] Saves with progress

### UI/UX
- [ ] Dark/light mode switching
- [ ] iPad landscape layout
- [ ] Skia rendering performance
- [ ] Animations smooth

### Daily Challenge
- [ ] Syncs from server
- [ ] Completion saves
- [ ] View-only for completed
- [ ] Leaderboard updates

### Long Sessions
- [ ] Background resume works
- [ ] Memory stable over time
- [ ] No timer drift

## Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- --testPathPatterns="seededRandom"

# Run with coverage
npm test -- --coverage

# Watch mode
npm test -- --watch
```
