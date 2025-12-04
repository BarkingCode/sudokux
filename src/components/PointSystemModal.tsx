/**
 * Point System Modal Component
 *
 * Displays point values, mistake penalties, and helper penalties
 * organized by difficulty level using a tabbed interface.
 * All values come from pointService.ts as the single source of truth.
 */

import React, { useState } from 'react';
import { View, StyleSheet, Modal, Pressable, Dimensions, ScrollView } from 'react-native';
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { BrutalistText } from './BrutalistText';
import { BrutalistButton } from './BrutalistButton';
import { useTheme } from '../context/ThemeContext';
import { getPointInfoForDifficulty } from '../services/pointService';
import type { Difficulty } from '../lib/database.types';
import type { GridType } from '../game/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard', 'extreme', 'insane', 'inhuman'];

interface PointSystemModalProps {
  visible: boolean;
  onClose: () => void;
  currentGridType: GridType;
}

export const PointSystemModal: React.FC<PointSystemModalProps> = ({
  visible,
  onClose,
  currentGridType,
}) => {
  const { colors } = useTheme();
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>('easy');
  const [displayGridType, setDisplayGridType] = useState<GridType>(currentGridType);

  const pointInfo = getPointInfoForDifficulty(selectedDifficulty, displayGridType);

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  };

  const handleDifficultySelect = (difficulty: Difficulty) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedDifficulty(difficulty);
  };

  const handleGridTypeSelect = (gridType: GridType) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setDisplayGridType(gridType);
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
        <Pressable style={styles.backdrop} onPress={handleClose} />

        <Animated.View
          entering={SlideInDown.duration(300).springify()}
          style={[styles.modal, { backgroundColor: colors.background, borderColor: colors.primary }]}
        >
          {/* Header */}
          <View style={[styles.header, { backgroundColor: colors.primary }]}>
            <BrutalistText size={10} mono bold uppercase color={colors.background}>
              Point System
            </BrutalistText>
          </View>

          {/* Difficulty Tabs */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.tabsContainer}
            contentContainerStyle={styles.tabsContent}
          >
            {DIFFICULTIES.map((diff) => (
              <Pressable
                key={diff}
                onPress={() => handleDifficultySelect(diff)}
                style={[
                  styles.tab,
                  {
                    borderColor: selectedDifficulty === diff ? colors.primary : colors.muted,
                    backgroundColor: selectedDifficulty === diff ? colors.primary : 'transparent',
                  },
                ]}
              >
                <BrutalistText
                  size={10}
                  mono
                  bold
                  uppercase
                  color={selectedDifficulty === diff ? colors.background : colors.text}
                >
                  {diff}
                </BrutalistText>
              </Pressable>
            ))}
          </ScrollView>

          {/* Grid Type Toggle */}
          <View style={styles.gridToggleContainer}>
            <Pressable
              onPress={() => handleGridTypeSelect('9x9')}
              style={[
                styles.gridToggle,
                {
                  borderColor: displayGridType === '9x9' ? colors.primary : colors.muted,
                  backgroundColor: displayGridType === '9x9' ? colors.primary : 'transparent',
                },
              ]}
            >
              <BrutalistText
                size={11}
                mono
                bold
                color={displayGridType === '9x9' ? colors.background : colors.text}
              >
                9×9
              </BrutalistText>
            </Pressable>
            <Pressable
              onPress={() => handleGridTypeSelect('6x6')}
              style={[
                styles.gridToggle,
                {
                  borderColor: displayGridType === '6x6' ? colors.primary : colors.muted,
                  backgroundColor: displayGridType === '6x6' ? colors.primary : 'transparent',
                },
              ]}
            >
              <BrutalistText
                size={11}
                mono
                bold
                color={displayGridType === '6x6' ? colors.background : colors.text}
              >
                6×6
              </BrutalistText>
            </Pressable>
          </View>

          {/* Point Cards */}
          <View style={styles.pointsContainer}>
            {/* Game Points */}
            <View style={[styles.pointCard, { borderColor: colors.success }]}>
              <BrutalistText size={11} mono muted uppercase>
                Game Points
              </BrutalistText>
              <BrutalistText size={28} mono bold color={colors.success}>
                +{pointInfo.gamePoints}
              </BrutalistText>
            </View>

            {/* Mistake Penalty */}
            <View style={[styles.pointCard, { borderColor: colors.muted }]}>
              <BrutalistText size={11} mono muted uppercase>
                Mistake Penalty
              </BrutalistText>
              <BrutalistText size={28} mono bold color={pointInfo.mistakePenalty === 0 ? colors.muted : colors.mistake}>
                {pointInfo.mistakePenalty === 0 ? '0' : pointInfo.mistakePenalty}
              </BrutalistText>
            </View>

            {/* Helper Penalty */}
            <View style={[styles.pointCard, { borderColor: colors.mistake }]}>
              <BrutalistText size={11} mono muted uppercase>
                Helper Penalty
              </BrutalistText>
              <BrutalistText size={28} mono bold color={colors.mistake}>
                {pointInfo.helperPenalty}
              </BrutalistText>
            </View>
          </View>

          {/* Footer Note */}
          <View style={[styles.footerNote, { borderTopColor: colors.muted }]}>
            <BrutalistText size={10} mono muted>
              Points are earned upon completing a puzzle. Helper penalties apply each time you use the helper feature.
            </BrutalistText>
          </View>

          {/* Close Button */}
          <View style={styles.buttonContainer}>
            <BrutalistButton
              title="Got it"
              onPress={handleClose}
              variant="primary"
              style={styles.closeButton}
            />
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
  tabsContainer: {
    maxHeight: 50,
  },
  tabsContent: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
  },
  tab: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 2,
  },
  gridToggleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  gridToggle: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 2,
  },
  pointsContainer: {
    paddingHorizontal: 16,
    gap: 12,
  },
  pointCard: {
    borderWidth: 2,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerNote: {
    borderTopWidth: 1,
    marginTop: 16,
    padding: 12,
  },
  buttonContainer: {
    padding: 16,
    paddingTop: 8,
  },
  closeButton: {
    width: '100%',
  },
});
