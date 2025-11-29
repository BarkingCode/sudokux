/**
 * Google Sign-In Service
 *
 * Handles Google Sign-In integration for Android (and optionally iOS) for:
 * - User authentication and identification
 * - Account recovery across devices
 *
 * This is the Android equivalent of Game Center for user identification.
 * The user's Google ID can be used to link accounts and recover progress.
 */

import { Platform } from 'react-native';

export interface GoogleUser {
  id: string;
  email: string;
  name: string | null;
  photo: string | null;
  isAuthenticated: boolean;
}

// Lazy load the module only when needed
let GoogleSignin: any = null;
let statusCodes: any = null;

const loadGoogleSignIn = () => {
  if (!GoogleSignin) {
    try {
      const module = require('@react-native-google-signin/google-signin');
      GoogleSignin = module.GoogleSignin;
      statusCodes = module.statusCodes;
    } catch (error) {
      console.warn('Google Sign-In module not available:', error);
    }
  }
  return { GoogleSignin, statusCodes };
};

class GoogleSignInService {
  private user: GoogleUser | null = null;
  private isConfigured: boolean = false;

  /**
   * Configure Google Sign-In
   * Must be called before any other methods
   * @param webClientId - The web client ID from Google Cloud Console
   */
  configure(webClientId?: string): void {
    const { GoogleSignin } = loadGoogleSignIn();
    if (!GoogleSignin) return;

    try {
      GoogleSignin.configure({
        // Web client ID is required for getting the idToken
        webClientId: webClientId || process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
        offlineAccess: false,
        // On Android, request profile and email scopes
        scopes: ['profile', 'email'],
      });
      this.isConfigured = true;
      console.log('Google Sign-In configured');
    } catch (error) {
      console.warn('Failed to configure Google Sign-In:', error);
    }
  }

  /**
   * Check if Google Sign-In is available on this device
   */
  isGoogleSignInAvailable(): boolean {
    const { GoogleSignin } = loadGoogleSignIn();
    return GoogleSignin !== null && this.isConfigured;
  }

  /**
   * Get the current signed-in user
   */
  getCurrentUser(): GoogleUser | null {
    return this.user;
  }

  /**
   * Check if user is already signed in (silent check)
   * Returns the user if signed in, null otherwise
   */
  async checkCurrentUser(): Promise<GoogleUser | null> {
    const { GoogleSignin } = loadGoogleSignIn();
    if (!GoogleSignin || !this.isConfigured) return null;

    try {
      const response = await GoogleSignin.getCurrentUser();
      if (response?.data) {
        this.user = {
          id: response.data.user.id,
          email: response.data.user.email,
          name: response.data.user.name || null,
          photo: response.data.user.photo || null,
          isAuthenticated: true,
        };
        console.log('Google user found:', this.user.email);
        return this.user;
      }
      return null;
    } catch (error) {
      console.log('No current Google user');
      return null;
    }
  }

  /**
   * Sign in silently (no UI) - use when app starts
   * Returns the user if previously signed in, null otherwise
   */
  async signInSilently(): Promise<GoogleUser | null> {
    const { GoogleSignin, statusCodes } = loadGoogleSignIn();
    if (!GoogleSignin || !this.isConfigured) return null;

    try {
      const response = await GoogleSignin.signInSilently();
      if (response?.data) {
        this.user = {
          id: response.data.user.id,
          email: response.data.user.email,
          name: response.data.user.name || null,
          photo: response.data.user.photo || null,
          isAuthenticated: true,
        };
        console.log('Google silent sign-in successful:', this.user.email);
        return this.user;
      }
      return null;
    } catch (error: any) {
      if (error.code === statusCodes?.SIGN_IN_REQUIRED) {
        // User has not signed in before, this is expected
        console.log('Google sign-in required (first time)');
      } else {
        console.warn('Google silent sign-in failed:', error);
      }
      return null;
    }
  }

  /**
   * Sign in with UI prompt
   * Use when user explicitly wants to link their Google account
   */
  async signIn(): Promise<GoogleUser | null> {
    const { GoogleSignin, statusCodes } = loadGoogleSignIn();
    if (!GoogleSignin || !this.isConfigured) return null;

    try {
      // Check Play Services availability (Android only)
      if (Platform.OS === 'android') {
        await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      }

      const response = await GoogleSignin.signIn();
      if (response?.data) {
        this.user = {
          id: response.data.user.id,
          email: response.data.user.email,
          name: response.data.user.name || null,
          photo: response.data.user.photo || null,
          isAuthenticated: true,
        };
        console.log('Google sign-in successful:', this.user.email);
        return this.user;
      }
      return null;
    } catch (error: any) {
      if (error.code === statusCodes?.SIGN_IN_CANCELLED) {
        console.log('Google sign-in cancelled by user');
      } else if (error.code === statusCodes?.IN_PROGRESS) {
        console.log('Google sign-in already in progress');
      } else if (error.code === statusCodes?.PLAY_SERVICES_NOT_AVAILABLE) {
        console.warn('Google Play Services not available');
      } else {
        console.warn('Google sign-in error:', error);
      }
      return null;
    }
  }

  /**
   * Sign out the current user
   */
  async signOut(): Promise<void> {
    const { GoogleSignin } = loadGoogleSignIn();
    if (!GoogleSignin) return;

    try {
      await GoogleSignin.signOut();
      this.user = null;
      console.log('Google signed out');
    } catch (error) {
      console.warn('Google sign-out error:', error);
    }
  }

  /**
   * Revoke access and disconnect
   */
  async revokeAccess(): Promise<void> {
    const { GoogleSignin } = loadGoogleSignIn();
    if (!GoogleSignin) return;

    try {
      await GoogleSignin.revokeAccess();
      this.user = null;
      console.log('Google access revoked');
    } catch (error) {
      console.warn('Google revoke access error:', error);
    }
  }

  /**
   * Reset the service state
   */
  reset(): void {
    this.user = null;
  }
}

// Export singleton instance
export const googleSignInService = new GoogleSignInService();
