/**
 * Hook for managing game modal visibility states.
 * Centralizes all completion modal state management.
 */

import { useState, useRef, useCallback } from 'react';

export interface GameModalsState {
  showDailyModal: boolean;
  showChapterModal: boolean;
  showFreeRunModal: boolean;
}

export interface GameModalsActions {
  openDailyModal: () => void;
  closeDailyModal: () => void;
  openChapterModal: () => void;
  closeChapterModal: () => void;
  openFreeRunModal: () => void;
  closeFreeRunModal: () => void;
  resetAllModals: () => void;
}

export interface UseGameModalsReturn extends GameModalsState, GameModalsActions {
  hasShownDailyModal: React.RefObject<boolean>;
  hasShownChapterModal: React.RefObject<boolean>;
  hasShownFreeRunModal: React.RefObject<boolean>;
  hasShownCompletionAd: React.RefObject<boolean>;
}

export const useGameModals = (): UseGameModalsReturn => {
  const [showDailyModal, setShowDailyModal] = useState(false);
  const [showChapterModal, setShowChapterModal] = useState(false);
  const [showFreeRunModal, setShowFreeRunModal] = useState(false);

  // Refs to track if modals have been shown (prevent duplicate shows)
  const hasShownDailyModal = useRef(false);
  const hasShownChapterModal = useRef(false);
  const hasShownFreeRunModal = useRef(false);
  const hasShownCompletionAd = useRef(false);

  const openDailyModal = useCallback(() => setShowDailyModal(true), []);
  const closeDailyModal = useCallback(() => setShowDailyModal(false), []);

  const openChapterModal = useCallback(() => setShowChapterModal(true), []);
  const closeChapterModal = useCallback(() => setShowChapterModal(false), []);

  const openFreeRunModal = useCallback(() => setShowFreeRunModal(true), []);
  const closeFreeRunModal = useCallback(() => setShowFreeRunModal(false), []);

  const resetAllModals = useCallback(() => {
    hasShownCompletionAd.current = false;
    hasShownDailyModal.current = false;
    hasShownChapterModal.current = false;
    hasShownFreeRunModal.current = false;
  }, []);

  return {
    // State
    showDailyModal,
    showChapterModal,
    showFreeRunModal,
    // Actions
    openDailyModal,
    closeDailyModal,
    openChapterModal,
    closeChapterModal,
    openFreeRunModal,
    closeFreeRunModal,
    resetAllModals,
    // Refs
    hasShownDailyModal,
    hasShownChapterModal,
    hasShownFreeRunModal,
    hasShownCompletionAd,
  };
};
