/**
 * Platform detection utilities.
 * Provides consistent platform checks across the codebase.
 */

import { Platform } from 'react-native';

/**
 * Check if running on web platform
 */
export const isWeb = (): boolean => Platform.OS === 'web';

/**
 * Check if running on iOS platform
 */
export const isIOS = (): boolean => Platform.OS === 'ios';

/**
 * Check if running on Android platform
 */
export const isAndroid = (): boolean => Platform.OS === 'android';

/**
 * Check if running on a native mobile platform (iOS or Android)
 */
export const isNative = (): boolean => Platform.OS === 'ios' || Platform.OS === 'android';

/**
 * Get the current platform name
 */
export const getPlatformName = (): 'ios' | 'android' | 'web' => Platform.OS as 'ios' | 'android' | 'web';
