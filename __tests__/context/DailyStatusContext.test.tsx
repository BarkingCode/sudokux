import React from 'react';
import { render, act, waitFor, fireEvent } from '@testing-library/react-native';
import { Text, Pressable } from 'react-native';
import { DailyStatusProvider, useDailyStatus } from '../../src/context/DailyStatusContext';

// Mock dependencies
jest.mock('../../src/services/dailyChallengeService', () => ({
  hasCompletedToday: jest.fn(() => Promise.resolve(false)),
  getTodayDateUTC: jest.fn(() => '2026-02-21'),
}));

jest.mock('../../src/utils/storage', () => ({
  loadSecureData: jest.fn(() => Promise.resolve(null)),
  STORAGE_KEYS: { USER_ID: 'user_id' },
}));

jest.mock('../../src/context/ThemeContext', () => ({
  useTheme: () => ({
    colors: { background: '#fff', text: '#000', primary: '#000', muted: '#999' },
  }),
}));

const TestConsumer: React.FC = () => {
  const { hasCompletedTodayChallenge, isLoading, markAsCompleted } = useDailyStatus();
  return (
    <>
      <Text testID="loading">{isLoading ? 'loading' : 'loaded'}</Text>
      <Text testID="completed">{hasCompletedTodayChallenge ? 'yes' : 'no'}</Text>
      <Pressable testID="mark" onPress={markAsCompleted}>
        <Text>Mark</Text>
      </Pressable>
    </>
  );
};

describe('DailyStatusContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('provides initial state', async () => {
    const { getByTestId } = render(
      <DailyStatusProvider>
        <TestConsumer />
      </DailyStatusProvider>
    );
    await waitFor(() => {
      expect(getByTestId('completed').props.children).toBe('no');
    });
  });

  it('throws when useDailyStatus is used outside provider', () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation();
    expect(() => render(<TestConsumer />)).toThrow(
      'useDailyStatus must be used within a DailyStatusProvider'
    );
    consoleError.mockRestore();
  });

  it('markAsCompleted sets completed to true', async () => {
    const { getByTestId } = render(
      <DailyStatusProvider>
        <TestConsumer />
      </DailyStatusProvider>
    );

    await waitFor(() => {
      expect(getByTestId('completed').props.children).toBe('no');
    });

    await act(async () => {
      fireEvent.press(getByTestId('mark'));
    });

    expect(getByTestId('completed').props.children).toBe('yes');
  });
});
