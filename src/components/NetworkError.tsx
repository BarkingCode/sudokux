/**
 * Network error display component.
 * Shows when network requests fail with retry functionality.
 */

import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { BrutalistText } from './BrutalistText';
import { useTheme } from '../context/ThemeContext';

interface NetworkErrorProps {
  message?: string;
  onRetry?: () => void;
  compact?: boolean;
}

export const NetworkError: React.FC<NetworkErrorProps> = ({
  message = 'Unable to connect to the server',
  onRetry,
  compact = false,
}) => {
  const { colors } = useTheme();

  const handleRetry = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onRetry?.();
  };

  if (compact) {
    return (
      <Animated.View
        entering={FadeIn}
        style={[styles.compactContainer, { borderColor: colors.mistake }]}
      >
        <BrutalistText size={12} mono color={colors.mistake}>
          ⚠ {message}
        </BrutalistText>
        {onRetry && (
          <Pressable onPress={handleRetry} style={styles.compactRetry}>
            <BrutalistText size={12} mono bold color={colors.mistake}>
              RETRY
            </BrutalistText>
          </Pressable>
        )}
      </Animated.View>
    );
  }

  return (
    <Animated.View
      entering={ZoomIn}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <View style={[styles.errorBox, { borderColor: colors.muted }]}>
        <BrutalistText size={36} bold muted>
          ✕
        </BrutalistText>
        <BrutalistText size={16} bold uppercase style={styles.title}>
          Connection Error
        </BrutalistText>
        <BrutalistText size={12} mono muted style={styles.message}>
          {message}
        </BrutalistText>
        {onRetry && (
          <Pressable
            style={[styles.retryButton, { borderColor: colors.primary }]}
            onPress={handleRetry}
          >
            <BrutalistText size={14} bold uppercase>
              Try Again
            </BrutalistText>
          </Pressable>
        )}
        <BrutalistText size={10} mono muted style={styles.hint}>
          Check your internet connection
        </BrutalistText>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorBox: {
    borderWidth: 3,
    padding: 32,
    alignItems: 'center',
    maxWidth: 300,
  },
  title: {
    marginTop: 16,
  },
  message: {
    marginTop: 8,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 24,
    borderWidth: 2,
    paddingVertical: 12,
    paddingHorizontal: 32,
  },
  hint: {
    marginTop: 16,
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 2,
    padding: 12,
    marginVertical: 8,
  },
  compactRetry: {
    marginLeft: 12,
  },
});
