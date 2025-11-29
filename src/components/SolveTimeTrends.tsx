/**
 * Solve Time Trends Component
 *
 * Shows improvement trends in solve times with personal bests and
 * comparison between recent average and starting average.
 */

import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { BrutalistText } from './BrutalistText';
import { useTheme } from '../context/ThemeContext';

interface DifficultyStats {
  difficulty: string;
  bestTime: number;
  bestTimeDate: string;
  averageTime: number;
  recentAverage: number; // Last 7 games
  startingAverage: number; // First 10 games
  totalGames: number;
}

interface SolveTimeTrendsProps {
  stats: DifficultyStats[];
}

const formatTime = (seconds: number): string => {
  if (!seconds || seconds === Infinity) return '--:--';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const formatDate = (dateString: string): string => {
  if (!dateString) return '--';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const calculateImprovement = (starting: number, recent: number): number => {
  if (!starting || !recent || starting === 0) return 0;
  return Math.round(((starting - recent) / starting) * 100);
};

const DIFFICULTY_LABELS: Record<string, string> = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
  extreme: 'Extreme',
  insane: 'Insane',
  inhuman: 'Inhuman',
};

export const SolveTimeTrends: React.FC<SolveTimeTrendsProps> = ({ stats }) => {
  const { colors } = useTheme();

  const validStats = useMemo(() => {
    return stats.filter((s) => s.totalGames >= 1);
  }, [stats]);

  if (validStats.length === 0) {
    return null;
  }

  return (
    <View style={[styles.container, { borderColor: colors.primary }]}>
      <View style={[styles.header, { borderBottomColor: colors.primary }]}>
        <BrutalistText size={12} mono uppercase muted>
          Time Trends
        </BrutalistText>
      </View>

      {validStats.map((stat, index) => {
        const improvement = calculateImprovement(stat.startingAverage, stat.recentAverage);
        const hasImprovement = stat.totalGames >= 10 && improvement !== 0;

        return (
          <View
            key={stat.difficulty}
            style={[
              styles.difficultyRow,
              index > 0 && { borderTopWidth: 1, borderTopColor: colors.highlight },
            ]}
          >
            {/* Difficulty Label */}
            <View style={styles.difficultyLabel}>
              <BrutalistText size={14} bold>
                {DIFFICULTY_LABELS[stat.difficulty] || stat.difficulty}
              </BrutalistText>
              <BrutalistText size={10} mono muted>
                {stat.totalGames} game{stat.totalGames !== 1 ? 's' : ''}
              </BrutalistText>
            </View>

            {/* Best Time */}
            <View style={styles.bestTime}>
              <BrutalistText size={10} mono muted>
                Best
              </BrutalistText>
              <BrutalistText size={16} mono bold>
                {formatTime(stat.bestTime)}
              </BrutalistText>
              <BrutalistText size={8} mono muted>
                {formatDate(stat.bestTimeDate)}
              </BrutalistText>
            </View>

            {/* Improvement Badge */}
            <View style={styles.improvementContainer}>
              {hasImprovement ? (
                <View
                  style={[
                    styles.improvementBadge,
                    {
                      backgroundColor: improvement > 0 ? colors.success : colors.mistake,
                    },
                  ]}
                >
                  <BrutalistText size={12} mono bold color={colors.background}>
                    {improvement > 0 ? '\u2193' : '\u2191'} {Math.abs(improvement)}%
                  </BrutalistText>
                </View>
              ) : stat.totalGames < 10 ? (
                <BrutalistText size={10} mono muted>
                  Need 10 games
                </BrutalistText>
              ) : (
                <BrutalistText size={10} mono muted>
                  --
                </BrutalistText>
              )}
            </View>
          </View>
        );
      })}

      {/* Legend */}
      <View style={[styles.legend, { borderTopColor: colors.muted }]}>
        <BrutalistText size={9} mono muted>
          Improvement = comparing first 10 games to last 7 games
        </BrutalistText>
      </View>
    </View>
  );
};

/**
 * Calculate solve time trends from game sessions
 */
export const calculateSolveTimeTrends = (
  sessions: Array<{
    difficulty: string;
    time_seconds: number;
    completed: boolean | null;
    completed_at: string;
  }>
): DifficultyStats[] => {
  const difficulties = ['easy', 'medium', 'hard', 'extreme', 'insane', 'inhuman'];

  return difficulties.map((difficulty) => {
    const games = sessions
      .filter((s) => s.difficulty === difficulty && s.completed)
      .sort((a, b) => new Date(a.completed_at).getTime() - new Date(b.completed_at).getTime());

    if (games.length === 0) {
      return {
        difficulty,
        bestTime: 0,
        bestTimeDate: '',
        averageTime: 0,
        recentAverage: 0,
        startingAverage: 0,
        totalGames: 0,
      };
    }

    // Find best time
    let bestTime = Infinity;
    let bestTimeDate = '';
    games.forEach((g) => {
      if (g.time_seconds < bestTime) {
        bestTime = g.time_seconds;
        bestTimeDate = g.completed_at;
      }
    });

    // Calculate averages
    const times = games.map((g) => g.time_seconds);
    const average = times.reduce((a, b) => a + b, 0) / times.length;

    // First 10 games average
    const startingGames = times.slice(0, 10);
    const startingAverage = startingGames.length > 0
      ? startingGames.reduce((a, b) => a + b, 0) / startingGames.length
      : 0;

    // Last 7 games average
    const recentGames = times.slice(-7);
    const recentAverage = recentGames.length > 0
      ? recentGames.reduce((a, b) => a + b, 0) / recentGames.length
      : 0;

    return {
      difficulty,
      bestTime: bestTime === Infinity ? 0 : bestTime,
      bestTimeDate,
      averageTime: average,
      recentAverage,
      startingAverage,
      totalGames: games.length,
    };
  });
};

const styles = StyleSheet.create({
  container: {
    borderWidth: 3,
    marginBottom: 16,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 2,
  },
  difficultyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  difficultyLabel: {
    flex: 1,
    gap: 2,
  },
  bestTime: {
    alignItems: 'center',
    marginRight: 16,
  },
  improvementContainer: {
    width: 70,
    alignItems: 'flex-end',
  },
  improvementBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  legend: {
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
});
