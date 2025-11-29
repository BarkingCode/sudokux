/**
 * Individual cell component for the Sudoku grid.
 * Supports dynamic box borders, notes display, and color differentiation
 * between initial (locked) numbers and user-placed numbers.
 */

import React from 'react';
import { View, StyleSheet, Pressable, Text } from 'react-native';
import { BrutalistText } from '../BrutalistText';
import { ThemeColors } from '../../context/ThemeContext';

interface CellProps {
  row: number;
  col: number;
  value: number;
  size: number;
  isSelected: boolean;
  isMistake: boolean;
  isInitial: boolean;
  isHighlighted?: boolean;
  isSameValue?: boolean;
  colors: ThemeColors;
  onPress: () => void;
  notes?: number[];
  // Grid configuration for dynamic box borders
  boxRows?: number;
  boxCols?: number;
  gridSize?: number;
}

export const Cell: React.FC<CellProps> = ({
  row,
  col,
  value,
  size,
  isSelected,
  isMistake,
  isInitial,
  isHighlighted = false,
  isSameValue = false,
  colors,
  onPress,
  notes = [],
  // Default to 9x9 configuration for backward compatibility
  boxRows = 3,
  boxCols = 3,
  gridSize = 9,
}) => {
  const getBackgroundColor = () => {
    if (isSelected) return colors.highlightStrong;
    if (isSameValue) return colors.highlightStrong + '99';
    if (isHighlighted) return colors.highlight + '80';
    if (isMistake) return colors.mistake + '33';
    return 'transparent';
  };

  const getTextColor = () => {
    if (isMistake) return colors.mistake;
    // Initial numbers: bold, primary text color
    // User-placed numbers: accent color (blue/different shade)
    if (isInitial) return colors.text;
    return colors.accent;
  };

  // Determine border widths for box separation
  const borderRightWidth = (col + 1) % boxCols === 0 && col < gridSize - 1 ? 2 : 0.5;
  const borderBottomWidth = (row + 1) % boxRows === 0 && row < gridSize - 1 ? 2 : 0.5;

  // Calculate note grid size (3x3 for 9x9, 2x3 for 6x6)
  const noteRows = gridSize === 6 ? 2 : 3;
  const noteCols = gridSize === 6 ? 3 : 3;
  const noteSize = size / noteCols;

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.cell,
        {
          width: size,
          height: size,
          backgroundColor: getBackgroundColor(),
          borderRightWidth,
          borderBottomWidth,
          borderColor: colors.muted,
        },
      ]}
    >
      {value > 0 ? (
        // Show main value
        <BrutalistText
          size={size * 0.5}
          bold={isInitial}
          mono
          color={getTextColor()}
        >
          {value.toString()}
        </BrutalistText>
      ) : notes.length > 0 ? (
        // Show notes in a grid pattern
        <View style={styles.notesContainer}>
          {Array.from({ length: noteRows }).map((_, rowIdx) => (
            <View key={rowIdx} style={styles.notesRow}>
              {Array.from({ length: noteCols }).map((_, colIdx) => {
                const noteNum = rowIdx * noteCols + colIdx + 1;
                const hasNote = notes.includes(noteNum);
                return (
                  <View key={colIdx} style={[styles.noteCell, { width: noteSize, height: noteSize }]}>
                    {hasNote && (
                      <Text
                        style={[
                          styles.noteText,
                          {
                            fontSize: noteSize * 0.7,
                            color: colors.muted,
                          },
                        ]}
                      >
                        {noteNum}
                      </Text>
                    )}
                  </View>
                );
              })}
            </View>
          ))}
        </View>
      ) : null}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  cell: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRightColor: undefined,
    borderBottomColor: undefined,
  },
  notesContainer: {
    flex: 1,
    width: '100%',
    padding: 1,
  },
  notesRow: {
    flex: 1,
    flexDirection: 'row',
  },
  noteCell: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  noteText: {
    fontFamily: 'SpaceMono',
    fontWeight: '500',
  },
});
