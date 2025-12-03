/**
 * Modal shown when user has run out of Free Run games.
 * Prompts user to watch a rewarded ad to unlock more games.
 */

import React, { useState } from 'react';
import { View, StyleSheet, Modal, ActivityIndicator } from 'react-native';
import { BrutalistText } from './BrutalistText';
import { BrutalistButton } from './BrutalistButton';
import { useTheme } from '../context/ThemeContext';
import { useAds } from '../context/AdContext';

interface GameLimitModalProps {
  visible: boolean;
  onClose: () => void;
  onUnlocked: () => void;
}

export const GameLimitModal: React.FC<GameLimitModalProps> = ({
  visible,
  onClose,
  onUnlocked,
}) => {
  const { colors } = useTheme();
  const { showRewardedAd, isRewardedAdReady, isLoadingAd, freeRunGamesRemaining } = useAds();
  const [isWatching, setIsWatching] = useState(false);

  const handleWatchAd = async () => {
    setIsWatching(true);
    try {
      const success = await showRewardedAd();
      if (success) {
        onUnlocked();
      }
    } catch (error) {
      console.log('[GameLimitModal] Error showing ad:', error);
    } finally {
      setIsWatching(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.modal, { backgroundColor: colors.background, borderColor: colors.primary }]}>
          {/* Header */}
          <View style={styles.header}>
            <BrutalistText size={24} bold uppercase>
              OUT OF GAMES
            </BrutalistText>
            <View style={[styles.headerLine, { backgroundColor: colors.primary }]} />
          </View>

          {/* Content */}
          <View style={styles.content}>
            <BrutalistText size={14} style={styles.description}>
              You've used all your free games. Watch a short ad to unlock 3 more games!
            </BrutalistText>

            <View style={styles.statsRow}>
              <BrutalistText size={12} mono muted>
                Games Remaining
              </BrutalistText>
              <BrutalistText size={18} bold mono>
                {freeRunGamesRemaining}
              </BrutalistText>
            </View>
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            {isWatching || isLoadingAd ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <BrutalistText size={12} mono muted style={styles.loadingText}>
                  Loading ad...
                </BrutalistText>
              </View>
            ) : (
              <>
                <BrutalistButton
                  title="WATCH AD"
                  onPress={handleWatchAd}
                  variant="primary"
                  size="large"
                  disabled={!isRewardedAdReady && !__DEV__}
                  style={styles.watchButton}
                />
                {!isRewardedAdReady && (
                  <BrutalistText size={10} mono muted style={styles.hint}>
                    Ad loading...
                  </BrutalistText>
                )}
              </>
            )}

            <BrutalistButton
              title="MAYBE LATER"
              onPress={onClose}
              variant="outline"
              size="medium"
              style={styles.closeButton}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
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
    marginBottom: 24,
  },
  headerLine: {
    width: 60,
    height: 3,
    marginTop: 12,
  },
  content: {
    marginBottom: 24,
  },
  description: {
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(128, 128, 128, 0.3)',
  },
  actions: {
    gap: 12,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    marginTop: 12,
  },
  watchButton: {
    width: '100%',
  },
  hint: {
    textAlign: 'center',
  },
  closeButton: {
    width: '100%',
  },
});
