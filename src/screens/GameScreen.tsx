/**
 * Main game screen for playing Sudoku.
 * Orchestrates game components, handles navigation, and manages game modes.
 */

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, StyleSheet, Pressable, ActivityIndicator, AppState, AppStateStatus, Platform, Dimensions } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack, useRouter, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import * as KeepAwake from 'expo-keep-awake';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import { useTheme } from '../context/ThemeContext';
import { useGame } from '../context/GameContext';
import { useAds } from '../context/AdContext';
import { AD_UNIT_IDS } from '../config/ads';
import { chapterService } from '../services/chapterService';
import { getChapterPuzzle } from '../game/chapterPuzzles';
import { statsService } from '../services/statsService';
import { checkAchievements, onChapterComplete } from '../services/achievementService';
import { logGameCompleted, logChapterCompleted } from '../services/facebookAnalytics';
import type { DailyChallenge } from '../services/dailyChallengeService';
import { BrutalistText } from '../components/BrutalistText';
import { SudokuBoard } from '../components/board/SudokuBoard';
import { GamePlayArea } from '../components/game/GamePlayArea';
import { ViewOnlyStats } from '../components/game/ViewOnlyStats';
import { GameModalsManager } from '../components/game/GameModalsManager';
import { useGameModals, useUserId, useGameCompletion, getPuzzleDifficulty } from '../hooks';
import { loadData, saveData, removeData, STORAGE_KEYS } from '../utils/storage';
import { GameLimitModal } from '../components/GameLimitModal';
import { formatTime } from '../utils/timeFormatters';
import { createScopedLogger } from '../utils/logger';

const log = createScopedLogger('GameScreen');

// Keep-awake helper functions with safe fallbacks
const activateKeepAwake = () => {
  try {
    KeepAwake.activateKeepAwake();
  } catch {
    // Silently fail if not available
  }
};
const deactivateKeepAwake = () => {
  try {
    KeepAwake.deactivateKeepAwake();
  } catch {
    // Silently fail if not available
  }
};

const { width, height } = Dimensions.get('window');
// Detect iPad for layout adjustments
const isTablet = Platform.OS === 'ios' && (width >= 768 || (Math.min(width, height) / Math.max(width, height)) > 0.65);

interface GameProgress {
  currentPuzzle: number;
  completedPuzzles: number[];
  chapterGamesCompleted: number;
}

