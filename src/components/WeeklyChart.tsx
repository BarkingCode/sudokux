/**
 * Weekly Chart Component
 *
 * Brutalist-style bar chart showing games played per day for the current week.
 * Uses React Native Skia for sharp, high-contrast rendering.
 */

import React, { useMemo } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Canvas, Rect, Text, matchFont, Line } from '@shopify/react-native-skia';
import { Platform } from 'react-native';
import { BrutalistText } from './BrutalistText';
import { useTheme } from '../context/ThemeContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_HEIGHT = 140;
const CHART_PADDING = 20;
const BAR_GAP = 8;

interface DayData {
  day: string; // Mon, Tue, etc.
  count: number;
  isToday?: boolean;
}

interface WeeklyChartProps {
  data: DayData[];
  title?: string;
}

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// Create a system font style
const fontFamily = Platform.select({ ios: 'Menlo', default: 'monospace' });
const fontStyle = {
  fontFamily,
  fontSize: 10,
  fontWeight: '400' as const,
};

export const WeeklyChart: React.FC<WeeklyChartProps> = ({
  data,
  title = 'This Week',
}) => {
  const { colors } = useTheme();
  const font = matchFont(fontStyle);

  const maxValue = useMemo(() => {
    const max = Math.max(...data.map((d) => d.count), 1);
    return max;
  }, [data]);

  const chartWidth = SCREEN_WIDTH - 40 - CHART_PADDING * 2;
  const barWidth = (chartWidth - BAR_GAP * 6) / 7;
  const chartContentHeight = CHART_HEIGHT - 40; // Leave room for labels

  return (
    <View style={[styles.container, { borderColor: colors.primary }]}>
      <View style={styles.header}>
        <BrutalistText size={12} mono uppercase muted>
          {title}
        </BrutalistText>
        <BrutalistText size={12} mono bold>
          {data.reduce((sum, d) => sum + d.count, 0)} games
        </BrutalistText>
      </View>

      <Canvas style={[styles.canvas, { height: CHART_HEIGHT }]}>
        {/* Baseline */}
        <Line
          p1={{ x: CHART_PADDING, y: chartContentHeight }}
          p2={{ x: chartWidth + CHART_PADDING, y: chartContentHeight }}
          color={colors.muted}
          strokeWidth={2}
        />

        {/* Bars and labels */}
        {data.map((item, index) => {
          const x = CHART_PADDING + index * (barWidth + BAR_GAP);
          const barHeight = item.count > 0
            ? (item.count / maxValue) * (chartContentHeight - 20)
            : 0;
          const y = chartContentHeight - barHeight;

          return (
            <React.Fragment key={item.day}>
              {/* Bar */}
              {item.count > 0 && (
                <Rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  color={item.isToday ? colors.primary : colors.text}
                />
              )}

              {/* Day label */}
              <Text
                x={x + barWidth / 2 - 8}
                y={CHART_HEIGHT - 8}
                text={item.day}
                font={font}
                color={item.isToday ? colors.primary : colors.muted}
              />

              {/* Value label (if > 0) */}
              {item.count > 0 && (
                <Text
                  x={x + barWidth / 2 - (item.count >= 10 ? 6 : 3)}
                  y={y - 6}
                  text={String(item.count)}
                  font={font}
                  color={colors.text}
                />
              )}
            </React.Fragment>
          );
        })}
      </Canvas>
    </View>
  );
};

/**
 * Generate weekly data from game sessions
 */
export const generateWeeklyData = (
  sessions: Array<{ completed_at: string; completed: boolean | null }>
): DayData[] => {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 = Sunday
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

  const monday = new Date(today);
  monday.setDate(today.getDate() + mondayOffset);
  monday.setHours(0, 0, 0, 0);

  const weekData: DayData[] = DAY_LABELS.map((day, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    date.setHours(23, 59, 59, 999);

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const count = sessions.filter((s) => {
      if (!s.completed) return false;
      const sessionDate = new Date(s.completed_at);
      return sessionDate >= startOfDay && sessionDate <= date;
    }).length;

    const isToday =
      date.toDateString() === today.toDateString() ||
      (index === DAY_LABELS.length - 1 &&
        today > date &&
        today.getDate() - date.getDate() === 0);

    return {
      day,
      count,
      isToday: new Date().toDateString() === startOfDay.toDateString(),
    };
  });

  return weekData;
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
    borderBottomColor: 'inherit',
  },
  canvas: {
    width: '100%',
  },
});
