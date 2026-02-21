import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { NetworkError } from '../../src/components/NetworkError';

jest.mock('../../src/context/ThemeContext', () => ({
  useTheme: () => ({
    colors: {
      background: '#FAFAFA',
      text: '#0A0A0A',
      primary: '#0A0A0A',
      muted: '#757575',
      mistake: '#E53935',
    },
  }),
}));

describe('NetworkError', () => {
  it('renders default message', () => {
    const { getByText } = render(<NetworkError />);
    expect(getByText('Unable to connect to the server')).toBeTruthy();
  });

  it('renders custom message', () => {
    const { getByText } = render(<NetworkError message="Custom error" />);
    expect(getByText('Custom error')).toBeTruthy();
  });

  it('renders retry button when onRetry provided', () => {
    const { getByText } = render(<NetworkError onRetry={jest.fn()} />);
    expect(getByText('TRY AGAIN')).toBeTruthy();
  });

  it('calls onRetry when retry pressed', () => {
    const onRetry = jest.fn();
    const { getByText } = render(<NetworkError onRetry={onRetry} />);
    fireEvent.press(getByText('TRY AGAIN'));
    expect(onRetry).toHaveBeenCalled();
  });

  it('does not render retry button when onRetry not provided', () => {
    const { queryByText } = render(<NetworkError />);
    expect(queryByText('TRY AGAIN')).toBeNull();
  });

  it('renders compact variant', () => {
    const { getByText } = render(<NetworkError compact message="Offline" />);
    expect(getByText(/Offline/)).toBeTruthy();
  });

  it('renders compact retry button', () => {
    const onRetry = jest.fn();
    const { getByText } = render(<NetworkError compact onRetry={onRetry} />);
    expect(getByText('RETRY')).toBeTruthy();
    fireEvent.press(getByText('RETRY'));
    expect(onRetry).toHaveBeenCalled();
  });

  it('renders CONNECTION ERROR title in full mode', () => {
    const { getByText } = render(<NetworkError />);
    expect(getByText('CONNECTION ERROR')).toBeTruthy();
  });

  it('shows hint text in full mode', () => {
    const { getByText } = render(<NetworkError />);
    expect(getByText('Check your internet connection')).toBeTruthy();
  });
});
