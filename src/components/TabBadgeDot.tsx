/**
 * TabBadgeDot
 * Small square dot indicator for tab icons.
 * Follows brutalist design (no rounded corners).
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';

interface TabBadgeDotProps {
  visible: boolean;
  color?: string;
}

export const TabBadgeDot: React.FC<TabBadgeDotProps> = ({ visible, color = '#E53935' }) => {
  if (!visible) return null;

  return <View style={[styles.dot, { backgroundColor: color }]} />;
};

const styles = StyleSheet.create({
  dot: {
    position: 'absolute',
    top: -2,
    right: -6,
    width: 8,
    height: 8,
    // No borderRadius for brutalist design
  },
});
