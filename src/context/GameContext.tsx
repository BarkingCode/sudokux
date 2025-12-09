/**
 * Game state management context.
 * Handles game state, puzzle loading, timer, and conflict detection for Sudoku gameplay.
 */

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { loadData, saveData, removeData, STORAGE_KEYS } from '../utils/storage';
import { getRandomPuzzle } from '../game/puzzles';
import { GridType, Difficulty, GRID_CONFIGS } from '../game/types';
import { isValidMove } from '../game/engine';
import { logGameStarted } from '../services/facebookAnalytics';
import type { SmartHint } from '../game/hintAnalyzer';
import type { ChapterInProgress } from '../services/chapterService';

// Re-export types for convenience
export type { Difficulty } from '../game/types';
export type { GridType } from '../game/types';

export interface GameState {
  puzzleId: string | null;
  difficulty: Difficulty;
  gridType: GridType;
  grid: number[][];
  initialGrid: number[][];
  solution: number[][];
  mistakes: number;
  helperUsed: number;
  timer: number;
  isComplete: boolean;
  isLoading: boolean;
  isPaused: boolean;
  notes: Record<string, number[]>;
  history: string[];
  conflictCells: string[]; // Array of "row-col" strings
  isHelperUnlocked: boolean; // Smart Possibility Helper unlocked for this game
  isHelperActive: boolean; // Whether helper is currently toggled on (can only be true if unlocked)
}

export type { SmartHint } from '../game/hintAnalyzer';

interface DailyPuzzleData {
  puzzleId: string;
  difficulty: Difficulty;
  gridType: GridType;
  puzzle: number[][];
  solution: number[][];
}

export interface SavedPuzzleData {
  puzzleId: string;
  difficulty: Difficulty;
  gridType: GridType;
  puzzle: number[][];
  solution: number[][];
}

export interface SavedPuzzleWithProgress extends SavedPuzzleData {
  initialGrid: number[][];
  grid: number[][];
  timer: number;
  mistakes: number;
  helperUsed: number;
  notes: Record<string, number[]>;
  history?: string[]; // Undo history (optional for backwards compatibility)
  isHelperUnlocked?: boolean; // Whether helper was unlocked for this game
  isHelperActive?: boolean; // Whether helper is currently active
}

export interface DailyInProgress {
  challengeDate: string;
  challengeId: string;
  difficulty: Difficulty;
  gridType: GridType;
  initialGrid: number[][];
  currentGrid: number[][];
  solution: number[][];
  timer: number;
  mistakes: number;
  helperUsed: number;
  isHelperUnlocked: boolean;
  isHelperActive: boolean;
  notes: Record<string, number[]>;
  savedAt: string;
  history?: string[];
}

interface GameContextType {
  gameState: GameState | null;
  startNewGame: (difficulty: Difficulty, gridType?: GridType) => void;
  loadDailyPuzzle: (data: DailyPuzzleData) => void;
  loadSavedPuzzle: (data: SavedPuzzleData) => void;
  loadSavedPuzzleWithProgress: (data: SavedPuzzleWithProgress) => void;
  updateCell: (row: number, col: number, value: number) => void;
  addNote: (row: number, col: number, value: number) => void;
  removeNote: (row: number, col: number, value: number) => void;
  undo: () => void;
  resetBoard: () => void;
  pauseGame: () => void;
  resumeGame: () => void;
  unlockHelper: () => void;
  toggleHelper: () => void;
  devAutoComplete: () => void;
  saveChapterProgress: (puzzleNumber: number) => Promise<void>;
  loadChapterProgress: () => Promise<ChapterInProgress | null>;
  clearChapterProgress: () => Promise<void>;
  saveDailyProgress: (challengeDate: string, challengeId: string) => Promise<void>;
  loadDailyProgress: () => Promise<DailyInProgress | null>;
  clearDailyProgress: () => Promise<void>;
  incrementMistakes: () => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

/**
 * Creates an empty grid of the specified size.
 */
const createEmptyGridForType = (gridType: GridType): number[][] => {
  const size = GRID_CONFIGS[gridType].gridSize;
  return Array.from({ length: size }, () => Array(size).fill(0));
};

const createInitialState = (gridType: GridType = '9x9'): GameState => ({
  puzzleId: null,
  difficulty: 'easy',
  gridType,
  grid: createEmptyGridForType(gridType),
  initialGrid: createEmptyGridForType(gridType),
  solution: createEmptyGridForType(gridType),
  mistakes: 0,
  helperUsed: 0,
  timer: 0,
  isComplete: false,
  isLoading: false,
  isPaused: false,
  notes: {},
  history: [],
  conflictCells: [],
  isHelperUnlocked: false,
  isHelperActive: false,
});

/**
 * Finds all cells that have conflicts (same number in row, column, or box).
 */
const findConflictCells = (grid: number[][], gridType: GridType): string[] => {
  const config = GRID_CONFIGS[gridType];
  const conflicts: Set<string> = new Set();

  for (let row = 0; row < config.gridSize; row++) {
    for (let col = 0; col < config.gridSize; col++) {
      const value = grid[row][col];
      if (value !== 0) {
        // Check if this cell has a conflict
        if (!isValidMove(grid, row, col, value, config)) {
          conflicts.add(`${row}-${col}`);
        }
      }
    }
  }

  return Array.from(conflicts);
};

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Ref to access current gameState in stable callbacks (avoids dependency issues)
  const gameStateRef = useRef<GameState | null>(null);