export default function GameScreen() {
  const { colors, isDark } = useTheme();
  const {
    gameState,
    startNewGame,
    loadSavedPuzzle,
    updateCell,
    addNote,
    removeNote,
    undo,
    resetBoard,
    pauseGame,
    resumeGame,
    unlockHelper,
    toggleHelper,
    devAutoComplete,
    saveChapterProgress,
    clearChapterProgress,
    saveDailyProgress,
    clearDailyProgress,
    incrementMistakes,
  } = useGame();
  const {
    onChapterComplete: showChapterAd,
    isAdFree,
    consumeFreeRunGame,
    isAtFreeRunLimit,
    checkAndResetDaily,
  } = useAds();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const modals = useGameModals();

  // Route params
  const params = useLocalSearchParams<{
    isDaily?: string;
    challengeId?: string;
    challengeDate?: string;
    isChapter?: string;
    puzzleNumber?: string;
    chapterGamesCompleted?: string;
    viewOnly?: string;
    completionTime?: string;
    completionMistakes?: string;
    completionRank?: string;
  }>();

  // Parse route params
  const isDaily = params.isDaily === 'true';
  const isChapter = params.isChapter === 'true';
  const isViewOnly = params.viewOnly === 'true';
  const puzzleNumber = parseInt(params.puzzleNumber || '1', 10);
  const challengeId = params.challengeId || '';
  const challengeDate = params.challengeDate || '';
  const initialChapterGamesCompleted = parseInt(params.chapterGamesCompleted || '0', 10);

  // View-only mode stats
  const completionTime = params.completionTime ? parseInt(params.completionTime, 10) : 0;
  const completionMistakes = params.completionMistakes ? parseInt(params.completionMistakes, 10) : 0;
  const completionRank = params.completionRank ? parseInt(params.completionRank, 10) : null;

  // Local state
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
  const [notesMode, setNotesMode] = useState(false);
  const [chapterGamesCount, setChapterGamesCount] = useState(initialChapterGamesCompleted);
  const [showHelperAdModal, setShowHelperAdModal] = useState(false);
  const [showGameLimitModal, setShowGameLimitModal] = useState(false);

  // Ref to access current gameState in cleanup without causing re-renders
  const gameStateRef = useRef(gameState);
  gameStateRef.current = gameState;

  // Load user IDs:
  // - internalUserId: for chapter service (looks up by internal_id)
  // - supabaseUserId: for daily completions (foreign key to users.id)
  const { userId: internalUserId } = useUserId({ useInternalId: true });
  const { userId: supabaseUserId } = useUserId({ useInternalId: false });

  // Handle completion modal triggering
  useGameCompletion({
    gameState,
    modals,
    isDaily,
    isChapter,
    isViewOnly,
  });

  // Start new game if none exists
  useEffect(() => {
    if (!gameState) {
      startNewGame('easy');
    }
  }, []);

  // Determine if this is a Free Run game (not daily, not chapter)
  const isFreeRun = !isDaily && !isChapter;

  // Pause/resume timer when screen gains/loses focus
  useFocusEffect(
    useCallback(() => {
      resumeGame();
      return () => {
        pauseGame();
        const currentGameState = gameStateRef.current;
        if (isChapter && !currentGameState?.isComplete && !isViewOnly) {
          saveChapterProgress(puzzleNumber);
        }
        // Save Free Run progress when leaving screen
        if (isFreeRun && currentGameState && !currentGameState.isComplete && !isViewOnly) {
          saveData(STORAGE_KEYS.FREERUN_GAME_STATE, currentGameState);
        }
        // Save Daily progress when leaving screen
        if (isDaily && currentGameState && !currentGameState.isComplete && !isViewOnly) {
          saveDailyProgress(challengeDate, challengeId);
        }
      };
    }, [pauseGame, resumeGame, isChapter, isFreeRun, isDaily, isViewOnly, puzzleNumber, saveChapterProgress, saveDailyProgress, challengeDate, challengeId])
  );

  // Pause/resume timer when app goes to background/foreground
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        resumeGame();
      } else {
        pauseGame();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [pauseGame, resumeGame]);

  // Keep screen awake during active gameplay
  useEffect(() => {
    if (gameState && !gameState.isComplete && !gameState.isPaused && !isViewOnly) {
      activateKeepAwake();
    } else {
      deactivateKeepAwake();
    }
    return () => {
      deactivateKeepAwake();
    };
  }, [gameState?.isComplete, gameState?.isPaused, isViewOnly]);

  // Cell press handler
  const handleCellPress = useCallback((row: number, col: number) => {
    setSelectedCell({ row, col });
  }, []);

  // Number press handler
  const handleNumberPress = useCallback((num: number) => {
    if (selectedCell && gameState && !gameState.isLoading) {
      const { row, col } = selectedCell;
      if (gameState.initialGrid[row][col] !== 0) return;

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      if (notesMode) {
        if (gameState.grid[row][col] === 0) {
          const key = `${row}-${col}`;
          const currentNotes = gameState.notes[key] || [];
          if (currentNotes.includes(num)) {
            removeNote(row, col, num);
          } else {
            addNote(row, col, num);
          }
        }
      } else {
        const currentValue = gameState.grid[row][col];

        // If tapping the same number that's already in the cell, clear it
        if (currentValue === num) {
          updateCell(row, col, 0);
        } else {
          if (num !== 0 && gameState.solution[row][col] !== num) {
            incrementMistakes();
          }
          updateCell(row, col, num);
        }
      }
    }
  }, [selectedCell, gameState, updateCell, addNote, removeNote, notesMode, incrementMistakes]);

  // Reset board handler
  const handleReset = useCallback(() => {
    if (gameState && !gameState.isLoading) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      resetBoard();
    }
  }, [gameState, resetBoard]);

  // Toggle notes mode
  const toggleNotesMode = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setNotesMode((prev) => !prev);
  }, []);

  // Toggle helper handler - shows ad modal if not unlocked, toggles if unlocked
  const handleToggleHelper = useCallback(() => {
    if (!gameState) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (!gameState.isHelperUnlocked) {
      // Not unlocked yet - show ad modal to unlock
      setShowHelperAdModal(true);
    } else {
      // Already unlocked - toggle on/off
      toggleHelper();
    }
  }, [gameState?.isHelperUnlocked, toggleHelper]);

  // Handle helper unlock after watching ad
  const handleHelperUnlocked = useCallback(() => {
    setShowHelperAdModal(false);
    unlockHelper();
  }, [unlockHelper]);

  // Save chapter completion to Supabase
  const saveChapterCompletion = useCallback(async () => {
    if (!isChapter || !gameState || !internalUserId) return;

    try {
      await chapterService.saveCompletion(internalUserId, {
        puzzleNumber,
        difficulty: gameState.difficulty,
        gridType: gameState.gridType,
        puzzleGrid: gameState.initialGrid,
        solutionGrid: gameState.solution,
        timeSeconds: gameState.timer || 0,
        mistakes: gameState.mistakes,
        helperUsed: gameState.helperUsed || 0,
      });

      // Check and unlock achievements after chapter completion
      if (supabaseUserId) {
        await checkAchievements(supabaseUserId, {
          difficulty: gameState.difficulty,
          timeSeconds: gameState.timer || 0,
          mistakes: gameState.mistakes,
          helperUsed: gameState.helperUsed || 0,
        });
        // Also unlock the chapter_complete achievement
        await onChapterComplete(supabaseUserId);
      }

      // Log Facebook analytics events
      logGameCompleted(gameState.difficulty);
      logChapterCompleted(puzzleNumber, 3); // Assuming 3 stars max for now

      log.debug('Saved chapter completion and checked achievements');
    } catch (error) {
      log.error('Failed to save chapter completion', { error });
    }
  }, [isChapter, gameState, internalUserId, supabaseUserId, puzzleNumber]);

  // Save free run completion to game_sessions table
  const saveFreeRunCompletion = useCallback(async () => {
    if (!isFreeRun || !gameState || !gameState.isComplete) return;

    if (!supabaseUserId) {
      log.warn('Cannot save free run: supabaseUserId not available', {
        gridType: gameState.gridType,
        difficulty: gameState.difficulty,
      });
      return;
    }

    try {
      await statsService.recordGame(supabaseUserId, {
        puzzleId: gameState.puzzleId || `freerun-${Date.now()}`,
        difficulty: gameState.difficulty,
        timeSeconds: gameState.timer || 0,
        mistakes: gameState.mistakes,
        helperUsed: gameState.helperUsed || 0,
        completed: true,
        gridType: gameState.gridType,
      });

      // Check and unlock achievements after free run completion
      await checkAchievements(supabaseUserId, {
        difficulty: gameState.difficulty,
        timeSeconds: gameState.timer || 0,
        mistakes: gameState.mistakes,
        helperUsed: gameState.helperUsed || 0,
      });

      // Log Facebook analytics event
      logGameCompleted(gameState.difficulty);

      log.debug('Saved free run completion and checked achievements', {
        gridType: gameState.gridType,
        difficulty: gameState.difficulty,
      });
    } catch (error) {
      log.error('Failed to save free run completion', { error });
    }
  }, [isFreeRun, gameState, supabaseUserId]);

  // Handle next puzzle in chapter mode
  const handleNextPuzzle = useCallback(async () => {
    if (!isChapter) return;

    const nextPuzzle = puzzleNumber + 1;
    const nextDifficulty = getPuzzleDifficulty(nextPuzzle);
    const newGamesCount = chapterGamesCount + 1;

    saveChapterCompletion();
    clearChapterProgress();

    const currentProgress = await loadData<GameProgress>(STORAGE_KEYS.CHAPTER_PROGRESS);
    if (currentProgress) {
      const completedPuzzles = currentProgress.completedPuzzles.includes(puzzleNumber)
        ? currentProgress.completedPuzzles
        : [...currentProgress.completedPuzzles, puzzleNumber];

      await saveData(STORAGE_KEYS.CHAPTER_PROGRESS, {
        ...currentProgress,
        currentPuzzle: nextPuzzle,
        completedPuzzles,
        chapterGamesCompleted: newGamesCount,
      });
    }

    setChapterGamesCount(newGamesCount);

    try {
      await showChapterAd();
    } catch (err) {
      log.error('Ad error', { error: err });
    }

    modals.closeChapterModal();

    // Load the next chapter puzzle (deterministic based on puzzle number)
    const nextChapterPuzzle = getChapterPuzzle(nextPuzzle, '9x9');
    loadSavedPuzzle({
      puzzleId: `chapter-${nextPuzzle}`,
      difficulty: nextChapterPuzzle.difficulty,
      gridType: '9x9',
      puzzle: nextChapterPuzzle.puzzle,
      solution: nextChapterPuzzle.solution,
    });

    router.setParams({
      puzzleNumber: nextPuzzle.toString(),
      chapterGamesCompleted: newGamesCount.toString(),
    });
  }, [isChapter, puzzleNumber, chapterGamesCount, router, showChapterAd, loadSavedPuzzle, saveChapterCompletion, clearChapterProgress, modals]);

  // Handle back to chapters
  const handleBackToChapters = useCallback(async () => {
    if (isChapter) {
      const newGamesCount = chapterGamesCount + 1;
      saveChapterCompletion();
      clearChapterProgress();

      const currentProgress = await loadData<GameProgress>(STORAGE_KEYS.CHAPTER_PROGRESS);
      if (currentProgress) {
        const completedPuzzles = currentProgress.completedPuzzles.includes(puzzleNumber)
          ? currentProgress.completedPuzzles
          : [...currentProgress.completedPuzzles, puzzleNumber];

        await saveData(STORAGE_KEYS.CHAPTER_PROGRESS, {
          ...currentProgress,
          currentPuzzle: puzzleNumber + 1,
          completedPuzzles,
          chapterGamesCompleted: newGamesCount,
        });
      }

      try {
        await showChapterAd();
      } catch (err) {
        log.error('Ad error', { error: err });
      }
    }
    modals.closeChapterModal();
    router.back();
  }, [isChapter, puzzleNumber, chapterGamesCount, router, saveChapterCompletion, showChapterAd, clearChapterProgress, modals]);

  // Handle free run play again
  const handleFreeRunPlayAgain = useCallback(async () => {
    log.debug('handleFreeRunPlayAgain called', {
      hasGameState: !!gameState,
      isAtFreeRunLimit,
    });

    if (!gameState) return;

    // Save current game's parameters before clearing
    const currentDifficulty = gameState.difficulty;
    const currentGridType = gameState.gridType;

    // Record the completed game to game_sessions
    await saveFreeRunCompletion();
    // Clear saved Free Run state since we're starting fresh
    await removeData(STORAGE_KEYS.FREERUN_GAME_STATE);

    // Close the completion modal first
    modals.closeFreeRunModal();

    // Check for daily reset before checking limit
    const didReset = checkAndResetDaily();
    log.debug('handleFreeRunPlayAgain: daily reset check', { didReset });

    // Consume a game from the session (uses ref for accurate sync check)
    // This replaces the isAtFreeRunLimit check which uses stale React state
    const canPlay = consumeFreeRunGame();
    log.debug('handleFreeRunPlayAgain: consumeFreeRunGame result', { canPlay });
    if (!canPlay) {
      log.debug('handleFreeRunPlayAgain: at limit, showing modal');
      setShowGameLimitModal(true);
      return;
    }

    // Start a new game with the same difficulty and grid type
    log.debug('handleFreeRunPlayAgain: starting new game', { currentDifficulty, currentGridType });
    startNewGame(currentDifficulty, currentGridType);
  }, [gameState, modals, saveFreeRunCompletion, startNewGame, checkAndResetDaily, isAtFreeRunLimit, consumeFreeRunGame]);

  // Handle back to free run
  const handleBackToFreeRun = useCallback(async () => {
    // Record the completed game to game_sessions
    await saveFreeRunCompletion();
    // Clear saved Free Run state since game is complete
    await removeData(STORAGE_KEYS.FREERUN_GAME_STATE);

    modals.closeFreeRunModal();
    router.back();
  }, [router, modals, saveFreeRunCompletion]);

  // Handle unlock from GameLimitModal (after watching ad in play again flow)
  const handleGameLimitUnlocked = useCallback(() => {
    log.debug('handleGameLimitUnlocked called', {
      hasGameState: !!gameState,
      difficulty: gameState?.difficulty,
      gridType: gameState?.gridType,
    });

    if (!gameState) return;

    setShowGameLimitModal(false);

    // After watching ad, games are already added by the ad context
    // Start a new game with the same settings
    log.debug('handleGameLimitUnlocked: starting new game');
    startNewGame(gameState.difficulty, gameState.gridType);
  }, [gameState, startNewGame]);

  // Handle daily modal close
  const handleDailyModalClose = useCallback(() => {
    modals.closeDailyModal();
    router.back();
  }, [modals, router]);

  // Show loading state
  if (!gameState || gameState.isLoading) {
    return (
      <SafeAreaView style={[styles.container, styles.loadingContainer, { backgroundColor: colors.background }]}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator size="large" color={colors.primary} />
        <BrutalistText size={14} mono muted style={{ marginTop: 16 }}>
          Loading puzzle...
        </BrutalistText>
      </SafeAreaView>
    );
  }

  const difficultyLabel = gameState.gridType === '6x6'
    ? `Mini · ${gameState.difficulty}`
    : gameState.difficulty;

  const showBanner = !isAdFree && Platform.OS !== 'web';

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={showBanner ? ['top', 'left', 'right'] : ['top', 'left', 'right', 'bottom']}
    >
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header - stays at top */}
      <Animated.View entering={FadeIn.delay(100)} style={styles.header}>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            if (!isViewOnly) pauseGame();
            router.back();
          }}
          style={[styles.backButton, { borderColor: colors.primary }]}
        >
          <BrutalistText size={20} bold>←</BrutalistText>
        </Pressable>

        <View style={styles.headerCenter}>
          <BrutalistText size={12} mono uppercase muted>
            {isViewOnly ? 'COMPLETED' : difficultyLabel}
          </BrutalistText>
        </View>

        <View style={styles.headerRight}>
          {isViewOnly ? (
            <BrutalistText size={12} mono bold color={colors.success}>
              {formatTime(completionTime)}
            </BrutalistText>
          ) : (
            <Pressable onPress={() => __DEV__ && devAutoComplete()}>
              <BrutalistText size={16} mono bold>
                {formatTime(gameState.timer || 0)}
              </BrutalistText>
            </Pressable>
          )}
        </View>
      </Animated.View>

      {/* Game content wrapper - centers game area on iPad */}
      <View style={[styles.gameContentWrapper, isTablet && styles.gameContentWrapperTablet]}>
        {isViewOnly ? (
          <>
            {/* Board (view-only) */}
            <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.boardContainer}>
              <SudokuBoard selectedCell={null} onCellPress={() => {}} />
            </Animated.View>
            {/* View-Only Stats */}
            <ViewOnlyStats
              completionTime={completionTime}
              completionMistakes={completionMistakes}
              completionRank={completionRank}
              isDaily={isDaily}
              isChapter={isChapter}
              onBack={() => router.back()}
            />
          </>
        ) : (
          <GamePlayArea
            gameState={gameState}
            selectedCell={selectedCell}
            notesMode={notesMode}
            onCellPress={handleCellPress}
            onNumberPress={handleNumberPress}
            onReset={handleReset}
            onUndo={undo}
            onToggleNotes={toggleNotesMode}
            onToggleHelper={handleToggleHelper}
          />
        )}
      </View>

      {/* Modals */}
      <GameModalsManager
        isDaily={isDaily}
        isChapter={isChapter}
        isViewOnly={isViewOnly}
        showDailyModal={modals.showDailyModal}
        showChapterModal={modals.showChapterModal}
        showFreeRunModal={modals.showFreeRunModal}
        showHelperAdModal={showHelperAdModal}
        showPointSystemModal={modals.showPointSystemModal}
        onCloseDailyModal={handleDailyModalClose}
        onCloseChapterModal={handleBackToChapters}
        onCloseFreeRunModal={handleBackToFreeRun}
        onCloseHelperAdModal={() => setShowHelperAdModal(false)}
        onClosePointSystemModal={modals.closePointSystemModal}
        onHelperUnlocked={handleHelperUnlocked}
        gridType={gameState.gridType}
        dailyProps={{
          challenge: {
            id: challengeId,
            challenge_date: challengeDate,
            grid_type: gameState.gridType,
            difficulty: gameState.difficulty,
            puzzle_grid: gameState.initialGrid,
            solution_grid: gameState.solution,
          } as DailyChallenge,
          userId: supabaseUserId,
          difficulty: gameState.difficulty,
          timeSeconds: gameState.timer || 0,
          mistakes: gameState.mistakes,
          helperUsed: gameState.helperUsed || 0,
          onClearProgress: clearDailyProgress,
        }}
        chapterProps={{
          puzzleNumber,
          nextPuzzleNumber: puzzleNumber + 1,
          difficulty: getPuzzleDifficulty(puzzleNumber + 1),
          timeSeconds: gameState.timer || 0,
          mistakes: gameState.mistakes,
          onNextPuzzle: handleNextPuzzle,
        }}
        freeRunProps={{
          difficulty: gameState.difficulty,
          gridType: gameState.gridType,
          timeSeconds: gameState.timer || 0,
          mistakes: gameState.mistakes,
          onPlayAgain: handleFreeRunPlayAgain,
        }}
      />

      {/* Game Limit Modal for Play Again flow */}
      {isFreeRun && (
        <GameLimitModal
          visible={showGameLimitModal}
          onClose={() => setShowGameLimitModal(false)}
          onUnlocked={handleGameLimitUnlocked}
        />
      )}

      {/* Banner Ad */}
      {showBanner && (
        <View style={[styles.bannerContainer, { paddingBottom: insets.bottom }]}>
          <BannerAd
            unitId={AD_UNIT_IDS.BANNER}
            size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
            requestOptions={{ requestNonPersonalizedAdsOnly: true }}
          />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  gameContentWrapper: {
    flex: 1,
  },
  gameContentWrapperTablet: {
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    minWidth: 90,
  },
  boardContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 8,
  },
  bannerContainer: {
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
});
