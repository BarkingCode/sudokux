/**
 * View-only stats display for completed puzzles.
 * Shows time, rank, and mistakes with a back button.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { BrutalistText } from '../BrutalistText';
import { BrutalistButton } from '../BrutalistButton';
import { useTheme } from '../../context/ThemeContext';

interface ViewOnlyStatsProps {
  completionTime: number;
  completionMistakes: number;
  completionRank: number | null;
  isDaily: boolean;
  isChapter: boolean;
  onBack: () => void;
}

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export const ViewOnlyStats: React.FC<ViewOnlyStatsProps> = ({
  completionTime,
  completionMistakes,
  completionRank,
  isDaily,
  isChapter,
  onBack,
}) => {
  const { colors } = useTheme();

  const getBackButtonTitle = (): string => {
    if (isDaily) return 'BACK TO DAILY';
    if (isChapter) return 'BACK TO CHAPTERS';
    return 'BACK';
  };

  return (
    <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.container}>
      <View style={[styles.statsRow, { borderColor: colors.muted }]}>
        <View style={styles.stat}>
          <BrutalistText size={11} mono uppercase muted>
            Time
          </BrutalistText>
          <BrutalistText size={24} bold mono>
            {formatTime(completionTime)}
          </BrutalistText>
        </View>

        {completionRank && (
          <View style={styles.stat}>
            <BrutalistText size={11} mono uppercase muted>
              Rank
            </BrutalistText>
            <BrutalistText size={24} bold>
              #{completionRank}
            </BrutalistText>
          </View>
        )}

        <View style={styles.stat}>
          <BrutalistText size={11} mono uppercase muted>
            Mistakes
          </BrutalistText>
          <BrutalistText size={24} bold>
            {completionMistakes}
          </BrutalistText>
        </View>
      </View>

      <BrutalistButton
        title={getBackButtonTitle()}
        onPress={onBack}
        variant="primary"
        size="large"
        style={styles.backButton}
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 20,
    borderWidth: 2,
  },
  stat: {
    alignItems: 'center',
  },
  backButton: {
    marginTop: 24,
    marginHorizontal: 0,
  },
});
