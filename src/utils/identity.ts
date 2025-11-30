/**
 * User Identity Management
 *
 * Handles local user identity creation and syncing with Supabase/Game Center.
 * The local identity (UUID) is the canonical ID, with optional Game Center linking.
 */

import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import { Platform } from 'react-native';
import { getLocales } from 'expo-localization';
import { loadSecureData, saveSecureData, STORAGE_KEYS } from './storage';
import { userService, gameCenterService } from '../services';
import { googleSignInService } from '../services/googleSignIn';
import type { User } from '../lib/database.types';

export interface UserIdentity {
  id: string;
  nickname: string;
  createdAt: string;
  country?: string;
  region?: string;
  gameCenterId?: string;      // iOS Game Center
  googleId?: string;          // Android Google Sign-In
  supabaseUserId?: string;
}

const ADJECTIVES = ['Brutal', 'Sharp', 'Bold', 'Dark', 'Solid', 'Raw', 'Pure', 'Deep'];
const NOUNS = ['Cube', 'Grid', 'Line', 'Block', 'Edge', 'Form', 'Void', 'Mass'];

const generateNickname = (): string => {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  const num = Math.floor(Math.random() * 1000);
  return `${adj}-${noun}-${num}`;
};

/**
 * Get country code from device locale settings
 * Returns ISO 3166-1 alpha-2 country code (e.g., 'US', 'GB', 'JP')
 */
const getDeviceCountry = (): string | undefined => {
  try {
    const locales = getLocales();
    if (locales.length > 0 && locales[0].regionCode) {
      return locales[0].regionCode;
    }
    return undefined;
  } catch {
    return undefined;
  }
};

/**
 * Get or create the local user identity
 */
export const getOrCreateUserIdentity = async (): Promise<UserIdentity> => {
  const storedId = await loadSecureData(STORAGE_KEYS.USER_ID);

  if (storedId) {
    try {
      const identity = JSON.parse(storedId) as UserIdentity;

      // Update country for existing users who don't have it set
      if (!identity.country) {
        const country = getDeviceCountry();
        if (country) {
          identity.country = country;
          await saveSecureData(STORAGE_KEYS.USER_ID, JSON.stringify(identity));
        }
      }

      return identity;
    } catch {
      return {
        id: storedId,
        nickname: 'Unknown-Player',
        createdAt: new Date().toISOString(),
        country: getDeviceCountry(),
      };
    }
  }

  const newIdentity: UserIdentity = {
    id: uuidv4(),
    nickname: generateNickname(),
    createdAt: new Date().toISOString(),
    country: getDeviceCountry(),
  };

  await saveSecureData(STORAGE_KEYS.USER_ID, JSON.stringify(newIdentity));
  return newIdentity;
};

/**
 * Save updated identity to secure storage
 */
export const saveUserIdentity = async (identity: UserIdentity): Promise<void> => {
  await saveSecureData(STORAGE_KEYS.USER_ID, JSON.stringify(identity));
};

/**
 * Initialize user with backend services (Supabase + Game Center/Google Sign-In)
 * Call this on app startup when online
 */
export const initializeUserWithBackend = async (
  identity: UserIdentity
): Promise<{ identity: UserIdentity; supabaseUser: User | null }> => {
  let updatedIdentity = { ...identity };

  // 1. Authenticate with platform-specific service
  if (Platform.OS === 'ios') {
    // iOS: Authenticate with Game Center
    const gcPlayer = await gameCenterService.authenticate();
    if (gcPlayer) {
      updatedIdentity.gameCenterId = gcPlayer.playerId;
    }
  } else if (Platform.OS === 'android') {
    // Android: Configure and try silent sign-in with Google
    googleSignInService.configure();
    const googleUser = await googleSignInService.signInSilently();
    if (googleUser) {
      updatedIdentity.googleId = googleUser.id;
    }
  }

  // 2. Sync with Supabase
  const supabaseUser = await userService.syncUser({
    id: identity.id,
    nickname: identity.nickname,
    createdAt: identity.createdAt,
    country: identity.country,
    region: identity.region,
  });

  if (supabaseUser) {
    updatedIdentity.supabaseUserId = supabaseUser.id;

    // 3. Link platform accounts to Supabase user if authenticated
    if (Platform.OS === 'ios' && updatedIdentity.gameCenterId && !supabaseUser.game_center_id) {
      await userService.linkGameCenter(supabaseUser.id, updatedIdentity.gameCenterId);
    } else if (Platform.OS === 'android' && updatedIdentity.googleId && !supabaseUser.google_id) {
      await userService.linkGoogle(supabaseUser.id, updatedIdentity.googleId);
    }

    // 4. Update country in Supabase if local has it but remote doesn't
    if (updatedIdentity.country && !supabaseUser.country) {
      await userService.updateProfile(supabaseUser.id, { country: updatedIdentity.country });
    }
  }

  // 5. Save updated identity locally if anything changed
  if (
    updatedIdentity.gameCenterId !== identity.gameCenterId ||
    updatedIdentity.googleId !== identity.googleId ||
    updatedIdentity.supabaseUserId !== identity.supabaseUserId
  ) {
    await saveUserIdentity(updatedIdentity);
  }

  return { identity: updatedIdentity, supabaseUser };
};

