/**
 * Leaderboards screen - Displays global and country rankings.
 * Shows points-based leaderboard (unified across all difficulty levels).
 * Points: Easy=10, Medium=25, Hard=50, Extreme=100, Insane=200, Inhuman=500
 */

import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Pressable, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import Animated, { FadeInDown, FadeInUp, FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { BrutalistText } from '../src/components/BrutalistText';
import { useTheme } from '../src/context/ThemeContext';
import { pointService, type PointsLeaderboardEntry, type UserPointsRank, DIFFICULTY_POINTS, DIFFICULTY_POINTS_6X6 } from '../src/services/pointService';
import { loadSecureData, STORAGE_KEYS } from '../src/utils/storage';
import { statsService } from '../src/services/statsService';
import type { UserStats } from '../src/lib/database.types';

type ViewMode = 'global' | 'country';

// Country code to flag emoji
const getFlagEmoji = (countryCode: string | null): string => {
  if (!countryCode || countryCode.length !== 2) return '\u{1F30D}'; // Globe emoji
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
};

// Format points with commas
const formatPoints = (points: number): string => {
  return points.toLocaleString();
};

interface PointsLeaderboardRowProps {
  entry: PointsLeaderboardEntry;
  isCurrentUser?: boolean;
  index?: number;
}

const PointsLeaderboardRow: React.FC<PointsLeaderboardRowProps> = ({
  entry,
  isCurrentUser = false,
  index = 0,
}) => {
  const { colors } = useTheme();

  const getRankDisplay = (rank: number): { text: string; emoji: string; style: object } => {
    if (rank === 1) return { text: '1ST', emoji: '\u{1F947}', style: { backgroundColor: colors.primary } };
    if (rank === 2) return { text: '2ND', emoji: '\u{1F948}', style: { backgroundColor: colors.text, opacity: 0.8 } };
    if (rank === 3) return { text: '3RD', emoji: '\u{1F949}', style: { backgroundColor: colors.text, opacity: 0.6 } };
    return { text: `#${rank}`, emoji: '', style: { backgroundColor: colors.muted } };
  };

  const rankInfo = getRankDisplay(entry.rank);

  return (
    <Animated.View
      entering={FadeIn.delay(index * 30).duration(200)}
      style={[
        styles.rowContainer,
        {
          borderColor: isCurrentUser ? colors.primary : colors.muted,
          backgroundColor: isCurrentUser ? colors.highlight : 'transparent',
        },
      ]}
    >
      {/* Rank Badge */}
      <View style={styles.rankContainer}>
        {rankInfo.emoji ? (
          <BrutalistText size={20}>{rankInfo.emoji}</BrutalistText>
        ) : (
          <View style={[styles.rankBadge, rankInfo.style]}>
            <BrutalistText size={10} mono bold color={colors.background}>
              {rankInfo.text}
            </BrutalistText>
          </View>
        )}
      </View>

      {/* Player Info */}
      <View style={styles.playerInfo}>
        <View style={styles.nameRow}>
          <BrutalistText size={14} bold numberOfLines={1}>
            {entry.nickname}
          </BrutalistText>
          {isCurrentUser && (
            <View style={[styles.youBadge, { backgroundColor: colors.primary }]}>
              <BrutalistText size={8} mono bold color={colors.background}>
                YOU
              </BrutalistText>
            </View>
          )}
        </View>
        <BrutalistText size={12} mono muted>
          {getFlagEmoji(entry.country)} {entry.country || 'Unknown'}
        </BrutalistText>
      </View>

      {/* Points */}
      <View style={styles.pointsContainer}>
        <BrutalistText size={16} mono bold>
          {formatPoints(entry.points)}
        </BrutalistText>
        <BrutalistText size={10} mono muted>
          pts
        </BrutalistText>
      </View>
    </Animated.View>
  );
};

export default function LeaderboardsScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const [userId, setUserId] = useState<string | null>(null);
  const [userCountry, setUserCountry] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('global');
  const [entries, setEntries] = useState<PointsLeaderboardEntry[]>([]);
  const [userEntry, setUserEntry] = useState<PointsLeaderboardEntry | null>(null);
  const [userRank, setUserRank] = useState<UserPointsRank>({ rank: 0, totalPlayers: 0, points: 0 });
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [difficultyWins, setDifficultyWins] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Load user data from secure storage
  useEffect(() => {
    const loadUserData = async () => {
      const storedData = await loadSecureData(STORAGE_KEYS.USER_ID);
      if (storedData) {
        try {
          const identity = JSON.parse(storedData);
          setUserId(identity?.supabaseUserId || null);
          setUserCountry(identity?.country || null);
        } catch {
          // Invalid JSON, ignore
        }
      }
    };
    loadUserData();
  }, []);

  // Fetch leaderboard data
  const fetchLeaderboard = useCallback(async (refresh = false) => {
    if (refresh) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const country = viewMode === 'country' ? userCountry : undefined;

      const [data, entry, rank, stats, wins] = await Promise.all([
        country
          ? pointService.getCountryLeaderboard(country, 50)
          : pointService.getGlobalLeaderboard(50),
        userId
          ? pointService.getUserLeaderboardEntry(userId, country ?? undefined)
          : Promise.resolve(null),
        userId
          ? pointService.getUserPointsRank(userId, country ?? undefined)
          : Promise.resolve({ rank: 0, totalPlayers: 0, points: 0 }),
        userId
          ? statsService.getUserStats(userId, refresh)
          : Promise.resolve(null),
        userId
          ? statsService.getDifficultyWins(userId)
          : Promise.resolve({}),
      ]);

      setEntries(data);
      setUserEntry(entry);
      setUserRank(rank);
      setUserStats(stats);
      setDifficultyWins(wins);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [viewMode, userId, userCountry]);

  // Refresh data when screen gains focus
  useFocusEffect(
    useCallback(() => {
      fetchLeaderboard(true);
    }, [fetchLeaderboard])
  );

  // Re-fetch when userId becomes available (loads async from storage)
  useEffect(() => {
    if (userId) {
      fetchLeaderboard();
    }
  }, [userId, fetchLeaderboard]);

  const handleViewModeChange = useCallback((mode: ViewMode) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setViewMode(mode);
  }, []);

  const isUserInList = entries.some((e) => e.userId === userId);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.header}>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
          style={[styles.backButton, { borderColor: colors.primary }]}
        >
          <BrutalistText size={20} bold>
            {'\u2190'}
          </BrutalistText>
        </Pressable>

        <View style={styles.headerCenter}>
          <BrutalistText size={11} mono uppercase muted>
            Rankings
          </BrutalistText>
          <BrutalistText size={24} bold uppercase letterSpacing={2}>
            LEADERBOARDS
          </BrutalistText>
        </View>

        <View style={styles.headerRight} />
      </Animated.View>

      {/* View Mode Toggle */}
      <Animated.View entering={FadeInUp.delay(150).springify()} style={styles.viewModeContainer}>
        <Pressable
          onPress={() => handleViewModeChange('global')}
          style={[
            styles.viewModeButton,
            {
              borderColor: viewMode === 'global' ? colors.primary : colors.muted,
              backgroundColor: viewMode === 'global' ? colors.primary : 'transparent',
            },
          ]}
        >
          <BrutalistText
            size={12}
            mono
            bold
            uppercase
            color={viewMode === 'global' ? colors.background : colors.text}
          >
            {'\u{1F30D}'} Global
          </BrutalistText>
        </Pressable>
        <Pressable
          onPress={() => handleViewModeChange('country')}
          style={[
            styles.viewModeButton,
            {
              borderColor: viewMode === 'country' ? colors.primary : colors.muted,
              backgroundColor: viewMode === 'country' ? colors.primary : 'transparent',
            },
          ]}
        >
          <BrutalistText
            size={12}
            mono
            bold
            uppercase
            color={viewMode === 'country' ? colors.background : colors.text}
          >
            {'\u{1F3E0}'} Country
          </BrutalistText>
        </Pressable>
      </Animated.View>

      {/* Points Info */}
      {/* <Animated.View entering={FadeInUp.delay(175).springify()} style={styles.pointsInfoContainer}>
        <BrutalistText size={10} mono muted center>
          9x9: Easy={DIFFICULTY_POINTS.easy} | Med={DIFFICULTY_POINTS.medium} | Hard={DIFFICULTY_POINTS.hard} | Ext={DIFFICULTY_POINTS.extreme} | Ins={DIFFICULTY_POINTS.insane} | Inh={DIFFICULTY_POINTS.inhuman}
        </BrutalistText>
        <BrutalistText size={10} mono muted center style={{ marginTop: 2 }}>
          6x6: Easy={DIFFICULTY_POINTS_6X6.easy} | Med={DIFFICULTY_POINTS_6X6.medium} | Hard={DIFFICULTY_POINTS_6X6.hard} | Ext={DIFFICULTY_POINTS_6X6.extreme} | Ins={DIFFICULTY_POINTS_6X6.insane} | Inh={DIFFICULTY_POINTS_6X6.inhuman}
        </BrutalistText>
      </Animated.View> */}

      {/* Your Stats Card */}
      {!isLoading && userRank.points > 0 && (
        <Animated.View
          entering={FadeInUp.delay(200).springify()}
          style={[styles.yourStatsCard, { borderColor: colors.primary }]}
        >
          <BrutalistText size={11} mono uppercase muted style={styles.yourStatsTitle}>
            Your Stats
          </BrutalistText>

          {/* Points and Rank Row */}
          <View style={styles.yourStatsMainRow}>
            <View style={styles.yourStatsBigStat}>
              <BrutalistText size={28} mono bold>
                {formatPoints(userRank.points)}
              </BrutalistText>
              <BrutalistText size={10} mono muted>
                TOTAL POINTS
              </BrutalistText>
            </View>
            <View style={[styles.yourStatsDivider, { backgroundColor: colors.muted }]} />
            <View style={styles.yourStatsBigStat}>
              <BrutalistText size={28} mono bold>
                #{userRank.rank || '-'}
              </BrutalistText>
              <BrutalistText size={10} mono muted>
                {viewMode === 'country' ? 'COUNTRY RANK' : 'GLOBAL RANK'}
              </BrutalistText>
            </View>
          </View>

          {/* Games Completed Grid */}
          <View style={styles.yourStatsGamesGrid}>
            {(['easy', 'medium', 'hard', 'extreme', 'insane', 'inhuman'] as const).map((diff) => {
              const count = difficultyWins[diff] || 0;
              if (count === 0) return null;
              return (
                <View key={diff} style={[styles.yourStatsGameItem, { borderColor: colors.muted }]}>
                  <BrutalistText size={14} mono bold>
                    {count}
                  </BrutalistText>
                  <BrutalistText size={8} mono muted uppercase>
                    {diff.slice(0, 3)}
                  </BrutalistText>
                </View>
              );
            })}
          </View>

          {/* Streak Info */}
          {userStats && (userStats.daily_streak || 0) > 0 && (
            <View style={styles.yourStatsStreakRow}>
              <BrutalistText size={11} mono muted>
                Daily Streak: <BrutalistText size={11} mono bold>{userStats.daily_streak}</BrutalistText> days
              </BrutalistText>
              {(userStats.best_daily_streak || 0) > (userStats.daily_streak || 0) && (
                <BrutalistText size={11} mono muted>
                  {' '}(Best: {userStats.best_daily_streak})
                </BrutalistText>
              )}
            </View>
          )}
        </Animated.View>
      )}

      {/* Leaderboard List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <BrutalistText size={14} mono muted style={{ marginTop: 16 }}>
            Loading rankings...
          </BrutalistText>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => fetchLeaderboard(true)}
              tintColor={colors.primary}
            />
          }
        >
          {entries.length === 0 ? (
            <View style={styles.emptyContainer}>
              <BrutalistText size={48} bold muted>
                {'\u2014'}
              </BrutalistText>
              <BrutalistText size={14} mono muted style={{ marginTop: 12 }}>
                No rankings yet
              </BrutalistText>
              <BrutalistText size={12} mono muted style={{ marginTop: 4 }}>
                Complete puzzles to earn points!
              </BrutalistText>
            </View>
          ) : (
            <>
              {/* Total Players Count */}
              <View style={styles.totalPlayersContainer}>
                <BrutalistText size={11} mono muted>
                  {formatPoints(userRank.totalPlayers)} {viewMode === 'country' && userCountry ? `players in ${userCountry}` : 'players worldwide'}
                </BrutalistText>
              </View>

              {entries.map((entry, index) => (
                <PointsLeaderboardRow
                  key={entry.userId}
                  entry={entry}
                  isCurrentUser={entry.userId === userId}
                  index={index}
                />
              ))}

              {/* Show user's position if not in top 50 */}
              {userEntry && !isUserInList && (
                <View style={styles.userPositionSection}>
                  <View style={[styles.separator, { borderColor: colors.muted }]}>
                    <BrutalistText size={10} mono muted>
                      YOUR POSITION
                    </BrutalistText>
                  </View>
                  <PointsLeaderboardRow entry={userEntry} isCurrentUser index={0} />
                </View>
              )}
            </>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerRight: {
    width: 44,
  },
  viewModeContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 8,
    gap: 12,
  },
  viewModeButton: {
    flex: 1,
    borderWidth: 2,
    paddingVertical: 10,
    alignItems: 'center',
  },
  pointsInfoContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  totalPlayersContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  rowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    padding: 12,
    marginBottom: 8,
  },
  rankContainer: {
    width: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rankBadge: {
    width: 40,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerInfo: {
    flex: 1,
    gap: 2,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  youBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  pointsContainer: {
    alignItems: 'flex-end',
    marginLeft: 12,
  },
  userPositionSection: {
    marginTop: 16,
  },
  separator: {
    borderTopWidth: 1,
    borderStyle: 'dashed',
    paddingTop: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  yourStatsCard: {
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 16,
    borderWidth: 2,
    padding: 16,
  },
  yourStatsTitle: {
    marginBottom: 12,
  },
  yourStatsMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  yourStatsBigStat: {
    flex: 1,
    alignItems: 'center',
  },
  yourStatsDivider: {
    width: 1,
    height: 40,
    marginHorizontal: 16,
  },
  yourStatsGamesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  yourStatsGameItem: {
    borderWidth: 1,
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  yourStatsStreakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
