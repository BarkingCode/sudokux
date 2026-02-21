import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { PointSystemModal } from '../../src/components/PointSystemModal';

jest.mock('../../src/context/ThemeContext', () => ({
  useTheme: () => ({
    colors: {
      background: '#FAFAFA',
      text: '#0A0A0A',
      primary: '#0A0A0A',
      muted: '#757575',
      success: '#43A047',
      mistake: '#E53935',
      highlight: '#F0F0F0',
    },
  }),
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('../../src/services/pointService', () => ({
  getPointInfoForDifficulty: jest.fn(() => ({
    gamePoints: 100,
    mistakePenalty: -5,
    helperPenalty: -10,
  })),
}));

jest.mock('lucide-react-native', () => ({
  X: 'X',
}));

const defaultProps = {
  visible: true,
  onClose: jest.fn(),
  currentGridType: '9x9' as any,
};

describe('PointSystemModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders Point System header', () => {
    const { getByText } = render(<PointSystemModal {...defaultProps} />);
    expect(getByText('POINT SYSTEM')).toBeTruthy();
  });

  it('shows point values', () => {
    const { getByText } = render(<PointSystemModal {...defaultProps} />);
    expect(getByText('+100')).toBeTruthy();
  });

  it('shows difficulty tabs', () => {
    const { getByText } = render(<PointSystemModal {...defaultProps} />);
    expect(getByText('EASY')).toBeTruthy();
    expect(getByText('HARD')).toBeTruthy();
    expect(getByText('INSANE')).toBeTruthy();
  });

  it('shows grid type toggles', () => {
    const { getByText } = render(<PointSystemModal {...defaultProps} />);
    expect(getByText('9×9 Standard')).toBeTruthy();
    expect(getByText('6×6 Mini')).toBeTruthy();
  });

  it('shows info note', () => {
    const { getByText } = render(<PointSystemModal {...defaultProps} />);
    expect(getByText(/Points contribute to your global ranking/)).toBeTruthy();
  });

  it('does not render when not visible', () => {
    const { queryByText } = render(
      <PointSystemModal {...defaultProps} visible={false} />
    );
    expect(queryByText('POINT SYSTEM')).toBeNull();
  });
});
