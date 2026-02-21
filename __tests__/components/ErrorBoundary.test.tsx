import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Text } from 'react-native';
import { ErrorBoundary } from '../../src/components/ErrorBoundary';

const ThrowError: React.FC<{ shouldThrow?: boolean }> = ({ shouldThrow }) => {
  if (shouldThrow) throw new Error('Test error');
  return <Text>Working</Text>;
};

describe('ErrorBoundary', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders children when no error', () => {
    const { getByText } = render(
      <ErrorBoundary>
        <Text>Hello</Text>
      </ErrorBoundary>
    );
    expect(getByText('Hello')).toBeTruthy();
  });

  it('renders error UI when child throws', () => {
    const { getByText } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow />
      </ErrorBoundary>
    );
    expect(getByText('SOMETHING WENT WRONG')).toBeTruthy();
    expect(getByText('Test error')).toBeTruthy();
  });

  it('renders custom fallback when provided', () => {
    const { getByText } = render(
      <ErrorBoundary fallback={<Text>Custom Fallback</Text>}>
        <ThrowError shouldThrow />
      </ErrorBoundary>
    );
    expect(getByText('Custom Fallback')).toBeTruthy();
  });

  it('calls onError callback when error occurs', () => {
    const onError = jest.fn();
    render(
      <ErrorBoundary onError={onError}>
        <ThrowError shouldThrow />
      </ErrorBoundary>
    );
    expect(onError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({ componentStack: expect.any(String) })
    );
  });

  it('shows TRY AGAIN button that resets error state', () => {
    const { getByText } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow />
      </ErrorBoundary>
    );
    expect(getByText('SOMETHING WENT WRONG')).toBeTruthy();
    expect(getByText('TRY AGAIN')).toBeTruthy();

    // Pressing retry resets hasError state
    fireEvent.press(getByText('TRY AGAIN'));
    // After reset, children re-render (and throw again in this case)
    expect(getByText('SOMETHING WENT WRONG')).toBeTruthy();
  });
});
