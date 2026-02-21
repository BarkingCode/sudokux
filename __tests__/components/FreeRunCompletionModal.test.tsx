import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { FreeRunCompletionModal } from '../../src/components/FreeRunCompletionModal';

jest.mock('../../src/context/ThemeContext', () => ({
  useTheme: () => ({
    colors: {
      background: '#FAFAFA',
      text: '#0A0A0A',
      primary: '#0A0A0A',
      muted: '#757575',
      success: '#43A047',
    },
  }),
}));

jest.mock('../../src/services/storeReviewService', () => ({
  maybeRequestReview: jest.fn(),
}));

jest.mock('lucide-react-native', () => ({
  Trophy: 'Trophy',
}));

jest.mock('../../src/context/GameContext', () => ({
  // Type exports only
}));

const defaultProps = {
  visible: true,
  onClose: jest.fn(),
  onPlayAgain: jest.fn(),
  difficulty: 'medium' as any,
  gridType: '9x9' as any,
  timeSeconds: 245,
  mistakes: 0,
};

describe('FreeRunCompletionModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders COMPLETE! header', () => {
    const { getByText } = render(<FreeRunCompletionModal {...defaultProps} />);
    expect(getByText('COMPLETE!')).toBeTruthy();
  });

  it('shows formatted time', () => {
    const { getByText } = render(<FreeRunCompletionModal {...defaultProps} />);
    expect(getByText('04:05')).toBeTruthy();
  });

  it('shows mistake count', () => {
    const { getByText } = render(
      <FreeRunCompletionModal {...defaultProps} mistakes={3} />
    );
    expect(getByText('3')).toBeTruthy();
  });

  it('shows Perfect! for 0 mistakes', () => {
    const { getByText } = render(<FreeRunCompletionModal {...defaultProps} />);
    expect(getByText('Perfect!')).toBeTruthy();
  });

  it('shows grid type label', () => {
    const { getByText } = render(<FreeRunCompletionModal {...defaultProps} />);
    expect(getByText(/Classic 9x9/i)).toBeTruthy();
  });

  it('shows Mini 6x6 for 6x6 grid', () => {
    const { getByText } = render(
      <FreeRunCompletionModal {...defaultProps} gridType={'6x6' as any} />
    );
    expect(getByText(/Mini 6x6/i)).toBeTruthy();
  });

  it('has PLAY ANOTHER button', () => {
    const { getByText } = render(<FreeRunCompletionModal {...defaultProps} />);
    fireEvent.press(getByText('PLAY ANOTHER'));
    expect(defaultProps.onPlayAgain).toHaveBeenCalled();
  });

  it('has BACK TO FREE RUN button', () => {
    const { getByText } = render(<FreeRunCompletionModal {...defaultProps} />);
    fireEvent.press(getByText('BACK TO FREE RUN'));
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('does not render when not visible', () => {
    const { queryByText } = render(
      <FreeRunCompletionModal {...defaultProps} visible={false} />
    );
    expect(queryByText('COMPLETE!')).toBeNull();
  });
});
