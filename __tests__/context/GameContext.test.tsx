/**
 * Tests for src/context/GameContext.tsx
 * Game state management, timer, conflicts, and game actions.
 */

import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { GameProvider, useGame, GameState } from '../../src/context/GameContext';
import { GRID_CONFIGS } from '../../src/game/types';

// Mock storage
jest.mock('../../src/utils/storage', () => ({
  loadData: jest.fn(() => Promise.resolve(null)),
  saveData: jest.fn(() => Promise.resolve()),
  STORAGE_KEYS: {
    GAME_STATE: 'sudoku_game_state',
  },
}));

// Mock puzzles
jest.mock('../../src/game/puzzles', () => ({
  getRandomPuzzle: jest.fn(() =>
    Promise.resolve({
      puzzle: [
        [5, 3, 0, 0, 7, 0, 0, 0, 0],
        [6, 0, 0, 1, 9, 5, 0, 0, 0],
        [0, 9, 8, 0, 0, 0, 0, 6, 0],
        [8, 0, 0, 0, 6, 0, 0, 0, 3],
        [4, 0, 0, 8, 0, 3, 0, 0, 1],
        [7, 0, 0, 0, 2, 0, 0, 0, 6],
        [0, 6, 0, 0, 0, 0, 2, 8, 0],
        [0, 0, 0, 4, 1, 9, 0, 0, 5],
        [0, 0, 0, 0, 8, 0, 0, 7, 9],
      ],
      solution: [
        [5, 3, 4, 6, 7, 8, 9, 1, 2],
        [6, 7, 2, 1, 9, 5, 3, 4, 8],
        [1, 9, 8, 3, 4, 2, 5, 6, 7],
        [8, 5, 9, 7, 6, 1, 4, 2, 3],
        [4, 2, 6, 8, 5, 3, 7, 9, 1],
        [7, 1, 3, 9, 2, 4, 8, 5, 6],
        [9, 6, 1, 5, 3, 7, 2, 8, 4],
        [2, 8, 7, 4, 1, 9, 6, 3, 5],
        [3, 4, 5, 2, 8, 6, 1, 7, 9],
      ],
      difficulty: 'easy',
      gridType: '9x9',
      clueCount: 30,
    })
  ),
}));

import { loadData, saveData } from '../../src/utils/storage';
import { getRandomPuzzle } from '../../src/game/puzzles';

