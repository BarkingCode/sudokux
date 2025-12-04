/**
 * Chapters screen - Main game mode with progressive difficulty.
 * Features a winding path where each circle represents ONE puzzle/game.
 * Completed puzzles can be replayed, but future puzzles are locked.
 */

import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { View, StyleSheet, ScrollView, Pressable, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import Animated, {
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Check } from 'lucide-react-native';
import { BrutalistText } from '../../src/components/BrutalistText';
import { BannerAd } from '../../src/components/BannerAd';
import { OfflineBanner } from '../../src/components/OfflineBanner';
import { useTheme } from '../../src/context/ThemeContext';
import { useGame, Difficulty, SavedPuzzleWithProgress } from '../../src/context/GameContext';
import { loadData, saveData, loadSecureData, STORAGE_KEYS } from '../../src/utils/storage';
import { chapterService, ChapterInProgress } from '../../src/services/chapterService';
import { getChapterPuzzle } from '../../src/game/chapterPuzzles';
import type { ChapterCompletion } from '../../src/lib/database.types';
import type { GridType } from '../../src/game/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface GameProgress {
  currentPuzzle: number; // Current puzzle number (1-indexed)
  completedPuzzles: number[]; // Array of completed puzzle numbers
  chapterGamesCompleted: number; // Track completed games for interstitial ads
}

const INITIAL_PUZZLES = 50;
const PUZZALS_TO_ADD = 20;
const NODE_SIZE = 50;
const DOT_SIZE = 6;
const DOTS_BETWEEN = 4;

/**
 * Get difficulty for a specific puzzle number.
 * Difficulty increases as puzzles progress.
 * 30 puzzles per difficulty level.
 */
const getPuzzleDifficulty = (puzzleNum: number): Difficulty => {
  if (puzzleNum <= 30) return 'easy';
  if (puzzleNum <= 60) return 'medium';
  if (puzzleNum <= 90) return 'hard';
  if (puzzleNum <= 120) return 'extreme';
  if (puzzleNum <= 150) return 'insane';
  return 'inhuman';
};

/**
 * Get difficulty label color
 */
const getDifficultyColor = (difficulty: Difficulty, colors: any): string => {
  switch (difficulty) {
    case 'easy': return colors.success;
    case 'medium': return colors.accent;
    case 'hard': return '#FF9800';
    case 'extreme': return colors.mistake;
    case 'insane': return '#9C27B0';
    case 'inhuman': return '#E91E63';
    default: return colors.muted;
  }
};

const DEFAULT_PROGRESS: GameProgress = {
  currentPuzzle: 1,
  completedPuzzles: [],
  chapterGamesCompleted: 0,
};

// Animated current puzzle indicator
const PulsingRing: React.FC<{ color: string }> = ({ color }) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.6);

  useEffect(() => {
    scale.value = withRepeat(
      withTiming(1.5, { duration: 1500, easing: Easing.out(Easing.ease) }),
      -1,
      false
    );
    opacity.value = withRepeat(
      withTiming(0, { duration: 1500, easing: Easing.out(Easing.ease) }),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.pulsingRing,
        { borderColor: color },
        animatedStyle,
      ]}
    />
  );
};

// Helper to get storage key for chapter progress based on grid type
const getProgressStorageKey = (gridType: GridType): string => {
  return gridType === '6x6' ? STORAGE_KEYS.CHAPTER_PROGRESS_6X6 : STORAGE_KEYS.CHAPTER_PROGRESS;
};

