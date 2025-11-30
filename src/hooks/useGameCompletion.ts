/**
 * Hook for handling game completion detection and modal triggering.
 * Manages the workflow when a puzzle is completed.
 */

import { useEffect, useCallback } from 'react';
import type { GameState } from '../context/GameContext';
import type { UseGameModalsReturn } from './useGameModals';

interface UseGameCompletionOptions {
  gameState: GameState | null;
  modals: UseGameModalsReturn;
  isDaily: boolean;
  isChapter: boolean;
  isViewOnly: boolean;
}

/**
 * Handles completion detection and triggers the appropriate modal.
 */
export const useGameCompletion = ({
  gameState,
  modals,
  isDaily,
  isChapter,
  isViewOnly,
}: UseGameCompletionOptions): void => {
  const {
    openDailyModal,
    openChapterModal,
    openFreeRunModal,
    resetAllModals,
    hasShownCompletionAd,
    hasShownDailyModal,
    hasShownChapterModal,
    hasShownFreeRunModal,
  } = modals;

  // Show completion modal when puzzle is completed
  useEffect(() => {
    if (isViewOnly) return; // Don't show modals in view-only mode

    if (gameState?.isComplete && !hasShownCompletionAd.current) {
      hasShownCompletionAd.current = true;

      if (isDaily && !hasShownDailyModal.current) {
        hasShownDailyModal.current = true;
        const timer = setTimeout(() => {
          openDailyModal();
        }, 1000);
        return () => clearTimeout(timer);
      } else if (isChapter && !hasShownChapterModal.current) {
        hasShownChapterModal.current = true;
        const timer = setTimeout(() => {
          openChapterModal();
        }, 800);
        return () => clearTimeout(timer);
      } else if (!hasShownFreeRunModal.current) {
        hasShownFreeRunModal.current = true;
        const timer = setTimeout(() => {
          openFreeRunModal();
        }, 800);
        return () => clearTimeout(timer);
      }
    }

    // Reset flags when starting a new game
    if (!gameState?.isComplete) {
      resetAllModals();
    }
  }, [
    gameState?.isComplete,
    isDaily,
    isChapter,
    isViewOnly,
    openDailyModal,
    openChapterModal,
    openFreeRunModal,
    resetAllModals,
    hasShownCompletionAd,
    hasShownDailyModal,
    hasShownChapterModal,
    hasShownFreeRunModal,
  ]);
};

/**
 * Utility function to get difficulty for a specific puzzle number.
 * Matches ChaptersScreen logic.
 */
export const getPuzzleDifficulty = (puzzleNum: number): 'easy' | 'medium' | 'hard' | 'extreme' | 'insane' | 'inhuman' => {
  if (puzzleNum <= 20) return 'easy';
  if (puzzleNum <= 40) return 'medium';
  if (puzzleNum <= 60) return 'hard';
  if (puzzleNum <= 80) return 'extreme';
  if (puzzleNum <= 100) return 'insane';
  return 'inhuman';
};
