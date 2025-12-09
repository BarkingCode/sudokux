/**
 * Centralized timing constants for the application.
 * All timeout, delay, and interval values should be defined here.
 */

export const TIMING = {
  /**
   * Modal delay timings - delays before showing completion modals
   */
  MODAL_DELAYS: {
    /** Delay before showing daily challenge completion modal */
    DAILY_COMPLETION: 1000,
    /** Delay before showing chapter completion modal */
    CHAPTER_COMPLETION: 800,
    /** Delay before showing free run completion modal */
    FREERUN_COMPLETION: 800,
  },

  /**
   * Ad-related timeouts
   */
  AD_TIMEOUTS: {
    /** Ad load timeout in development (shorter for faster debugging) */
    LOAD_DEV: 10000,
    /** Ad load timeout in production */
    LOAD_PROD: 30000,
    /** Timeout for showing an ad */
    SHOW: 30000,
  },

  /**
   * Network and polling intervals
   */
  NETWORK: {
    /** How often to check network connectivity */
    CHECK_INTERVAL: 5000,
  },

  /**
   * Achievement-related delays
   */
  ACHIEVEMENTS: {
    /** Delay between showing queued achievement toasts */
    QUEUE_DELAY: 300,
  },

  /**
   * Animation durations
   */
  ANIMATIONS: {
    /** Default animation duration for most transitions */
    DEFAULT: 300,
    /** Quick animation for subtle feedback */
    QUICK: 150,
    /** Slow animation for emphasis */
    SLOW: 500,
  },

  /**
   * Game timer intervals
   */
  GAME: {
    /** Timer update interval in milliseconds */
    TIMER_INTERVAL: 1000,
    /** Debounce delay for saving game state */
    SAVE_DEBOUNCE: 500,
  },
} as const;

/**
 * Get the appropriate ad load timeout based on environment
 */
export const getAdLoadTimeout = (): number => {
  return __DEV__ ? TIMING.AD_TIMEOUTS.LOAD_DEV : TIMING.AD_TIMEOUTS.LOAD_PROD;
};
