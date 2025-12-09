/**
 * DailyCalendar Component
 *
 * Month-based calendar view showing daily challenge completion history.
 * Completed days are highlighted, missed days (gaps) are shown differently.
 * Uses brutalist design: thick borders, sharp edges, no rounded corners.
 */

import React, { useState, useMemo } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { BrutalistText } from './BrutalistText';
import { useTheme } from '../context/ThemeContext';

interface CompletionData {
  date: string;
  timeSeconds: number;
  mistakes: number;
}

interface DailyCalendarProps {
  completions: CompletionData[];
  onDayPress?: (date: string, data: CompletionData | null) => void;
}

const DAYS_OF_WEEK = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export const DailyCalendar: React.FC<DailyCalendarProps> = ({ completions, onDayPress }) => {
  const { colors } = useTheme();
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Create lookup map for completions
  const completionMap = useMemo(() => {
    const map = new Map<string, CompletionData>();
    completions.forEach((c) => map.set(c.date, c));
    return map;
  }, [completions]);

  // Get calendar data for current month
  const calendarData = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDayOfWeek = firstDay.getDay();
    const daysInMonth = lastDay.getDate();

    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    const weeks: Array<
      Array<{
        day: number | null;
        date: string | null;
        isCompleted: boolean;
        isToday: boolean;
        isFuture: boolean;
      }>
    > = [];

    let currentWeek: (typeof weeks)[0] = [];

    // Fill empty cells before first day
    for (let i = 0; i < startDayOfWeek; i++) {
      currentWeek.push({
        day: null,
        date: null,
        isCompleted: false,
        isToday: false,
        isFuture: false,
      });
    }

    // Fill days
    for (let day = 1; day <= daysInMonth; day++) {
      const dateObj = new Date(year, month, day);
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const isToday = dateStr === todayStr;
      const isFuture = dateObj > today;
      const isCompleted = completionMap.has(dateStr);

      currentWeek.push({
        day,
        date: dateStr,
        isCompleted,
        isToday,
        isFuture,
      });

      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    }

    // Fill remaining cells in last week
    while (currentWeek.length > 0 && currentWeek.length < 7) {
      currentWeek.push({
        day: null,
        date: null,
        isCompleted: false,
        isToday: false,
        isFuture: false,
      });
    }
    if (currentWeek.length > 0) {
      weeks.push(currentWeek);
    }

    return { weeks, monthLabel: `${MONTHS[month]} ${year}` };
  }, [currentMonth, completionMap]);

  // Count completions in current month
  const monthCompletions = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    let count = 0;

    completions.forEach((c) => {
      const [y, m] = c.date.split('-').map(Number);
      if (y === year && m === month + 1) {
        count++;
      }
    });

    return count;
  }, [currentMonth, completions]);

  const navigateMonth = (direction: -1 | 1) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCurrentMonth((prev) => {
      const next = new Date(prev);
      next.setMonth(next.getMonth() + direction);
      return next;
    });
  };

  const handleDayPress = (date: string | null) => {
    if (!date || !onDayPress) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onDayPress(date, completionMap.get(date) || null);
  };

  // Get cell colors based on state
  const getCellStyle = (cell: (typeof calendarData.weeks)[0][0]) => {
    if (cell.day === null) {
      return { bg: 'transparent', text: colors.muted };
    }
    if (cell.isFuture) {
      return { bg: colors.highlight, text: colors.muted };
    }
    if (cell.isCompleted) {
      return { bg: colors.success, text: colors.background };
    }
    if (cell.isToday) {
      return { bg: colors.primary, text: colors.background };
    }
    // Past non-completed day
    return { bg: colors.highlight, text: colors.muted };
  };

  return (
    <View style={[styles.container, { borderColor: colors.primary }]}>
      {/* Header with navigation */}
      <View style={[styles.header, { borderBottomColor: colors.primary }]}>
        <Pressable
          onPress={() => navigateMonth(-1)}
          style={[styles.navButton, { borderColor: colors.primary }]}
        >
          <ChevronLeft size={20} color={colors.text} strokeWidth={3} />
        </Pressable>

        <View style={styles.headerCenter}>
          <BrutalistText size={14} bold uppercase>
            {calendarData.monthLabel}
          </BrutalistText>
          <BrutalistText size={10} mono muted>
            {monthCompletions} completed
          </BrutalistText>
        </View>

        <Pressable
          onPress={() => navigateMonth(1)}
          style={[styles.navButton, { borderColor: colors.primary }]}
        >
          <ChevronRight size={20} color={colors.text} strokeWidth={3} />
        </Pressable>
      </View>

      {/* Day of week labels */}
      <View style={styles.weekLabels}>
        {DAYS_OF_WEEK.map((day, index) => (
          <View key={index} style={styles.dayLabelCell}>
            <BrutalistText size={10} mono muted uppercase>
              {day}
            </BrutalistText>
          </View>
        ))}
      </View>

      {/* Calendar grid */}
      <View style={styles.grid}>
        {calendarData.weeks.map((week, weekIndex) => (
          <View key={weekIndex} style={styles.week}>
            {week.map((cell, dayIndex) => {
              const cellStyle = getCellStyle(cell);
              return (
                <Pressable
                  key={dayIndex}
                  onPress={() => handleDayPress(cell.date)}
                  disabled={cell.day === null || cell.isFuture}
                  style={[
                    styles.dayCell,
                    { backgroundColor: cellStyle.bg },
                    cell.isToday && { borderWidth: 3, borderColor: colors.primary },
                  ]}
                >
                  {cell.day !== null && (
                    <BrutalistText
                      size={14}
                      bold={cell.isCompleted || cell.isToday}
                      color={cellStyle.text}
                    >
                      {cell.day}
                    </BrutalistText>
                  )}
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>

      {/* Legend */}
      <View style={[styles.legend, { borderTopColor: colors.primary }]}>
        <View style={styles.legendItem}>
          <View style={[styles.legendBox, { backgroundColor: colors.success }]} />
          <BrutalistText size={9} mono muted>
            Completed
          </BrutalistText>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendBox, { backgroundColor: colors.highlight }]} />
          <BrutalistText size={9} mono muted>
            Missed
          </BrutalistText>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendBox, { backgroundColor: colors.primary }]} />
          <BrutalistText size={9} mono muted>
            Today
          </BrutalistText>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderWidth: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 2,
  },
  headerCenter: {
    alignItems: 'center',
  },
  navButton: {
    width: 36,
    height: 36,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekLabels: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingTop: 12,
    paddingBottom: 8,
  },
  dayLabelCell: {
    flex: 1,
    alignItems: 'center',
  },
  grid: {
    paddingHorizontal: 8,
    paddingBottom: 12,
  },
  week: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  dayCell: {
    flex: 1,
    aspectRatio: 1,
    marginHorizontal: 2,
    alignItems: 'center',
    justifyContent: 'center',
    maxHeight: 40,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    paddingVertical: 12,
    borderTopWidth: 2,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendBox: {
    width: 12,
    height: 12,
  },
});
