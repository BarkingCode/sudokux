import React from 'react';
import { render, waitFor, act, fireEvent } from '@testing-library/react-native';
import { Text, Pressable } from 'react-native';
import { NetworkProvider, useNetwork } from '../../src/context/NetworkContext';

const mockGetNetworkStateAsync = jest.fn(() =>
  Promise.resolve({ isConnected: true, isInternetReachable: true })
);

jest.mock('expo-network', () => ({
  getNetworkStateAsync: (...args: any[]) => mockGetNetworkStateAsync(...args),
}));

jest.mock('../../src/config/timing', () => ({
  TIMING: {
    NETWORK: { CHECK_INTERVAL: 999999 }, // large to prevent polling in tests
  },
}));

jest.mock('../../src/utils/logger', () => ({
  createScopedLogger: () => ({
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  }),
}));

const TestConsumer: React.FC = () => {
  const { isOnline, isInternetReachable, checkConnection } = useNetwork();
  return (
    <>
      <Text testID="online">{isOnline ? 'yes' : 'no'}</Text>
      <Text testID="reachable">{isInternetReachable ? 'yes' : 'no'}</Text>
      <Pressable testID="check" onPress={checkConnection}>
        <Text>Check</Text>
      </Pressable>
    </>
  );
};

describe('NetworkContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockGetNetworkStateAsync.mockResolvedValue({ isConnected: true, isInternetReachable: true });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('defaults to online', async () => {
    const { getByTestId } = render(
      <NetworkProvider>
        <TestConsumer />
      </NetworkProvider>
    );
    expect(getByTestId('online').props.children).toBe('yes');
  });

  it('throws when useNetwork is used outside provider', () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation();
    expect(() => render(<TestConsumer />)).toThrow(
      'useNetwork must be used within a NetworkProvider'
    );
    consoleError.mockRestore();
  });

  it('updates state when offline', async () => {
    mockGetNetworkStateAsync.mockResolvedValue({ isConnected: false, isInternetReachable: false });
    const { getByTestId } = render(
      <NetworkProvider>
        <TestConsumer />
      </NetworkProvider>
    );

    await waitFor(() => {
      expect(getByTestId('online').props.children).toBe('no');
      expect(getByTestId('reachable').props.children).toBe('no');
    });
  });

  it('checkConnection re-fetches network state', async () => {
    const { getByTestId } = render(
      <NetworkProvider>
        <TestConsumer />
      </NetworkProvider>
    );

    await waitFor(() => {
      expect(mockGetNetworkStateAsync).toHaveBeenCalled();
    });

    mockGetNetworkStateAsync.mockResolvedValue({ isConnected: false, isInternetReachable: false });

    await act(async () => {
      fireEvent.press(getByTestId('check'));
    });

    await waitFor(() => {
      expect(getByTestId('online').props.children).toBe('no');
    });
  });
});
