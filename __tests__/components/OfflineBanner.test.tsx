import React from 'react';
import { render } from '@testing-library/react-native';
import { OfflineBanner } from '../../src/components/OfflineBanner';

const mockNetworkContext = {
  isOnline: true,
  isInternetReachable: true,
  checkConnection: jest.fn(),
};

jest.mock('../../src/context/NetworkContext', () => ({
  useNetwork: () => mockNetworkContext,
}));

jest.mock('../../src/context/ThemeContext', () => ({
  useTheme: () => ({
    colors: {
      background: '#FAFAFA',
      text: '#0A0A0A',
      primary: '#0A0A0A',
    },
    isDark: false,
  }),
}));

describe('OfflineBanner', () => {
  beforeEach(() => {
    mockNetworkContext.isInternetReachable = true;
  });

  it('returns null when online', () => {
    const { toJSON } = render(<OfflineBanner />);
    expect(toJSON()).toBeNull();
  });

  it('renders banner when offline', () => {
    mockNetworkContext.isInternetReachable = false;
    const { getByText } = render(<OfflineBanner />);
    expect(getByText("You're offline. Some features are limited.")).toBeTruthy();
  });

  it('renders custom message when offline', () => {
    mockNetworkContext.isInternetReachable = false;
    const { getByText } = render(<OfflineBanner message="No connection" />);
    expect(getByText('No connection')).toBeTruthy();
  });
});
