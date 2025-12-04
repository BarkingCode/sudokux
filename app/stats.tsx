/**
 * Stats screen - Personal statistics and game history.
 * Shows total games, win rate, best times, streaks, and recent activity.
 */

import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Pressable, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { BrutalistText } from '../src/components/BrutalistText';
import { StatCard } from '../src/components/StatCard';
import { WeeklyChart, generateWeeklyData } from '../src/components/WeeklyChart';
import { HeatmapCalendar, generateHeatmapData } from '../src/components/HeatmapCalendar';
import { SolveTimeTrends, calculateSolveTimeTrends } from '../src/components/SolveTimeTrends';
import { useTheme } from '../src/context/ThemeContext';
import { statsService } from '../src/services/statsService';
import { getPointInfoForDifficulty } from '../src/services/pointService';
import { loadSecureData, STORAGE_KEYS } from '../src/utils/storage';
import type { UserStats, GameSession, Difficulty, GridType } from '../src/lib/database.types';

const formatTime = (seconds: number): string => {
  if (!seconds) return '--:--';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
};

const DIFFICULTY_LABELS: Record<string, string> = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
  extreme: 'Extreme',
  insane: 'Insane',
  inhuman: 'Inhuman',
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
  const helperPenalty = (game.helper_used || 0) * Math.abs(info.helperPenalty);
  return Math.max(0, info.gamePoints - mistakePenalty - helperPenalty);
};

export default function StatsScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const [userId, setUserId] = useState<string | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [recentGames, setRecentGames] = useState<GameSession[]>([]);
  const [weeklyGames, setWeeklyGames] = useState<GameSession[]>([]);
  const [heatmapGames, setHeatmapGames] = useState<GameSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchStats = useCallback(async (refresh = false) => {
    if (refresh) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const storedData = await loadSecureData(STORAGE_KEYS.USER_ID);
      let currentUserId: string | null = null;

      if (storedData) {
        try {
          const identity = JSON.parse(storedData);
          currentUserId = identity?.supabaseUserId || null;
        } catch {
          // Invalid JSON, ignore
        }
      }

      setUserId(currentUserId);

      if (currentUserId) {
        const [userStats, history, weekly, heatmap] = await Promise.all([
          statsService.getUserStats(currentUserId, true),
          statsService.getGameHistory(currentUserId, 10),
          statsService.getWeeklyGames(currentUserId),
          statsService.getHeatmapGames(currentUserId),
        ]);
        setStats(userStats);
        setRecentGames(history);
        setWeeklyGames(weekly);
        setHeatmapGames(heatmap);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const winRate = stats
    ? Math.round(((stats.total_wins || 0) / Math.max(stats.total_games || 1, 1)) * 100)
    : 0;

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
            Your Progress
          </BrutalistText>
          <BrutalistText size={24} bold uppercase letterSpacing={2}>
            STATISTICS
          </BrutalistText>
        </View>

        <View style={styles.headerRight} />
      </Animated.View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <BrutalistText size={14} mono muted style={{ marginTop: 16 }}>
            Loading stats...
          </BrutalistText>
        </View>
      ) : !stats ? (
        <View style={styles.emptyContainer}>
          <BrutalistText size={48} bold muted>
            —
          </BrutalistText>
          <BrutalistText size={14} mono muted style={{ marginTop: 12 }}>
            No stats yet
          </BrutalistText>
          <BrutalistText size={12} mono muted style={{ marginTop: 4 }}>
            Complete your first puzzle to see your stats!
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
              onRefresh={() => fetchStats(true)}
              tintColor={colors.primary}
            />
          }
        >
          {/* Overview Stats */}
          <Animated.View entering={FadeInUp.delay(150).springify()}>
            <BrutalistText size={12} mono uppercase muted style={styles.sectionTitle}>
              Overview
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
          </Animated.View>

          {/* Streak Stats */}
          <Animated.View entering={FadeInUp.delay(200).springify()}>
            <BrutalistText size={12} mono uppercase muted style={styles.sectionTitle}>
              Streaks
            </BrutalistText>
            <View style={styles.statsRow}>
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
          <Animated.View entering={FadeInUp.delay(250).springify()}>
            <BrutalistText size={12} mono uppercase muted style={styles.sectionTitle}>
              Weekly Activity
            </BrutalistText>
            <WeeklyChart data={generateWeeklyData(weeklyGames)} />
          </Animated.View>

          {/* Heatmap Calendar */}
          <Animated.View entering={FadeInUp.delay(300).springify()}>
            <BrutalistText size={12} mono uppercase muted style={styles.sectionTitle}>
              Play History
            </BrutalistText>
            <HeatmapCalendar data={generateHeatmapData(heatmapGames)} />
          </Animated.View>

          {/* Solve Time Trends */}
          <Animated.View entering={FadeInUp.delay(350).springify()}>
            <BrutalistText size={12} mono uppercase muted style={styles.sectionTitle}>
              Your Improvement
            </BrutalistText>
            <SolveTimeTrends stats={calculateSolveTimeTrends(heatmapGames)} />
          </Animated.View>

          {/* Recent Games */}
          {recentGames.length > 0 && (
            <Animated.View entering={FadeInUp.delay(400).springify()}>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
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
  sectionTitle: {
    marginTop: 16,
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
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
