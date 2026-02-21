import React from 'react';
import { render } from '@testing-library/react-native';
import { StreakDisplay } from '../../src/components/StreakDisplay';

jest.mock('../../src/context/ThemeContext', () => ({
  useTheme: () => ({
    colors: {
      background: '#FAFAFA',
      text: '#0A0A0A',
      primary: '#0A0A0A',
      muted: '#757575',
      accent: '#1565C0',
      success: '#43A047',
      highlight: '#F0F0F0',
    },
  }),
}));

describe('StreakDisplay', () => {
  it('renders current and best streak', () => {
    const { getByText } = render(
      <StreakDisplay currentStreak={5} bestStreak={10} />
    );
    expect(getByText('5')).toBeTruthy();
    expect(getByText('10')).toBeTruthy();
  });

  it('shows "day" for streak of 1', () => {
    const { getAllByText } = render(
      <StreakDisplay currentStreak={1} bestStreak={1} />
    );
    expect(getAllByText('day').length).toBe(2);
  });

  it('shows "days" for streak > 1', () => {
    const { getAllByText } = render(
      <StreakDisplay currentStreak={5} bestStreak={10} />
    );
    expect(getAllByText('days').length).toBe(2);
  });

  it('shows streak level label for 7+ streak', () => {
    const { getByText } = render(
      <StreakDisplay currentStreak={7} bestStreak={7} />
    );
    expect(getByText('HOT STREAK')).toBeTruthy();
  });

  it('shows ON FIRE for 30+ streak', () => {
    const { getByText } = render(
      <StreakDisplay currentStreak={30} bestStreak={30} />
    );
    expect(getByText('ON FIRE')).toBeTruthy();
  });

  it('shows LEGENDARY for 100+ streak', () => {
    const { getByText } = render(
      <StreakDisplay currentStreak={100} bestStreak={100} />
    );
    expect(getByText('LEGENDARY')).toBeTruthy();
  });

  it('shows PERSONAL BEST when current equals best', () => {
    const { getByText } = render(
      <StreakDisplay currentStreak={5} bestStreak={5} />
    );
    expect(getByText('PERSONAL BEST')).toBeTruthy();
  });

  it('shows milestone progress when showMilestones is true', () => {
    const { getByText } = render(
      <StreakDisplay currentStreak={3} bestStreak={5} showMilestones />
    );
    expect(getByText('NEXT MILESTONE')).toBeTruthy();
    expect(getByText('3/7 days')).toBeTruthy();
  });

  it('hides milestones when showMilestones is false', () => {
    const { queryByText } = render(
      <StreakDisplay currentStreak={3} bestStreak={5} showMilestones={false} />
    );
    expect(queryByText('NEXT MILESTONE')).toBeNull();
  });

  it('renders 0 streak without crashing', () => {
    const { getAllByText } = render(
      <StreakDisplay currentStreak={0} bestStreak={0} />
    );
    expect(getAllByText('0').length).toBe(2);
  });
});
