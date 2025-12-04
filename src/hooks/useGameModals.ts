/**
 * Hook for managing game modal visibility states.
 * Centralizes all completion modal state management.
 */

import { useState, useRef, useCallback } from 'react';
import type { SmartHint } from '../game/hintAnalyzer';

export interface GameModalsState {
  showDailyModal: boolean;
  showChapterModal: boolean;
  showFreeRunModal: boolean;
  showHintModal: boolean;
  showPointSystemModal: boolean;
  currentHint: SmartHint | null;
}

export interface GameModalsActions {
  openDailyModal: () => void;
  closeDailyModal: () => void;
  openChapterModal: () => void;
  closeChapterModal: () => void;
  openFreeRunModal: () => void;
  closeFreeRunModal: () => void;
  openHintModal: (hint: SmartHint) => void;
  closeHintModal: () => void;
  openPointSystemModal: () => void;
  closePointSystemModal: () => void;
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
  const [showHintModal, setShowHintModal] = useState(false);
  const [showPointSystemModal, setShowPointSystemModal] = useState(false);
  const [currentHint, setCurrentHint] = useState<SmartHint | null>(null);

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

  const openHintModal = useCallback((hint: SmartHint) => {
    setCurrentHint(hint);
    setShowHintModal(true);
  }, []);

  const closeHintModal = useCallback(() => {
    setShowHintModal(false);
  }, []);

  const openPointSystemModal = useCallback(() => setShowPointSystemModal(true), []);
  const closePointSystemModal = useCallback(() => setShowPointSystemModal(false), []);

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
    showHintModal,
    showPointSystemModal,
    currentHint,
    // Actions
    openDailyModal,
    closeDailyModal,
    openChapterModal,
    closeChapterModal,
    openFreeRunModal,
    closeFreeRunModal,
    openHintModal,
    closeHintModal,
    openPointSystemModal,
    closePointSystemModal,
    resetAllModals,
    // Refs
    hasShownDailyModal,
    hasShownChapterModal,
    hasShownFreeRunModal,
    hasShownCompletionAd,
  };
};
