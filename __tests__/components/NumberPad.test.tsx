import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { NumberPad } from '../../src/components/NumberPad';

jest.mock('../../src/context/ThemeContext', () => ({
  useTheme: () => ({
    colors: {
      background: '#FAFAFA',
      text: '#0A0A0A',
      primary: '#0A0A0A',
      surface: '#FFFFFF',
      highlight: '#F0F0F0',
      highlightStrong: '#E0E0E0',
      muted: '#757575',
    },
  }),
}));

describe('NumberPad', () => {
  const mockOnNumberPress = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders numbers 1-9 for default (9x9)', () => {
    const { getByText } = render(
      <NumberPad onNumberPress={mockOnNumberPress} />
    );
    for (let i = 1; i <= 9; i++) {
      expect(getByText(i.toString())).toBeTruthy();
    }
  });

  it('renders numbers 1-6 for 6x6 grid', () => {
    const { getByText, queryByText } = render(
      <NumberPad onNumberPress={mockOnNumberPress} maxNumber={6} />
    );
    for (let i = 1; i <= 6; i++) {
      expect(getByText(i.toString())).toBeTruthy();
    }
    expect(queryByText('7')).toBeNull();
    expect(queryByText('8')).toBeNull();
    expect(queryByText('9')).toBeNull();
  });

  it('calls onNumberPress with correct number', () => {
    const { getByText } = render(
      <NumberPad onNumberPress={mockOnNumberPress} />
    );
    fireEvent.press(getByText('5'));
    expect(mockOnNumberPress).toHaveBeenCalledWith(5);
  });

  it('renders without crashing when disabled', () => {
    const { getByText } = render(
      <NumberPad onNumberPress={mockOnNumberPress} disabled />
    );
    expect(getByText('1')).toBeTruthy();
  });

  it('renders with remainingCounts', () => {
    const counts: Record<number, number> = { 1: 0, 2: 3, 3: 5, 4: 9, 5: 1, 6: 2, 7: 4, 8: 6, 9: 8 };
    const { getByText } = render(
      <NumberPad onNumberPress={mockOnNumberPress} remainingCounts={counts} />
    );
    expect(getByText('1')).toBeTruthy();
  });
});
