/**
 * Tests for ChapterCompletionModal component.
 * Verifies display of puzzle stats, difficulty badge, and user interactions.
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ChapterCompletionModal } from '../../src/components/ChapterCompletionModal';

// Mock dependencies
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

jest.mock('../../src/services/storeReviewService', () => ({
  maybeRequestReview: jest.fn(() => Promise.resolve()),
}));

const { maybeRequestReview } = require('../../src/services/storeReviewService');

const defaultProps = {
  visible: true,
  onClose: jest.fn(),
  onNextPuzzle: jest.fn(),
  puzzleNumber: 25,
  nextPuzzleNumber: 26,
  difficulty: 'easy' as const,
  timeSeconds: 253,
  mistakes: 0,
};

describe('ChapterCompletionModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('displays the correct puzzle number', () => {
    const { getByText } = render(<ChapterCompletionModal {...defaultProps} />);
    expect(getByText(/Puzzle 25 Complete/i)).toBeTruthy();
  });

  it('displays WELL DONE! header', () => {
    const { getByText } = render(<ChapterCompletionModal {...defaultProps} />);
    expect(getByText('WELL DONE!')).toBeTruthy();
  });

  it('formats time correctly as MM:SS', () => {
    const { getByText } = render(<ChapterCompletionModal {...defaultProps} timeSeconds={253} />);
    expect(getByText('04:13')).toBeTruthy();
  });

  it('displays mistake count', () => {
    const { getByText } = render(<ChapterCompletionModal {...defaultProps} mistakes={3} />);
    expect(getByText('3')).toBeTruthy();
  });

  it('shows "Perfect!" when 0 mistakes', () => {
    const { getByText } = render(<ChapterCompletionModal {...defaultProps} mistakes={0} />);
    expect(getByText('Perfect!')).toBeTruthy();
  });

  it('shows "Great job!" when 1-2 mistakes', () => {
    const { getByText } = render(<ChapterCompletionModal {...defaultProps} mistakes={1} />);
    expect(getByText('Great job!')).toBeTruthy();
  });

  it('shows "Great job!" when exactly 2 mistakes', () => {
    const { getByText } = render(<ChapterCompletionModal {...defaultProps} mistakes={2} />);
    expect(getByText('Great job!')).toBeTruthy();
  });

  it('shows no bonus text when more than 2 mistakes', () => {
    const { queryByText } = render(<ChapterCompletionModal {...defaultProps} mistakes={5} />);
    expect(queryByText('Perfect!')).toBeNull();
    expect(queryByText('Great job!')).toBeNull();
  });

  it('displays next puzzle number', () => {
    const { getByText } = render(<ChapterCompletionModal {...defaultProps} nextPuzzleNumber={26} />);
    expect(getByText(/Next Up: Puzzle 26/)).toBeTruthy();
  });

  it('displays difficulty badge text', () => {
    const { getByText } = render(<ChapterCompletionModal {...defaultProps} difficulty="medium" />);
    expect(getByText('MEDIUM')).toBeTruthy();
  });

  it('calls onNextPuzzle when Continue is pressed', () => {
    const onNextPuzzle = jest.fn();
    const { getByText } = render(<ChapterCompletionModal {...defaultProps} onNextPuzzle={onNextPuzzle} />);
    fireEvent.press(getByText('CONTINUE'));
    expect(onNextPuzzle).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when Back to Chapters is pressed', () => {
    const onClose = jest.fn();
    const { getByText } = render(<ChapterCompletionModal {...defaultProps} onClose={onClose} />);
    fireEvent.press(getByText('BACK TO CHAPTERS'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('requests store review when visible', () => {
    render(<ChapterCompletionModal {...defaultProps} visible={true} />);
    expect(maybeRequestReview).toHaveBeenCalled();
  });

  it('does not request store review when not visible', () => {
    render(<ChapterCompletionModal {...defaultProps} visible={false} />);
    expect(maybeRequestReview).not.toHaveBeenCalled();
  });

  it('handles zero time correctly', () => {
    const { getByText } = render(<ChapterCompletionModal {...defaultProps} timeSeconds={0} />);
    expect(getByText('00:00')).toBeTruthy();
  });

  it('handles large time correctly', () => {
    const { getByText } = render(<ChapterCompletionModal {...defaultProps} timeSeconds={3661} />);
    expect(getByText('61:01')).toBeTruthy();
  });
});
