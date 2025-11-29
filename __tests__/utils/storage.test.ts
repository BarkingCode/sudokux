/**
 * Tests for src/utils/storage.ts
 * AsyncStorage and SecureStore wrapper functions.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import {
  saveData,
  loadData,
  saveSecureData,
  loadSecureData,
  STORAGE_KEYS,
} from '../../src/utils/storage';

// Mock AsyncStorage (already mocked in jest.setup.js)
// Mock SecureStore (already mocked in jest.setup.js)

describe('storage', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
  });

  // ============ STORAGE_KEYS ============

  describe('STORAGE_KEYS', () => {
    it('should contain USER_ID key', () => {
      expect(STORAGE_KEYS.USER_ID).toBeDefined();
      expect(typeof STORAGE_KEYS.USER_ID).toBe('string');
    });

    it('should contain GAME_STATE key', () => {
      expect(STORAGE_KEYS.GAME_STATE).toBeDefined();
      expect(typeof STORAGE_KEYS.GAME_STATE).toBe('string');
    });

    it('should contain SETTINGS key', () => {
      expect(STORAGE_KEYS.SETTINGS).toBeDefined();
      expect(typeof STORAGE_KEYS.SETTINGS).toBe('string');
    });

    it('should contain STATS key', () => {
      expect(STORAGE_KEYS.STATS).toBeDefined();
      expect(typeof STORAGE_KEYS.STATS).toBe('string');
    });

    it('should contain CHAPTER_PROGRESS key', () => {
      expect(STORAGE_KEYS.CHAPTER_PROGRESS).toBeDefined();
      expect(typeof STORAGE_KEYS.CHAPTER_PROGRESS).toBe('string');
    });

    it('should have unique key values', () => {
      const values = Object.values(STORAGE_KEYS);
      const uniqueValues = new Set(values);
      expect(uniqueValues.size).toBe(values.length);
    });
  });

  // ============ saveData / loadData ============

  describe('saveData', () => {
    it('should save data to AsyncStorage', async () => {
      const testData = { test: 'value' };
      await saveData('test-key', testData);

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'test-key',
        JSON.stringify(testData)
      );
    });

    it('should serialize objects to JSON', async () => {
      const complexData = { nested: { array: [1, 2, 3], bool: true } };
      await saveData('complex-key', complexData);

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'complex-key',
        JSON.stringify(complexData)
      );
    });

    it('should handle arrays', async () => {
      const arrayData = [1, 2, 3, 'test'];
      await saveData('array-key', arrayData);

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'array-key',
        JSON.stringify(arrayData)
      );
    });

    it('should handle primitive values', async () => {
      await saveData('number-key', 42);
      await saveData('string-key', 'test');
      await saveData('bool-key', true);

      expect(AsyncStorage.setItem).toHaveBeenCalledTimes(3);
    });
  });

  describe('loadData', () => {
    it('should load and parse JSON data', async () => {
      const testData = { test: 'value' };
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(testData));

      const result = await loadData<typeof testData>('test-key');

      expect(result).toEqual(testData);
    });

    it('should return null for missing key', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

      const result = await loadData('missing-key');

      expect(result).toBeNull();
    });

    it('should handle complex nested objects', async () => {
      const complexData = {
        user: { name: 'Test', settings: { theme: 'dark' } },
        scores: [100, 200, 300],
      };
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(complexData));

      const result = await loadData<typeof complexData>('complex-key');

      expect(result).toEqual(complexData);
    });

    it('should return null on parse error', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('invalid json {{{');

      const result = await loadData('invalid-key');

      expect(result).toBeNull();
    });
  });

  // ============ saveSecureData / loadSecureData ============

  describe('saveSecureData', () => {
    it('should use SecureStore on native platforms', async () => {
      // Platform is mocked as iOS by default
      (Platform as any).OS = 'ios';

      await saveSecureData('secure-key', 'secure-value');

      expect(SecureStore.setItemAsync).toHaveBeenCalledWith('secure-key', 'secure-value');
    });

    it('should use AsyncStorage on web', async () => {
      (Platform as any).OS = 'web';

      await saveSecureData('secure-key', 'secure-value');

      expect(AsyncStorage.setItem).toHaveBeenCalledWith('secure-key', 'secure-value');
    });
  });

  describe('loadSecureData', () => {
    it('should use SecureStore on native platforms', async () => {
      (Platform as any).OS = 'ios';
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('secure-value');

      const result = await loadSecureData('secure-key');

      expect(SecureStore.getItemAsync).toHaveBeenCalledWith('secure-key');
      expect(result).toBe('secure-value');
    });

    it('should use AsyncStorage on web', async () => {
      (Platform as any).OS = 'web';
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('secure-value');

      const result = await loadSecureData('secure-key');

      expect(AsyncStorage.getItem).toHaveBeenCalledWith('secure-key');
      expect(result).toBe('secure-value');
    });

    it('should return null for missing secure data', async () => {
      (Platform as any).OS = 'ios';
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);

      const result = await loadSecureData('missing-key');

      expect(result).toBeNull();
    });
  });
});
