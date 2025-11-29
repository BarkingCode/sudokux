import React from 'react';
import { Text, TextProps, StyleSheet, Platform } from 'react-native';
import { useTheme } from '../context/ThemeContext';

interface BrutalistTextProps extends TextProps {
  bold?: boolean;
  size?: number;
  color?: string;
  uppercase?: boolean;
  mono?: boolean;
  muted?: boolean;
  letterSpacing?: number;
  center?: boolean;
}

export const BrutalistText: React.FC<BrutalistTextProps> = ({
  style,
  bold = false,
  size = 16,
  color,
  uppercase = false,
  mono = false,
  muted = false,
  letterSpacing,
  center = false,
  children,
  ...props
}) => {
  const { colors } = useTheme();

  const getFontFamily = () => {
    if (mono) {
      return Platform.select({
        ios: 'Menlo',
        android: 'monospace',
        default: 'monospace',
      });
    }
    return Platform.select({
      ios: 'Helvetica Neue',
      android: 'sans-serif-condensed',
      default: 'System',
    });
  };

  const textColor = muted ? colors.muted : (color || colors.text);
  const spacing = letterSpacing ?? (uppercase ? 2 : 0);

  return (
    <Text
      style={[
        styles.base,
        {
          fontFamily: getFontFamily(),
          color: textColor,
          fontSize: size,
          fontWeight: bold ? '900' : '500',
          letterSpacing: spacing,
          textAlign: center ? 'center' : 'left',
        },
        style,
      ]}
      {...props}
    >
      {uppercase && typeof children === 'string' ? children.toUpperCase() : children}
    </Text>
  );
};

const styles = StyleSheet.create({
  base: {
    includeFontPadding: false,
  },
});