export default function ChaptersScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { gameState, startNewGame, loadSavedPuzzle, loadSavedPuzzleWithProgress } = useGame();
  const [progress, setProgress] = useState<GameProgress>(DEFAULT_PROGRESS);
  const [isLoading, setIsLoading] = useState(true);
  const [totalPuzzles, setTotalPuzzles] = useState(INITIAL_PUZZLES);
  const [userId, setUserId] = useState<string | null>(null);
  const [completions, setCompletions] = useState<Map<number, ChapterCompletion>>(new Map());
  const [selectedGridType, setSelectedGridType] = useState<GridType>('9x9');
  const scrollRef = useRef<ScrollView>(null);

  // Add more puzzles as user progresses
  useEffect(() => {
    if (progress.currentPuzzle >= totalPuzzles - 15) {
      setTotalPuzzles(prev => prev + PUZZALS_TO_ADD);
    }
  }, [progress.currentPuzzle, totalPuzzles]);

  // Load user ID and grid type preference on mount
  useEffect(() => {
    const loadInitialState = async () => {
      // Load user ID
      const storedData = await loadSecureData(STORAGE_KEYS.USER_ID);
      if (storedData) {
        try {
          const identity = JSON.parse(storedData);
          setUserId(identity?.id || null);
        } catch {
          setUserId(null);
        }
      }

      // Load saved grid type preference
      const savedGridType = await loadData<GridType>(STORAGE_KEYS.CHAPTER_GRID_TYPE);
      if (savedGridType === '6x6' || savedGridType === '9x9') {
        setSelectedGridType(savedGridType);
      }
    };
    loadInitialState();
  }, []);

  // Load completions from Supabase when userId or gridType changes
  useEffect(() => {
    if (userId) {
      chapterService.getAllCompletions(userId, selectedGridType).then((data) => {
        const completionsMap = new Map<number, ChapterCompletion>();
        data.forEach((c) => completionsMap.set(c.puzzle_number, c));
        setCompletions(completionsMap);
      });
    }
  }, [userId, selectedGridType]);

  // Handle grid type toggle
  const handleGridTypeToggle = useCallback(async (newGridType: GridType) => {
    if (newGridType === selectedGridType) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsLoading(true);

    // Save the new grid type preference
    await saveData(STORAGE_KEYS.CHAPTER_GRID_TYPE, newGridType);
    setSelectedGridType(newGridType);

    // Load progress for the new grid type
    const storageKey = getProgressStorageKey(newGridType);
    const saved = await loadData<GameProgress>(storageKey);
    setProgress(saved || DEFAULT_PROGRESS);

    // Reload completions for the new grid type
    if (userId) {
      const data = await chapterService.getAllCompletions(userId, newGridType);
      const completionsMap = new Map<number, ChapterCompletion>();
      data.forEach((c) => completionsMap.set(c.puzzle_number, c));
      setCompletions(completionsMap);
    }

    setIsLoading(false);
  }, [selectedGridType, userId]);

  // Load progress on mount and when screen is focused (returning from game)
  useFocusEffect(
    useCallback(() => {
      const loadAndSync = async () => {
        // Load local progress for the selected grid type
        const storageKey = getProgressStorageKey(selectedGridType);
        const saved = await loadData<GameProgress>(storageKey);
        let currentProgress = DEFAULT_PROGRESS;

        if (saved) {
          // Migration: handle old format (only for 9x9)
          if (selectedGridType === '9x9' && (saved as any).currentChapter !== undefined) {
            // Old format - convert
            const oldProgress = saved as any;
            currentProgress = {
              currentPuzzle: ((oldProgress.currentChapter - 1) * 5) + oldProgress.currentPuzzleInChapter + 1,
              completedPuzzles: [],
              chapterGamesCompleted: oldProgress.gamesPlayedSinceAd || 0,
            };
            // Mark all previous puzzles as completed
            for (let i = 1; i < currentProgress.currentPuzzle; i++) {
              currentProgress.completedPuzzles.push(i);
            }
          } else {
            if (saved.chapterGamesCompleted === undefined) {
              saved.chapterGamesCompleted = 0;
            }
            currentProgress = saved;
          }
        }

        // Reload completions from DB for the selected grid type and sync with local progress
        if (userId) {
          const data = await chapterService.getAllCompletions(userId, selectedGridType);
          const completionsMap = new Map<number, ChapterCompletion>();
          data.forEach((c) => completionsMap.set(c.puzzle_number, c));
          setCompletions(completionsMap);

          // Sync local progress with DB completions (DB is source of truth)
          const dbCompletedPuzzles = Array.from(completionsMap.keys());
          const localCompletedSet = new Set(currentProgress.completedPuzzles);
          let needsSync = false;

          // Find puzzles completed in DB but not in local state
          for (const puzzleNum of dbCompletedPuzzles) {
            if (!localCompletedSet.has(puzzleNum)) {
              console.log('[ChaptersScreen] Found puzzle', puzzleNum, 'completed in DB but not locally, syncing...');
              localCompletedSet.add(puzzleNum);
              needsSync = true;
            }
          }

          if (needsSync) {
            const syncedCompletedPuzzles = Array.from(localCompletedSet).sort((a, b) => a - b);
            // Update currentPuzzle to be after the highest completed puzzle
            const highestCompleted = Math.max(...syncedCompletedPuzzles, 0);
            const newCurrentPuzzle = Math.max(currentProgress.currentPuzzle, highestCompleted + 1);

            currentProgress = {
              ...currentProgress,
              completedPuzzles: syncedCompletedPuzzles,
              currentPuzzle: newCurrentPuzzle,
            };
            console.log('[ChaptersScreen] Synced local progress:', currentProgress);
          }
        }

        setProgress(currentProgress);
        setIsLoading(false);
      };

      loadAndSync();
    }, [userId, selectedGridType])
  );

  // Save progress when it changes
  useEffect(() => {
    if (!isLoading) {
      const storageKey = getProgressStorageKey(selectedGridType);
      saveData(storageKey, progress);
    }
  }, [progress, isLoading, selectedGridType]);

  // Note: Progress is now updated by GameScreen when user completes a puzzle
  // and presses "Continue" or "Back to Chapters" in the completion modal.
  // This prevents the bug where progress advances on app reload.

  // Calculate content height and scroll position
  const rowHeight = NODE_SIZE + 70;
  const contentHeight = (totalPuzzles + 2) * rowHeight;

  // Scroll to current puzzle on load
  useEffect(() => {
    if (!isLoading && scrollRef.current) {
      // Calculate actual current puzzle based on both local and DB completions
      const dbCompletedPuzzles = Array.from(completions.keys());
      const allCompleted = new Set([...progress.completedPuzzles, ...dbCompletedPuzzles]);
      const highestCompleted = allCompleted.size > 0 ? Math.max(...allCompleted) : 0;
      const actualCurrent = Math.max(progress.currentPuzzle, highestCompleted + 1);

      const currentRow = totalPuzzles - actualCurrent;
      const scrollY = Math.max(0, currentRow * rowHeight - 280);
      setTimeout(() => {
        scrollRef.current?.scrollTo({ y: scrollY, animated: true });
      }, 300);
    }
  }, [isLoading, progress.currentPuzzle, progress.completedPuzzles, completions, totalPuzzles, rowHeight]);

  const handlePuzzlePress = useCallback(async (puzzleNum: number) => {
    // Check if this puzzle is completed - DB is source of truth
    const savedCompletion = completions.get(puzzleNum);

    // Calculate actual current puzzle based on all completions
    const dbCompletedPuzzles = Array.from(completions.keys());
    const allCompleted = new Set([...progress.completedPuzzles, ...dbCompletedPuzzles]);
    const highestCompleted = allCompleted.size > 0 ? Math.max(...allCompleted) : 0;
    const actualCurrent = Math.max(progress.currentPuzzle, highestCompleted + 1);

    // Allow access if: puzzle is at or before actualCurrentPuzzle, OR it's completed in DB
    if (puzzleNum > actualCurrent && !savedCompletion) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const isCompletedLocally = progress.completedPuzzles.includes(puzzleNum);

    // If completed in DB (source of truth), show in view-only mode
    if (savedCompletion) {
      // Sync local state if needed (DB shows completed but local state is behind)
      const needsSync = !isCompletedLocally || progress.currentPuzzle < actualCurrent;
      if (needsSync) {
        console.log('[ChaptersScreen] Syncing local progress - updating to puzzle', actualCurrent);
        const completedPuzzles = Array.from(allCompleted).sort((a, b) => a - b);

        // Update state and save immediately before navigation
        const newProgress = {
          ...progress,
          completedPuzzles,
          currentPuzzle: actualCurrent,
        };
        setProgress(newProgress);
        // Save immediately to storage (don't wait for effect)
        saveData(STORAGE_KEYS.CHAPTER_PROGRESS, newProgress);
      }

      // COMPLETED PUZZLE: Show in view-only mode with solved grid
      const solutionGrid = chapterService.parsePuzzleGrid(savedCompletion.solution_grid);

      if (solutionGrid.length > 0) {
        // Load the completed solution for viewing
        loadSavedPuzzle({
          puzzleId: `chapter-${puzzleNum}-completed`,
          difficulty: savedCompletion.difficulty as Difficulty,
          gridType: selectedGridType,
          puzzle: solutionGrid,  // Show the solved puzzle
          solution: solutionGrid,
        });

        router.push({
          pathname: '/game',
          params: {
            isChapter: 'true',
            puzzleNumber: puzzleNum.toString(),
            viewOnly: 'true',  // Enable view-only mode
            completionTime: savedCompletion.time_seconds.toString(),
            completionMistakes: savedCompletion.mistakes.toString(),
          },
        });
      } else {
        // Fallback: Invalid saved data, generate fresh puzzle
        console.warn('[ChaptersScreen] Invalid completion data, generating new puzzle');
        const puzzle = getChapterPuzzle(puzzleNum, selectedGridType);
        loadSavedPuzzle({
          puzzleId: `chapter-${puzzleNum}`,
          difficulty: puzzle.difficulty,
          gridType: selectedGridType,
          puzzle: puzzle.puzzle,
          solution: puzzle.solution,
        });

        router.push({
          pathname: '/game',
          params: {
            isChapter: 'true',
            puzzleNumber: puzzleNum.toString(),
            chapterGamesCompleted: progress.chapterGamesCompleted.toString(),
          },
        });
      }
    } else {
      // NEW/IN-PROGRESS PUZZLE: Check for saved in-progress data first
      const inProgressData = await loadData<ChapterInProgress>(STORAGE_KEYS.CHAPTER_IN_PROGRESS);

      if (inProgressData && inProgressData.puzzleNumber === puzzleNum && inProgressData.gridType === selectedGridType) {
        // Resume from saved progress (only if same grid type)
        console.log('[ChaptersScreen] Resuming in-progress puzzle', puzzleNum);
        loadSavedPuzzleWithProgress({
          puzzleId: `chapter-${puzzleNum}`,
          difficulty: inProgressData.difficulty as Difficulty,
          gridType: inProgressData.gridType as '9x9' | '6x6',
          puzzle: inProgressData.initialGrid,
          solution: inProgressData.solution,
          initialGrid: inProgressData.initialGrid,
          grid: inProgressData.currentGrid,
          timer: inProgressData.timer,
          mistakes: inProgressData.mistakes,
          helperUsed: inProgressData.helperUsed,
          notes: inProgressData.notes,
          history: inProgressData.history || [],
        });
      } else {
        // Generate fresh deterministic puzzle
        const puzzle = getChapterPuzzle(puzzleNum, selectedGridType);
        loadSavedPuzzle({
          puzzleId: `chapter-${puzzleNum}`,
          difficulty: puzzle.difficulty,
          gridType: selectedGridType,
          puzzle: puzzle.puzzle,
          solution: puzzle.solution,
        });
      }

      router.push({
        pathname: '/game',
        params: {
          isChapter: 'true',
          puzzleNumber: puzzleNum.toString(),
          chapterGamesCompleted: progress.chapterGamesCompleted.toString(),
        },
      });
    }
  }, [progress, loadSavedPuzzle, loadSavedPuzzleWithProgress, router, completions, selectedGridType]);

  // Generate path layout - zigzag pattern flowing UPWARD
  const pathData = useMemo(() => {
    const nodes: { puzzle: number; x: number; y: number }[] = [];
    const leftX = SCREEN_WIDTH * 0.2;
    const rightX = SCREEN_WIDTH * 0.8;
    const centerLeftX = SCREEN_WIDTH * 0.35;
    const centerRightX = SCREEN_WIDTH * 0.65;

    for (let i = 1; i <= totalPuzzles; i++) {
      // Reverse Y position - puzzle 1 at bottom, higher puzzles at top
      const y = (totalPuzzles - i + 1) * rowHeight;

      // Zigzag pattern
      const pattern = (i - 1) % 4;
      let x: number;

      switch (pattern) {
        case 0: x = leftX; break;
        case 1: x = centerRightX; break;
        case 2: x = rightX; break;
        case 3: x = centerLeftX; break;
        default: x = leftX;
      }

      nodes.push({ puzzle: i, x, y });
    }

    return nodes;
  }, [totalPuzzles, rowHeight]);

  // Render connecting path line between two nodes
  const renderPathSegment = (from: { x: number; y: number }, to: { x: number; y: number }, isCompleted: boolean) => {
    const dots = [];
    const totalDots = DOTS_BETWEEN;

    for (let i = 0; i <= totalDots; i++) {
      const t = i / totalDots;
      const x = from.x + (to.x - from.x) * t;
      const y = from.y + (to.y - from.y) * t;

      dots.push(
        <View
          key={`path-${from.y}-${i}`}
          style={[
            styles.pathDot,
            {
              left: x - DOT_SIZE / 2,
              top: y - DOT_SIZE / 2,
              backgroundColor: isCompleted ? colors.primary : colors.muted + '50',
            },
          ]}
        />
      );
    }
    return dots;
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
      </SafeAreaView>
    );
  }

  // Calculate actual current puzzle based on both local and DB completions
  const dbCompletedPuzzles = Array.from(completions.keys());
  const allCompleted = new Set([...progress.completedPuzzles, ...dbCompletedPuzzles]);
  const highestCompleted = allCompleted.size > 0 ? Math.max(...allCompleted) : 0;
  const actualCurrentPuzzle = Math.max(progress.currentPuzzle, highestCompleted + 1);
  const currentDifficulty = getPuzzleDifficulty(actualCurrentPuzzle);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <OfflineBanner message="Offline - Progress will sync when back online" />

      {/* Header */}
      <View style={styles.header}>
        <BrutalistText size={10} mono uppercase muted letterSpacing={3}>
          Journey Mode
        </BrutalistText>
        <BrutalistText size={28} bold uppercase letterSpacing={3}>
          CHAPTERS
        </BrutalistText>
        <View style={styles.headerInfo}>
          <BrutalistText size={12} mono muted>
            Puzzle {actualCurrentPuzzle}
          </BrutalistText>
          <View style={[styles.difficultyBadge, { borderColor: getDifficultyColor(currentDifficulty, colors) }]}>
            <BrutalistText
              size={10}
              mono
              bold
              uppercase
              color={getDifficultyColor(currentDifficulty, colors)}
            >
              {currentDifficulty}
            </BrutalistText>
          </View>
        </View>
      </View>

      {/* Grid Type Toggle */}
      <View style={styles.gridToggleContainer}>
        <Pressable
          onPress={() => handleGridTypeToggle('9x9')}
          style={[
            styles.gridToggleButton,
            {
              backgroundColor: selectedGridType === '9x9' ? colors.primary : colors.background,
              borderColor: colors.primary,
            },
          ]}
        >
          <BrutalistText
            size={12}
            bold
            mono
            color={selectedGridType === '9x9' ? colors.background : colors.text}
          >
            9x9
          </BrutalistText>
        </Pressable>
        <Pressable
          onPress={() => handleGridTypeToggle('6x6')}
          style={[
            styles.gridToggleButton,
            {
              backgroundColor: selectedGridType === '6x6' ? colors.primary : colors.background,
              borderColor: colors.primary,
            },
          ]}
        >
          <BrutalistText
            size={12}
            bold
            mono
            color={selectedGridType === '6x6' ? colors.background : colors.text}
          >
            6x6
          </BrutalistText>
        </Pressable>
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { height: contentHeight }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Render path segments (behind nodes) */}
        <View style={styles.pathLayer}>
          {pathData.map((node, index) => {
            if (index < pathData.length - 1) {
              const nextNode = pathData[index + 1];
              // Path is completed if puzzle is completed in DB or locally
              const isCompleted = completions.has(node.puzzle) ||
                                 progress.completedPuzzles.includes(node.puzzle) ||
                                 node.puzzle < actualCurrentPuzzle;
              return (
                <React.Fragment key={`segment-${node.puzzle}`}>
                  {renderPathSegment(node, nextNode, isCompleted)}
                </React.Fragment>
              );
            }
            return null;
          })}
        </View>

        {/* Render puzzle nodes (above path) */}
        {pathData.map((node) => {
          // DB completions is source of truth for completed status
          const isCompletedInDB = completions.has(node.puzzle);
          const isCompletedLocally = progress.completedPuzzles.includes(node.puzzle) ||
                                     node.puzzle < actualCurrentPuzzle;
          const isCompleted = isCompletedInDB || isCompletedLocally;
          // Current is the actual next puzzle to play (first non-completed)
          const isCurrent = node.puzzle === actualCurrentPuzzle;
          const isLocked = node.puzzle > actualCurrentPuzzle;
          const difficulty = getPuzzleDifficulty(node.puzzle);

          return (
            <Animated.View
              key={node.puzzle}
              entering={FadeIn.delay(Math.min((totalPuzzles - node.puzzle) * 10, 300))}
              style={[
                styles.nodeWrapper,
                {
                  left: node.x - NODE_SIZE / 2,
                  top: node.y - NODE_SIZE / 2,
                },
              ]}
            >
              {/* Pulsing ring for current puzzle */}
              {isCurrent && <PulsingRing color={colors.primary} />}

              {/* Node background (ensures circle is above line) */}
              <View style={[styles.nodeBackground, { backgroundColor: colors.background }]} />

              <Pressable
                onPress={() => handlePuzzlePress(node.puzzle)}
                disabled={isLocked}
                style={({ pressed }) => [
                  styles.node,
                  {
                    backgroundColor: isCurrent
                      ? colors.primary
                      : isCompleted
                      ? colors.primary
                      : colors.background,
                    borderColor: isLocked
                      ? colors.muted + '30'
                      : colors.primary,
                    transform: [{ scale: pressed && !isLocked ? 0.9 : 1 }],
                  },
                ]}
              >
                {isCompleted && !isCurrent ? (
                  <Check size={20} color={colors.background} strokeWidth={3} />
                ) : (
                  <BrutalistText
                    size={16}
                    bold
                    color={isCurrent ? colors.background : isLocked ? colors.muted + '60' : colors.text}
                  >
                    {node.puzzle}
                  </BrutalistText>
                )}
              </Pressable>

              {/* Difficulty indicator dot */}
              {!isLocked && (
                <View
                  style={[
                    styles.difficultyDot,
                    { backgroundColor: getDifficultyColor(difficulty, colors) }
                  ]}
                />
              )}
            </Animated.View>
          );
        })}
      </ScrollView>

      {/* Banner Ad */}
      <BannerAd />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingTop: 4,
    paddingBottom: 12,
  },
  headerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
  },
  difficultyBadge: {
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  gridToggleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 0,
    paddingBottom: 12,
  },
  gridToggleButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderWidth: 2,
    minWidth: 70,
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    position: 'relative',
  },
  pathLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  pathDot: {
    position: 'absolute',
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
  },
  nodeWrapper: {
    position: 'absolute',
    width: NODE_SIZE,
    height: NODE_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  nodeBackground: {
    position: 'absolute',
    width: NODE_SIZE + 10,
    height: NODE_SIZE + 10,
    borderRadius: (NODE_SIZE + 10) / 2,
    zIndex: 1,
  },
  node: {
    width: NODE_SIZE,
    height: NODE_SIZE,
    borderRadius: NODE_SIZE / 2,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  pulsingRing: {
    position: 'absolute',
    width: NODE_SIZE,
    height: NODE_SIZE,
    borderRadius: NODE_SIZE / 2,
    borderWidth: 2,
    zIndex: 0,
  },
  difficultyDot: {
    position: 'absolute',
    bottom: -4,
    width: 8,
    height: 8,
    borderRadius: 4,
    zIndex: 3,
  },
});
