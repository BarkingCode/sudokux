import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { BrutalistButton } from '../../src/components/BrutalistButton';

jest.mock('../../src/context/ThemeContext', () => ({
  useTheme: () => ({
    colors: {
      background: '#FAFAFA',
      text: '#0A0A0A',
      primary: '#0A0A0A',
      secondary: '#1A1A1A',
      surface: '#FFFFFF',
      highlight: '#F0F0F0',
      highlightStrong: '#E0E0E0',
      muted: '#757575',
    },
  }),
}));

describe('BrutalistButton', () => {
  const mockOnPress = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders title text', () => {
    const { getByText } = render(
      <BrutalistButton title="CLICK ME" onPress={mockOnPress} />
    );
    expect(getByText('CLICK ME')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const { getByText } = render(
      <BrutalistButton title="TAP" onPress={mockOnPress} />
    );
    fireEvent.press(getByText('TAP'));
    expect(mockOnPress).toHaveBeenCalledTimes(1);
  });

  it('does not call onPress when disabled', () => {
    const { getByText } = render(
      <BrutalistButton title="DISABLED" onPress={mockOnPress} disabled />
    );
    fireEvent.press(getByText('DISABLED'));
    expect(mockOnPress).not.toHaveBeenCalled();
  });

  it('renders with icon', () => {
    const { getByText } = render(
      <BrutalistButton
        title="WITH ICON"
        onPress={mockOnPress}
        icon={<></>}
      />
    );
    expect(getByText('WITH ICON')).toBeTruthy();
  });

  it('renders all variant types without crashing', () => {
    const variants = ['primary', 'secondary', 'outline', 'ghost'] as const;
    for (const variant of variants) {
      const { getByText } = render(
        <BrutalistButton title={variant} onPress={mockOnPress} variant={variant} />
      );
      expect(getByText(variant.toUpperCase())).toBeTruthy();
    }
  });

  it('renders all size types without crashing', () => {
    const sizes = ['small', 'medium', 'large'] as const;
    for (const size of sizes) {
      const { getByText } = render(
        <BrutalistButton title={size} onPress={mockOnPress} size={size} />
      );
      expect(getByText(size.toUpperCase())).toBeTruthy();
    }
  });
});
