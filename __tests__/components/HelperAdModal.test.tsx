/**
 * Tests for HelperAdModal component.
 * Verifies helper unlock flow via rewarded ad.
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { HelperAdModal } from '../../src/components/HelperAdModal';

const mockShowHelperRewardedAd = jest.fn(() => Promise.resolve(true));
const mockAdsContext = {
  showHelperRewardedAd: mockShowHelperRewardedAd,
  isHelperRewardedAdReady: true,
  isLoadingHelperAd: false,
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

const defaultProps = {
  visible: true,
  onClose: jest.fn(),
  onUnlocked: jest.fn(),
};

describe('HelperAdModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAdsContext.isHelperRewardedAdReady = true;
    mockAdsContext.isLoadingHelperAd = false;
    mockShowHelperRewardedAd.mockResolvedValue(true);
  });

  it('renders UNLOCK HELPER header', () => {
    const { getByText } = render(<HelperAdModal {...defaultProps} />);
    expect(getByText('UNLOCK HELPER')).toBeTruthy();
  });

  it('describes the helper feature', () => {
    const { getByText } = render(<HelperAdModal {...defaultProps} />);
    expect(getByText(/Smart Helper/i)).toBeTruthy();
  });

  it('calls showHelperRewardedAd when watch ad button is pressed', async () => {
    const { getByText } = render(<HelperAdModal {...defaultProps} />);
    fireEvent.press(getByText('WATCH AD'));
    await waitFor(() => {
      expect(mockShowHelperRewardedAd).toHaveBeenCalledTimes(1);
    });
  });

  it('calls onUnlocked after successful ad', async () => {
    const onUnlocked = jest.fn();
    const { getByText } = render(
      <HelperAdModal {...defaultProps} onUnlocked={onUnlocked} />
    );
    fireEvent.press(getByText('WATCH AD'));
    await waitFor(() => {
      expect(onUnlocked).toHaveBeenCalled();
    });
  });

  it('does not call onUnlocked if ad fails', async () => {
    mockShowHelperRewardedAd.mockResolvedValue(false);
    const onUnlocked = jest.fn();
    const { getByText } = render(
      <HelperAdModal {...defaultProps} onUnlocked={onUnlocked} />
    );
    fireEvent.press(getByText('WATCH AD'));
    await waitFor(() => {
      expect(mockShowHelperRewardedAd).toHaveBeenCalled();
    });
    expect(onUnlocked).not.toHaveBeenCalled();
  });

  it('shows loading state when helper ad is loading', () => {
    mockAdsContext.isLoadingHelperAd = true;
    mockAdsContext.isHelperRewardedAdReady = false;
    const { getByText } = render(<HelperAdModal {...defaultProps} />);
    expect(getByText(/loading/i)).toBeTruthy();
  });

  it('calls onClose when cancel button is pressed', () => {
    const onClose = jest.fn();
    const { getByText } = render(<HelperAdModal {...defaultProps} onClose={onClose} />);
    fireEvent.press(getByText('MAYBE LATER'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('uses helper-specific ad, not the free-run rewarded ad', async () => {
    const { getByText } = render(<HelperAdModal {...defaultProps} />);
    fireEvent.press(getByText('WATCH AD'));
    await waitFor(() => {
      // Should call helper ad, not regular showRewardedAd
      expect(mockShowHelperRewardedAd).toHaveBeenCalled();
    });
  });
});
