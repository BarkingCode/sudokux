import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { DailyCompletionModal } from '../../src/components/DailyCompletionModal';

jest.mock('../../src/context/ThemeContext', () => ({
  useTheme: () => ({
    colors: {
      background: '#FAFAFA',
      text: '#0A0A0A',
      primary: '#0A0A0A',
      muted: '#757575',
      success: '#43A047',
      mistake: '#E53935',
      accent: '#1565C0',
      highlight: '#F0F0F0',
    },
  }),
}));

jest.mock('../../src/services/dailyChallengeService', () => ({
  submitDailyCompletion: jest.fn(() => Promise.resolve({ success: true })),
}));

jest.mock('../../src/services/dailyLeaderboardService', () => ({
  getDailyLeaderboard: jest.fn(() => Promise.resolve([])),
  getUserDailyRank: jest.fn(() => Promise.resolve(null)),
}));

jest.mock('../../src/services/badgeService', () => ({
  badgeService: { onDailyCompleted: jest.fn(() => Promise.resolve()) },
}));

jest.mock('../../src/services/achievementService', () => ({
  checkAchievements: jest.fn(() => Promise.resolve()),
}));

jest.mock('../../src/services/facebookAnalytics', () => ({
  logDailyChallengeCompleted: jest.fn(),
  logGameCompleted: jest.fn(),
}));

jest.mock('../../src/services/storeReviewService', () => ({
  maybeRequestReview: jest.fn(),
}));

jest.mock('lucide-react-native', () => ({
  Trophy: 'Trophy',
}));

const defaultProps = {
  visible: true,
  onClose: jest.fn(),
  challenge: { id: 'test', date: '2026-02-21', puzzle: '', solution: '' } as any,
  userId: 'user-123',
  difficulty: 'medium' as any,
  timeSeconds: 180,
  mistakes: 1,
  helperUsed: 0,
};

describe('DailyCompletionModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders header text when visible', async () => {
    const { getByText } = render(<DailyCompletionModal {...defaultProps} />);
    await waitFor(() => {
      expect(getByText('FINISHED!')).toBeTruthy();
    });
  });

  it('displays formatted time', async () => {
    const { getByText } = render(<DailyCompletionModal {...defaultProps} />);
    await waitFor(() => {
      expect(getByText('03:00')).toBeTruthy();
    });
  });

  it('shows DONE button', () => {
    const { getByText } = render(<DailyCompletionModal {...defaultProps} />);
    expect(getByText('DONE')).toBeTruthy();
  });

  it('shows Perfect! for 0 mistakes', async () => {
    const { getByText } = render(
      <DailyCompletionModal {...defaultProps} mistakes={0} />
    );
    await waitFor(() => {
      expect(getByText('Perfect!')).toBeTruthy();
    });
  });

  it('shows Great job! for 1-2 mistakes', async () => {
    const { getByText } = render(
      <DailyCompletionModal {...defaultProps} mistakes={2} />
    );
    await waitFor(() => {
      expect(getByText('Great job!')).toBeTruthy();
    });
  });

  it('does not render when not visible', () => {
    const { queryByText } = render(
      <DailyCompletionModal {...defaultProps} visible={false} />
    );
    expect(queryByText('FINISHED!')).toBeNull();
  });
});
