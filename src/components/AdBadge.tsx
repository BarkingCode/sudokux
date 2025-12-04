/**
 * Small badge indicating a feature requires watching an ad to unlock.
 * Displayed as a small overlay on buttons for ad-gated features.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { BrutalistText } from './BrutalistText';
import { useTheme } from '../context/ThemeContext';

export const AdBadge: React.FC = () => {
  const { colors } = useTheme();

  return (
    <View style={[styles.badge, { backgroundColor: colors.text }]}>
      <BrutalistText size={8} bold color={colors.background}>
        AD
      </BrutalistText>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 2,
    zIndex: 1,
  },
});
