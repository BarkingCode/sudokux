/**
 * Leaderboards screen - Displays global and country rankings.
 * Shows best times for each difficulty level with filtering options.
 */

import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Pressable, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { BrutalistText } from '../src/components/BrutalistText';
import { LeaderboardRow } from '../src/components/LeaderboardRow';
import { useTheme } from '../src/context/ThemeContext';
import { leaderboardService, type LeaderboardEntry } from '../src/services/leaderboardService';
import { gameCenterService } from '../src/services/gameCenter';
import { loadData, STORAGE_KEYS } from '../src/utils/storage';
import type { Difficulty } from '../src/lib/database.types';

type ViewMode = 'global' | 'country';

// Only difficulties that have leaderboard views in the database
const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard'];

const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
};

export default function LeaderboardsScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const [userId, setUserId] = useState<string | null>(null);
  const [userCountry, setUserCountry] = useState<string | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>('easy');
  const [viewMode, setViewMode] = useState<ViewMode>('global');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [userEntry, setUserEntry] = useState<LeaderboardEntry | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Load user data
  useEffect(() => {
    const loadUserData = async () => {
      const userData = await loadData<{ odooUserId: string; country?: string }>(STORAGE_KEYS.USER_ID);
      setUserId(userData?.odooUserId || null);
      setUserCountry(userData?.country || null);
    };
    loadUserData();
  }, []);

  // Fetch leaderboard data
  const fetchLeaderboard = useCallback(async (refresh = false) => {
    if (refresh) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const countryFilter = viewMode === 'country' ? userCountry : undefined;

      const data = await leaderboardService.getLeaderboard({
        difficulty: selectedDifficulty,
        country: countryFilter ?? undefined,
        limit: 50,
      });

      setEntries(data);

      // Get user's position if they're not in top 50
      if (userId) {
        const userContext = await leaderboardService.getUserContext(userId, selectedDifficulty);
        setUserEntry(userContext.userEntry);
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [selectedDifficulty, viewMode, userId, userCountry]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  const handleDifficultyChange = useCallback((difficulty: Difficulty) => {
    Haptics.selectionAsync();
    setSelectedDifficulty(difficulty);
  }, []);

  const handleViewModeChange = useCallback((mode: ViewMode) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setViewMode(mode);
  }, []);

  const handleShowGameCenter = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await gameCenterService.showLeaderboard(selectedDifficulty);
  }, [selectedDifficulty]);

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
            🌍 Global
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
            🏠 Country
          </BrutalistText>
        </Pressable>
      </Animated.View>

      {/* Difficulty Selector */}
      <Animated.View entering={FadeInUp.delay(200).springify()}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.difficultyScroll}
          contentContainerStyle={styles.difficultyScrollContent}
        >
          {DIFFICULTIES.map((difficulty) => (
            <Pressable
              key={difficulty}
              onPress={() => handleDifficultyChange(difficulty)}
              style={[
                styles.difficultyChip,
                {
                  borderColor: selectedDifficulty === difficulty ? colors.primary : colors.muted,
                  backgroundColor: selectedDifficulty === difficulty ? colors.primary : 'transparent',
                },
              ]}
            >
              <BrutalistText
                size={11}
                mono
                bold
                uppercase
                color={selectedDifficulty === difficulty ? colors.background : colors.text}
              >
                {DIFFICULTY_LABELS[difficulty]}
              </BrutalistText>
            </Pressable>
          ))}
        </ScrollView>
      </Animated.View>

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
                —
              </BrutalistText>
              <BrutalistText size={14} mono muted style={{ marginTop: 12 }}>
                No rankings yet
              </BrutalistText>
              <BrutalistText size={12} mono muted style={{ marginTop: 4 }}>
                Be the first to complete a {DIFFICULTY_LABELS[selectedDifficulty]} puzzle!
              </BrutalistText>
            </View>
          ) : (
            <>
              {entries.map((entry, index) => (
                <LeaderboardRow
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
                  <LeaderboardRow entry={userEntry} isCurrentUser index={0} />
                </View>
              )}

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
    marginBottom: 12,
    gap: 12,
  },
  viewModeButton: {
    flex: 1,
    borderWidth: 2,
    paddingVertical: 10,
    alignItems: 'center',
  },
  difficultyScroll: {
    maxHeight: 45,
    marginBottom: 16,
  },
  difficultyScrollContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  difficultyChip: {
    borderWidth: 2,
    paddingVertical: 8,
    paddingHorizontal: 14,
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
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
  gameCenterButton: {
    borderWidth: 2,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
  },
});
