/**
 * Board screen - User's game board with achievements, leaderboards, and statistics.
 * Central hub for tracking progress and competing with others.
 *
 * Layout:
 * 1. Achievements horizontal scroll with View All
 * 2. Country Leaderboard preview with View All
 * 3. Full statistics (quick stats, weekly chart, heatmap, trends, recent games)
 */

import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Pressable, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { ChevronRight, Info } from 'lucide-react-native';
import { BrutalistText } from '../../src/components/BrutalistText';
import { AchievementBadge } from '../../src/components/AchievementBadge';
import { OfflineBanner } from '../../src/components/OfflineBanner';
import { PointsLeaderboardPreview } from '../../src/components/PointsLeaderboardPreview';
import { StatCard } from '../../src/components/StatCard';
import { WeeklyChart, generateWeeklyData } from '../../src/components/WeeklyChart';
import { HeatmapCalendar, generateHeatmapData } from '../../src/components/HeatmapCalendar';
import { SolveTimeTrends, calculateSolveTimeTrends } from '../../src/components/SolveTimeTrends';
import { PointSystemModal } from '../../src/components/PointSystemModal';
import { useTheme } from '../../src/context/ThemeContext';
import { statsService } from '../../src/services/statsService';
import { pointService, getPointInfoForDifficulty, type PointsLeaderboardEntry, type UserPointsRank } from '../../src/services/pointService';
import type { Difficulty, GridType } from '../../src/lib/database.types';
import { loadSecureData, STORAGE_KEYS } from '../../src/utils/storage';
import { ACHIEVEMENTS } from '../../src/data/achievements';
import type { UserStats, GameSession } from '../../src/lib/database.types';

const DIFFICULTY_LABELS: Record<string, string> = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
  extreme: 'Extreme',
  insane: 'Insane',
  inhuman: 'Inhuman',
};

const formatTime = (seconds: number): string => {
  if (!seconds) return '--:--';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

// Timeout wrapper to prevent hanging on slow/offline network
const withTimeout = <T,>(promise: Promise<T>, ms: number, fallback: T): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms)),
  ]);
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
};

const getGameType = (puzzleId: string): string => {
  if (puzzleId.startsWith('daily-')) return 'Daily';
  if (puzzleId.startsWith('chapter-')) return 'Chapter';
  return 'Free Run';
};

const calculateGamePoints = (game: GameSession): number => {
  if (!game.completed) return 0;
  const info = getPointInfoForDifficulty(
    game.difficulty as Difficulty,
    (game.grid_type || '9x9') as GridType
  );
  const mistakePenalty = (game.mistakes || 0) * Math.abs(info.mistakePenalty);
  const helperPenalty = (game.hints_used || 0) * Math.abs(info.helperPenalty);
  return Math.max(0, info.gamePoints - mistakePenalty - helperPenalty);
};

