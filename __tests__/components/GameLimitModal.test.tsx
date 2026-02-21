/**
 * Tests for GameLimitModal component.
 * Verifies free run game limit flow and ad interaction.
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { GameLimitModal } from '../../src/components/GameLimitModal';

const mockShowRewardedAd = jest.fn(() => Promise.resolve(true));
const mockAdsContext = {
  showRewardedAd: mockShowRewardedAd,
  isRewardedAdReady: true,
  isLoadingAd: false,
  freeRunGamesRemaining: 0,
};

jest.mock('../../src/context/AdContext', () => ({
  useAds: () => mockAdsContext,
}));

jest.mock('../../src/context/ThemeContext', () => ({
  useTheme: () => ({
    colors: {
      background: '#fff',
      primary: '#000',
      text: '#000',
      success: '#4CAF50',
      muted: '#999',
    },
  }),
}));

jest.mock('../../src/utils/logger', () => ({
  createScopedLogger: () => ({
    debug: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
  }),
}));

const defaultProps = {
  visible: true,
  onClose: jest.fn(),
  onUnlocked: jest.fn(),
};

describe('GameLimitModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAdsContext.isRewardedAdReady = true;
    mockAdsContext.isLoadingAd = false;
    mockAdsContext.freeRunGamesRemaining = 0;
    mockShowRewardedAd.mockResolvedValue(true);
  });

  it('renders OUT OF GAMES header', () => {
    const { getByText } = render(<GameLimitModal {...defaultProps} />);
    expect(getByText('OUT OF GAMES')).toBeTruthy();
  });

  it('shows games remaining as 0', () => {
    const { getByText } = render(<GameLimitModal {...defaultProps} />);
    expect(getByText('0')).toBeTruthy();
  });

  it('calls showRewardedAd when watch ad button is pressed', async () => {
    const { getByText } = render(<GameLimitModal {...defaultProps} />);
    fireEvent.press(getByText('WATCH AD'));
    await waitFor(() => {
      expect(mockShowRewardedAd).toHaveBeenCalledTimes(1);
    });
  });

  it('calls onClose and onUnlocked after successful ad', async () => {
    const onClose = jest.fn();
    const onUnlocked = jest.fn();
    const { getByText } = render(
      <GameLimitModal {...defaultProps} onClose={onClose} onUnlocked={onUnlocked} />
    );
    fireEvent.press(getByText('WATCH AD'));
    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
      expect(onUnlocked).toHaveBeenCalled();
    });
  });

  it('does not call onUnlocked if ad fails', async () => {
    mockShowRewardedAd.mockResolvedValue(false);
    const onUnlocked = jest.fn();
    const { getByText } = render(
      <GameLimitModal {...defaultProps} onUnlocked={onUnlocked} />
    );
    fireEvent.press(getByText('WATCH AD'));
    await waitFor(() => {
      expect(mockShowRewardedAd).toHaveBeenCalled();
    });
    expect(onUnlocked).not.toHaveBeenCalled();
  });

  it('shows loading state when ad is loading', () => {
    mockAdsContext.isLoadingAd = true;
    mockAdsContext.isRewardedAdReady = false;
    const { getByText } = render(<GameLimitModal {...defaultProps} />);
    expect(getByText(/loading/i)).toBeTruthy();
  });

  it('calls onClose when close/back button is pressed', () => {
    const onClose = jest.fn();
    const { getByText } = render(<GameLimitModal {...defaultProps} onClose={onClose} />);
    fireEvent.press(getByText('MAYBE LATER'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
