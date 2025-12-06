/**
 * Store Review Service
 *
 * Handles app store review prompts after game completions.
 * Triggers review request every 4 completions until user has reviewed.
 */
import { loadData, saveData, STORAGE_KEYS } from '../utils/storage';

/**
 * Track game completion and potentially request a store review.
 * Shows review prompt every 4 completions until user has seen it.
 */
export const maybeRequestReview = async (): Promise<void> => {
  try {
    // Check if user has already been shown the review prompt
    const hasReviewed = await loadData<boolean>(STORAGE_KEYS.HAS_REVIEWED_APP);
    if (hasReviewed) {
      return;
    }

    // Get current completion count
    const completions = (await loadData<number>(STORAGE_KEYS.GAME_COMPLETION_COUNT)) || 0;

    // Increment and save
    const newCount = completions + 1;
    await saveData(STORAGE_KEYS.GAME_COMPLETION_COUNT, newCount);

    // Request review every 4 completions
    if (newCount % 4 === 0) {
      try {
        const StoreReview = await import('expo-store-review');
        const canRequest = await StoreReview.hasAction();
        if (canRequest) {
          await StoreReview.requestReview();
          // Mark as reviewed (user has seen the prompt)
          await saveData(STORAGE_KEYS.HAS_REVIEWED_APP, true);
          console.log('[StoreReview] Review requested after', newCount, 'completions');
        }
      } catch (moduleError) {
        console.log('[StoreReview] Native module not available');
      }
    }
  } catch (error) {
    // Store review failure is non-critical, don't block the user
    console.error('[StoreReview] Error:', error);
  }
};
