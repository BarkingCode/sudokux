/**
 * AchievementBadge - Compact achievement badge for horizontal scroll display.
 * Shows emoji icon with achievement name below. Locked achievements are grayed out.
 */

import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Lock } from 'lucide-react-native';
import { BrutalistText } from './BrutalistText';
import { useTheme } from '../context/ThemeContext';
import type { AchievementDefinition } from '../data/achievements';

interface AchievementBadgeProps {
  achievement: AchievementDefinition;
  isUnlocked: boolean;
  index?: number;
  onPress?: () => void;
}

export const AchievementBadge: React.FC<AchievementBadgeProps> = ({
  achievement,
  isUnlocked,
  index = 0,
  onPress,
}) => {
  const { colors } = useTheme();

  const handlePress = () => {
    if (onPress) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onPress();
    }
  };

  return (
    <Animated.View entering={FadeIn.delay(index * 30).duration(200)}>
      <Pressable
        onPress={handlePress}
        style={[
          styles.container,
          {
            borderColor: isUnlocked ? colors.primary : colors.muted,
            backgroundColor: colors.background,
            opacity: isUnlocked ? 1 : 0.4,
          },
        ]}
      >
        {/* Emoji Icon */}
        <View
          style={[
            styles.iconContainer,
            {
              backgroundColor: isUnlocked ? colors.highlight : colors.background,
              borderColor: isUnlocked ? colors.primary : colors.muted,
            },
          ]}
        >
          {isUnlocked ? (
            <BrutalistText size={24} center>
              {achievement.icon}
            </BrutalistText>
          ) : (
            <Lock size={16} color={colors.muted} strokeWidth={2.5} />
          )}
        </View>

        {/* Achievement Name */}
        <BrutalistText
          size={9}
          mono
          center
          muted={!isUnlocked}
          numberOfLines={2}
          style={styles.name}
        >
          {achievement.name}
        </BrutalistText>

        {/* Unlocked Checkmark */}
        {isUnlocked && (
          <View style={[styles.checkBadge, { backgroundColor: colors.success }]}>
            <BrutalistText size={8} bold color={colors.background}>
              {'\u2713'}
            </BrutalistText>
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 70,
    height: 85,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 8,
    paddingHorizontal: 4,
    borderWidth: 2,
    marginRight: 10,
  },
  iconContainer: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    marginBottom: 4,
  },
  name: {
    lineHeight: 12,
  },
  checkBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 14,
    height: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
