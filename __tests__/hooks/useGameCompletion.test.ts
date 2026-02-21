/**
 * Tests for src/hooks/useGameCompletion.ts
 * Game completion detection and modal triggering.
 */

import { renderHook } from '@testing-library/react-native';
import { useGameCompletion, getPuzzleDifficulty } from '../../src/hooks/useGameCompletion';
import type { GameState } from '../../src/context/GameContext';
import { TIMING } from '../../src/config/timing';

describe('useGameCompletion', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const createModals = () => ({
    showDailyModal: false,
    showChapterModal: false,
    showFreeRunModal: false,
    showPointSystemModal: false,
    openDailyModal: jest.fn(),
    closeDailyModal: jest.fn(),
    openChapterModal: jest.fn(),
    closeChapterModal: jest.fn(),
    openFreeRunModal: jest.fn(),
    closeFreeRunModal: jest.fn(),
    openPointSystemModal: jest.fn(),
    closePointSystemModal: jest.fn(),
    resetAllModals: jest.fn(),
    hasShownDailyModal: { current: false },
    hasShownChapterModal: { current: false },
    hasShownFreeRunModal: { current: false },
    hasShownCompletionAd: { current: false },
  });

  const createGameState = (overrides: Partial<GameState> = {}): GameState =>
    ({ isComplete: false, ...overrides } as GameState);

  // ============ Daily Completion ============

  it('should open daily modal on daily completion after delay', () => {
    const modals = createModals();
    renderHook(() =>
      useGameCompletion({
        gameState: createGameState({ isComplete: true }),
        modals,
        isDaily: true,
        isChapter: false,
        isViewOnly: false,
      })
    );

    expect(modals.openDailyModal).not.toHaveBeenCalled();
    jest.advanceTimersByTime(TIMING.MODAL_DELAYS.DAILY_COMPLETION);
    expect(modals.openDailyModal).toHaveBeenCalledTimes(1);
  });

  // ============ Chapter Completion ============

  it('should open chapter modal on chapter completion after delay', () => {
    const modals = createModals();
    renderHook(() =>
      useGameCompletion({
        gameState: createGameState({ isComplete: true }),
        modals,
        isDaily: false,
        isChapter: true,
        isViewOnly: false,
      })
    );

    jest.advanceTimersByTime(TIMING.MODAL_DELAYS.CHAPTER_COMPLETION);
    expect(modals.openChapterModal).toHaveBeenCalledTimes(1);
  });

  // ============ Free Run Completion ============

  it('should open free run modal when not daily or chapter', () => {
    const modals = createModals();
    renderHook(() =>
      useGameCompletion({
        gameState: createGameState({ isComplete: true }),
        modals,
        isDaily: false,
        isChapter: false,
        isViewOnly: false,
      })
    );

    jest.advanceTimersByTime(TIMING.MODAL_DELAYS.FREERUN_COMPLETION);
    expect(modals.openFreeRunModal).toHaveBeenCalledTimes(1);
  });

  // ============ View Only ============

  it('should not show any modal in view-only mode', () => {
    const modals = createModals();
    renderHook(() =>
      useGameCompletion({
        gameState: createGameState({ isComplete: true }),
        modals,
        isDaily: true,
        isChapter: false,
        isViewOnly: true,
      })
    );

    jest.advanceTimersByTime(5000);
    expect(modals.openDailyModal).not.toHaveBeenCalled();
    expect(modals.openChapterModal).not.toHaveBeenCalled();
    expect(modals.openFreeRunModal).not.toHaveBeenCalled();
  });

  // ============ Duplicate Prevention ============

  it('should not show modal twice when already shown', () => {
    const modals = createModals();
    modals.hasShownCompletionAd.current = true;

    renderHook(() =>
      useGameCompletion({
        gameState: createGameState({ isComplete: true }),
        modals,
        isDaily: true,
        isChapter: false,
        isViewOnly: false,
      })
    );

    jest.advanceTimersByTime(5000);
    expect(modals.openDailyModal).not.toHaveBeenCalled();
  });

  // ============ Reset on New Game ============

  it('should reset modal flags when game is not complete', () => {
    const modals = createModals();
    renderHook(() =>
      useGameCompletion({
        gameState: createGameState({ isComplete: false }),
        modals,
        isDaily: false,
        isChapter: false,
        isViewOnly: false,
      })
    );

    expect(modals.resetAllModals).toHaveBeenCalled();
  });

  // ============ Null GameState ============

  it('should handle null gameState gracefully', () => {
    const modals = createModals();
    expect(() =>
      renderHook(() =>
        useGameCompletion({
          gameState: null,
          modals,
          isDaily: false,
          isChapter: false,
          isViewOnly: false,
        })
      )
    ).not.toThrow();
  });
});

// ============ getPuzzleDifficulty ============

describe('getPuzzleDifficulty', () => {
  it.each([
    [1, 'easy'],
    [30, 'easy'],
    [31, 'medium'],
    [60, 'medium'],
    [61, 'hard'],
    [90, 'hard'],
    [91, 'extreme'],
    [120, 'extreme'],
    [121, 'insane'],
    [150, 'insane'],
    [151, 'inhuman'],
    [200, 'inhuman'],
  ])('should return %s for puzzle %d', (puzzleNum, expected) => {
    expect(getPuzzleDifficulty(puzzleNum)).toBe(expected);
  });
});
