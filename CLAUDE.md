# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SudokuX is an offline-first Sudoku game for iOS/Android built with Expo and React Native. It features a brutalist black-and-white design aesthetic, React Native Skia for graphics rendering, and Reanimated/Moti for animations.

## Development Commands

```bash
# Start Expo development server
npm start

# Run on iOS simulator (requires native build)
npx expo run:ios

# Run on Android emulator (requires native build)
npx expo run:android

# Run web version
npm run web
```

Since this project uses `expo-dev-client` for native modules (Skia, AdMob), you must use `expo run:ios` or `expo run:android` instead of Expo Go.

## Architecture

### Navigation & Routing
- Uses **expo-router** with file-based routing
- Entry point: `app/_layout.tsx` wraps the app in `ThemeProvider` → `GameProvider` → `Stack`
- Routes: `app/index.tsx` (home), `app/game.tsx` (game screen)

### State Management
Two React Contexts handle global state:
- **ThemeContext** (`src/context/ThemeContext.tsx`): Light/dark/system mode with brutalist color palettes
- **GameContext** (`src/context/GameContext.tsx`): Game state including grid, notes, mistakes, timer, undo history, gridType

### Game Engine
- **Types**: `src/game/types.ts` - Grid configs, difficulty types, GeneratedPuzzle interface
- **Core logic**: `src/game/engine.ts` - Parameterized validation, solving (backtracking), board utilities
- **Solver**: `src/game/solver.ts` - Solution counting with early termination for uniqueness validation
- **Generator**: `src/game/generator.ts` - Runtime puzzle generation with guaranteed unique solutions
- **Difficulty**: `src/game/difficulty.ts` - Difficulty parameters per grid type
- **Puzzle loading**: `src/game/puzzles.ts` - Loads from bundled JSON or generates at runtime

### Grid Types
Two grid sizes supported:
- **9x9 Standard**: Classic Sudoku with 3x3 boxes
- **6x6 Mini**: Mini Sudoku with 2x3 boxes (numbers 1-6)

### Difficulty Levels
Six difficulty levels (clue counts for 9x9 / 6x6):
| Level | 9x9 Clues | 6x6 Clues | Description |
|-------|-----------|-----------|-------------|
| Easy | ~51 | ~26 | Beginner-friendly, naked singles |
| Medium | ~41 | ~22 | Hidden singles |
| Hard | ~31 | ~18 | Pointing pairs, box/line reduction |
| Extreme | ~26 | ~15 | Naked/hidden pairs/triples |
| Insane | ~23 | ~12 | X-Wing, Swordfish |
| Inhuman | ~19 | ~10 | Near-minimum clues |

### Puzzle Generation
- **Runtime generation**: Uses backtracking with uniqueness validation
- **Uniqueness check**: Solution counting stops at 2 for efficiency
- **Bundled puzzles**: JSON files for 9x9 easy/medium/hard as fallback
- **6x6 puzzles**: Always generated at runtime (no bundled files)

### Puzzle Data
Bundled puzzles stored as JSON in `src/assets/puzzles/`:
- `easy.json`, `medium.json`, `hard.json` (9x9 only)
- Each puzzle has: `puzzle_id`, `puzzle_grid`, `solution_grid`, `difficulty_score`

### UI Components
- Board components in `src/components/board/` - rendered with React Native Skia
- `SudokuBoard.tsx` - Dynamic grid rendering based on gridType
- `Cell.tsx` - Dynamic box borders using boxRows/boxCols
- `NumberPad.tsx` - Shows 1-6 or 1-9 based on grid type
- `BrutalistButton.tsx`, `BrutalistText.tsx` - Styled components following brutalist design

### Storage
- `src/utils/storage.ts` - AsyncStorage wrapper for game state and settings
- `src/utils/identity.ts` - User identity with Supabase/Game Center integration

### Backend Services (`src/services/`)
- **gameCenter.ts** - iOS Game Center integration (authentication, leaderboards, achievements)
- **userService.ts** - Supabase user management and Game Center linking
- **statsService.ts** - Game session recording, stats sync, achievement tracking
- **leaderboardService.ts** - Global/country leaderboards from Supabase

### Supabase Integration (`src/lib/`)
- **supabase.ts** - Supabase client configuration
- **database.types.ts** - TypeScript types for database schema
- Database schema: `docs/database-schema.sql`

## Backend Setup

1. Create a Supabase project at supabase.com
2. Run `docs/database-schema.sql` in Supabase SQL Editor
3. Copy `.env.example` to `.env` and add your Supabase URL/key
4. Configure Game Center leaderboards/achievements in App Store Connect

Environment variables:
- `EXPO_PUBLIC_SUPABASE_URL` - Supabase project URL
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key

## Design System

**Brutalist Style Requirements:**
- Black and white primary colors with high contrast
- Thick borders and sharp edges
- Heavy typography
- Minimal/no rounded corners
- Single accent color only if needed

**Theme Colors:**
- Light: white background (#FFFFFF), black text/borders (#000000)
- Dark: black background (#000000), white text/borders (#FFFFFF)
- Mistake highlight: #FF0000 (sharp red)

## Key Patterns

- All Skia graphics rendering for the game board (grid, cells, highlights)
- Offline-first: never rely on network calls for core gameplay
- Grid types: 9x9 Standard and 6x6 Mini Sudoku
- Difficulty modes: Easy, Medium, Hard, Extreme, Insane, Inhuman
- Chapter-based progression with adaptive difficulty
- State persistence via AsyncStorage (game state saved/restored)
- Puzzle generation with guaranteed unique solutions

## Usage Examples

```typescript
// Start a 6x6 mini game on easy
startNewGame('easy', '6x6');

// Start a standard 9x9 game on extreme difficulty
startNewGame('extreme', '9x9');

// Generate a puzzle directly
import { generatePuzzle } from './src/game/generator';
const puzzle = generatePuzzle('9x9', 'insane');
```
