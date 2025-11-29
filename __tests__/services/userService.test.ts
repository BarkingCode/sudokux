/**
 * Tests for src/services/userService.ts
 * User management, Game Center linking, and profile updates.
 */

import { userService, LocalUserIdentity } from '../../src/services/userService';

// Mock Supabase
const mockSingle = jest.fn();
const mockSelect = jest.fn(() => ({
  eq: jest.fn().mockReturnThis(),
  single: mockSingle,
}));
const mockInsert = jest.fn(() => ({
  select: jest.fn(() => ({
    single: jest.fn(() => Promise.resolve({ data: null, error: null })),
  })),
}));
const mockUpdate = jest.fn(() => ({
  eq: jest.fn(() => Promise.resolve({ error: null })),
}));

jest.mock('../../src/lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: mockSelect,
      insert: mockInsert,
      update: mockUpdate,
    })),
  },
}));

describe('userService', () => {
  const mockLocalIdentity: LocalUserIdentity = {
    id: 'local-uuid-123',
    nickname: 'Test-Player-999',
    createdAt: '2024-01-01T00:00:00.000Z',
    country: 'US',
    region: 'California',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockSingle.mockReset();
    userService.clearCache();
  });

  // ============ syncUser ============

  describe('syncUser', () => {
    it('should return existing user if found', async () => {
      const existingUser = {
        id: 'supabase-user-id',
        internal_id: mockLocalIdentity.id,
        nickname: mockLocalIdentity.nickname,
        country: 'US',
      };
      mockSingle.mockResolvedValueOnce({ data: existingUser, error: null });

      const result = await userService.syncUser(mockLocalIdentity);

      expect(result).not.toBeNull();
      expect(result?.internal_id).toBe(mockLocalIdentity.id);
    });

    it('should create new user if not found', async () => {
      // First call - user not found
      mockSingle.mockResolvedValueOnce({ data: null, error: { code: 'PGRST116' } });

      // Insert returns new user
      const newUser = {
        id: 'new-supabase-id',
        internal_id: mockLocalIdentity.id,
        nickname: mockLocalIdentity.nickname,
      };
      mockInsert.mockReturnValueOnce({
        select: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: newUser, error: null })),
        })),
      });

      const result = await userService.syncUser(mockLocalIdentity);

      expect(result).not.toBeNull();
      expect(result?.id).toBe('new-supabase-id');
    });

    it('should cache user after sync', async () => {
      const existingUser = {
        id: 'supabase-user-id',
        internal_id: mockLocalIdentity.id,
        nickname: mockLocalIdentity.nickname,
      };
      mockSingle.mockResolvedValueOnce({ data: existingUser, error: null });

      await userService.syncUser(mockLocalIdentity);

      expect(userService.getCachedUser()).not.toBeNull();
      expect(userService.getCachedUser()?.id).toBe('supabase-user-id');
    });

    it('should return null on create error', async () => {
      mockSingle.mockResolvedValueOnce({ data: null, error: { code: 'PGRST116' } });
      mockInsert.mockReturnValueOnce({
        select: jest.fn(() => ({
          single: jest.fn(() =>
            Promise.resolve({ data: null, error: { message: 'Insert failed' } })
          ),
        })),
      });

      const result = await userService.syncUser(mockLocalIdentity);

      expect(result).toBeNull();
    });

    it('should return null on exception', async () => {
      mockSingle.mockRejectedValueOnce(new Error('Network error'));

      const result = await userService.syncUser(mockLocalIdentity);

      expect(result).toBeNull();
    });
  });

  // ============ linkGameCenter ============

  describe('linkGameCenter', () => {
    it('should link Game Center ID successfully', async () => {
      const result = await userService.linkGameCenter('user-id', 'game-center-id');

      expect(result).toBe(true);
      expect(mockUpdate).toHaveBeenCalled();
    });

    it('should update cached user with Game Center ID', async () => {
      // First sync a user
      const existingUser = {
        id: 'user-id',
        internal_id: 'local-id',
        nickname: 'Player',
        game_center_id: null,
      };
      mockSingle.mockResolvedValueOnce({ data: existingUser, error: null });
      await userService.syncUser({ id: 'local-id', nickname: 'Player', createdAt: '' });

      // Then link Game Center
      await userService.linkGameCenter('user-id', 'gc-123');

      expect(userService.getCachedUser()?.game_center_id).toBe('gc-123');
    });

    it('should return false on error', async () => {
      mockUpdate.mockReturnValueOnce({
        eq: jest.fn(() => Promise.resolve({ error: { message: 'Update failed' } })),
      });

      const result = await userService.linkGameCenter('user-id', 'game-center-id');

      expect(result).toBe(false);
    });

    it('should return false on exception', async () => {
      mockUpdate.mockReturnValueOnce({
        eq: jest.fn(() => Promise.reject(new Error('Network error'))),
      });

      const result = await userService.linkGameCenter('user-id', 'game-center-id');

      expect(result).toBe(false);
    });
  });

  // ============ findByGameCenterId ============

  describe('findByGameCenterId', () => {
    it('should return user when found', async () => {
      const existingUser = {
        id: 'user-id',
        game_center_id: 'gc-123',
        nickname: 'Player',
      };
      mockSingle.mockResolvedValueOnce({ data: existingUser, error: null });

      const result = await userService.findByGameCenterId('gc-123');

      expect(result).not.toBeNull();
      expect(result?.game_center_id).toBe('gc-123');
    });

    it('should return null when not found', async () => {
      mockSingle.mockResolvedValueOnce({ data: null, error: { code: 'PGRST116' } });

      const result = await userService.findByGameCenterId('gc-unknown');

      expect(result).toBeNull();
    });

    it('should return null on error', async () => {
      mockSingle.mockRejectedValueOnce(new Error('Network error'));

      const result = await userService.findByGameCenterId('gc-123');

      expect(result).toBeNull();
    });
  });

  // ============ updateProfile ============

  describe('updateProfile', () => {
    it('should update nickname', async () => {
      const result = await userService.updateProfile('user-id', {
        nickname: 'New-Nickname',
      });

      expect(result).toBe(true);
      expect(mockUpdate).toHaveBeenCalled();
    });

    it('should update country', async () => {
      const result = await userService.updateProfile('user-id', {
        country: 'GB',
      });

      expect(result).toBe(true);
    });

    it('should update region', async () => {
      const result = await userService.updateProfile('user-id', {
        region: 'London',
      });

      expect(result).toBe(true);
    });

    it('should update multiple fields', async () => {
      const result = await userService.updateProfile('user-id', {
        nickname: 'New-Name',
        country: 'DE',
        region: 'Berlin',
      });

      expect(result).toBe(true);
    });

    it('should update cached user after profile update', async () => {
      // First sync a user
      const existingUser = {
        id: 'user-id',
        internal_id: 'local-id',
        nickname: 'Old-Name',
      };
      mockSingle.mockResolvedValueOnce({ data: existingUser, error: null });
      await userService.syncUser({ id: 'local-id', nickname: 'Old-Name', createdAt: '' });

      // Then update profile
      await userService.updateProfile('user-id', { nickname: 'New-Name' });

      expect(userService.getCachedUser()?.nickname).toBe('New-Name');
    });

    it('should return false on error', async () => {
      mockUpdate.mockReturnValueOnce({
        eq: jest.fn(() => Promise.resolve({ error: { message: 'Update failed' } })),
      });

      const result = await userService.updateProfile('user-id', { nickname: 'Test' });

      expect(result).toBe(false);
    });

    it('should return false on exception', async () => {
      mockUpdate.mockReturnValueOnce({
        eq: jest.fn(() => Promise.reject(new Error('Network error'))),
      });

      const result = await userService.updateProfile('user-id', { nickname: 'Test' });

      expect(result).toBe(false);
    });
  });

  // ============ getCachedUser ============

  describe('getCachedUser', () => {
    it('should return null when no user cached', () => {
      expect(userService.getCachedUser()).toBeNull();
    });

    it('should return cached user after sync', async () => {
      const existingUser = {
        id: 'user-id',
        internal_id: 'local-id',
        nickname: 'Player',
      };
      mockSingle.mockResolvedValueOnce({ data: existingUser, error: null });

      await userService.syncUser({ id: 'local-id', nickname: 'Player', createdAt: '' });

      expect(userService.getCachedUser()).not.toBeNull();
    });
  });

  // ============ clearCache ============

  describe('clearCache', () => {
    it('should clear cached user', async () => {
      const existingUser = {
        id: 'user-id',
        internal_id: 'local-id',
        nickname: 'Player',
      };
      mockSingle.mockResolvedValueOnce({ data: existingUser, error: null });

      await userService.syncUser({ id: 'local-id', nickname: 'Player', createdAt: '' });
      expect(userService.getCachedUser()).not.toBeNull();

      userService.clearCache();

      expect(userService.getCachedUser()).toBeNull();
    });
  });
});
