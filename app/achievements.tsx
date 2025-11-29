/**
 * Achievements screen - Displays all achievements with locked/unlocked state.
 * Shows progress toward unlocking achievements organized by category.
 */

import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Pressable, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { BrutalistText } from '../src/components/BrutalistText';
import { AchievementCard } from '../src/components/AchievementCard';
import { useTheme } from '../src/context/ThemeContext';
import { statsService } from '../src/services/statsService';
import { gameCenterService } from '../src/services/gameCenter';
import { loadData, STORAGE_KEYS } from '../src/utils/storage';
import {
  ACHIEVEMENTS,
  CATEGORY_LABELS,
  type AchievementDefinition,
} from '../src/data/achievements';
import type { Achievement } from '../src/lib/database.types';

type CategoryType = AchievementDefinition['category'];

export default function AchievementsScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const [userId, setUserId] = useState<string | null>(null);
  const [unlockedAchievements, setUnlockedAchievements] = useState<Achievement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<CategoryType | 'all'>('all');

  // Load user achievements
  useEffect(() => {
    const loadAchievements = async () => {
      try {
        const userData = await loadData<{ odooUserId: string }>(STORAGE_KEYS.USER_ID);
        const currentUserId = userData?.odooUserId || null;
        setUserId(currentUserId);

        if (currentUserId) {
          const achievements = await statsService.getAchievements(currentUserId);
          setUnlockedAchievements(achievements);
        }
      } catch (error) {
        console.error('Error loading achievements:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadAchievements();
  }, []);

  // Pull-to-refresh handler
  const onRefresh = useCallback(async () => {
    if (!userId) return;

    setIsRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      const achievements = await statsService.getAchievements(userId);
      setUnlockedAchievements(achievements);
    } catch (error) {
      console.error('Error refreshing achievements:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [userId]);

  const isAchievementUnlocked = useCallback(
    (achievementId: string): boolean => {
      return unlockedAchievements.some((a) => a.achievement_id === achievementId);
    },
    [unlockedAchievements]
  );

  const getUnlockedDate = useCallback(
    (achievementId: string): string | undefined => {
      const achievement = unlockedAchievements.find((a) => a.achievement_id === achievementId);
      return achievement?.unlocked_at;
    },
    [unlockedAchievements]
  );

  const handleShowGameCenter = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await gameCenterService.showAchievements();
  }, []);

  const filteredAchievements =
    selectedCategory === 'all'
      ? ACHIEVEMENTS
      : ACHIEVEMENTS.filter((a) => a.category === selectedCategory);

  const unlockedCount = unlockedAchievements.length;
  const totalCount = ACHIEVEMENTS.length;
  const progressPercent = Math.round((unlockedCount / totalCount) * 100);

  const categories: (CategoryType | 'all')[] = ['all', 'milestone', 'skill', 'streak', 'mastery'];

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
            Progress
          </BrutalistText>
          <BrutalistText size={24} bold uppercase letterSpacing={2}>
            ACHIEVEMENTS
          </BrutalistText>
        </View>

        <View style={styles.headerRight}>
          <BrutalistText size={16} mono bold>
            {unlockedCount}/{totalCount}
          </BrutalistText>
        </View>
      </Animated.View>

      {/* Progress Bar */}
      <Animated.View
        entering={FadeInUp.delay(200).springify()}
        style={[styles.progressContainer, { borderColor: colors.primary }]}
      >
        <View style={styles.progressHeader}>
          <BrutalistText size={12} mono uppercase muted>
            Overall Progress
          </BrutalistText>
          <BrutalistText size={14} mono bold>
            {progressPercent}%
          </BrutalistText>
        </View>
        <View style={[styles.progressBar, { backgroundColor: colors.highlight }]}>
          <View
            style={[
              styles.progressFill,
              {
                backgroundColor: colors.primary,
                width: `${progressPercent}%`,
              },
            ]}
          />
        </View>
      </Animated.View>

      {/* Category Filters */}
      <Animated.View entering={FadeInUp.delay(250).springify()}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryScroll}
          contentContainerStyle={styles.categoryScrollContent}
        >
          {categories.map((category) => (
            <Pressable
              key={category}
              onPress={() => {
                Haptics.selectionAsync();
                setSelectedCategory(category);
              }}
              style={[
                styles.categoryChip,
                {
                  borderColor: selectedCategory === category ? colors.primary : colors.muted,
                  backgroundColor: selectedCategory === category ? colors.primary : 'transparent',
                },
              ]}
            >
              <BrutalistText
                size={12}
                mono
                bold
                uppercase
                color={selectedCategory === category ? colors.background : colors.text}
              >
                {category === 'all' ? 'All' : CATEGORY_LABELS[category]}
              </BrutalistText>
            </Pressable>
          ))}
        </ScrollView>
      </Animated.View>

      {/* Achievements List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <BrutalistText size={14} mono muted style={{ marginTop: 16 }}>
            Loading achievements...
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
              onRefresh={onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
        >
          {filteredAchievements.map((achievement, index) => (
            <AchievementCard
              key={achievement.id}
              achievement={achievement}
              isUnlocked={isAchievementUnlocked(achievement.id)}
              unlockedAt={getUnlockedDate(achievement.id)}
              index={index}
            />
          ))}

          {/* Game Center Button */}
          {gameCenterService.isGameCenterAvailable() && (
            <Pressable
              onPress={handleShowGameCenter}
              style={[styles.gameCenterButton, { borderColor: colors.muted }]}
            >
              <BrutalistText size={14} mono muted>
                View in Game Center
              </BrutalistText>
            </Pressable>
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
    width: 60,
    alignItems: 'flex-end',
  },
  progressContainer: {
    marginHorizontal: 20,
    marginBottom: 16,
    borderWidth: 3,
    padding: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  progressBar: {
    height: 12,
    borderRadius: 0,
  },
  progressFill: {
    height: '100%',
  },
  categoryScroll: {
    maxHeight: 50,
    marginBottom: 16,
  },
  categoryScrollContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  categoryChip: {
    borderWidth: 2,
    paddingVertical: 8,
    paddingHorizontal: 16,
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
  gameCenterButton: {
    borderWidth: 2,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
});
