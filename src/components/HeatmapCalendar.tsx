/**
 * Heatmap Calendar Component
 *
 * GitHub-style contribution heatmap showing play history.
 * Uses React Native Skia for efficient rendering of many small rectangles.
 */

import React, { useMemo } from 'react';
import { View, StyleSheet, ScrollView, Dimensions, Pressable } from 'react-native';
import { Canvas, Rect } from '@shopify/react-native-skia';
import { BrutalistText } from './BrutalistText';
import { useTheme } from '../context/ThemeContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const CELL_SIZE = 12;
const CELL_GAP = 3;
const WEEKS_TO_SHOW = 16; // ~4 months
const DAYS_IN_WEEK = 7;

interface DayData {
  date: string; // YYYY-MM-DD
  count: number;
}

interface HeatmapCalendarProps {
  data: DayData[];
  onDayPress?: (date: string, count: number) => void;
}

// Brutalist grayscale palette
const getHeatmapColor = (count: number, isDark: boolean): string => {
  if (isDark) {
    // Dark mode: darker = less activity
    if (count === 0) return '#1A1A1A';
    if (count <= 1) return '#333333';
    if (count <= 2) return '#555555';
    if (count <= 4) return '#888888';
    return '#FFFFFF';
  } else {
    // Light mode: lighter = less activity
    if (count === 0) return '#E5E5E5';
    if (count <= 1) return '#BBBBBB';
    if (count <= 2) return '#888888';
    if (count <= 4) return '#444444';
    return '#000000';
  }
};

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const HeatmapCalendar: React.FC<HeatmapCalendarProps> = ({ data, onDayPress }) => {
  const { colors, isDark } = useTheme();

  // Organize data into weeks
  const { weeks, monthLabels, totalGames } = useMemo(() => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    // Create date -> count map
    const countMap: Record<string, number> = {};
    data.forEach((d) => {
      countMap[d.date] = d.count;
    });

    // Generate weeks going backwards from today
    const weeks: Array<Array<{ date: string; count: number; dayOfWeek: number }>> = [];
    let total = 0;

    // Start from today and go back
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - (WEEKS_TO_SHOW * 7));

    // Adjust to start on Sunday
    const dayOffset = startDate.getDay();
    startDate.setDate(startDate.getDate() - dayOffset);

    let currentDate = new Date(startDate);
    let currentWeek: Array<{ date: string; count: number; dayOfWeek: number }> = [];

    while (currentDate <= today) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const count = countMap[dateStr] || 0;
      total += count;

      currentWeek.push({
        date: dateStr,
        count,
        dayOfWeek: currentDate.getDay(),
      });

      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    if (currentWeek.length > 0) {
      weeks.push(currentWeek);
    }

    // Generate month labels
    const labels: Array<{ month: string; weekIndex: number }> = [];
    let lastMonth = -1;

    weeks.forEach((week, weekIndex) => {
      if (week.length > 0) {
        const firstDayOfWeek = new Date(week[0].date);
        const month = firstDayOfWeek.getMonth();

        if (month !== lastMonth) {
          labels.push({ month: MONTH_LABELS[month], weekIndex });
          lastMonth = month;
        }
      }
    });

    return { weeks, monthLabels: labels, totalGames: total };
  }, [data]);

  const canvasWidth = weeks.length * (CELL_SIZE + CELL_GAP);
  const canvasHeight = DAYS_IN_WEEK * (CELL_SIZE + CELL_GAP);

  return (
    <View style={[styles.container, { borderColor: colors.primary }]}>
      <View style={[styles.header, { borderBottomColor: colors.primary }]}>
        <BrutalistText size={12} mono uppercase muted>
          Activity
        </BrutalistText>
        <BrutalistText size={12} mono bold>
          {totalGames} games
        </BrutalistText>
      </View>

      {/* Month labels */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View>
          {/* Month row */}
          <View style={[styles.monthRow, { width: canvasWidth + 30 }]}>
            {monthLabels.map((label, index) => (
              <BrutalistText
                key={index}
                size={9}
                mono
                muted
                style={{
                  position: 'absolute',
                  left: 30 + label.weekIndex * (CELL_SIZE + CELL_GAP),
                }}
              >
                {label.month}
              </BrutalistText>
            ))}
          </View>

          {/* Calendar grid */}
          <View style={styles.gridContainer}>
            {/* Day labels */}
            <View style={styles.dayLabels}>
              <BrutalistText size={8} mono muted style={styles.dayLabel}>
                Mon
              </BrutalistText>
              <BrutalistText size={8} mono muted style={styles.dayLabel}>
                Wed
              </BrutalistText>
              <BrutalistText size={8} mono muted style={styles.dayLabel}>
                Fri
              </BrutalistText>
            </View>

            {/* Canvas with cells */}
            <Canvas style={{ width: canvasWidth, height: canvasHeight }}>
              {weeks.map((week, weekIndex) =>
                week.map((day, dayIndex) => (
                  <Rect
                    key={day.date}
                    x={weekIndex * (CELL_SIZE + CELL_GAP)}
                    y={day.dayOfWeek * (CELL_SIZE + CELL_GAP)}
                    width={CELL_SIZE}
                    height={CELL_SIZE}
                    color={getHeatmapColor(day.count, isDark)}
                  />
                ))
              )}
            </Canvas>
          </View>

          {/* Legend */}
          <View style={styles.legend}>
            <BrutalistText size={9} mono muted>
              Less
            </BrutalistText>
            <View style={styles.legendCells}>
              {[0, 1, 2, 4, 5].map((level, index) => (
                <View
                  key={index}
                  style={[
                    styles.legendCell,
                    { backgroundColor: getHeatmapColor(level, isDark) },
                  ]}
                />
              ))}
            </View>
            <BrutalistText size={9} mono muted>
              More
            </BrutalistText>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

/**
 * Generate heatmap data from game sessions
 */
export const generateHeatmapData = (
  sessions: Array<{ completed_at: string; completed: boolean | null }>
): DayData[] => {
  const countMap: Record<string, number> = {};

  sessions.forEach((session) => {
    if (session.completed) {
      const date = session.completed_at.split('T')[0];
      countMap[date] = (countMap[date] || 0) + 1;
    }
  });

  return Object.entries(countMap).map(([date, count]) => ({ date, count }));
};

const styles = StyleSheet.create({
  container: {
    borderWidth: 3,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 2,
  },
  scrollContent: {
    padding: 16,
  },
  monthRow: {
    height: 16,
    marginBottom: 4,
    marginLeft: 30,
  },
  gridContainer: {
    flexDirection: 'row',
  },
  dayLabels: {
    width: 26,
    justifyContent: 'space-between',
    paddingRight: 4,
    height: DAYS_IN_WEEK * (CELL_SIZE + CELL_GAP) - CELL_GAP,
  },
  dayLabel: {
    height: CELL_SIZE,
    lineHeight: CELL_SIZE,
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 12,
    gap: 6,
  },
  legendCells: {
    flexDirection: 'row',
    gap: 2,
  },
  legendCell: {
    width: 10,
    height: 10,
  },
});
