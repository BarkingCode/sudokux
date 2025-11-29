/**
 * Achievement toast notification component.
 * Displays a celebratory notification when an achievement is unlocked.
 * Uses Reanimated for smooth slide-in/slide-out animations.
 */

import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { BrutalistText } from './BrutalistText';
import { useTheme } from '../context/ThemeContext';
import type { AchievementDefinition } from '../data/achievements';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TOAST_WIDTH = SCREEN_WIDTH - 48;
const DISPLAY_DURATION = 3500;

// Milestone achievements get stronger haptic feedback
const MILESTONE_ACHIEVEMENTS = ['games_10', 'games_50', 'games_100', 'streak_7', 'streak_30', 'chapter_complete', 'master_easy', 'master_medium', 'master_hard'];

interface AchievementToastProps {
  achievement: AchievementDefinition | null;
  visible: boolean;
  onHide: () => void;
}

export const AchievementToast: React.FC<AchievementToastProps> = ({
  achievement,
  visible,
  onHide,
}) => {
  const { colors } = useTheme();
  const translateY = useSharedValue(-150);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.8);

  useEffect(() => {
    if (visible && achievement) {
      // Trigger haptic feedback - stronger for milestones
      const triggerHaptic = async () => {
        if (MILESTONE_ACHIEVEMENTS.includes(achievement.id)) {
          // Double burst for milestone achievements
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          setTimeout(async () => {
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }, 100);
        } else {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      };
      triggerHaptic();

      // Animate in
      translateY.value = withTiming(0, {
        duration: 400,
        easing: Easing.out(Easing.back(1.2)),
      });
      opacity.value = withTiming(1, { duration: 300 });
      scale.value = withTiming(1, {
        duration: 400,
        easing: Easing.out(Easing.back(1.2)),
      });

      // Animate out after delay
      translateY.value = withDelay(
        DISPLAY_DURATION,
        withTiming(-150, { duration: 300 }, (finished) => {
          if (finished) {
            runOnJS(onHide)();
          }
        })
      );
      opacity.value = withDelay(DISPLAY_DURATION, withTiming(0, { duration: 300 }));
      scale.value = withDelay(DISPLAY_DURATION, withTiming(0.8, { duration: 300 }));
    } else {
      translateY.value = -150;
      opacity.value = 0;
      scale.value = 0.8;
    }
  }, [visible, achievement, translateY, opacity, scale, onHide]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
    opacity: opacity.value,
  }));

  if (!achievement) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        animatedStyle,
        {
          backgroundColor: colors.background,
          borderColor: colors.primary,
        },
      ]}
      pointerEvents="none"
    >
      {/* Achievement unlocked header */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <BrutalistText size={10} mono bold uppercase color={colors.background}>
          Achievement Unlocked
        </BrutalistText>
      </View>

      <View style={styles.content}>
        {/* Icon */}
        <View style={[styles.iconBadge, { backgroundColor: colors.primary }]}>
          <BrutalistText size={20} bold color={colors.background}>
            {achievement.icon}
          </BrutalistText>
        </View>

        {/* Details */}
        <View style={styles.details}>
          <BrutalistText size={16} bold>
            {achievement.name}
          </BrutalistText>
          <BrutalistText size={12} mono muted numberOfLines={2}>
            {achievement.description}
          </BrutalistText>
        </View>

        {/* Checkmark */}
        <View style={[styles.checkmark, { backgroundColor: colors.success }]}>
          <BrutalistText size={14} bold color={colors.background}>
            ✓
          </BrutalistText>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 24,
    width: TOAST_WIDTH,
    borderWidth: 3,
    zIndex: 9999,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  header: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  iconBadge: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  details: {
    flex: 1,
    gap: 4,
  },
  checkmark: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
