import React, { useCallback } from 'react';
import { Pressable, StyleSheet, ViewStyle, TextStyle, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
} from 'react-native-reanimated';
import { useTheme } from '../context/ThemeContext';
import { BrutalistText } from './BrutalistText';

interface BrutalistButtonProps {
  title: string;
  onPress: () => void;
  style?: ViewStyle;
  textStyle?: TextStyle;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  icon?: React.ReactNode;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const BrutalistButton: React.FC<BrutalistButtonProps> = ({
  title,
  onPress,
  style,
  textStyle,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  icon,
}) => {
  const { colors } = useTheme();
  const pressed = useSharedValue(0);

  const handlePressIn = useCallback(() => {
    pressed.value = withSpring(1, { damping: 15, stiffness: 400 });
  }, []);

  const handlePressOut = useCallback(() => {
    pressed.value = withSpring(0, { damping: 15, stiffness: 400 });
  }, []);

  const handlePress = useCallback(() => {
    if (!disabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onPress();
    }
  }, [disabled, onPress]);

  const animatedStyle = useAnimatedStyle(() => {
    const translateY = interpolate(pressed.value, [0, 1], [0, 3]);
    const shadowOffset = interpolate(pressed.value, [0, 1], [4, 1]);
    return {
      transform: [{ translateY }],
      shadowOffset: { width: shadowOffset, height: shadowOffset },
    };
  });

  const getBackgroundColor = () => {
    if (disabled) return colors.highlightStrong;
    switch (variant) {
      case 'primary': return colors.primary;
      case 'secondary': return colors.surface;
      case 'outline': return colors.surface;
      case 'ghost': return 'transparent';
      default: return colors.primary;
    }
  };

  const getTextColor = () => {
    if (disabled) return colors.muted;
    switch (variant) {
      case 'primary': return colors.background;
      case 'secondary': return colors.text;
      case 'outline': return colors.primary;
      case 'ghost': return colors.primary;
      default: return colors.background;
    }
  };

  const getBorderColor = () => {
    if (disabled) return colors.highlightStrong;
    if (variant === 'ghost') return 'transparent';
    return colors.primary;
  };

  const getBorderWidth = () => {
    if (variant === 'ghost') return 0;
    if (variant === 'outline' || variant === 'secondary') return 3;
    return 0;
  };

  const getSizeStyles = (): ViewStyle => {
    switch (size) {
      case 'small': return { paddingVertical: 10, paddingHorizontal: 16, minWidth: 60 };
      case 'large': return { paddingVertical: 20, paddingHorizontal: 32, minWidth: 160 };
      default: return { paddingVertical: 16, paddingHorizontal: 24, minWidth: 120 };
    }
  };

  const getFontSize = () => {
    switch (size) {
      case 'small': return 14;
      case 'large': return 20;
      default: return 16;
    }
  };

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      style={[
        styles.container,
        getSizeStyles(),
        {
          backgroundColor: getBackgroundColor(),
          borderColor: getBorderColor(),
          borderWidth: getBorderWidth(),
          shadowColor: disabled || variant === 'ghost' ? 'transparent' : colors.primary,
          opacity: disabled ? 0.6 : 1,
        },
        animatedStyle,
        style,
      ]}
    >
      <View style={styles.content}>
        {icon && <View style={styles.icon}>{icon}</View>}
        <BrutalistText
          bold
          uppercase
          size={getFontSize()}
          center
          color={getTextColor()}
          style={textStyle}
        >
          {title}
        </BrutalistText>
      </View>
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    marginRight: 8,
  },
});
