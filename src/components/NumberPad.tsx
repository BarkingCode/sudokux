/**
 * Number input pad for Sudoku.
 * Displays numbers in a 2-row grid layout:
 * - 9x9: Row 1 (1-5), Row 2 (6-9)
 * - 6x6: Row 1 (1-3), Row 2 (4-6)
 * Buttons are dimmed when all instances of a number are placed on the board.
 */

import React, { useCallback, useMemo } from 'react';
import { View, StyleSheet, Pressable, Dimensions, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
} from 'react-native-reanimated';
import { BrutalistText } from './BrutalistText';
import { useTheme } from '../context/ThemeContext';

interface NumberPadProps {
  onNumberPress: (num: number) => void;
  disabled?: boolean;
  remainingCounts?: Record<number, number>;
  maxNumber?: number; // 6 for 6x6, 9 for 9x9
  validNumbers?: Set<number>; // When provided, only these numbers are valid for selected cell
  selectedCellValue?: number; // Current value in selected cell (0 if empty)
}

const { width, height } = Dimensions.get('window');
const PADDING = 20;
const GAP = 10;

// Detect iPad: iOS device with width >= 768 or aspect ratio closer to 1:1
const isTablet = Platform.OS === 'ios' && (width >= 768 || (Math.min(width, height) / Math.max(width, height)) > 0.65);

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface NumberButtonProps {
  num: number;
  onPress: () => void;
  disabled?: boolean;
  remaining?: number;
  isInvalid?: boolean; // True when helper is active and number is not valid for selected cell
  isSelectedCellValue?: boolean; // True if selected cell contains this number (allow clearing)
  buttonWidth: number;
  buttonHeight: number;
  fontSize?: number;
}

const NumberButton: React.FC<NumberButtonProps> = ({
  num,
  onPress,
  disabled,
  remaining,
  isInvalid,
  isSelectedCellValue,
  buttonWidth,
  buttonHeight,
  fontSize = 32,
}) => {
  const { colors } = useTheme();
  const pressed = useSharedValue(0);
  const isComplete = remaining === 0;
  // Don't disable if this is the selected cell's value (allow clearing)
  const isDisabled = disabled || (isComplete && !isSelectedCellValue) || isInvalid;

  const handlePressIn = useCallback(() => {
    pressed.value = withSpring(1, { damping: 15, stiffness: 500 });
  }, []);

  const handlePressOut = useCallback(() => {
    pressed.value = withSpring(0, { damping: 15, stiffness: 500 });
  }, []);

  const handlePress = useCallback(() => {
    if (!isDisabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onPress();
    }
  }, [isDisabled, onPress]);

  const animatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(pressed.value, [0, 1], [1, 0.95]);
    const translateY = interpolate(pressed.value, [0, 1], [0, 3]);
    return {
      transform: [{ scale }, { translateY }],
    };
  });

  // Determine visual state: invalid (helper active) uses lower opacity than complete
  const getOpacity = () => {
    if (isInvalid) return 0.3;
    if (isComplete) return 0.5;
    return 1;
  };

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={isDisabled}
      style={[
        styles.button,
        {
          width: buttonWidth,
          height: buttonHeight,
          backgroundColor: isComplete ? colors.highlight : colors.surface,
          borderColor: isComplete ? colors.highlightStrong : colors.primary,
          shadowColor: colors.primary,
          opacity: getOpacity(),
        },
        animatedStyle,
      ]}
    >
      <BrutalistText
        size={fontSize}
        bold
        mono
        color={isDisabled ? colors.muted : colors.text}
      >
        {num.toString()}
      </BrutalistText>
    </AnimatedPressable>
  );
};

export const NumberPad: React.FC<NumberPadProps> = ({
  onNumberPress,
  disabled,
  remainingCounts,
  maxNumber = 9,
  validNumbers,
  selectedCellValue,
}) => {
  // On iPad: single row for all numbers
  // On iPhone: split into 2 rows (9x9: [1-5], [6-9] | 6x6: [1-3], [4-6])
  const useSingleRow = isTablet;

  const { row1, row2 } = useMemo(() => {
    if (useSingleRow) {
      // All numbers in a single row
      const all = Array.from({ length: maxNumber }, (_, i) => i + 1);
      return { row1: all, row2: [] };
    }
    // Split into 2 rows
    const splitPoint = Math.ceil(maxNumber / 2);
    const r1 = Array.from({ length: splitPoint }, (_, i) => i + 1);
    const r2 = Array.from({ length: maxNumber - splitPoint }, (_, i) => splitPoint + i + 1);
    return { row1: r1, row2: r2 };
  }, [maxNumber, useSingleRow]);

  // Calculate button dimensions
  const { buttonWidth, buttonHeight, fontSize } = useMemo(() => {
    const columnsInRow1 = row1.length;
    const padding = isTablet ? 40 : PADDING; // More padding on iPad
    const gap = isTablet ? 8 : GAP;
    const availableWidth = width - padding * 2 - gap * (columnsInRow1 - 1);
    const w = availableWidth / columnsInRow1;
    // On iPad with single row, make buttons more compact
    const h = isTablet ? Math.min(w * 0.8, 60) : w * 0.85;
    const size = isTablet ? 24 : 32;
    return { buttonWidth: w, buttonHeight: h, fontSize: size };
  }, [row1.length]);

  return (
    <View style={[styles.container, isTablet && styles.containerTablet]}>
      {/* Row 1 (or single row on iPad) */}
      <View style={[styles.numbersRow, isTablet && styles.numbersRowTablet]}>
        {row1.map((num) => (
          <NumberButton
            key={num}
            num={num}
            onPress={() => onNumberPress(num)}
            disabled={disabled}
            remaining={remainingCounts?.[num]}
            isInvalid={validNumbers ? !validNumbers.has(num) : false}
            isSelectedCellValue={selectedCellValue === num}
            buttonWidth={buttonWidth}
            buttonHeight={buttonHeight}
            fontSize={fontSize}
          />
        ))}
      </View>

      {/* Row 2 (only on iPhone) */}
      {row2.length > 0 && (
        <View style={[styles.numbersRow, styles.row2]}>
          {row2.map((num) => (
            <NumberButton
              key={num}
              num={num}
              onPress={() => onNumberPress(num)}
              disabled={disabled}
              remaining={remainingCounts?.[num]}
              isInvalid={validNumbers ? !validNumbers.has(num) : false}
              isSelectedCellValue={selectedCellValue === num}
              buttonWidth={buttonWidth}
              buttonHeight={buttonHeight}
              fontSize={fontSize}
            />
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: PADDING,
    paddingVertical: 12,
  },
  containerTablet: {
    paddingHorizontal: 40,
    paddingVertical: 16,
  },
  numbersRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: GAP,
  },
  numbersRowTablet: {
    gap: 8,
  },
  row2: {
    marginTop: GAP,
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    shadowOpacity: 1,
    shadowRadius: 0,
    shadowOffset: { width: 3, height: 3 },
    elevation: 4,
  },
});
