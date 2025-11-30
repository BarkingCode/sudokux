/**
 * PointsLeaderboardPreview - Compact leaderboard preview for Board page.
 * Shows top 4 players, user's rank, and total player count.
 */

import React from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { BrutalistText } from './BrutalistText';
import { useTheme } from '../context/ThemeContext';
import type { PointsLeaderboardEntry, UserPointsRank } from '../services/pointService';

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

interface LeaderboardRowProps {
  entry: PointsLeaderboardEntry;
  isCurrentUser?: boolean;
  index: number;
}

const LeaderboardEntryRow: React.FC<LeaderboardRowProps> = ({
  entry,
  isCurrentUser = false,
  index,
}) => {
  const { colors } = useTheme();

  const getRankDisplay = (rank: number): { text: string; emoji: string } => {
    if (rank === 1) return { text: '1ST', emoji: '\u{1F947}' }; // Gold medal
    if (rank === 2) return { text: '2ND', emoji: '\u{1F948}' }; // Silver medal
    if (rank === 3) return { text: '3RD', emoji: '\u{1F949}' }; // Bronze medal
    return { text: `#${rank}`, emoji: '' };
  };

  const rankInfo = getRankDisplay(entry.rank);

  return (
    <Animated.View
      entering={FadeIn.delay(index * 40).duration(200)}
      style={[
        styles.row,
        {
          backgroundColor: isCurrentUser ? colors.highlight : 'transparent',
          borderColor: isCurrentUser ? colors.primary : 'transparent',
          borderWidth: isCurrentUser ? 2 : 0,
        },
      ]}
    >
      {/* Rank */}
      <View style={styles.rankContainer}>
        {rankInfo.emoji ? (
          <BrutalistText size={16}>{rankInfo.emoji}</BrutalistText>
        ) : (
          <BrutalistText size={12} mono bold muted>
            {rankInfo.text}
          </BrutalistText>
        )}
      </View>

      {/* Player Info */}
      <View style={styles.playerInfo}>
        <View style={styles.nameRow}>
          <BrutalistText size={13} bold numberOfLines={1}>
            {entry.nickname}
          </BrutalistText>
          {isCurrentUser && (
            <BrutalistText size={10} color={colors.success}>
              {'\u2B50'} {/* Star emoji */}
            </BrutalistText>
          )}
        </View>
        <BrutalistText size={10} mono muted>
          {getFlagEmoji(entry.country)}
        </BrutalistText>
      </View>

      {/* Points */}
      <BrutalistText size={14} mono bold>
        {formatPoints(entry.points)} pts
      </BrutalistText>
    </Animated.View>
  );
};

interface PointsLeaderboardPreviewProps {
  topEntries: PointsLeaderboardEntry[];
  userEntry: PointsLeaderboardEntry | null;
  userRank: UserPointsRank;
  currentUserId: string | null;
  isLoading?: boolean;
}

export const PointsLeaderboardPreview: React.FC<PointsLeaderboardPreviewProps> = ({
  topEntries,
  userEntry,
  userRank,
  currentUserId,
  isLoading = false,
}) => {
  const { colors } = useTheme();

  // Check if user is in top entries
  const isUserInTop = topEntries.some((entry) => entry.userId === currentUserId);

  if (isLoading) {
    return (
      <View style={[styles.container, { borderColor: colors.primary }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.primary} />
          <BrutalistText size={12} mono muted style={{ marginTop: 8 }}>
            Loading...
          </BrutalistText>
        </View>
      </View>
    );
  }

  if (topEntries.length === 0) {
    return (
      <View style={[styles.container, { borderColor: colors.muted }]}>
        <View style={styles.emptyContainer}>
          <BrutalistText size={24} muted>
            {'\u{1F3C6}'} {/* Trophy emoji */}
          </BrutalistText>
          <BrutalistText size={12} mono muted style={{ marginTop: 8 }}>
            No rankings yet
          </BrutalistText>
          <BrutalistText size={10} mono muted>
            Complete puzzles to earn points!
          </BrutalistText>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { borderColor: colors.primary }]}>
      {/* Top Entries */}
      {topEntries.slice(0, 4).map((entry, index) => (
        <LeaderboardEntryRow
          key={entry.userId}
          entry={entry}
          isCurrentUser={entry.userId === currentUserId}
          index={index}
        />
      ))}

      {/* Divider and User Entry (if not in top) */}
      {!isUserInTop && userEntry && (
        <>
          <View style={[styles.divider, { borderTopColor: colors.muted }]}>
            <BrutalistText size={10} mono muted>
              {'\u2022 \u2022 \u2022'} {/* Dots */}
            </BrutalistText>
          </View>
          <LeaderboardEntryRow
            entry={userEntry}
            isCurrentUser={true}
            index={topEntries.length}
          />
        </>
      )}

      {/* Footer with total players */}
      <View style={[styles.footer, { borderTopColor: colors.highlight }]}>
        <BrutalistText size={10} mono muted center>
          from {formatPoints(userRank.totalPlayers)} players
        </BrutalistText>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderWidth: 3,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  rankContainer: {
    width: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  playerInfo: {
    flex: 1,
    gap: 2,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  divider: {
    borderTopWidth: 1,
    paddingVertical: 6,
    alignItems: 'center',
  },
  footer: {
    borderTopWidth: 1,
    paddingVertical: 8,
    alignItems: 'center',
  },
});
