/**
 * Tests for src/utils/identity.ts
 * User identity management.
 */

import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import {
  getOrCreateUserIdentity,
  saveUserIdentity,
  updateUserProfile,
  UserIdentity,
} from '../../src/utils/identity';
import { STORAGE_KEYS } from '../../src/utils/storage';

// Mock services
jest.mock('../../src/services', () => ({
  userService: {
    syncUser: jest.fn(() => Promise.resolve(null)),
    linkGameCenter: jest.fn(() => Promise.resolve(true)),
    updateProfile: jest.fn(() => Promise.resolve(true)),
    findByGameCenterId: jest.fn(() => Promise.resolve(null)),
  },
  gameCenterService: {
    authenticate: jest.fn(() => Promise.resolve(null)),
  },
}));

describe('identity', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (Platform as any).OS = 'ios';
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);
    (SecureStore.setItemAsync as jest.Mock).mockResolvedValue(undefined);
  });

  // ============ getOrCreateUserIdentity ============

  describe('getOrCreateUserIdentity', () => {
    it('should create new identity when none exists', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);

      const identity = await getOrCreateUserIdentity();

      expect(identity).toBeDefined();
      expect(identity.id).toBeDefined();
      expect(identity.nickname).toBeDefined();
      expect(identity.createdAt).toBeDefined();
    });

    it('should generate UUID v4 format for id', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);

      const identity = await getOrCreateUserIdentity();

      // UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      expect(identity.id).toMatch(uuidRegex);
    });

    it('should generate nickname in Adjective-Noun-Number format', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);

      const identity = await getOrCreateUserIdentity();

      // Format: Adjective-Noun-Number (e.g., "Brutal-Cube-427")
      const nicknameRegex = /^[A-Z][a-z]+-[A-Z][a-z]+-\d+$/;
      expect(identity.nickname).toMatch(nicknameRegex);
    });

    it('should return existing identity when stored', async () => {
      const existingIdentity: UserIdentity = {
        id: 'existing-id-123',
        nickname: 'Existing-User-999',
        createdAt: '2024-01-01T00:00:00.000Z',
      };

      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(
        JSON.stringify(existingIdentity)
      );

      const identity = await getOrCreateUserIdentity();

      expect(identity.id).toBe('existing-id-123');
      expect(identity.nickname).toBe('Existing-User-999');
    });

    it('should save new identity to secure storage', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);

      await getOrCreateUserIdentity();

      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        STORAGE_KEYS.USER_ID,
        expect.any(String)
      );
    });

    it('should persist identity across calls', async () => {
      let savedIdentity: string | null = null;

      (SecureStore.getItemAsync as jest.Mock).mockImplementation(() =>
        Promise.resolve(savedIdentity)
      );
      (SecureStore.setItemAsync as jest.Mock).mockImplementation((_, value) => {
        savedIdentity = value;
        return Promise.resolve();
      });

      const identity1 = await getOrCreateUserIdentity();
      const identity2 = await getOrCreateUserIdentity();

      expect(identity1.id).toBe(identity2.id);
    });

    it('should handle legacy stored ID (plain string instead of JSON)', async () => {
      // If only a plain ID string was stored (legacy format)
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('plain-uuid-string');

      const identity = await getOrCreateUserIdentity();

      expect(identity.id).toBe('plain-uuid-string');
      expect(identity.nickname).toBe('Unknown-Player');
    });
  });

  // ============ saveUserIdentity ============

  describe('saveUserIdentity', () => {
    it('should save identity to secure storage', async () => {
      const identity: UserIdentity = {
        id: 'test-id',
        nickname: 'Test-User-123',
        createdAt: '2024-01-01T00:00:00.000Z',
      };

      await saveUserIdentity(identity);

      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        STORAGE_KEYS.USER_ID,
        JSON.stringify(identity)
      );
    });

    it('should include all identity fields', async () => {
      const identity: UserIdentity = {
        id: 'test-id',
        nickname: 'Test-User-123',
        createdAt: '2024-01-01T00:00:00.000Z',
        country: 'US',
        region: 'California',
        gameCenterId: 'gc-123',
        supabaseUserId: 'sb-123',
      };

      await saveUserIdentity(identity);

      const savedValue = (SecureStore.setItemAsync as jest.Mock).mock.calls[0][1];
      const parsed = JSON.parse(savedValue);

      expect(parsed.country).toBe('US');
      expect(parsed.region).toBe('California');
      expect(parsed.gameCenterId).toBe('gc-123');
      expect(parsed.supabaseUserId).toBe('sb-123');
    });
  });

  // ============ updateUserProfile ============

  describe('updateUserProfile', () => {
    const baseIdentity: UserIdentity = {
      id: 'test-id',
      nickname: 'Old-Nickname-123',
      createdAt: '2024-01-01T00:00:00.000Z',
    };

    it('should update nickname', async () => {
      const updated = await updateUserProfile(baseIdentity, {
        nickname: 'New-Nickname-456',
      });

      expect(updated.nickname).toBe('New-Nickname-456');
      expect(updated.id).toBe(baseIdentity.id);
    });

    it('should update country', async () => {
      const updated = await updateUserProfile(baseIdentity, {
        country: 'GB',
      });

      expect(updated.country).toBe('GB');
    });

    it('should update region', async () => {
      const updated = await updateUserProfile(baseIdentity, {
        region: 'London',
      });

      expect(updated.region).toBe('London');
    });

    it('should update multiple fields at once', async () => {
      const updated = await updateUserProfile(baseIdentity, {
        nickname: 'Multi-Update-789',
        country: 'DE',
        region: 'Berlin',
      });

      expect(updated.nickname).toBe('Multi-Update-789');
      expect(updated.country).toBe('DE');
      expect(updated.region).toBe('Berlin');
    });

    it('should save updated identity to storage', async () => {
      await updateUserProfile(baseIdentity, { country: 'FR' });

      expect(SecureStore.setItemAsync).toHaveBeenCalled();
    });

    it('should preserve existing fields not being updated', async () => {
      const identityWithExtras: UserIdentity = {
        ...baseIdentity,
        country: 'US',
        gameCenterId: 'gc-existing',
      };

      const updated = await updateUserProfile(identityWithExtras, {
        nickname: 'Updated-Name-000',
      });

      expect(updated.country).toBe('US');
      expect(updated.gameCenterId).toBe('gc-existing');
    });
  });
});
