/**
 * Daily Challenge screen - Same puzzle for all users worldwide.
 * Shows today's challenge, completion status, streak, and leaderboard.
 */

import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, ActivityIndicator, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Settings } from 'lucide-react-native';
import { BrutalistText } from '../../src/components/BrutalistText';
import { BrutalistButton } from '../../src/components/BrutalistButton';
import { BannerAd } from '../../src/components/BannerAd';
import { OfflineBanner } from '../../src/components/OfflineBanner';
import { StreakDisplay } from '../../src/components/StreakDisplay';
import { useTheme } from '../../src/context/ThemeContext';
import { useGame, Difficulty, GridType } from '../../src/context/GameContext';
import {
  getTodayChallenge,
  getTodayCompletion,
  getDailyLeaderboard,
  getDailyStreakInfo,
  getUserDailyRank,
  DailyChallenge,
  DailyCompletion,
  DailyLeaderboardEntry,
} from '../../src/services/dailyChallengeService';
import { getLocalDateString } from '../../src/utils/dateUtils';
import { loadSecureData, STORAGE_KEYS } from '../../src/utils/storage';

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
};

export default function DailyScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { loadDailyPuzzle } = useGame();

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [challenge, setChallenge] = useState<DailyChallenge | null>(null);
  const [completion, setCompletion] = useState<DailyCompletion | null>(null);
  const [leaderboard, setLeaderboard] = useState<DailyLeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [streak, setStreak] = useState({ current: 0, best: 0 });
  const [userId, setUserId] = useState<string | null>(null);

  const loadDailyData = useCallback(async () => {
    try {
      // Get user ID from SecureStore (identity is stored as JSON string)
      const storedData = await loadSecureData(STORAGE_KEYS.USER_ID);
      let uid: string | null = null;

      if (storedData) {
        try {
          const identity = JSON.parse(storedData);
          uid = identity?.supabaseUserId || identity?.id || null;
        } catch {
          uid = null;
        }
      }
      setUserId(uid);

      // Load challenge
      const todayChallenge = await getTodayChallenge();
      setChallenge(todayChallenge);

      // Load user-specific data if we have a user ID
      if (uid) {
        const [userCompletion, streakInfo, rank, board] = await Promise.all([
          getTodayCompletion(uid),
          getDailyStreakInfo(uid),
          getUserDailyRank(uid),
          getDailyLeaderboard(20),
        ]);

        setCompletion(userCompletion);
        setStreak({
          current: streakInfo?.currentStreak || 0,
          best: streakInfo?.bestStreak || 0,
        });
        setUserRank(rank);
        setLeaderboard(board);
      } else {
        // Just load leaderboard for anonymous users
        const board = await getDailyLeaderboard(20);
        setLeaderboard(board);
      }
    } catch (error) {
      console.error('Error loading daily data:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Load data on mount and when screen is focused
  useFocusEffect(
    useCallback(() => {
      loadDailyData();
    }, [loadDailyData])
  );

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadDailyData();
  }, [loadDailyData]);

  const playDailyChallenge = useCallback(() => {
    if (!challenge) return;

    // Load the pre-generated puzzle from the database
    loadDailyPuzzle({
      puzzleId: `daily-${challenge.id}`,
      difficulty: challenge.difficulty as Difficulty,
      gridType: challenge.grid_type as GridType,
      puzzle: challenge.puzzle_grid,
      solution: challenge.solution_grid,
    });

    router.push({
      pathname: '/game',
      params: {
        isDaily: 'true',
        challengeId: challenge.id,
        challengeDate: challenge.challenge_date,
      },
    });
  }, [challenge, loadDailyPuzzle, router]);

  // View completed puzzle in read-only mode (shows solution)
  const viewCompletedPuzzle = useCallback(() => {
    if (!challenge || !completion) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Load the solved puzzle (solution grid as both puzzle and solution)
    loadDailyPuzzle({
      puzzleId: `daily-${challenge.id}-completed`,
      difficulty: challenge.difficulty as Difficulty,
      gridType: challenge.grid_type as GridType,
      puzzle: challenge.solution_grid, // Show the completed solution
      solution: challenge.solution_grid,
    });

    router.push({
      pathname: '/game',
      params: {
        isDaily: 'true',
        challengeId: challenge.id,
        challengeDate: challenge.challenge_date,
        viewOnly: 'true', // Flag for read-only mode
        completionTime: completion.time_seconds.toString(),
        completionMistakes: completion.mistakes.toString(),
        completionRank: userRank?.toString() || '',
      },
    });
  }, [challenge, completion, userRank, loadDailyPuzzle, router]);

  const handlePlayChallenge = useCallback(() => {
    if (!challenge) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Daily mode has no game limits - just play directly
    playDailyChallenge();
  }, [challenge, playDailyChallenge]);

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <ActivityIndicator size="large" color={colors.primary} />
        <BrutalistText size={14} mono muted style={{ marginTop: 16 }}>
          Loading daily challenge...
        </BrutalistText>
      </SafeAreaView>
    );
  }

  const hasCompleted = !!completion;
  const today = getLocalDateString();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <OfflineBanner message="Offline - Using local puzzle. Leaderboard unavailable." />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* Header */}
        <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.headerSpacer} />
            <View style={styles.headerCenter}>
              <BrutalistText size={11} mono uppercase muted>
                {formatDate(today)}
              </BrutalistText>
              <BrutalistText size={36} bold uppercase letterSpacing={2}>
                DAILY
              </BrutalistText>
            </View>
            <Pressable
              style={[styles.settingsButton, { borderColor: colors.primary }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/settings');
              }}
            >
              <Settings size={20} color={colors.text} strokeWidth={2.5} />
            </Pressable>
          </View>
          <View style={[styles.headerLine, { backgroundColor: colors.primary }]} />
        </Animated.View>

        {/* Challenge Card */}
        {challenge && (
          <Animated.View
            entering={FadeInUp.delay(200).springify()}
            style={[
              styles.challengeCard,
              { borderColor: hasCompleted ? colors.success : colors.primary },
            ]}
          >
            {hasCompleted ? (
              <>
                <View style={styles.completedBadge}>
                  <BrutalistText size={12} mono uppercase color={colors.success}>
                    Today's Challenge Completed
                  </BrutalistText>
                </View>

                <View style={styles.completionStats}>
                  <View style={styles.statItem}>
                    <BrutalistText size={11} mono uppercase muted>
                      Time
                    </BrutalistText>
                    <BrutalistText size={28} bold mono>
                      {formatTime(completion!.time_seconds)}
                    </BrutalistText>
                  </View>

                  {userRank && (
                    <View style={styles.statItem}>
                      <BrutalistText size={11} mono uppercase muted>
                        Rank
                      </BrutalistText>
                      <BrutalistText size={28} bold>
                        #{userRank}
                      </BrutalistText>
                    </View>
                  )}

                  <View style={styles.statItem}>
                    <BrutalistText size={11} mono uppercase muted>
                      Mistakes
                    </BrutalistText>
                    <BrutalistText size={28} bold>
                      {completion!.mistakes}
                    </BrutalistText>
                  </View>
                </View>

                <BrutalistButton
                  title="VIEW COMPLETED PUZZLE"
                  onPress={viewCompletedPuzzle}
                  variant="outline"
                  size="medium"
                  style={styles.viewButton}
                />

                <BrutalistText size={12} mono muted style={styles.comeBack}>
                  Come back tomorrow for a new challenge!
                </BrutalistText>
              </>
            ) : (
              <>
                <View style={styles.challengeInfo}>
                  <BrutalistText size={12} mono uppercase muted>
                    Today's Difficulty
                  </BrutalistText>
                  <BrutalistText size={24} bold uppercase style={{ color: colors.accent }}>
                    {challenge.difficulty}
                  </BrutalistText>
                  <BrutalistText size={12} mono muted style={{ marginTop: 4 }}>
                    {challenge.grid_type} Grid
                  </BrutalistText>
                </View>

                <BrutalistButton
                  title="PLAY TODAY'S CHALLENGE"
                  onPress={handlePlayChallenge}
                  size="large"
                  style={styles.playButton}
                />

                <BrutalistText size={11} mono muted style={styles.hint}>
                  One attempt per day - make it count!
                </BrutalistText>
              </>
            )}
          </Animated.View>
        )}

        {/* Streak Info */}
        <Animated.View entering={FadeInUp.delay(300).springify()} style={styles.streakSection}>
          <StreakDisplay
            currentStreak={streak.current}
            bestStreak={streak.best}
            showMilestones
          />
        </Animated.View>

        {/* Leaderboard */}
        {leaderboard.length > 0 && (
          <Animated.View entering={FadeInUp.delay(400).springify()} style={styles.leaderboardSection}>
            <BrutalistText size={12} mono uppercase muted style={styles.sectionTitle}>
              Today's Leaderboard
            </BrutalistText>

            <View style={[styles.leaderboardContainer, { borderColor: colors.muted }]}>
              {leaderboard.slice(0, 10).map((entry, index) => (
                <View
                  key={entry.user_id}
                  style={[
                    styles.leaderboardRow,
                    index < leaderboard.length - 1 && {
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
                    {entry.country && (
                      <BrutalistText size={11} mono muted>
                        {entry.country}
                      </BrutalistText>
                    )}
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

      {/* Banner Ad */}
      <BannerAd />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 100,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  headerSpacer: {
    width: 40,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerLine: {
    width: 60,
    height: 3,
    marginTop: 12,
  },
  challengeCard: {
    borderWidth: 3,
    padding: 24,
    marginBottom: 24,
  },
  completedBadge: {
    alignItems: 'center',
    marginBottom: 20,
  },
  completionStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  comeBack: {
    textAlign: 'center',
  },
  challengeInfo: {
    alignItems: 'center',
    marginBottom: 24,
  },
  playButton: {
    width: '100%',
  },
  viewButton: {
    width: '100%',
    marginBottom: 16,
  },
  hint: {
    textAlign: 'center',
    marginTop: 12,
  },
  streakSection: {
    marginBottom: 24,
  },
  streakRow: {
    flexDirection: 'row',
    gap: 16,
  },
  streakBox: {
    flex: 1,
    borderWidth: 2,
    padding: 16,
    alignItems: 'center',
  },
  leaderboardSection: {
    marginBottom: 24,
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
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  rankContainer: {
    width: 32,
    alignItems: 'center',
  },
  playerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  timeContainer: {
    marginLeft: 12,
  },
});
