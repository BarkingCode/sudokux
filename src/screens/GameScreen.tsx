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
import type { DailyChallenge } from '../services/dailyChallengeService';
import { BrutalistText } from '../components/BrutalistText';
import { SudokuBoard } from '../components/board/SudokuBoard';
import { GamePlayArea } from '../components/game/GamePlayArea';
import { ViewOnlyStats } from '../components/game/ViewOnlyStats';
import { GameModalsManager } from '../components/game/GameModalsManager';
import { useGameModals, useUserId, useGameCompletion, getPuzzleDifficulty } from '../hooks';
import { loadData, saveData, removeData, STORAGE_KEYS } from '../utils/storage';

const { width, height } = Dimensions.get('window');
// Detect iPad for layout adjustments
const isTablet = Platform.OS === 'ios' && (width >= 768 || (Math.min(width, height) / Math.max(width, height)) > 0.65);

interface GameProgress {
  currentPuzzle: number;
  completedPuzzles: number[];
  chapterGamesCompleted: number;
}

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

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
    devAutoComplete,
    saveChapterProgress,
    clearChapterProgress,
    incrementMistakes,
  } = useGame();
  const { onChapterComplete: showChapterAd, isAdFree } = useAds();
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
      };
    }, [pauseGame, resumeGame, isChapter, isFreeRun, isViewOnly, puzzleNumber, saveChapterProgress])
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
        if (num !== 0 && gameState.solution[row][col] !== num) {
          incrementMistakes();
        }
        updateCell(row, col, num);
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

  // Toggle helper handler - shows ad modal if not unlocked
  const handleToggleHelper = useCallback(() => {
    if (!gameState) return;
    if (gameState.isHelperUnlocked) return; // Already unlocked
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowHelperAdModal(true);
  }, [gameState?.isHelperUnlocked]);

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
        hintsUsed: gameState.hintsUsed || 0,
      });

      // Check and unlock achievements after chapter completion
      if (supabaseUserId) {
        await checkAchievements(supabaseUserId, {
          difficulty: gameState.difficulty,
          timeSeconds: gameState.timer || 0,
          mistakes: gameState.mistakes,
          hintsUsed: gameState.hintsUsed || 0,
        });
        // Also unlock the chapter_complete achievement
        await onChapterComplete(supabaseUserId);
      }
      console.log('[GameScreen] Saved chapter completion and checked achievements');
    } catch (error) {
      console.error('[GameScreen] Failed to save chapter completion:', error);
    }
  }, [isChapter, gameState, internalUserId, supabaseUserId, puzzleNumber]);

  // Save free run completion to game_sessions table
  const saveFreeRunCompletion = useCallback(async () => {
    if (!isFreeRun || !gameState || !supabaseUserId || !gameState.isComplete) return;

    try {
      await statsService.recordGame(supabaseUserId, {
        puzzleId: gameState.puzzleId || `freerun-${Date.now()}`,
        difficulty: gameState.difficulty,
        timeSeconds: gameState.timer || 0,
        mistakes: gameState.mistakes,
        hintsUsed: gameState.hintsUsed || 0,
        completed: true,
      });

      // Check and unlock achievements after free run completion
      await checkAchievements(supabaseUserId, {
        difficulty: gameState.difficulty,
        timeSeconds: gameState.timer || 0,
        mistakes: gameState.mistakes,
        hintsUsed: gameState.hintsUsed || 0,
      });
      console.log('[GameScreen] Saved free run completion and checked achievements');
    } catch (error) {
      console.error('[GameScreen] Failed to save free run completion:', error);
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
      console.log('[GameScreen] Ad error:', err);
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
        console.log('[GameScreen] Ad error:', err);
      }
    }
    modals.closeChapterModal();
    router.back();
  }, [isChapter, puzzleNumber, chapterGamesCount, router, saveChapterCompletion, showChapterAd, clearChapterProgress, modals]);

  // Handle free run play again
  const handleFreeRunPlayAgain = useCallback(async () => {
    if (!gameState) return;

    // Save current game's parameters before clearing
    const currentDifficulty = gameState.difficulty;
    const currentGridType = gameState.gridType;

    // Record the completed game to game_sessions
    await saveFreeRunCompletion();
    // Clear saved Free Run state since we're starting fresh
    await removeData(STORAGE_KEYS.FREERUN_GAME_STATE);

    // Close the modal
    modals.closeFreeRunModal();

    // Start a new game with the same difficulty and grid type
    startNewGame(currentDifficulty, currentGridType);
  }, [gameState, modals, saveFreeRunCompletion, startNewGame]);

  // Handle back to free run
  const handleBackToFreeRun = useCallback(async () => {
    // Record the completed game to game_sessions
    await saveFreeRunCompletion();
    // Clear saved Free Run state since game is complete
    await removeData(STORAGE_KEYS.FREERUN_GAME_STATE);

    modals.closeFreeRunModal();
    router.back();
  }, [router, modals, saveFreeRunCompletion]);

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
        onCloseDailyModal={handleDailyModalClose}
        onCloseChapterModal={handleBackToChapters}
        onCloseFreeRunModal={handleBackToFreeRun}
        onCloseHelperAdModal={() => setShowHelperAdModal(false)}
        onHelperUnlocked={handleHelperUnlocked}
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
          hintsUsed: gameState.hintsUsed || 0,
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
    width: 70,
    alignItems: 'flex-end',
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
