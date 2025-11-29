/**
 * Confetti Animation Component
 *
 * Brutalist-style confetti animation for milestone achievements.
 * Uses React Native Skia for rendering with Reanimated for animations.
 */

import React, { useEffect, useMemo, useCallback } from 'react';
import { Dimensions, StyleSheet } from 'react-native';
import { Canvas, Rect, Group } from '@shopify/react-native-skia';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  useDerivedValue,
  Easing,
  runOnJS,
  SharedValue,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ConfettiPiece {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  velocityX: number;
  velocityY: number;
  rotationSpeed: number;
  color: string;
}

interface ConfettiProps {
  visible: boolean;
  onComplete?: () => void;
  pieceCount?: number;
  duration?: number;
}

// Brutalist color palette - mostly black and white with occasional accent
const CONFETTI_COLORS = [
  '#000000', // Black
  '#FFFFFF', // White
  '#000000', // Black (more weight)
  '#333333', // Dark gray
  '#FFFFFF', // White (more weight)
  '#666666', // Medium gray
  '#FF0000', // Red accent (rare)
];

const generateConfettiPieces = (count: number): ConfettiPiece[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: SCREEN_WIDTH / 2 + (Math.random() - 0.5) * 100,
    y: SCREEN_HEIGHT / 3,
    width: 8 + Math.random() * 20,
    height: 4 + Math.random() * 12,
    rotation: Math.random() * 360,
    velocityX: (Math.random() - 0.5) * 15,
    velocityY: -8 - Math.random() * 12,
    rotationSpeed: (Math.random() - 0.5) * 10,
    color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
  }));
};

// Individual confetti piece component
const ConfettiPiece: React.FC<{
  piece: ConfettiPiece;
  progress: SharedValue<number>;
  duration: number;
}> = ({ piece, progress, duration }) => {
  const transform = useDerivedValue(() => {
    const t = progress.value;
    const gravity = 0.5;
    const time = t * (duration / 1000);

    const x = piece.x + piece.velocityX * time * 30;
    const y =
      piece.y +
      piece.velocityY * time * 30 +
      0.5 * gravity * time * time * 500;
    const rotation = piece.rotation + piece.rotationSpeed * time * 50;

    return [
      { translateX: x },
      { translateY: y },
      { rotate: (rotation * Math.PI) / 180 },
    ];
  }, [progress]);

  return (
    <Group
      transform={transform}
      origin={{ x: piece.width / 2, y: piece.height / 2 }}
    >
      <Rect
        x={-piece.width / 2}
        y={-piece.height / 2}
        width={piece.width}
        height={piece.height}
        color={piece.color}
      />
      {piece.color === '#FFFFFF' && (
        <Rect
          x={-piece.width / 2}
          y={-piece.height / 2}
          width={piece.width}
          height={piece.height}
          color="#000000"
          style="stroke"
          strokeWidth={1}
        />
      )}
    </Group>
  );
};

export const Confetti: React.FC<ConfettiProps> = ({
  visible,
  onComplete,
  pieceCount = 60,
  duration = 2500,
}) => {
  const opacity = useSharedValue(0);
  const progress = useSharedValue(0);

  const pieces = useMemo(() => {
    if (!visible) return [];
    return generateConfettiPieces(pieceCount);
  }, [visible, pieceCount]);

  const handleComplete = useCallback(() => {
    onComplete?.();
  }, [onComplete]);

  useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1, { duration: 100 });
      progress.value = withTiming(
        1,
        {
          duration,
          easing: Easing.out(Easing.quad),
        },
        (finished) => {
          if (finished) {
            runOnJS(handleComplete)();
          }
        }
      );

      // Fade out near the end
      const fadeOutDelay = duration - 500;
      opacity.value = withDelay(
        fadeOutDelay,
        withTiming(0, { duration: 500 })
      );
    } else {
      opacity.value = 0;
      progress.value = 0;
    }
  }, [visible, duration, opacity, progress, handleComplete]);

  const animatedContainerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  if (!visible || pieces.length === 0) return null;

  return (
    <Animated.View
      style={[styles.container, animatedContainerStyle]}
      pointerEvents="none"
    >
      <Canvas style={styles.canvas}>
        {pieces.map((piece) => (
          <ConfettiPiece
            key={piece.id}
            piece={piece}
            progress={progress}
            duration={duration}
          />
        ))}
      </Canvas>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9998,
    elevation: 9,
  },
  canvas: {
    flex: 1,
  },
});
