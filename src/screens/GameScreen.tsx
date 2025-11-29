/**
 * Main game screen for playing Sudoku.
 * Supports both 6x6 and 9x9 grid variants.
 */

import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { View, StyleSheet, Pressable, ActivityIndicator, AppState, AppStateStatus, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack, useRouter, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import { useTheme } from '../context/ThemeContext';
import { useGame, SmartHint } from '../context/GameContext';
import { useAds } from '../context/AdContext';
import { AD_UNIT_IDS } from '../config/ads';
import { chapterService } from '../services/chapterService';
import { SudokuBoard } from '../components/board/SudokuBoard';
import { NumberPad } from '../components/NumberPad';
import { BrutalistText } from '../components/BrutalistText';
import { BrutalistButton } from '../components/BrutalistButton';
import { DailyCompletionModal } from '../components/DailyCompletionModal';
import { ChapterCompletionModal } from '../components/ChapterCompletionModal';
import { FreeRunCompletionModal } from '../components/FreeRunCompletionModal';
import { SmartHintModal } from '../components/SmartHintModal';
import { GRID_CONFIGS } from '../game/types';
import { Difficulty } from '../context/GameContext';
import { loadData, saveData, loadSecureData, STORAGE_KEYS } from '../utils/storage';

// Get difficulty for a specific puzzle number (matching ChaptersScreen logic)
const getPuzzleDifficulty = (puzzleNum: number): Difficulty => {
  if (puzzleNum <= 20) return 'easy';
  if (puzzleNum <= 40) return 'medium';
  if (puzzleNum <= 60) return 'hard';
  if (puzzleNum <= 80) return 'extreme';
  if (puzzleNum <= 100) return 'insane';
  return 'inhuman';
};

interface GameProgress {
  currentPuzzle: number;
  completedPuzzles: number[];
  chapterGamesCompleted: number;
}

export default function GameScreen() {
  const { colors, isDark } = useTheme();
  const { gameState, startNewGame, updateCell, addNote, removeNote, pauseGame, resumeGame, getSmartHint, applyHint, devAutoComplete, saveChapterProgress, clearChapterProgress } = useGame();
  const { onPuzzleComplete, isAdFree } = useAds();
  const insets = useSafeAreaInsets();
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
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
  const [notesMode, setNotesMode] = useState(false);
  const [showDailyModal, setShowDailyModal] = useState(false);
  const [showChapterModal, setShowChapterModal] = useState(false);
  const [showFreeRunModal, setShowFreeRunModal] = useState(false);
  const [showHintModal, setShowHintModal] = useState(false);
  const [currentHint, setCurrentHint] = useState<SmartHint | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [mistakesCount, setMistakesCount] = useState(0);
  const router = useRouter();
  const hasShownCompletionAd = useRef(false);
  const hasShownDailyModal = useRef(false);
  const hasShownChapterModal = useRef(false);
  const hasShownFreeRunModal = useRef(false);

  const isDaily = params.isDaily === 'true';
  const isChapter = params.isChapter === 'true';
  const isViewOnly = params.viewOnly === 'true';
  const puzzleNumber = parseInt(params.puzzleNumber || '1', 10);
  const challengeId = params.challengeId || '';
  const challengeDate = params.challengeDate || '';
  const initialChapterGamesCompleted = parseInt(params.chapterGamesCompleted || '0', 10);

  // View-only mode stats (for completed daily puzzles)
  const completionTime = params.completionTime ? parseInt(params.completionTime, 10) : 0;
  const completionMistakes = params.completionMistakes ? parseInt(params.completionMistakes, 10) : 0;
  const completionRank = params.completionRank ? parseInt(params.completionRank, 10) : null;

  // Track chapter games completed for interstitial ads (persists across puzzles in session)
  const [chapterGamesCount, setChapterGamesCount] = useState(initialChapterGamesCompleted);

  // Load user ID on mount (from SecureStore where identity is saved)
  // Note: We use identity.id (internal_id) because chapterService looks up users by internal_id
  useEffect(() => {
    loadSecureData(STORAGE_KEYS.USER_ID).then((storedData) => {
      if (storedData) {
        try {
          const identity = JSON.parse(storedData);
          // Use internal_id (identity.id) for chapterService lookups
          setUserId(identity?.id || null);
        } catch {
          setUserId(null);
        }
      }
    });
  }, []);

  // Get grid configuration for current game
  const gridConfig = useMemo(() => {
    const gridType = gameState?.gridType || '9x9';
    return GRID_CONFIGS[gridType];
  }, [gameState?.gridType]);

  useEffect(() => {
    if (!gameState) {
      startNewGame('easy');
    }
  }, []);

  // Show completion modal when puzzle is completed (skip for view-only mode)
  useEffect(() => {
    if (isViewOnly) return; // Don't show modals in view-only mode

    if (gameState?.isComplete && !hasShownCompletionAd.current) {
      hasShownCompletionAd.current = true;

      if (isDaily && !hasShownDailyModal.current) {
        // For daily challenges, show the completion modal
        hasShownDailyModal.current = true;
        const timer = setTimeout(() => {
          setShowDailyModal(true);
        }, 1000);
        return () => clearTimeout(timer);
      } else if (isChapter && !hasShownChapterModal.current) {
        // For chapter games, show the chapter completion modal
        hasShownChapterModal.current = true;
        const timer = setTimeout(() => {
          setShowChapterModal(true);
        }, 800);
        return () => clearTimeout(timer);
      } else if (!hasShownFreeRunModal.current) {
        // For free run games, show the free run completion modal
        hasShownFreeRunModal.current = true;
        const timer = setTimeout(() => {
          setShowFreeRunModal(true);
        }, 800);
        return () => clearTimeout(timer);
      }
    }

    // Reset flags when starting a new game
    if (!gameState?.isComplete) {
      hasShownCompletionAd.current = false;
      hasShownDailyModal.current = false;
      hasShownChapterModal.current = false;
      hasShownFreeRunModal.current = false;
    }
  }, [gameState?.isComplete, isDaily, isChapter]);

  // Pause/resume timer when screen gains/loses focus
  // Also save chapter progress when leaving screen
  useFocusEffect(
    useCallback(() => {
      // Screen is focused - resume timer
      resumeGame();

      return () => {
        // Screen is unfocused - pause timer
        pauseGame();

        // Save chapter progress if game is in progress (not complete, not view-only)
        if (isChapter && !gameState?.isComplete && !isViewOnly) {
          saveChapterProgress(puzzleNumber);
        }
      };
    }, [pauseGame, resumeGame, isChapter, isViewOnly, gameState?.isComplete, puzzleNumber, saveChapterProgress])
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

    return () => {
      subscription.remove();
    };
  }, [pauseGame, resumeGame]);

  const handleCellPress = useCallback((row: number, col: number) => {
    Haptics.selectionAsync();
    setSelectedCell({ row, col });
  }, []);

  const handleNumberPress = useCallback((num: number) => {
    if (selectedCell && gameState && !gameState.isLoading) {
      const { row, col } = selectedCell;
      // Can't modify initial cells
      if (gameState.initialGrid[row][col] !== 0) return;

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      if (notesMode) {
        // In notes mode: toggle note on/off
        // Only add notes to empty cells
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
        // Normal mode: place number
        // Check if this is a mistake before updating
        if (num !== 0 && gameState.solution[row][col] !== num) {
          setMistakesCount((prev) => prev + 1);
        }
        updateCell(row, col, num);
      }
    }
  }, [selectedCell, gameState, updateCell, addNote, removeNote, notesMode]);

  const handleErase = useCallback(() => {
    if (selectedCell && gameState && !gameState.isLoading) {
      if (gameState.initialGrid[selectedCell.row][selectedCell.col] === 0) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        updateCell(selectedCell.row, selectedCell.col, 0);
      }
    }
  }, [selectedCell, gameState, updateCell]);

  const toggleNotesMode = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setNotesMode((prev) => !prev);
  }, []);

  const handleHint = useCallback(() => {
    const hint = getSmartHint();
    if (hint) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setCurrentHint(hint);
      setShowHintModal(true);
      // Highlight the hint cell
      setSelectedCell({ row: hint.cell.row, col: hint.cell.col });
    }
  }, [getSmartHint]);

  const handleApplyHint = useCallback(() => {
    if (currentHint) {
      applyHint(currentHint);
      setSelectedCell({ row: currentHint.cell.row, col: currentHint.cell.col });
    }
  }, [currentHint, applyHint]);

  // Save chapter completion to Supabase (for replay feature)
  const saveChapterCompletion = useCallback(async () => {
    if (!isChapter || !gameState || !userId) return;

    try {
      await chapterService.saveCompletion(userId, {
        puzzleNumber,
        difficulty: gameState.difficulty,
        puzzleGrid: gameState.initialGrid,
        solutionGrid: gameState.solution,
        timeSeconds: gameState.timer || 0,
        mistakes: mistakesCount,
        hintsUsed: gameState.hintsUsed || 0,
      });
      console.log('[GameScreen] Chapter completion saved for puzzle', puzzleNumber);
    } catch (error) {
      console.error('[GameScreen] Failed to save chapter completion:', error);
    }
  }, [isChapter, gameState, userId, puzzleNumber, mistakesCount]);

  // Handle continuing to next puzzle in chapter mode
  // Save progress, show ad every 3 games, then start the next puzzle directly
  const handleNextPuzzle = useCallback(async () => {
    if (!isChapter) return;

    const nextPuzzle = puzzleNumber + 1;
    const nextDifficulty = getPuzzleDifficulty(nextPuzzle);

    // Increment games completed
    const newGamesCount = chapterGamesCount + 1;

    // Save chapter completion to Supabase (async, don't wait)
    saveChapterCompletion();

    // Clear in-progress save since puzzle is complete
    clearChapterProgress();

    // Update progress in storage
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

    // Update local state
    setChapterGamesCount(newGamesCount);

    // Show ad and wait for it to complete
    // AdContext handles the frequency - resolves immediately if no ad to show
    try {
      await onPuzzleComplete();
    } catch (err) {
      console.log('[GameScreen] Ad error:', err);
    }

    // Close modal and start new game AFTER ad completes
    setShowChapterModal(false);
    startNewGame(nextDifficulty, '9x9');
    setMistakesCount(0);

    // Update the route params for the new puzzle number and games count
    router.setParams({
      puzzleNumber: nextPuzzle.toString(),
      chapterGamesCompleted: newGamesCount.toString(),
    });
  }, [isChapter, puzzleNumber, chapterGamesCount, router, onPuzzleComplete, startNewGame, saveChapterCompletion, clearChapterProgress]);

  // Handle going back to chapters screen
  const handleBackToChapters = useCallback(async () => {
    if (isChapter) {
      // Increment games count (puzzle completed)
      const newGamesCount = chapterGamesCount + 1;

      // Save chapter completion to Supabase (async, don't wait)
      saveChapterCompletion();

      // Clear in-progress save since puzzle is complete
      clearChapterProgress();

      // Update progress before leaving
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

      // Count towards ad frequency (same as Continue path)
      // This ensures both "Continue" and "Back to Chapters" count towards the 3-game ad logic
      try {
        await onPuzzleComplete();
      } catch (err) {
        console.log('[GameScreen] Ad error:', err);
      }
    }
    setShowChapterModal(false);
    router.back();
  }, [isChapter, puzzleNumber, chapterGamesCount, router, saveChapterCompletion, onPuzzleComplete, clearChapterProgress]);

  // Handle playing again in free run mode - starts a new game with same settings
  // Note: Free Run uses session limits (rewarded ads), NOT interstitials
  const handleFreeRunPlayAgain = useCallback(() => {
    if (!gameState) return;

    // Start a new game with the same difficulty and grid type
    startNewGame(gameState.difficulty, gameState.gridType);
    setShowFreeRunModal(false);
    setMistakesCount(0);
  }, [gameState, startNewGame]);

  // Handle going back to free run screen
  // Note: Free Run uses session limits (rewarded ads), NOT interstitials
  const handleBackToFreeRun = useCallback(() => {
    setShowFreeRunModal(false);
    router.back();
  }, [router]);

  // Calculate remaining counts based on grid size
  const remainingCounts = useMemo(() => {
    if (!gameState || gameState.isLoading) return undefined;
    const { gridSize, maxNumber } = gridConfig;
    const counts: Record<number, number> = {};

    for (let n = 1; n <= maxNumber; n++) {
      let count = gridSize; // Each number appears gridSize times in a complete puzzle
      for (let r = 0; r < gridSize; r++) {
        for (let c = 0; c < gridSize; c++) {
          if (gameState.grid[r][c] === n) count--;
        }
      }
      counts[n] = count;
    }
    return counts;
  }, [gameState?.grid, gameState?.isLoading, gridConfig]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

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

  // Display grid type in header for mini sudoku
  const difficultyLabel = gameState.gridType === '6x6'
    ? `Mini · ${gameState.difficulty}`
    : gameState.difficulty;

  // Show banner only when not ad-free and not on web
  const showBanner = !isAdFree && Platform.OS !== 'web';

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={showBanner ? ['top', 'left', 'right'] : ['top', 'left', 'right', 'bottom']}
    >
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <Animated.View entering={FadeIn.delay(100)} style={styles.header}>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            if (!isViewOnly) pauseGame(); // Only pause if not view-only
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
            <Pressable
              onPress={() => {
                // DEV: Triple-tap on timer to auto-complete (hidden feature)
                if (__DEV__) {
                  devAutoComplete();
                }
              }}
            >
              <BrutalistText size={16} mono bold>
                {formatTime(gameState.timer || 0)}
              </BrutalistText>
            </Pressable>
          )}
        </View>
      </Animated.View>

      {/* Board */}
      <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.boardContainer}>
        <SudokuBoard
          selectedCell={isViewOnly ? null : selectedCell}
          onCellPress={isViewOnly ? () => {} : handleCellPress}
        />
      </Animated.View>

      {isViewOnly ? (
        /* View-Only Stats Display */
        <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.viewOnlyStats}>
          <View style={[styles.viewOnlyStatsRow, { borderColor: colors.muted }]}>
            <View style={styles.viewOnlyStat}>
              <BrutalistText size={11} mono uppercase muted>
                Time
              </BrutalistText>
              <BrutalistText size={24} bold mono>
                {formatTime(completionTime)}
              </BrutalistText>
            </View>

            {completionRank && (
              <View style={styles.viewOnlyStat}>
                <BrutalistText size={11} mono uppercase muted>
                  Rank
                </BrutalistText>
                <BrutalistText size={24} bold>
                  #{completionRank}
                </BrutalistText>
              </View>
            )}

            <View style={styles.viewOnlyStat}>
              <BrutalistText size={11} mono uppercase muted>
                Mistakes
              </BrutalistText>
              <BrutalistText size={24} bold>
                {completionMistakes}
              </BrutalistText>
            </View>
          </View>

          <BrutalistButton
            title={isDaily ? "BACK TO DAILY" : isChapter ? "BACK TO CHAPTERS" : "BACK"}
            onPress={() => router.back()}
            variant="primary"
            size="large"
            style={{ marginTop: 24, marginHorizontal: 20 }}
          />
        </Animated.View>
      ) : (
        <>
          {/* Number Pad - shows 1-6 for 6x6 or 1-9 for 9x9 */}
          <Animated.View entering={FadeInDown.delay(300).springify()}>
            <NumberPad
              onNumberPress={handleNumberPress}
              remainingCounts={remainingCounts}
              maxNumber={gridConfig.maxNumber}
            />
          </Animated.View>

          {/* Tools */}
          <Animated.View entering={FadeInDown.delay(400).springify()} style={styles.tools}>
            <BrutalistButton
              title="UNDO"
              onPress={() => {}}
              variant="ghost"
              size="small"
              style={styles.toolBtn}
            />
            <BrutalistButton
              title="ERASE"
              onPress={handleErase}
              variant="ghost"
              size="small"
              style={styles.toolBtn}
            />
            <BrutalistButton
              title="NOTES"
              onPress={toggleNotesMode}
              variant={notesMode ? 'primary' : 'ghost'}
              size="small"
              style={styles.toolBtn}
            />
            <BrutalistButton
              title="HINT"
              onPress={handleHint}
              variant="ghost"
              size="small"
              style={styles.toolBtn}
            />
          </Animated.View>
        </>
      )}

      {/* Daily Completion Modal - only show if not view-only */}
      {isDaily && !isViewOnly && (
        <DailyCompletionModal
          visible={showDailyModal}
          onClose={() => {
            setShowDailyModal(false);
            router.back();
          }}
          challengeId={challengeId}
          challengeDate={challengeDate}
          userId={userId}
          timeSeconds={gameState?.timer || 0}
          mistakes={mistakesCount}
          hintsUsed={gameState?.hintsUsed || 0}
        />
      )}

      {/* Chapter Completion Modal */}
      {isChapter && (
        <ChapterCompletionModal
          visible={showChapterModal}
          onClose={handleBackToChapters}
          onNextPuzzle={handleNextPuzzle}
          puzzleNumber={puzzleNumber}
          nextPuzzleNumber={puzzleNumber + 1}
          difficulty={getPuzzleDifficulty(puzzleNumber + 1)}
          timeSeconds={gameState?.timer || 0}
          mistakes={mistakesCount}
        />
      )}

      {/* Free Run Completion Modal */}
      {!isDaily && !isChapter && (
        <FreeRunCompletionModal
          visible={showFreeRunModal}
          onClose={handleBackToFreeRun}
          onPlayAgain={handleFreeRunPlayAgain}
          difficulty={gameState?.difficulty || 'easy'}
          gridType={gameState?.gridType || '9x9'}
          timeSeconds={gameState?.timer || 0}
          mistakes={mistakesCount}
        />
      )}

      {/* Smart Hint Modal */}
      <SmartHintModal
        visible={showHintModal}
        hint={currentHint}
        onClose={() => setShowHintModal(false)}
        onApplyHint={handleApplyHint}
      />

      {/* Banner Ad at bottom */}
      {showBanner && (
        <View style={[styles.bannerContainer, { paddingBottom: insets.bottom }]}>
          <BannerAd
            unitId={AD_UNIT_IDS.BANNER}
            size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
            requestOptions={{
              requestNonPersonalizedAdsOnly: true,
            }}
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
  tools: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  toolBtn: {
    minWidth: 70,
  },
  viewOnlyStats: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  viewOnlyStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 20,
    borderWidth: 2,
  },
  viewOnlyStat: {
    alignItems: 'center',
  },
  bannerContainer: {
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
});
