/**
 * Board screen - User's game board with achievements, leaderboards, and statistics.
 * Central hub for tracking progress and competing with others.
 */

import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Pressable, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Trophy, Medal, BarChart3, ChevronRight } from 'lucide-react-native';
import { BrutalistText } from '../../src/components/BrutalistText';
import { useTheme } from '../../src/context/ThemeContext';
import { statsService } from '../../src/services/statsService';
import { loadData, STORAGE_KEYS } from '../../src/utils/storage';
import { ACHIEVEMENTS } from '../../src/data/achievements';
import type { UserStats } from '../../src/lib/database.types';

export default function ProfileScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const [userId, setUserId] = useState<string | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [unlockedCount, setUnlockedCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadProfile = useCallback(async (refresh = false) => {
    if (refresh) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const userData = await loadData<{ odooUserId: string }>(STORAGE_KEYS.USER_ID);
      const currentUserId = userData?.odooUserId || null;
      setUserId(currentUserId);

      if (currentUserId) {
        const [userStats, achievements] = await Promise.all([
          statsService.getUserStats(currentUserId, refresh),
          statsService.getAchievements(currentUserId),
        ]);
        setStats(userStats);
        setUnlockedCount(achievements.length);
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

  const handleNavigateStats = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/stats');
  }, [router]);

  const winRate = stats
    ? Math.round(((stats.total_wins || 0) / Math.max(stats.total_games || 1, 1)) * 100)
    : 0;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
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
          <BrutalistText size={11} mono uppercase muted>
            Your Progress
          </BrutalistText>
          <BrutalistText size={36} bold uppercase letterSpacing={2}>
            BOARD
          </BrutalistText>
          <View style={[styles.headerLine, { backgroundColor: colors.primary }]} />
        </Animated.View>

        {/* Quick Stats */}
        {stats && (
          <Animated.View entering={FadeInUp.delay(150).springify()}>
            <View style={styles.quickStats}>
              <View style={[styles.quickStatCard, { borderColor: colors.primary }]}>
                <BrutalistText size={32} bold>
                  {stats.total_games || 0}
                </BrutalistText>
                <BrutalistText size={10} mono uppercase muted>
                  Games Played
                </BrutalistText>
              </View>
              <View style={[styles.quickStatCard, { borderColor: colors.primary }]}>
                <BrutalistText size={32} bold>
                  {winRate}%
                </BrutalistText>
                <BrutalistText size={10} mono uppercase muted>
                  Win Rate
                </BrutalistText>
              </View>
              <View style={[styles.quickStatCard, { borderColor: colors.primary }]}>
                <BrutalistText size={32} bold>
                  {stats.current_streak || 0}
                </BrutalistText>
                <BrutalistText size={10} mono uppercase muted>
                  Day Streak
                </BrutalistText>
              </View>
            </View>
          </Animated.View>
        )}

        {/* Game Section */}
        <Animated.View entering={FadeInUp.delay(200).springify()}>
          <BrutalistText size={12} mono uppercase muted style={styles.sectionTitle}>
            Game
          </BrutalistText>

          <View style={[styles.section, { borderColor: colors.primary }]}>
            <Pressable style={styles.menuRow} onPress={handleNavigateAchievements}>
              <View style={[styles.menuIcon, { backgroundColor: colors.highlight }]}>
                <Trophy size={20} color={colors.text} strokeWidth={2.5} />
              </View>
              <View style={styles.menuInfo}>
                <BrutalistText size={16} bold>
                  Achievements
                </BrutalistText>
                <BrutalistText size={12} mono muted>
                  {unlockedCount}/{ACHIEVEMENTS.length} unlocked
                </BrutalistText>
              </View>
              <ChevronRight size={24} color={colors.text} strokeWidth={2.5} />
            </Pressable>

            <View style={[styles.divider, { borderTopColor: colors.highlight }]} />

            <Pressable style={styles.menuRow} onPress={handleNavigateLeaderboards}>
              <View style={[styles.menuIcon, { backgroundColor: colors.highlight }]}>
                <Medal size={20} color={colors.text} strokeWidth={2.5} />
              </View>
              <View style={styles.menuInfo}>
                <BrutalistText size={16} bold>
                  Leaderboards
                </BrutalistText>
                <BrutalistText size={12} mono muted>
                  Global & country rankings
                </BrutalistText>
              </View>
              <ChevronRight size={24} color={colors.text} strokeWidth={2.5} />
            </Pressable>

            <View style={[styles.divider, { borderTopColor: colors.highlight }]} />

            <Pressable style={styles.menuRow} onPress={handleNavigateStats}>
              <View style={[styles.menuIcon, { backgroundColor: colors.highlight }]}>
                <BarChart3 size={20} color={colors.text} strokeWidth={2.5} />
              </View>
              <View style={styles.menuInfo}>
                <BrutalistText size={16} bold>
                  Statistics
                </BrutalistText>
                <BrutalistText size={12} mono muted>
                  Your progress & history
                </BrutalistText>
              </View>
              <ChevronRight size={24} color={colors.text} strokeWidth={2.5} />
            </Pressable>
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  headerLine: {
    width: 60,
    height: 3,
    marginTop: 12,
  },
  quickStats: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  quickStatCard: {
    flex: 1,
    borderWidth: 3,
    padding: 12,
    alignItems: 'center',
  },
  sectionTitle: {
    marginBottom: 12,
  },
  section: {
    borderWidth: 3,
    marginBottom: 24,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  menuIcon: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuInfo: {
    flex: 1,
    marginRight: 16,
  },
  divider: {
    borderTopWidth: 1,
    marginHorizontal: 16,
  },
});
