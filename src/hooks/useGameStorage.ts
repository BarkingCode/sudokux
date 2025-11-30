/**
 * Hook for managing game state persistence with AsyncStorage.
 * Handles loading saved state on mount and saving state on changes.
 */

import { useEffect, useCallback } from 'react';
import { loadData, saveData, STORAGE_KEYS } from '../utils/storage';
import type { GameState } from '../context/GameContext';

interface UseGameStorageOptions {
  onLoadComplete: (savedState: GameState | null) => void;
}

/**
 * Loads saved game state on mount.
 * Returns a function to save state.
 */
export const useGameStorage = ({ onLoadComplete }: UseGameStorageOptions) => {
  // Load saved state on mount
  useEffect(() => {
    loadData<GameState>(STORAGE_KEYS.GAME_STATE).then((savedState) => {
      if (savedState) {
        // Ensure new fields exist for backward compatibility
        if (!savedState.gridType) savedState.gridType = '9x9';
        if (savedState.isLoading === undefined) savedState.isLoading = false;
        if (!savedState.conflictCells) savedState.conflictCells = [];
        if (savedState.hintsUsed === undefined) savedState.hintsUsed = 0;
        // Always start paused - GameScreen will resume when focused
        savedState.isPaused = true;
      }
      onLoadComplete(savedState);
    });
  }, [onLoadComplete]);

  // Save state function
  const saveGameState = useCallback((gameState: GameState | null) => {
    if (gameState && !gameState.isLoading) {
      saveData(STORAGE_KEYS.GAME_STATE, gameState);
    }
  }, []);

  return { saveGameState };
};

/**
 * Auto-save game state when it changes.
 * Use this effect in the provider to persist state.
 */
export const useAutoSaveGameState = (gameState: GameState | null) => {
  useEffect(() => {
    if (gameState && !gameState.isLoading) {
      saveData(STORAGE_KEYS.GAME_STATE, gameState);
    }
  }, [gameState]);
};
