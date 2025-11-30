/**
 * Manages and renders all game-related modals.
 * Centralizes modal rendering for Daily, Chapter, FreeRun completion and hints.
 */

import React from 'react';
import { DailyCompletionModal } from '../DailyCompletionModal';
import { ChapterCompletionModal } from '../ChapterCompletionModal';
import { FreeRunCompletionModal } from '../FreeRunCompletionModal';
import { SmartHintModal } from '../SmartHintModal';
import type { SmartHint } from '../../game/hintAnalyzer';
import type { Difficulty, GridType } from '../../context/GameContext';

interface DailyModalProps {
  challengeId: string;
  challengeDate: string;
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
  showHintModal: boolean;

  // Modal close handlers
  onCloseDailyModal: () => void;
  onCloseChapterModal: () => void;
  onCloseFreeRunModal: () => void;
  onCloseHintModal: () => void;

  // Hint
  currentHint: SmartHint | null;
  onApplyHint: () => void;

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
  showHintModal,
  onCloseDailyModal,
  onCloseChapterModal,
  onCloseFreeRunModal,
  onCloseHintModal,
  currentHint,
  onApplyHint,
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
          challengeId={dailyProps.challengeId}
          challengeDate={dailyProps.challengeDate}
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

      {/* Smart Hint Modal */}
      <SmartHintModal
        visible={showHintModal}
        hint={currentHint}
        onClose={onCloseHintModal}
        onApplyHint={onApplyHint}
      />
    </>
  );
};
