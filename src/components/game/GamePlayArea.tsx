/**
 * Game play area component containing the Sudoku board, number pad, and tool buttons.
 * Handles cell selection, number input, and notes mode.
 */

import React, { useMemo, useCallback } from 'react';
import { View, StyleSheet, Dimensions, Platform } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { SudokuBoard } from '../board/SudokuBoard';
import { NumberPad } from '../NumberPad';
import { BrutalistButton } from '../BrutalistButton';
import { AdBadge } from '../AdBadge';
import { GRID_CONFIGS, GridConfig } from '../../game/types';
import { isValidMove } from '../../game/engine';
import type { GameState } from '../../context/GameContext';

const { width, height } = Dimensions.get('window');
// Detect iPad for layout adjustments
const isTablet = Platform.OS === 'ios' && (width >= 768 || (Math.min(width, height) / Math.max(width, height)) > 0.65);

interface GamePlayAreaProps {
  gameState: GameState;
  selectedCell: { row: number; col: number } | null;
  notesMode: boolean;
  onCellPress: (row: number, col: number) => void;
  onNumberPress: (num: number) => void;
  onReset: () => void;
  onUndo: () => void;
  onToggleNotes: () => void;
  onToggleHelper: () => void;
}

/**
 * Calculates remaining counts for each number based on grid state.
 */
const useRemainingCounts = (
  grid: number[][] | undefined,
  isLoading: boolean,
  gridConfig: GridConfig
): Record<number, number> | undefined => {
  return useMemo(() => {
    if (!grid || isLoading) return undefined;

    const { gridSize, maxNumber } = gridConfig;
    const counts: Record<number, number> = {};

    for (let n = 1; n <= maxNumber; n++) {
      let count = gridSize; // Each number appears gridSize times in a complete puzzle
      for (let r = 0; r < gridSize; r++) {
        for (let c = 0; c < gridSize; c++) {
          if (grid[r][c] === n) count--;
        }
      }
      counts[n] = count;
    }
    return counts;
  }, [grid, isLoading, gridConfig]);
};

/**
 * Calculates valid numbers for the selected cell when helper is active.
 */
const useValidNumbers = (
  grid: number[][] | undefined,
  initialGrid: number[][] | undefined,
  selectedCell: { row: number; col: number } | null,
  isHelperActive: boolean,
  gridConfig: GridConfig
): Set<number> | undefined => {
  return useMemo(() => {
    if (!grid || !initialGrid || !selectedCell || !isHelperActive) return undefined;

    const { row, col } = selectedCell;

    // Don't show hints for initial cells (given clues)
    if (initialGrid[row][col] !== 0) return undefined;

    // Don't show hints for already filled cells
    if (grid[row][col] !== 0) return undefined;

    const validSet = new Set<number>();
    for (let num = 1; num <= gridConfig.maxNumber; num++) {
      if (isValidMove(grid, row, col, num, gridConfig)) {
        validSet.add(num);
      }
    }
    return validSet;
  }, [grid, initialGrid, selectedCell, isHelperActive, gridConfig]);
};

export const GamePlayArea: React.FC<GamePlayAreaProps> = ({
  gameState,
  selectedCell,
  notesMode,
  onCellPress,
  onNumberPress,
  onReset,
  onUndo,
  onToggleNotes,
  onToggleHelper,
}) => {
  const gridConfig = useMemo(() => {
    return GRID_CONFIGS[gameState.gridType];
  }, [gameState.gridType]);

  const remainingCounts = useRemainingCounts(
    gameState.grid,
    gameState.isLoading,
    gridConfig
  );

  const validNumbers = useValidNumbers(
    gameState.grid,
    gameState.initialGrid,
    selectedCell,
    gameState.isHelperUnlocked,
    gridConfig
  );

  const handleCellPress = useCallback((row: number, col: number) => {
    Haptics.selectionAsync();
    onCellPress(row, col);
  }, [onCellPress]);

  return (
    <>
      {/* Board */}
      <Animated.View entering={FadeInDown.delay(200).springify()} style={[styles.boardContainer, isTablet && styles.boardContainerTablet]}>
        <SudokuBoard
          selectedCell={selectedCell}
          onCellPress={handleCellPress}
        />
      </Animated.View>

      {/* Number Pad - shows 1-6 for 6x6 or 1-9 for 9x9 */}
      <Animated.View entering={FadeInDown.delay(300).springify()} style={isTablet && styles.numberPadTablet}>
        <NumberPad
          onNumberPress={onNumberPress}
          remainingCounts={remainingCounts}
          maxNumber={gridConfig.maxNumber}
          validNumbers={validNumbers}
        />
      </Animated.View>

      {/* Tools */}
      <Animated.View entering={FadeInDown.delay(400).springify()} style={[styles.tools, isTablet && styles.toolsTablet]}>
        <BrutalistButton
          title="UNDO"
          onPress={onUndo}
          variant="ghost"
          size="small"
          style={styles.toolBtn}
        />
        <BrutalistButton
          title="RESET"
          onPress={onReset}
          variant="ghost"
          size="small"
          style={styles.toolBtn}
        />
        <BrutalistButton
          title="NOTES"
          onPress={onToggleNotes}
          variant={notesMode ? 'primary' : 'ghost'}
          size="small"
          style={styles.toolBtn}
        />
        <View style={styles.helperBtnContainer}>
          {!gameState.isHelperUnlocked && <AdBadge />}
          <BrutalistButton
            title="HELPER"
            onPress={onToggleHelper}
            variant={gameState.isHelperUnlocked ? 'primary' : 'ghost'}
            size="small"
            style={styles.toolBtn}
          />
        </View>
      </Animated.View>
    </>
  );
};

const styles = StyleSheet.create({
  boardContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 8,
  },
  boardContainerTablet: {
    flex: 0,
    paddingVertical: 16,
    paddingTop: 8,
  },
  numberPadTablet: {
    marginTop: 8,
  },
  tools: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  toolsTablet: {
    paddingHorizontal: 60,
    paddingBottom: 24,
    paddingTop: 16,
  },
  toolBtn: {
    minWidth: 70,
  },
  helperBtnContainer: {
    position: 'relative',
  },
});