  // Keep ref in sync with state
  gameStateRef.current = gameState;

  // NOTE: Auto-load and auto-save of global GAME_STATE removed.
  // Each game mode (Chapters, Daily, Free Run) now manages its own persistence:
  // - Chapters: Uses CHAPTER_IN_PROGRESS for mid-game saves
  // - Daily: No persistence needed (fresh each day)
  // - Free Run: Uses FREERUN_GAME_STATE (managed by freerun.tsx)

  // Timer effect
  useEffect(() => {
    // Clear any existing timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // Start timer if game is active
    if (gameState && !gameState.isComplete && !gameState.isPaused && !gameState.isLoading) {
      timerRef.current = setInterval(() => {
        setGameState(prev => prev ? ({
          ...prev,
          timer: prev.timer + 1,
        }) : null);
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [gameState?.isComplete, gameState?.isPaused, gameState?.isLoading]);

  const startNewGame = useCallback(async (
    difficulty: Difficulty,
    gridType: GridType = '9x9'
  ) => {
    // Set loading state immediately (clears old game)
    setGameState({
      ...createInitialState(gridType),
      difficulty,
      isLoading: true,
    });

    // Load puzzle - always generate fresh (bundled files have limited puzzles)
    const puzzle = await getRandomPuzzle(difficulty, gridType, true);

    if (!puzzle) {
      console.error('Failed to load puzzle');
      setGameState(prev => prev ? { ...prev, isLoading: false } : null);
      return;
    }

    // Set new game state with puzzle
    const newState: GameState = {
      ...createInitialState(gridType),
      difficulty,
      gridType,
      grid: puzzle.puzzle.map(row => [...row]),
      initialGrid: puzzle.puzzle.map(row => [...row]),
      solution: puzzle.solution.map(row => [...row]),
      puzzleId: Date.now().toString(),
      isLoading: false,
      isPaused: false,
    };
    setGameState(newState);

    // Log Facebook analytics event
    logGameStarted(difficulty, gridType);
  }, []);

  const loadDailyPuzzle = useCallback((data: DailyPuzzleData) => {
    const { puzzleId, difficulty, gridType, puzzle, solution } = data;

    const newState: GameState = {
      ...createInitialState(gridType),
      difficulty,
      gridType,
      grid: puzzle.map(row => [...row]),
      initialGrid: puzzle.map(row => [...row]),
      solution: solution.map(row => [...row]),
      puzzleId,
      isLoading: false,
      isPaused: false,
    };
    setGameState(newState);

    // Log Facebook analytics event
    logGameStarted(difficulty, gridType);
  }, []);

  /**
   * Load a saved puzzle (e.g., for chapter replay)
   */
  const loadSavedPuzzle = useCallback((data: SavedPuzzleData) => {
    const { puzzleId, difficulty, gridType, puzzle, solution } = data;

    const newState: GameState = {
      ...createInitialState(gridType),
      difficulty,
      gridType,
      grid: puzzle.map(row => [...row]),
      initialGrid: puzzle.map(row => [...row]),
      solution: solution.map(row => [...row]),
      puzzleId,
      isLoading: false,
      isPaused: false,
    };
    setGameState(newState);

    // Log Facebook analytics event
    logGameStarted(difficulty, gridType);
  }, []);

  /**
   * Load a saved puzzle with existing progress (for resuming mid-game)
   */
  const loadSavedPuzzleWithProgress = useCallback((data: SavedPuzzleWithProgress) => {
    const { puzzleId, difficulty, gridType, initialGrid, grid, solution, timer, mistakes, helperUsed, notes, history, isHelperUnlocked, isHelperActive } = data;

    const newState: GameState = {
      ...createInitialState(gridType),
      difficulty,
      gridType,
      grid: grid.map(row => [...row]),
      initialGrid: initialGrid.map(row => [...row]),
      solution: solution.map(row => [...row]),
      puzzleId,
      timer,
      mistakes,
      helperUsed,
      notes: { ...notes },
      history: history || [], // Restore undo history
      isLoading: false,
      isPaused: false,
      conflictCells: findConflictCells(grid, gridType),
      isHelperUnlocked: isHelperUnlocked ?? false, // Restore helper unlock status
      isHelperActive: isHelperActive ?? false, // Restore helper active status
    };
    setGameState(newState);
  }, []);

  /**
   * Save current chapter progress to storage
   * Uses ref to access current gameState for stability (prevents infinite loops)
   */
  const saveChapterProgress = useCallback(async (puzzleNumber: number) => {
    const currentState = gameStateRef.current;
    if (!currentState || currentState.isComplete) return;

    const inProgress: ChapterInProgress = {
      puzzleNumber,
      difficulty: currentState.difficulty,
      gridType: currentState.gridType,
      initialGrid: currentState.initialGrid,
      currentGrid: currentState.grid,
      solution: currentState.solution,
      timer: currentState.timer,
      mistakes: currentState.mistakes,
      helperUsed: currentState.helperUsed,
      notes: currentState.notes,
      savedAt: new Date().toISOString(),
      history: currentState.history,
      isHelperUnlocked: currentState.isHelperUnlocked,
      isHelperActive: currentState.isHelperActive,
    };

    await saveData(STORAGE_KEYS.CHAPTER_IN_PROGRESS, inProgress);
  }, []);

  /**
   * Load chapter progress from storage
   */
  const loadChapterProgress = useCallback(async (): Promise<ChapterInProgress | null> => {
    return await loadData<ChapterInProgress>(STORAGE_KEYS.CHAPTER_IN_PROGRESS);
  }, []);

  /**
   * Clear chapter progress from storage
   */
  const clearChapterProgress = useCallback(async () => {
    await removeData(STORAGE_KEYS.CHAPTER_IN_PROGRESS);
  }, []);

  /**
   * Save current daily progress to storage
   * Uses ref to access current gameState for stability
   */
  const saveDailyProgress = useCallback(async (challengeDate: string, challengeId: string) => {
    const currentState = gameStateRef.current;
    if (!currentState || currentState.isComplete) return;

    const inProgress: DailyInProgress = {
      challengeDate,
      challengeId,
      difficulty: currentState.difficulty,
      gridType: currentState.gridType,
      initialGrid: currentState.initialGrid,
      currentGrid: currentState.grid,
      solution: currentState.solution,
      timer: currentState.timer,
      mistakes: currentState.mistakes,
      helperUsed: currentState.helperUsed,
      isHelperUnlocked: currentState.isHelperUnlocked,
      isHelperActive: currentState.isHelperActive,
      notes: currentState.notes,
      savedAt: new Date().toISOString(),
      history: currentState.history,
    };

    await saveData(STORAGE_KEYS.DAILY_GAME_STATE, inProgress);
  }, []);

  /**
   * Load daily progress from storage
   */
  const loadDailyProgress = useCallback(async (): Promise<DailyInProgress | null> => {
    return await loadData<DailyInProgress>(STORAGE_KEYS.DAILY_GAME_STATE);
  }, []);

  /**
   * Clear daily progress from storage
   */
  const clearDailyProgress = useCallback(async () => {
    await removeData(STORAGE_KEYS.DAILY_GAME_STATE);
  }, []);

  const updateCell = useCallback((row: number, col: number, value: number) => {
    setGameState(prev => {
      if (!prev || prev.isLoading) return prev;

      // Can't modify initial cells
      if (prev.initialGrid[row][col] !== 0) return prev;

      // Record current grid state in history (for undo)
      const snapshot = JSON.stringify(prev.grid);
      const newHistory = [...prev.history, snapshot].slice(-50); // Keep last 50 moves

      // Deep copy grid
      const newGrid = prev.grid.map(r => [...r]);
      newGrid[row][col] = value;

      // Find conflicts
      const conflictCells = findConflictCells(newGrid, prev.gridType);

      // Check for completion (all cells filled and match solution)
      const isComplete = newGrid.every((gridRow, r) =>
        gridRow.every((cell, c) => cell === prev.solution[r][c])
      );

      return {
        ...prev,
        grid: newGrid,
        history: newHistory,
        conflictCells,
        isComplete,
      };
    });
  }, []);

  const addNote = useCallback((row: number, col: number, value: number) => {
    setGameState(prev => {
      if (!prev || prev.isLoading) return prev;

      const key = `${row}-${col}`;
      const currentNotes = prev.notes[key] || [];

      if (currentNotes.includes(value)) return prev;

      return {
        ...prev,
        notes: {
          ...prev.notes,
          [key]: [...currentNotes, value].sort((a, b) => a - b),
        },
      };
    });
  }, []);

  const removeNote = useCallback((row: number, col: number, value: number) => {
    setGameState(prev => {
      if (!prev || prev.isLoading) return prev;

      const key = `${row}-${col}`;
      const currentNotes = prev.notes[key] || [];

      return {
        ...prev,
        notes: {
          ...prev.notes,
          [key]: currentNotes.filter(n => n !== value),
        },
      };
    });
  }, []);

  const undo = useCallback(() => {
    setGameState(prev => {
      if (!prev || prev.history.length === 0) return prev;

      // Pop the last state from history
      const history = [...prev.history];
      const previousGrid = JSON.parse(history.pop()!) as number[][];

      return {
        ...prev,
        grid: previousGrid,
        history,
        conflictCells: findConflictCells(previousGrid, prev.gridType),
        isComplete: false, // Undo can't result in completion
      };
    });
  }, []);

  const resetBoard = useCallback(() => {
    setGameState(prev => {
      if (!prev) return prev;

      // Reset grid to initial state, clear history and notes
      const resetGrid = prev.initialGrid.map(row => [...row]);

      return {
        ...prev,
        grid: resetGrid,
        history: [],
        notes: {},
        conflictCells: findConflictCells(resetGrid, prev.gridType),
        isComplete: false,
      };
    });
  }, []);

  const pauseGame = useCallback(() => {
    setGameState(prev => prev ? ({ ...prev, isPaused: true }) : null);
  }, []);

  const resumeGame = useCallback(() => {
    setGameState(prev => prev ? ({ ...prev, isPaused: false }) : null);
  }, []);

  /**
   * Unlock the Smart Possibility Helper for the current game.
   * Called after user watches a rewarded ad.
   * Increments helperUsed by 1 for point penalty calculation.
   * Also activates helper immediately.
   */
  const unlockHelper = useCallback(() => {
    setGameState(prev => prev ? ({
      ...prev,
      isHelperUnlocked: true,
      isHelperActive: true,
      helperUsed: prev.helperUsed + 1,
    }) : null);
  }, []);

  /**
   * Toggle the Smart Possibility Helper on/off.
   * Only works if helper has been unlocked for this game.
   */
  const toggleHelper = useCallback(() => {
    setGameState(prev => {
      if (!prev || !prev.isHelperUnlocked) return prev;
      return {
        ...prev,
        isHelperActive: !prev.isHelperActive,
      };
    });
  }, []);

  // DEV ONLY: Auto-complete the puzzle with the solution
  const devAutoComplete = useCallback(() => {
    setGameState(prev => {
      if (!prev || prev.isLoading || prev.isComplete) return prev;

      // Copy the solution to the grid
      const newGrid = prev.solution.map(r => [...r]);

      return {
        ...prev,
        grid: newGrid,
        notes: {},
        conflictCells: [],
        isComplete: true,
      };
    });
  }, []);

  /**
   * Increment the mistake counter (called when user enters wrong number)
   */
  const incrementMistakes = useCallback(() => {
    setGameState(prev => prev ? ({
      ...prev,
      mistakes: prev.mistakes + 1,
    }) : null);
  }, []);

  return (
    <GameContext.Provider value={{
      gameState,
      startNewGame,
      loadDailyPuzzle,
      loadSavedPuzzle,
      loadSavedPuzzleWithProgress,
      updateCell,
      addNote,
      removeNote,
      undo,
      resetBoard,
      pauseGame,
      resumeGame,
      unlockHelper,
      toggleHelper,
      devAutoComplete,
      saveChapterProgress,
      loadChapterProgress,
      clearChapterProgress,
      saveDailyProgress,
      loadDailyProgress,
      clearDailyProgress,
      incrementMistakes,
    }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};
