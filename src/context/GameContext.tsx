/**
 * Game state management context.
 * Handles game state, puzzle loading, timer, and conflict detection for Sudoku gameplay.
 */

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { loadData, saveData, removeData, STORAGE_KEYS } from '../utils/storage';
import { getRandomPuzzle } from '../game/puzzles';
import { GridType, Difficulty, GRID_CONFIGS } from '../game/types';
import { isValidMove } from '../game/engine';
import { analyzeForHint, SmartHint } from '../game/hintAnalyzer';
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
  hintsUsed: number;
  timer: number;
  isComplete: boolean;
  isLoading: boolean;
  isPaused: boolean;
  notes: Record<string, number[]>;
  history: string[];
  conflictCells: string[]; // Array of "row-col" strings
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
  hintsUsed: number;
  notes: Record<string, number[]>;
  history?: string[]; // Undo history (optional for backwards compatibility)
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
  getSmartHint: () => SmartHint | null;
  applyHint: (hint: SmartHint) => void;
  devAutoComplete: () => void;
  saveChapterProgress: (puzzleNumber: number) => Promise<void>;
  loadChapterProgress: () => Promise<ChapterInProgress | null>;
  clearChapterProgress: () => Promise<void>;
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
  hintsUsed: 0,
  timer: 0,
  isComplete: false,
  isLoading: false,
  isPaused: false,
  notes: {},
  history: [],
  conflictCells: [],
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
  }, []);

  /**
   * Load a saved puzzle with existing progress (for resuming mid-game)
   */
  const loadSavedPuzzleWithProgress = useCallback((data: SavedPuzzleWithProgress) => {
    const { puzzleId, difficulty, gridType, initialGrid, grid, solution, timer, mistakes, hintsUsed, notes, history } = data;

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
      hintsUsed,
      notes: { ...notes },
      history: history || [], // Restore undo history
      isLoading: false,
      isPaused: false,
      conflictCells: findConflictCells(grid, gridType),
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
      hintsUsed: currentState.hintsUsed,
      notes: currentState.notes,
      savedAt: new Date().toISOString(),
      history: currentState.history,
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

  const updateCell = useCallback((row: number, col: number, value: number) => {
    if (!gameState || gameState.isLoading) return;

    // Can't modify initial cells
    if (gameState.initialGrid[row][col] !== 0) return;

    // Record current grid state in history (for undo)
    const snapshot = JSON.stringify(gameState.grid);
    const newHistory = [...gameState.history, snapshot].slice(-50); // Keep last 50 moves

    // Deep copy grid
    const newGrid = gameState.grid.map(r => [...r]);
    newGrid[row][col] = value;

    // Find conflicts
    const conflictCells = findConflictCells(newGrid, gameState.gridType);

    // Check for completion (all cells filled and match solution)
    const isComplete = newGrid.every((gridRow, r) =>
      gridRow.every((cell, c) => cell === gameState.solution[r][c])
    );

    setGameState(prev => prev ? ({
      ...prev,
      grid: newGrid,
      history: newHistory,
      conflictCells,
      isComplete,
    }) : null);
  }, [gameState]);

  const addNote = useCallback((row: number, col: number, value: number) => {
    if (!gameState || gameState.isLoading) return;

    const key = `${row}-${col}`;
    const currentNotes = gameState.notes[key] || [];

    if (!currentNotes.includes(value)) {
      setGameState(prev => prev ? ({
        ...prev,
        notes: {
          ...prev.notes,
          [key]: [...currentNotes, value].sort((a, b) => a - b),
        },
      }) : null);
    }
  }, [gameState]);

  const removeNote = useCallback((row: number, col: number, value: number) => {
    if (!gameState || gameState.isLoading) return;

    const key = `${row}-${col}`;
    const currentNotes = gameState.notes[key] || [];

    setGameState(prev => prev ? ({
      ...prev,
      notes: {
        ...prev.notes,
        [key]: currentNotes.filter(n => n !== value),
      },
    }) : null);
  }, [gameState]);

  const undo = useCallback(() => {
    if (!gameState || gameState.history.length === 0) return;

    // Pop the last state from history
    const history = [...gameState.history];
    const previousGrid = JSON.parse(history.pop()!) as number[][];

    setGameState(prev => prev ? ({
      ...prev,
      grid: previousGrid,
      history,
      conflictCells: findConflictCells(previousGrid, prev.gridType),
      isComplete: false, // Undo can't result in completion
    }) : null);
  }, [gameState]);

  const resetBoard = useCallback(() => {
    if (!gameState) return;

    // Reset grid to initial state, clear history and notes
    const resetGrid = gameState.initialGrid.map(row => [...row]);
    setGameState(prev => prev ? ({
      ...prev,
      grid: resetGrid,
      history: [],
      notes: {},
      conflictCells: findConflictCells(resetGrid, prev.gridType),
      isComplete: false,
    }) : null);
  }, [gameState]);

  const pauseGame = useCallback(() => {
    setGameState(prev => prev ? ({ ...prev, isPaused: true }) : null);
  }, []);

  const resumeGame = useCallback(() => {
    setGameState(prev => prev ? ({ ...prev, isPaused: false }) : null);
  }, []);

  const getSmartHint = useCallback((): SmartHint | null => {
    if (!gameState || gameState.isLoading || gameState.isComplete) return null;
    return analyzeForHint(gameState.grid, gameState.solution, gameState.gridType);
  }, [gameState]);

  const applyHint = useCallback((hint: SmartHint) => {
    if (!gameState || gameState.isLoading) return;

    const { row, col } = hint.cell;
    const value = hint.value;

    // Can't modify initial cells
    if (gameState.initialGrid[row][col] !== 0) return;

    // Deep copy grid
    const newGrid = gameState.grid.map(r => [...r]);
    newGrid[row][col] = value;

    // Clear notes for this cell
    const key = `${row}-${col}`;
    const newNotes = { ...gameState.notes };
    delete newNotes[key];

    // Find conflicts
    const conflictCells = findConflictCells(newGrid, gameState.gridType);

    // Check for completion
    const isComplete = newGrid.every((gridRow, r) =>
      gridRow.every((cell, c) => cell === gameState.solution[r][c])
    );

    setGameState(prev => prev ? ({
      ...prev,
      grid: newGrid,
      notes: newNotes,
      conflictCells,
      isComplete,
      hintsUsed: prev.hintsUsed + 1,
    }) : null);
  }, [gameState]);

  // DEV ONLY: Auto-complete the puzzle with the solution
  const devAutoComplete = useCallback(() => {
    if (!gameState || gameState.isLoading || gameState.isComplete) return;

    // Copy the solution to the grid
    const newGrid = gameState.solution.map(r => [...r]);

    setGameState(prev => prev ? ({
      ...prev,
      grid: newGrid,
      notes: {},
      conflictCells: [],
      isComplete: true,
    }) : null);
  }, [gameState]);

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
      getSmartHint,
      applyHint,
      devAutoComplete,
      saveChapterProgress,
      loadChapterProgress,
      clearChapterProgress,
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
