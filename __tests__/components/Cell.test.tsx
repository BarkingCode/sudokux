import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Cell } from '../../src/components/board/Cell';
import { BRUTALIST_LIGHT } from '../../src/context/ThemeContext';

jest.mock('../../src/context/ThemeContext', () => ({
  useTheme: () => ({ colors: require('../../src/context/ThemeContext').BRUTALIST_LIGHT }),
  BRUTALIST_LIGHT: {
    background: '#FAFAFA',
    text: '#0A0A0A',
    primary: '#0A0A0A',
    highlight: '#F0F0F0',
    highlightStrong: '#E0E0E0',
    mistake: '#E53935',
    success: '#43A047',
    surface: '#FFFFFF',
    muted: '#757575',
    accent: '#1565C0',
  },
}));

const defaultProps = {
  row: 0,
  col: 0,
  value: 5,
  size: 40,
  isSelected: false,
  isMistake: false,
  isInitial: true,
  colors: BRUTALIST_LIGHT,
  onPress: jest.fn(),
};

describe('Cell', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders value when > 0', () => {
    const { getByText } = render(<Cell {...defaultProps} />);
    expect(getByText('5')).toBeTruthy();
  });

  it('does not render value when 0', () => {
    const { queryByText } = render(<Cell {...defaultProps} value={0} />);
    expect(queryByText('0')).toBeNull();
  });

  it('calls onPress when pressed', () => {
    const onPress = jest.fn();
    const { getByText } = render(<Cell {...defaultProps} onPress={onPress} />);
    fireEvent.press(getByText('5'));
    expect(onPress).toHaveBeenCalled();
  });

  it('renders notes when value is 0 and notes provided', () => {
    const { getByText } = render(
      <Cell {...defaultProps} value={0} notes={[1, 3, 5]} />
    );
    expect(getByText('1')).toBeTruthy();
    expect(getByText('3')).toBeTruthy();
    expect(getByText('5')).toBeTruthy();
  });

  it('renders with 6x6 configuration', () => {
    const { queryByText } = render(
      <Cell {...defaultProps} value={0} notes={[1, 2]} boxRows={2} boxCols={3} gridSize={6} />
    );
    expect(queryByText('1')).toBeTruthy();
    expect(queryByText('2')).toBeTruthy();
  });

  it('applies different styles for initial vs user-placed', () => {
    // Just verify it renders without crashing for both states
    const { rerender, getByText } = render(<Cell {...defaultProps} isInitial={true} />);
    expect(getByText('5')).toBeTruthy();
    rerender(<Cell {...defaultProps} isInitial={false} />);
    expect(getByText('5')).toBeTruthy();
  });

  it('renders in selected state', () => {
    const { getByText } = render(<Cell {...defaultProps} isSelected={true} />);
    expect(getByText('5')).toBeTruthy();
  });

  it('renders in mistake state', () => {
    const { getByText } = render(<Cell {...defaultProps} isMistake={true} />);
    expect(getByText('5')).toBeTruthy();
  });
});
