/**
 * Hooks index - centralizes all custom hook exports.
 */

export { useGameModals } from './useGameModals';
export type { UseGameModalsReturn, GameModalsState, GameModalsActions } from './useGameModals';

export { useUserId } from './useUserId';

export { useGameCompletion, getPuzzleDifficulty } from './useGameCompletion';

export { useGameTimer } from './useGameTimer';

export { useGameStorage, useAutoSaveGameState } from './useGameStorage';

export { useAdSession } from './useAdSession';
export type { AdSession, UseAdSessionReturn } from './useAdSession';

export { useInterstitialAd } from './useInterstitialAd';
export type { UseInterstitialAdReturn } from './useInterstitialAd';

export { useRewardedAd } from './useRewardedAd';
export type { UseRewardedAdReturn } from './useRewardedAd';
