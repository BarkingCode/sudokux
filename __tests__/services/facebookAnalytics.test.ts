/**
 * Tests for src/services/facebookAnalytics.ts
 * Facebook SDK analytics events.
 */

const mockInitializeSDK = jest.fn().mockResolvedValue(undefined);
const mockSetAdvertiserTrackingEnabled = jest.fn();
const mockLogEvent = jest.fn();
const mockLogPurchase = jest.fn();

jest.mock('react-native-fbsdk-next', () => ({
  Settings: {
    initializeSDK: mockInitializeSDK,
    setAdvertiserTrackingEnabled: mockSetAdvertiserTrackingEnabled,
  },
  AppEventsLogger: {
    logEvent: mockLogEvent,
    logPurchase: mockLogPurchase,
  },
}));

// Must import AFTER jest.mock
let facebookAnalytics: typeof import('../../src/services/facebookAnalytics');

beforeAll(() => {
  jest.resetModules();
});

describe('facebookAnalytics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Re-import to reset isInitialized state
    jest.resetModules();
    // Re-apply mock
    jest.doMock('react-native-fbsdk-next', () => ({
      Settings: {
        initializeSDK: mockInitializeSDK,
        setAdvertiserTrackingEnabled: mockSetAdvertiserTrackingEnabled,
      },
      AppEventsLogger: {
        logEvent: mockLogEvent,
        logPurchase: mockLogPurchase,
      },
    }));
    facebookAnalytics = require('../../src/services/facebookAnalytics');
  });

  describe('initializeFacebookSDK', () => {
    it('should initialize SDK and log activation', async () => {
      await facebookAnalytics.initializeFacebookSDK();

      expect(mockInitializeSDK).toHaveBeenCalled();
      expect(mockSetAdvertiserTrackingEnabled).toHaveBeenCalledWith(true);
      expect(mockLogEvent).toHaveBeenCalledWith('fb_mobile_activate_app');
    });

    it('should not initialize twice', async () => {
      await facebookAnalytics.initializeFacebookSDK();
      mockInitializeSDK.mockClear();

      await facebookAnalytics.initializeFacebookSDK();

      expect(mockInitializeSDK).not.toHaveBeenCalled();
    });
  });

  describe('logGameCompleted', () => {
    it('should log game completed event', () => {
      facebookAnalytics.logGameCompleted('hard');

      expect(mockLogEvent).toHaveBeenCalledWith('sudoku_game_completed', { difficulty: 'hard' });
    });
  });

  describe('logGameStarted', () => {
    it('should log game started event', () => {
      facebookAnalytics.logGameStarted('easy', '9x9');

      expect(mockLogEvent).toHaveBeenCalledWith('sudoku_game_started', {
        difficulty: 'easy',
        grid_type: '9x9',
      });
    });
  });

  describe('logDailyChallengeCompleted', () => {
    it('should log daily challenge event', () => {
      facebookAnalytics.logDailyChallengeCompleted('medium', 300);

      expect(mockLogEvent).toHaveBeenCalledWith('daily_challenge_completed', {
        difficulty: 'medium',
        time_seconds: 300,
      });
    });
  });

  describe('logChapterCompleted', () => {
    it('should log chapter completed event', () => {
      facebookAnalytics.logChapterCompleted(5, 3);

      expect(mockLogEvent).toHaveBeenCalledWith('chapter_completed', {
        chapter_id: 5,
        total_stars: 3,
      });
    });
  });

  describe('logEvent', () => {
    it('should log custom event with params', () => {
      facebookAnalytics.logEvent('custom_event', { key: 'value' });

      expect(mockLogEvent).toHaveBeenCalledWith('custom_event', { key: 'value' });
    });

    it('should log custom event without params', () => {
      facebookAnalytics.logEvent('simple_event');

      expect(mockLogEvent).toHaveBeenCalledWith('simple_event');
    });
  });

  describe('logPurchase', () => {
    it('should log purchase with params', () => {
      facebookAnalytics.logPurchase(9.99, 'USD', { item: 'premium' });

      expect(mockLogPurchase).toHaveBeenCalledWith(9.99, 'USD', { item: 'premium' });
    });

    it('should log purchase without params', () => {
      facebookAnalytics.logPurchase(4.99, 'EUR');

      expect(mockLogPurchase).toHaveBeenCalledWith(4.99, 'EUR');
    });
  });

  describe('logAdImpression', () => {
    it('should log ad impression event', () => {
      facebookAnalytics.logAdImpression('interstitial');

      expect(mockLogEvent).toHaveBeenCalledWith('ad_impression', { ad_type: 'interstitial' });
    });
  });
});
