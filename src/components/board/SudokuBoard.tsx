/**
 * Sudoku game board component.
 * Renders the grid with dynamic sizing for 6x6 and 9x9 variants.
 */

import React, { useMemo, useCallback } from 'react';
import { View, StyleSheet, Dimensions, Platform } from 'react-native';
import { Cell } from './Cell';
import { useTheme } from '../../context/ThemeContext';
import { useGame } from '../../context/GameContext';
import { GRID_CONFIGS } from '../../game/types';

const { width, height } = Dimensions.get('window');
const BOARD_PADDING = 20;

// Detect iPad for layout adjustments
const isTablet = Platform.OS === 'ios' && (width >= 768 || (Math.min(width, height) / Math.max(width, height)) > 0.65);

// On iPad, use a larger board size (up to 580px for comfortable viewing)
const MAX_BOARD_SIZE_TABLET = 580;
const BOARD_SIZE = isTablet
  ? Math.min(width - BOARD_PADDING * 2, MAX_BOARD_SIZE_TABLET)
  : width - BOARD_PADDING * 2;

interface SudokuBoardProps {
  selectedCell: { row: number; col: number } | null;
  onCellPress: (row: number, col: number) => void;
}

export const SudokuBoard: React.FC<SudokuBoardProps> = ({ selectedCell, onCellPress }) => {
  const { colors } = useTheme();
  const { gameState } = useGame();

  // Get grid configuration based on current game type
  const gridConfig = useMemo(() => {
    const gridType = gameState?.gridType || '9x9';
    return GRID_CONFIGS[gridType];
  }, [gameState?.gridType]);

  // Dynamic cell size based on grid size
  const cellSize = BOARD_SIZE / gridConfig.gridSize;

  const selectedValue = useMemo(() => {
    if (!selectedCell || !gameState) return null;
    return gameState.grid[selectedCell.row][selectedCell.col];
  }, [selectedCell, gameState?.grid]);

  const handleCellPress = useCallback((row: number, col: number) => {
    onCellPress(row, col);
  }, [onCellPress]);

  if (!gameState) return null;

  const isHighlighted = (row: number, col: number) => {
    if (!selectedCell) return false;
    return row === selectedCell.row || col === selectedCell.col;
  };

  const isSameValue = (val: number) => {
    if (!selectedValue || selectedValue === 0 || val === 0) return false;
    return val === selectedValue;
  };

  // Check if cell is in same box as selected cell
  // Uses dynamic boxRows and boxCols from config
  const isInSameBox = (row: number, col: number) => {
    if (!selectedCell) return false;
    const { boxRows, boxCols } = gridConfig;
    const boxRow = Math.floor(selectedCell.row / boxRows);
    const boxCol = Math.floor(selectedCell.col / boxCols);
    const cellBoxRow = Math.floor(row / boxRows);
    const cellBoxCol = Math.floor(col / boxCols);
    return boxRow === cellBoxRow && boxCol === cellBoxCol;
  };

  return (
    <View style={[styles.container, { borderColor: colors.primary }]}>
      <View style={styles.grid}>
        {gameState.grid.map((row, r) => (
          <View key={r} style={styles.row}>
            {row.map((val, c) => (
              <Cell
                key={`${r}-${c}`}
                row={r}
                col={c}
                value={val}
                size={cellSize}
                isSelected={selectedCell?.row === r && selectedCell?.col === c}
                isMistake={gameState.conflictCells?.includes(`${r}-${c}`) || false}
                isInitial={gameState.initialGrid[r][c] !== 0}
                isHighlighted={isHighlighted(r, c) || isInSameBox(r, c)}
                isSameValue={isSameValue(val)}
                colors={colors}
                onPress={() => handleCellPress(r, c)}
                notes={gameState.notes[`${r}-${c}`] || []}
                boxRows={gridConfig.boxRows}
                boxCols={gridConfig.boxCols}
                gridSize={gridConfig.gridSize}
              />
            ))}
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignSelf: 'center',
    borderWidth: 3,
    backgroundColor: 'transparent',
  },
  grid: {
    flexDirection: 'column',
  },
  row: {
    flexDirection: 'row',
  },
});
