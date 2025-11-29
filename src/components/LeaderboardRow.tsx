/**
 * Leaderboard row component displaying a single leaderboard entry.
 * Shows rank, player name, country flag, and best time with brutalist styling.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { BrutalistText } from './BrutalistText';
import { useTheme } from '../context/ThemeContext';
import type { LeaderboardEntry } from '../services/leaderboardService';

// Country code to flag emoji
const getFlagEmoji = (countryCode: string | null): string => {
  if (!countryCode || countryCode.length !== 2) return '🌍';
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
};

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

interface LeaderboardRowProps {
  entry: LeaderboardEntry;
  isCurrentUser?: boolean;
  index?: number;
}

export const LeaderboardRow: React.FC<LeaderboardRowProps> = ({
  entry,
  isCurrentUser = false,
  index = 0,
}) => {
  const { colors } = useTheme();

  const getRankDisplay = (rank: number): { text: string; style: object } => {
    if (rank === 1) return { text: '1ST', style: { backgroundColor: colors.primary } };
    if (rank === 2) return { text: '2ND', style: { backgroundColor: colors.text, opacity: 0.8 } };
    if (rank === 3) return { text: '3RD', style: { backgroundColor: colors.text, opacity: 0.6 } };
    return { text: `#${rank}`, style: { backgroundColor: colors.muted } };
  };

  const rankInfo = getRankDisplay(entry.rank);

  return (
    <Animated.View
      entering={FadeIn.delay(index * 30).duration(200)}
      style={[
        styles.container,
        {
          borderColor: isCurrentUser ? colors.primary : colors.muted,
          backgroundColor: isCurrentUser ? colors.highlight : 'transparent',
        },
      ]}
    >
      {/* Rank Badge */}
      <View style={[styles.rankBadge, rankInfo.style]}>
        <BrutalistText size={10} mono bold color={colors.background}>
          {rankInfo.text}
        </BrutalistText>
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

      {/* Time */}
      <View style={styles.timeContainer}>
        <BrutalistText size={16} mono bold>
          {formatTime(entry.bestTime)}
        </BrutalistText>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    padding: 12,
    marginBottom: 8,
  },
  rankBadge: {
    width: 40,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
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
  timeContainer: {
    marginLeft: 12,
  },
});
