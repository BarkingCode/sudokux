/**
 * Game play area component containing the Sudoku board, number pad, and tool buttons.
 * Handles cell selection, number input, and notes mode.
 */

import React, { useMemo, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { SudokuBoard } from '../board/SudokuBoard';
import { NumberPad } from '../NumberPad';
import { BrutalistButton } from '../BrutalistButton';
import { GRID_CONFIGS, GridConfig } from '../../game/types';
import type { GameState } from '../../context/GameContext';

interface GamePlayAreaProps {
  gameState: GameState;
  selectedCell: { row: number; col: number } | null;
  notesMode: boolean;
  onCellPress: (row: number, col: number) => void;
  onNumberPress: (num: number) => void;
  onErase: () => void;
  onToggleNotes: () => void;
  onHint: () => void;
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

export const GamePlayArea: React.FC<GamePlayAreaProps> = ({
  gameState,
  selectedCell,
  notesMode,
  onCellPress,
  onNumberPress,
  onErase,
  onToggleNotes,
  onHint,
}) => {
  const gridConfig = useMemo(() => {
    return GRID_CONFIGS[gameState.gridType];
  }, [gameState.gridType]);

  const remainingCounts = useRemainingCounts(
    gameState.grid,
    gameState.isLoading,
    gridConfig
  );

  const handleCellPress = useCallback((row: number, col: number) => {
    Haptics.selectionAsync();
    onCellPress(row, col);
  }, [onCellPress]);

  return (
    <>
      {/* Board */}
      <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.boardContainer}>
        <SudokuBoard
          selectedCell={selectedCell}
          onCellPress={handleCellPress}
        />
      </Animated.View>

      {/* Number Pad - shows 1-6 for 6x6 or 1-9 for 9x9 */}
      <Animated.View entering={FadeInDown.delay(300).springify()}>
        <NumberPad
          onNumberPress={onNumberPress}
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
          onPress={onErase}
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
        <BrutalistButton
          title="HINT"
          onPress={onHint}
          variant="ghost"
          size="small"
          style={styles.toolBtn}
        />
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
  tools: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  toolBtn: {
    minWidth: 70,
  },
});
