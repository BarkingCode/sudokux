export default {
  expo: {
    name: 'X-Sudoku',
    slug: 'sudokux',
    scheme: 'sudokux',
    version: '1.0.3',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    newArchEnabled: true,
    splash: {
      image: './assets/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#000000',
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.artticfox.sudokux',
      usesAppleSignIn: false,
      infoPlist: {
        UIBackgroundModes: ['fetch', 'remote-notification'],
        GADApplicationIdentifier:
          process.env.EXPO_PUBLIC_ADMOB_APP_ID_IOS ||
          'ca-app-pub-3940256099942544~1458002511', // Test ID fallback
        SKAdNetworkItems: [
          { SKAdNetworkIdentifier: 'cstr6suwn9.skadnetwork' },
          { SKAdNetworkIdentifier: '4fzdc2evr5.skadnetwork' },
          { SKAdNetworkIdentifier: '2fnua5tdw4.skadnetwork' },
          { SKAdNetworkIdentifier: 'ydx93a7ass.skadnetwork' },
          { SKAdNetworkIdentifier: '5a6flpkh64.skadnetwork' },
          { SKAdNetworkIdentifier: 'p78axxw29g.skadnetwork' },
          { SKAdNetworkIdentifier: 'v72qych5uu.skadnetwork' },
          { SKAdNetworkIdentifier: 'c6k4g5qg8m.skadnetwork' },
          { SKAdNetworkIdentifier: 's39g8k73mm.skadnetwork' },
          { SKAdNetworkIdentifier: '3qy4746246.skadnetwork' },
          { SKAdNetworkIdentifier: 'v9wttpbfk9.skadnetwork' }, // Facebook
          { SKAdNetworkIdentifier: 'n38lu8286q.skadnetwork' }, // Facebook
        ],
        NSUserTrackingUsageDescription:
          'This identifier will be used to deliver personalized ads to you.',
        ITSAppUsesNonExemptEncryption: false,
      },
      entitlements: {
        'com.apple.developer.game-center': true,
        'aps-environment': 'development',
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#000000',
      },
      splash: {
        image: './assets/splash-icon.png',
        resizeMode: 'contain',
        backgroundColor: '#000000',
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      package: 'com.artticfox.sudokux',
      permissions: ['RECEIVE_BOOT_COMPLETED', 'VIBRATE', 'POST_NOTIFICATIONS'],
    },
    web: {
      favicon: './assets/favicon.png',
    },
    plugins: [
      'expo-router',
      'expo-font',
      'expo-secure-store',
      'expo-asset',
      [
        'expo-notifications',
        {
          icon: './assets/notification-icon.png',
          color: '#000000',
          sounds: [],
        },
      ],
      [
        'react-native-google-mobile-ads',
        {
          androidAppId:
            process.env.EXPO_PUBLIC_ADMOB_APP_ID_ANDROID ||
            'ca-app-pub-3940256099942544~3347511713', // Test ID fallback
          iosAppId:
            process.env.EXPO_PUBLIC_ADMOB_APP_ID_IOS ||
            'ca-app-pub-3940256099942544~1458002511', // Test ID fallback
        },
      ],
      [
        '@sentry/react-native/expo',
        {
          organization: 'barking-code-wj',
          project: 'sudokux',
        },
      ],
      'expo-localization',
      [
        'react-native-fbsdk-next',
        {
          appID: '1186243443458880',
          displayName: 'X-Sudoku',
          clientToken: process.env.EXPO_PUBLIC_FACEBOOK_CLIENT_TOKEN || 'YOUR_CLIENT_TOKEN',
          advertiserIDCollectionEnabled: true,
          autoLogAppEventsEnabled: true,
          isAutoInitEnabled: true,
        },
      ],
      'expo-tracking-transparency',
    ],
    extra: {
      router: {},
      eas: {
        projectId: 'ba3ffd82-acb2-4551-a2d8-cabd4cf475eb',
      },
    },
    runtimeVersion: {
      policy: 'appVersion',
    },
    updates: {
      url: 'https://u.expo.dev/ba3ffd82-acb2-4551-a2d8-cabd4cf475eb',
    },
  },
};
