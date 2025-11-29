/**
 * Achievement card component displaying a single achievement.
 * Shows locked/unlocked state with brutalist styling.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { BrutalistText } from './BrutalistText';
import { useTheme } from '../context/ThemeContext';
import type { AchievementDefinition } from '../data/achievements';

interface AchievementCardProps {
  achievement: AchievementDefinition;
  isUnlocked: boolean;
  unlockedAt?: string;
  index?: number;
}

export const AchievementCard: React.FC<AchievementCardProps> = ({
  achievement,
  isUnlocked,
  unlockedAt,
  index = 0,
}) => {
  const { colors } = useTheme();

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <Animated.View
      entering={FadeIn.delay(index * 50).duration(300)}
      style={[
        styles.container,
        {
          borderColor: isUnlocked ? colors.primary : colors.muted,
          backgroundColor: isUnlocked ? colors.background : colors.highlight,
          opacity: isUnlocked ? 1 : 0.6,
        },
      ]}
    >
      {/* Icon Badge */}
      <View
        style={[
          styles.iconBadge,
          {
            backgroundColor: isUnlocked ? colors.primary : colors.muted,
            borderColor: isUnlocked ? colors.primary : colors.muted,
          },
        ]}
      >
        <BrutalistText
          size={18}
          bold
          color={isUnlocked ? colors.background : colors.highlight}
        >
          {isUnlocked ? achievement.icon : '?'}
        </BrutalistText>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <BrutalistText
          size={16}
          bold
          style={!isUnlocked && styles.lockedText}
        >
          {achievement.secret && !isUnlocked ? '???' : achievement.name}
        </BrutalistText>
        <BrutalistText
          size={12}
          mono
          muted
          numberOfLines={2}
          style={styles.description}
        >
          {achievement.secret && !isUnlocked
            ? 'Complete a secret challenge to unlock'
            : achievement.description}
        </BrutalistText>
        {isUnlocked && unlockedAt && (
          <BrutalistText size={10} mono muted style={styles.date}>
            Unlocked {formatDate(unlockedAt)}
          </BrutalistText>
        )}
      </View>

      {/* Unlocked Indicator */}
      {isUnlocked && (
        <View style={[styles.checkmark, { backgroundColor: colors.success }]}>
          <BrutalistText size={12} bold color={colors.background}>
            OK
          </BrutalistText>
        </View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 3,
    padding: 16,
    marginBottom: 12,
  },
  iconBadge: {
    width: 48,
    height: 48,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  content: {
    flex: 1,
  },
  description: {
    marginTop: 4,
  },
  date: {
    marginTop: 6,
  },
  lockedText: {
    opacity: 0.7,
  },
  checkmark: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginLeft: 12,
  },
});
