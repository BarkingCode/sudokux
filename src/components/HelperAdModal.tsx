/**
 * Modal shown when user wants to unlock the Smart Possibility Helper.
 * Prompts user to watch a rewarded ad to unlock the helper for the current game.
 */

import React, { useState } from 'react';
import { View, StyleSheet, Modal, ActivityIndicator } from 'react-native';
import { BrutalistText } from './BrutalistText';
import { BrutalistButton } from './BrutalistButton';
import { useTheme } from '../context/ThemeContext';
import { useAds } from '../context/AdContext';

interface HelperAdModalProps {
  visible: boolean;
  onClose: () => void;
  onUnlocked: () => void;
}

export const HelperAdModal: React.FC<HelperAdModalProps> = ({
  visible,
  onClose,
  onUnlocked,
}) => {
  const { colors } = useTheme();
  // Use helper-specific ad (does NOT grant free-run games)
  const { showHelperRewardedAd, isHelperRewardedAdReady, isLoadingHelperAd } = useAds();
  const [isWatching, setIsWatching] = useState(false);

  const handleWatchAd = async () => {
    setIsWatching(true);
    try {
      const success = await showHelperRewardedAd();
      if (success) {
        onUnlocked();
      }
    } catch (error) {
      console.log('[HelperAdModal] Error showing ad:', error);
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
              UNLOCK HELPER
            </BrutalistText>
            <View style={[styles.headerLine, { backgroundColor: colors.primary }]} />
          </View>

          {/* Content */}
          <View style={styles.content}>
            <BrutalistText size={14} style={styles.description}>
              The Smart Helper highlights only the valid numbers for the selected cell.
            </BrutalistText>
            <BrutalistText size={12} muted style={styles.subdescription}>
              Watch a short ad to unlock for this puzzle. Resets on next game.
            </BrutalistText>
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            {isWatching || isLoadingHelperAd ? (
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
                  disabled={!isHelperRewardedAdReady && !__DEV__}
                  style={styles.watchButton}
                />
                {!isHelperRewardedAdReady && (
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
    marginBottom: 12,
    lineHeight: 22,
  },
  subdescription: {
    textAlign: 'center',
    lineHeight: 18,
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
