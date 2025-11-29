/**
 * Modal shown when user reaches the 5-game session limit.
 * Prompts user to watch a rewarded ad to unlock more games.
 */

import React, { useState } from 'react';
import { View, StyleSheet, Modal, Pressable, ActivityIndicator } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { BrutalistText } from './BrutalistText';
import { BrutalistButton } from './BrutalistButton';
import { useTheme } from '../context/ThemeContext';
import { useAds } from '../context/AdContext';
import { GAMES_PER_REWARD } from '../config/ads';

interface GameLimitModalProps {
  visible: boolean;
  onClose: () => void;
  onUnlocked?: () => void;
}

export const GameLimitModal: React.FC<GameLimitModalProps> = ({
  visible,
  onClose,
  onUnlocked,
}) => {
  const { colors } = useTheme();
  const { showRewardedAd, isRewardedAdReady, isLoadingAd, gamesRemaining } = useAds();
  const [isWatching, setIsWatching] = useState(false);

  const handleWatchAd = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsWatching(true);

    const success = await showRewardedAd();

    setIsWatching(false);

    if (success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onUnlocked?.();
      onClose();
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <Animated.View
        entering={FadeIn.duration(200)}
        exiting={FadeOut.duration(200)}
        style={[styles.overlay, { backgroundColor: 'rgba(0,0,0,0.8)' }]}
      >
        <Pressable style={styles.overlayPress} onPress={handleClose}>
          <Animated.View
            entering={SlideInDown.springify().damping(15)}
            exiting={SlideOutDown.springify()}
            style={[styles.modal, { backgroundColor: colors.background, borderColor: colors.primary }]}
          >
            <Pressable>
              {/* Header */}
              <View style={styles.header}>
                <BrutalistText size={11} mono uppercase muted>
                  Session Limit
                </BrutalistText>
                <BrutalistText size={28} bold uppercase letterSpacing={1}>
                  OUT OF GAMES
                </BrutalistText>
              </View>

              {/* Divider */}
              <View style={[styles.divider, { backgroundColor: colors.primary }]} />

              {/* Content */}
              <View style={styles.content}>
                <BrutalistText size={14} style={styles.description}>
                  You've completed {GAMES_PER_REWARD} games today.
                </BrutalistText>
                <BrutalistText size={14} muted style={styles.description}>
                  Watch a short video to unlock {GAMES_PER_REWARD} more games.
                </BrutalistText>
              </View>

              {/* Reward info */}
              <View style={[styles.rewardBox, { borderColor: colors.muted }]}>
                <BrutalistText size={12} mono uppercase muted>
                  Reward
                </BrutalistText>
                <BrutalistText size={24} bold>
                  +{GAMES_PER_REWARD} GAMES
                </BrutalistText>
              </View>

              {/* Actions */}
              <View style={styles.actions}>
                {isWatching || isLoadingAd ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color={colors.primary} />
                    <BrutalistText size={12} mono muted style={{ marginLeft: 12 }}>
                      {isWatching ? 'Loading ad...' : 'Preparing...'}
                    </BrutalistText>
                  </View>
                ) : (
                  <>
                    <BrutalistButton
                      title="WATCH AN AD"
                      onPress={handleWatchAd}
                      size="large"
                      style={styles.watchButton}
                      disabled={!isRewardedAdReady && !__DEV__}
                    />
                    {!isRewardedAdReady && (
                      <BrutalistText size={11} mono muted style={styles.hint}>
                        Ad loading... please wait
                      </BrutalistText>
                    )}
                  </>
                )}

                <BrutalistButton
                  title="MAYBE LATER"
                  onPress={handleClose}
                  variant="ghost"
                  size="small"
                  style={styles.closeButton}
                />
              </View>
            </Pressable>
          </Animated.View>
        </Pressable>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayPress: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modal: {
    width: '100%',
    maxWidth: 360,
    borderWidth: 3,
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 16,
  },
  divider: {
    height: 3,
    width: 60,
    alignSelf: 'center',
    marginBottom: 20,
  },
  content: {
    alignItems: 'center',
    marginBottom: 24,
  },
  description: {
    textAlign: 'center',
    marginBottom: 8,
  },
  rewardBox: {
    borderWidth: 2,
    padding: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  actions: {
    gap: 12,
  },
  watchButton: {
    width: '100%',
  },
  closeButton: {
    width: '100%',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  hint: {
    textAlign: 'center',
    marginTop: 8,
  },
});
