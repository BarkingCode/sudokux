/**
 * Facebook App Events Analytics Service
 *
 * Handles Facebook SDK initialization and event logging for analytics.
 * Used for tracking user engagement, game completions, and monetization events.
 *
 * Supports both iOS and Android platforms.
 */
import { Settings, AppEventsLogger } from 'react-native-fbsdk-next';

let isInitialized = false;

/**
 * Initialize Facebook SDK
 * Call this once at app startup in _layout.tsx
 */
export const initializeFacebookSDK = async (): Promise<void> => {
  if (isInitialized) {
    return;
  }

  try {
    // Initialize SDK settings
    await Settings.initializeSDK();

    // Enable advertiser tracking (respects ATT on iOS)
    Settings.setAdvertiserTrackingEnabled(true);

    // Log the standard app activation event
    AppEventsLogger.logEvent('fb_mobile_activate_app');

    isInitialized = true;
    console.log('[FacebookAnalytics] SDK initialized successfully');
  } catch (error) {
    console.error('[FacebookAnalytics] Failed to initialize:', error);
  }
};

/**
 * Log game completion event
 * @param difficulty - The difficulty level of the completed game
 */
export const logGameCompleted = (difficulty: string): void => {
  try {
    AppEventsLogger.logEvent('sudoku_game_completed', { difficulty });
  } catch (error) {
    console.error('[FacebookAnalytics] Failed to log game completed:', error);
  }
};

/**
 * Log game started event
 * @param difficulty - The difficulty level
 * @param gridType - The grid type (9x9 or 6x6)
 */
export const logGameStarted = (difficulty: string, gridType: string): void => {
  try {
    AppEventsLogger.logEvent('sudoku_game_started', {
      difficulty,
      grid_type: gridType,
    });
  } catch (error) {
    console.error('[FacebookAnalytics] Failed to log game started:', error);
  }
};

/**
 * Log daily challenge completion
 * @param difficulty - The difficulty level
 * @param timeSeconds - Time taken to complete in seconds
 */
export const logDailyChallengeCompleted = (difficulty: string, timeSeconds: number): void => {
  try {
    AppEventsLogger.logEvent('daily_challenge_completed', {
      difficulty,
      time_seconds: timeSeconds,
    });
  } catch (error) {
    console.error('[FacebookAnalytics] Failed to log daily challenge:', error);
  }
};

/**
 * Log chapter completion
 * @param chapterId - The chapter ID
 * @param totalStars - Total stars earned
 */
export const logChapterCompleted = (chapterId: number, totalStars: number): void => {
  try {
    AppEventsLogger.logEvent('chapter_completed', {
      chapter_id: chapterId,
      total_stars: totalStars,
    });
  } catch (error) {
    console.error('[FacebookAnalytics] Failed to log chapter completed:', error);
  }
};

/**
 * Log custom event with optional parameters
 * @param eventName - Name of the event
 * @param params - Optional event parameters
 */
export const logEvent = (
  eventName: string,
  params?: Record<string, string | number>
): void => {
  try {
    if (params) {
      AppEventsLogger.logEvent(eventName, params);
    } else {
      AppEventsLogger.logEvent(eventName);
    }
  } catch (error) {
    console.error('[FacebookAnalytics] Failed to log event:', error);
  }
};

/**
 * Log purchase event (for monetization tracking)
 * @param amount - Purchase amount
 * @param currency - Currency code (e.g., 'USD')
 * @param params - Optional additional parameters
 */
export const logPurchase = (
  amount: number,
  currency: string,
  params?: Record<string, string | number>
): void => {
  try {
    if (params) {
      AppEventsLogger.logPurchase(amount, currency, params);
    } else {
      AppEventsLogger.logPurchase(amount, currency);
    }
  } catch (error) {
    console.error('[FacebookAnalytics] Failed to log purchase:', error);
  }
};

/**
 * Log ad impression event
 * @param adType - Type of ad (e.g., 'interstitial', 'rewarded')
 */
export const logAdImpression = (adType: string): void => {
  try {
    AppEventsLogger.logEvent('ad_impression', { ad_type: adType });
  } catch (error) {
    console.error('[FacebookAnalytics] Failed to log ad impression:', error);
  }
};
