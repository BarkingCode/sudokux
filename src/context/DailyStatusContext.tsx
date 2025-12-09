/**
 * DailyStatusContext
 * Manages daily challenge completion status globally for badge display.
 * Tracks whether today's challenge is completed and provides methods to update status.
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { hasCompletedToday, getTodayDateUTC } from '../services/dailyChallengeService';
import { loadSecureData, STORAGE_KEYS } from '../utils/storage';

interface DailyStatusContextType {
  hasCompletedTodayChallenge: boolean;
  isLoading: boolean;
  markAsCompleted: () => void;
  refreshStatus: () => Promise<void>;
}

const DailyStatusContext = createContext<DailyStatusContextType | undefined>(undefined);

export const DailyStatusProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [hasCompletedTodayChallenge, setHasCompletedTodayChallenge] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [lastCheckedDate, setLastCheckedDate] = useState<string | null>(null);

  const checkCompletionStatus = useCallback(async () => {
    const today = getTodayDateUTC();

    // If we already checked today and it was completed, keep it
    if (lastCheckedDate === today && hasCompletedTodayChallenge) {
      setIsLoading(false);
      return;
    }

    // Reset if new day
    if (lastCheckedDate !== today) {
      setHasCompletedTodayChallenge(false);
    }

    try {
      const storedData = await loadSecureData(STORAGE_KEYS.USER_ID);
      if (storedData) {
        const identity = JSON.parse(storedData);
        const userId = identity?.supabaseUserId || identity?.id;
        if (userId) {
          const completed = await hasCompletedToday(userId);
          setHasCompletedTodayChallenge(completed);
        }
      }
      setLastCheckedDate(today);
    } catch (error) {
      console.error('Error checking daily completion:', error);
    } finally {
      setIsLoading(false);
    }
  }, [lastCheckedDate, hasCompletedTodayChallenge]);

  // Check on mount
  useEffect(() => {
    checkCompletionStatus();
  }, []);

  // Check when app comes to foreground (handles midnight transition)
  useEffect(() => {
    const handleAppStateChange = (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        checkCompletionStatus();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [checkCompletionStatus]);

  const markAsCompleted = useCallback(() => {
    setHasCompletedTodayChallenge(true);
    setLastCheckedDate(getTodayDateUTC());
  }, []);

  const refreshStatus = useCallback(async () => {
    setIsLoading(true);
    await checkCompletionStatus();
  }, [checkCompletionStatus]);

  return (
    <DailyStatusContext.Provider
      value={{
        hasCompletedTodayChallenge,
        isLoading,
        markAsCompleted,
        refreshStatus,
      }}
    >
      {children}
    </DailyStatusContext.Provider>
  );
};

export const useDailyStatus = (): DailyStatusContextType => {
  const context = useContext(DailyStatusContext);
  if (!context) {
    throw new Error('useDailyStatus must be used within a DailyStatusProvider');
  }
  return context;
};
