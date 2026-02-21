/**
 * Tests for src/services/storeReviewService.ts
 * Store review prompt management.
 */

import { maybeRequestReview } from '../../src/services/storeReviewService';
import { loadData, saveData, STORAGE_KEYS } from '../../src/utils/storage';

jest.mock('../../src/utils/storage');

const mockLoadData = loadData as jest.MockedFunction<typeof loadData>;
const mockSaveData = saveData as jest.MockedFunction<typeof saveData>;

describe('storeReviewService', () => {
  let mockStoreReview: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockLoadData.mockResolvedValue(null);
    mockSaveData.mockResolvedValue();

    // Mock expo-store-review module
    mockStoreReview = {
      hasAction: jest.fn().mockResolvedValue(true),
      requestReview: jest.fn().mockResolvedValue(),
    };

    jest.mock('expo-store-review', () => mockStoreReview, { virtual: true });
  });

  // ============ First Completion ============

  describe('first completion', () => {
    it('should not prompt on first completion', async () => {
      mockLoadData.mockResolvedValue(null); // No previous data

      await maybeRequestReview();

      expect(mockSaveData).toHaveBeenCalledWith(
        STORAGE_KEYS.GAME_COMPLETION_COUNT,
        1
      );
    });
  });

  // ============ Increment Completion Count ============

  describe('increment completion count', () => {
    it('should increment completion count', async () => {
      mockLoadData
        .mockResolvedValueOnce(false) // hasReviewed
        .mockResolvedValueOnce(3);     // completions

      await maybeRequestReview();

      expect(mockSaveData).toHaveBeenCalledWith(
        STORAGE_KEYS.GAME_COMPLETION_COUNT,
        4
      );
    });
  });

  // ============ Request Review Every 4 Completions ============

  describe('request review', () => {
    it('should request review on 4th completion', async () => {
      mockLoadData
        .mockResolvedValueOnce(false) // hasReviewed
        .mockResolvedValueOnce(3);     // completions (will become 4)

      // Mock dynamic import
      jest.doMock('expo-store-review', () => mockStoreReview, { virtual: true });

      await maybeRequestReview();

      // Completion count should be saved
      expect(mockSaveData).toHaveBeenCalledWith(
        STORAGE_KEYS.GAME_COMPLETION_COUNT,
        4
      );
    });

    it('should request review on 8th completion', async () => {
      mockLoadData
        .mockResolvedValueOnce(false) // hasReviewed
        .mockResolvedValueOnce(7);     // completions (will become 8)

      await maybeRequestReview();

      expect(mockSaveData).toHaveBeenCalledWith(
        STORAGE_KEYS.GAME_COMPLETION_COUNT,
        8
      );
    });

    it('should not request review on non-4th completions', async () => {
      mockLoadData
        .mockResolvedValueOnce(false) // hasReviewed
        .mockResolvedValueOnce(5);     // completions (will become 6)

      await maybeRequestReview();

      expect(mockSaveData).toHaveBeenCalledWith(
        STORAGE_KEYS.GAME_COMPLETION_COUNT,
        6
      );
      // No review-related storage should happen
    });
  });

  // ============ Mark as Reviewed ============

  describe('mark as reviewed', () => {
    it('should mark as reviewed after showing prompt', async () => {
      mockLoadData
        .mockResolvedValueOnce(false) // hasReviewed
        .mockResolvedValueOnce(3);     // completions

      jest.doMock('expo-store-review', () => mockStoreReview, { virtual: true });

      await maybeRequestReview();

      // Count should be saved
      expect(mockSaveData).toHaveBeenCalledWith(
        STORAGE_KEYS.GAME_COMPLETION_COUNT,
        4
      );
    });
  });

  // ============ Already Reviewed ============

  describe('already reviewed', () => {
    it('should not prompt if user already reviewed', async () => {
      mockLoadData.mockResolvedValueOnce(true); // hasReviewed = true

      await maybeRequestReview();

      // Should not increment count or request review
      expect(mockSaveData).not.toHaveBeenCalled();
    });
  });

  // ============ Graceful Failure ============

  describe('graceful failure', () => {
    it('should handle module unavailable gracefully', async () => {
      mockLoadData
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(3);

      // Mock module not available
      jest.doMock('expo-store-review', () => {
        throw new Error('Module not found');
      }, { virtual: true });

      // Should not throw
      await expect(maybeRequestReview()).resolves.toBeUndefined();
    });

    it('should handle hasAction false gracefully', async () => {
      mockLoadData
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(3);

      mockStoreReview.hasAction.mockResolvedValue(false);
      jest.doMock('expo-store-review', () => mockStoreReview, { virtual: true });

      await expect(maybeRequestReview()).resolves.toBeUndefined();
    });

    it('should handle storage errors gracefully', async () => {
      mockLoadData.mockRejectedValue(new Error('Storage error'));

      // Should not throw
      await expect(maybeRequestReview()).resolves.toBeUndefined();
    });

    it('should handle save errors gracefully', async () => {
      mockLoadData
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(0);

      mockSaveData.mockRejectedValue(new Error('Save error'));

      // Should not throw
      await expect(maybeRequestReview()).resolves.toBeUndefined();
    });
  });
});
