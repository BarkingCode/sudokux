/**
 * Modal shown when user completes a chapter puzzle.
 * Shows time, mistakes, and option to continue to next puzzle.
 */

import React from 'react';
import { View, StyleSheet, Modal } from 'react-native';
import Animated, { FadeIn, SlideInUp } from 'react-native-reanimated';
import { Trophy } from 'lucide-react-native';
import { BrutalistText } from './BrutalistText';
import { BrutalistButton } from './BrutalistButton';
import { useTheme } from '../context/ThemeContext';
import { Difficulty } from '../context/GameContext';

interface ChapterCompletionModalProps {
  visible: boolean;
  onClose: () => void;
  onNextPuzzle: () => void;
  puzzleNumber: number;
  nextPuzzleNumber: number;
  difficulty: Difficulty;
  timeSeconds: number;
  mistakes: number;
}

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const getDifficultyColor = (difficulty: Difficulty): string => {
  switch (difficulty) {
    case 'easy': return '#4CAF50';
    case 'medium': return '#FF9800';
    case 'hard': return '#FF5722';
    case 'extreme': return '#F44336';
    case 'insane': return '#9C27B0';
    case 'inhuman': return '#E91E63';
    default: return '#666';
  }
};

export const ChapterCompletionModal: React.FC<ChapterCompletionModalProps> = ({
  visible,
  onClose,
  onNextPuzzle,
  puzzleNumber,
  nextPuzzleNumber,
  difficulty,
  timeSeconds,
  mistakes,
}) => {
  const { colors } = useTheme();

  const getPerfectBonus = () => {
    if (mistakes === 0) return 'Perfect!';
    if (mistakes <= 2) return 'Great job!';
    return null;
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={[styles.overlay, { backgroundColor: 'rgba(0,0,0,0.85)' }]}>
        <Animated.View
          entering={SlideInUp.springify()}
          style={[styles.modal, { backgroundColor: colors.background, borderColor: colors.primary }]}
        >
          {/* Header */}
          <Animated.View entering={FadeIn.delay(200)} style={styles.header}>
            <View style={[styles.trophyContainer, { borderColor: colors.primary }]}>
              <Trophy size={32} color={colors.primary} strokeWidth={2.5} />
            </View>
            <BrutalistText size={12} mono uppercase muted style={{ marginTop: 16 }}>
              Puzzle {puzzleNumber} Complete
            </BrutalistText>
            <BrutalistText size={32} bold uppercase letterSpacing={2}>
              WELL DONE!
            </BrutalistText>
            {getPerfectBonus() && (
              <BrutalistText size={14} bold color={colors.success} style={{ marginTop: 4 }}>
                {getPerfectBonus()}
              </BrutalistText>
            )}
          </Animated.View>

          {/* Stats */}
          <Animated.View entering={FadeIn.delay(300)} style={styles.statsContainer}>
            <View style={styles.statsRow}>
              <View style={[styles.statBox, { borderColor: colors.primary }]}>
                <BrutalistText size={11} mono uppercase muted>
                  Time
                </BrutalistText>
                <BrutalistText size={28} bold mono>
                  {formatTime(timeSeconds)}
                </BrutalistText>
              </View>

              <View style={[styles.statBox, { borderColor: colors.primary }]}>
                <BrutalistText size={11} mono uppercase muted>
                  Mistakes
                </BrutalistText>
                <BrutalistText size={28} bold color={mistakes === 0 ? colors.success : colors.text}>
                  {mistakes}
                </BrutalistText>
              </View>
            </View>
          </Animated.View>

          {/* Next Puzzle Preview */}
          <Animated.View entering={FadeIn.delay(400)} style={styles.nextPuzzleContainer}>
            <BrutalistText size={12} mono uppercase muted>
              Next Up: Puzzle {nextPuzzleNumber}
            </BrutalistText>
            <View style={[styles.difficultyBadge, { borderColor: getDifficultyColor(difficulty) }]}>
              <BrutalistText
                size={11}
                mono
                bold
                uppercase
                color={getDifficultyColor(difficulty)}
              >
                {difficulty}
              </BrutalistText>
            </View>
          </Animated.View>

          {/* Buttons */}
          <View style={styles.footer}>
            <BrutalistButton
              title="CONTINUE"
              onPress={onNextPuzzle}
              size="large"
              style={styles.continueButton}
            />
            <BrutalistButton
              title="BACK TO CHAPTERS"
              onPress={onClose}
              variant="ghost"
              size="medium"
              style={styles.backButton}
            />
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    width: '100%',
    borderWidth: 3,
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  trophyContainer: {
    width: 64,
    height: 64,
    borderWidth: 3,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsContainer: {
    marginBottom: 24,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statBox: {
    flex: 1,
    borderWidth: 2,
    padding: 16,
    alignItems: 'center',
  },
  nextPuzzleContainer: {
    alignItems: 'center',
    marginBottom: 24,
    gap: 8,
  },
  difficultyBadge: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  footer: {
    gap: 12,
  },
  continueButton: {
    width: '100%',
  },
  backButton: {
    width: '100%',
  },
});
