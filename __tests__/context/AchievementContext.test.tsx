import React from 'react';
import { render, act } from '@testing-library/react-native';
import { AchievementProvider, useAchievements } from '../../src/context/AchievementContext';
import { Text, Pressable } from 'react-native';

// Mock dependencies
jest.mock('../../src/components/AchievementToast', () => ({
  AchievementToast: ({ visible, achievement }: any) =>
    visible ? <mock-toast testID="toast">{achievement?.name}</mock-toast> : null,
}));

jest.mock('../../src/components/Confetti', () => ({
  Confetti: ({ visible }: any) =>
    visible ? <mock-confetti testID="confetti" /> : null,
}));

jest.mock('../../src/services/achievementEvents', () => ({
  achievementEvents: {
    subscribe: jest.fn(() => jest.fn()),
  },
}));

jest.mock('../../src/config/timing', () => ({
  TIMING: {
    ACHIEVEMENTS: { QUEUE_DELAY: 0 },
  },
}));

jest.mock('../../src/context/ThemeContext', () => ({
  useTheme: () => ({
    colors: { background: '#fff', text: '#000', primary: '#000', muted: '#999' },
  }),
}));

// Test consumer component
const TestConsumer: React.FC = () => {
  const { showAchievement } = useAchievements();
  return (
    <Pressable testID="trigger" onPress={() => showAchievement('first_puzzle')}>
      <Text>Trigger</Text>
    </Pressable>
  );
};

describe('AchievementContext', () => {
  it('provides showAchievement via context', () => {
    const { getByTestId } = render(
      <AchievementProvider>
        <TestConsumer />
      </AchievementProvider>
    );
    expect(getByTestId('trigger')).toBeTruthy();
  });

  it('throws when useAchievements is used outside provider', () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation();
    expect(() => render(<TestConsumer />)).toThrow(
      'useAchievements must be used within an AchievementProvider'
    );
    consoleError.mockRestore();
  });

  it('subscribes to achievement events on mount', () => {
    const { achievementEvents } = require('../../src/services/achievementEvents');
    render(
      <AchievementProvider>
        <Text>child</Text>
      </AchievementProvider>
    );
    expect(achievementEvents.subscribe).toHaveBeenCalled();
  });
});
