/**
 * Async storage utilities for persisting game state and settings.
 * Uses AsyncStorage for non-sensitive data and SecureStore for sensitive data.
 * All operations return success indicators so callers can handle failures.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { isWeb } from './platform';
import { createScopedLogger } from './logger';

const log = createScopedLogger('Storage');

// Maximum data size warning threshold (1MB)
const MAX_DATA_SIZE_WARNING = 1000000;

// Keys for storage
export const STORAGE_KEYS = {
  USER_ID: 'sudoku_user_id',
  GAME_STATE: 'sudoku_game_state', // Legacy - no longer used for auto-restore
  FREERUN_GAME_STATE: 'sudoku_freerun_game_state', // Free Run mode game state
  DAILY_GAME_STATE: 'sudoku_daily_game_state', // Daily challenge game state
  SETTINGS: 'sudoku_settings',
  STATS: 'sudoku_stats',
  CHAPTER_PROGRESS: 'sudoku_chapter_progress', // 9x9 chapter progress
  CHAPTER_PROGRESS_6X6: 'sudoku_chapter_progress_6x6', // 6x6 chapter progress
  CHAPTER_IN_PROGRESS: 'sudoku_chapter_in_progress', // Single active chapter game progress
  CHAPTER_GRID_TYPE: 'sudoku_chapter_grid_type', // Selected grid type for chapters
  GAME_COMPLETION_COUNT: 'sudoku_game_completion_count', // For store review triggering
  HAS_REVIEWED_APP: 'sudoku_has_reviewed_app', // Track if user has seen review prompt
};

/**
 * Save non-sensitive data to AsyncStorage.
 * @returns true if save succeeded, false otherwise
 */
export const saveData = async (key: string, value: unknown): Promise<boolean> => {
  try {
    const jsonValue = JSON.stringify(value);

    // Warn about large data sizes
    if (jsonValue.length > MAX_DATA_SIZE_WARNING) {
      log.warn(`Data for ${key} is large`, { bytes: jsonValue.length });
    }

    await AsyncStorage.setItem(key, jsonValue);
    return true;
  } catch (e) {
    log.error('Failed to save data', { key, error: e });
    return false;
  }
};

/**
 * Load non-sensitive data from AsyncStorage.
 * @returns The loaded data or null if not found/error
 */
export const loadData = async <T>(key: string): Promise<T | null> => {
  try {
    const jsonValue = await AsyncStorage.getItem(key);
    return jsonValue != null ? JSON.parse(jsonValue) : null;
  } catch (e) {
    log.error('Failed to load data', { key, error: e });
    return null;
  }
};

/**
 * Remove data from AsyncStorage.
 * @returns true if removal succeeded, false otherwise
 */
export const removeData = async (key: string): Promise<boolean> => {
  try {
    await AsyncStorage.removeItem(key);
    return true;
  } catch (e) {
    log.error('Failed to remove data', { key, error: e });
    return false;
  }
};

/**
 * Save sensitive data to SecureStore (Web fallback to AsyncStorage).
 * @returns true if save succeeded, false otherwise
 */
export const saveSecureData = async (key: string, value: string): Promise<boolean> => {
  try {
    if (isWeb()) {
      await AsyncStorage.setItem(key, value);
    } else {
      await SecureStore.setItemAsync(key, value);
    }
    return true;
  } catch (e) {
    log.error('Failed to save secure data', { key, error: e });
    return false;
  }
};

/**
 * Load sensitive data from SecureStore (Web fallback to AsyncStorage).
 * @returns The loaded string or null if not found/error
 */
export const loadSecureData = async (key: string): Promise<string | null> => {
  try {
    if (isWeb()) {
      return await AsyncStorage.getItem(key);
    } else {
      return await SecureStore.getItemAsync(key);
    }
  } catch (e) {
    log.error('Failed to load secure data', { key, error: e });
    return null;
  }
};

/**
 * Remove sensitive data from SecureStore (Web fallback to AsyncStorage).
 * @returns true if removal succeeded, false otherwise
 */
export const removeSecureData = async (key: string): Promise<boolean> => {
  try {
    if (isWeb()) {
      await AsyncStorage.removeItem(key);
    } else {
      await SecureStore.deleteItemAsync(key);
    }
    return true;
  } catch (e) {
    log.error('Failed to remove secure data', { key, error: e });
    return false;
  }
};