/**
 * Update user profile (nickname, country, region)
 */
export const updateUserProfile = async (
  identity: UserIdentity,
  updates: { nickname?: string; country?: string; region?: string }
): Promise<UserIdentity> => {
  const updatedIdentity = { ...identity, ...updates };

  // Save locally
  await saveUserIdentity(updatedIdentity);

  // Sync to Supabase if connected
  if (identity.supabaseUserId) {
    await userService.updateProfile(identity.supabaseUserId, updates);
  }

  return updatedIdentity;
};

/**
 * Try to recover account using Game Center (iOS)
 * Useful if user reinstalls app but has same Game Center account
 */
export const tryRecoverWithGameCenter = async (): Promise<UserIdentity | null> => {
  if (Platform.OS !== 'ios') return null;

  const gcPlayer = await gameCenterService.authenticate();
  if (!gcPlayer) return null;

  // Look for existing user with this Game Center ID
  const existingUser = await userService.findByGameCenterId(gcPlayer.playerId);
  if (!existingUser) return null;

  // Found existing user - create local identity from Supabase data
  const recoveredIdentity: UserIdentity = {
    id: existingUser.internal_id,
    nickname: existingUser.nickname,
    createdAt: existingUser.created_at,
    country: existingUser.country || undefined,
    region: existingUser.region || undefined,
    gameCenterId: gcPlayer.playerId,
    supabaseUserId: existingUser.id,
  };

  await saveUserIdentity(recoveredIdentity);
  return recoveredIdentity;
};

/**
 * Try to recover account using Google Sign-In (Android)
 * Useful if user reinstalls app but has same Google account
 */
export const tryRecoverWithGoogle = async (): Promise<UserIdentity | null> => {
  if (Platform.OS !== 'android') return null;

  // Configure and sign in with Google
  googleSignInService.configure();
  const googleUser = await googleSignInService.signIn();
  if (!googleUser) return null;

  // Look for existing user with this Google ID
  const existingUser = await userService.findByGoogleId(googleUser.id);
  if (!existingUser) return null;

  // Found existing user - create local identity from Supabase data
  const recoveredIdentity: UserIdentity = {
    id: existingUser.internal_id,
    nickname: existingUser.nickname,
    createdAt: existingUser.created_at,
    country: existingUser.country || undefined,
    region: existingUser.region || undefined,
    googleId: googleUser.id,
    supabaseUserId: existingUser.id,
  };

  await saveUserIdentity(recoveredIdentity);
  return recoveredIdentity;
};

/**
 * Link Google account to existing identity (Android)
 * Call this when user wants to connect their Google account
 */
export const linkGoogleAccount = async (identity: UserIdentity): Promise<UserIdentity | null> => {
  if (Platform.OS !== 'android') return null;

  googleSignInService.configure();
  const googleUser = await googleSignInService.signIn();
  if (!googleUser) return null;

  const updatedIdentity = { ...identity, googleId: googleUser.id };

  // Link to Supabase if connected
  if (identity.supabaseUserId) {
    await userService.linkGoogle(identity.supabaseUserId, googleUser.id);
  }

  await saveUserIdentity(updatedIdentity);
  return updatedIdentity;
};
