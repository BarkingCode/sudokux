/**
 * Smart Hint Modal Component
 *
 * Displays a hint with technique explanation in a brutalist style.
 * Shows the technique name, difficulty, and step-by-step explanation.
 */

import React from 'react';
import { View, StyleSheet, Modal, Pressable, Dimensions } from 'react-native';
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { BrutalistText } from './BrutalistText';
import { BrutalistButton } from './BrutalistButton';
import { useTheme } from '../context/ThemeContext';
import {
  SmartHint,
  getTechniqueName,
  getTechniqueDifficulty,
} from '../game/hintAnalyzer';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface SmartHintModalProps {
  visible: boolean;
  hint: SmartHint | null;
  onClose: () => void;
  onApplyHint: () => void;
}

export const SmartHintModal: React.FC<SmartHintModalProps> = ({
  visible,
  hint,
  onClose,
  onApplyHint,
}) => {
  const { colors } = useTheme();

  if (!hint) return null;

  const techniqueName = getTechniqueName(hint.technique);
  const difficulty = getTechniqueDifficulty(hint.technique);

  const handleApply = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onApplyHint();
    onClose();
  };

  const handleGotIt = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <Animated.View
        entering={FadeIn.duration(200)}
        style={styles.overlay}
      >
        <Pressable style={styles.backdrop} onPress={onClose} />

        <Animated.View
          entering={SlideInDown.duration(300).springify()}
          style={[styles.modal, { backgroundColor: colors.background, borderColor: colors.primary }]}
        >
          {/* Header */}
          <View style={[styles.header, { backgroundColor: colors.primary }]}>
            <BrutalistText size={10} mono bold uppercase color={colors.background}>
              Smart Hint
            </BrutalistText>
          </View>

          {/* Technique Badge */}
          <View style={styles.techniqueBadgeContainer}>
            <View style={[styles.techniqueBadge, { borderColor: colors.primary }]}>
              <BrutalistText size={14} bold>
                {techniqueName}
              </BrutalistText>
            </View>
            <View
              style={[
                styles.difficultyBadge,
                {
                  backgroundColor:
                    difficulty === 'Easy'
                      ? colors.success
                      : difficulty === 'Medium'
                      ? '#FFA500'
                      : colors.mistake,
                },
              ]}
            >
              <BrutalistText size={9} mono bold color={colors.background}>
                {difficulty.toUpperCase()}
              </BrutalistText>
            </View>
          </View>

          {/* Explanation */}
          <View style={styles.explanationContainer}>
            <BrutalistText size={14} style={styles.explanation}>
              {hint.explanation}
            </BrutalistText>
          </View>

          {/* Cell Info */}
          <View style={[styles.cellInfo, { backgroundColor: colors.highlight }]}>
            <View style={styles.cellInfoRow}>
              <BrutalistText size={12} mono muted>
                Cell:
              </BrutalistText>
              <BrutalistText size={14} mono bold>
                R{hint.cell.row + 1}C{hint.cell.col + 1}
              </BrutalistText>
            </View>
            <View style={styles.cellInfoRow}>
              <BrutalistText size={12} mono muted>
                Value:
              </BrutalistText>
              <View style={[styles.valueBadge, { backgroundColor: colors.primary }]}>
                <BrutalistText size={18} bold color={colors.background}>
                  {hint.value}
                </BrutalistText>
              </View>
            </View>
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <Pressable
              onPress={handleGotIt}
              style={[styles.gotItButton, { borderColor: colors.muted }]}
            >
              <BrutalistText size={14} mono bold>
                Got it!
              </BrutalistText>
            </Pressable>

            <BrutalistButton
              title="Apply Hint"
              onPress={handleApply}
              style={styles.applyButton}
            />
          </View>

          {/* Tip */}
          <View style={[styles.tip, { borderTopColor: colors.muted }]}>
            <BrutalistText size={10} mono muted>
              Tip: "Got it!" lets you try solving it yourself. "Apply Hint" fills the cell.
            </BrutalistText>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  modal: {
    width: SCREEN_WIDTH - 48,
    maxWidth: 400,
    borderWidth: 3,
  },
  header: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  techniqueBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    paddingBottom: 8,
  },
  techniqueBadge: {
    borderWidth: 2,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  explanationContainer: {
    padding: 16,
    paddingTop: 8,
  },
  explanation: {
    lineHeight: 22,
  },
  cellInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 16,
    padding: 12,
    marginBottom: 16,
  },
  cellInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  valueBadge: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  gotItButton: {
    flex: 1,
    borderWidth: 2,
    paddingVertical: 12,
    alignItems: 'center',
  },
  applyButton: {
    flex: 1,
  },
  tip: {
    borderTopWidth: 1,
    padding: 12,
  },
});
