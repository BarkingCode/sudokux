/**
 * Modal shown when user completes a daily challenge.
 * Displays their time, rank, and today's leaderboard.
 * No ads in daily mode - competition-based.
 */

import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, Modal, ScrollView, ActivityIndicator } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Trophy } from 'lucide-react-native';
import { BrutalistText } from './BrutalistText';
import { BrutalistButton } from './BrutalistButton';
import { useTheme } from '../context/ThemeContext';
import {
  submitDailyCompletion,
  getDailyLeaderboard,
  getUserDailyRank,
  DailyLeaderboardEntry,
  DailyChallenge,
} from '../services/dailyChallengeService';
import { badgeService } from '../services/badgeService';
import { checkAchievements } from '../services/achievementService';
import { logDailyChallengeCompleted, logGameCompleted } from '../services/facebookAnalytics';
import { maybeRequestReview } from '../services/storeReviewService';
import type { Difficulty } from '../lib/database.types';

interface DailyCompletionModalProps {
  visible: boolean;
  onClose: () => void;
  challenge: DailyChallenge;
  userId: string | null;
  difficulty: Difficulty;
  timeSeconds: number;
  mistakes: number;
  helperUsed: number;
  onClearProgress?: () => Promise<void>;
}

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

// Timeout wrapper for async operations
const withTimeout = <T,>(promise: Promise<T>, ms: number): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('Request timed out')), ms)
    ),
  ]);
};