export default function BoardScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();

  // User state
  const [userId, setUserId] = useState<string | null>(null);
  const [userCountry, setUserCountry] = useState<string | null>(null);

  // Stats state
  const [stats, setStats] = useState<UserStats | null>(null);
  const [recentGames, setRecentGames] = useState<GameSession[]>([]);
  const [weeklyGames, setWeeklyGames] = useState<GameSession[]>([]);
  const [heatmapGames, setHeatmapGames] = useState<GameSession[]>([]);

  // Achievements state
  const [unlockedAchievementIds, setUnlockedAchievementIds] = useState<Set<string>>(new Set());

  // Leaderboard state (global)
  const [globalLeaderboard, setGlobalLeaderboard] = useState<PointsLeaderboardEntry[]>([]);
  const [userGlobalEntry, setUserGlobalEntry] = useState<PointsLeaderboardEntry | null>(null);
  const [userGlobalRank, setUserGlobalRank] = useState<UserPointsRank>({ rank: 0, totalPlayers: 0, points: 0 });

  // Loading state
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Point System Modal state
  const [showPointSystemModal, setShowPointSystemModal] = useState(false);

  const loadProfile = useCallback(async (refresh = false) => {
    if (refresh) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      // Get user data from secure storage
      const storedData = await loadSecureData(STORAGE_KEYS.USER_ID);
      let currentUserId: string | null = null;
      let country: string | null = null;

      if (storedData) {
        try {
          const identity = JSON.parse(storedData);
          currentUserId = identity?.supabaseUserId || null;
          country = identity?.country || null;
        } catch {
          // Invalid JSON, ignore
        }
      }

      setUserId(currentUserId);
      setUserCountry(country);

      if (currentUserId) {
        // Load all data in parallel with 10s timeouts to prevent hanging when offline
        const TIMEOUT_MS = 10000;
        const [
          userStats,
          achievements,
          history,
          weekly,
          heatmap,
          globalLb,
          globalEntry,
          globalRank,
        ] = await Promise.all([
          withTimeout(statsService.getUserStats(currentUserId, refresh), TIMEOUT_MS, null),
          withTimeout(statsService.getAchievements(currentUserId), TIMEOUT_MS, []),
          withTimeout(statsService.getGameHistory(currentUserId, 10), TIMEOUT_MS, []),
          withTimeout(statsService.getWeeklyGames(currentUserId), TIMEOUT_MS, []),
          withTimeout(statsService.getHeatmapGames(currentUserId), TIMEOUT_MS, []),
          withTimeout(pointService.getGlobalLeaderboard(5), TIMEOUT_MS, []),
          withTimeout(pointService.getUserLeaderboardEntry(currentUserId), TIMEOUT_MS, null),
          withTimeout(pointService.getUserPointsRank(currentUserId), TIMEOUT_MS, { rank: 0, totalPlayers: 0, points: 0 }),
        ]);

        setStats(userStats);
        setUnlockedAchievementIds(new Set(achievements.map((a) => a.achievement_id)));
        setRecentGames(history);
        setWeeklyGames(weekly);
        setHeatmapGames(heatmap);
        setGlobalLeaderboard(globalLb);
        setUserGlobalEntry(globalEntry);
        setUserGlobalRank(globalRank);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleNavigateAchievements = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/achievements');
  }, [router]);

  const handleNavigateLeaderboards = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/leaderboards');
  }, [router]);

  const handleOpenPointSystem = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowPointSystemModal(true);
  }, []);

  const winRate = stats
    ? Math.round(((stats.total_wins || 0) / Math.max(stats.total_games || 1, 1)) * 100)
    : 0;

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <BrutalistText size={14} mono muted style={{ marginTop: 16 }}>
            Loading...
          </BrutalistText>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <OfflineBanner message="Offline - Showing cached stats" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => loadProfile(true)}
            tintColor={colors.primary}
          />
        }
      >
        {/* Header */}
        <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.headerSpacer} />
            <View style={styles.headerTitleContainer}>
              <BrutalistText size={11} mono uppercase muted>
                Your Progress
              </BrutalistText>
              <BrutalistText size={36} bold uppercase letterSpacing={2}>
                BOARD
              </BrutalistText>
            </View>
            <Pressable onPress={handleOpenPointSystem} style={styles.infoButton}>
              <Info size={22} color={colors.primary} strokeWidth={2.5} />
            </Pressable>
          </View>
          <View style={[styles.headerLine, { backgroundColor: colors.primary }]} />
        </Animated.View>

        {/* Achievements Section */}
        <Animated.View entering={FadeInUp.delay(150).springify()}>
          <View style={styles.sectionHeader}>
            <BrutalistText size={12} mono uppercase muted>
              Achievements
            </BrutalistText>
            <Pressable onPress={handleNavigateAchievements} style={styles.viewAllButton}>
              <BrutalistText size={11} mono>
                View All
              </BrutalistText>
              <ChevronRight size={14} color={colors.text} strokeWidth={2.5} />
            </Pressable>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.achievementsScroll}
          >
            {ACHIEVEMENTS.map((achievement, index) => (
              <AchievementBadge
                key={achievement.id}
                achievement={achievement}
                isUnlocked={unlockedAchievementIds.has(achievement.id)}
                index={index}
                onPress={handleNavigateAchievements}
              />
            ))}
          </ScrollView>
        </Animated.View>

        {/* Global Leaderboard Section */}
        <Animated.View entering={FadeInUp.delay(200).springify()} style={styles.section}>
          <View style={styles.sectionHeader}>
            <BrutalistText size={12} mono uppercase muted>
              Global Leaderboard
            </BrutalistText>
            <Pressable onPress={handleNavigateLeaderboards} style={styles.viewAllButton}>
              <BrutalistText size={11} mono>
                View All
              </BrutalistText>
              <ChevronRight size={14} color={colors.text} strokeWidth={2.5} />
            </Pressable>
          </View>

          <PointsLeaderboardPreview
            topEntries={globalLeaderboard}
            userEntry={userGlobalEntry}
            userRank={userGlobalRank}
            currentUserId={userId}
            isLoading={false}
          />
        </Animated.View>

        {/* Statistics Section */}
        {stats && (
          <>
            {/* Quick Stats */}
            <Animated.View entering={FadeInUp.delay(250).springify()} style={styles.section}>
              <BrutalistText size={12} mono uppercase muted style={styles.sectionTitle}>
                Statistics
              </BrutalistText>
              <View style={styles.statsRow}>
                <StatCard
                  label="Total Games"
                  value={stats.total_games || 0}
                  index={0}
                />
                <StatCard
                  label="Wins"
                  value={stats.total_wins || 0}
                  subtitle={`${winRate}% win rate`}
                  index={1}
                />
              </View>
              <View style={[styles.statsRow, { marginTop: 12 }]}>
                <StatCard
                  label="Current Streak"
                  value={stats.current_streak || 0}
                  subtitle="days"
                  highlighted={(stats.current_streak || 0) >= 7}
                  index={2}
                />
                <StatCard
                  label="Best Streak"
                  value={stats.best_streak || 0}
                  subtitle="days"
                  index={3}
                />
              </View>
            </Animated.View>

            {/* Weekly Activity Chart */}
            <Animated.View entering={FadeInUp.delay(300).springify()} style={styles.section}>
              <BrutalistText size={12} mono uppercase muted style={styles.sectionTitle}>
                Weekly Activity
              </BrutalistText>
              <WeeklyChart data={generateWeeklyData(weeklyGames)} />
            </Animated.View>

            {/* Heatmap Calendar */}
            <Animated.View entering={FadeInUp.delay(350).springify()} style={styles.section}>
              <BrutalistText size={12} mono uppercase muted style={styles.sectionTitle}>
                Play History
              </BrutalistText>
              <HeatmapCalendar data={generateHeatmapData(heatmapGames)} />
            </Animated.View>

            {/* Solve Time Trends */}
            <Animated.View entering={FadeInUp.delay(400).springify()} style={styles.section}>
              <BrutalistText size={12} mono uppercase muted style={styles.sectionTitle}>
                Your Improvement
              </BrutalistText>
              <SolveTimeTrends stats={calculateSolveTimeTrends(heatmapGames)} />
            </Animated.View>

            {/* Recent Games */}
            {recentGames.length > 0 && (
              <Animated.View entering={FadeInUp.delay(450).springify()} style={styles.section}>
                <BrutalistText size={12} mono uppercase muted style={styles.sectionTitle}>
                  Recent Games
                </BrutalistText>
                <View style={[styles.recentGamesContainer, { borderColor: colors.muted }]}>
                  {recentGames.map((game, index) => (
                    <View
                      key={game.id}
                      style={[
                        styles.recentGameRow,
                        index > 0 && { borderTopWidth: 1, borderTopColor: colors.highlight },
                      ]}
                    >
                      <View style={styles.recentGameInfo}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <BrutalistText size={10} mono muted>
                            {getGameType(game.puzzle_id)}
                          </BrutalistText>
                          <BrutalistText size={10} mono muted>•</BrutalistText>
                          <BrutalistText size={12} bold>
                            {DIFFICULTY_LABELS[game.difficulty] || game.difficulty}
                          </BrutalistText>
                          <View style={[styles.gridTypeBadge, { borderColor: colors.muted }]}>
                            <BrutalistText size={9} mono muted>
                              {game.grid_type || '9x9'}
                            </BrutalistText>
                          </View>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <BrutalistText size={10} mono muted>
                            {formatDate(game.completed_at)}
                          </BrutalistText>
                          {(game.mistakes || 0) > 0 && (
                            <BrutalistText size={10} mono color={colors.mistake}>
                              {game.mistakes} mistake{game.mistakes !== 1 ? 's' : ''}
                            </BrutalistText>
                          )}
                        </View>
                      </View>
                      <View style={styles.recentGameStats}>
                        <BrutalistText size={14} mono bold>
                          {formatTime(game.time_seconds)}
                        </BrutalistText>
                      </View>
                      <View
                        style={[
                          styles.completedBadge,
                          { backgroundColor: game.completed ? colors.success : colors.muted },
                        ]}
                      >
                        <BrutalistText size={10} mono bold color={colors.background}>
                          {game.completed ? `+${calculateGamePoints(game)}` : 'DNF'}
                        </BrutalistText>
                      </View>
                    </View>
                  ))}
                </View>
              </Animated.View>
            )}
          </>
        )}

        {/* Empty State */}
        {!stats && (
          <View style={styles.emptyContainer}>
            <BrutalistText size={48} bold muted>
              {'\u2014'}
            </BrutalistText>
            <BrutalistText size={14} mono muted style={{ marginTop: 12 }}>
              No stats yet
            </BrutalistText>
            <BrutalistText size={12} mono muted style={{ marginTop: 4 }}>
              Complete your first puzzle to see your progress!
            </BrutalistText>
          </View>
        )}
      </ScrollView>

      {/* Point System Modal */}
      <PointSystemModal
        visible={showPointSystemModal}
        onClose={() => setShowPointSystemModal(false)}
        currentGridType="9x9"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    justifyContent: 'space-between',
    width: '100%',
  },
  headerSpacer: {
    width: 44,
  },
  headerTitleContainer: {
    alignItems: 'center',
    flex: 1,
  },
  infoButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerLine: {
    width: 60,
    height: 3,
    marginTop: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  achievementsScroll: {
    paddingBottom: 8,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  recentGamesContainer: {
    borderWidth: 2,
  },
  recentGameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  recentGameInfo: {
    flex: 1,
    gap: 2,
  },
  recentGameStats: {
    alignItems: 'flex-end',
    marginRight: 12,
  },
  completedBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  gridTypeBadge: {
    borderWidth: 1,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
});
