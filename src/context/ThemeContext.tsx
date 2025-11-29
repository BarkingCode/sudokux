import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
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
  const systemScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('system');
  const [isDark, setIsDark] = useState(systemScheme === 'dark');

  useEffect(() => {
    loadData<ThemeMode>(STORAGE_KEYS.SETTINGS).then((savedMode) => {
      if (savedMode) {
        setModeState(savedMode);
      }
    });
  }, []);

  useEffect(() => {
    if (mode === 'system') {
      setIsDark(systemScheme === 'dark');
    } else {
      setIsDark(mode === 'dark');
    }
  }, [mode, systemScheme]);

  const setMode = (newMode: ThemeMode) => {
    setModeState(newMode);
    saveData(STORAGE_KEYS.SETTINGS, newMode);
  };

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