export const DailyCompletionModal: React.FC<DailyCompletionModalProps> = ({
  visible,
  onClose,
  challenge,
  userId,
  difficulty,
  timeSeconds,
  mistakes,
  helperUsed,
  onClearProgress,
}) => {
  const { colors } = useTheme();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [totalPlayers, setTotalPlayers] = useState<number>(0);
  const [leaderboard, setLeaderboard] = useState<DailyLeaderboardEntry[]>([]);
  const [averageTime, setAverageTime] = useState<number | null>(null);

  // Reset state when modal becomes visible
  useEffect(() => {
    if (visible) {
      setIsSubmitting(false);
      setHasSubmitted(false);
      setSubmitError(null);
      setUserRank(null);
      setLeaderboard([]);
      setAverageTime(null);
      setTotalPlayers(0);
    }
  }, [visible]);

  // Auto-submit when modal opens
  useEffect(() => {
    if (visible && userId && !hasSubmitted && !isSubmitting) {
      submitAndLoadData();
    }
  }, [visible, userId, hasSubmitted, isSubmitting]);

  const submitAndLoadData = useCallback(async () => {
    if (!userId) {
      setSubmitError('Please sign in to save your score');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Step 1: Submit the completion (with 10s timeout)
      const result = await withTimeout(
        submitDailyCompletion(userId, challenge, timeSeconds, mistakes, helperUsed),
        10000
      );

      if (result.success) {
        // Clear saved daily progress since we completed successfully
        try {
          await onClearProgress?.();
        } catch (e) {
          console.log('Clear progress error:', e);
        }

        // Clear app badge on successful completion
        try {
          await badgeService.onDailyCompleted();
        } catch (e) {
          // Badge service failure is non-critical
          console.log('Badge service error:', e);
        }

        // Check and unlock achievements after successful daily completion
        try {
          await checkAchievements(userId, {
            difficulty,
            timeSeconds,
            mistakes,
            helperUsed,
          });
          console.log('[DailyCompletionModal] Checked achievements');
        } catch (e) {
          // Achievement check failure is non-critical
          console.log('Achievement check error:', e);
        }

        // Log Facebook analytics events
        logDailyChallengeCompleted(difficulty, timeSeconds);
        logGameCompleted(difficulty);

        // Request store review after successful completion
        maybeRequestReview();
      } else if (result.error && !result.error.includes('Already completed')) {
        // Only show error if it's not "already completed"
        setSubmitError(result.error);
      }

      setHasSubmitted(true);

      // Step 2: Load leaderboard and rank (with 8s timeout each)
      // These can fail without blocking the modal
      try {
        const [board, rank] = await Promise.all([
          withTimeout(getDailyLeaderboard(20), 8000).catch(() => [] as DailyLeaderboardEntry[]),
          withTimeout(getUserDailyRank(userId), 8000).catch(() => null),
        ]);

        setLeaderboard(board);
        setUserRank(rank);
        setTotalPlayers(board.length);

        // Calculate average time from leaderboard
        if (board.length > 0) {
          const totalTime = board.reduce((sum, entry) => sum + entry.time_seconds, 0);
          setAverageTime(Math.round(totalTime / board.length));
        }
      } catch (leaderboardError) {
        // Leaderboard failed but submission succeeded - not critical
        console.log('Leaderboard load error:', leaderboardError);
      }
    } catch (error: any) {
      console.error('Error submitting daily completion:', error);
      if (error.message === 'Request timed out') {
        setSubmitError('Request timed out. Tap retry to try again.');
      } else {
        setSubmitError('Failed to submit score. Tap retry to try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [userId, challenge, difficulty, timeSeconds, mistakes, helperUsed, onClearProgress]);

  const handleRetry = useCallback(() => {
    setHasSubmitted(false);
    setSubmitError(null);
    submitAndLoadData();
  }, [submitAndLoadData]);

  const getComparisonText = () => {
    if (!averageTime) return null;
    const diff = timeSeconds - averageTime;
    if (diff < 0) {
      return `${formatTime(Math.abs(diff))} faster than average`;
    } else if (diff > 0) {
      return `${formatTime(diff)} slower than average`;
    }
    return 'Exactly average!';
  };

  const getPerfectBonus = () => {
    if (mistakes === 0) return 'Perfect!';
    if (mistakes <= 2) return 'Great job!';
    return null;
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={[styles.overlay, { backgroundColor: 'rgba(0,0,0,0.85)' }]}>
        <View
          style={[styles.modal, { backgroundColor: colors.background, borderColor: colors.primary }]}
        >
          {/* Header */}
          <Animated.View entering={FadeIn.delay(200)} style={styles.header}>
            <View style={[styles.trophyContainer, { borderColor: colors.primary }]}>
              <Trophy size={32} color={colors.primary} strokeWidth={2.5} />
            </View>
            <BrutalistText size={12} mono uppercase muted style={{ marginTop: 16 }}>
              Daily Challenge Complete
            </BrutalistText>
            <BrutalistText size={32} bold uppercase letterSpacing={2}>
              FINISHED!
            </BrutalistText>
            {getPerfectBonus() && (
              <BrutalistText size={14} bold color={colors.success} style={{ marginTop: 4 }}>
                {getPerfectBonus()}
              </BrutalistText>
            )}
          </Animated.View>

          {isSubmitting ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <BrutalistText size={14} mono muted style={{ marginTop: 16 }}>
                Submitting score...
              </BrutalistText>
            </View>
          ) : (
            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
              {/* User Stats - Always show these immediately */}
              <Animated.View entering={FadeIn.delay(100)} style={styles.statsContainer}>
                <View style={[styles.statBox, { borderColor: colors.primary }]}>
                  <BrutalistText size={11} mono uppercase muted>
                    Your Time
                  </BrutalistText>
                  <BrutalistText size={32} bold mono>
                    {formatTime(timeSeconds)}
                  </BrutalistText>
                  {getComparisonText() && (
                    <BrutalistText size={11} mono color={timeSeconds < (averageTime || 0) ? colors.success : colors.muted}>
                      {getComparisonText()}
                    </BrutalistText>
                  )}
                </View>

                <View style={styles.statsRow}>
                  <View style={[styles.smallStatBox, { borderColor: colors.muted }]}>
                    <BrutalistText size={11} mono uppercase muted>
                      Rank
                    </BrutalistText>
                    <BrutalistText size={24} bold>
                      {userRank ? `#${userRank}` : '-'}
                    </BrutalistText>
                    {totalPlayers > 0 && (
                      <BrutalistText size={10} mono muted>
                        of {totalPlayers}
                      </BrutalistText>
                    )}
                  </View>

                  <View style={[styles.smallStatBox, { borderColor: colors.muted }]}>
                    <BrutalistText size={11} mono uppercase muted>
                      Mistakes
                    </BrutalistText>
                    <BrutalistText size={24} bold color={mistakes === 0 ? colors.success : colors.text}>
                      {mistakes}
                    </BrutalistText>
                  </View>

                  <View style={[styles.smallStatBox, { borderColor: colors.muted }]}>
                    <BrutalistText size={11} mono uppercase muted>
                      Avg Time
                    </BrutalistText>
                    <BrutalistText size={24} bold mono>
                      {averageTime ? formatTime(averageTime) : '-'}
                    </BrutalistText>
                  </View>
                </View>
              </Animated.View>

              {/* Error with Retry */}
              {submitError && (
                <View style={styles.errorContainer}>
                  <BrutalistText size={12} mono color={colors.mistake} style={styles.errorText}>
                    {submitError}
                  </BrutalistText>
                  <BrutalistButton
                    title="RETRY"
                    onPress={handleRetry}
                    variant="outline"
                    size="small"
                  />
                </View>
              )}

              {/* Leaderboard */}
              {leaderboard.length > 0 && (
                <Animated.View entering={FadeIn.delay(200)} style={styles.leaderboardSection}>
                  <BrutalistText size={12} mono uppercase muted style={styles.sectionTitle}>
                    Today's Leaderboard
                  </BrutalistText>

                  <View style={[styles.leaderboardContainer, { borderColor: colors.muted }]}>
                    {leaderboard.slice(0, 10).map((entry, index) => (
                      <View
                        key={entry.user_id}
                        style={[
                          styles.leaderboardRow,
                          index < leaderboard.slice(0, 10).length - 1 && {
                            borderBottomWidth: 1,
                            borderBottomColor: colors.highlight,
                          },
                          entry.user_id === userId && { backgroundColor: colors.highlight },
                        ]}
                      >
                        <View style={styles.rankContainer}>
                          <BrutalistText
                            size={16}
                            bold
                            color={index < 3 ? colors.accent : colors.text}
                          >
                            {entry.rank}
                          </BrutalistText>
                        </View>

                        <View style={styles.playerInfo}>
                          <BrutalistText size={14} bold numberOfLines={1}>
                            {entry.nickname}
                          </BrutalistText>
                        </View>

                        <View style={styles.timeContainer}>
                          <BrutalistText size={14} mono bold>
                            {formatTime(entry.time_seconds)}
                          </BrutalistText>
                        </View>
                      </View>
                    ))}
                  </View>
                </Animated.View>
              )}
            </ScrollView>
          )}

          {/* Close Button - Always visible */}
          <View style={styles.footer}>
            <BrutalistButton
              title="DONE"
              onPress={onClose}
              size="large"
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
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    width: '100%',
    maxHeight: '85%',
    borderWidth: 3,
    padding: 24,
    overflow: 'hidden',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  trophyContainer: {
    width: 64,
    height: 64,
    borderWidth: 3,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  content: {
    flexGrow: 1,
    flexShrink: 1,
  },
  statsContainer: {
    marginBottom: 24,
  },
  statBox: {
    borderWidth: 3,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  smallStatBox: {
    flex: 1,
    borderWidth: 2,
    padding: 12,
    alignItems: 'center',
  },
  errorContainer: {
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  errorText: {
    textAlign: 'center',
  },
  leaderboardSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    marginBottom: 12,
  },
  leaderboardContainer: {
    borderWidth: 2,
  },
  leaderboardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  rankContainer: {
    width: 28,
    alignItems: 'center',
  },
  playerInfo: {
    flex: 1,
    marginLeft: 8,
  },
  timeContainer: {
    marginLeft: 8,
  },
  footer: {
    marginTop: 16,
  },
  closeButton: {
    width: '100%',
  },
});
