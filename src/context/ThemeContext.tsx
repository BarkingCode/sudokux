import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Appearance } from 'react-native';
import { loadData, saveData, STORAGE_KEYS } from '../utils/storage';

export type ThemeMode = 'light' | 'dark' | 'system';

export interface ThemeColors {
  background: string;
  text: string;
  primary: string;
  secondary: string;
  highlight: string;
  highlightStrong: string;
  mistake: string;
  success: string;
  surface: string;
  shadow: string;
  muted: string;
  accent: string;
}

export const BRUTALIST_LIGHT: ThemeColors = {
  background: '#FAFAFA',
  text: '#0A0A0A',
  primary: '#0A0A0A',
  secondary: '#1A1A1A',
  highlight: '#F0F0F0',
  highlightStrong: '#E0E0E0',
  mistake: '#E53935',
  success: '#43A047',
  surface: '#FFFFFF',
  shadow: 'rgba(0,0,0,0.25)',
  muted: '#757575',
  accent: '#1565C0', // Blue for user-placed numbers
};

export const BRUTALIST_DARK: ThemeColors = {
  background: '#0A0A0A',
  text: '#FAFAFA',
  primary: '#FAFAFA',
  secondary: '#E0E0E0',
  highlight: '#1A1A1A',
  highlightStrong: '#2A2A2A',
  mistake: '#EF5350',
  success: '#66BB6A',
  surface: '#141414',
  shadow: 'rgba(255,255,255,0.1)',
  muted: '#9E9E9E',
  accent: '#64B5F6', // Light blue for user-placed numbers
};

interface ThemeContextType {
  mode: ThemeMode;
  colors: ThemeColors;
  setMode: (mode: ThemeMode) => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const initialScheme = Appearance.getColorScheme();
  console.log('[Theme] Initial Appearance.getColorScheme():', initialScheme);

  const [mode, setModeState] = useState<ThemeMode>('system');
  const [systemScheme, setSystemScheme] = useState<'light' | 'dark'>(
    () => initialScheme || 'light'
  );

  useEffect(() => {
    loadData<ThemeMode>(STORAGE_KEYS.SETTINGS).then((savedMode) => {
      console.log('[Theme] Loaded saved mode from storage:', savedMode);
      if (savedMode === 'light' || savedMode === 'dark' || savedMode === 'system') {
        setModeState(savedMode);
      }
    });
  }, []);

  // Explicitly listen for OS appearance changes
  useEffect(() => {
    console.log('[Theme] Subscribing to Appearance change listener');
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      console.log('[Theme] Appearance changed! New colorScheme:', colorScheme);
      setSystemScheme(colorScheme || 'light');
    });
    return () => subscription.remove();
  }, []);

  const isDark = mode === 'system' ? systemScheme === 'dark' : mode === 'dark';
  console.log('[Theme] Resolved → mode:', mode, '| systemScheme:', systemScheme, '| isDark:', isDark);

  const setMode = useCallback((newMode: ThemeMode) => {
    console.log('[Theme] setMode called with:', newMode);
    setModeState(newMode);
    saveData(STORAGE_KEYS.SETTINGS, newMode);
  }, []);

  const colors = isDark ? BRUTALIST_DARK : BRUTALIST_LIGHT;

  return (
    <ThemeContext.Provider value={{ mode, colors, setMode, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
