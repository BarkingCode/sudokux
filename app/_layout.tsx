import { useEffect, useRef } from 'react';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Sentry from '@sentry/react-native';
import { ThemeProvider } from '../src/context/ThemeContext';
import { NetworkProvider } from '../src/context/NetworkContext';
import { DailyStatusProvider } from '../src/context/DailyStatusContext';
import { GameProvider } from '../src/context/GameContext';
import { AdProvider } from '../src/context/AdContext';
import { AchievementProvider } from '../src/context/AchievementContext';
import { ErrorBoundary } from '../src/components/ErrorBoundary';
import { notificationService } from '../src/services/notificationService';
import { statsService } from '../src/services/statsService';
import { offlineQueue } from '../src/services/offlineQueue';
import { STORAGE_KEYS } from '../src/utils/storage';
import { badgeService } from '../src/services/badgeService';
import { getOrCreateUserIdentity, initializeUserWithBackend } from '../src/utils/identity';
import { initializeFacebookSDK } from '../src/services/facebookAnalytics';

Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
  environment: __DEV__ ? 'development' : 'production',
  enableNativeNdk: false,
  tracesSampleRate: __DEV__ ? 1.0 : 0.2,
  _experiments: {
    profilesSampleRate: __DEV__ ? 1.0 : 0.1,
  },
  enableAutoSessionTracking: true,
  enableAutoPerformanceTracing: true,
  attachScreenshot: true,
  debug: __DEV__,
  beforeSend(event, hint) {
    // Filter out known noise
    const error = hint?.originalException;
    
    if (error && typeof error === 'object' && 'message' in error) {
      const message = String(error.message);
      
      // Filter out React Native animation warnings
      if (message.includes('Animated') || message.includes('componentWillReceiveProps')) {
        return null;
      }
      
      // Filter out network timeouts during development
      if (__DEV__ && message.includes('timeout')) {
        return null;
      }
    }
    
    return event;
  },
});

function NotificationHandler() {
  const router = useRouter();
  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);

  useEffect(() => {
    // Clear badge immediately on app open (no number badge on icon)
    Notifications.setBadgeCountAsync(0);

    // Initialize services with user ID
    const initServices = async () => {
      try {
        // Initialize Facebook SDK for analytics
        await initializeFacebookSDK();

        // Request App Tracking Transparency permission (iOS only)
        // This enables personalized ads for higher ad revenue
        if (Platform.OS === 'ios') {
          try {
            const { requestTrackingPermissionsAsync } = await import('expo-tracking-transparency');
            const { status } = await requestTrackingPermissionsAsync();
            console.log('[ATT] Tracking permission:', status);
          } catch (error) {
            console.log('[ATT] Native module not available');
          }
        }

        // Initialize offline queue
        await offlineQueue.initialize();

        // Get or create local user identity
        const identity = await getOrCreateUserIdentity();
        console.log('[Identity] User identity initialized');

        // Sync with backend (creates user in Supabase if needed)
        const { identity: updatedIdentity, supabaseUser } = await initializeUserWithBackend(identity);

        if (supabaseUser) {
          console.log('[Identity] Supabase user synced');

          // Initialize notifications
          await notificationService.initialize(supabaseUser.id);

          // Sync any queued offline achievements
          await statsService.syncOfflineQueue(supabaseUser.id);

          // Update app badge based on daily challenge status
          await badgeService.updateDailyBadge(supabaseUser.id);
        }
      } catch (error) {
        console.error('Error initializing services:', error);
      }
    };

    initServices();

    // Handle notifications received while app is foregrounded
    notificationListener.current = notificationService.addNotificationReceivedListener(
      (notification) => {
        console.log('Notification received:', notification);
      }
    );

    // Handle notification response (user tapped on notification)
    responseListener.current = notificationService.addNotificationResponseListener(
      (response) => {
        const data = response.notification.request.content.data;

        // Navigate to daily challenge if notification is about daily puzzle
        if (data?.type === 'daily_challenge') {
          router.push('/(tabs)/daily');
        }
      }
    );

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, [router]);

  return null;
}

function RootLayout() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <NetworkProvider>
          <DailyStatusProvider>
            <AchievementProvider>
              <AdProvider>
                <GameProvider>
                  <View style={{ flex: 1 }}>
                    <StatusBar style="auto" />
                    <NotificationHandler />
                    <Stack screenOptions={{ headerShown: false }} />
                  </View>
                </GameProvider>
              </AdProvider>
            </AchievementProvider>
          </DailyStatusProvider>
        </NetworkProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default Sentry.wrap(RootLayout);
