/**
 * Enhanced streak display component with visual fire icon and milestones.
 * Shows current streak with animated elements and celebrates milestones.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';
import { BrutalistText } from './BrutalistText';
import { useTheme } from '../context/ThemeContext';

interface StreakDisplayProps {
  currentStreak: number;
  bestStreak: number;
  showMilestones?: boolean;
}

const MILESTONES = [7, 14, 30, 60, 100, 365];

export const StreakDisplay: React.FC<StreakDisplayProps> = ({
  currentStreak,
  bestStreak,
  showMilestones = true,
}) => {
  const { colors } = useTheme();

  const isOnStreak = currentStreak >= 1;
  const isHotStreak = currentStreak >= 7;
  const isOnFire = currentStreak >= 30;

  // Get next milestone
  const nextMilestone = MILESTONES.find((m) => m > currentStreak) || 365;
  const progressToNext = currentStreak / nextMilestone;

  // Get streak level for styling
  const getStreakLevel = (): { label: string; color: string } => {
    if (currentStreak >= 100) return { label: 'LEGENDARY', color: '#FFD700' };
    if (currentStreak >= 60) return { label: 'BLAZING', color: '#FF4500' };
    if (currentStreak >= 30) return { label: 'ON FIRE', color: '#FF6B35' };
    if (currentStreak >= 14) return { label: 'HEATING UP', color: '#FF8C00' };
    if (currentStreak >= 7) return { label: 'HOT STREAK', color: '#FFA500' };
    if (currentStreak >= 3) return { label: 'WARMING UP', color: colors.accent };
    return { label: '', color: colors.muted };
  };

  const streakLevel = getStreakLevel();

  return (
    <View style={styles.container}>
      {/* Main Streak Display */}
      <View style={styles.streakRow}>
        {/* Current Streak */}
        <Animated.View
          entering={ZoomIn.delay(100)}
          style={[
            styles.streakBox,
            {
              borderColor: isHotStreak ? streakLevel.color : colors.muted,
              backgroundColor: isOnFire ? `${streakLevel.color}15` : 'transparent',
            },
          ]}
        >
          <View style={styles.streakHeader}>
            <BrutalistText size={10} mono uppercase muted>
              Current Streak
            </BrutalistText>
            {isOnStreak && (
              <BrutalistText size={16}>
                {isOnFire ? '🔥' : isHotStreak ? '⚡' : '✨'}
              </BrutalistText>
            )}
          </View>

          <BrutalistText
            size={42}
            bold
            color={isHotStreak ? streakLevel.color : colors.text}
          >
            {currentStreak}
          </BrutalistText>

          <BrutalistText size={11} mono muted>
            {currentStreak === 1 ? 'day' : 'days'}
          </BrutalistText>

          {streakLevel.label && (
            <Animated.View
              entering={FadeIn.delay(200)}
              style={[styles.levelBadge, { backgroundColor: streakLevel.color }]}
            >
              <BrutalistText size={8} mono bold color={colors.background}>
                {streakLevel.label}
              </BrutalistText>
            </Animated.View>
          )}
        </Animated.View>

        {/* Best Streak */}
        <Animated.View
          entering={ZoomIn.delay(150)}
          style={[styles.streakBox, { borderColor: colors.muted }]}
        >
          <BrutalistText size={10} mono uppercase muted>
            Best Streak
          </BrutalistText>

          <BrutalistText size={42} bold muted={currentStreak < bestStreak}>
            {bestStreak}
          </BrutalistText>

          <BrutalistText size={11} mono muted>
            {bestStreak === 1 ? 'day' : 'days'}
          </BrutalistText>

          {currentStreak >= bestStreak && currentStreak > 0 && (
            <Animated.View
              entering={FadeIn.delay(200)}
              style={[styles.levelBadge, { backgroundColor: colors.success }]}
            >
              <BrutalistText size={8} mono bold color={colors.background}>
                PERSONAL BEST
              </BrutalistText>
            </Animated.View>
          )}
        </Animated.View>
      </View>

      {/* Progress to Next Milestone */}
      {showMilestones && currentStreak > 0 && currentStreak < 365 && (
        <Animated.View entering={FadeIn.delay(250)} style={styles.milestoneSection}>
          <View style={styles.milestoneHeader}>
            <BrutalistText size={10} mono muted>
              NEXT MILESTONE
            </BrutalistText>
            <BrutalistText size={10} mono muted>
              {currentStreak}/{nextMilestone} days
            </BrutalistText>
          </View>
          <View style={[styles.progressBar, { backgroundColor: colors.highlight }]}>
            <Animated.View
              entering={ZoomIn.delay(300)}
              style={[
                styles.progressFill,
                {
                  backgroundColor: streakLevel.color || colors.primary,
                  width: `${Math.min(progressToNext * 100, 100)}%`,
                },
              ]}
            />
          </View>
          <View style={styles.milestoneMarkers}>
            {MILESTONES.filter((m) => m <= nextMilestone * 1.5 && m >= currentStreak * 0.5)
              .slice(0, 3)
              .map((milestone) => (
                <BrutalistText
                  key={milestone}
                  size={9}
                  mono
                  muted={currentStreak < milestone}
                  bold={currentStreak >= milestone}
                >
                  {milestone}🔥
                </BrutalistText>
              ))}
          </View>
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  streakRow: {
    flexDirection: 'row',
    gap: 12,
  },
  streakBox: {
    flex: 1,
    borderWidth: 3,
    padding: 16,
    alignItems: 'center',
  },
  streakHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  levelBadge: {
    marginTop: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  milestoneSection: {
    gap: 8,
  },
  milestoneHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressBar: {
    height: 8,
    borderRadius: 0,
  },
  progressFill: {
    height: '100%',
  },
  milestoneMarkers: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
