/**
 * OfflineBanner - Displays a persistent banner when the device is offline
 * Shows at the top of screens with customizable message for each context
 * Brutalist design: high contrast, sharp edges, no rounded corners
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNetwork } from '../context/NetworkContext';
import { useTheme } from '../context/ThemeContext';

interface OfflineBannerProps {
  message?: string;
}

export const OfflineBanner: React.FC<OfflineBannerProps> = ({
  message = "You're offline. Some features are limited.",
}) => {
  const { isInternetReachable } = useNetwork();
  const { colors, isDark } = useTheme();

  // Don't render if online
  if (isInternetReachable) {
    return null;
  }

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDark ? colors.text : colors.primary,
        },
      ]}
    >
      <Text
        style={[
          styles.text,
          {
            color: isDark ? colors.background : colors.background,
          },
        ]}
      >
        {message}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  text: {
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});
