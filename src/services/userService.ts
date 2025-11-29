/**
 * User Service
 *
 * Handles user management with Supabase:
 * - Creating/syncing users from local identity
 * - Linking Game Center accounts
 * - Updating user profiles
 */

import { supabase } from '../lib/supabase';
import type { User, UserInsert } from '../lib/database.types';

export interface LocalUserIdentity {
  id: string;
  nickname: string;
  createdAt: string;
  country?: string;
  region?: string;
}

class UserService {
  private cachedUser: User | null = null;

  /**
   * Sync local user identity with Supabase
   * Creates user if not exists, returns existing if found
   */
  async syncUser(localIdentity: LocalUserIdentity): Promise<User | null> {
    try {
      // First, try to find by internal_id
      const { data: existingUser, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('internal_id', localIdentity.id)
        .single();

      if (existingUser && !fetchError) {
        this.cachedUser = existingUser;
        return existingUser;
      }

      // User doesn't exist, create new one
      const newUser: UserInsert = {
        internal_id: localIdentity.id,
        nickname: localIdentity.nickname,
        country: localIdentity.country || null,
        region: localIdentity.region || null,
      };

      const { data: createdUser, error: createError } = await supabase
        .from('users')
        .insert(newUser)
        .select()
        .single();

      if (createError) {
        console.error('Failed to create user:', createError);
        return null;
      }

      this.cachedUser = createdUser;
      return createdUser;
    } catch (error) {
      console.error('Error syncing user:', error);
      return null;
    }
  }

  /**
   * Link a Game Center ID to the user
   */
  async linkGameCenter(userId: string, gameCenterId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('users')
        .update({ game_center_id: gameCenterId })
        .eq('id', userId);

      if (error) {
        console.error('Failed to link Game Center:', error);
        return false;
      }

      if (this.cachedUser && this.cachedUser.id === userId) {
        this.cachedUser.game_center_id = gameCenterId;
      }

      return true;
    } catch (error) {
      console.error('Error linking Game Center:', error);
      return false;
    }
  }

  /**
   * Find user by Game Center ID (for account recovery on iOS)
   */
  async findByGameCenterId(gameCenterId: string): Promise<User | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('game_center_id', gameCenterId)
        .single();

      if (error || !data) {
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error finding user by Game Center ID:', error);
      return null;
    }
  }

  /**
   * Link a Google ID to the user (Android)
   */
  async linkGoogle(userId: string, googleId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('users')
        .update({ google_id: googleId })
        .eq('id', userId);

      if (error) {
        console.error('Failed to link Google:', error);
        return false;
      }

      if (this.cachedUser && this.cachedUser.id === userId) {
        this.cachedUser.google_id = googleId;
      }

      return true;
    } catch (error) {
      console.error('Error linking Google:', error);
      return false;
    }
  }

  /**
   * Find user by Google ID (for account recovery on Android)
   */
  async findByGoogleId(googleId: string): Promise<User | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('google_id', googleId)
        .single();

      if (error || !data) {
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error finding user by Google ID:', error);
      return null;
    }
  }

  /**
   * Update user profile (nickname, country, region)
   */
  async updateProfile(
    userId: string,
    updates: { nickname?: string; country?: string; region?: string }
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', userId);

      if (error) {
        console.error('Failed to update profile:', error);
        return false;
      }

      if (this.cachedUser && this.cachedUser.id === userId) {
        this.cachedUser = { ...this.cachedUser, ...updates };
      }

      return true;
    } catch (error) {
      console.error('Error updating profile:', error);
      return false;
    }
  }

  /**
   * Get cached user (for quick access without network)
   */
  getCachedUser(): User | null {
    return this.cachedUser;
  }

  /**
   * Clear cached user
   */
  clearCache(): void {
    this.cachedUser = null;
  }
}

export const userService = new UserService();
