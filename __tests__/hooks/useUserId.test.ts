/**
 * Tests for src/hooks/useUserId.ts
 * User ID loading from secure storage.
 */

import { renderHook, waitFor } from '@testing-library/react-native';
import { useUserId } from '../../src/hooks/useUserId';
import { loadSecureData } from '../../src/utils/storage';

jest.mock('../../src/utils/storage');

const mockLoadSecureData = loadSecureData as jest.MockedFunction<typeof loadSecureData>;

describe('useUserId', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLoadSecureData.mockResolvedValue(null);
  });

  // ============ Initial State ============

  it('should start with loading true and null userId', () => {
    const { result } = renderHook(() => useUserId());
    expect(result.current.isLoading).toBe(true);
    expect(result.current.userId).toBeNull();
  });

  // ============ Supabase User ID (default) ============

  it('should return supabaseUserId by default', async () => {
    mockLoadSecureData.mockResolvedValue(
      JSON.stringify({ id: 'internal-123', supabaseUserId: 'supa-456' })
    );

    const { result } = renderHook(() => useUserId());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.userId).toBe('supa-456');
    });
  });

  it('should fallback to id when no supabaseUserId', async () => {
    mockLoadSecureData.mockResolvedValue(
      JSON.stringify({ id: 'internal-123' })
    );

    const { result } = renderHook(() => useUserId());

    await waitFor(() => {
      expect(result.current.userId).toBe('internal-123');
    });
  });

  // ============ Internal ID ============

  it('should return internal id when useInternalId is true', async () => {
    mockLoadSecureData.mockResolvedValue(
      JSON.stringify({ id: 'internal-123', supabaseUserId: 'supa-456' })
    );

    const { result } = renderHook(() => useUserId({ useInternalId: true }));

    await waitFor(() => {
      expect(result.current.userId).toBe('internal-123');
    });
  });

  // ============ No Stored Data ============

  it('should return null when no data stored', async () => {
    mockLoadSecureData.mockResolvedValue(null);

    const { result } = renderHook(() => useUserId());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.userId).toBeNull();
    });
  });

  // ============ Error Handling ============

  it('should return null on parse error', async () => {
    mockLoadSecureData.mockResolvedValue('not-json{{{');

    const { result } = renderHook(() => useUserId());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.userId).toBeNull();
    });
  });

  it('should return null when storage rejects', async () => {
    mockLoadSecureData.mockRejectedValue(new Error('storage error'));

    const { result } = renderHook(() => useUserId());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.userId).toBeNull();
    });
  });
});
