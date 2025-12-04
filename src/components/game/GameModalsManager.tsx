/**
 * Manages and renders all game-related modals.
 * Centralizes modal rendering for Daily, Chapter, FreeRun completion and helper unlock.
 */

import React from 'react';
import { DailyCompletionModal } from '../DailyCompletionModal';
import { ChapterCompletionModal } from '../ChapterCompletionModal';
import { FreeRunCompletionModal } from '../FreeRunCompletionModal';
import { HelperAdModal } from '../HelperAdModal';
import type { Difficulty, GridType } from '../../context/GameContext';
import type { DailyChallenge } from '../../services/dailyChallengeService';

interface DailyModalProps {
  challenge: DailyChallenge;
  userId: string | null;
  difficulty: Difficulty;
  timeSeconds: number;
  mistakes: number;
  hintsUsed: number;
}

interface ChapterModalProps {
  puzzleNumber: number;
  nextPuzzleNumber: number;
  difficulty: Difficulty;
  timeSeconds: number;
  mistakes: number;
  onNextPuzzle: () => void;
}

interface FreeRunModalProps {
  difficulty: Difficulty;
  gridType: GridType;
  timeSeconds: number;
  mistakes: number;
  onPlayAgain: () => void;
}

interface GameModalsManagerProps {
  // Mode flags
  isDaily: boolean;
  isChapter: boolean;
  isViewOnly: boolean;

  // Modal visibility
  showDailyModal: boolean;
  showChapterModal: boolean;
  showFreeRunModal: boolean;
  showHelperAdModal: boolean;

  // Modal close handlers
  onCloseDailyModal: () => void;
  onCloseChapterModal: () => void;
  onCloseFreeRunModal: () => void;
  onCloseHelperAdModal: () => void;

  // Helper unlock callback
  onHelperUnlocked: () => void;

  // Modal-specific props
  dailyProps: DailyModalProps;
  chapterProps: ChapterModalProps;
  freeRunProps: FreeRunModalProps;
}

export const GameModalsManager: React.FC<GameModalsManagerProps> = ({
  isDaily,
  isChapter,
  isViewOnly,
  showDailyModal,
  showChapterModal,
  showFreeRunModal,
  showHelperAdModal,
  onCloseDailyModal,
  onCloseChapterModal,
  onCloseFreeRunModal,
  onCloseHelperAdModal,
  onHelperUnlocked,
  dailyProps,
  chapterProps,
  freeRunProps,
}) => {
  return (
    <>
      {/* Daily Completion Modal - only show if not view-only */}
      {isDaily && !isViewOnly && (
        <DailyCompletionModal
          visible={showDailyModal}
          onClose={onCloseDailyModal}
          challenge={dailyProps.challenge}
          userId={dailyProps.userId}
          difficulty={dailyProps.difficulty}
          timeSeconds={dailyProps.timeSeconds}
          mistakes={dailyProps.mistakes}
          hintsUsed={dailyProps.hintsUsed}
        />
      )}

      {/* Chapter Completion Modal */}
      {isChapter && (
        <ChapterCompletionModal
          visible={showChapterModal}
          onClose={onCloseChapterModal}
          onNextPuzzle={chapterProps.onNextPuzzle}
          puzzleNumber={chapterProps.puzzleNumber}
          nextPuzzleNumber={chapterProps.nextPuzzleNumber}
          difficulty={chapterProps.difficulty}
          timeSeconds={chapterProps.timeSeconds}
          mistakes={chapterProps.mistakes}
        />
      )}

      {/* Free Run Completion Modal */}
      {!isDaily && !isChapter && (
        <FreeRunCompletionModal
          visible={showFreeRunModal}
          onClose={onCloseFreeRunModal}
          onPlayAgain={freeRunProps.onPlayAgain}
          difficulty={freeRunProps.difficulty}
          gridType={freeRunProps.gridType}
          timeSeconds={freeRunProps.timeSeconds}
          mistakes={freeRunProps.mistakes}
        />
      )}

      {/* Helper Ad Modal - for unlocking Smart Possibility Helper */}
      <HelperAdModal
        visible={showHelperAdModal}
        onClose={onCloseHelperAdModal}
        onUnlocked={onHelperUnlocked}
      />
    </>
  );
};
