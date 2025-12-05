import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

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
 * Save non-sensitive data to AsyncStorage
 */
export const saveData = async (key: string, value: any): Promise<void> => {
  try {
    const jsonValue = JSON.stringify(value);
    await AsyncStorage.setItem(key, jsonValue);
  } catch (e) {
    console.error('Error saving data', e);
  }
};

/**
 * Load non-sensitive data from AsyncStorage
 */
export const loadData = async <T>(key: string): Promise<T | null> => {
  try {
    const jsonValue = await AsyncStorage.getItem(key);
    return jsonValue != null ? JSON.parse(jsonValue) : null;
  } catch (e) {
    console.error('Error loading data', e);
    return null;
  }
};

/**
 * Remove data from AsyncStorage
 */
export const removeData = async (key: string): Promise<void> => {
  try {
    await AsyncStorage.removeItem(key);
  } catch (e) {
    console.error('Error removing data', e);
  }
};

/**
 * Save sensitive data to SecureStore (Web fallback to AsyncStorage)
 */
export const saveSecureData = async (key: string, value: string): Promise<void> => {
  if (Platform.OS === 'web') {
    await AsyncStorage.setItem(key, value);
  } else {
    await SecureStore.setItemAsync(key, value);
  }
};

/**
 * Load sensitive data from SecureStore (Web fallback to AsyncStorage)
 */
export const loadSecureData = async (key: string): Promise<string | null> => {
  if (Platform.OS === 'web') {
    return await AsyncStorage.getItem(key);
  } else {
    return await SecureStore.getItemAsync(key);
  }
};