describe('GameContext', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <GameProvider>{children}</GameProvider>
  );

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    (loadData as jest.Mock).mockResolvedValue(null);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // ============ useGame hook ============

  describe('useGame', () => {
    it('should throw error when used outside GameProvider', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        renderHook(() => useGame());
      }).toThrow('useGame must be used within a GameProvider');

      consoleSpy.mockRestore();
    });

    it('should return game context when inside provider', () => {
      const { result } = renderHook(() => useGame(), { wrapper });

      expect(result.current).toBeDefined();
      expect(result.current.startNewGame).toBeDefined();
      expect(result.current.updateCell).toBeDefined();
      expect(result.current.addNote).toBeDefined();
      expect(result.current.pauseGame).toBeDefined();
    });

    it('should have null gameState initially', () => {
      const { result } = renderHook(() => useGame(), { wrapper });

      expect(result.current.gameState).toBeNull();
    });
  });

  // ============ startNewGame ============

  describe('startNewGame', () => {
    it('should initialize a new game', async () => {
      const { result } = renderHook(() => useGame(), { wrapper });

      await act(async () => {
        result.current.startNewGame('easy', '9x9');
        await Promise.resolve(); // Let the async puzzle loading complete
      });

      expect(result.current.gameState).not.toBeNull();
      expect(result.current.gameState?.difficulty).toBe('easy');
      expect(result.current.gameState?.gridType).toBe('9x9');
    });

    it('should set correct grid size for 9x9', async () => {
      const { result } = renderHook(() => useGame(), { wrapper });

      await act(async () => {
        result.current.startNewGame('medium', '9x9');
        await Promise.resolve();
      });

      expect(result.current.gameState?.grid.length).toBe(9);
      expect(result.current.gameState?.grid[0].length).toBe(9);
    });

    it('should initialize with zero mistakes', async () => {
      const { result } = renderHook(() => useGame(), { wrapper });

      await act(async () => {
        result.current.startNewGame('easy', '9x9');
        await Promise.resolve();
      });

      expect(result.current.gameState?.mistakes).toBe(0);
    });

    it('should initialize with zero hints used', async () => {
      const { result } = renderHook(() => useGame(), { wrapper });

      await act(async () => {
        result.current.startNewGame('easy', '9x9');
        await Promise.resolve();
      });

      expect(result.current.gameState?.helperUsed).toBe(0);
    });

    it('should initialize with zero timer', async () => {
      const { result } = renderHook(() => useGame(), { wrapper });

      await act(async () => {
        result.current.startNewGame('easy', '9x9');
        await Promise.resolve();
      });

      expect(result.current.gameState?.timer).toBe(0);
    });

    it('should not be complete initially', async () => {
      const { result } = renderHook(() => useGame(), { wrapper });

      await act(async () => {
        result.current.startNewGame('easy', '9x9');
        await Promise.resolve();
      });

      expect(result.current.gameState?.isComplete).toBe(false);
    });

    it('should call getRandomPuzzle with correct parameters', async () => {
      const { result } = renderHook(() => useGame(), { wrapper });

      await act(async () => {
        result.current.startNewGame('hard', '9x9');
        await Promise.resolve();
      });

      expect(getRandomPuzzle).toHaveBeenCalledWith('hard', '9x9');
    });
  });

  // ============ updateCell ============

  describe('updateCell', () => {
    it('should update cell value', async () => {
      const { result } = renderHook(() => useGame(), { wrapper });

      await act(async () => {
        result.current.startNewGame('easy', '9x9');
        await Promise.resolve();
      });

      const initialValue = result.current.gameState?.grid[0][2];
      expect(initialValue).toBe(0); // Empty cell

      await act(async () => {
        result.current.updateCell(0, 2, 4);
      });

      expect(result.current.gameState?.grid[0][2]).toBe(4);
    });

    it('should not modify initial clue cells', async () => {
      const { result } = renderHook(() => useGame(), { wrapper });

      await act(async () => {
        result.current.startNewGame('easy', '9x9');
        await Promise.resolve();
      });

      const clueValue = result.current.gameState?.initialGrid[0][0]; // Should be 5
      expect(clueValue).toBe(5);

      await act(async () => {
        result.current.updateCell(0, 0, 9); // Try to change clue
      });

      expect(result.current.gameState?.grid[0][0]).toBe(5); // Unchanged
    });

    it('should detect completion when puzzle is solved', async () => {
      const { result } = renderHook(() => useGame(), { wrapper });

      await act(async () => {
        result.current.startNewGame('easy', '9x9');
        await Promise.resolve();
      });

      // Use devAutoComplete for simplicity
      await act(async () => {
        result.current.devAutoComplete();
      });

      expect(result.current.gameState?.isComplete).toBe(true);
    });
  });

  // ============ Notes ============

  describe('addNote / removeNote', () => {
    it('should add note to empty cell', async () => {
      const { result } = renderHook(() => useGame(), { wrapper });

      await act(async () => {
        result.current.startNewGame('easy', '9x9');
        await Promise.resolve();
      });

      await act(async () => {
        result.current.addNote(0, 2, 4);
      });

      expect(result.current.gameState?.notes['0-2']).toContain(4);
    });

    it('should add multiple notes to same cell', async () => {
      const { result } = renderHook(() => useGame(), { wrapper });

      await act(async () => {
        result.current.startNewGame('easy', '9x9');
        await Promise.resolve();
      });

      // Call addNote in separate act() blocks to ensure state updates between calls
      await act(async () => {
        result.current.addNote(0, 2, 4);
      });

      await act(async () => {
        result.current.addNote(0, 2, 6);
      });

      expect(result.current.gameState?.notes['0-2']).toContain(4);
      expect(result.current.gameState?.notes['0-2']).toContain(6);
    });

    it('should keep notes sorted', async () => {
      const { result } = renderHook(() => useGame(), { wrapper });

      await act(async () => {
        result.current.startNewGame('easy', '9x9');
        await Promise.resolve();
      });

      // Call addNote in separate act() blocks to ensure state updates between calls
      await act(async () => {
        result.current.addNote(0, 2, 6);
      });

      await act(async () => {
        result.current.addNote(0, 2, 4);
      });

      await act(async () => {
        result.current.addNote(0, 2, 2);
      });

      expect(result.current.gameState?.notes['0-2']).toEqual([2, 4, 6]);
    });

    it('should remove note from cell', async () => {
      const { result } = renderHook(() => useGame(), { wrapper });

      await act(async () => {
        result.current.startNewGame('easy', '9x9');
        await Promise.resolve();
      });

      // Add notes in separate act() blocks
      await act(async () => {
        result.current.addNote(0, 2, 4);
      });

      await act(async () => {
        result.current.addNote(0, 2, 6);
      });

      await act(async () => {
        result.current.removeNote(0, 2, 4);
      });

      expect(result.current.gameState?.notes['0-2']).not.toContain(4);
      expect(result.current.gameState?.notes['0-2']).toContain(6);
    });

    it('should not add duplicate notes', async () => {
      const { result } = renderHook(() => useGame(), { wrapper });

      await act(async () => {
        result.current.startNewGame('easy', '9x9');
        await Promise.resolve();
      });

      await act(async () => {
        result.current.addNote(0, 2, 4);
        result.current.addNote(0, 2, 4);
      });

      expect(result.current.gameState?.notes['0-2']?.filter(n => n === 4).length).toBe(1);
    });
  });

  // ============ Pause / Resume ============

  describe('pauseGame / resumeGame', () => {
    it('should pause the game', async () => {
      const { result } = renderHook(() => useGame(), { wrapper });

      await act(async () => {
        result.current.startNewGame('easy', '9x9');
        await Promise.resolve();
      });

      expect(result.current.gameState?.isPaused).toBe(false);

      await act(async () => {
        result.current.pauseGame();
      });

      expect(result.current.gameState?.isPaused).toBe(true);
    });

    it('should resume the game', async () => {
      const { result } = renderHook(() => useGame(), { wrapper });

      await act(async () => {
        result.current.startNewGame('easy', '9x9');
        await Promise.resolve();
      });

      await act(async () => {
        result.current.pauseGame();
      });

      expect(result.current.gameState?.isPaused).toBe(true);

      await act(async () => {
        result.current.resumeGame();
      });

      expect(result.current.gameState?.isPaused).toBe(false);
    });
  });

  // ============ Timer ============

  describe('timer', () => {
    it('should increment timer every second when game is active', async () => {
      const { result } = renderHook(() => useGame(), { wrapper });

      await act(async () => {
        result.current.startNewGame('easy', '9x9');
        await Promise.resolve();
      });

      expect(result.current.gameState?.timer).toBe(0);

      await act(async () => {
        jest.advanceTimersByTime(1000);
      });

      expect(result.current.gameState?.timer).toBe(1);

      await act(async () => {
        jest.advanceTimersByTime(2000);
      });

      expect(result.current.gameState?.timer).toBe(3);
    });

    it('should not increment timer when paused', async () => {
      const { result } = renderHook(() => useGame(), { wrapper });

      await act(async () => {
        result.current.startNewGame('easy', '9x9');
        await Promise.resolve();
      });

      await act(async () => {
        jest.advanceTimersByTime(1000);
      });

      expect(result.current.gameState?.timer).toBe(1);

      await act(async () => {
        result.current.pauseGame();
      });

      await act(async () => {
        jest.advanceTimersByTime(2000);
      });

      expect(result.current.gameState?.timer).toBe(1); // Still 1
    });

    it('should resume timer after unpause', async () => {
      const { result } = renderHook(() => useGame(), { wrapper });

      await act(async () => {
        result.current.startNewGame('easy', '9x9');
        await Promise.resolve();
      });

      await act(async () => {
        jest.advanceTimersByTime(1000);
      });

      await act(async () => {
        result.current.pauseGame();
      });

      await act(async () => {
        jest.advanceTimersByTime(5000);
      });

      await act(async () => {
        result.current.resumeGame();
      });

      await act(async () => {
        jest.advanceTimersByTime(1000);
      });

      expect(result.current.gameState?.timer).toBe(2);
    });

    it('should stop timer when game is complete', async () => {
      const { result } = renderHook(() => useGame(), { wrapper });

      await act(async () => {
        result.current.startNewGame('easy', '9x9');
        await Promise.resolve();
      });

      await act(async () => {
        jest.advanceTimersByTime(2000);
      });

      expect(result.current.gameState?.timer).toBe(2);

      await act(async () => {
        result.current.devAutoComplete();
      });

      await act(async () => {
        jest.advanceTimersByTime(3000);
      });

      expect(result.current.gameState?.timer).toBe(2); // Should not increase
    });
  });

  // ============ Smart Possibility Helper ============

  describe('unlockHelper', () => {
    it('should have isHelperUnlocked false initially', async () => {
      const { result } = renderHook(() => useGame(), { wrapper });

      await act(async () => {
        result.current.startNewGame('easy', '9x9');
        await Promise.resolve();
      });

      expect(result.current.gameState?.isHelperUnlocked).toBe(false);
    });

    it('should unlock helper when unlockHelper is called', async () => {
      const { result } = renderHook(() => useGame(), { wrapper });

      await act(async () => {
        result.current.startNewGame('easy', '9x9');
        await Promise.resolve();
      });

      await act(async () => {
        result.current.unlockHelper();
      });

      expect(result.current.gameState?.isHelperUnlocked).toBe(true);
    });

    it('should reset helper state on new game', async () => {
      const { result } = renderHook(() => useGame(), { wrapper });

      await act(async () => {
        result.current.startNewGame('easy', '9x9');
        await Promise.resolve();
      });

      await act(async () => {
        result.current.unlockHelper();
      });

      expect(result.current.gameState?.isHelperUnlocked).toBe(true);

      await act(async () => {
        result.current.startNewGame('medium', '9x9');
        await Promise.resolve();
      });

      expect(result.current.gameState?.isHelperUnlocked).toBe(false);
    });
  });

  // ============ Persistence ============

  describe('persistence', () => {
    it('should save state after changes', async () => {
      const { result } = renderHook(() => useGame(), { wrapper });

      await act(async () => {
        result.current.startNewGame('easy', '9x9');
        await Promise.resolve();
      });

      expect(saveData).toHaveBeenCalled();
    });
  });

  // ============ devAutoComplete ============

  describe('devAutoComplete', () => {
    it('should fill grid with solution', async () => {
      const { result } = renderHook(() => useGame(), { wrapper });

      await act(async () => {
        result.current.startNewGame('easy', '9x9');
        await Promise.resolve();
      });

      await act(async () => {
        result.current.devAutoComplete();
      });

      expect(result.current.gameState?.isComplete).toBe(true);
      expect(result.current.gameState?.grid).toEqual(result.current.gameState?.solution);
    });
  });
});
