/**
 * Error boundary component for catching React errors.
 * Displays a brutalist error UI with retry functionality.
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, StyleSheet, Pressable, Text } from 'react-native';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <View style={styles.container}>
          <View style={styles.errorBox}>
            <Text style={styles.errorIcon}>!</Text>
            <Text style={styles.title}>SOMETHING WENT WRONG</Text>
            <Text style={styles.message}>
              {this.state.error?.message || 'An unexpected error occurred'}
            </Text>
            <Pressable style={styles.retryButton} onPress={this.handleRetry}>
              <Text style={styles.retryText}>TRY AGAIN</Text>
            </Pressable>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#FAFAFA',
  },
  errorBox: {
    borderWidth: 3,
    borderColor: '#0A0A0A',
    padding: 32,
    alignItems: 'center',
    maxWidth: 300,
  },
  errorIcon: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#0A0A0A',
  },
  title: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0A0A0A',
    letterSpacing: 1,
  },
  message: {
    marginTop: 8,
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    fontFamily: 'monospace',
  },
  retryButton: {
    marginTop: 24,
    borderWidth: 2,
    borderColor: '#0A0A0A',
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  retryText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0A0A0A',
    letterSpacing: 1,
  },
});
