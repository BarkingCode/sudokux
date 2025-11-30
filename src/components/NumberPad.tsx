/**
 * Number input pad for Sudoku.
 * Displays numbers in a 2-row grid layout:
 * - 9x9: Row 1 (1-5), Row 2 (6-9)
 * - 6x6: Row 1 (1-3), Row 2 (4-6)
 * Buttons are dimmed when all instances of a number are placed on the board.
 */

import React, { useCallback, useMemo } from 'react';
import { View, StyleSheet, Pressable, Dimensions } from 'react-native';
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
}

const { width } = Dimensions.get('window');
const PADDING = 20;
const GAP = 10;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface NumberButtonProps {
  num: number;
  onPress: () => void;
  disabled?: boolean;
  remaining?: number;
  buttonWidth: number;
  buttonHeight: number;
}

const NumberButton: React.FC<NumberButtonProps> = ({
  num,
  onPress,
  disabled,
  remaining,
  buttonWidth,
  buttonHeight,
}) => {
  const { colors } = useTheme();
  const pressed = useSharedValue(0);
  const isComplete = remaining === 0;

  const handlePressIn = useCallback(() => {
    pressed.value = withSpring(1, { damping: 15, stiffness: 500 });
  }, []);

  const handlePressOut = useCallback(() => {
    pressed.value = withSpring(0, { damping: 15, stiffness: 500 });
  }, []);

  const handlePress = useCallback(() => {
    if (!disabled && !isComplete) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onPress();
    }
  }, [disabled, isComplete, onPress]);

  const animatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(pressed.value, [0, 1], [1, 0.95]);
    const translateY = interpolate(pressed.value, [0, 1], [0, 3]);
    return {
      transform: [{ scale }, { translateY }],
    };
  });

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || isComplete}
      style={[
        styles.button,
        {
          width: buttonWidth,
          height: buttonHeight,
          backgroundColor: isComplete ? colors.highlight : colors.surface,
          borderColor: isComplete ? colors.highlightStrong : colors.primary,
          shadowColor: colors.primary,
          opacity: isComplete ? 0.5 : 1,
        },
        animatedStyle,
      ]}
    >
      <BrutalistText
        size={32}
        bold
        mono
        color={isComplete ? colors.muted : colors.text}
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
}) => {
  // Split numbers into 2 rows
  // 9x9: [1,2,3,4,5] and [6,7,8,9]
  // 6x6: [1,2,3] and [4,5,6]
  const { row1, row2 } = useMemo(() => {
    const splitPoint = Math.ceil(maxNumber / 2);
    const r1 = Array.from({ length: splitPoint }, (_, i) => i + 1);
    const r2 = Array.from({ length: maxNumber - splitPoint }, (_, i) => splitPoint + i + 1);
    return { row1: r1, row2: r2 };
  }, [maxNumber]);

  // Calculate button dimensions for the larger row (row1)
  const { buttonWidth, buttonHeight } = useMemo(() => {
    const columnsInRow1 = row1.length;
    const availableWidth = width - PADDING * 2 - GAP * (columnsInRow1 - 1);
    const w = availableWidth / columnsInRow1;
    const h = w * 0.85; // Slightly wider than tall
    return { buttonWidth: w, buttonHeight: h };
  }, [row1.length]);

  return (
    <View style={styles.container}>
      {/* Row 1 */}
      <View style={styles.numbersRow}>
        {row1.map((num) => (
          <NumberButton
            key={num}
            num={num}
            onPress={() => onNumberPress(num)}
            disabled={disabled}
            remaining={remainingCounts?.[num]}
            buttonWidth={buttonWidth}
            buttonHeight={buttonHeight}
          />
        ))}
      </View>

      {/* Row 2 */}
      <View style={[styles.numbersRow, styles.row2]}>
        {row2.map((num) => (
          <NumberButton
            key={num}
            num={num}
            onPress={() => onNumberPress(num)}
            disabled={disabled}
            remaining={remainingCounts?.[num]}
            buttonWidth={buttonWidth}
            buttonHeight={buttonHeight}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: PADDING,
    paddingVertical: 12,
  },
  numbersRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: GAP,
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
