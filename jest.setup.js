/**
 * Jest setup file for SudokuX tests.
 * Contains all necessary mocks for native modules and external services.
 */

// Define __DEV__ for React Native
global.__DEV__ = true;

// Set required env vars
process.env.EXPO_PUBLIC_PROJECT_ID = 'test-project-id';
process.env.EXPO_PUBLIC_ADMOB_BANNER_IOS = 'test-banner-ios';
process.env.EXPO_PUBLIC_ADMOB_BANNER_ANDROID = 'test-banner-android';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock expo-secure-store
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(() => Promise.resolve(null)),
  setItemAsync: jest.fn(() => Promise.resolve()),
  deleteItemAsync: jest.fn(() => Promise.resolve()),
}));

// Mock expo-haptics
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(() => Promise.resolve()),
  notificationAsync: jest.fn(() => Promise.resolve()),
  selectionAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: {
    Light: 'light',
    Medium: 'medium',
    Heavy: 'heavy',
  },
  NotificationFeedbackType: {
    Success: 'success',
    Warning: 'warning',
    Error: 'error',
  },
}));

// Mock expo-notifications
jest.mock('expo-notifications', () => ({
  getPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  requestPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  setNotificationHandler: jest.fn(),
  scheduleNotificationAsync: jest.fn(() => Promise.resolve('notification-id')),
  cancelScheduledNotificationAsync: jest.fn(() => Promise.resolve()),
  cancelAllScheduledNotificationsAsync: jest.fn(() => Promise.resolve()),
  setBadgeCountAsync: jest.fn(() => Promise.resolve()),
  getBadgeCountAsync: jest.fn(() => Promise.resolve(0)),
  getExpoPushTokenAsync: jest.fn(() => Promise.resolve({ data: 'ExponentPushToken[test]' })),
  addNotificationResponseReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  addNotificationReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  setNotificationChannelAsync: jest.fn(() => Promise.resolve()),
  SchedulableTriggerInputTypes: {
    TIME_INTERVAL: 'timeInterval',
    DATE: 'date',
    DAILY: 'daily',
    WEEKLY: 'weekly',
    CALENDAR: 'calendar',
  },
  AndroidImportance: {
    DEFAULT: 3,
    HIGH: 4,
    LOW: 2,
    MAX: 5,
    MIN: 1,
    NONE: 0,
  },
}));

// Mock expo-device
jest.mock('expo-device', () => ({
  isDevice: true,
  brand: 'Apple',
  manufacturer: 'Apple',
  modelName: 'iPhone',
  osName: 'iOS',
  osVersion: '17.0',
}));

// Mock React Native Skia (native module)
jest.mock('@shopify/react-native-skia', () => ({
  Canvas: 'Canvas',
  Skia: {
    Paint: jest.fn(() => ({
      setColor: jest.fn(),
      setStrokeWidth: jest.fn(),
      setStyle: jest.fn(),
    })),
    Path: jest.fn(() => ({
      moveTo: jest.fn(),
      lineTo: jest.fn(),
      close: jest.fn(),
    })),
    Color: jest.fn((color) => color),
  },
  useFont: jest.fn(() => null),
  useFonts: jest.fn(() => null),
  matchFont: jest.fn(() => null),
  Group: 'Group',
  Rect: 'Rect',
  RoundedRect: 'RoundedRect',
  Line: 'Line',
  Text: 'Text',
  Circle: 'Circle',
  Path: 'Path',
  Fill: 'Fill',
  useValue: jest.fn(() => ({ current: 0 })),
  useTiming: jest.fn(() => ({ current: 0 })),
}));

// Mock react-native-game-center (authentication and leaderboard only - achievements handled by Supabase)
jest.mock('react-native-game-center', () => ({
  authenticate: jest.fn(() => Promise.resolve({ isAuthenticated: false })),
  submitScore: jest.fn(() => Promise.resolve()),
  showLeaderboard: jest.fn(() => Promise.resolve()),
  getPlayerId: jest.fn(() => Promise.resolve(null)),
}));

