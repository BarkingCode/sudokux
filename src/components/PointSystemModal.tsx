/**
 * Point System Modal Component (Bottom Sheet)
 *
 * Displays point values, mistake penalties, and helper penalties
 * organized by difficulty level using a tabbed interface.
 * Presented as a bottom sheet modal for better mobile UX.
 * All values come from pointService.ts as the single source of truth.
 */

import React, { useState } from 'react';
import { View, StyleSheet, Modal, Pressable, Dimensions, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, SlideInDown, SlideOutDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { X } from 'lucide-react-native';
import { BrutalistText } from './BrutalistText';
import { useTheme } from '../context/ThemeContext';
import { getPointInfoForDifficulty } from '../services/pointService';
import type { Difficulty } from '../lib/database.types';
import type { GridType } from '../game/types';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard', 'extreme', 'insane', 'inhuman'];

const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
  extreme: 'Extreme',
  insane: 'Insane',
  inhuman: 'Inhuman',
};

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
  const insets = useSafeAreaInsets();
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
          exiting={SlideOutDown.duration(200)}
          style={[
            styles.sheet,
            {
              backgroundColor: colors.background,
              borderColor: colors.primary,
              paddingBottom: insets.bottom + 16,
            },
          ]}
        >
          {/* Drag Handle */}
          <View style={styles.handleContainer}>
            <View style={[styles.handle, { backgroundColor: colors.muted }]} />
          </View>

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerSpacer} />
            <BrutalistText size={14} bold uppercase letterSpacing={2}>
              Point System
            </BrutalistText>
            <Pressable onPress={handleClose} style={styles.closeButton}>
              <X size={24} color={colors.primary} strokeWidth={2.5} />
            </Pressable>
          </View>

          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
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
                  size={12}
                  mono
                  bold
                  color={displayGridType === '9x9' ? colors.background : colors.text}
                >
                  9×9 Standard
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
                  size={12}
                  mono
                  bold
                  color={displayGridType === '6x6' ? colors.background : colors.text}
                >
                  6×6 Mini
                </BrutalistText>
              </Pressable>
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
                    size={11}
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

            {/* Selected Difficulty Label */}
            <View style={styles.difficultyLabel}>
              <BrutalistText size={11} mono muted uppercase>
                {DIFFICULTY_LABELS[selectedDifficulty]} Difficulty
              </BrutalistText>
            </View>

            {/* Point Cards */}
            <View style={styles.pointsContainer}>
              {/* Game Points */}
              <View style={[styles.pointCard, { borderColor: colors.success }]}>
                <View>
                  <BrutalistText size={11} mono muted uppercase>
                    Completion Points
                  </BrutalistText>
                  <BrutalistText size={10} mono muted style={{ marginTop: 2 }}>
                    Earned when you solve the puzzle
                  </BrutalistText>
                </View>
                <BrutalistText size={32} mono bold color={colors.success}>
                  +{pointInfo.gamePoints}
                </BrutalistText>
              </View>

              {/* Mistake Penalty */}
              <View style={[styles.pointCard, { borderColor: colors.muted }]}>
                <View>
                  <BrutalistText size={11} mono muted uppercase>
                    Mistake Penalty
                  </BrutalistText>
                  <BrutalistText size={10} mono muted style={{ marginTop: 2 }}>
                    Per wrong number placed
                  </BrutalistText>
                </View>
                <BrutalistText
                  size={32}
                  mono
                  bold
                  color={pointInfo.mistakePenalty === 0 ? colors.muted : colors.mistake}
                >
                  {pointInfo.mistakePenalty === 0 ? '0' : pointInfo.mistakePenalty}
                </BrutalistText>
              </View>

              {/* Helper Penalty */}
              <View style={[styles.pointCard, { borderColor: colors.mistake }]}>
                <View>
                  <BrutalistText size={11} mono muted uppercase>
                    Helper Penalty
                  </BrutalistText>
                  <BrutalistText size={10} mono muted style={{ marginTop: 2 }}>
                    Per helper usage
                  </BrutalistText>
                </View>
                <BrutalistText size={32} mono bold color={colors.mistake}>
                  {pointInfo.helperPenalty}
                </BrutalistText>
              </View>
            </View>

            {/* Info Note */}
            <View style={[styles.infoNote, { backgroundColor: colors.highlight }]}>
              <BrutalistText size={11} mono>
                Points contribute to your global ranking on the leaderboard. Complete puzzles on
                higher difficulties to earn more points!
              </BrutalistText>
            </View>
          </ScrollView>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  sheet: {
    maxHeight: SCREEN_HEIGHT * 0.85,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderRightWidth: 3,
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  handle: {
    width: 40,
    height: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerSpacer: {
    width: 44,
  },
  closeButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: 20,
  },
  gridToggleContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  gridToggle: {
    flex: 1,
    paddingVertical: 12,
    borderWidth: 2,
    alignItems: 'center',
  },
  tabsContainer: {
    marginHorizontal: -20,
  },
  tabsContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 2,
  },
  difficultyLabel: {
    marginTop: 16,
    marginBottom: 12,
  },
  pointsContainer: {
    gap: 12,
  },
  pointCard: {
    borderWidth: 2,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoNote: {
    marginTop: 20,
    padding: 16,
    marginBottom: 8,
  },
});
