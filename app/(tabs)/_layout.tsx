/**
 * Tab navigation layout.
 * Contains four tabs: Chapters (default), Daily Challenge, Free Run, and Board.
 * Shows notification dot on Daily tab when today's challenge is not completed.
 */

import { Tabs } from 'expo-router';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BookOpen, CalendarHeart, Zap, Award } from 'lucide-react-native';
import { useTheme } from '../../src/context/ThemeContext';
import { useDailyStatus } from '../../src/context/DailyStatusContext';
import { TabBadgeDot } from '../../src/components/TabBadgeDot';

export default function TabLayout() {
  const { colors } = useTheme();
  const { hasCompletedTodayChallenge, isLoading } = useDailyStatus();
  const insets = useSafeAreaInsets();

  // Show dot when NOT completed (and not loading)
  const showDailyDot = !isLoading && !hasCompletedTodayChallenge;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopWidth: 3,
          borderTopColor: colors.primary,
          height: 60 + insets.bottom,
          paddingTop: 8,
          paddingBottom: insets.bottom + 4,
        },
        tabBarActiveTintColor: colors.text,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: {
          fontFamily: 'SpaceMono',
          fontSize: 11,
          fontWeight: '700',
          textTransform: 'uppercase',
          letterSpacing: 1,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Chapters',
          tabBarIcon: ({ color }) => (
            <BookOpen size={22} color={color} strokeWidth={2.5} />
          ),
        }}
      />
      <Tabs.Screen
        name="daily"
        options={{
          title: 'Daily',
          tabBarIcon: ({ color }) => (
            <View>
              <CalendarHeart size={22} color={color} strokeWidth={2.5} />
              <TabBadgeDot visible={showDailyDot} color={colors.mistake} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="freerun"
        options={{
          title: 'Free Run',
          tabBarIcon: ({ color }) => (
            <Zap size={22} color={color} strokeWidth={2.5} />
          ),
        }}
      />
      <Tabs.Screen
        name="board"
        options={{
          title: 'Board',
          tabBarIcon: ({ color }) => (
            <Award size={22} color={color} strokeWidth={2.5} />
          ),
        }}
      />
    </Tabs>
  );
}
