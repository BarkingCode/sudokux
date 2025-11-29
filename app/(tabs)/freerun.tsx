/**
 * Free Run screen - Play any difficulty/grid size without progression tracking.
 * Shows continue option if there's an unfinished game.
 */

import React, { useState, useCallback, useMemo } from 'react';
import { View, StyleSheet, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { BrutalistText } from '../../src/components/BrutalistText';
import { BrutalistButton } from '../../src/components/BrutalistButton';
import { BannerAd } from '../../src/components/BannerAd';
import { GameLimitModal } from '../../src/components/GameLimitModal';
import { useTheme } from '../../src/context/ThemeContext';
import { useGame, Difficulty, GridType } from '../../src/context/GameContext';
import { useAds } from '../../src/context/AdContext';

const GRID_TYPES: { value: GridType; label: string; description: string }[] = [
  { value: '6x6', label: '6x6', description: 'Mini' },
  { value: '9x9', label: '9x9', description: 'Classic' },
];

const DIFFICULTIES: { value: Difficulty; label: string }[] = [
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
  { value: 'extreme', label: 'Extreme' },
  { value: 'insane', label: 'Insane' },
  { value: 'inhuman', label: 'Inhuman' },
];

export default function FreeRunScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { gameState, startNewGame } = useGame();
  const { isAtLimit, consumeGame } = useAds();
  const [selectedGrid, setSelectedGrid] = useState<GridType>('9x9');
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>('easy');
  const [showLimitModal, setShowLimitModal] = useState(false);

  // Check if there's an unfinished game
  const hasUnfinishedGame = useMemo(() => {
    if (!gameState) return false;
    if (gameState.isComplete) return false;
    if (gameState.isLoading) return false;
    // Check if game has actually started (has some progress)
    return gameState.puzzleId !== null;
  }, [gameState]);

  // Calculate progress percentage
  const progressPercent = useMemo(() => {
    if (!gameState || !hasUnfinishedGame) return 0;
    const gridSize = gameState.gridType === '6x6' ? 6 : 9;
    const totalCells = gridSize * gridSize;
    let filledCells = 0;
    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        if (gameState.grid[r][c] !== 0) filledCells++;
      }
    }
    return Math.round((filledCells / totalCells) * 100);
  }, [gameState, hasUnfinishedGame]);

  // Format time for display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleGridSelect = useCallback((grid: GridType) => {
    Haptics.selectionAsync();
    setSelectedGrid(grid);
  }, []);

  const handleDifficultySelect = useCallback((difficulty: Difficulty) => {
    Haptics.selectionAsync();
    setSelectedDifficulty(difficulty);
  }, []);

  const handleContinue = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/game');
  }, [router]);

  const handleStartGame = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Check if user has games remaining
    if (isAtLimit) {
      setShowLimitModal(true);
      return;
    }

    // Consume a game from the session
    const canPlay = consumeGame();
    if (!canPlay) {
      setShowLimitModal(true);
      return;
    }

    startNewGame(selectedDifficulty, selectedGrid);
    router.push('/game');
  }, [selectedDifficulty, selectedGrid, startNewGame, router, isAtLimit, consumeGame]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Header */}
        <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.header}>
          <BrutalistText size={11} mono uppercase muted>
            Practice Mode
          </BrutalistText>
          <BrutalistText size={36} bold uppercase letterSpacing={2}>
            FREE RUN
          </BrutalistText>
          <View style={[styles.headerLine, { backgroundColor: colors.primary }]} />
        </Animated.View>

        {/* Continue Game Card - Only show if there's an unfinished game */}
        {hasUnfinishedGame && gameState && (
          <Animated.View
            entering={FadeInUp.delay(150).springify()}
            style={[styles.continueCard, { borderColor: colors.accent }]}
          >
            <View style={styles.continueHeader}>
              <BrutalistText size={12} mono uppercase color={colors.accent}>
                Game in Progress
              </BrutalistText>
            </View>

            <View style={styles.continueInfo}>
              <View style={styles.continueRow}>
                <BrutalistText size={14} muted>Difficulty</BrutalistText>
                <BrutalistText size={14} bold uppercase>
                  {gameState.difficulty}
                </BrutalistText>
              </View>
              <View style={styles.continueRow}>
                <BrutalistText size={14} muted>Grid</BrutalistText>
                <BrutalistText size={14} bold>
                  {gameState.gridType}
                </BrutalistText>
              </View>
              <View style={styles.continueRow}>
                <BrutalistText size={14} muted>Time</BrutalistText>
                <BrutalistText size={14} bold mono>
                  {formatTime(gameState.timer || 0)}
                </BrutalistText>
              </View>
              <View style={styles.continueRow}>
                <BrutalistText size={14} muted>Progress</BrutalistText>
                <BrutalistText size={14} bold>
                  {progressPercent}%
                </BrutalistText>
              </View>
            </View>

            <BrutalistButton
              title="CONTINUE"
              onPress={handleContinue}
              size="large"
              style={styles.continueButton}
            />
          </Animated.View>
        )}

        {/* New Game Section */}
        <Animated.View entering={FadeInUp.delay(200).springify()} style={styles.newGameSection}>
          {hasUnfinishedGame && (
            <BrutalistText size={12} mono uppercase muted style={styles.newGameLabel}>
              Or Start New Game
            </BrutalistText>
          )}

          {/* Grid Size Selection */}
          <View style={styles.section}>
            <BrutalistText size={12} mono uppercase muted style={styles.sectionTitle}>
              Grid Size
            </BrutalistText>
            <View style={styles.gridOptions}>
              {GRID_TYPES.map((grid) => (
                <Pressable
                  key={grid.value}
                  onPress={() => handleGridSelect(grid.value)}
                  style={[
                    styles.gridOption,
                    {
                      borderColor: selectedGrid === grid.value ? colors.primary : colors.muted,
                      backgroundColor: selectedGrid === grid.value ? colors.highlight : 'transparent',
                    },
                  ]}
                >
                  <BrutalistText
                    size={24}
                    bold
                    color={selectedGrid === grid.value ? colors.text : colors.muted}
                  >
                    {grid.label}
                  </BrutalistText>
                  <BrutalistText
                    size={11}
                    mono
                    uppercase
                    color={selectedGrid === grid.value ? colors.text : colors.muted}
                  >
                    {grid.description}
                  </BrutalistText>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Difficulty Selection */}
          <View style={styles.section}>
            <BrutalistText size={12} mono uppercase muted style={styles.sectionTitle}>
              Difficulty
            </BrutalistText>
            <View style={styles.difficultyGrid}>
              {DIFFICULTIES.map((diff) => (
                <Pressable
                  key={diff.value}
                  onPress={() => handleDifficultySelect(diff.value)}
                  style={[
                    styles.difficultyOption,
                    {
                      borderColor: selectedDifficulty === diff.value ? colors.primary : colors.muted,
                      backgroundColor: selectedDifficulty === diff.value ? colors.highlight : 'transparent',
                    },
                  ]}
                >
                  <BrutalistText
                    size={12}
                    bold
                    uppercase
                    color={selectedDifficulty === diff.value ? colors.text : colors.muted}
                  >
                    {diff.label}
                  </BrutalistText>
                </Pressable>
              ))}
            </View>
          </View>
        </Animated.View>

        {/* Start Button */}
        <Animated.View entering={FadeInUp.delay(400).springify()} style={styles.startSection}>
          <BrutalistButton
            title={hasUnfinishedGame ? "START NEW GAME" : "START GAME"}
            onPress={handleStartGame}
            variant={hasUnfinishedGame ? "outline" : "primary"}
            size="large"
            style={styles.startButton}
          />
          <BrutalistText size={11} mono muted style={styles.hint}>
            {hasUnfinishedGame
              ? "This will replace your current game"
              : "No progress tracking - just play"}
          </BrutalistText>
        </Animated.View>
      </ScrollView>

      {/* Banner Ad */}
      <BannerAd />

      {/* Game Limit Modal */}
      <GameLimitModal
        visible={showLimitModal}
        onClose={() => setShowLimitModal(false)}
        onUnlocked={() => {
          // After unlocking, start the game
          startNewGame(selectedDifficulty, selectedGrid);
          router.push('/game');
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 24,
    paddingBottom: 100,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  headerLine: {
    width: 60,
    height: 3,
    marginTop: 12,
  },
  continueCard: {
    borderWidth: 3,
    padding: 20,
    marginBottom: 32,
  },
  continueHeader: {
    marginBottom: 16,
  },
  continueInfo: {
    marginBottom: 20,
    gap: 8,
  },
  continueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  continueButton: {
    width: '100%',
  },
  newGameSection: {
    marginBottom: 24,
  },
  newGameLabel: {
    textAlign: 'center',
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  gridOptions: {
    flexDirection: 'row',
    gap: 16,
  },
  gridOption: {
    flex: 1,
    borderWidth: 3,
    padding: 20,
    alignItems: 'center',
  },
  difficultyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  difficultyOption: {
    borderWidth: 2,
    paddingVertical: 12,
    paddingHorizontal: 16,
    minWidth: 90,
    alignItems: 'center',
  },
  startSection: {
    paddingBottom: 20,
  },
  startButton: {
    width: '100%',
  },
  hint: {
    textAlign: 'center',
    marginTop: 12,
  },
});
