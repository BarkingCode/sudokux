/**
 * Hook for handling game completion detection and modal triggering.
 * Manages the workflow when a puzzle is completed.
 */

import { useEffect, useCallback } from 'react';
import type { GameState } from '../context/GameContext';
import type { UseGameModalsReturn } from './useGameModals';
import { TIMING } from '../config/timing';

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
        }, TIMING.MODAL_DELAYS.DAILY_COMPLETION);
        return () => clearTimeout(timer);
      } else if (isChapter && !hasShownChapterModal.current) {
        hasShownChapterModal.current = true;
        const timer = setTimeout(() => {
          openChapterModal();
        }, TIMING.MODAL_DELAYS.CHAPTER_COMPLETION);
        return () => clearTimeout(timer);
      } else if (!hasShownFreeRunModal.current) {
        hasShownFreeRunModal.current = true;
        const timer = setTimeout(() => {
          openFreeRunModal();
        }, TIMING.MODAL_DELAYS.FREERUN_COMPLETION);
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
export { getChapterDifficulty as getPuzzleDifficulty } from '../game/chapterPuzzles';
