/**
 * NetworkContext - Provides network connectivity state throughout the app
 * Uses expo-network to monitor internet connectivity and provides:
 * - isOnline: whether device has network connection
 * - isInternetReachable: whether internet is actually reachable (more reliable)
 */
import React, { createContext, useContext, useEffect, useState } from 'react';
import * as Network from 'expo-network';

interface NetworkContextType {
  isOnline: boolean;
  isInternetReachable: boolean;
  checkConnection: () => Promise<void>;
}

const NetworkContext = createContext<NetworkContextType | undefined>(undefined);

export const NetworkProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOnline, setIsOnline] = useState(true);
  const [isInternetReachable, setIsInternetReachable] = useState(true);

  const checkConnection = async () => {
    try {
      const state = await Network.getNetworkStateAsync();
      setIsOnline(state.isConnected ?? false);
      setIsInternetReachable(state.isInternetReachable ?? false);
    } catch (error) {
      console.error('Error checking network state:', error);
      // Assume online if we can't check (fail-open for gameplay)
      setIsOnline(true);
      setIsInternetReachable(true);
    }
  };

  useEffect(() => {
    // Check initial connection state
    checkConnection();

    // Poll for network changes every 5 seconds
    // expo-network doesn't have event listeners, so we poll
    const interval = setInterval(checkConnection, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <NetworkContext.Provider value={{ isOnline, isInternetReachable, checkConnection }}>
      {children}
    </NetworkContext.Provider>
  );
};

export const useNetwork = () => {
  const context = useContext(NetworkContext);
  if (!context) {
    throw new Error('useNetwork must be used within a NetworkProvider');
  }
  return context;
};
