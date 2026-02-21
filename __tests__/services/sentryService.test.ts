/**
 * Tests for src/services/sentryService.ts
 * Sentry error tracking and performance monitoring helpers.
 */

import * as Sentry from '@sentry/react-native';
import {
  setSentryUser,
  clearSentryUser,
  addGameBreadcrumb,
  addAdBreadcrumb,
  captureGameError,
  captureAdError,
  captureServiceError,
  startTransaction,
} from '../../src/services/sentryService';

describe('sentryService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============ User Context ============

  describe('user context', () => {
    it('should set user with ID and display name', () => {
      setSentryUser('user-123', 'TestUser');

      expect(Sentry.setUser).toHaveBeenCalledWith({
        id: 'user-123',
        username: 'TestUser',
      });
    });

    it('should set user with ID only', () => {
      setSentryUser('user-123');

      expect(Sentry.setUser).toHaveBeenCalledWith({
        id: 'user-123',
        username: undefined,
      });
    });

    it('should clear user context', () => {
      clearSentryUser();

      expect(Sentry.setUser).toHaveBeenCalledWith(null);
    });
  });

  // ============ Game Breadcrumbs ============

  describe('game breadcrumbs', () => {
    it('should add game breadcrumb with message only', () => {
      addGameBreadcrumb('Puzzle started');

      expect(Sentry.addBreadcrumb).toHaveBeenCalledWith({
        category: 'game',
        message: 'Puzzle started',
        data: undefined,
        level: 'info',
      });
    });

    it('should add game breadcrumb with data', () => {
      addGameBreadcrumb('Puzzle completed', {
        difficulty: 'medium',
        timeSeconds: 300,
        mistakes: 2,
      });

      expect(Sentry.addBreadcrumb).toHaveBeenCalledWith({
        category: 'game',
        message: 'Puzzle completed',
        data: {
          difficulty: 'medium',
          timeSeconds: 300,
          mistakes: 2,
        },
        level: 'info',
      });
    });
  });

  // ============ Ad Breadcrumbs ============

  describe('ad breadcrumbs', () => {
    it('should add ad breadcrumb with message only', () => {
      addAdBreadcrumb('Interstitial ad shown');

      expect(Sentry.addBreadcrumb).toHaveBeenCalledWith({
        category: 'ads',
        message: 'Interstitial ad shown',
        data: undefined,
        level: 'info',
      });
    });

    it('should add ad breadcrumb with data', () => {
      addAdBreadcrumb('Rewarded ad earned', {
        adType: 'rewarded',
        gamesAdded: 3,
      });

      expect(Sentry.addBreadcrumb).toHaveBeenCalledWith({
        category: 'ads',
        message: 'Rewarded ad earned',
        data: {
          adType: 'rewarded',
          gamesAdded: 3,
        },
        level: 'info',
      });
    });
  });

  // ============ Game Error Capture ============

  describe('captureGameError', () => {
    it('should capture game error with domain tag', () => {
      const error = new Error('Game state corruption');
      
      captureGameError(error);

      expect(Sentry.withScope).toHaveBeenCalled();
      expect(Sentry.captureException).toHaveBeenCalledWith(error);
      
      // Verify scope was configured
      const scopeCallback = (Sentry.withScope as jest.Mock).mock.calls[0][0];
      const mockScope = {
        setTag: jest.fn(),
        setExtras: jest.fn(),
      };
      scopeCallback(mockScope);
      
      expect(mockScope.setTag).toHaveBeenCalledWith('domain', 'game');
    });

    it('should capture game error with context', () => {
      const error = new Error('Invalid move');
      const context = {
        puzzleId: 'puzzle-123',
        cellRow: 5,
        cellCol: 3,
      };
      
      captureGameError(error, context);

      const scopeCallback = (Sentry.withScope as jest.Mock).mock.calls[0][0];
      const mockScope = {
        setTag: jest.fn(),
        setExtras: jest.fn(),
      };
      scopeCallback(mockScope);
      
      expect(mockScope.setExtras).toHaveBeenCalledWith(context);
    });
  });

  // ============ Ad Error Capture ============

  describe('captureAdError', () => {
    it('should capture ad error with domain and ad_type tags', () => {
      const error = new Error('Ad failed to load');
      
      captureAdError(error, 'interstitial');

      expect(Sentry.withScope).toHaveBeenCalled();
      expect(Sentry.captureException).toHaveBeenCalledWith(error);
      
      const scopeCallback = (Sentry.withScope as jest.Mock).mock.calls[0][0];
      const mockScope = {
        setTag: jest.fn(),
        setExtras: jest.fn(),
      };
      scopeCallback(mockScope);
      
      expect(mockScope.setTag).toHaveBeenCalledWith('domain', 'ads');
      expect(mockScope.setTag).toHaveBeenCalledWith('ad_type', 'interstitial');
    });

    it('should capture ad error with context', () => {
      const error = new Error('Ad timeout');
      const context = {
        adUnit: 'ca-app-pub-123',
        timeoutMs: 30000,
      };
      
      captureAdError(error, 'rewarded', context);

      const scopeCallback = (Sentry.withScope as jest.Mock).mock.calls[0][0];
      const mockScope = {
        setTag: jest.fn(),
        setExtras: jest.fn(),
      };
      scopeCallback(mockScope);
      
      expect(mockScope.setExtras).toHaveBeenCalledWith(context);
    });
  });

  // ============ Service Error Capture ============

  describe('captureServiceError', () => {
    it('should capture service error with domain and service tags', () => {
      const error = new Error('Database connection failed');
      
      captureServiceError('leaderboard', error);

      expect(Sentry.withScope).toHaveBeenCalled();
      expect(Sentry.captureException).toHaveBeenCalledWith(error);
      
      const scopeCallback = (Sentry.withScope as jest.Mock).mock.calls[0][0];
      const mockScope = {
        setTag: jest.fn(),
        setExtras: jest.fn(),
      };
      scopeCallback(mockScope);
      
      expect(mockScope.setTag).toHaveBeenCalledWith('domain', 'service');
      expect(mockScope.setTag).toHaveBeenCalledWith('service', 'leaderboard');
    });

    it('should capture service error with context', () => {
      const error = new Error('API timeout');
      const context = {
        endpoint: '/api/achievements',
        userId: 'user-123',
      };
      
      captureServiceError('achievements', error, context);

      const scopeCallback = (Sentry.withScope as jest.Mock).mock.calls[0][0];
      const mockScope = {
        setTag: jest.fn(),
        setExtras: jest.fn(),
      };
      scopeCallback(mockScope);
      
      expect(mockScope.setExtras).toHaveBeenCalledWith(context);
    });
  });

  // ============ Performance Monitoring ============

  describe('startTransaction', () => {
    it('should start an inactive span', () => {
      const mockSpan = { end: jest.fn() };
      (Sentry.startInactiveSpan as jest.Mock).mockReturnValue(mockSpan);

      const span = startTransaction('puzzle_generation', 'task');

      expect(Sentry.startInactiveSpan).toHaveBeenCalledWith({
        name: 'puzzle_generation',
        op: 'task',
      });
      expect(span).toBe(mockSpan);
    });

    it('should return span with end method', () => {
      const mockSpan = { end: jest.fn() };
      (Sentry.startInactiveSpan as jest.Mock).mockReturnValue(mockSpan);

      const span = startTransaction('ad_load', 'ad');

      expect(span.end).toBeDefined();
      expect(typeof span.end).toBe('function');
    });
  });
});
