/**
 * Stat card component displaying a single statistic.
 * Shows label and value with brutalist styling.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { BrutalistText } from './BrutalistText';
import { useTheme } from '../context/ThemeContext';

interface StatCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  highlighted?: boolean;
  index?: number;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  subtitle,
  highlighted = false,
  index = 0,
}) => {
  const { colors } = useTheme();

  return (
    <Animated.View
      entering={FadeIn.delay(index * 50).duration(300)}
      style={[
        styles.container,
        {
          borderColor: highlighted ? colors.primary : colors.muted,
          backgroundColor: highlighted ? colors.primary : 'transparent',
        },
      ]}
    >
      <BrutalistText
        size={10}
        mono
        uppercase
        color={highlighted ? colors.background : colors.muted}
        style={styles.label}
      >
        {label}
      </BrutalistText>
      <BrutalistText
        size={28}
        bold
        color={highlighted ? colors.background : colors.text}
      >
        {value}
      </BrutalistText>
      {subtitle && (
        <BrutalistText
          size={10}
          mono
          color={highlighted ? colors.background : colors.muted}
          style={styles.subtitle}
        >
          {subtitle}
        </BrutalistText>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderWidth: 2,
    padding: 12,
    minHeight: 90,
  },
  label: {
    marginBottom: 4,
  },
  subtitle: {
    marginTop: 4,
  },
});
