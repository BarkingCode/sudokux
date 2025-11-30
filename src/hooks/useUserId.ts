/**
 * Hook for loading and accessing the current user's ID from secure storage.
 * Handles parsing of the stored identity JSON structure.
 */

import { useState, useEffect } from 'react';
import { loadSecureData, STORAGE_KEYS } from '../utils/storage';

interface UseUserIdOptions {
  /** Use internal_id (id) instead of supabaseUserId. Default: false */
  useInternalId?: boolean;
}

interface UseUserIdReturn {
  userId: string | null;
  isLoading: boolean;
}

/**
 * Load user ID from secure storage.
 * @param options.useInternalId - If true, returns internal_id for services that look up by internal_id
 */
export const useUserId = (options: UseUserIdOptions = {}): UseUserIdReturn => {
  const { useInternalId = false } = options;
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUserId = async () => {
      try {
        const storedData = await loadSecureData(STORAGE_KEYS.USER_ID);

        if (storedData) {
          const identity = JSON.parse(storedData);
          if (useInternalId) {
            // Use internal_id for chapterService lookups
            setUserId(identity?.id || null);
          } else {
            // Use Supabase user ID for most services
            setUserId(identity?.supabaseUserId || identity?.id || null);
          }
        } else {
          setUserId(null);
        }
      } catch {
        setUserId(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserId();
  }, [useInternalId]);

  return { userId, isLoading };
};