// Mock react-native-google-mobile-ads
jest.mock('react-native-google-mobile-ads', () => ({
  MobileAds: jest.fn(() => ({
    initialize: jest.fn(() => Promise.resolve()),
  })),
  RewardedAd: {
    createForAdRequest: jest.fn(() => ({
      load: jest.fn(),
      show: jest.fn(() => Promise.resolve()),
      addAdEventListener: jest.fn(() => jest.fn()),
    })),
  },
  InterstitialAd: {
    createForAdRequest: jest.fn(() => ({
      load: jest.fn(),
      show: jest.fn(() => Promise.resolve()),
      addAdEventListener: jest.fn(() => jest.fn()),
    })),
  },
  BannerAd: 'BannerAd',
  BannerAdSize: {
    BANNER: 'BANNER',
    LARGE_BANNER: 'LARGE_BANNER',
    MEDIUM_RECTANGLE: 'MEDIUM_RECTANGLE',
  },
  AdEventType: {
    LOADED: 'loaded',
    OPENED: 'opened',
    ERROR: 'error',
    CLOSED: 'closed',
  },
  RewardedAdEventType: {
    LOADED: 'loaded',
    EARNED_REWARD: 'earned_reward',
  },
  TestIds: {
    BANNER: 'ca-app-pub-3940256099942544/6300978111',
    INTERSTITIAL: 'ca-app-pub-3940256099942544/1033173712',
    REWARDED: 'ca-app-pub-3940256099942544/5224354917',
  },
}));

// Mock expo-localization
jest.mock('expo-localization', () => ({
  getLocales: jest.fn(() => [{ languageTag: 'en-US', languageCode: 'en', regionCode: 'US' }]),
  getCalendars: jest.fn(() => [{ calendar: 'gregory', timeZone: 'America/New_York' }]),
  locale: 'en-US',
  locales: ['en-US'],
  timezone: 'America/New_York',
  isRTL: false,
}));

// Mock Supabase client
jest.mock('./src/lib/supabase', () => ({
  supabase: {
    rpc: jest.fn(() => Promise.resolve({ data: null, error: null })),
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      upsert: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      neq: jest.fn().mockReturnThis(),
      gt: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lt: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      single: jest.fn(() => Promise.resolve({ data: null, error: null })),
      maybeSingle: jest.fn(() => Promise.resolve({ data: null, error: null })),
    })),
    auth: {
      getSession: jest.fn(() => Promise.resolve({ data: { session: null }, error: null })),
      signIn: jest.fn(() => Promise.resolve({ data: null, error: null })),
      signOut: jest.fn(() => Promise.resolve({ error: null })),
    },
  },
}));

// Mock ads config (needs env vars at import time)
jest.mock('./src/config/ads', () => ({
  INTERSTITIAL_MIN_GAMES: 2,
  INTERSTITIAL_MAX_GAMES: 4,
  FREERUN_GAMES_PER_SESSION: 3,
  AD_UNIT_IDS: {
    BANNER: 'ca-app-pub-test/banner',
    INTERSTITIAL: 'ca-app-pub-test/interstitial',
    REWARDED: 'ca-app-pub-test/rewarded',
    HELPER_REWARDED: 'ca-app-pub-test/rewarded-helper',
  },
}));

// Mock expo-router
jest.mock('expo-router', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  })),
  useLocalSearchParams: jest.fn(() => ({})),
  usePathname: jest.fn(() => '/'),
  Link: 'Link',
  Stack: {
    Screen: 'Screen',
  },
}));

// Mock @sentry/react-native
jest.mock('@sentry/react-native', () => ({
  init: jest.fn(),
  wrap: jest.fn((component) => component),
  setUser: jest.fn(),
  addBreadcrumb: jest.fn(),
  captureException: jest.fn(),
  captureMessage: jest.fn(),
  withScope: jest.fn((callback) => callback({
    setTag: jest.fn(),
    setExtras: jest.fn(),
    setExtra: jest.fn(),
    setLevel: jest.fn(),
  })),
  startInactiveSpan: jest.fn(() => ({
    end: jest.fn(),
  })),
  Severity: { Error: 'error', Warning: 'warning', Info: 'info' },
}));

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

// Mock moti
jest.mock('moti', () => ({
  MotiView: 'MotiView',
  MotiText: 'MotiText',
  MotiPressable: 'MotiPressable',
  useAnimationState: jest.fn(() => ({
    current: 'default',
    transitionTo: jest.fn(),
  })),
  AnimatePresence: ({ children }) => children,
}));

// Silence console warnings during tests
const originalWarn = console.warn;
console.warn = (...args) => {
  if (
    typeof args[0] === 'string' &&
    (args[0].includes('Animated') || args[0].includes('componentWillReceiveProps'))
  ) {
    return;
  }
  originalWarn.apply(console, args);
};

// Global test timeout
jest.setTimeout(30000);
